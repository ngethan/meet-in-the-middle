CREATE TYPE "public"."ConnectionStatus" AS ENUM('PENDING', 'ACCEPTED');--> statement-breakpoint
CREATE TYPE "public"."conversationType" AS ENUM('DIRECT', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."LocationType" AS ENUM('ON_SITE', 'REMOTE', 'HYBRID');--> statement-breakpoint
CREATE TYPE "public"."MessageType" AS ENUM('TEXT', 'POST', 'PROFILE', 'NOTIFICATION', 'IMAGE', 'VIDEO', 'FILE');--> statement-breakpoint
CREATE TYPE "public"."Month" AS ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"blockedUserId" uuid NOT NULL,
	CONSTRAINT "blocked_users_userId_blockedUserId_unique" UNIQUE("userId","blockedUserId")
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sentTime" timestamp (3) DEFAULT now() NOT NULL,
	"responseTime" timestamp (3),
	"userId" uuid NOT NULL,
	"connectionUserId" uuid NOT NULL,
	"status" "ConnectionStatus" DEFAULT 'PENDING' NOT NULL,
	"additionalNote" text DEFAULT '' NOT NULL,
	CONSTRAINT "connections_userId_connectionUserId_unique" UNIQUE("userId","connectionUserId")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"lastReadAt" timestamp (3),
	"unreadMessages" integer DEFAULT 0 NOT NULL,
	"lastMessageShort" text,
	"lastDate" timestamp (3),
	"starred" boolean DEFAULT false NOT NULL,
	CONSTRAINT "conversation_participants_userId_conversationId_unique" UNIQUE("userId","conversationId")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lastDate" timestamp (3),
	"participantIds" uuid[] DEFAULT '{}' NOT NULL,
	"chatName" text DEFAULT '' NOT NULL,
	"ownerId" uuid,
	"lastMessage" text,
	"conversationType" "conversationType" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"senderId" uuid NOT NULL,
	"saved" boolean DEFAULT false NOT NULL,
	"attachments" text[] DEFAULT '{}' NOT NULL,
	"timeSent" timestamp (3) DEFAULT now() NOT NULL,
	"conversationId" uuid NOT NULL,
	"reviewedByAdmin" boolean DEFAULT false NOT NULL,
	"adminDecision" boolean,
	"adminReason" text,
	"needsReview" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parentId" uuid,
	"type" "MessageType" DEFAULT 'TEXT' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text,
	"firstName" text,
	"lastName" text,
	"fullName" text,
	"email" text,
	"emailVerified" timestamp (3),
	"phoneNumber" text,
	"phoneNumberAdded" timestamp (3),
	"isDeveloper" boolean DEFAULT false NOT NULL,
	"dob" text
);
--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedUserId_users_id_fk" FOREIGN KEY ("blockedUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_connectionUserId_users_id_fk" FOREIGN KEY ("connectionUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "messages_conversationId_idx" ON "messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "name_idx" ON "users" USING btree ("fullName");--> statement-breakpoint
CREATE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_search_idx" ON "users" USING gin ((
          setweight(to_tsvector('english', coalesce("fullName", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("username", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("email", '')), 'C')
        ));