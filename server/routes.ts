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
  generateCampaign,
  generateRandomItem,
  generateWorldMap
} from "./openai";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { 
  insertCharacterSchema, 
  insertCampaignSchema, 
  insertAdventureSchema,
  insertFriendshipSchema,
  insertUserSessionSchema,
  insertChatMessageSchema,
  insertCampaignInvitationSchema,
  insertPartyPlanSchema,
  insertPartyPlanItemSchema,
  insertPartyPlanCommentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Admin routes for Everdice world management
  app.post("/api/admin/initialize-everdice", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is superuser or admin
    if (req.user.role !== "superuser" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden. Only superusers or admins can initialize Everdice." });
    }
    
    try {
      // Check if Everdice world already exists
      const existingWorld = await storage.getEverdiceWorld();
      if (existingWorld) {
        return res.status(400).json({ message: "Everdice world already initialized" });
      }
      
      // Generate the Everdice world
      // Use a placeholder campaign for initialization
      const placeholderCampaign = {
        name: "Everdice Global",
        setting: "fantasy realm",
        description: "The global superworld where all campaigns exist. This vast realm contains diverse continents, oceans, and magical phenomena that bind all adventures together into a unified, living world."
      };
      
      const worldMapData = await generateWorldMap(0, placeholderCampaign);
      
      // Extract the core data for Everdice
      const everdiceWorld = {
        name: "Everdice",
        description: "The mystical realm of Everdice, where all adventures take place.",
        lore: "Everdice is a realm of magic and wonder, where countless adventures unfold across its varied landscapes. From the mist-shrouded peaks of the Dragonspine Mountains to the sun-dappled shores of the Sapphire Coast, every corner of this vast world holds untold stories waiting to be discovered.",
        mapUrl: worldMapData.url,
        continents: [
          {
            id: uuidv4(),
            name: worldMapData.everdiceData.continent,
            description: `The continent of ${worldMapData.everdiceData.continent}, a vast landmass with diverse regions and kingdoms.`,
            position: [0, 0],
            bounds: [[-50, -50], [50, 50]],
            regions: [
              { 
                name: worldMapData.everdiceData.regionName, 
                climate: "varied", 
                description: worldMapData.everdiceData.connectionToEverdice
              }
            ]
          }
        ],
        age: Math.floor(Math.random() * 10000) + 5000, // Age in years
        species: [
          "Humans", "Elves", "Dwarves", "Halflings", "Gnomes", 
          "Half-Elves", "Half-Orcs", "Dragonborn", "Tieflings"
        ],
        deities: [
          "Solaris, God of Light", 
          "Lunara, Goddess of Night", 
          "Terravus, God of Earth", 
          "Aquarion, God of Water", 
          "Pyria, Goddess of Fire",
          "Aereth, Goddess of Air",
          "Sylvanor, God of Nature"
        ]
      };
      
      // Save the Everdice world
      await storage.saveEverdiceWorld(everdiceWorld);
      
      res.status(201).json({ message: "Everdice world initialized successfully", world: everdiceWorld });
    } catch (error) {
      console.error("Error initializing Everdice world:", error);
      res.status(500).json({ message: "Failed to initialize Everdice world" });
    }
  });
  
  app.get("/api/admin/everdice", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const everdiceWorld = await storage.getEverdiceWorld();
      res.json(everdiceWorld || null);
    } catch (error) {
      console.error("Error getting Everdice world:", error);
      res.status(500).json({ message: "Failed to get Everdice world" });
    }
  });
  
  // Regenerate world map for superadmins
  app.post("/api/admin/regenerate-world-map", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    if (req.user!.role !== "superuser") return res.status(403).json({ message: "Not authorized" });
    
    try {
      // Get existing world data
      const everdiceWorld = await storage.getEverdiceWorld();
      
      if (!everdiceWorld) {
        return res.status(404).json({ message: "Everdice world not found" });
      }
      
      // Use a local placeholder map that we know exists
      const mapUrl = "/assets/placeholder-map.jpg";
      
      // Update the world with the new map URL
      const updatedWorld = await storage.createOrUpdateEverdiceWorld({
        ...everdiceWorld,
        mapUrl,
        updatedAt: new Date()
      });
      
      res.json(updatedWorld);
    } catch (error) {
      console.error("Error regenerating world map:", error);
      res.status(500).json({ message: "Failed to regenerate world map" });
    }
  });
  
  app.get("/api/admin/campaign-regions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignRegions = await storage.getCampaignRegions();
      res.json(campaignRegions || { campaigns: [], uniqueRegions: [] });
    } catch (error) {
      console.error("Error getting campaign regions:", error);
      res.status(500).json({ message: "Failed to get campaign regions" });
    }
  });
  
  // New endpoint to update region information
  app.post("/api/admin/update-region", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Only superuser and admins can update regions
    if (req.user.role !== "superuser" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const { campaignId, regionName, description, position, bounds } = req.body;
      
      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID is required" });
      }
      
      // Get the existing map data
      const worldMap = await storage.getCampaignWorldMap(campaignId);
      
      if (!worldMap) {
        return res.status(404).json({ message: "Campaign world map not found" });
      }
      
      // Update the region information
      const updatedMap = await storage.createOrUpdateCampaignWorldMap({
        campaignId,
        mapUrl: worldMap.mapUrl,
        regionName: regionName || worldMap.regionName,
        position: position || worldMap.position,
        bounds: bounds || worldMap.bounds,
        continentId: worldMap.continentId,
        metadata: worldMap.metadata,
        updatedAt: new Date()
      });
      
      // Also update the campaign description if provided
      if (description) {
        await storage.updateCampaign(campaignId, { description });
      }
      
      res.json({ success: true, updatedMap });
    } catch (error) {
      console.error("Error updating region information:", error);
      res.status(500).json({ message: "Failed to update region information" });
    }
  });
  
  // Item related routes (add, remove, trade, equip)
  app.post("/api/characters/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      if (!character) return res.status(404).json({ message: "Character not found" });
      
      // Only owner can add items
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCharacter = await storage.addItemToCharacter(character.id, req.body);
      res.status(201).json(updatedCharacter);
    } catch (error) {
      console.error("Error adding item to character:", error);
      res.status(500).json({ message: "Failed to add item to character" });
    }
  });
  
  app.delete("/api/characters/:id/items/:itemIndex", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      if (!character) return res.status(404).json({ message: "Character not found" });
      
      // Only owner can remove items
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCharacter = await storage.removeItemFromCharacter(
        character.id, 
        parseInt(req.params.itemIndex)
      );
      
      if (!updatedCharacter) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error removing item from character:", error);
      res.status(500).json({ message: "Failed to remove item from character" });
    }
  });
  
  app.post("/api/characters/:id/items/:itemIndex/equip", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      if (!character) return res.status(404).json({ message: "Character not found" });
      
      // Only owner can equip items
      if (character.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const equip = req.body.equip === true;
      const updatedCharacter = await storage.equipItemForCharacter(
        character.id, 
        parseInt(req.params.itemIndex),
        equip
      );
      
      if (!updatedCharacter) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error equipping item for character:", error);
      res.status(500).json({ message: "Failed to equip item for character" });
    }
  });
  
  app.post("/api/characters/:fromId/items/:itemIndex/transfer/:toId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const fromCharacter = await storage.getCharacter(parseInt(req.params.fromId));
      const toCharacter = await storage.getCharacter(parseInt(req.params.toId));
      
      if (!fromCharacter || !toCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Only owner of the fromCharacter can transfer items
      if (fromCharacter.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const result = await storage.transferItemBetweenCharacters(
        fromCharacter.id,
        toCharacter.id,
        parseInt(req.params.itemIndex),
        req.body.quantity
      );
      
      if (!result) {
        return res.status(404).json({ message: "Item not found or transfer failed" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error transferring item between characters:", error);
      res.status(500).json({ message: "Failed to transfer item between characters" });
    }
  });
  
  // Random item generation for discovery/loot
  app.post("/api/generate/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { 
        itemType = "random",
        rarity = "common",
        category = "any",
        characterLevel = 1
      } = req.body;
      
      // Call the OpenAI function to generate a random item (we will implement this later)
      const item = await generateRandomItem({
        itemType,
        rarity,
        category,
        characterLevel
      });
      
      res.json(item);
    } catch (error) {
      console.error("Error generating random item:", error);
      res.status(500).json({ message: "Failed to generate random item" });
    }
  });
  
  // Map location routes
  app.get("/api/campaigns/:id/map/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can access map locations
      if (campaign.dmId !== req.user.id) {
        // TODO: Check if user is a player in the campaign
        // For now, we'll just allow access to the DM
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const locations = await storage.getMapLocationsByCampaignId(campaign.id);
      res.json(locations);
    } catch (error) {
      console.error("Error getting map locations:", error);
      res.status(500).json({ message: "Failed to get map locations" });
    }
  });
  
  app.post("/api/campaigns/:id/map/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can add map locations
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const location = await storage.createMapLocation({
        ...req.body,
        campaignId: campaign.id
      });
      
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating map location:", error);
      res.status(500).json({ message: "Failed to create map location" });
    }
  });
  
  app.patch("/api/campaigns/:campaignId/map/locations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.campaignId));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can update map locations
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedLocation = await storage.updateMapLocation(req.params.id, req.body);
      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(updatedLocation);
    } catch (error) {
      console.error("Error updating map location:", error);
      res.status(500).json({ message: "Failed to update map location" });
    }
  });
  
  app.delete("/api/campaigns/:campaignId/map/locations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.campaignId));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can delete map locations
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteMapLocation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting map location:", error);
      res.status(500).json({ message: "Failed to delete map location" });
    }
  });
  
  // Journey path routes
  app.get("/api/campaigns/:id/map/paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can access journey paths
      if (campaign.dmId !== req.user.id) {
        // TODO: Check if user is a player in the campaign
        // For now, we'll just allow access to the DM
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const paths = await storage.getJourneyPathsByCampaignId(campaign.id);
      res.json(paths);
    } catch (error) {
      console.error("Error getting journey paths:", error);
      res.status(500).json({ message: "Failed to get journey paths" });
    }
  });
  
  app.post("/api/campaigns/:id/map/paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can add journey paths
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const path = await storage.createJourneyPath({
        ...req.body,
        campaignId: campaign.id
      });
      
      res.status(201).json(path);
    } catch (error) {
      console.error("Error creating journey path:", error);
      res.status(500).json({ message: "Failed to create journey path" });
    }
  });
  
  app.patch("/api/campaigns/:campaignId/map/paths/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.campaignId));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can update journey paths
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedPath = await storage.updateJourneyPath(req.params.id, req.body);
      if (!updatedPath) {
        return res.status(404).json({ message: "Path not found" });
      }
      
      res.json(updatedPath);
    } catch (error) {
      console.error("Error updating journey path:", error);
      res.status(500).json({ message: "Failed to update journey path" });
    }
  });
  
  app.delete("/api/campaigns/:campaignId/map/paths/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.campaignId));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can delete journey paths
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteJourneyPath(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Path not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting journey path:", error);
      res.status(500).json({ message: "Failed to delete journey path" });
    }
  });
  
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
      
      const updateData = req.body;
      
      // Special handling for equipment updates to ensure proper structure
      if (updateData.equipment) {
        // Ensure equipment structure is maintained
        const currentEquipment = character.equipment || {} as any;
        
        // Initialize empty apparel object if it doesn't exist yet
        if (updateData.equipment.apparel && !currentEquipment.apparel) {
          currentEquipment.apparel = {};
        }
        
        // Make sure all required equipment fields are preserved
        updateData.equipment = {
          weapons: (updateData.equipment as any).weapons ?? currentEquipment.weapons ?? [],
          armor: (updateData.equipment as any).armor ?? currentEquipment.armor ?? "",
          apparel: (updateData.equipment as any).apparel ? 
            { ...(currentEquipment.apparel || {}), ...(updateData.equipment as any).apparel } : 
            (currentEquipment.apparel || {}),
          items: (updateData.equipment as any).items ?? currentEquipment.items ?? [],
          inventory: (updateData.equipment as any).inventory ?? currentEquipment.inventory ?? []
        };
      }
      
      const updatedCharacter = await storage.updateCharacter(characterId, updateData);
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
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
      
      // Generate a world map for the new campaign
      try {
        console.log("Generating world map for new campaign:", campaign.id);
        const mapData = await generateWorldMap(campaign.id, campaign);
        await storage.createOrUpdateCampaignWorldMap({
          campaignId: campaign.id,
          mapUrl: mapData.url
        });
        console.log("World map generated successfully for campaign:", campaign.id);
      } catch (mapError) {
        console.error("Failed to generate world map for new campaign:", mapError);
        // Continue even if map generation fails - we'll just not have a map initially
      }
      
      // Generate and save campaign introduction narrative
      try {
        console.log("Generating campaign introduction narrative for campaign:", campaign.id);
        
        // Get campaign data with the newly generated campaign
        const campaignData = await generateCampaign({
          genre: campaign.setting || undefined
        });
        
        // If the campaign has an introduction narrative, save it as a game log
        if (campaignData && campaignData.introNarrative) {
          console.log("Saving introduction narrative as game log for campaign:", campaign.id);
          await storage.createGameLog({
            campaignId: campaign.id,
            content: campaignData.introNarrative,
            type: "narrative_introduction" // Special type for intro narrative
          });
          console.log("Introduction narrative saved successfully for campaign:", campaign.id);
        }
      } catch (narrativeError) {
        console.error("Failed to generate introduction narrative for new campaign:", narrativeError);
        // Continue even if narrative generation fails
      }
      
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
  
  app.delete("/api/campaigns/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM can delete campaign
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteCampaign(campaignId);
      if (success) {
        res.status(200).json({ success: true, message: "Campaign deleted successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to delete campaign" });
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign", error: error instanceof Error ? error.message : "Unknown error" });
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
          content: response || "No response from companion",
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
  
  // World Map endpoints (generate, view)
  // Everdice World endpoints
  app.get("/api/everdice", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Get the Everdice world
      let everdiceWorld = await storage.getEverdiceWorld();
      
      // If no world exists yet, create it
      if (!everdiceWorld) {
        everdiceWorld = await storage.createOrUpdateEverdiceWorld({
          name: "Everdice",
          description: "The mystical realm of Everdice, where all adventures take place.",
          lore: "Everdice is a realm of magic and wonder, where countless adventures unfold across its varied landscapes. From the mist-shrouded peaks of the Dragonspine Mountains to the sun-dappled shores of the Sapphire Coast, every corner of this vast world holds untold stories waiting to be discovered."
        });
      }
      
      res.json(everdiceWorld);
    } catch (error) {
      console.error("Error fetching Everdice world:", error);
      res.status(500).json({ message: "Failed to fetch Everdice world" });
    }
  });
  
  // Get all campaign regions within Everdice
  app.get("/api/everdice/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Get all campaign world maps that have Everdice data
      const query = `
        SELECT 
          cwm.campaign_id, 
          cwm.continent_id, 
          cwm.region_name, 
          cwm.position, 
          c.name as campaign_name,
          u.username as dm_name
        FROM 
          campaign_world_maps cwm
        JOIN 
          campaigns c ON cwm.campaign_id = c.id
        JOIN 
          users u ON c.dm_id = u.id
        WHERE 
          cwm.continent_id IS NOT NULL
      `;
      
      const result = await db.execute(query);
      
      // Get the Everdice world for reference
      const everdiceWorld = await storage.getEverdiceWorld();
      
      res.json({
        campaigns: result.rows,
        everdiceWorld
      });
    } catch (error) {
      console.error("Error fetching Everdice campaign regions:", error);
      res.status(500).json({ message: "Failed to fetch Everdice campaign regions" });
    }
  });
  
  app.post("/api/everdice/continents", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Only superuser and admins can create/update continents
    if (req.user.role !== "superuser" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const continent = req.body;
      
      if (!continent.id || !continent.name || !continent.position || !continent.bounds) {
        return res.status(400).json({ message: "Missing required continent properties" });
      }
      
      const updatedWorld = await storage.addContinentToEverdiceWorld(continent);
      
      // Log the action
      await storage.createSystemStat({
        action: "continent_created",
        userId: req.user.id,
        metadata: { continentId: continent.id, continentName: continent.name }
      });
      
      res.status(201).json(updatedWorld);
    } catch (error) {
      console.error("Error creating continent:", error);
      res.status(500).json({ message: "Failed to create continent" });
    }
  });
  
  // Campaign World Maps endpoints
  app.get("/api/campaigns/:id/world-map", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Anyone in the campaign (DM or player) can view the world map
      const campaignId = campaign.id;
      const worldMap = await storage.getCampaignWorldMap(campaignId);
      
      if (!worldMap) {
        return res.status(404).json({ message: "World map not found" });
      }
      
      // Get the Everdice world for context
      const everdiceWorld = await storage.getEverdiceWorld();
      
      // Parse any JSON metadata
      let worldData = {};
      let everdiceData = {};
      
      if (worldMap.metadata) {
        try {
          const metadata = JSON.parse(worldMap.metadata);
          worldData = metadata.worldData || {};
          everdiceData = metadata.everdiceData || {};
        } catch (e) {
          console.error("Error parsing world map metadata:", e);
        }
      }
      
      // Return in the format the client expects, with Everdice context
      res.json({
        campaignId: worldMap.campaignId,
        mapUrl: worldMap.mapUrl,
        continentId: worldMap.continentId,
        regionName: worldMap.regionName,
        worldData: worldData,
        everdiceData: everdiceData,
        generatedAt: worldMap.generatedAt,
        updatedAt: worldMap.updatedAt,
        everdiceWorld: everdiceWorld ? {
          name: everdiceWorld.name,
          continents: everdiceWorld.continents
        } : null
      });
    } catch (error) {
      console.error("Error getting world map:", error);
      res.status(500).json({ message: "Failed to get world map" });
    }
  });
  
  app.post("/api/campaigns/:id/world-map/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only the DM can generate a world map
      if (campaign.dmId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get the Everdice world - if it doesn't exist, it will be created
      let everdiceWorld = await storage.getEverdiceWorld();
      if (!everdiceWorld) {
        everdiceWorld = await storage.createOrUpdateEverdiceWorld({
          name: "Everdice",
          description: "The mystical realm of Everdice, where all adventures take place.",
          lore: "Everdice is a realm of magic and wonder, where countless adventures unfold across its varied landscapes. From the mist-shrouded peaks of the Dragonspine Mountains to the sun-dappled shores of the Sapphire Coast, every corner of this vast world holds untold stories waiting to be discovered."
        });
      }
      
      // Generate the enhanced world map with detailed world data and Everdice integration
      const mapData = await generateWorldMap(campaign.id, campaign, everdiceWorld);
      
      // Create the world map data with Everdice integration
      const worldMapData = {
        campaignId: campaign.id,
        mapUrl: mapData.url,
        regionName: mapData.everdiceData.regionName,
        continentId: mapData.everdiceData.continent,
        metadata: JSON.stringify({
          worldData: mapData.worldData,
          everdiceData: mapData.everdiceData
        })
      };
      
      // Save the world map to the database with the metadata
      const worldMap = await storage.createOrUpdateCampaignWorldMap(worldMapData);
      
      // Return the complete data with Everdice integration
      res.status(201).json({
        campaignId: worldMap.campaignId,
        mapUrl: worldMap.mapUrl,
        worldData: mapData.worldData,
        everdiceData: mapData.everdiceData,
        generatedAt: worldMap.generatedAt,
        updatedAt: worldMap.updatedAt,
        everdiceWorld: {
          name: everdiceWorld.name,
          continents: everdiceWorld.continents
        }
      });
    } catch (error) {
      console.error("Error generating world map:", error);
      res.status(500).json({ message: "Failed to generate world map" });
    }
  });
  
  // Party Planning routes
  // Get all plans for a campaign
  app.get("/api/campaigns/:id/plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can access plans
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const plans = await storage.getPartyPlansByCampaignId(campaign.id);
      res.json(plans);
    } catch (error) {
      console.error("Error getting party plans:", error);
      res.status(500).json({ message: "Failed to get party plans" });
    }
  });
  
  // Create a new plan for a campaign
  app.post("/api/campaigns/:id/plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can create plans
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const planData = insertPartyPlanSchema.parse({
        ...req.body,
        campaignId: campaign.id,
        createdById: req.user.id
      });
      
      const plan = await storage.createPartyPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating party plan:", error);
      res.status(500).json({ message: "Failed to create party plan" });
    }
  });
  
  // Get a single plan with its items
  app.get("/api/plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const plan = await storage.getPartyPlanWithItems(parseInt(req.params.id));
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can access plan details
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error getting party plan:", error);
      res.status(500).json({ message: "Failed to get party plan" });
    }
  });
  
  // Update a plan
  app.patch("/api/plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const plan = await storage.getPartyPlan(parseInt(req.params.id));
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM, plan creator, or players in the campaign can update a plan
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && plan.createdById !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedPlan = await storage.updatePartyPlan(plan.id, req.body);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating party plan:", error);
      res.status(500).json({ message: "Failed to update party plan" });
    }
  });
  
  // Delete a plan
  app.delete("/api/plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const plan = await storage.getPartyPlan(parseInt(req.params.id));
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or plan creator can delete a plan
      if (campaign.dmId !== req.user.id && plan.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deletePartyPlan(plan.id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting party plan:", error);
      res.status(500).json({ message: "Failed to delete party plan" });
    }
  });
  
  // Plan Items API
  // Add an item to a plan
  app.post("/api/plans/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const plan = await storage.getPartyPlan(parseInt(req.params.id));
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can add items to a plan
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const itemData = insertPartyPlanItemSchema.parse({
        ...req.body,
        planId: plan.id,
        createdById: req.user.id
      });
      
      const item = await storage.createPartyPlanItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating party plan item:", error);
      res.status(500).json({ message: "Failed to create party plan item" });
    }
  });
  
  // Update a plan item
  app.patch("/api/plan-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const item = await storage.getPartyPlanItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Item not found" });
      
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM, item creator, or assigned user can update an item
      if (campaign.dmId !== req.user.id && item.createdById !== req.user.id && 
          (item.assignedToId !== req.user.id && item.assignedToId !== null)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedItem = await storage.updatePartyPlanItem(item.id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating party plan item:", error);
      res.status(500).json({ message: "Failed to update party plan item" });
    }
  });
  
  // Delete a plan item
  app.delete("/api/plan-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const item = await storage.getPartyPlanItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Item not found" });
      
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or item creator can delete an item
      if (campaign.dmId !== req.user.id && item.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deletePartyPlanItem(item.id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting party plan item:", error);
      res.status(500).json({ message: "Failed to delete party plan item" });
    }
  });
  
  // Plan Comments API
  // Add a comment to a plan item
  app.post("/api/plan-items/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const item = await storage.getPartyPlanItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Item not found" });
      
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can add comments
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const commentData = insertPartyPlanCommentSchema.parse({
        ...req.body,
        itemId: item.id,
        userId: req.user.id
      });
      
      const comment = await storage.createPartyPlanComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating party plan comment:", error);
      res.status(500).json({ message: "Failed to create party plan comment" });
    }
  });
  
  // Get comments for a plan item
  app.get("/api/plan-items/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const item = await storage.getPartyPlanItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Item not found" });
      
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Only DM or players in the campaign can view comments
      const isPlayerInCampaign = await storage.isPlayerInCampaign(req.user.id, campaign.id);
      if (campaign.dmId !== req.user.id && !isPlayerInCampaign) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const comments = await storage.getPartyPlanCommentsByItemId(item.id);
      res.json(comments);
    } catch (error) {
      console.error("Error getting party plan comments:", error);
      res.status(500).json({ message: "Failed to get party plan comments" });
    }
  });

  // Admin routes - only accessible to superusers
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is a superuser
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is a superuser
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to get system stats" });
    }
  });
  
  app.get("/api/admin/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is a superuser
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get all campaigns with extra information
      const campaigns = await storage.getAllCampaigns();
      
      // Get additional data for each campaign
      const campaignsWithDetails = await Promise.all(
        campaigns.map(async (campaign) => {
          const players = await storage.getCampaignPlayers(campaign.id);
          const sessionCount = await storage.getSessionCount(campaign.id);
          const worldMap = await storage.getCampaignWorldMap(campaign.id);
          
          return {
            ...campaign,
            playerCount: players.length,
            players,
            sessionCount,
            hasWorldMap: !!worldMap,
            worldMap: worldMap || null
          };
        })
      );
      
      res.json(campaignsWithDetails);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to get campaigns" });
    }
  });
  
  app.get("/api/admin/logins", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is a superuser
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get login statistics from the system_stats table
      const query = `
        SELECT 
          users.id, 
          users.username, 
          users.role,
          COUNT(system_stats.id) as login_count,
          MAX(system_stats.timestamp) as last_login
        FROM 
          users
        LEFT JOIN 
          system_stats ON users.id = system_stats.user_id AND system_stats.action = 'user_login'
        GROUP BY 
          users.id, users.username, users.role
        ORDER BY 
          login_count DESC, last_login DESC
      `;
      
      const result = await storage.executeRawQuery(query);
      
      // Format the result with more details
      const logins = result.rows.map((row: any) => ({
        userId: row.id,
        username: row.username,
        role: row.role,
        loginCount: parseInt(row.login_count) || 0,
        lastLogin: row.last_login ? new Date(row.last_login) : null,
        isActive: !!row.last_login && ((new Date().getTime() - new Date(row.last_login).getTime()) < (30 * 24 * 60 * 60 * 1000)) // Active in last 30 days
      }));
      
      res.json(logins);
    } catch (error) {
      console.error("Error fetching login activity:", error);
      res.status(500).json({ message: "Failed to get login activity" });
    }
  });
  
  app.post("/api/admin/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Check if user is a superuser
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const message = await storage.createUserMessage({
        senderId: req.user.id,
        recipientId: req.body.recipientId,
        subject: req.body.subject,
        content: req.body.content
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Route to grant admin privileges to a user (only superusers can do this)
  app.post("/api/admin/promote", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Only superusers can promote others
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden: Only superusers can promote users" });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    try {
      // Get the user to promote
      const userToPromote = await storage.getUser(userId);
      
      if (!userToPromote) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make sure we're not trying to promote a superuser (only KoeppyLoco should be superuser)
      if (userToPromote.role === "superuser") {
        return res.status(403).json({ message: "Cannot modify a superuser's role" });
      }
      
      // Update user to admin role (never to superuser)
      const updatedUser = await storage.updateUserRole(userId, "admin");
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
      // Log this action
      await storage.createSystemStat({
        action: "user_promoted_to_admin",
        userId: req.user.id,
        metadata: { 
          promotedUserId: userId, 
          promotedUsername: userToPromote.username,
          promotedBy: req.user.username
        }
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });
  
  // Endpoint for superadmin to promote users to admin (but never to superadmin)
  app.patch("/api/admin/users/:userId/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Only superusers can change roles
    if (req.user.role !== "superuser") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { role } = req.body;
    const userId = parseInt(req.params.userId);
    
    // Prevent anyone from becoming a superuser - only 'user' or 'admin' roles allowed
    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ message: "Invalid role. Only 'user' or 'admin' roles are allowed." });
    }
    
    try {
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log the role change
      await storage.createSystemStat({
        action: "role_change",
        userId: req.user.id,
        metadata: { 
          targetUserId: userId, 
          oldRole: updatedUser.role, 
          newRole: role 
        }
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Tavern Notice Board routes
  app.get("/api/tavern/notices", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const notices = await storage.getTavernNotices();
      res.json(notices);
    } catch (error) {
      console.error("Error fetching tavern notices:", error);
      res.status(500).json({ message: "Failed to get tavern notices" });
    }
  });
  
  app.post("/api/tavern/notices", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const notice = await storage.createTavernNotice({
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
        type: req.body.type || "quest",
        expiresAt: req.body.expiresAt
      });
      
      res.status(201).json(notice);
    } catch (error) {
      console.error("Error creating tavern notice:", error);
      res.status(500).json({ message: "Failed to create tavern notice" });
    }
  });
  
  app.get("/api/tavern/notices/:id/replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const replies = await storage.getTavernNoticeReplies(parseInt(req.params.id));
      res.json(replies);
    } catch (error) {
      console.error("Error fetching tavern notice replies:", error);
      res.status(500).json({ message: "Failed to get tavern notice replies" });
    }
  });
  
  app.post("/api/tavern/notices/:id/replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const reply = await storage.createTavernNoticeReply({
        noticeId: parseInt(req.params.id),
        userId: req.user.id,
        content: req.body.content
      });
      
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating tavern notice reply:", error);
      res.status(500).json({ message: "Failed to create tavern notice reply" });
    }
  });
  
  // Chat messages routes
  app.get("/api/campaigns/:id/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      const messages = await storage.getChatMessages(campaign.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to get chat messages" });
    }
  });
  
  app.post("/api/campaigns/:id/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      const validatedData = insertChatMessageSchema.parse({
        campaignId: campaign.id,
        userId: req.user.id,
        content: req.body.content
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // If WebSocket is set up, broadcast the message to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.campaignId === campaign.id) {
          client.send(JSON.stringify({
            type: 'chat',
            message
          }));
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat message data", errors: error.errors });
      }
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Party Planning API Routes
  
  // Get all party plans for a campaign
  app.get("/api/campaigns/:id/party-plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      
      // Check if user has access to this campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this campaign's plans" });
      }
      
      const plans = await storage.getPartyPlansByCampaignId(campaignId);
      res.json(plans);
    } catch (error) {
      console.error("Error getting party plans:", error);
      res.status(500).json({ message: "Failed to get party plans" });
    }
  });
  
  // Get a specific party plan with all its items
  app.get("/api/party-plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getPartyPlanWithItems(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      // Get the campaign to check access
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, plan.campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this plan" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error getting party plan:", error);
      res.status(500).json({ message: "Failed to get party plan" });
    }
  });
  
  // Create a new party plan
  app.post("/api/campaigns/:id/party-plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      
      // Check if user has access to this campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to create plans in this campaign" });
      }
      
      const planData = {
        campaignId,
        title: req.body.title,
        description: req.body.description || '',
        createdById: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newPlan = await storage.createPartyPlan(planData);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error("Error creating party plan:", error);
      res.status(500).json({ message: "Failed to create party plan" });
    }
  });
  
  // Update a party plan
  app.patch("/api/party-plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getPartyPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      // Get the campaign to check access
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only allow the DM or plan creator to update the plan
      if (campaign.dmId !== req.user!.id && plan.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this plan" });
      }
      
      const updatedPlan = await storage.updatePartyPlan(planId, {
        title: req.body.title,
        description: req.body.description,
        updatedAt: new Date()
      });
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating party plan:", error);
      res.status(500).json({ message: "Failed to update party plan" });
    }
  });
  
  // Delete a party plan
  app.delete("/api/party-plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getPartyPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      // Get the campaign to check access
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only allow the DM or plan creator to delete the plan
      if (campaign.dmId !== req.user!.id && plan.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this plan" });
      }
      
      const success = await storage.deletePartyPlan(planId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete party plan" });
      }
    } catch (error) {
      console.error("Error deleting party plan:", error);
      res.status(500).json({ message: "Failed to delete party plan" });
    }
  });
  
  // Create a new party plan item
  app.post("/api/party-plans/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getPartyPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      // Get the campaign to check access
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, plan.campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to add items to this plan" });
      }
      
      // Find the highest position value to place the new item at the end
      const items = await storage.getPartyPlanItemsByPlanId(planId);
      const highestPosition = items.length > 0 
        ? Math.max(...items.map(item => item.position)) 
        : -1;
      
      const itemData = {
        planId,
        content: req.body.content,
        type: req.body.type || 'task',
        status: req.body.status || 'pending',
        position: highestPosition + 1,
        createdById: req.user!.id,
        assignedToId: req.body.assignedToId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newItem = await storage.createPartyPlanItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating party plan item:", error);
      res.status(500).json({ message: "Failed to create party plan item" });
    }
  });
  
  // Update a party plan item
  app.patch("/api/party-plan-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPartyPlanItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Party plan item not found" });
      }
      
      // Get the plan and campaign to check access
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, plan.campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update items in this plan" });
      }
      
      const updates = {
        content: req.body.content,
        type: req.body.type,
        status: req.body.status,
        position: req.body.position,
        assignedToId: req.body.assignedToId,
        updatedAt: new Date()
      };
      
      // Remove undefined values
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
      
      const updatedItem = await storage.updatePartyPlanItem(itemId, updates);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating party plan item:", error);
      res.status(500).json({ message: "Failed to update party plan item" });
    }
  });
  
  // Delete a party plan item
  app.delete("/api/party-plan-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPartyPlanItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Party plan item not found" });
      }
      
      // Get the plan and campaign to check access
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only the DM, plan creator, or item creator can delete items
      if (campaign.dmId !== req.user!.id && 
          plan.createdById !== req.user!.id && 
          item.createdById !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this item" });
      }
      
      const success = await storage.deletePartyPlanItem(itemId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete party plan item" });
      }
    } catch (error) {
      console.error("Error deleting party plan item:", error);
      res.status(500).json({ message: "Failed to delete party plan item" });
    }
  });
  
  // Add a comment to a party plan item
  app.post("/api/party-plan-items/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPartyPlanItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Party plan item not found" });
      }
      
      // Get the plan and campaign to check access
      const plan = await storage.getPartyPlan(item.planId);
      if (!plan) {
        return res.status(404).json({ message: "Party plan not found" });
      }
      
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is in campaign
      const isInCampaign = await storage.isPlayerInCampaign(req.user!.id, plan.campaignId);
      if (!isInCampaign && campaign.dmId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to comment on this item" });
      }
      
      const commentData = {
        itemId,
        content: req.body.content,
        userId: req.user!.id,
        createdAt: new Date()
      };
      
      const newComment = await storage.createPartyPlanComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating party plan comment:", error);
      res.status(500).json({ message: "Failed to create party plan comment" });
    }
  });
  
  // Get all party plans for a campaign (implementation already exists with proper permissions above)
  
  // Create a new party plan
  app.post("/api/campaigns/:id/party-plans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.id);
      
      // Check if user has access to this campaign
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      const validatedData = insertPartyPlanSchema.parse({
        ...req.body,
        campaignId
      });
      
      const plan = await storage.createPartyPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.errors });
      }
      
      console.error("Error creating party plan:", error);
      res.status(500).json({ message: "Failed to create party plan" });
    }
  });
  
  // Update a party plan
  app.put("/api/party-plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Update the plan
      const updatedPlan = await storage.updatePartyPlan(planId, req.body);
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating party plan:", error);
      res.status(500).json({ message: "Failed to update party plan" });
    }
  });
  
  // Delete a party plan
  app.delete("/api/party-plans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Delete the plan
      await storage.deletePartyPlan(planId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting party plan:", error);
      res.status(500).json({ message: "Failed to delete party plan" });
    }
  });
  
  // Get all items for a party plan
  app.get("/api/party-plans/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Get items with their comments
      const items = await storage.getPartyPlanItems(planId);
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching party plan items:", error);
      res.status(500).json({ message: "Failed to fetch plan items" });
    }
  });
  
  // Create a new item for a party plan
  app.post("/api/party-plans/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.id);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Create the item
      const validatedData = insertPartyPlanItemSchema.parse(req.body);
      const item = await storage.createPartyPlanItem(validatedData);
      
      // Get the creator's username for broadcasting to other clients
      const creator = await storage.getUser(req.user.id);
      
      // Broadcast to other clients via WebSocket
      connections[plan.campaignId]?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'planning',
            action: 'item_created',
            campaignId: plan.campaignId,
            planId,
            userId: req.user.id,
            username: creator?.username || 'Unknown',
            timestamp: new Date()
          }));
        }
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      
      console.error("Error creating party plan item:", error);
      res.status(500).json({ message: "Failed to create plan item" });
    }
  });
  
  // Update a party plan item
  app.put("/api/party-plans/:planId/items/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.planId);
      const itemId = parseInt(req.params.itemId);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Update the item
      const updatedItem = await storage.updatePartyPlanItem(itemId, req.body);
      
      // Get the updater's username for broadcasting to other clients
      const updater = await storage.getUser(req.user.id);
      
      // Broadcast to other clients via WebSocket
      connections[plan.campaignId]?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'planning',
            action: 'item_updated',
            campaignId: plan.campaignId,
            planId,
            itemId,
            userId: req.user.id,
            username: updater?.username || 'Unknown',
            timestamp: new Date()
          }));
        }
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating party plan item:", error);
      res.status(500).json({ message: "Failed to update plan item" });
    }
  });
  
  // Delete a party plan item
  app.delete("/api/party-plans/:planId/items/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.planId);
      const itemId = parseInt(req.params.itemId);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Delete the item
      await storage.deletePartyPlanItem(itemId);
      
      // Get the deleter's username for broadcasting to other clients
      const deleter = await storage.getUser(req.user.id);
      
      // Broadcast to other clients via WebSocket
      connections[plan.campaignId]?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'planning',
            action: 'item_deleted',
            campaignId: plan.campaignId,
            planId,
            itemId,
            userId: req.user.id,
            username: deleter?.username || 'Unknown',
            timestamp: new Date()
          }));
        }
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting party plan item:", error);
      res.status(500).json({ message: "Failed to delete plan item" });
    }
  });
  
  // Add a comment to a party plan item
  app.post("/api/party-plans/:planId/items/:itemId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const planId = parseInt(req.params.planId);
      const itemId = parseInt(req.params.itemId);
      
      // Get the plan to check if user has access
      const plan = await storage.getPartyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Party plan not found" });
      
      // Check if user is a player in this campaign
      const campaign = await storage.getCampaign(plan.campaignId);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      
      // TODO: Check if user is a player in this campaign
      
      // Create the comment
      const validatedData = insertPartyPlanCommentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const comment = await storage.createPartyPlanComment(validatedData);
      
      // Get the commenter's username for broadcasting to other clients
      const commenter = await storage.getUser(req.user.id);
      
      // Broadcast to other clients via WebSocket
      connections[plan.campaignId]?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'planning',
            action: 'comment_added',
            campaignId: plan.campaignId,
            planId,
            itemId,
            userId: req.user.id,
            username: commenter?.username || 'Unknown',
            timestamp: new Date()
          }));
        }
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      
      console.error("Error adding comment to party plan item:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // System stats logging
  app.post("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const stat = await storage.createSystemStat({
        userId: req.user.id,
        action: req.body.action,
        metadata: req.body.metadata
      });
      
      res.status(201).json(stat);
    } catch (error) {
      console.error("Error logging system stat:", error);
      res.status(500).json({ message: "Failed to log system stat" });
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
        
        // Handle party planning updates (item added, updated, deleted, etc.)
        if (data.type === 'planning' && data.campaignId) {
          const campaignId = parseInt(data.campaignId);
          
          // Initial broadcast is handled in the specific action handlers below
          
          // Handle different party planning actions
          try {
            const action = data.action;
            
            if (action === 'create_plan') {
              const newPlan = await storage.createPartyPlan(data.plan);
              
              // Broadcast plan creation to all connected clients
              connections[campaignId]?.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'planning',
                    action: 'plan_created',
                    campaignId,
                    plan: newPlan
                  }));
                }
              });
            }
            
            else if (action === 'update_plan') {
              const updatedPlan = await storage.updatePartyPlan(data.planId, data.updates);
              
              if (updatedPlan) {
                // Broadcast plan update to all connected clients
                connections[campaignId]?.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'planning',
                      action: 'plan_updated',
                      campaignId,
                      plan: updatedPlan
                    }));
                  }
                });
              }
            }
            
            else if (action === 'delete_plan') {
              const success = await storage.deletePartyPlan(data.planId);
              
              if (success) {
                // Broadcast plan deletion to all connected clients
                connections[campaignId]?.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'planning',
                      action: 'plan_deleted',
                      campaignId,
                      planId: data.planId
                    }));
                  }
                });
              }
            }
            
            else if (action === 'create_item') {
              const newItem = await storage.createPartyPlanItem(data.item);
              
              // Broadcast item creation to all connected clients
              connections[campaignId]?.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'planning',
                    action: 'item_created',
                    campaignId,
                    item: newItem
                  }));
                }
              });
            }
            
            else if (action === 'update_item') {
              const updatedItem = await storage.updatePartyPlanItem(data.itemId, data.updates);
              
              if (updatedItem) {
                // Broadcast item update to all connected clients
                connections[campaignId]?.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'planning',
                      action: 'item_updated',
                      campaignId,
                      item: updatedItem
                    }));
                  }
                });
              }
            }
            
            else if (action === 'delete_item') {
              const success = await storage.deletePartyPlanItem(data.itemId);
              
              if (success) {
                // Broadcast item deletion to all connected clients
                connections[campaignId]?.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'planning',
                      action: 'item_deleted',
                      campaignId,
                      itemId: data.itemId
                    }));
                  }
                });
              }
            }
            
            else if (action === 'add_comment') {
              const newComment = await storage.createPartyPlanComment(data.comment);
              
              // Broadcast comment creation to all connected clients
              connections[campaignId]?.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'planning',
                    action: 'comment_added',
                    campaignId,
                    comment: newComment
                  }));
                }
              });
            }
          } catch (error) {
            console.error('Error handling party planning action:', error);
            
            // Send error back to the client
            ws.send(JSON.stringify({
              type: 'planning',
              action: 'error',
              message: 'Failed to process party planning action'
            }));
          }
          
          // All broadcasting is handled in the specific action handlers above
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
        
        // Party planning is handled above with a more robust implementation
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
