import {
  pgTable,
  foreignKey,
  uuid,
  text,
  doublePrecision,
  timestamp,
  unique,
  uniqueIndex,
  index,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const connectionStatus = pgEnum("ConnectionStatus", [
  "PENDING",
  "ACCEPTED",
]);

export const tripParticipants = pgTable(
  "tripParticipants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tripId: uuid("tripId"),
    userId: uuid("userId"),
    startingLocation: text("startingLocation"),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    joinedAt: timestamp("joinedAt", { precision: 3, mode: "date" }).default(
      sql`timezone('utc'::text, now())`,
    ),
  },
  (table) => [
    foreignKey({
      columns: [table.tripId],
      foreignColumns: [trips.id],
      name: "trip_participants_trip_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "trip_participants_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const trips = pgTable(
  "trips",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversationId"),
    creatorId: uuid("creatorId"),
    name: text().notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "date",
    }).defaultNow(),
    bestLocation: text("bestLocation"),
    bestLatitude: doublePrecision("bestLatitude"),
    bestLongitude: doublePrecision("bestLongitude"),
    bestAddress: text("bestAddress"),
    bestPlaceId: text("bestPlaceId"),
    bestPhotos: text("bestPhotos").array(),
    startDate: timestamp("startDate", { precision: 3, mode: "date" }),
    endDate: timestamp("endDate", { precision: 3, mode: "date" }),
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: "trips_chat_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.creatorId],
      foreignColumns: [users.id],
      name: "trips_creator_id_fkey",
    }).onDelete("set null"),
  ],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  lastDate: timestamp("lastDate", { precision: 3, mode: "date" }),
  participantIds: uuid("participantIds")
    .array()
    .notNull()
    .default(sql`'{}'`),
  chatName: text("chatName").default("").notNull(),
  ownerId: uuid("ownerId"),
  lastMessage: text("lastMessage"),
});

export const conversationRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants, {
    relationName: "conversationParticipants",
  }),
  messages: many(messages, {
    relationName: "conversationMessages",
  }),
}));

export const messages = pgTable(
  "messages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversationId"),
    senderId: uuid("senderId"),
    content: text().notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "date",
    }).defaultNow(),
  },
  (table) => {
    return {
      conversationIdIdx: index("messages_conversationId_idx").on(
        table.conversationId,
      ),
    };
  },
);

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    fullName: text("fullName"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("name_idx").on(table.fullName),
      emailKey: uniqueIndex("users_email_key").on(table.email),
    };
  },
);

export const userRelations = relations(users, ({ many, one }) => ({
  connections: many(connections, {
    relationName: "userConnections",
  }),
  userMessages: many(messages, {
    relationName: "userMessages",
  }),
}));

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    sentTime: timestamp("sentTime", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    responseTime: timestamp("responseTime", { precision: 3, mode: "date" }),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    connectionUserId: uuid("connectionUserId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    status: connectionStatus("status").default("PENDING").notNull(),

    additionalNote: text("additionalNote").default("").notNull(),
  },
  (table) => {
    return {
      unique: unique().on(table.userId, table.connectionUserId),
    };
  },
);

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
    relationName: "userConnections",
  }),
  connectionUser: one(users, {
    fields: [connections.connectionUserId],
    references: [users.id],
  }),
}));

export const conversationParticipants = pgTable(
  "conversationParticipants",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => conversations.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    lastReadAt: timestamp("lastReadAt", { precision: 3, mode: "date" }),
    unreadMessages: integer("unreadMessages").default(0).notNull(),
    lastMessageShort: text("lastMessageShort"),
    lastDate: timestamp("lastDate", { precision: 3, mode: "date" }),
    starred: boolean("starred").default(false).notNull(),
  },
  (table) => {
    return {
      unique: unique().on(table.userId, table.conversationId),
    };
  },
);
