import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});

// Character model
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  race: text("race").notNull(),
  class: text("class").notNull(),
  level: integer("level").notNull().default(1),
  background: text("background"),
  appearance: text("appearance"),
  backstory: text("backstory"),
  stats: json("stats").notNull(),
  hp: integer("hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  equipment: json("equipment"),
  spells: json("spells"),
  abilities: json("abilities"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true
});

// Campaign model
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dmId: integer("dm_id").notNull(),
  status: text("status").notNull().default("active"),
  setting: text("setting"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true
});

// Campaign Character Join model
export const campaignCharacters = pgTable("campaign_characters", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  characterId: integer("character_id").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

export const insertCampaignCharacterSchema = createInsertSchema(campaignCharacters).omit({
  id: true
});

// Adventure model
export const adventures = pgTable("adventures", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertAdventureSchema = createInsertSchema(adventures).omit({
  id: true,
  createdAt: true
});

// NPC model
export const npcs = pgTable("npcs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  race: text("race"),
  class: text("class"),
  stats: json("stats"),
  isHostile: boolean("is_hostile").default(false)
});

export const insertNpcSchema = createInsertSchema(npcs).omit({
  id: true
});

// Quest model
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  adventureId: integer("adventure_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  isMainQuest: boolean("is_main_quest").default(false),
  reward: text("reward")
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true
});

// Game Log model
export const gameLogs = pgTable("game_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("narrative"),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertGameLogSchema = createInsertSchema(gameLogs).omit({
  id: true,
  timestamp: true
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type CampaignCharacter = typeof campaignCharacters.$inferSelect;
export type InsertCampaignCharacter = z.infer<typeof insertCampaignCharacterSchema>;

export type Adventure = typeof adventures.$inferSelect;
export type InsertAdventure = z.infer<typeof insertAdventureSchema>;

export type Npc = typeof npcs.$inferSelect;
export type InsertNpc = z.infer<typeof insertNpcSchema>;

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;

export type GameLog = typeof gameLogs.$inferSelect;
export type InsertGameLog = z.infer<typeof insertGameLogSchema>;

// Type definitions for character stats
export type CharacterStats = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type CharacterEquipment = {
  weapons: string[];
  armor: string;
  items: string[];
};

export type CharacterSpell = {
  name: string;
  level: number;
  description: string;
};

export type CharacterAbility = {
  name: string;
  description: string;
};
