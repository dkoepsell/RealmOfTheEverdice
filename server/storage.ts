import { 
  User, InsertUser, 
  Character, InsertCharacter, 
  InsertCampaign,
  CampaignCharacter, InsertCampaignCharacter,
  Adventure, InsertAdventure,
  Npc, InsertNpc,
  Quest, InsertQuest,
  GameLog, InsertGameLog,
  Friendship, InsertFriendship,
  UserSession, InsertUserSession,
  ChatMessage, InsertChatMessage,
  CampaignInvitation, InsertCampaignInvitation,
  MapLocation, InsertMapLocation,
  JourneyPath, InsertJourneyPath,
  CampaignWorldMap, InsertCampaignWorldMap,
  PartyPlan, InsertPartyPlan,
  PartyPlanItem, InsertPartyPlanItem,
  PartyPlanComment, InsertPartyPlanComment,
  TavernNotice, InsertTavernNotice,
  TavernNoticeReply, InsertTavernNoticeReply,
  SystemStat, InsertSystemStat,
  UserMessage, InsertUserMessage,
  EverdiceWorld, InsertEverdiceWorld,
  users, characters, campaigns, campaignCharacters, adventures, npcs, quests, gameLogs,
  friendships, userSessions, chatMessages, campaignInvitations, mapLocations, journeyPaths,
  campaignWorldMaps, partyPlans, partyPlanItems, partyPlanComments, tavernNotices, tavernNoticeReplies,
  systemStats, userMessages, everdiceWorld
} from "@shared/schema";

