import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: text("level").notNull().default("Level I Candidate"),
  role: text("role").notNull().default("student"), // 'admin' or 'student'
  streakDays: integer("streak_days").notNull().default(0),
  lastLoginDate: timestamp("last_login_date").notNull().default(new Date()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id),
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

// Study Plans
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().default(new Date()),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  focusAreas: json("focus_areas").notNull(), // Array of topicIds with priority (1-3)
  status: text("status").notNull().default("active"), // active, completed, archived
  progress: integer("progress").notNull().default(0), // 0-100%
  lastUpdated: timestamp("last_updated").notNull().default(new Date()),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).pick({
  userId: true,
  name: true,
  startDate: true,
  endDate: true,
  focusAreas: true,
  status: true,
  progress: true,
});

// Study Plan Items (daily tasks in a study plan)
export const studyPlanItems = pgTable("study_plan_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => studyPlans.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  practiceSetId: integer("practice_set_id").references(() => practiceSets.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // minutes
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  priority: integer("priority").notNull().default(2), // 1-3: low, medium, high
});

export const insertStudyPlanItemSchema = createInsertSchema(studyPlanItems).pick({
  planId: true,
  topicId: true,
  practiceSetId: true,
  title: true,
  description: true,
  scheduledDate: true,
  estimatedDuration: true,
  status: true,
  completed: true,
  completedAt: true,
  priority: true,
});

// Relation definitions
export const usersRelations = relations(users, ({ many }) => ({
  userAnswers: many(userAnswers),
  userProgress: many(userProgress),
  userActivity: many(userActivity),
  studyPlans: many(studyPlans)
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
  userProgress: many(userProgress),
  practiceSets: many(practiceSets),
  studyPlanItems: many(studyPlanItems)
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id]
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

export const practiceSetsRelations = relations(practiceSets, ({ one, many }) => ({
  topic: one(topics, {
    fields: [practiceSets.topicId],
    references: [topics.id]
  }),
  studyPlanItems: many(studyPlanItems)
}));

export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id]
  }),
  studyPlanItems: many(studyPlanItems)
}));

export const studyPlanItemsRelations = relations(studyPlanItems, ({ one }) => ({
  studyPlan: one(studyPlans, {
    fields: [studyPlanItems.planId],
    references: [studyPlans.id]
  }),
  topic: one(topics, {
    fields: [studyPlanItems.topicId],
    references: [topics.id]
  }),
  practiceSet: one(practiceSets, {
    fields: [studyPlanItems.practiceSetId],
    references: [practiceSets.id]
  })
}));

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

export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;

export type StudyPlanItem = typeof studyPlanItems.$inferSelect;
export type InsertStudyPlanItem = z.infer<typeof insertStudyPlanItemSchema>;
