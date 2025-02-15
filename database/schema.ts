import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const messageType = pgEnum("MessageType", [
  "TEXT",
  "POST",
  "PROFILE",
  "NOTIFICATION",
  "IMAGE",
  "VIDEO",
  "FILE",
]);
export const connectionStatus = pgEnum("ConnectionStatus", [
  "PENDING",
  "ACCEPTED",
]);
export const locationType = pgEnum("LocationType", [
  "ON_SITE",
  "REMOTE",
  "HYBRID",
]);
export const month = pgEnum("Month", [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
]);

export const conversationType = pgEnum("conversationType", ["DIRECT", "GROUP"]);
export type ReactionType = Record<string, string[]>;

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
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

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    user: one(users, {
      fields: [conversationParticipants.userId],
      references: [users.id],
    }),
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
      relationName: "conversationParticipants",
    }),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
    username: text("username"),
    firstName: text("firstName"),
    lastName: text("lastName"),
    fullName: text("fullName"),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { precision: 3, mode: "date" }),
    phoneNumber: text("phoneNumber"),
    phoneNumberAdded: timestamp("phoneNumberAdded", {
      precision: 3,
      mode: "date",
    }),
    isDeveloper: boolean("isDeveloper").notNull().default(false),
  },
  (table) => {
    return {
      nameIdx: index("name_idx").on(table.fullName),
      usernameIdx: index("username_idx").on(table.username),
      emailKey: uniqueIndex("users_email_key").on(table.email),
      usernameKey: uniqueIndex("users_username_key").on(table.username),
      searchIndex: index("users_search_idx").using(
        "gin",
        sql`(
          setweight(to_tsvector('english', coalesce(${table.fullName}, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(${table.username}, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(${table.email}, '')), 'C')
        )`,
      ),
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
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
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
export const conversations = pgTable("conversations", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  lastDate: timestamp("lastDate", { precision: 3, mode: "date" }),
  participantIds: uuid("participantIds")
    .array()
    .notNull()
    .default(sql`'{}'`),
  chatName: text("chatName").default("").notNull(),
  ownerId: uuid("ownerId"),
  lastMessage: text("lastMessage"),
  type: conversationType("conversationType").notNull(),
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
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
    content: text("content").notNull(),
    senderId: uuid("senderId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    saved: boolean("saved").default(false).notNull(),
    attachments: text("attachments")
      .array()
      .default(sql`'{}'`)
      .notNull(),
    timeSent: timestamp("timeSent", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => conversations.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    reviewedByAdmin: boolean("reviewedByAdmin").default(false).notNull(),
    adminDecision: boolean("adminDecision"),
    adminReason: text("adminReason"),
    needsReview: boolean("needsReview").notNull().default(false),
    deleted: boolean("deleted").default(false).notNull(),
    reactions: jsonb("reactions").default({}).notNull().$type<ReactionType>(),
    parentId: uuid("parentId"),
    type: messageType("type").notNull().default("TEXT"),
  },
  (table) => {
    return {
      conversationIdIdx: index("messages_conversationId_idx").on(
        table.conversationId,
      ),
    };
  },
);

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "userMessages",
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
    relationName: "conversationMessages",
  }),
}));

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    blockedUserId: uuid("blockedUserId")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
  },
  (table) => {
    return {
      unique: unique().on(table.userId, table.blockedUserId),
    };
  },
);
