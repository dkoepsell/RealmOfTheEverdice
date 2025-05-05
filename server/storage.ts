import { 
  User, InsertUser, 
  Character, InsertCharacter, 
  Campaign, InsertCampaign,
  CampaignCharacter, InsertCampaignCharacter,
  Adventure, InsertAdventure,
  Npc, InsertNpc,
  Quest, InsertQuest,
  GameLog, InsertGameLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private characters: Map<number, Character>;
  private campaigns: Map<number, Campaign>;
  private campaignCharacters: Map<number, CampaignCharacter>;
  private adventures: Map<number, Adventure>;
  private npcs: Map<number, Npc>;
  private quests: Map<number, Quest>;
  private gameLogs: Map<number, GameLog>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private characterIdCounter: number = 1;
  private campaignIdCounter: number = 1;
  private campaignCharacterIdCounter: number = 1;
  private adventureIdCounter: number = 1;
  private npcIdCounter: number = 1;
  private questIdCounter: number = 1;
  private gameLogIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.characters = new Map();
    this.campaigns = new Map();
    this.campaignCharacters = new Map();
    this.adventures = new Map();
    this.npcs = new Map();
    this.quests = new Map();
    this.gameLogs = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Character methods
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (character) => character.userId === userId
    );
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.characterIdCounter++;
    const createdAt = new Date();
    const character: Character = { ...insertCharacter, id, createdAt };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: number, characterUpdate: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...characterUpdate };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    return this.characters.delete(id);
  }

  // Campaign methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByDmId(dmId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.dmId === dmId
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignIdCounter++;
    const createdAt = new Date();
    const campaign: Campaign = { ...insertCampaign, id, createdAt };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...campaignUpdate };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Campaign Character methods
  async addCharacterToCampaign(insertCampaignCharacter: InsertCampaignCharacter): Promise<CampaignCharacter> {
    const id = this.campaignCharacterIdCounter++;
    const campaignCharacter: CampaignCharacter = { ...insertCampaignCharacter, id };
    this.campaignCharacters.set(id, campaignCharacter);
    return campaignCharacter;
  }

  async getCampaignCharacters(campaignId: number): Promise<CampaignCharacter[]> {
    return Array.from(this.campaignCharacters.values()).filter(
      (cc) => cc.campaignId === campaignId
    );
  }

  async removeCharacterFromCampaign(campaignId: number, characterId: number): Promise<boolean> {
    const campaignCharacterEntry = Array.from(this.campaignCharacters.entries()).find(
      ([_, cc]) => cc.campaignId === campaignId && cc.characterId === characterId
    );
    
    if (!campaignCharacterEntry) return false;
    return this.campaignCharacters.delete(campaignCharacterEntry[0]);
  }

  // Adventure methods
  async getAdventure(id: number): Promise<Adventure | undefined> {
    return this.adventures.get(id);
  }

  async getAdventuresByCampaignId(campaignId: number): Promise<Adventure[]> {
    return Array.from(this.adventures.values()).filter(
      (adventure) => adventure.campaignId === campaignId
    );
  }

  async createAdventure(insertAdventure: InsertAdventure): Promise<Adventure> {
    const id = this.adventureIdCounter++;
    const createdAt = new Date();
    const adventure: Adventure = { ...insertAdventure, id, createdAt };
    this.adventures.set(id, adventure);
    return adventure;
  }

  async updateAdventure(id: number, adventureUpdate: Partial<Adventure>): Promise<Adventure | undefined> {
    const adventure = this.adventures.get(id);
    if (!adventure) return undefined;
    
    const updatedAdventure = { ...adventure, ...adventureUpdate };
    this.adventures.set(id, updatedAdventure);
    return updatedAdventure;
  }

  // NPC methods
  async getNpc(id: number): Promise<Npc | undefined> {
    return this.npcs.get(id);
  }

  async getNpcsByCampaignId(campaignId: number): Promise<Npc[]> {
    return Array.from(this.npcs.values()).filter(
      (npc) => npc.campaignId === campaignId
    );
  }

  async createNpc(insertNpc: InsertNpc): Promise<Npc> {
    const id = this.npcIdCounter++;
    const npc: Npc = { ...insertNpc, id };
    this.npcs.set(id, npc);
    return npc;
  }

  // Quest methods
  async getQuest(id: number): Promise<Quest | undefined> {
    return this.quests.get(id);
  }

  async getQuestsByAdventureId(adventureId: number): Promise<Quest[]> {
    return Array.from(this.quests.values()).filter(
      (quest) => quest.adventureId === adventureId
    );
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const id = this.questIdCounter++;
    const quest: Quest = { ...insertQuest, id };
    this.quests.set(id, quest);
    return quest;
  }

  async updateQuest(id: number, questUpdate: Partial<Quest>): Promise<Quest | undefined> {
    const quest = this.quests.get(id);
    if (!quest) return undefined;
    
    const updatedQuest = { ...quest, ...questUpdate };
    this.quests.set(id, updatedQuest);
    return updatedQuest;
  }

  // Game Log methods
  async getGameLogsByCampaignId(campaignId: number, limit: number = 50): Promise<GameLog[]> {
    return Array.from(this.gameLogs.values())
      .filter((log) => log.campaignId === campaignId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createGameLog(insertGameLog: InsertGameLog): Promise<GameLog> {
    const id = this.gameLogIdCounter++;
    const timestamp = new Date();
    const gameLog: GameLog = { ...insertGameLog, id, timestamp };
    this.gameLogs.set(id, gameLog);
    return gameLog;
  }
}

export const storage = new MemStorage();
