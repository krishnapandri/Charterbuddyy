import {
  users,
  topics,
  chapters,
  questions,
  userAnswers,
  userProgress,
  userActivity,
  practiceSets,
  errorLogs,
  payments,
  type User,
  type InsertUser,
  type Topic,
  type InsertTopic,
  type Chapter,
  type InsertChapter,
  type Question,
  type InsertQuestion,
  type UserAnswer,
  type InsertUserAnswer,
  type UserProgress,
  type InsertUserProgress,
  type UserActivity,
  type InsertUserActivity,
  type PracticeSet,
  type InsertPracticeSet,
  type ErrorLog,
  type InsertErrorLog,
  type Payment,
  type InsertPayment
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streakDays: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Topic operations
  getAllTopics(): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: number, topicData: Partial<Topic>): Promise<Topic>;
  deleteTopic(id: number): Promise<void>;
  
  // Chapter operations
  getChaptersByTopic(topicId: number): Promise<Chapter[]>;
  getChapter(id: number): Promise<Chapter | undefined>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter>;
  deleteChapter(id: number): Promise<void>;
  
  // Question operations
  getQuestionsByTopic(topicId: number): Promise<Question[]>;
  getQuestionsByChapter(chapterId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, questionData: Partial<Question>): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  
  // User answer operations
  createUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getUserAnswers(userId: number): Promise<UserAnswer[]>;
  getUserAnswersByTopic(userId: number, topicId: number): Promise<UserAnswer[]>;
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined>;
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  // User activity operations
  getUserActivity(userId: number, limit?: number): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  
  // Practice sets operations
  getPracticeSets(topicId?: number): Promise<PracticeSet[]>;
  getPracticeSet(id: number): Promise<PracticeSet | undefined>;
  getRecommendedPracticeSets(userId: number): Promise<PracticeSet[]>;
  createPracticeSet(practiceSet: InsertPracticeSet): Promise<PracticeSet>;
  updatePracticeSet(id: number, practiceSetData: Partial<PracticeSet>): Promise<PracticeSet>;
  deletePracticeSet(id: number): Promise<void>;
  
  // Error logging operations
  logError(errorLog: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(limit?: number): Promise<ErrorLog[]>;
  getErrorLogsByUser(userId: number, limit?: number): Promise<ErrorLog[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment>;
  updateUserPremiumStatus(userId: number, isPremium: boolean): Promise<User>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private topics: Map<number, Topic>;
  private chapters: Map<number, Chapter>;
  private questions: Map<number, Question>;
  private userAnswers: Map<number, UserAnswer>;
  private userProgress: Map<number, UserProgress>;
  private userActivity: Map<number, UserActivity>;
  private practiceSets: Map<number, PracticeSet>;
  private errorLogs: Map<number, ErrorLog>;
  private payments: Map<number, Payment>;
  
  private userIdCounter: number;
  private topicIdCounter: number;
  private chapterIdCounter: number;
  private questionIdCounter: number;
  private userAnswerIdCounter: number;
  private userProgressIdCounter: number;
  private userActivityIdCounter: number;
  private practiceSetIdCounter: number;
  private errorLogIdCounter: number;
  private paymentIdCounter: number;
  
  // Session store for authentication
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize the MemoryStore for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.topics = new Map();
    this.chapters = new Map();
    this.questions = new Map();
    this.userAnswers = new Map();
    this.userProgress = new Map();
    this.userActivity = new Map();
    this.practiceSets = new Map();
    this.errorLogs = new Map();
    
    this.userIdCounter = 1;
    this.topicIdCounter = 1;
    this.chapterIdCounter = 1;
    this.questionIdCounter = 1;
    this.userAnswerIdCounter = 1;
    this.userProgressIdCounter = 1;
    this.userActivityIdCounter = 1;
    this.practiceSetIdCounter = 1;
    this.errorLogIdCounter = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    
    // Set default values for required fields if not provided
    const user: User = { 
      ...insertUser, 
      id, 
      streakDays: 0, 
      lastLoginDate: new Date(),
      // Default role to student if not specified
      role: insertUser.role || 'student',
      // Default level if not specified
      level: insertUser.level || 'Level I Candidate',
      // Empty reset token fields
      resetPasswordToken: null,
      resetPasswordExpires: null,
      // Email might be null but schema requires the property to exist
      email: insertUser.email || null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUserStreak(userId: number, streakDays: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser = { ...user, streakDays, lastLoginDate: new Date() };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }
  
  // Topic operations
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }
  
  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.topicIdCounter++;
    const topic: Topic = { ...insertTopic, id };
    this.topics.set(id, topic);
    return topic;
  }
  
  async updateTopic(id: number, topicData: Partial<Topic>): Promise<Topic> {
    const topic = await this.getTopic(id);
    if (!topic) {
      throw new Error(`Topic with id ${id} not found`);
    }
    
    const updatedTopic = { ...topic, ...topicData };
    this.topics.set(id, updatedTopic);
    return updatedTopic;
  }
  
  async deleteTopic(id: number): Promise<void> {
    this.topics.delete(id);
  }
  
  // Chapter operations
  async getChaptersByTopic(topicId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values()).filter(
      (chapter) => chapter.topicId === topicId
    ).sort((a, b) => a.order - b.order);
  }
  
  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }
  
  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const id = this.chapterIdCounter++;
    const chapter: Chapter = { ...insertChapter, id };
    this.chapters.set(id, chapter);
    return chapter;
  }
  
  async updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter> {
    const chapter = await this.getChapter(id);
    if (!chapter) {
      throw new Error(`Chapter with id ${id} not found`);
    }
    
    const updatedChapter = { ...chapter, ...chapterData };
    this.chapters.set(id, updatedChapter);
    return updatedChapter;
  }
  
  async deleteChapter(id: number): Promise<void> {
    this.chapters.delete(id);
  }
  
  // Question operations
  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.topicId === topicId
    );
  }
  
  async getQuestionsByChapter(chapterId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.chapterId === chapterId
    );
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }
  
  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
    const question = await this.getQuestion(id);
    if (!question) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    const updatedQuestion = { ...question, ...questionData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<void> {
    this.questions.delete(id);
  }
  
  // User answer operations
  async createUserAnswer(insertAnswer: InsertUserAnswer): Promise<UserAnswer> {
    const id = this.userAnswerIdCounter++;
    const answer: UserAnswer = { ...insertAnswer, id, answeredAt: new Date() };
    this.userAnswers.set(id, answer);
    
    // Update user progress
    await this.updateUserProgressAfterAnswer(answer);
    
    return answer;
  }
  
  async getUserAnswers(userId: number): Promise<UserAnswer[]> {
    return Array.from(this.userAnswers.values()).filter(
      (answer) => answer.userId === userId
    );
  }
  
  async getUserAnswersByTopic(userId: number, topicId: number): Promise<UserAnswer[]> {
    const userAnswers = await this.getUserAnswers(userId);
    const topicQuestions = await this.getQuestionsByTopic(topicId);
    const topicQuestionIds = new Set(topicQuestions.map(q => q.id));
    
    return userAnswers.filter(answer => topicQuestionIds.has(answer.questionId));
  }
  
  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.userId === userId
    );
  }
  
  async getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId && progress.topicId === topicId
    );
  }
  
  async createOrUpdateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existingProgress = await this.getUserProgressByTopic(
      insertProgress.userId,
      insertProgress.topicId
    );
    
    if (existingProgress) {
      const updatedProgress: UserProgress = {
        ...existingProgress,
        questionsAttempted: insertProgress.questionsAttempted,
        questionsCorrect: insertProgress.questionsCorrect,
        totalTimeSpent: insertProgress.totalTimeSpent,
        lastUpdated: new Date(),
      };
      this.userProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.userProgressIdCounter++;
      const progress: UserProgress = { 
        ...insertProgress, 
        id, 
        lastUpdated: new Date() 
      };
      this.userProgress.set(id, progress);
      return progress;
    }
  }
  
  // User activity operations
  async getUserActivity(userId: number, limit: number = 10): Promise<UserActivity[]> {
    const activities = Array.from(this.userActivity.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const id = this.userActivityIdCounter++;
    const activity: UserActivity = { 
      ...insertActivity, 
      id, 
      activityDate: new Date() 
    };
    this.userActivity.set(id, activity);
    return activity;
  }
  
  // Practice sets operations
  async getPracticeSets(topicId?: number): Promise<PracticeSet[]> {
    const sets = Array.from(this.practiceSets.values());
    return topicId ? sets.filter(set => set.topicId === topicId) : sets;
  }
  
  async getPracticeSet(id: number): Promise<PracticeSet | undefined> {
    return this.practiceSets.get(id);
  }
  
  async getRecommendedPracticeSets(userId: number): Promise<PracticeSet[]> {
    return Array.from(this.practiceSets.values())
      .filter(set => set.isRecommended)
      .slice(0, 3);
  }
  
  async createPracticeSet(insertPracticeSet: InsertPracticeSet): Promise<PracticeSet> {
    const id = this.practiceSetIdCounter++;
    const practiceSet: PracticeSet = { ...insertPracticeSet, id };
    this.practiceSets.set(id, practiceSet);
    return practiceSet;
  }
  
  async updatePracticeSet(id: number, practiceSetData: Partial<PracticeSet>): Promise<PracticeSet> {
    const practiceSet = await this.getPracticeSet(id);
    if (!practiceSet) {
      throw new Error(`Practice set with id ${id} not found`);
    }
    
    const updatedPracticeSet = { ...practiceSet, ...practiceSetData };
    this.practiceSets.set(id, updatedPracticeSet);
    return updatedPracticeSet;
  }
  
  async deletePracticeSet(id: number): Promise<void> {
    this.practiceSets.delete(id);
  }
  
  // Error logging operations
  async logError(insertErrorLog: InsertErrorLog): Promise<ErrorLog> {
    const id = this.errorLogIdCounter++;
    const errorLog: ErrorLog = {
      ...insertErrorLog,
      id,
      timestamp: new Date()
    };
    this.errorLogs.set(id, errorLog);
    return errorLog;
  }
  
  async getErrorLogs(limit: number = 50): Promise<ErrorLog[]> {
    const logs = Array.from(this.errorLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async getErrorLogsByUser(userId: number, limit: number = 50): Promise<ErrorLog[]> {
    const logs = Array.from(this.errorLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  // Helper methods
  private async updateUserProgressAfterAnswer(answer: UserAnswer): Promise<void> {
    const question = await this.getQuestion(answer.questionId);
    if (!question) return;
    
    const topicId = question.topicId;
    const progress = await this.getUserProgressByTopic(answer.userId, topicId);
    
    if (progress) {
      await this.createOrUpdateUserProgress({
        userId: answer.userId,
        topicId,
        questionsAttempted: progress.questionsAttempted + 1,
        questionsCorrect: progress.questionsCorrect + (answer.isCorrect ? 1 : 0),
        totalTimeSpent: progress.totalTimeSpent + answer.timeSpent,
      });
    } else {
      await this.createOrUpdateUserProgress({
        userId: answer.userId,
        topicId,
        questionsAttempted: 1,
        questionsCorrect: answer.isCorrect ? 1 : 0,
        totalTimeSpent: answer.timeSpent,
      });
    }
    
    // Record activity
    await this.createUserActivity({
      userId: answer.userId,
      activityType: 'question_answered',
      topicId,
      details: { 
        questionId: answer.questionId,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      }
    });
  }
  
  // No hardcoded initialization of data
  // Data will be created through the API by users
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize the PostgreSQL session store
    const PostgresSessionStore = ConnectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      conString:process.env.DATABASE_URL
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Set default values for required fields
    const userData = {
      ...insertUser,
      streakDays: 0,
      lastLoginDate: new Date(),
      // Default role to student if not specified
      role: insertUser.role || 'student',
      // Default level if not specified
      level: insertUser.level || 'Level I Candidate',
      // Empty reset token fields are handled by the schema defaults
      email: insertUser.email || null
    };
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUserStreak(userId: number, streakDays: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ streakDays, lastLoginDate: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  // Topic operations
  async getAllTopics(): Promise<Topic[]> {
    return db.select().from(topics);
  }
  
  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(insertTopic).returning();
    return topic;
  }
  
  async updateTopic(id: number, topicData: Partial<Topic>): Promise<Topic> {
    const [updatedTopic] = await db.update(topics)
      .set(topicData)
      .where(eq(topics.id, id))
      .returning();
    
    if (!updatedTopic) {
      throw new Error(`Topic with id ${id} not found`);
    }
    
    return updatedTopic;
  }
  
  async deleteTopic(id: number): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id));
  }
  
  // Chapter operations
  async getChaptersByTopic(topicId: number): Promise<Chapter[]> {
    return db.select()
      .from(chapters)
      .where(eq(chapters.topicId, topicId))
      .orderBy(chapters.order);
  }
  
  async getChapter(id: number): Promise<Chapter | undefined> {
    const [chapter] = await db.select()
      .from(chapters)
      .where(eq(chapters.id, id));
    return chapter;
  }
  
  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const [chapter] = await db.insert(chapters)
      .values(insertChapter)
      .returning();
    return chapter;
  }
  
  async updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter> {
    const [updatedChapter] = await db.update(chapters)
      .set(chapterData)
      .where(eq(chapters.id, id))
      .returning();
    
    if (!updatedChapter) {
      throw new Error(`Chapter with id ${id} not found`);
    }
    
    return updatedChapter;
  }
  
  async deleteChapter(id: number): Promise<void> {
    await db.delete(chapters).where(eq(chapters.id, id));
  }
  
  // Question operations
  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.topicId, topicId));
  }
  
  async getQuestionsByChapter(chapterId: number): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.chapterId, chapterId));
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }
  
  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
    const [updatedQuestion] = await db.update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    
    if (!updatedQuestion) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }
  
  // User answer operations
  async createUserAnswer(insertAnswer: InsertUserAnswer): Promise<UserAnswer> {
    const [answer] = await db.insert(userAnswers)
      .values({
        ...insertAnswer,
        answeredAt: new Date()
      })
      .returning();
    
    // Update user progress
    await this.updateUserProgressAfterAnswer(answer);
    
    return answer;
  }
  
  async getUserAnswers(userId: number): Promise<UserAnswer[]> {
    return db.select().from(userAnswers).where(eq(userAnswers.userId, userId));
  }
  
  async getUserAnswersByTopic(userId: number, topicId: number): Promise<UserAnswer[]> {
    // Join userAnswers with questions to filter by topicId
    const result = await db.select({
      userAnswer: userAnswers
    })
    .from(userAnswers)
    .innerJoin(questions, eq(userAnswers.questionId, questions.id))
    .where(and(
      eq(userAnswers.userId, userId),
      eq(questions.topicId, topicId)
    ));
    
    // Extract userAnswer from the result
    return result.map(r => r.userAnswer);
  }
  
  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  
  async getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.topicId, topicId)
      ));
    return progress;
  }
  
  async createOrUpdateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existingProgress = await this.getUserProgressByTopic(
      insertProgress.userId,
      insertProgress.topicId
    );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db.update(userProgress)
        .set({
          questionsAttempted: insertProgress.questionsAttempted,
          questionsCorrect: insertProgress.questionsCorrect,
          totalTimeSpent: insertProgress.totalTimeSpent,
          lastUpdated: new Date()
        })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      // Create new progress
      const [progress] = await db.insert(userProgress)
        .values({
          ...insertProgress,
          lastUpdated: new Date()
        })
        .returning();
      return progress;
    }
  }
  
  // User activity operations
  async getUserActivity(userId: number, limit: number = 10): Promise<UserActivity[]> {
    return db.select().from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.activityDate))
      .limit(limit);
  }
  
  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db.insert(userActivity)
      .values({
        ...insertActivity,
        activityDate: new Date()
      })
      .returning();
    return activity;
  }
  
  // Practice sets operations
  async getPracticeSets(topicId?: number): Promise<PracticeSet[]> {
    if (topicId) {
      return db.select().from(practiceSets).where(eq(practiceSets.topicId, topicId));
    }
    return db.select().from(practiceSets);
  }
  
  async getPracticeSet(id: number): Promise<PracticeSet | undefined> {
    const [practiceSet] = await db.select().from(practiceSets).where(eq(practiceSets.id, id));
    return practiceSet;
  }
  
  async getRecommendedPracticeSets(userId: number): Promise<PracticeSet[]> {
    return db.select().from(practiceSets)
      .where(eq(practiceSets.isRecommended, true))
      .limit(3);
  }
  
  async createPracticeSet(insertPracticeSet: InsertPracticeSet): Promise<PracticeSet> {
    const [practiceSet] = await db.insert(practiceSets)
      .values(insertPracticeSet)
      .returning();
    return practiceSet;
  }
  
  async updatePracticeSet(id: number, practiceSetData: Partial<PracticeSet>): Promise<PracticeSet> {
    const [updatedPracticeSet] = await db.update(practiceSets)
      .set(practiceSetData)
      .where(eq(practiceSets.id, id))
      .returning();
    
    if (!updatedPracticeSet) {
      throw new Error(`Practice set with id ${id} not found`);
    }
    
    return updatedPracticeSet;
  }
  
  async deletePracticeSet(id: number): Promise<void> {
    await db.delete(practiceSets).where(eq(practiceSets.id, id));
  }
  
  // Error logging operations
  async logError(insertErrorLog: InsertErrorLog): Promise<ErrorLog> {
    const [errorLog] = await db.insert(errorLogs)
      .values({
        ...insertErrorLog,
        timestamp: new Date()
      })
      .returning();
    return errorLog;
  }
  
  async getErrorLogs(limit: number = 50): Promise<ErrorLog[]> {
    return db.select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.timestamp))
      .limit(limit);
  }
  
  async getErrorLogsByUser(userId: number, limit: number = 50): Promise<ErrorLog[]> {
    return db.select()
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId))
      .orderBy(desc(errorLogs.timestamp))
      .limit(limit);
  }
  
  // Study plan operations
  async getStudyPlans(userId: number): Promise<StudyPlan[]> {
    return db.select().from(studyPlans).where(eq(studyPlans.userId, userId));
  }
  
  async getStudyPlan(id: number): Promise<StudyPlan | undefined> {
    const [studyPlan] = await db.select().from(studyPlans).where(eq(studyPlans.id, id));
    return studyPlan;
  }
  
  async createStudyPlan(studyPlan: InsertStudyPlan): Promise<StudyPlan> {
    const [newStudyPlan] = await db.insert(studyPlans)
      .values(studyPlan)
      .returning();
    return newStudyPlan;
  }
  
  async updateStudyPlan(id: number, studyPlanData: Partial<StudyPlan>): Promise<StudyPlan> {
    const [updatedStudyPlan] = await db.update(studyPlans)
      .set({ ...studyPlanData, lastUpdated: new Date() })
      .where(eq(studyPlans.id, id))
      .returning();
    
    if (!updatedStudyPlan) {
      throw new Error(`Study plan with id ${id} not found`);
    }
    
    return updatedStudyPlan;
  }
  
  async deleteStudyPlan(id: number): Promise<void> {
    // First delete all associated study plan items
    await db.delete(studyPlanItems).where(eq(studyPlanItems.planId, id));
    // Then delete the study plan
    await db.delete(studyPlans).where(eq(studyPlans.id, id));
  }
  
  // Study plan item operations
  async getStudyPlanItems(planId: number): Promise<StudyPlanItem[]> {
    return db.select().from(studyPlanItems)
      .where(eq(studyPlanItems.planId, planId))
      .orderBy(studyPlanItems.scheduledDate, studyPlanItems.priority);
  }
  
  async getStudyPlanItem(id: number): Promise<StudyPlanItem | undefined> {
    const [item] = await db.select().from(studyPlanItems).where(eq(studyPlanItems.id, id));
    return item;
  }
  
  async createStudyPlanItem(studyPlanItem: InsertStudyPlanItem): Promise<StudyPlanItem> {
    const [newItem] = await db.insert(studyPlanItems)
      .values(studyPlanItem)
      .returning();
    return newItem;
  }
  
  async updateStudyPlanItem(id: number, studyPlanItemData: Partial<StudyPlanItem>): Promise<StudyPlanItem> {
    const [updatedItem] = await db.update(studyPlanItems)
      .set(studyPlanItemData)
      .where(eq(studyPlanItems.id, id))
      .returning();
    
    if (!updatedItem) {
      throw new Error(`Study plan item with id ${id} not found`);
    }
    
    return updatedItem;
  }
  
  async deleteStudyPlanItem(id: number): Promise<void> {
    await db.delete(studyPlanItems).where(eq(studyPlanItems.id, id));
  }
  
  // Study plan generator
  async generateStudyPlan(userId: number, options: StudyPlanGenerationOptions): Promise<StudyPlan> {
    // Step 1: Analyze user progress to identify weak areas
    const focusAreas: FocusAreaWithDetails[] = [];
    
    if (options.generateFromUserProgress) {
      const userProgress = await this.getUserProgress(userId);
      const allTopics = await this.getAllTopics();
      
      // For each topic, calculate proficiency
      for (const topic of allTopics) {
        // Skip excluded topics if specified
        if (options.excludedTopics?.includes(topic.id)) {
          continue;
        }
        
        // Only include specified topics if includedTopics is provided
        if (options.includedTopics && !options.includedTopics.includes(topic.id)) {
          continue;
        }
        
        const progress = userProgress.find(p => p.topicId === topic.id);
        
        // Calculate proficiency as percentage of correct answers
        let proficiency = 0;
        if (progress && progress.questionsAttempted > 0) {
          proficiency = Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100);
        }
        
        // Determine priority based on proficiency
        // Lower proficiency = higher priority
        let priority = 2; // Default to medium priority
        if (proficiency < 40) {
          priority = 3; // High priority for very weak areas
        } else if (proficiency > 75) {
          priority = 1; // Low priority for strong areas
        }
        
        focusAreas.push({
          topicId: topic.id,
          proficiency,
          priority,
          topicName: topic.name
        });
      }
      
      // Sort by priority (descending) and then by proficiency (ascending)
      focusAreas.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.proficiency - b.proficiency;
      });
    }
    
    // If manually specified focus areas, add or update them
    if (options.focusAreas && options.focusAreas.length > 0) {
      const topicMap = new Map(focusAreas.map(area => [area.topicId, area]));
      
      for (const area of options.focusAreas) {
        const topic = await this.getTopic(area.topicId);
        if (!topic) continue;
        
        if (topicMap.has(area.topicId)) {
          // Update existing focus area with manual settings
          const existingArea = topicMap.get(area.topicId)!;
          existingArea.priority = area.priority;
          existingArea.proficiency = area.proficiency;
        } else {
          // Add new focus area
          focusAreas.push({
            topicId: area.topicId,
            proficiency: area.proficiency,
            priority: area.priority,
            topicName: topic.name
          });
        }
      }
    }
    
    // Step 2: Create the study plan
    const planName = options.name || `CFA Level I Study Plan (${new Date().toLocaleDateString()})`;
    const newPlan = await this.createStudyPlan({
      userId,
      name: planName,
      startDate: options.startDate instanceof Date ? options.startDate.toISOString() : options.startDate,
      endDate: options.endDate instanceof Date ? options.endDate.toISOString() : options.endDate,
      focusAreas: focusAreas as any, // Type casting to handle the JSON storage
      status: "active",
      progress: 0
    });
    
    // Step 3: Generate study plan items based on focus areas
    // Calculate total days in the plan
    const startDate = new Date(options.startDate);
    const endDate = new Date(options.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create an array of dates for the study plan
    const studyDates: Date[] = [];
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      studyDates.push(date);
    }
    
    // Daily study time in minutes (default to 60 if not specified)
    const dailyStudyTime = options.dailyStudyTime || 60;
    
    // Weight the distribution of study time based on priority
    const totalWeight = focusAreas.reduce((sum, area) => sum + area.priority, 0);
    
    for (const area of focusAreas) {
      // Get practice sets for this topic
      const topicPracticeSets = await this.getPracticeSets(area.topicId);
      
      // Skip if no practice sets available
      if (topicPracticeSets.length === 0) continue;
      
      // Calculate how many days to dedicate to this topic
      // Higher priority topics get more days
      const daysForTopic = Math.max(1, Math.round((area.priority / totalWeight) * daysDiff));
      
      // Calculate available dates for this topic
      // Distribute throughout the study period rather than clustering
      const datesPerTopic: Date[] = [];
      const stride = Math.max(1, Math.floor(daysDiff / daysForTopic));
      for (let i = 0; i < daysForTopic; i++) {
        const index = Math.min(i * stride, studyDates.length - 1);
        datesPerTopic.push(studyDates[index]);
      }
      
      // Create study plan items for this topic
      for (let i = 0; i < datesPerTopic.length; i++) {
        const practiceSet = topicPracticeSets[i % topicPracticeSets.length];
        
        await this.createStudyPlanItem({
          planId: newPlan.id,
          topicId: area.topicId,
          practiceSetId: practiceSet.id,
          title: `Study ${area.topicName}`,
          description: `Practice set: ${practiceSet.name}`,
          scheduledDate: datesPerTopic[i].toISOString().split('T')[0],
          estimatedDuration: dailyStudyTime,
          status: "pending",
          completed: false,
          priority: area.priority
        });
      }
    }
    
    // Return the created study plan
    return newPlan;
  }
  
  // Helper methods
  private async updateUserProgressAfterAnswer(answer: UserAnswer): Promise<void> {
    const question = await this.getQuestion(answer.questionId);
    if (!question) return;
    
    const topicId = question.topicId;
    const progress = await this.getUserProgressByTopic(answer.userId, topicId);
    
    if (progress) {
      await this.createOrUpdateUserProgress({
        userId: answer.userId,
        topicId,
        questionsAttempted: progress.questionsAttempted + 1,
        questionsCorrect: progress.questionsCorrect + (answer.isCorrect ? 1 : 0),
        totalTimeSpent: progress.totalTimeSpent + answer.timeSpent,
      });
    } else {
      await this.createOrUpdateUserProgress({
        userId: answer.userId,
        topicId,
        questionsAttempted: 1,
        questionsCorrect: answer.isCorrect ? 1 : 0,
        totalTimeSpent: answer.timeSpent,
      });
    }
    
    // Record activity
    await this.createUserActivity({
      userId: answer.userId,
      activityType: 'question_answered',
      topicId,
      details: { 
        questionId: answer.questionId,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      }
    });
  }
}

// Use Database Storage
export const storage = new DatabaseStorage();
