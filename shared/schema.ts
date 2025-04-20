import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  level: text("level").notNull().default("Level I Candidate"),
  role: text("role").notNull().default("student"), // 'admin' or 'student'
  isPremium: boolean("is_premium").notNull().default(false), // indicates if user has paid
  streakDays: integer("streak_days").notNull().default(0),
  lastLoginDate: timestamp("last_login_date").notNull().default(new Date()),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  level: true,
  role: true,
});

// Topics table
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("book"),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  name: true,
  description: true,
  icon: true,
});

// Chapters table
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0), // For ordering chapters within a topic
});

export const insertChapterSchema = createInsertSchema(chapters).pick({
  topicId: true,
  name: true,
  description: true,
  order: true,
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  chapterId: integer("chapter_id").references(() => chapters.id),
  subtopic: text("subtopic"),
  questionText: text("question_text").notNull(),
  context: text("context"),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d"),  // Removed notNull to support 3-option questions
  correctOption: text("correct_option").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: integer("difficulty").notNull().default(1), // 1-3: easy, medium, hard
});

export const insertQuestionSchema = createInsertSchema(questions)
  .pick({
    topicId: true,
    chapterId: true,
    subtopic: true,
    questionText: true,
    context: true,
    optionA: true,
    optionB: true,
    optionC: true,
    optionD: true,
    correctOption: true,
    explanation: true,
    difficulty: true,
  })
  // Make optionD optional since we now use only 3 options
  .extend({
    optionD: z.string().optional(),
  });

// User answers tracking
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  userOption: text("user_option").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  answeredAt: timestamp("answered_at").notNull().default(new Date()),
});

export const insertUserAnswerSchema = createInsertSchema(userAnswers).pick({
  userId: true,
  questionId: true,
  userOption: true,
  isCorrect: true,
  timeSpent: true,
});

// User progress by topic
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  questionsAttempted: integer("questions_attempted").notNull().default(0),
  questionsCorrect: integer("questions_correct").notNull().default(0),
  totalTimeSpent: integer("total_time_spent").notNull().default(0), // in seconds
  lastUpdated: timestamp("last_updated").notNull().default(new Date()),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  topicId: true,
  questionsAttempted: true,
  questionsCorrect: true,
  totalTimeSpent: true,
});

// User activity tracking
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // practice_completed, badge_earned, etc.
  topicId: integer("topic_id").references(() => topics.id),
  details: json("details"),
  activityDate: timestamp("activity_date").notNull().default(new Date()),
});

export const insertUserActivitySchema = createInsertSchema(userActivity).pick({
  userId: true,
  activityType: true,
  topicId: true,
  details: true,
});

// Practice sets (predefined groups of questions)
export const practiceSets = pgTable("practice_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  subtopic: text("subtopic"),
  questionCount: integer("question_count").notNull(),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  difficulty: integer("difficulty").notNull().default(1), // 1-3: easy, medium, hard
  isRecommended: boolean("is_recommended").default(false),
  status: text("status").default("new"), // new, needs_review, completed
});

export const insertPracticeSetSchema = createInsertSchema(practiceSets).pick({
  name: true,
  topicId: true,
  subtopic: true,
  questionCount: true,
  estimatedTime: true,
  difficulty: true,
  isRecommended: true,
  status: true,
});

// Study Plans have been removed

// Relation definitions
export const usersRelations = relations(users, ({ many }) => ({
  userAnswers: many(userAnswers),
  userProgress: many(userProgress),
  userActivity: many(userActivity)
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
  chapters: many(chapters),
  userProgress: many(userProgress),
  practiceSets: many(practiceSets)
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  topic: one(topics, {
    fields: [chapters.topicId],
    references: [topics.id]
  }),
  questions: many(questions)
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id]
  }),
  chapter: one(chapters, {
    fields: [questions.chapterId],
    references: [chapters.id]
  }),
  userAnswers: many(userAnswers)
}));

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  user: one(users, {
    fields: [userAnswers.userId],
    references: [users.id]
  }),
  question: one(questions, {
    fields: [userAnswers.questionId],
    references: [questions.id]
  })
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  }),
  topic: one(topics, {
    fields: [userProgress.topicId],
    references: [topics.id]
  })
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id]
  }),
  topic: one(topics, {
    fields: [userActivity.topicId],
    references: [topics.id]
  })
}));

export const practiceSetsRelations = relations(practiceSets, ({ one }) => ({
  topic: one(topics, {
    fields: [practiceSets.topicId],
    references: [topics.id]
  })
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type PracticeSet = typeof practiceSets.$inferSelect;
export type InsertPracticeSet = z.infer<typeof insertPracticeSetSchema>;

// Error Logs Table
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  errorMessage: text("error_message").notNull(),
  errorStack: text("error_stack"),
  userId: integer("user_id"),
  metadata: json("metadata"),
  route: text("route"),
  method: text("method"),
  timestamp: timestamp("timestamp").notNull().default(new Date()),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).pick({
  errorMessage: true,
  errorStack: true,
  userId: true,
  metadata: true,
  route: true,
  method: true,
});

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
}));

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in smallest currency unit (e.g., cents)
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(), // 'created', 'authorized', 'captured', 'failed'
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpaySignature: text("razorpay_signature"),
  planType: text("plan_type").notNull(), // 'monthly', 'yearly', etc.
  metadata: json("metadata"), // Additional payment data
  createdAt: timestamp("created_at").notNull().default(new Date()),
  updatedAt: timestamp("updated_at").notNull().default(new Date()),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  amount: true,
  currency: true,
  status: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  razorpaySignature: true,
  planType: true,
  metadata: true,
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
