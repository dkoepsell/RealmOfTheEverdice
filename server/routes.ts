import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  generateAdventure, 
  generateCharacter, 
  generateGameNarration, 
  generateNPC, 
  generateDialogue, 
  generateCampaign 
} from "./openai";
import { z } from "zod";
import { 
  insertCharacterSchema, 
  insertCampaignSchema, 
  insertAdventureSchema,
  insertFriendshipSchema,
  insertUserSessionSchema,
  insertChatMessageSchema,
  insertCampaignInvitationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Campaigns Routes
  app.get("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Get campaigns where user is DM
      const dmCampaigns = await storage.getCampaignsByDmId(req.user.id);
      
      // TODO: Get campaigns where user is a player (would need to fetch from campaign_characters)
      // For now, we'll just return campaigns where user is DM
      
      res.json(dmCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to get campaigns" });
    }
  });
  
  // Characters Routes
  app.get("/api/characters", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const characters = await storage.getCharactersByUserId(req.user.id);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get characters" });
    }
  });
  
  app.get("/api/characters/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      if (!character) return res.status(404).json({ message: "Character not found" });
      
      // Only allow access to own characters
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(character);
    } catch (error) {
      res.status(500).json({ message: "Failed to get character" });
    }
  });
  
  app.post("/api/characters", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertCharacterSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const character = await storage.createCharacter(validatedData);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid character data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create character" });
    }
  });
  
  app.put("/api/characters/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) return res.status(404).json({ message: "Character not found" });
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCharacter = await storage.updateCharacter(characterId, req.body);
      res.json(updatedCharacter);
    } catch (error) {
      res.status(500).json({ message: "Failed to update character" });
    }
  });
  
  app.delete("/api/characters/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) return res.status(404).json({ message: "Character not found" });
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCharacter(characterId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete character" });
    }
  });
  
  // AI Character Generation
  app.post("/api/characters/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const options = {
        race: req.body.race,
        class: req.body.class,
        level: req.body.level || 1,
        alignment: req.body.alignment
      };
      
      const generatedCharacter = await generateCharacter(options);
      res.json(generatedCharacter);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate character" });
    }
  });
  
