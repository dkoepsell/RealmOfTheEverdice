CREATE TABLE "campaign_current_locations" (
	"campaign_id" integer PRIMARY KEY NOT NULL,
	"position" json NOT NULL,
	"location_name" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_world_maps" (
	"campaign_id" integer PRIMARY KEY NOT NULL,
	"map_url" text NOT NULL,
	"generated_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journey_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"points" json NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "map_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"notes" text,
	"position" json NOT NULL,
	"discovered" boolean DEFAULT false NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"icon_url" text,
	"quests" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "is_bot" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "looking_for_friends" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "looking_for_party" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "status_message" text;--> statement-breakpoint
ALTER TABLE "campaign_current_locations" ADD CONSTRAINT "campaign_current_locations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_world_maps" ADD CONSTRAINT "campaign_world_maps_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;