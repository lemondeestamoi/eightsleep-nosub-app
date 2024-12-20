import { relations } from "drizzle-orm";
import {
  integer,
  pgTableCreator,
  text,
  time,
  timestamp,
  varchar,
  serial,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `8slp_${name}`);

export const users = createTable("users", {
  email: varchar("email", { length: 255 }).notNull().primaryKey(),
  eightUserId: varchar("eightUserId", { length: 255 }).notNull(),
  eightAccessToken: text("access_token").notNull(),
  eightRefreshToken: text("refresh_token").notNull(),
  eightTokenExpiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTemperatureProfile = createTable("userTemperatureProfiles", {
  email: varchar('email', { length: 255 }).references(() => users.email).primaryKey(),
  bedTime: time("bedTime").notNull(),
  wakeupTime: time("wakeupTime").notNull(),
  initialSleepLevel: integer("initialSleepLevel").notNull(),
  midStageTime: time("midStageTime").notNull(),
  finalSleepLevel: integer("finalSleepLevel").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  timezoneTZ: varchar("timezone", { length: 50 }).notNull(),
});

export const midStageTemperatures = createTable("midStageTemperatures", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 })
    .notNull()
    .references(() => userTemperatureProfile.email, { onDelete: "cascade" }),
  time: time("time").notNull(),
  temperature: integer("temperature").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  temperatureProfile: one(userTemperatureProfile, {
    fields: [users.email],
    references: [userTemperatureProfile.email],
  }),
}));

export const userTemperatureProfileRelations = relations(userTemperatureProfile, ({ one, many }) => ({
  user: one(users, {
    fields: [userTemperatureProfile.email],
    references: [users.email],
  }),
  midStageTemperatures: many(midStageTemperatures),
}));