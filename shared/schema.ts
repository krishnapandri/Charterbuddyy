import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: text("level").notNull().default("Level I Candidate"),
  streakDays: integer("streak_days").notNull().default(0),
  lastLoginDate: timestamp("last_login_date").notNull().default(new Date()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  level: true,
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

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  subtopic: text("subtopic"),
  questionText: text("question_text").notNull(),
  context: text("context"),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: integer("difficulty").notNull().default(1), // 1-3: easy, medium, hard
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  topicId: true,
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
});

// User answers tracking
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
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
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
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
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(), // practice_completed, badge_earned, etc.
  topicId: integer("topic_id"),
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
  topicId: integer("topic_id").notNull(),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

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
