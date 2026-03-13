import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_publish_as" AS ENUM('web', 'email', 'both');
  CREATE TYPE "public"."enum__posts_v_version_email_status" AS ENUM('draft', 'scheduled', 'sent', 'failed');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_title" varchar,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_publish_as" "enum__posts_v_version_publish_as" DEFAULT 'web',
  	"version_slug" varchar,
  	"version_email_subject" varchar,
  	"version_email_preview_text" varchar,
  	"version_email_status" "enum__posts_v_version_email_status" DEFAULT 'draft',
  	"version_scheduled_send_at" timestamp(3) with time zone,
  	"version_email_sent_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "site_settings_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "posts" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "publish_as" DROP NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "posts" ADD COLUMN "_status" "enum_posts_status" DEFAULT 'draft';
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_nav_items" ADD CONSTRAINT "site_settings_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_tenant_idx" ON "_posts_v" USING btree ("version_tenant_id");
  CREATE INDEX "_posts_v_version_version_featured_image_idx" ON "_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "site_settings_nav_items_order_idx" ON "site_settings_nav_items" USING btree ("_order");
  CREATE INDEX "site_settings_nav_items_parent_id_idx" ON "site_settings_nav_items" USING btree ("_parent_id");
  ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_featured_image_idx" ON "posts" USING btree ("featured_image_id");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");`)

  // Set _status to 'published' for any existing posts (no-op on empty table)
  await db.execute(sql`UPDATE "posts" SET "_status" = 'published' WHERE "_status" IS NULL`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_nav_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "site_settings_nav_items" CASCADE;
  ALTER TABLE "posts" DROP CONSTRAINT "posts_featured_image_id_media_id_fk";
  
  DROP INDEX "posts_featured_image_idx";
  DROP INDEX "posts__status_idx";
  ALTER TABLE "posts" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "publish_as" SET NOT NULL;
  ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "posts" DROP COLUMN "featured_image_id";
  ALTER TABLE "posts" DROP COLUMN "_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_publish_as";
  DROP TYPE "public"."enum__posts_v_version_email_status";
  DROP TYPE "public"."enum__posts_v_version_status";`)
}
