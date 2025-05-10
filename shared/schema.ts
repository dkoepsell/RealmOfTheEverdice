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
  role: text("role").notNull().default("user"), // Can be 'user', 'admin', 'superuser'
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
  experience: integer("experience").default(0),
  milestones: json("milestones").$type<Array<{ title: string, description: string, date: string }>>(),
  achievements: json("achievements").$type<Array<{ title: string, description: string, date: string }>>(),
  progression: json("progression").$type<Array<{ 
    level: number, 
    statsIncreased: Record<string, number>,
    abilitiesGained: string[],
    date: string
  }>>(),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCharacterSchema = createInsertSchema(characters)
  .omit({
    id: true,
    createdAt: true
  })
  .partial({
    experience: true,
    milestones: true,
    achievements: true,
    progression: true
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
  currentTurnId: integer("current_turn_id"),
  worldId: integer("world_id").references(() => everdiceWorld.id),
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
  isActive: boolean("is_active").notNull().default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  turnStatus: text("turn_status").notNull().default("waiting"), // waiting, active, completed, skipped
  isZombieMode: boolean("is_zombie_mode").notNull().default(false),
  zombieModeSince: timestamp("zombie_mode_since"),
  canTakeDamage: boolean("can_take_damage").notNull().default(true)
});

export const insertCampaignCharacterSchema = createInsertSchema(campaignCharacters).omit({
  id: true,
  lastActiveAt: true,
  turnStatus: true,
  isZombieMode: true,
  zombieModeSince: true,
  canTakeDamage: true
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
  receivedCampaignInvitations: many(campaignInvitations),
  createdPlans: many(partyPlans, { relationName: "createdPlans" }),
  assignedItems: many(partyPlanItems, { relationName: "assignedItems" }),
  planComments: many(partyPlanComments),
  tavernNotices: many(tavernNotices),
  tavernNoticeReplies: many(tavernNoticeReplies),
  sentMessages: many(userMessages, { relationName: "sentMessages" }),
  receivedMessages: many(userMessages, { relationName: "receivedMessages" }),
  systemStats: many(systemStats)
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id]
  }),
  campaignCharacters: many(campaignCharacters)
}));

// Everdice World (the superworld containing all campaigns)
export const everdiceWorld = pgTable("everdice_world", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Everdice"),
  mapUrl: text("map_url"),
  description: text("description"),
  lore: text("lore"),
  continents: json("continents").$type<Array<{
    id: string;
    name: string;
    description: string;
    position: [number, number]; // Center point of the continent
    bounds: [[number, number], [number, number]]; // Northeast and Southwest corners
  }>>(),
  metadata: json("metadata"),
  isActive: boolean("is_active").default(true),
  isMainWorld: boolean("is_main_world").default(false),
  // createdBy: integer("created_by"), // ID of the admin who created this world - column doesn't exist in DB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertEverdiceWorldSchema = createInsertSchema(everdiceWorld).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true
});

// World Access (which users have access to which worlds)
export const worldAccess = pgTable("world_access", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull().references(() => everdiceWorld.id),
  userId: integer("user_id").notNull().references(() => users.id),
  accessLevel: text("access_level").notNull().default("player"), // admin, player, viewer
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqUserWorld: primaryKey({ columns: [table.worldId, table.userId] })
  };
});

export const insertWorldAccessSchema = createInsertSchema(worldAccess).omit({
  id: true,
  createdAt: true
});

export type EverdiceWorld = typeof everdiceWorld.$inferSelect;
export type InsertEverdiceWorld = z.infer<typeof insertEverdiceWorldSchema>;
export type WorldAccess = typeof worldAccess.$inferSelect;
export type InsertWorldAccess = z.infer<typeof insertWorldAccessSchema>;

// Campaign Turns System (for asynchronous play)
export const campaignTurns = pgTable("campaign_turns", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  currentPlayerId: integer("current_player_id").references(() => users.id),
  turnNumber: integer("turn_number").notNull().default(1),
  turnStatus: text("turn_status").notNull().default("active"), // active, completed, skipped
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  actionDescription: text("action_description"),
  timeoutInMinutes: integer("timeout_in_minutes").default(1440), // Default: 24 hours in minutes
  lastReminderSent: timestamp("last_reminder_sent"),
  zombieModeEnabled: boolean("zombie_mode_enabled").notNull().default(true),
  zombieModeActivationMinutes: integer("zombie_mode_activation_minutes").default(2880), // Default: 48 hours in minutes
  metadata: json("metadata")  // Additional turn-related data
});

export const insertCampaignTurnSchema = createInsertSchema(campaignTurns).omit({
  id: true,
  startedAt: true,
  endedAt: true
});

export const campaignTurnsRelations = relations(campaignTurns, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignTurns.campaignId],
    references: [campaigns.id]
  }),
  currentPlayer: one(users, {
    fields: [campaignTurns.currentPlayerId],
    references: [users.id]
  }),
  notifications: many(turnNotifications),
  timeMarks: many(timeMarks)
}));

