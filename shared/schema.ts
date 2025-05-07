import { pgTable, text, serial, integer, boolean, json, timestamp, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  isBot: boolean("is_bot").notNull().default(false),
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
  isAiDm: boolean("is_ai_dm").notNull().default(false),
  // Note: partyName field exists in schema but not in DB yet
  // partyName: text("party_name"),
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
  // Note: metadata column exists in schema but not in DB yet
  // metadata: json("metadata"),  // For storing dice roll data, JSON objects, etc.
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertGameLogSchema = createInsertSchema(gameLogs).omit({
  id: true,
  timestamp: true
});

// Friends model
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqFriendship: primaryKey({ columns: [table.userId, table.friendId] })
  };
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true
});

// User session/online status
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  lastActive: timestamp("last_active").defaultNow(),
  status: text("status").notNull().default("online"), // online, away, offline, in-game
  lookingForFriends: boolean("looking_for_friends").default(false),
  lookingForParty: boolean("looking_for_party").default(false),
  statusMessage: text("status_message")
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true
});

// Campaign Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

// Campaign Invitations
export const campaignInvitations = pgTable("campaign_invitations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  inviterId: integer("inviter_id").notNull(),
  inviteeId: integer("invitee_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  role: text("role").notNull().default("player"), // player, spectator
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCampaignInvitationSchema = createInsertSchema(campaignInvitations).omit({
  id: true,
  createdAt: true
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

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type CampaignInvitation = typeof campaignInvitations.$inferSelect;
export type InsertCampaignInvitation = z.infer<typeof insertCampaignInvitationSchema>;

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  characters: many(characters),
  campaigns: many(campaigns, { relationName: "dmCampaigns" }),
  sentFriendRequests: many(friendships),
  receivedFriendRequests: many(friendships),
  session: one(userSessions),
  sentCampaignInvitations: many(campaignInvitations),
  receivedCampaignInvitations: many(campaignInvitations)
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id]
  }),
  campaignCharacters: many(campaignCharacters)
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  dm: one(users, {
    fields: [campaigns.dmId],
    references: [users.id],
    relationName: "dmCampaigns"
  }),
  campaignCharacters: many(campaignCharacters),
  adventures: many(adventures),
  npcs: many(npcs),
  gameLogs: many(gameLogs),
  chatMessages: many(chatMessages),
  invitations: many(campaignInvitations),
  mapLocations: many(mapLocations),
  journeyPaths: many(journeyPaths),
  currentLocation: one(campaignCurrentLocations)
}));

export const campaignCharactersRelations = relations(campaignCharacters, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignCharacters.campaignId],
    references: [campaigns.id]
  }),
  character: one(characters, {
    fields: [campaignCharacters.characterId],
    references: [characters.id]
  })
}));

export const adventuresRelations = relations(adventures, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [adventures.campaignId],
    references: [campaigns.id]
  }),
  quests: many(quests)
}));

export const npcsRelations = relations(npcs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [npcs.campaignId],
    references: [campaigns.id]
  })
}));

export const questsRelations = relations(quests, ({ one }) => ({
  adventure: one(adventures, {
    fields: [quests.adventureId],
    references: [adventures.id]
  })
}));

export const gameLogsRelations = relations(gameLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [gameLogs.campaignId],
    references: [campaigns.id]
  })
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "userFriendships"
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friendUserFriendships"
  })
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
    relationName: "userSession"
  })
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [chatMessages.campaignId],
    references: [campaigns.id]
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id]
  })
}));

export const campaignInvitationsRelations = relations(campaignInvitations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignInvitations.campaignId],
    references: [campaigns.id]
  }),
  inviter: one(users, {
    fields: [campaignInvitations.inviterId],
    references: [users.id],
    relationName: "inviterInvitations"
  }),
  invitee: one(users, {
    fields: [campaignInvitations.inviteeId],
    references: [users.id],
    relationName: "inviteeInvitations"
  })
}));

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
  inventory: Array<{
    slot: number;
    name: string;
    description: string;
    quantity: number;
    weight?: number; 
    value?: number;
    isEquipped: boolean;
    type: "weapon" | "armor" | "potion" | "scroll" | "tool" | "trinket" | "quest" | "miscellaneous";
    properties?: string[];
    rarity?: "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact";
  }>;
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

// Map Locations model
export const mapLocations = pgTable("map_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  notes: text("notes"),
  position: json("position").$type<[number, number]>().notNull(),
  discovered: boolean("discovered").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  iconUrl: text("icon_url"),
  quests: json("quests").$type<Array<{
    id: number;
    name: string;
    completed: boolean;
  }>>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const mapLocationsRelations = relations(mapLocations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [mapLocations.campaignId],
    references: [campaigns.id]
  })
}));

export type MapLocation = typeof mapLocations.$inferSelect;
export type InsertMapLocation = z.infer<typeof insertMapLocationSchema>;
export const insertMapLocationSchema = createInsertSchema(mapLocations).omit({
  id: true,
  createdAt: true
});

// Journey Paths model
export const journeyPaths = pgTable("journey_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  points: json("points").$type<[number, number][]>().notNull(),
  color: text("color").notNull().default("#3b82f6"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const journeyPathsRelations = relations(journeyPaths, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [journeyPaths.campaignId],
    references: [campaigns.id]
  })
}));

export type JourneyPath = typeof journeyPaths.$inferSelect;
export type InsertJourneyPath = z.infer<typeof insertJourneyPathSchema>;
export const insertJourneyPathSchema = createInsertSchema(journeyPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Campaign Current Location model
export const campaignCurrentLocations = pgTable("campaign_current_locations", {
  campaignId: integer("campaign_id").references(() => campaigns.id).primaryKey(),
  position: json("position").$type<[number, number]>().notNull(),
  locationName: text("location_name"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const campaignCurrentLocationsRelations = relations(campaignCurrentLocations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignCurrentLocations.campaignId],
    references: [campaigns.id]
  })
}));

export type CampaignCurrentLocation = typeof campaignCurrentLocations.$inferSelect;
export type InsertCampaignCurrentLocation = z.infer<typeof insertCampaignCurrentLocationSchema>;
export const insertCampaignCurrentLocationSchema = createInsertSchema(campaignCurrentLocations).omit({
  updatedAt: true
});
