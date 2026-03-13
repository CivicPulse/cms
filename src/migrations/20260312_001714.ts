import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_publish_as" AS ENUM('web', 'email', 'both');
  CREATE TYPE "public"."enum_posts_email_status" AS ENUM('draft', 'scheduled', 'sent', 'failed');
  CREATE TYPE "public"."enum_site_settings_active_template_key" AS ENUM('classic', 'modern', 'bold');
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar NOT NULL,
  	"subheadline" varchar,
  	"background_image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_issues_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_issues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"contact_email" varchar,
  	"office_address" varchar,
  	"phone_number" varchar,
  	"show_newsletter_form" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"alt" varchar,
  	"prefix" varchar DEFAULT 'media',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"candidate_name" varchar NOT NULL,
  	"office_running_for" varchar,
  	"tagline" varchar,
  	"bio" varchar,
  	"primary_color" varchar,
  	"logo_id" integer,
  	"candidate_photo_id" integer,
  	"twitter_url" varchar,
  	"facebook_url" varchar,
  	"instagram_url" varchar,
  	"contact_email" varchar,
  	"donation_url" varchar,
  	"active_template_key" "enum_site_settings_active_template_key" DEFAULT 'classic' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "posts" ADD COLUMN "publish_as" "enum_posts_publish_as" DEFAULT 'web' NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "slug" varchar NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "email_subject" varchar;
  ALTER TABLE "posts" ADD COLUMN "email_preview_text" varchar;
  ALTER TABLE "posts" ADD COLUMN "email_status" "enum_posts_email_status" DEFAULT 'draft';
  ALTER TABLE "posts" ADD COLUMN "scheduled_send_at" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "email_sent_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_settings_id" integer;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_issues_items" ADD CONSTRAINT "pages_blocks_issues_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_issues" ADD CONSTRAINT "pages_blocks_issues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact" ADD CONSTRAINT "pages_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_candidate_photo_id_media_id_fk" FOREIGN KEY ("candidate_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_image_idx" ON "pages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "pages_blocks_text_order_idx" ON "pages_blocks_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_parent_id_idx" ON "pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_path_idx" ON "pages_blocks_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_issues_items_order_idx" ON "pages_blocks_issues_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_issues_items_parent_id_idx" ON "pages_blocks_issues_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_issues_order_idx" ON "pages_blocks_issues" USING btree ("_order");
  CREATE INDEX "pages_blocks_issues_parent_id_idx" ON "pages_blocks_issues" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_issues_path_idx" ON "pages_blocks_issues" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_order_idx" ON "pages_blocks_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_parent_id_idx" ON "pages_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_path_idx" ON "pages_blocks_contact" USING btree ("_path");
  CREATE INDEX "pages_tenant_idx" ON "pages" USING btree ("tenant_id");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "site_settings_tenant_idx" ON "site_settings" USING btree ("tenant_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_candidate_photo_idx" ON "site_settings" USING btree ("candidate_photo_id");
  CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");
  CREATE INDEX "site_settings_created_at_idx" ON "site_settings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_settings_fk" FOREIGN KEY ("site_settings_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_site_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("site_settings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_issues_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_issues" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_text" CASCADE;
  DROP TABLE "pages_blocks_issues_items" CASCADE;
  DROP TABLE "pages_blocks_issues" CASCADE;
  DROP TABLE "pages_blocks_contact" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_settings_fk";
  
  DROP INDEX "posts_slug_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_site_settings_id_idx";
  ALTER TABLE "users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "users" DROP COLUMN "api_key";
  ALTER TABLE "users" DROP COLUMN "api_key_index";
  ALTER TABLE "posts" DROP COLUMN "publish_as";
  ALTER TABLE "posts" DROP COLUMN "slug";
  ALTER TABLE "posts" DROP COLUMN "email_subject";
  ALTER TABLE "posts" DROP COLUMN "email_preview_text";
  ALTER TABLE "posts" DROP COLUMN "email_status";
  ALTER TABLE "posts" DROP COLUMN "scheduled_send_at";
  ALTER TABLE "posts" DROP COLUMN "email_sent_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_settings_id";
  DROP TYPE "public"."enum_posts_publish_as";
  DROP TYPE "public"."enum_posts_email_status";
  DROP TYPE "public"."enum_site_settings_active_template_key";`)
}
