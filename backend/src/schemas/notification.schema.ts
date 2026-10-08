import {
  pgTable,
  bigserial,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

import { userTable } from "./user.schema.js";

export const notificationTable = pgTable(
  "notifications",
  {
    internalId: bigserial("internal_id", {
      mode: "bigint",
    }).primaryKey(),

    userPublicId: uuid("user_public_id")
      .references(() => userTable.publicId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),

    endpoint: text("endpoint").notNull(),

    p256dh: text("p256dh").notNull(),

    auth: text("auth").notNull(),

    deviceName: varchar("device_name", {
      length: 150,
    }),

    userAgent: text("user_agent"),

    isActive: boolean("is_active").default(true).notNull(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
    }),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    endpointUnique: unique("notifications_endpoint_unique").on(table.endpoint),
  }),
);