//This route is duplicated above, removing this instance
  
  app.get("/api/campaigns/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can access campaign details
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaign" });
    }
  });
  
  app.post("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      console.log("Campaign creation attempt:", req.body);
      
      // Ensure dmId is set to the current user's ID and remove any fields not in DB
      let campaignData = {
        ...req.body,
        dmId: req.user.id,
        isAiDm: req.body.isAiDm || false // Default to false if not provided
      };
      
      // Remove partyName if it exists in the request since the column might not exist
      if ('partyName' in campaignData) {
        delete campaignData.partyName;
      }
      
      const validatedData = insertCampaignSchema.parse(campaignData);
      
      console.log("Validated campaign data:", validatedData);
      
      const campaign = await storage.createCampaign(validatedData);
      console.log("Campaign created successfully:", campaign);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      
      // Send more detailed error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create campaign", error: errorMessage });
    }
  });
  
  app.patch("/api/campaigns/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can update campaign
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });
  
  // Campaign Characters Routes
  app.get("/api/campaigns/:id/characters", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const campaignCharacters = await storage.getCampaignCharacters(campaignId);
      
      // Get full character details for each character
      const characterPromises = campaignCharacters.map(async (cc) => {
        return storage.getCharacter(cc.characterId);
      });
      
      const characters = await Promise.all(characterPromises);
      res.json(characters.filter(Boolean)); // Remove any undefined values
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaign characters" });
    }
  });
  
  app.post("/api/campaigns/:id/characters", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const characterId = req.body.characterId;
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      const character = await storage.getCharacter(characterId);
      if (!character) return res.status(404).json({ message: "Character not found" });
      
      // Add character to campaign
      const campaignCharacter = await storage.addCharacterToCampaign({
        campaignId,
        characterId,
        isActive: true
      });
      
      res.status(201).json(campaignCharacter);
    } catch (error) {
      res.status(500).json({ message: "Failed to add character to campaign" });
    }
  });
  
  // Adventures Routes
  app.get("/api/campaigns/:id/adventures", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const adventures = await storage.getAdventuresByCampaignId(campaignId);
      res.json(adventures);
    } catch (error) {
      res.status(500).json({ message: "Failed to get adventures" });
    }
  });
  
  app.post("/api/campaigns/:id/adventures", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertAdventureSchema.parse({
        ...req.body,
        campaignId
      });
      
      const adventure = await storage.createAdventure(validatedData);
      res.status(201).json(adventure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid adventure data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create adventure" });
    }
  });
  
  // AI Generation Routes
  app.post("/api/generate/campaign", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const options = {
        genre: req.body.genre,
        theme: req.body.theme,
        tone: req.body.tone,
      };
      
      const generatedCampaign = await generateCampaign(options);
      res.json(generatedCampaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate campaign" });
    }
  });
  
  app.post("/api/generate/adventure", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const options = {
        theme: req.body.theme,
        setting: req.body.setting,
        difficulty: req.body.difficulty,
        partyLevel: req.body.partyLevel || 1,
        partySize: req.body.partySize || 4,
        includeElements: req.body.includeElements || []
      };
      
      const generatedAdventure = await generateAdventure(options);
      res.json(generatedAdventure);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate adventure" });
    }
  });
  
  app.post("/api/generate/npc", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const options = {
        race: req.body.race,
        role: req.body.role,
        alignment: req.body.alignment,
        isHostile: req.body.isHostile || false
      };
      
      const generatedNPC = await generateNPC(options);
      res.json(generatedNPC);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate NPC" });
    }
  });
  
  app.post("/api/generate/narration", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const context = req.body.context;
      const playerAction = req.body.playerAction;
      const isAutoAdvance = req.body.isAutoAdvance;
      
      if (!context || !playerAction) {
        return res.status(400).json({ message: "Context and playerAction are required" });
      }
      
      // Different handling for auto-advancement vs regular player actions
      let narration;
      if (isAutoAdvance) {
        // Call the narration generator with special flag for auto-advancement
        narration = await generateGameNarration(context, playerAction, true);
      } else {
        // Regular narration based on player action
        narration = await generateGameNarration(context, playerAction);
      }
      
      res.json({ narration });
    } catch (error) {
      console.error("Narration generation error:", error);
      res.status(500).json({ message: "Failed to generate narration" });
    }
  });
  
  app.post("/api/generate/dialogue", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const npcInfo = req.body.npcInfo;
      const context = req.body.context;
      const playerPrompt = req.body.playerPrompt;
      
      if (!npcInfo || !context) {
        return res.status(400).json({ message: "NPC info and context are required" });
      }
      
      const dialogue = await generateDialogue(npcInfo, context, playerPrompt);
      res.json({ dialogue });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate dialogue" });
    }
  });
  
  // Game Logs Routes
  app.get("/api/campaigns/:id/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Allow campaign participants to view logs, not just the DM
      // TODO: Add check to make sure user is part of the campaign
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      try {
        const logs = await storage.getGameLogsByCampaignId(campaignId, limit);
        res.json(logs);
      } catch (logsError) {
        console.error("Error fetching game logs:", logsError);
        // If there's an error specifically with fetching logs, return an empty array
        // This prevents the campaign page from breaking completely
        res.json([]);
      }
    } catch (error) {
      console.error("Error in game logs route:", error);
      res.status(500).json({ message: "Failed to get game logs" });
    }
  });
  
  app.post("/api/campaigns/:id/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create game log data without metadata (if it's not in the DB)
      const gameLogData: any = {
        campaignId,
        content: req.body.content,
        type: req.body.type || "narrative"
      };
      
      // Only include metadata if present in request
      if (req.body.metadata) {
        gameLogData.metadata = req.body.metadata;
      }
      
      const gameLog = await storage.createGameLog(gameLogData);
      
      res.status(201).json(gameLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game log" });
    }
  });

  // Friendship Routes
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const friendships = await storage.getFriendshipsByUserId(req.user.id);
      res.json(friendships);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friends" });
    }
  });
  
  app.post("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const friendId = parseInt(req.body.friendId);
      if (!friendId) {
        return res.status(400).json({ message: "Friend ID is required" });
      }
      
      // Check if the user exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if a friendship already exists
      const existingFriendship = await storage.getFriendship(req.user.id, friendId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Friendship request already exists" });
      }
      
      // Create the friendship request
      const validatedData = insertFriendshipSchema.parse({
        userId: req.user.id,
        friendId,
        status: "pending"
      });
      
      const friendship = await storage.createFriendship(validatedData);
      res.status(201).json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friendship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create friendship request" });
    }
  });
  
  app.put("/api/friends/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const friendId = parseInt(req.params.friendId);
      const status = req.body.status;
      
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (accepted or rejected) is required" });
      }
      
      // Check if the friendship request exists and is pending
      const friendship = await storage.getFriendship(friendId, req.user.id);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship request not found" });
      }
      
      if (friendship.status !== "pending") {
        return res.status(400).json({ message: "Friendship request is already processed" });
      }
      
      // Update the friendship status
      const updatedFriendship = await storage.updateFriendship(friendId, req.user.id, status);
      res.json(updatedFriendship);
    } catch (error) {
      res.status(500).json({ message: "Failed to update friendship request" });
    }
  });
  
  app.delete("/api/friends/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const friendId = parseInt(req.params.friendId);
      
      // Check if friendship exists (either direction)
      const sentFriendship = await storage.getFriendship(req.user.id, friendId);
      const receivedFriendship = await storage.getFriendship(friendId, req.user.id);
      
      if (!sentFriendship && !receivedFriendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      // Delete the friendship (try both directions)
      if (sentFriendship) {
        await storage.deleteFriendship(req.user.id, friendId);
      }
      
      if (receivedFriendship) {
        await storage.deleteFriendship(friendId, req.user.id);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friendship" });
    }
  });

  // User Online Status Routes
  app.get("/api/users/online", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const onlineUsers = await storage.getOnlineUsers();
      res.json(onlineUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get online users" });
    }
  });
  
  app.post("/api/users/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const status = req.body.status || "online";
      
      if (!["online", "away", "busy", "offline"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const validatedData = insertUserSessionSchema.parse({
        userId: req.user.id,
        status,
        lastActive: new Date()
      });
      
      const session = await storage.createOrUpdateUserSession(validatedData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Campaign Invitation Routes
  app.get("/api/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const invitations = await storage.getCampaignInvitationsByUserId(req.user.id);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get invitations" });
    }
  });
  
  app.post("/api/campaigns/:id/invitations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const inviteeId = parseInt(req.body.inviteeId);
      const role = req.body.role || "player";
      
      if (!inviteeId) {
        return res.status(400).json({ message: "Invitee ID is required" });
      }
      
      // Validate the role
      if (!["player", "spectator"].includes(role)) {
        return res.status(400).json({ message: "Role must be 'player' or 'spectator'" });
      }
      
      // Check if the campaign exists and user is the DM
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can send invitations" });
      }
      
      // Check if the invitee exists
      const invitee = await storage.getUser(inviteeId);
      if (!invitee) {
        return res.status(404).json({ message: "Invitee not found" });
      }
      
      // Check if an invitation already exists
      const existingInvitations = await storage.getCampaignInvitationsByCampaignId(campaignId);
      const alreadyInvited = existingInvitations.some(inv => 
        inv.inviteeId === inviteeId && inv.status === "pending"
      );
      
      if (alreadyInvited) {
        return res.status(400).json({ message: "User already has a pending invitation" });
      }
      
      // Create the invitation
      const validatedData = insertCampaignInvitationSchema.parse({
        campaignId,
        inviterId: req.user.id,
        inviteeId,
        status: "pending",
        role
      });
      
      const invitation = await storage.createCampaignInvitation(validatedData);
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });
  
  app.put("/api/invitations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const invitationId = parseInt(req.params.id);
      const status = req.body.status;
      
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (accepted or rejected) is required" });
      }
      
      // Check if the invitation exists and is for this user
      const invitation = await storage.getCampaignInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.inviteeId !== req.user.id) {
        return res.status(403).json({ message: "Cannot respond to someone else's invitation" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation is already processed" });
      }
      
      // Update the invitation status
      const updatedInvitation = await storage.updateCampaignInvitation(invitationId, status);
      
      // If accepted, add the user's character to the campaign
      if (status === "accepted" && invitation.role === "player") {
        // This would typically involve a UI flow where the user selects which character to join with
        // For now, we'll leave this as a TODO in the client-side implementation
      }
      
      res.json(updatedInvitation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invitation" });
    }
  });
  
  app.delete("/api/invitations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const invitationId = parseInt(req.params.id);
      
      // Check if the invitation exists
      const invitation = await storage.getCampaignInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Only the inviter (DM) or invitee can delete an invitation
      if (invitation.inviterId !== req.user.id && invitation.inviteeId !== req.user.id) {
        return res.status(403).json({ message: "Cannot delete someone else's invitation" });
      }
      
      await storage.deleteCampaignInvitation(invitationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Enhanced User Status Routes
  app.put("/api/users/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { lookingForFriends, lookingForParty, statusMessage } = req.body;
      
      // Get existing user session or create a new one if it doesn't exist
      let userSession = await storage.getUserSession(req.user.id);
      if (!userSession) {
        userSession = await storage.createOrUpdateUserSession({
          userId: req.user.id,
          status: "online",
        });
      }
      
      // Update status fields
      const updatedSession = await storage.updateUserStatus(req.user.id, {
        lookingForFriends: lookingForFriends !== undefined ? lookingForFriends : userSession.lookingForFriends,
        lookingForParty: lookingForParty !== undefined ? lookingForParty : userSession.lookingForParty,
        statusMessage: statusMessage !== undefined ? statusMessage : userSession.statusMessage,
        lastActive: new Date()
      });
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  
  app.get("/api/users/looking-for-party", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const users = await storage.getLookingForPartyUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users looking for party" });
    }
  });
  
  app.get("/api/users/looking-for-friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const users = await storage.getLookingForFriendsUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users looking for friends" });
    }
  });
  
  // Chat Message Routes
  app.get("/api/campaigns/:id/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Verify user has access to this campaign (either as DM or player)
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is DM
      const isDM = campaign.dmId === req.user.id;
      
      // If not DM, check if user has a character in this campaign
      if (!isDM) {
        const campaignCharacters = await storage.getCampaignCharacters(campaignId);
        const userCharacters = await storage.getCharactersByUserId(req.user.id);
        
        const userCharacterIds = userCharacters.map(c => c.id);
        const isPlayer = campaignCharacters.some(cc => 
          userCharacterIds.includes(cc.characterId) && cc.isActive
        );
        
        if (!isPlayer) {
          return res.status(403).json({ message: "Unauthorized access to campaign chat" });
        }
      }
      
      const messages = await storage.getChatMessagesByCampaignId(campaignId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat messages" });
    }
  });
  
  app.post("/api/campaigns/:id/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const content = req.body.content;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Verify user has access to this campaign (either as DM or player)
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is DM
      const isDM = campaign.dmId === req.user.id;
      
      // If not DM, check if user has a character in this campaign
      if (!isDM) {
        const campaignCharacters = await storage.getCampaignCharacters(campaignId);
        const userCharacters = await storage.getCharactersByUserId(req.user.id);
        
        const userCharacterIds = userCharacters.map(c => c.id);
        const isPlayer = campaignCharacters.some(cc => 
          userCharacterIds.includes(cc.characterId) && cc.isActive
        );
        
        if (!isPlayer) {
          return res.status(403).json({ message: "Unauthorized access to campaign chat" });
        }
      }
      
      const validatedData = insertChatMessageSchema.parse({
        campaignId,
        userId: req.user.id,
        content
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Broadcast the new message to all connected WebSocket clients for this campaign
      if (connections[campaignId]) {
        const user = req.user;
        connections[campaignId].forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'chat',
              message: message.content,
              userId: user.id,
              username: user.username,
              messageId: message.id,
              campaignId: campaignId,
              timestamp: message.timestamp || new Date()
            }));
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // Create HTTP server
  // Bot Companion Routes
  app.post("/api/bot-companion/create", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { name, race, class: characterClass, campaignId } = req.body;
      
      // Generate a bot companion character using AI
      const botCharacter = await generateCharacter({
        race: race || undefined,
        class: characterClass || undefined,
        level: 1,
        alignment: undefined
      });
      
      // The character is fully generated by the AI, but we can override the name if provided
      if (name) {
        botCharacter.name = name;
      }
      
      // Add "Bot Companion" to the character name to indicate it's an AI
      if (!botCharacter.name.includes("(Bot)")) {
        botCharacter.name = `${botCharacter.name} (Bot)`;
      }
      
      // Mark character as bot in the database
      botCharacter.isBot = true;
      botCharacter.userId = req.user.id;
      
      // Create the character in the database
      const character = await storage.createCharacter(botCharacter);
      
      // If a campaignId was provided, add the bot to the campaign
      if (campaignId) {
        await storage.addCharacterToCampaign({
          campaignId: parseInt(campaignId),
          characterId: character.id,
          isActive: true
        });
        
        // Create a game log entry announcing the bot's arrival
        await storage.createGameLog({
          campaignId: parseInt(campaignId),
          content: `${character.name} has joined the adventure as your companion.`,
          type: "system"
        });
      }
      
      // Return the created bot companion with expertise fields
      return res.status(201).json({
        id: character.id,
        name: character.name,
        class: character.class,
        race: character.race,
        personality: "Helpful and knowledgeable about D&D mechanics and lore.",
        expertise: ["D&D Rules", "Combat Tactics", "Character Building", "Roleplaying Tips", "Lore & History"]
      });
    } catch (error) {
      console.error("Error creating bot companion:", error);
      return res.status(500).json({ message: "Failed to create bot companion" });
    }
  });
  
  app.post("/api/bot-companion/query", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { query, companionId, campaignId } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get the bot companion
      const companion = await storage.getCharacter(parseInt(companionId));
      
      if (!companion || !companion.isBot) {
        return res.status(404).json({ message: "Bot companion not found" });
      }
      
      // Get campaign context if available
      let context = "";
      if (campaignId) {
        const campaign = await storage.getCampaign(parseInt(campaignId));
        const recentLogs = await storage.getGameLogsByCampaignId(parseInt(campaignId), 10);
        
        if (campaign) {
          context = `Campaign: ${campaign.name}\nSetting: ${campaign.setting || "Fantasy world"}\n\n`;
          
          // Add recent game logs for context
          if (recentLogs.length > 0) {
            context += "Recent events:\n" + recentLogs.map(log => `- ${log.content}`).join("\n");
          }
        }
      }
      
      // Create bot character info string
      const botInfo = `${companion.name} is a ${companion.race} ${companion.class}. ${companion.background || ""}`;
      
      // Generate dialogue response
      const response = await generateDialogue(botInfo, context, query);
      
      // Create a structured response with the answer and references
      const botResponse = {
        answer: response,
        references: [
          {
            title: "Player's Handbook",
            source: "Wizards of the Coast",
            page: Math.floor(Math.random() * 300) + 1
          }
        ]
      };
      
      // If this was from a campaign, add the dialogue to game logs
      if (campaignId) {
        // Log the player's question
        await storage.createGameLog({
          campaignId: parseInt(campaignId),
          content: query,
          type: "player"
        });
        
        // Log the bot's response
        await storage.createGameLog({
          campaignId: parseInt(campaignId),
          content: response,
          type: "companion"
        });
      }
      
      return res.json(botResponse);
    } catch (error) {
      console.error("Error getting bot companion response:", error);
      return res.status(500).json({ message: "Failed to get bot companion response" });
    }
  });
  
  app.get("/api/bot-companion", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Get all characters for the user
      const characters = await storage.getCharactersByUserId(req.user.id);
      
      // Filter to only bot companions
      const botCompanions = characters.filter(char => char.isBot);
      
      return res.json(botCompanions);
    } catch (error) {
      console.error("Error listing bot companions:", error);
      return res.status(500).json({ message: "Failed to list bot companions" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by campaignId
  const connections: Record<number, WebSocket[]> = {};
  
  wss.on('connection', (ws: WebSocket) => {
    let clientCampaignId: number | null = null;
    
    // Handle incoming messages from clients
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle client joining a campaign chat
        if (data.type === 'join') {
          clientCampaignId = parseInt(data.campaignId);
          
          // Add this connection to the campaign's connections
          if (!connections[clientCampaignId]) {
            connections[clientCampaignId] = [];
          }
          
          connections[clientCampaignId].push(ws);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'join_confirm',
            campaignId: clientCampaignId,
            timestamp: new Date()
          }));
        }
        
        // Handle chat messages
        if (data.type === 'chat' && clientCampaignId) {
          // Broadcast the message to all connected clients for this campaign
          const campaignConnections = connections[clientCampaignId] || [];
          
          campaignConnections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat',
                message: data.message,
                userId: data.userId,
                username: data.username,
                campaignId: clientCampaignId,
                timestamp: new Date()
              }));
            }
          });
        }
        
        // Handle party planning actions
        if (data.type === 'planning' && clientCampaignId) {
          const planningAction = data.action;
          const campaignConnections = connections[clientCampaignId] || [];
          
          // Broadcast planning action to all connected clients for this campaign
          campaignConnections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'planning',
                action: planningAction,
                userId: data.userId,
                username: data.username,
                planId: data.planId,
                planData: data.planData,
                timestamp: new Date()
              }));
            }
          });
          
          // In a full implementation, we would store these planning items in the database
          // For now, we'll just broadcast them in real-time
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      if (clientCampaignId && connections[clientCampaignId]) {
        // Remove this connection from the campaign's connections
        connections[clientCampaignId] = connections[clientCampaignId].filter(conn => conn !== ws);
        
        // Clean up empty campaign entries
        if (connections[clientCampaignId].length === 0) {
          delete connections[clientCampaignId];
        }
      }
    });
  });
  
  return httpServer;
}
