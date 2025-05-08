-- Add party planning tables
CREATE TABLE IF NOT EXISTS "party_plans" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "created_by_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "party_plan_items" (
  "id" SERIAL PRIMARY KEY,
  "plan_id" INTEGER NOT NULL REFERENCES "party_plans"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'task',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_by_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "assigned_to_id" INTEGER REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "party_plan_comments" (
  "id" SERIAL PRIMARY KEY,
  "item_id" INTEGER NOT NULL REFERENCES "party_plan_items"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_party_plans_campaign_id" ON "party_plans" ("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_party_plan_items_plan_id" ON "party_plan_items" ("plan_id");
CREATE INDEX IF NOT EXISTS "idx_party_plan_comments_item_id" ON "party_plan_comments" ("item_id");