import { relations } from "drizzle-orm/relations";
import {
  trips,
  tripParticipants,
  users,
  chats,
  messages,
  groupMembers,
} from "./schema";

export const tripParticipantsRelations = relations(
  tripParticipants,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripParticipants.tripId],
      references: [trips.id],
    }),
    user: one(users, {
      fields: [tripParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const tripsRelations = relations(trips, ({ one, many }) => ({
  tripParticipants: many(tripParticipants),
  chat: one(chats, {
    fields: [trips.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [trips.creatorId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tripParticipants: many(tripParticipants),
  trips: many(trips),
  messages: many(messages),
  groupMembers: many(groupMembers),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  trips: many(trips),
  messages: many(messages),
  groupMembers: many(groupMembers),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  chat: one(chats, {
    fields: [groupMembers.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));
