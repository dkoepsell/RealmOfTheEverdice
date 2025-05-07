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
  users, characters, campaigns, campaignCharacters, adventures, npcs, quests, gameLogs,
  friendships, userSessions, chatMessages, campaignInvitations, mapLocations, journeyPaths
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
  
  // Item management methods
  addItemToCharacter(characterId: number, item: any): Promise<Character | undefined>;
  removeItemFromCharacter(characterId: number, itemIndex: number): Promise<Character | undefined>;
  transferItemBetweenCharacters(fromCharId: number, toCharId: number, itemIndex: number, quantity?: number): Promise<{from: Character, to: Character} | undefined>;
  equipItemForCharacter(characterId: number, itemIndex: number, equip: boolean): Promise<Character | undefined>;
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
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set(campaignUpdate)
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
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
}

export const storage = new DatabaseStorage();
