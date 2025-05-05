import { 
  User, InsertUser, 
  Character, InsertCharacter, 
  Campaign, InsertCampaign,
  CampaignCharacter, InsertCampaignCharacter,
  Adventure, InsertAdventure,
  Npc, InsertNpc,
  Quest, InsertQuest,
  GameLog, InsertGameLog,
  Friendship, InsertFriendship,
  UserSession, InsertUserSession,
  CampaignInvitation, InsertCampaignInvitation,
  users, characters, campaigns, campaignCharacters, adventures, npcs, quests, gameLogs,
  friendships, userSessions, campaignInvitations
} from "@shared/schema";
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
}

export class DatabaseStorage implements IStorage {
  sessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
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
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignsByDmId(dmId: number): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.dmId, dmId));
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
    return db
      .select()
      .from(gameLogs)
      .where(eq(gameLogs.campaignId, campaignId))
      .orderBy(desc(gameLogs.timestamp))
      .limit(limit);
  }

  async createGameLog(insertGameLog: InsertGameLog): Promise<GameLog> {
    const [gameLog] = await db.insert(gameLogs).values(insertGameLog).returning();
    return gameLog;
  }
}

export const storage = new DatabaseStorage();