// Turn Notifications
export const turnNotifications = pgTable("turn_notifications", {
  id: serial("id").primaryKey(),
  turnId: integer("turn_id").notNull().references(() => campaignTurns.id),
  userId: integer("user_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull().default("turn_alert"), // turn_alert, turn_reminder, etc.
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
});

export const insertTurnNotificationSchema = createInsertSchema(turnNotifications).omit({
  id: true,
  createdAt: true,
  readAt: true
});

// Turn Order (who goes next)
export const turnOrder = pgTable("turn_order", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  playerId: integer("player_id").notNull().references(() => users.id),
  position: integer("position").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    uniqPlayerCampaign: primaryKey({ columns: [table.campaignId, table.playerId] })
  };
});

export const insertTurnOrderSchema = createInsertSchema(turnOrder).omit({
  id: true,
  createdAt: true
});

// Campaign World Maps model (now connected to Everdice World)
export const campaignWorldMaps = pgTable("campaign_world_maps", {
  campaignId: integer("campaign_id").references(() => campaigns.id).primaryKey(),
  mapUrl: text("map_url").notNull(),
  continentId: text("continent_id"), // References a continent in everdiceWorld.continents
  regionName: text("region_name"),
  position: json("position").$type<[number, number]>(), // Position on the Everdice world map
  bounds: json("bounds").$type<[[number, number], [number, number]]>(), // Area this campaign covers on the Everdice map
  metadata: json("metadata"),  // For storing world data details
  generatedAt: timestamp("generated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  dm: one(users, {
    fields: [campaigns.dmId],
    references: [users.id],
    relationName: "dmCampaigns"
  }),
  everdiceWorld: one(everdiceWorld, {
    fields: [campaigns.worldId],
    references: [everdiceWorld.id]
  }),
  campaignCharacters: many(campaignCharacters),
  adventures: many(adventures),
  npcs: many(npcs),
  gameLogs: many(gameLogs),
  chatMessages: many(chatMessages),
  invitations: many(campaignInvitations),
  mapLocations: many(mapLocations),
  journeyPaths: many(journeyPaths),
  partyPlans: many(partyPlans),
  currentLocation: one(campaignCurrentLocations),
  worldMap: one(campaignWorldMaps)
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
  apparel: {
    head?: string;
    chest?: string;
    legs?: string;
    feet?: string;
    hands?: string;
    back?: string;
    neck?: string;
    finger?: string;
    waist?: string;
  };
  items: string[];
  inventory: Array<{
    slot: number;
    name: string;
    description: string;
    quantity: number;
    weight?: number; 
    value?: number;
    isEquipped: boolean;
    type: "weapon" | "armor" | "apparel" | "potion" | "scroll" | "tool" | "trinket" | "quest" | "miscellaneous";
    apparelSlot?: "head" | "chest" | "legs" | "feet" | "hands" | "back" | "neck" | "finger" | "waist";
    properties?: string[];
    rarity?: "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact";
    source?: "loot" | "crafted" | "quest" | "purchased" | "starting";
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

// World Map types
export type CampaignWorldMap = typeof campaignWorldMaps.$inferSelect;
export type InsertCampaignWorldMap = z.infer<typeof insertCampaignWorldMapSchema>;
export const insertCampaignWorldMapSchema = createInsertSchema(campaignWorldMaps).omit({
  generatedAt: true,
  updatedAt: true
});

export const campaignWorldMapsRelations = relations(campaignWorldMaps, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignWorldMaps.campaignId],
    references: [campaigns.id]
  })
}));

// Party Planning model
export const partyPlans = pgTable("party_plans", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, completed, archived
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const partyPlanItems = pgTable("party_plan_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("task"), // task, note, resource, strategy
  status: text("status").notNull().default("pending"), // pending, in-progress, completed
  assignedToId: integer("assigned_to_id"),
  position: integer("position").notNull().default(0),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const partyPlanComments = pgTable("party_plan_comments", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const partyPlansRelations = relations(partyPlans, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [partyPlans.campaignId],
    references: [campaigns.id]
  }),
  createdBy: one(users, {
    fields: [partyPlans.createdById],
    references: [users.id]
  }),
  items: many(partyPlanItems)
}));

export const partyPlanItemsRelations = relations(partyPlanItems, ({ one, many }) => ({
  plan: one(partyPlans, {
    fields: [partyPlanItems.planId],
    references: [partyPlans.id]
  }),
  createdBy: one(users, {
    fields: [partyPlanItems.createdById],
    references: [users.id]
  }),
  assignedTo: one(users, {
    fields: [partyPlanItems.assignedToId],
    references: [users.id],
    relationName: "assignedItems"
  }),
  comments: many(partyPlanComments)
}));

