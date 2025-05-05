import type { Express } from "express";
import { createServer, type Server } from "http";
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
  insertCampaignInvitationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
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
  
  // Campaigns Routes
  app.get("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaigns = await storage.getCampaignsByDmId(req.user.id);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaigns" });
    }
  });
  
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
      const validatedData = insertCampaignSchema.parse({
        ...req.body,
        dmId: req.user.id
      });
      
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
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
      
      if (!context || !playerAction) {
        return res.status(400).json({ message: "Context and playerAction are required" });
      }
      
      const narration = await generateGameNarration(context, playerAction);
      res.json({ narration });
    } catch (error) {
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
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getGameLogsByCampaignId(campaignId, limit);
      res.json(logs);
    } catch (error) {
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
      
      const gameLog = await storage.createGameLog({
        campaignId,
        content: req.body.content,
        type: req.body.type || "narrative"
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
