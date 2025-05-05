import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateAdventure, generateCharacter, generateGameNarration, generateNPC, generateDialogue } from "./openai";
import { z } from "zod";
import { insertCharacterSchema, insertCampaignSchema, insertAdventureSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
