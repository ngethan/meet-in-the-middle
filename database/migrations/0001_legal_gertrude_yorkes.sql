CREATE TABLE "tripParticipants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tripId" uuid,
	"userId" uuid,
	"startingLocation" text,
	"latitude" double precision,
	"longitude" double precision,
	"joinedAt" timestamp (3) DEFAULT timezone('utc'::text, now())
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid,
	"creatorId" uuid,
	"name" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now(),
	"bestLocation" text,
	"bestLatitude" double precision,
	"bestLongitude" double precision,
	"bestAddress" text,
	"bestPlaceId" text,
	"bestPhotos" text[],
	"startDate" timestamp (3),
	"endDate" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "blocked_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "blocked_users" CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_participants" RENAME TO "conversationParticipants";--> statement-breakpoint
ALTER TABLE "conversationParticipants" DROP CONSTRAINT "conversation_participants_userId_conversationId_unique";--> statement-breakpoint
ALTER TABLE "conversationParticipants" DROP CONSTRAINT "conversation_participants_conversationId_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "conversationParticipants" DROP CONSTRAINT "conversation_participants_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_conversations_id_fk";
--> statement-breakpoint
DROP INDEX "username_idx";--> statement-breakpoint
DROP INDEX "users_username_key";--> statement-breakpoint
DROP INDEX "users_search_idx";--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conversationParticipants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "senderId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "conversationId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "createdAt" timestamp (3) DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tripParticipants" ADD CONSTRAINT "trip_participants_trip_id_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tripParticipants" ADD CONSTRAINT "trip_participants_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_chat_id_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_id_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversationParticipants" ADD CONSTRAINT "conversationParticipants_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversationParticipants" ADD CONSTRAINT "conversationParticipants_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "conversationType";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "saved";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "attachments";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "timeSent";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "reviewedByAdmin";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "adminDecision";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "adminReason";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "needsReview";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "reactions";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "parentId";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "firstName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lastName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "emailVerified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phoneNumber";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phoneNumberAdded";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "isDeveloper";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "dob";--> statement-breakpoint
ALTER TABLE "conversationParticipants" ADD CONSTRAINT "conversationParticipants_userId_conversationId_unique" UNIQUE("userId","conversationId");--> statement-breakpoint
DROP TYPE "public"."conversationType";--> statement-breakpoint
DROP TYPE "public"."LocationType";--> statement-breakpoint
DROP TYPE "public"."MessageType";--> statement-breakpoint
DROP TYPE "public"."Month";