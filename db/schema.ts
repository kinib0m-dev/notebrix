import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable(
  "user",
  {
    // Auth.js required fields
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),

    // Custom fields
    emailStatus: text("email_status", {
      enum: ["pending", "confirmed", "expired"],
    }).default("pending"),
    accountStatus: text("account_status", {
      enum: ["active", "suspended", "deleted"],
    }).default("active"),
    password: text("password"),
    isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lastFailedLoginAttempt: timestamp("last_failed_login_attempt", {
      mode: "date",
    }),
    lockedUntil: timestamp("locked_until", { mode: "date" }),
    securityVersion: integer("security_version").default(1),

    // Welcome email tracking fields
    firstLoginAt: timestamp("first_login_at", { mode: "date" }),
    welcomeEmailSent: boolean("welcome_email_sent").default(false),
    signupMethod: text("signup_method", {
      enum: ["email", "oauth"],
    }).default("email"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for better query performance
    emailIdx: index("users_email_idx").on(table.email),
    accountStatusIdx: index("users_account_status_idx").on(table.accountStatus),
    emailStatusIdx: index("users_email_status_idx").on(table.emailStatus),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
    lockedUntilIdx: index("users_locked_until_idx").on(table.lockedUntil),
    firstLoginIdx: index("users_first_login_idx").on(table.firstLoginAt),
    welcomeEmailIdx: index("users_welcome_email_idx").on(
      table.welcomeEmailSent
    ),
  })
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
    // Index for faster user lookups
    index("accounts_user_id_idx").on(account.userId),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const loginActivities = pgTable(
  "login_activities",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for login activity queries
    userIdIdx: index("login_activities_user_id_idx").on(table.userId),
    createdAtIdx: index("login_activities_created_at_idx").on(table.createdAt),
    successIdx: index("login_activities_success_idx").on(table.success),
    ipAddressIdx: index("login_activities_ip_address_idx").on(table.ipAddress),
  })
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.id, verificationToken.token],
      }),
    },
    // Indexes for token lookups
    index("verification_tokens_email_idx").on(verificationToken.email),
    index("verification_tokens_expires_idx").on(verificationToken.expires),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (passwordResetToken) => [
    {
      compositePk: primaryKey({
        columns: [passwordResetToken.id, passwordResetToken.token],
      }),
    },
    // Indexes for token lookups
    index("password_reset_tokens_email_idx").on(passwordResetToken.email),
    index("password_reset_tokens_expires_idx").on(passwordResetToken.expires),
  ]
);

export const twoFactorTokens = pgTable(
  "two_factor_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (twoFactorToken) => [
    {
      compositePk: primaryKey({
        columns: [twoFactorToken.id, twoFactorToken.token],
      }),
    },
    // Indexes for token lookups
    index("two_factor_tokens_email_idx").on(twoFactorToken.email),
    index("two_factor_tokens_expires_idx").on(twoFactorToken.expires),
  ]
);

export const twoFactorConfirmation = pgTable(
  "two_factor_confirmations",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    // Index for user lookups
    userIdIdx: index("two_factor_confirmations_user_id_idx").on(table.userId),
  })
);

// ================================= SUBJECTS =================================
export const userEvaluationEnum = pgEnum("user_evaluation", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const subjects = pgTable(
  "subjects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    userEvaluation: userEvaluationEnum("user_evaluation")
      .notNull()
      .default("beginner"),
    color: text("color").notNull().default("#3B82F6"), // Default blue color
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for better query performance
    userIdIdx: index("subjects_user_id_idx").on(table.userId),
    nameIdx: index("subjects_name_idx").on(table.name),
    createdAtIdx: index("subjects_created_at_idx").on(table.createdAt),
    isArchivedIdx: index("subjects_is_archived_idx").on(table.isArchived),
  })
);