// Define our own Campaign type without partyName since it's not in the DB yet
interface Campaign {
  id: number;
  name: string;
  description: string | null;
  dmId: number;
  status: string;
  setting: string | null;
  isAiDm: boolean;
  createdAt: Date | null;
}
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // Database utility methods
  executeRawQuery(query: string, params?: any[]): Promise<any>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Character methods
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUserId(userId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;
  
  // Campaign methods
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByDmId(dmId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  
  // Campaign Character methods
  addCharacterToCampaign(campaignCharacter: InsertCampaignCharacter): Promise<CampaignCharacter>;
  getCampaignCharacters(campaignId: number): Promise<CampaignCharacter[]>;
  removeCharacterFromCampaign(campaignId: number, characterId: number): Promise<boolean>;
  
  // Adventure methods
  getAdventure(id: number): Promise<Adventure | undefined>;
  getAdventuresByCampaignId(campaignId: number): Promise<Adventure[]>;
  createAdventure(adventure: InsertAdventure): Promise<Adventure>;
  updateAdventure(id: number, adventure: Partial<Adventure>): Promise<Adventure | undefined>;
  
  // NPC methods
  getNpc(id: number): Promise<Npc | undefined>;
  getNpcsByCampaignId(campaignId: number): Promise<Npc[]>;
  createNpc(npc: InsertNpc): Promise<Npc>;
  
  // Quest methods
  getQuest(id: number): Promise<Quest | undefined>;
  getQuestsByAdventureId(adventureId: number): Promise<Quest[]>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: number, quest: Partial<Quest>): Promise<Quest | undefined>;
  
  // Game Log methods
  getGameLogsByCampaignId(campaignId: number, limit?: number): Promise<GameLog[]>;
  createGameLog(gameLog: InsertGameLog): Promise<GameLog>;
  
  // Friendship methods
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
  getFriendshipsByUserId(userId: number): Promise<Friendship[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendship(userId: number, friendId: number, status: string): Promise<Friendship | undefined>;
  deleteFriendship(userId: number, friendId: number): Promise<boolean>;
  
  // User session methods
  getUserSession(userId: number): Promise<UserSession | undefined>;
  createOrUpdateUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserStatus(userId: number, updates: Partial<UserSession>): Promise<UserSession | undefined>;
  getOnlineUsers(): Promise<UserSession[]>;
  getLookingForPartyUsers(): Promise<UserSession[]>;
  getLookingForFriendsUsers(): Promise<UserSession[]>;
  
  // Chat message methods
  getChatMessagesByCampaignId(campaignId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Campaign invitation methods
  getCampaignInvitation(id: number): Promise<CampaignInvitation | undefined>;
  getCampaignInvitationsByUserId(userId: number): Promise<CampaignInvitation[]>;
  getCampaignInvitationsByCampaignId(campaignId: number): Promise<CampaignInvitation[]>;
  createCampaignInvitation(invitation: InsertCampaignInvitation): Promise<CampaignInvitation>;
  updateCampaignInvitation(id: number, status: string): Promise<CampaignInvitation | undefined>;
  deleteCampaignInvitation(id: number): Promise<boolean>;
  
  // Map location methods
  getMapLocationsByCampaignId(campaignId: number): Promise<MapLocation[]>;
  getMapLocation(id: string): Promise<MapLocation | undefined>;
  createMapLocation(location: InsertMapLocation): Promise<MapLocation>;
  updateMapLocation(id: string, location: Partial<MapLocation>): Promise<MapLocation | undefined>;
  deleteMapLocation(id: string): Promise<boolean>;
  
  // Journey path methods
  getJourneyPathsByCampaignId(campaignId: number): Promise<JourneyPath[]>;
  getJourneyPath(id: string): Promise<JourneyPath | undefined>;
  createJourneyPath(path: InsertJourneyPath): Promise<JourneyPath>;
  updateJourneyPath(id: string, path: Partial<JourneyPath>): Promise<JourneyPath | undefined>;
  deleteJourneyPath(id: string): Promise<boolean>;
  
  // World map methods
  getCampaignWorldMap(campaignId: number): Promise<CampaignWorldMap | undefined>;
  createOrUpdateCampaignWorldMap(worldMap: InsertCampaignWorldMap): Promise<CampaignWorldMap>;
  
  // Everdice World methods
  getEverdiceWorld(): Promise<EverdiceWorld | undefined>;
  saveEverdiceWorld(worldData: any): Promise<EverdiceWorld>;
  createOrUpdateEverdiceWorld(world: Partial<InsertEverdiceWorld>): Promise<EverdiceWorld>;
  addContinentToEverdiceWorld(continent: { id: string; name: string; description: string; position: [number, number]; bounds: [[number, number], [number, number]]; }): Promise<EverdiceWorld>;
  getCampaignRegions(): Promise<{ campaigns: any[], uniqueRegions: string[] }>;
  
  // Campaign permissions
  isPlayerInCampaign(userId: number, campaignId: number): Promise<boolean>;
  
  // Party Planning methods
  getPartyPlan(id: number): Promise<PartyPlan | undefined>;
  getPartyPlansByCampaignId(campaignId: number): Promise<PartyPlan[]>;
  getPartyPlanWithItems(id: number): Promise<(PartyPlan & { items: PartyPlanItem[] }) | undefined>;
  createPartyPlan(plan: InsertPartyPlan): Promise<PartyPlan>;
  updatePartyPlan(id: number, updates: Partial<PartyPlan>): Promise<PartyPlan | undefined>;
  deletePartyPlan(id: number): Promise<boolean>;
  
  // Party Plan Item methods
  getPartyPlanItem(id: number): Promise<PartyPlanItem | undefined>;
  getPartyPlanItemsByPlanId(planId: number): Promise<PartyPlanItem[]>;
  createPartyPlanItem(item: InsertPartyPlanItem): Promise<PartyPlanItem>;
  updatePartyPlanItem(id: number, updates: Partial<PartyPlanItem>): Promise<PartyPlanItem | undefined>;
  deletePartyPlanItem(id: number): Promise<boolean>;
  
  // Party Plan Comment methods
  getPartyPlanCommentsByItemId(itemId: number): Promise<PartyPlanComment[]>;
  createPartyPlanComment(comment: InsertPartyPlanComment): Promise<PartyPlanComment>;
  
  // Item management methods
  addItemToCharacter(characterId: number, item: any): Promise<Character | undefined>;
  removeItemFromCharacter(characterId: number, itemIndex: number): Promise<Character | undefined>;
  transferItemBetweenCharacters(fromCharId: number, toCharId: number, itemIndex: number, quantity?: number): Promise<{from: Character, to: Character} | undefined>;
  equipItemForCharacter(characterId: number, itemIndex: number, equip: boolean): Promise<Character | undefined>;
  
  // Permissions method
  isPlayerInCampaign(userId: number, campaignId: number): Promise<boolean>;
  
  // Tavern Notice Board methods
  getTavernNotices(): Promise<any[]>;
  getTavernNoticeById(id: number): Promise<any | undefined>;
  createTavernNotice(notice: any): Promise<any>;
  updateTavernNotice(id: number, notice: any): Promise<any | undefined>;
  deleteTavernNotice(id: number): Promise<boolean>;
  getTavernNoticeReplies(noticeId: number): Promise<any[]>;
  createTavernNoticeReply(reply: any): Promise<any>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: "user" | "admin"): Promise<User | undefined>;
  getSystemStats(): Promise<any[]>;
  createSystemStat(stat: any): Promise<any>;
  getUserMessages(userId: number): Promise<any[]>;
  createUserMessage(message: any): Promise<any>;
  getChatMessages(campaignId: number): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Implement Map location methods
  async getMapLocationsByCampaignId(campaignId: number): Promise<MapLocation[]> {
    try {
      return db.select().from(mapLocations).where(eq(mapLocations.campaignId, campaignId));
    } catch (error) {
      console.error("Error getting map locations:", error);
      return [];
    }
  }
  
  async getMapLocation(id: string): Promise<MapLocation | undefined> {
    try {
      const [location] = await db.select().from(mapLocations).where(eq(mapLocations.id, id));
      return location;
    } catch (error) {
      console.error("Error getting map location:", error);
      return undefined;
    }
  }
  
  async createMapLocation(location: InsertMapLocation): Promise<MapLocation> {
    try {
      const [newLocation] = await db.insert(mapLocations).values(location).returning();
      return newLocation;
    } catch (error) {
      console.error("Error creating map location:", error);
      throw error;
    }
  }
  
  async updateMapLocation(id: string, location: Partial<MapLocation>): Promise<MapLocation | undefined> {
    try {
      const [updatedLocation] = await db
        .update(mapLocations)
        .set(location)
        .where(eq(mapLocations.id, id))
        .returning();
      return updatedLocation;
    } catch (error) {
      console.error("Error updating map location:", error);
      return undefined;
    }
  }
  
  async deleteMapLocation(id: string): Promise<boolean> {
    try {
      const result = await db.delete(mapLocations).where(eq(mapLocations.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting map location:", error);
      return false;
    }
  }
  
  // Implement Journey path methods
  async getJourneyPathsByCampaignId(campaignId: number): Promise<JourneyPath[]> {
    try {
      return db.select().from(journeyPaths).where(eq(journeyPaths.campaignId, campaignId));
    } catch (error) {
      console.error("Error getting journey paths:", error);
      return [];
    }
  }
  
  async getJourneyPath(id: string): Promise<JourneyPath | undefined> {
    try {
      const [path] = await db.select().from(journeyPaths).where(eq(journeyPaths.id, id));
      return path;
    } catch (error) {
      console.error("Error getting journey path:", error);
      return undefined;
    }
  }
  
  async createJourneyPath(path: InsertJourneyPath): Promise<JourneyPath> {
    try {
      const [newPath] = await db.insert(journeyPaths).values(path).returning();
      return newPath;
    } catch (error) {
      console.error("Error creating journey path:", error);
      throw error;
    }
  }
  
  async updateJourneyPath(id: string, path: Partial<JourneyPath>): Promise<JourneyPath | undefined> {
    try {
      const [updatedPath] = await db
        .update(journeyPaths)
        .set(path)
        .where(eq(journeyPaths.id, id))
        .returning();
      return updatedPath;
    } catch (error) {
      console.error("Error updating journey path:", error);
      return undefined;
    }
  }
  
  async deleteJourneyPath(id: string): Promise<boolean> {
    try {
      const result = await db.delete(journeyPaths).where(eq(journeyPaths.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting journey path:", error);
      return false;
    }
  }
  
  // Implement World Map methods
  async getCampaignWorldMap(campaignId: number): Promise<CampaignWorldMap | undefined> {
    try {
      // Use explicit column selection to avoid issues with missing columns
      const [worldMap] = await db.select({
        id: campaignWorldMaps.id,
        campaignId: campaignWorldMaps.campaignId,
        mapUrl: campaignWorldMaps.mapUrl,
        regionName: campaignWorldMaps.regionName,
        createdAt: campaignWorldMaps.createdAt,
        updatedAt: campaignWorldMaps.updatedAt
      })
      .from(campaignWorldMaps)
      .where(eq(campaignWorldMaps.campaignId, campaignId));
      
      return worldMap;
    } catch (error) {
      // If there's a column-related error, try a more minimal query
      try {
        const [minimalWorldMap] = await db.select({
          id: campaignWorldMaps.id,
          campaignId: campaignWorldMaps.campaignId,
          mapUrl: campaignWorldMaps.mapUrl
        })
        .from(campaignWorldMaps)
        .where(eq(campaignWorldMaps.campaignId, campaignId));
        
        return minimalWorldMap;
      } catch (fallbackError) {
        console.error("Error getting campaign world map (even with minimal query):", fallbackError);
        return undefined;
      }
    }
  }
  
  async createOrUpdateCampaignWorldMap(worldMap: InsertCampaignWorldMap): Promise<CampaignWorldMap> {
    try {
      // Check if a world map already exists for this campaign
      const existingMap = await this.getCampaignWorldMap(worldMap.campaignId);
      
      // Make sure Everdice world exists
      const everdiceWorld = await this.getEverdiceWorld();
      if (!everdiceWorld) {
        await this.createOrUpdateEverdiceWorld({});
      }
      
      // Extract only safe fields
      const safeWorldMap: any = {
        mapUrl: worldMap.mapUrl
      };
      
      // Only include these fields if they exist in the input
      if (worldMap.regionName !== undefined) safeWorldMap.regionName = worldMap.regionName;
      if (worldMap.position !== undefined) safeWorldMap.position = worldMap.position;
      if (worldMap.bounds !== undefined) safeWorldMap.bounds = worldMap.bounds;
      
      if (existingMap) {
        try {
          // Update the existing map - use explicit returning to avoid schema issues
          const [updatedMap] = await db
            .update(campaignWorldMaps)
            .set({ 
              ...safeWorldMap,
              updatedAt: new Date()
            })
            .where(eq(campaignWorldMaps.campaignId, worldMap.campaignId))
            .returning({
              id: campaignWorldMaps.id,
              campaignId: campaignWorldMaps.campaignId,
              mapUrl: campaignWorldMaps.mapUrl,
              regionName: campaignWorldMaps.regionName,
              createdAt: campaignWorldMaps.createdAt,
              updatedAt: campaignWorldMaps.updatedAt
            });
          return updatedMap;
        } catch (updateError) {
          console.error("Error updating campaign world map with full fields:", updateError);
          
          // Try a more minimal update if the full update fails
          const [minimalUpdatedMap] = await db
            .update(campaignWorldMaps)
            .set({ 
              mapUrl: worldMap.mapUrl,
              updatedAt: new Date()
            })
            .where(eq(campaignWorldMaps.campaignId, worldMap.campaignId))
            .returning({
              id: campaignWorldMaps.id,
              campaignId: campaignWorldMaps.campaignId,
              mapUrl: campaignWorldMaps.mapUrl
            });
          return minimalUpdatedMap;
        }
      } else {
        try {
          // Create a new map - only include the essential fields
          const mapData = {
            campaignId: worldMap.campaignId,
            mapUrl: worldMap.mapUrl
          };
          
          const [newMap] = await db
            .insert(campaignWorldMaps)
            .values(mapData)
            .returning({
              id: campaignWorldMaps.id,
              campaignId: campaignWorldMaps.campaignId,
              mapUrl: campaignWorldMaps.mapUrl
            });
          return newMap;
        } catch (insertError) {
          console.error("Error creating campaign world map:", insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error("Error in createOrUpdateCampaignWorldMap:", error);
      throw error;
    }
  }
  
  // Everdice World methods
  async getEverdiceWorld(): Promise<EverdiceWorld | undefined> {
    try {
      const [world] = await db.select().from(everdiceWorld).limit(1);
      return world;
    } catch (error) {
      console.error("Error getting Everdice world:", error);
      return undefined;
    }
  }
  
  async saveEverdiceWorld(worldData: any): Promise<EverdiceWorld> {
    try {
      return this.createOrUpdateEverdiceWorld(worldData);
    } catch (error) {
      console.error("Error saving Everdice world:", error);
      throw error;
    }
  }
  
  async createOrUpdateEverdiceWorld(world: Partial<InsertEverdiceWorld>): Promise<EverdiceWorld> {
    try {
      const existing = await this.getEverdiceWorld();
      
      // Extract continents if they exist, to handle them properly
      const { continents, ...worldData } = world as any;
      
      if (existing) {
        // Update existing world, but handle continents separately
        const [updated] = await db
          .update(everdiceWorld)
          .set({
            ...worldData,
            // Only update these fields if they're provided
            name: world.name !== undefined ? world.name : existing.name,
            description: world.description !== undefined ? world.description : existing.description,
            mapUrl: world.mapUrl !== undefined ? world.mapUrl : existing.mapUrl,
            lore: world.lore !== undefined ? world.lore : existing.lore,
            metadata: world.metadata !== undefined ? world.metadata : existing.metadata,
            updatedAt: new Date()
          })
          .where(eq(everdiceWorld.id, existing.id))
          .returning();
        
        // Combine the updated data with the original continents if not provided in the update
        return {
          ...updated,
          continents: continents || existing.continents
        };
      } else {
        // Create a new Everdice world
        const [created] = await db
          .insert(everdiceWorld)
          .values({
            name: "Everdice",
            description: "The mystical realm of Everdice, where all adventures take place.",
            lore: "Everdice is a realm of magic and wonder, where countless adventures unfold across its varied landscapes. From the mist-shrouded peaks of the Dragonspine Mountains to the sun-dappled shores of the Sapphire Coast, every corner of this vast world holds untold stories waiting to be discovered.",
            ...worldData
          })
          .returning();
          
        // Add continents to the new world if provided
        return {
          ...created,
          continents: continents || null
        };
      }
    } catch (error) {
      console.error("Error creating/updating Everdice world:", error);
      throw error;
    }
  }
  
  async getCampaignRegions(): Promise<{ campaigns: any[], uniqueRegions: string[] }> {
    try {
      // Use raw SQL query to avoid column errors while database might be evolving
      const query = `
        SELECT 
          c.id, 
          c.name, 
          c.dm_id as "dmId", 
          c.is_ai_dm as "isAiDm",
          c.description,
          c.setting,
          cwm.map_url as "mapUrl",
          cwm.region_name as "regionName",
          COALESCE(
            cwm.region_name, 
            CASE 
              WHEN c.setting IS NOT NULL THEN c.setting
              ELSE 'Unknown Region'
            END
          ) as "effectiveRegion"
        FROM campaigns c
        LEFT JOIN campaign_world_maps cwm ON c.id = cwm.campaign_id
      `;
      
      const campaignsWithRegions = await this.executeRawQuery(query);
      
      // Use the campaign setting as fallback for region name
      const uniqueRegions = campaignsWithRegions
        .map((campaign: any) => campaign.effectiveRegion)
        .filter((region: string | null) => region !== null)
        .filter((region: string, index: number, self: string[]) => 
          self.indexOf(region) === index
        );
      
      // Update the campaigns to use effectiveRegion as the regionName if regionName is null
      const processedCampaigns = campaignsWithRegions.map((campaign: any) => ({
        ...campaign,
        regionName: campaign.regionName || campaign.effectiveRegion
      }));
      
      return {
        campaigns: processedCampaigns || [],
        uniqueRegions: uniqueRegions || []
      };
    } catch (error) {
      console.error("Error getting campaign regions:", error);
      return { campaigns: [], uniqueRegions: [] };
    }
  }
  
  async addContinentToEverdiceWorld(
    continent: {
      id: string;
      name: string;
      description: string;
      position: [number, number];
      bounds: [[number, number], [number, number]];
    }
  ): Promise<EverdiceWorld> {
    try {
      const world = await this.getEverdiceWorld();
      
      if (!world) {
        // Create world first if it doesn't exist
        return this.createOrUpdateEverdiceWorld({
          continents: [continent]
        });
      }
      
      // Add the continent to the existing list
      const continents = world.continents || [];
      const continentIndex = continents.findIndex(c => c.id === continent.id);
      
      if (continentIndex >= 0) {
        // Update existing continent
        continents[continentIndex] = continent;
      } else {
        // Add new continent
        continents.push(continent);
      }
      
      // Update the world with the new continent list
      return this.createOrUpdateEverdiceWorld({
        continents
      });
    } catch (error) {
      console.error("Error adding continent to Everdice world:", error);
      throw error;
    }
  }
  
  // Implement Item management methods
  async addItemToCharacter(characterId: number, item: any): Promise<Character | undefined> {
    try {
      // Get the character first
      const character = await this.getCharacter(characterId);
      if (!character) return undefined;
      
      // Create a new equipment object with inventory if it doesn't exist
      const equipment = character.equipment || { weapons: [], armor: "", items: [], inventory: [] };
      
      // Add the item to the inventory
      if (!Array.isArray(equipment.inventory)) {
        equipment.inventory = [];
      }
      
      // Find the next available slot number
      const maxSlot = equipment.inventory.reduce((max, item) => Math.max(max, item.slot || 0), 0);
      const newItem = {
        ...item,
        slot: maxSlot + 1,
        isEquipped: false
      };
      
      equipment.inventory.push(newItem);
      
      // Update the character
      return this.updateCharacter(characterId, { equipment });
    } catch (error) {
      console.error("Error adding item to character:", error);
      return undefined;
    }
  }
  
  async removeItemFromCharacter(characterId: number, itemIndex: number): Promise<Character | undefined> {
    try {
      // Get the character first
      const character = await this.getCharacter(characterId);
      if (!character || !character.equipment || !Array.isArray(character.equipment.inventory)) {
        return undefined;
      }
      
      // Remove the item from the inventory
      const inventory = character.equipment.inventory.filter((_, index) => index !== itemIndex);
      
      // Update the character equipment
      const updatedEquipment = {
        ...character.equipment,
        inventory
      };
      
      // Update the character
      return this.updateCharacter(characterId, { equipment: updatedEquipment });
    } catch (error) {
      console.error("Error removing item from character:", error);
      return undefined;
    }
  }
  
  async transferItemBetweenCharacters(
    fromCharId: number, 
    toCharId: number, 
    itemIndex: number, 
    quantity?: number
  ): Promise<{from: Character, to: Character} | undefined> {
    try {
      // Get both characters
      const fromCharacter = await this.getCharacter(fromCharId);
      const toCharacter = await this.getCharacter(toCharId);
      
      if (!fromCharacter || !toCharacter) return undefined;
      
      // Check if from character has inventory and the item
      if (!fromCharacter.equipment || 
          !Array.isArray(fromCharacter.equipment.inventory) || 
          itemIndex >= fromCharacter.equipment.inventory.length) {
        return undefined;
      }
      
      // Get the item to transfer
      const item = fromCharacter.equipment.inventory[itemIndex];
      
      // Determine quantity to transfer
      const transferQuantity = quantity && quantity < item.quantity ? quantity : item.quantity;
      
      // Create a new equipment object for the to character if needed
      const toEquipment = toCharacter.equipment || { weapons: [], armor: "", items: [], inventory: [] };
      if (!Array.isArray(toEquipment.inventory)) {
        toEquipment.inventory = [];
      }
      
      // Find the next available slot number for the to character
      const maxSlot = toEquipment.inventory.reduce((max, item) => Math.max(max, item.slot || 0), 0);
      
      // Create the item to transfer
      const transferItem = {
        ...item,
        quantity: transferQuantity,
        slot: maxSlot + 1,
        isEquipped: false
      };
      
      // Add the item to the to character
      toEquipment.inventory.push(transferItem);
      
      // Update the from character's inventory
      let fromEquipment = { ...fromCharacter.equipment };
      if (transferQuantity === item.quantity) {
        // Remove the item completely
        fromEquipment.inventory = fromEquipment.inventory.filter((_, index) => index !== itemIndex);
      } else {
        // Reduce the quantity
        fromEquipment.inventory[itemIndex] = {
          ...item,
          quantity: item.quantity - transferQuantity
        };
      }
      
      // Update both characters
      const updatedFromChar = await this.updateCharacter(fromCharId, { equipment: fromEquipment });
      const updatedToChar = await this.updateCharacter(toCharId, { equipment: toEquipment });
      
      if (!updatedFromChar || !updatedToChar) return undefined;
      
      return {
        from: updatedFromChar,
        to: updatedToChar
      };
    } catch (error) {
      console.error("Error transferring item between characters:", error);
      return undefined;
    }
  }
  
  async equipItemForCharacter(characterId: number, itemIndex: number, equip: boolean): Promise<Character | undefined> {
    try {
      // Get the character first
      const character = await this.getCharacter(characterId);
      if (!character || !character.equipment || !Array.isArray(character.equipment.inventory)) {
        return undefined;
      }
      
      // Check if the item exists
      if (itemIndex >= character.equipment.inventory.length) {
        return undefined;
      }
      
      // Create a copy of the equipment
      const updatedEquipment = { ...character.equipment };
      const updatedInventory = [...updatedEquipment.inventory];
      
      // Update the item's equipped status
      updatedInventory[itemIndex] = {
        ...updatedInventory[itemIndex],
        isEquipped: equip
      };
      
      // If we're equipping a weapon or armor, update the main equipment lists too
      const item = updatedInventory[itemIndex];
      if (equip) {
        if (item.type === "weapon" && !updatedEquipment.weapons.includes(item.name)) {
          updatedEquipment.weapons = [...updatedEquipment.weapons, item.name];
        } else if (item.type === "armor") {
          updatedEquipment.armor = item.name;
        }
      } else {
        if (item.type === "weapon") {
          updatedEquipment.weapons = updatedEquipment.weapons.filter(w => w !== item.name);
        } else if (item.type === "armor" && updatedEquipment.armor === item.name) {
          updatedEquipment.armor = "";
        }
      }
      
      updatedEquipment.inventory = updatedInventory;
      
      // Update the character
      return this.updateCharacter(characterId, { equipment: updatedEquipment });
    } catch (error) {
      console.error("Error equipping item for character:", error);
      return undefined;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Character methods
  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.userId, userId));
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    return character;
  }

  async updateCharacter(id: number, characterUpdate: Partial<Character>): Promise<Character | undefined> {
    const [updatedCharacter] = await db
      .update(characters)
      .set(characterUpdate)
      .where(eq(characters.id, id))
      .returning();
    return updatedCharacter;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    const result = await db.delete(characters).where(eq(characters.id, id)).returning();
    return result.length > 0;
  }

  // Campaign methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      dmId: campaigns.dmId,
      status: campaigns.status,
      setting: campaigns.setting,
      isAiDm: campaigns.isAiDm,
      createdAt: campaigns.createdAt
    }).from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignsByDmId(dmId: number): Promise<Campaign[]> {
    return db.select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      dmId: campaigns.dmId,
      status: campaigns.status,
      setting: campaigns.setting,
      isAiDm: campaigns.isAiDm,
      createdAt: campaigns.createdAt
    }).from(campaigns).where(eq(campaigns.dmId, dmId));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    // Make sure we only include fields that exist in the database
    const fieldsToInsert: any = {
      name: insertCampaign.name,
      description: insertCampaign.description,
      dmId: insertCampaign.dmId,
      status: insertCampaign.status || 'active',
      setting: insertCampaign.setting,
      isAiDm: insertCampaign.isAiDm !== undefined ? insertCampaign.isAiDm : false
    };
    
    // Avoid using currentTurnId which might not exist in the database yet
    
    const [campaign] = await db.insert(campaigns)
      .values(fieldsToInsert)
      .returning({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        dmId: campaigns.dmId,
        status: campaigns.status,
        setting: campaigns.setting,
        isAiDm: campaigns.isAiDm,
        createdAt: campaigns.createdAt
      });
    
    return campaign;
  }

  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    // Make sure we only update fields that exist in the database
    const fieldsToUpdate: any = {};
    
    if (campaignUpdate.name !== undefined) fieldsToUpdate.name = campaignUpdate.name;
    if (campaignUpdate.description !== undefined) fieldsToUpdate.description = campaignUpdate.description;
    if (campaignUpdate.dmId !== undefined) fieldsToUpdate.dmId = campaignUpdate.dmId;
    if (campaignUpdate.status !== undefined) fieldsToUpdate.status = campaignUpdate.status;
    if (campaignUpdate.setting !== undefined) fieldsToUpdate.setting = campaignUpdate.setting;
    if (campaignUpdate.isAiDm !== undefined) fieldsToUpdate.isAiDm = campaignUpdate.isAiDm;
    
    // Avoid using currentTurnId which might not exist in the database yet
    
    const [updatedCampaign] = await db
      .update(campaigns)
      .set(fieldsToUpdate)
      .where(eq(campaigns.id, id))
      .returning({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        dmId: campaigns.dmId,
        status: campaigns.status,
        setting: campaigns.setting,
        isAiDm: campaigns.isAiDm,
        createdAt: campaigns.createdAt
      });
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      // Delete all related records in the following order to respect foreign key constraints
      
      // 1. Delete map locations for the campaign
      await db.delete(mapLocations).where(eq(mapLocations.campaignId, id));
      console.log(`Deleted map locations for campaign ${id}`);
      
      // 2. Delete journey paths for the campaign
      await db.delete(journeyPaths).where(eq(journeyPaths.campaignId, id));
      console.log(`Deleted journey paths for campaign ${id}`);
      
      // 3. Delete campaign world map
      await db.delete(campaignWorldMaps).where(eq(campaignWorldMaps.campaignId, id));
      console.log(`Deleted world map for campaign ${id}`);
      
      // 4. Delete game logs
      await db.delete(gameLogs).where(eq(gameLogs.campaignId, id));
      console.log(`Deleted game logs for campaign ${id}`);
      
      // 5. Delete chat messages
      await db.delete(chatMessages).where(eq(chatMessages.campaignId, id));
      console.log(`Deleted chat messages for campaign ${id}`);
      
      // 6. Delete NPCs
      await db.delete(npcs).where(eq(npcs.campaignId, id));
      console.log(`Deleted NPCs for campaign ${id}`);
      
      // 7. Delete quests and adventures
      // First get all adventures for this campaign
      const campaignAdventures = await this.getAdventuresByCampaignId(id);
      
      // Delete quests for each adventure
      for (const adventure of campaignAdventures) {
        await db.delete(quests).where(eq(quests.adventureId, adventure.id));
      }
      console.log(`Deleted quests for campaign ${id}`);
      
      // Delete adventures
      await db.delete(adventures).where(eq(adventures.campaignId, id));
      console.log(`Deleted adventures for campaign ${id}`);
      
      // 8. Delete campaign characters
      await db.delete(campaignCharacters).where(eq(campaignCharacters.campaignId, id));
      console.log(`Deleted campaign characters for campaign ${id}`);
      
      // 9. Delete campaign invitations
      await db.delete(campaignInvitations).where(eq(campaignInvitations.campaignId, id));
      console.log(`Deleted campaign invitations for campaign ${id}`);
      
      // Finally, delete the campaign itself
      const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
      console.log(`Campaign ${id} deleted successfully`);
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false; // Return false instead of throwing, so the API can handle this gracefully
    }
  }

  // Campaign Character methods
  async addCharacterToCampaign(insertCampaignCharacter: InsertCampaignCharacter): Promise<CampaignCharacter> {
    const [campaignCharacter] = await db
      .insert(campaignCharacters)
      .values(insertCampaignCharacter)
      .returning();
    return campaignCharacter;
  }

  async getCampaignCharacters(campaignId: number): Promise<CampaignCharacter[]> {
    return db
      .select()
      .from(campaignCharacters)
      .where(eq(campaignCharacters.campaignId, campaignId));
  }

  async removeCharacterFromCampaign(campaignId: number, characterId: number): Promise<boolean> {
    const result = await db
      .delete(campaignCharacters)
      .where(
        and(
          eq(campaignCharacters.campaignId, campaignId),
          eq(campaignCharacters.characterId, characterId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Adventure methods
  async getAdventure(id: number): Promise<Adventure | undefined> {
    const [adventure] = await db.select().from(adventures).where(eq(adventures.id, id));
    return adventure;
  }

  async getAdventuresByCampaignId(campaignId: number): Promise<Adventure[]> {
    return db.select().from(adventures).where(eq(adventures.campaignId, campaignId));
  }

  async createAdventure(insertAdventure: InsertAdventure): Promise<Adventure> {
    const [adventure] = await db.insert(adventures).values(insertAdventure).returning();
    return adventure;
  }

  async updateAdventure(id: number, adventureUpdate: Partial<Adventure>): Promise<Adventure | undefined> {
    const [updatedAdventure] = await db
      .update(adventures)
      .set(adventureUpdate)
      .where(eq(adventures.id, id))
      .returning();
    return updatedAdventure;
  }

  // NPC methods
  async getNpc(id: number): Promise<Npc | undefined> {
    const [npc] = await db.select().from(npcs).where(eq(npcs.id, id));
    return npc;
  }

  async getNpcsByCampaignId(campaignId: number): Promise<Npc[]> {
    return db.select().from(npcs).where(eq(npcs.campaignId, campaignId));
  }

  async createNpc(insertNpc: InsertNpc): Promise<Npc> {
    const [npc] = await db.insert(npcs).values(insertNpc).returning();
    return npc;
  }

  // Quest methods
  async getQuest(id: number): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    return quest;
  }

  async getQuestsByAdventureId(adventureId: number): Promise<Quest[]> {
    return db.select().from(quests).where(eq(quests.adventureId, adventureId));
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const [quest] = await db.insert(quests).values(insertQuest).returning();
    return quest;
  }

  async updateQuest(id: number, questUpdate: Partial<Quest>): Promise<Quest | undefined> {
    const [updatedQuest] = await db
      .update(quests)
      .set(questUpdate)
      .where(eq(quests.id, id))
      .returning();
    return updatedQuest;
  }

  // Game Log methods
  async getGameLogsByCampaignId(campaignId: number, limit: number = 50): Promise<GameLog[]> {
    try {
      const logs = await db
        .select()
        .from(gameLogs)
        .where(eq(gameLogs.campaignId, campaignId))
        .orderBy(desc(gameLogs.timestamp))
        .limit(limit);
      
      // Add empty metadata field if it's not in the database
      return logs.map(log => ({
        ...log,
        metadata: log.metadata || null
      }));
    } catch (error) {
      console.error("Error in getGameLogsByCampaignId:", error);
      return [];
    }
  }

  async createGameLog(insertGameLog: InsertGameLog): Promise<GameLog> {
    try {
      // Remove metadata field if it exists (because DB doesn't have this column yet)
      const { metadata, ...gameLogData } = insertGameLog as any;
      
      const [gameLog] = await db.insert(gameLogs).values(gameLogData).returning();
      
      // Add back metadata for the response
      return {
        ...gameLog,
        metadata: metadata || null
      };
    } catch (error) {
      console.error("Error in createGameLog:", error);
      throw error;
    }
  }

  // Friendship methods
  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      );
    return friendship;
  }

  async getFriendshipsByUserId(userId: number): Promise<Friendship[]> {
    // Get friendships where the user is either the initiator or the recipient
    const sentFriendships = await db
      .select()
      .from(friendships)
      .where(eq(friendships.userId, userId));
    
    const receivedFriendships = await db
      .select()
      .from(friendships)
      .where(eq(friendships.friendId, userId));
    
    return [...sentFriendships, ...receivedFriendships];
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const [newFriendship] = await db
      .insert(friendships)
      .values(friendship)
      .returning();
    return newFriendship;
  }

  async updateFriendship(userId: number, friendId: number, status: string): Promise<Friendship | undefined> {
    const [updatedFriendship] = await db
      .update(friendships)
      .set({ status })
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      )
      .returning();
    return updatedFriendship;
  }

  async deleteFriendship(userId: number, friendId: number): Promise<boolean> {
    const result = await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // User session methods
  async getUserSession(userId: number): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));
    return session;
  }

  async createOrUpdateUserSession(session: InsertUserSession): Promise<UserSession> {
    // Check if session exists for this user
    const existing = await this.getUserSession(session.userId);
    
    if (existing) {
      // Update existing session
      const [updatedSession] = await db
        .update(userSessions)
        .set({
          lastActive: new Date(),
          status: session.status
        })
        .where(eq(userSessions.userId, session.userId))
        .returning();
      return updatedSession;
    } else {
      // Create new session
      const [newSession] = await db
        .insert(userSessions)
        .values(session)
        .returning();
      return newSession;
    }
  }

  async updateUserStatus(userId: number, updates: Partial<UserSession>): Promise<UserSession | undefined> {
    const [updatedSession] = await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.userId, userId))
      .returning();
    return updatedSession;
  }

  async getOnlineUsers(): Promise<UserSession[]> {
    // Consider users who were active in the last 5 minutes as online
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    return db
      .select()
      .from(userSessions)
      .where(
        sql`${userSessions.lastActive} > ${fiveMinutesAgo}` 
      );
  }

  async getLookingForPartyUsers(): Promise<UserSession[]> {
    // Get users who are looking for a party and are online
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    return db
      .select()
      .from(userSessions)
      .where(
        and(
          sql`${userSessions.lastActive} > ${fiveMinutesAgo}`,
          eq(userSessions.lookingForParty, true)
        )
      );
  }

  async getLookingForFriendsUsers(): Promise<UserSession[]> {
    // Get users who are looking for friends and are online
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    return db
      .select()
      .from(userSessions)
      .where(
        and(
          sql`${userSessions.lastActive} > ${fiveMinutesAgo}`,
          eq(userSessions.lookingForFriends, true)
        )
      );
  }

  // Chat message methods
  async getChatMessagesByCampaignId(campaignId: number, limit: number = 50): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.campaignId, campaignId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Campaign invitation methods
  async getCampaignInvitation(id: number): Promise<CampaignInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(campaignInvitations)
      .where(eq(campaignInvitations.id, id));
    return invitation;
  }

  async getCampaignInvitationsByUserId(userId: number): Promise<CampaignInvitation[]> {
    return db
      .select()
      .from(campaignInvitations)
      .where(eq(campaignInvitations.inviteeId, userId));
  }

  async getCampaignInvitationsByCampaignId(campaignId: number): Promise<CampaignInvitation[]> {
    return db
      .select()
      .from(campaignInvitations)
      .where(eq(campaignInvitations.campaignId, campaignId));
  }

  async createCampaignInvitation(invitation: InsertCampaignInvitation): Promise<CampaignInvitation> {
    const [newInvitation] = await db
      .insert(campaignInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async updateCampaignInvitation(id: number, status: string): Promise<CampaignInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(campaignInvitations)
      .set({ status })
      .where(eq(campaignInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async deleteCampaignInvitation(id: number): Promise<boolean> {
    const result = await db
      .delete(campaignInvitations)
      .where(eq(campaignInvitations.id, id))
      .returning();
    return result.length > 0;
  }

  // Implement permissions method
  async isPlayerInCampaign(userId: number, campaignId: number): Promise<boolean> {
    try {
      // Get all characters owned by this user
      const userCharacters = await this.getCharactersByUserId(userId);
      if (!userCharacters.length) return false;
      
      // Get all character IDs in this campaign
      const campaignCharacters = await this.getCampaignCharacters(campaignId);
      if (!campaignCharacters.length) return false;
      
      // Check if any of the user's characters are in the campaign
      const userCharacterIds = userCharacters.map(char => char.id);
      const campaignCharacterIds = campaignCharacters.map(cc => cc.characterId);
      
      return userCharacterIds.some(id => campaignCharacterIds.includes(id));
    } catch (error) {
      console.error("Error checking if player is in campaign:", error);
      return false;
    }
  }
  
  // Implement Party Planning methods
  async getPartyPlan(id: number): Promise<PartyPlan | undefined> {
    try {
      const [plan] = await db.select().from(partyPlans).where(eq(partyPlans.id, id));
      return plan;
    } catch (error) {
      console.error("Error getting party plan:", error);
      return undefined;
    }
  }
  
  async getPartyPlansByCampaignId(campaignId: number): Promise<PartyPlan[]> {
    try {
      return await db
        .select()
        .from(partyPlans)
        .where(eq(partyPlans.campaignId, campaignId))
        .orderBy(desc(partyPlans.createdAt));
    } catch (error) {
      console.error("Error getting party plans for campaign:", error);
      return [];
    }
  }
  
  async getPartyPlanWithItems(id: number): Promise<(PartyPlan & { items: PartyPlanItem[] }) | undefined> {
    try {
      const plan = await this.getPartyPlan(id);
      if (!plan) return undefined;
      
      const items = await this.getPartyPlanItemsByPlanId(id);
      
      return {
        ...plan,
        items
      };
    } catch (error) {
      console.error("Error getting party plan with items:", error);
      return undefined;
    }
  }
  
  async createPartyPlan(plan: InsertPartyPlan): Promise<PartyPlan> {
    try {
      const [newPlan] = await db.insert(partyPlans).values(plan).returning();
      return newPlan;
    } catch (error) {
      console.error("Error creating party plan:", error);
      throw error;
    }
  }
  
  async updatePartyPlan(id: number, updates: Partial<PartyPlan>): Promise<PartyPlan | undefined> {
    try {
      const [updatedPlan] = await db
        .update(partyPlans)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(partyPlans.id, id))
        .returning();
      return updatedPlan;
    } catch (error) {
      console.error("Error updating party plan:", error);
      return undefined;
    }
  }
  
  async deletePartyPlan(id: number): Promise<boolean> {
    try {
      const result = await db.delete(partyPlans).where(eq(partyPlans.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting party plan:", error);
      return false;
    }
  }
  
  // Implement Party Plan Item methods
  async getPartyPlanItem(id: number): Promise<PartyPlanItem | undefined> {
    try {
      const [item] = await db.select().from(partyPlanItems).where(eq(partyPlanItems.id, id));
      return item;
    } catch (error) {
      console.error("Error getting party plan item:", error);
      return undefined;
    }
  }
  
  async getPartyPlanItemsByPlanId(planId: number): Promise<PartyPlanItem[]> {
    try {
      return await db
        .select()
        .from(partyPlanItems)
        .where(eq(partyPlanItems.planId, planId))
        .orderBy(partyPlanItems.position);
    } catch (error) {
      console.error("Error getting party plan items:", error);
      return [];
    }
  }
  
  async createPartyPlanItem(item: InsertPartyPlanItem): Promise<PartyPlanItem> {
    try {
      const [newItem] = await db.insert(partyPlanItems).values(item).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating party plan item:", error);
      throw error;
    }
  }
  
  async updatePartyPlanItem(id: number, updates: Partial<PartyPlanItem>): Promise<PartyPlanItem | undefined> {
    try {
      const [updatedItem] = await db
        .update(partyPlanItems)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(partyPlanItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error("Error updating party plan item:", error);
      return undefined;
    }
  }
  
  async deletePartyPlanItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(partyPlanItems).where(eq(partyPlanItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting party plan item:", error);
      return false;
    }
  }
  
  // Implement Party Plan Comment methods
  async getPartyPlanCommentsByItemId(itemId: number): Promise<PartyPlanComment[]> {
    try {
      return await db
        .select()
        .from(partyPlanComments)
        .where(eq(partyPlanComments.itemId, itemId))
        .orderBy(partyPlanComments.createdAt);
    } catch (error) {
      console.error("Error getting party plan comments:", error);
      return [];
    }
  }
  
  async createPartyPlanComment(comment: InsertPartyPlanComment): Promise<PartyPlanComment> {
    try {
      const [newComment] = await db.insert(partyPlanComments).values(comment).returning();
      return newComment;
    } catch (error) {
      console.error("Error creating party plan comment:", error);
      throw error;
    }
  }
  
  // Implement Party Plan Item methods
  async getPartyPlanItem(id: number): Promise<PartyPlanItem | undefined> {
    try {
      const [item] = await db.select().from(partyPlanItems).where(eq(partyPlanItems.id, id));
      return item;
    } catch (error) {
      console.error("Error getting party plan item:", error);
      return undefined;
    }
  }
  
  async getPartyPlanItemsByPlanId(planId: number): Promise<PartyPlanItem[]> {
    try {
      return await db
        .select()
        .from(partyPlanItems)
        .where(eq(partyPlanItems.planId, planId))
        .orderBy(partyPlanItems.position);
    } catch (error) {
      console.error("Error getting party plan items:", error);
      return [];
    }
  }
  
  async createPartyPlanItem(item: InsertPartyPlanItem): Promise<PartyPlanItem> {
    try {
      // Update the parent plan's updatedAt timestamp
      await this.updatePartyPlan(item.planId, {});
      
      const [newItem] = await db.insert(partyPlanItems).values(item).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating party plan item:", error);
      throw error;
    }
  }
  
  async updatePartyPlanItem(id: number, updates: Partial<PartyPlanItem>): Promise<PartyPlanItem | undefined> {
    try {
      // Get the item first to get the plan ID
      const item = await this.getPartyPlanItem(id);
      if (!item) return undefined;
      
      // Always update the updatedAt field
      const updatedData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Update the parent plan's updatedAt timestamp
      await this.updatePartyPlan(item.planId, {});
      
      const [updatedItem] = await db
        .update(partyPlanItems)
        .set(updatedData)
        .where(eq(partyPlanItems.id, id))
        .returning();
      
      return updatedItem;
    } catch (error) {
      console.error("Error updating party plan item:", error);
      return undefined;
    }
  }
  
  async deletePartyPlanItem(id: number): Promise<boolean> {
    try {
      // Get the item first to get the plan ID
      const item = await this.getPartyPlanItem(id);
      if (!item) return false;
      
      // Update the parent plan's updatedAt timestamp
      await this.updatePartyPlan(item.planId, {});
      
      // Delete all comments for this item
      await db.delete(partyPlanComments).where(eq(partyPlanComments.itemId, id));
      
      // Delete the item
      const result = await db.delete(partyPlanItems).where(eq(partyPlanItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting party plan item:", error);
      return false;
    }
  }
  
  // Implement Party Plan Comment methods
  async getPartyPlanCommentsByItemId(itemId: number): Promise<PartyPlanComment[]> {
    try {
      return await db
        .select()
        .from(partyPlanComments)
        .where(eq(partyPlanComments.itemId, itemId))
        .orderBy(partyPlanComments.createdAt);
    } catch (error) {
      console.error("Error getting party plan comments:", error);
      return [];
    }
  }
  
  async createPartyPlanComment(comment: InsertPartyPlanComment): Promise<PartyPlanComment> {
    try {
      // Get the item first to get the plan ID
      const item = await this.getPartyPlanItem(comment.itemId);
      if (!item) throw new Error("Item not found");
      
      // Update the parent plan's updatedAt timestamp
      await this.updatePartyPlan(item.planId, {});
      
      const [newComment] = await db.insert(partyPlanComments).values(comment).returning();
      return newComment;
    } catch (error) {
      console.error("Error creating party plan comment:", error);
      throw error;
    }
  }

  // Execute raw SQL query
  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    try {
      return pool.query(query, params);
    } catch (error) {
      console.error("Error executing raw query:", error);
      throw error;
    }
  }
  
  // Get all campaigns for admin dashboard
  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      // Use explicit column selection to avoid issues with missing columns
      return db.select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        dmId: campaigns.dmId,
        status: campaigns.status,
        setting: campaigns.setting,
        isAiDm: campaigns.isAiDm,
        createdAt: campaigns.createdAt
      }).from(campaigns);
    } catch (error) {
      console.error("Error getting all campaigns:", error);
      return [];
    }
  }
  
  // Get all players in a campaign
  async getCampaignPlayers(campaignId: number): Promise<any[]> {
    try {
      const campaignChars = await this.getCampaignCharacters(campaignId);
      
      if (campaignChars.length === 0) {
        return [];
      }
      
      // Extract unique user IDs
      const characterIds = campaignChars.map(cc => cc.characterId);
      
      // Get the characters
      const characters = await db
        .select()
        .from(characters)
        .where(sql`${characters.id} IN (${characterIds.join(',')})`);
      
      // Get unique user IDs
      const userIds = [...new Set(characters.map(c => c.userId))];
      
      // Get the users
      const campaignUsers = await db
        .select()
        .from(users)
        .where(sql`${users.id} IN (${userIds.join(',')})`);
      
      return campaignUsers;
    } catch (error) {
      console.error("Error getting campaign players:", error);
      return [];
    }
  }
  
  // Get session count for a campaign
  async getSessionCount(campaignId: number): Promise<number> {
    try {
      const sessionCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(gameLogs)
        .where(eq(gameLogs.campaignId, campaignId))
        .groupBy(gameLogs.campaignId);
      
      return sessionCount.length > 0 ? parseInt(sessionCount[0].count as string) : 0;
    } catch (error) {
      console.error("Error getting session count:", error);
      return 0;
    }
  }
  
  // Implement admin methods
  async getAllUsers(): Promise<User[]> {
    try {
      return db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  
  async updateUserRole(userId: number, role: "user" | "admin"): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user role:", error);
      return undefined;
    }
  }
  
  async getSystemStats(): Promise<any[]> {
    try {
      return db.select().from(systemStats).orderBy(desc(systemStats.timestamp));
    } catch (error) {
      console.error("Error getting system stats:", error);
      return [];
    }
  }
  
  async createSystemStat(stat: any): Promise<any> {
    try {
      const [newStat] = await db.insert(systemStats).values(stat).returning();
      return newStat;
    } catch (error) {
      console.error("Error creating system stat:", error);
      throw error;
    }
  }
  
  async getUserMessages(userId: number): Promise<any[]> {
    try {
      return db.select().from(userMessages)
        .where(eq(userMessages.recipientId, userId))
        .orderBy(desc(userMessages.sentAt));
    } catch (error) {
      console.error("Error getting user messages:", error);
      return [];
    }
  }
  
  async createUserMessage(message: any): Promise<any> {
    try {
      const [newMessage] = await db.insert(userMessages).values(message).returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating user message:", error);
      throw error;
    }
  }
  
  // Implement Tavern Notice Board methods
  async getTavernNotices(): Promise<any[]> {
    try {
      return db.select().from(tavernNotices)
        .where(
          sql`${tavernNotices.expiresAt} IS NULL OR ${tavernNotices.expiresAt} > NOW()`
        )
        .orderBy(desc(tavernNotices.createdAt));
    } catch (error) {
      console.error("Error getting tavern notices:", error);
      return [];
    }
  }
  
  async getTavernNoticeById(id: number): Promise<any | undefined> {
    try {
      const [notice] = await db.select().from(tavernNotices).where(eq(tavernNotices.id, id));
      return notice;
    } catch (error) {
      console.error("Error getting tavern notice:", error);
      return undefined;
    }
  }
  
  async createTavernNotice(notice: any): Promise<any> {
    try {
      const [newNotice] = await db.insert(tavernNotices).values(notice).returning();
      return newNotice;
    } catch (error) {
      console.error("Error creating tavern notice:", error);
      throw error;
    }
  }
  
  async updateTavernNotice(id: number, notice: any): Promise<any | undefined> {
    try {
      const [updatedNotice] = await db
        .update(tavernNotices)
        .set(notice)
        .where(eq(tavernNotices.id, id))
        .returning();
      return updatedNotice;
    } catch (error) {
      console.error("Error updating tavern notice:", error);
      return undefined;
    }
  }
  
  async deleteTavernNotice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(tavernNotices).where(eq(tavernNotices.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting tavern notice:", error);
      return false;
    }
  }
  
  async getTavernNoticeReplies(noticeId: number): Promise<any[]> {
    try {
      return db.select().from(tavernNoticeReplies)
        .where(eq(tavernNoticeReplies.noticeId, noticeId))
        .orderBy(tavernNoticeReplies.createdAt);
    } catch (error) {
      console.error("Error getting tavern notice replies:", error);
      return [];
    }
  }
  
  async createTavernNoticeReply(reply: any): Promise<any> {
    try {
      const [newReply] = await db.insert(tavernNoticeReplies).values(reply).returning();
      return newReply;
    } catch (error) {
      console.error("Error creating tavern notice reply:", error);
      throw error;
    }
  }
  
  // Implement chat message methods
  async getChatMessages(campaignId: number): Promise<ChatMessage[]> {
    try {
      return db.select().from(chatMessages)
        .where(eq(chatMessages.campaignId, campaignId))
        .orderBy(chatMessages.timestamp);
    } catch (error) {
      console.error("Error getting chat messages:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