export const partyPlanCommentsRelations = relations(partyPlanComments, ({ one }) => ({
  item: one(partyPlanItems, {
    fields: [partyPlanComments.itemId],
    references: [partyPlanItems.id]
  }),
  user: one(users, {
    fields: [partyPlanComments.userId],
    references: [users.id]
  })
}));

// Insert schemas for party planning
export const insertPartyPlanSchema = createInsertSchema(partyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPartyPlanItemSchema = createInsertSchema(partyPlanItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPartyPlanCommentSchema = createInsertSchema(partyPlanComments).omit({
  id: true,
  createdAt: true
});

// Type definitions for party planning
export type PartyPlan = typeof partyPlans.$inferSelect;
export type InsertPartyPlan = z.infer<typeof insertPartyPlanSchema>;

export type PartyPlanItem = typeof partyPlanItems.$inferSelect;
export type InsertPartyPlanItem = z.infer<typeof insertPartyPlanItemSchema>;

export type PartyPlanComment = typeof partyPlanComments.$inferSelect;
export type InsertPartyPlanComment = z.infer<typeof insertPartyPlanCommentSchema>;

// Tavern Notice Board
export const tavernNotices = pgTable("tavern_notices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("quest"), // quest, party_search, announcement, etc.
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});

export const insertTavernNoticeSchema = createInsertSchema(tavernNotices).omit({
  id: true,
  createdAt: true
});

export const tavernNoticeReplies = pgTable("tavern_notice_replies", {
  id: serial("id").primaryKey(),
  noticeId: integer("notice_id").notNull().references(() => tavernNotices.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertTavernNoticeReplySchema = createInsertSchema(tavernNoticeReplies).omit({
  id: true,
  createdAt: true
});

export const tavernNoticesRelations = relations(tavernNotices, ({ one, many }) => ({
  user: one(users, {
    fields: [tavernNotices.userId],
    references: [users.id]
  }),
  replies: many(tavernNoticeReplies)
}));

export const tavernNoticeRepliesRelations = relations(tavernNoticeReplies, ({ one }) => ({
  notice: one(tavernNotices, {
    fields: [tavernNoticeReplies.noticeId],
    references: [tavernNotices.id]
  }),
  user: one(users, {
    fields: [tavernNoticeReplies.userId],
    references: [users.id]
  })
}));

export type TavernNotice = typeof tavernNotices.$inferSelect;
export type InsertTavernNotice = z.infer<typeof insertTavernNoticeSchema>;
export type TavernNoticeReply = typeof tavernNoticeReplies.$inferSelect;
export type InsertTavernNoticeReply = z.infer<typeof insertTavernNoticeReplySchema>;

// Time markers for narrative flow
export const timeMarks = pgTable("time_marks", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  turnId: integer("turn_id").references(() => campaignTurns.id),
  title: text("title").notNull(),
  description: text("description"),
  markerType: text("marker_type").notNull().default("time_passage"), // time_passage, day_end, rest, combat, etc.
  timestamp: timestamp("timestamp").defaultNow(),
  gameTimestamp: text("game_timestamp"), // For tracking in-game date/time
  metadata: json("metadata") // Additional marker data
});

export const insertTimeMarkSchema = createInsertSchema(timeMarks).omit({
  id: true,
  timestamp: true
});

export const timeMarksRelations = relations(timeMarks, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [timeMarks.campaignId],
    references: [campaigns.id]
  }),
  turn: one(campaignTurns, {
    fields: [timeMarks.turnId],
    references: [campaignTurns.id]
  })
}));

export type TimeMark = typeof timeMarks.$inferSelect;
export type InsertTimeMark = z.infer<typeof insertTimeMarkSchema>;

// System Usage Stats
export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, character_create, campaign_create, etc.
  metadata: json("metadata"), // Additional data about the action
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertSystemStatSchema = createInsertSchema(systemStats).omit({
  id: true,
  timestamp: true
});

export const systemStatsRelations = relations(systemStats, ({ one }) => ({
  user: one(users, {
    fields: [systemStats.userId],
    references: [users.id]
  })
}));

export type SystemStat = typeof systemStats.$inferSelect;
export type InsertSystemStat = z.infer<typeof insertSystemStatSchema>;

// User Messages (for admin communication)
export const userMessages = pgTable("user_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at").defaultNow()
});

export const insertUserMessageSchema = createInsertSchema(userMessages).omit({
  id: true,
  sentAt: true
});

export const userMessagesRelations = relations(userMessages, ({ one }) => ({
  sender: one(users, {
    fields: [userMessages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  recipient: one(users, {
    fields: [userMessages.recipientId],
    references: [users.id],
    relationName: "receivedMessages"
  })
}));

export type UserMessage = typeof userMessages.$inferSelect;
export type InsertUserMessage = z.infer<typeof insertUserMessageSchema>;
