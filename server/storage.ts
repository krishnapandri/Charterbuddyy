import {
  users,
  topics,
  questions,
  userAnswers,
  userProgress,
  userActivity,
  practiceSets,
  type User,
  type InsertUser,
  type Topic,
  type InsertTopic,
  type Question,
  type InsertQuestion,
  type UserAnswer,
  type InsertUserAnswer,
  type UserProgress,
  type InsertUserProgress,
  type UserActivity,
  type InsertUserActivity,
  type PracticeSet,
  type InsertPracticeSet
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streakDays: number): Promise<User | undefined>;
  
  // Topic operations
  getAllTopics(): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Question operations
  getQuestionsByTopic(topicId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
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
  getRecommendedPracticeSets(userId: number): Promise<PracticeSet[]>;
  createPracticeSet(practiceSet: InsertPracticeSet): Promise<PracticeSet>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private topics: Map<number, Topic>;
  private questions: Map<number, Question>;
  private userAnswers: Map<number, UserAnswer>;
  private userProgress: Map<number, UserProgress>;
  private userActivity: Map<number, UserActivity>;
  private practiceSets: Map<number, PracticeSet>;
  
  private userIdCounter: number;
  private topicIdCounter: number;
  private questionIdCounter: number;
  private userAnswerIdCounter: number;
  private userProgressIdCounter: number;
  private userActivityIdCounter: number;
  private practiceSetIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.topics = new Map();
    this.questions = new Map();
    this.userAnswers = new Map();
    this.userProgress = new Map();
    this.userActivity = new Map();
    this.practiceSets = new Map();
    
    this.userIdCounter = 1;
    this.topicIdCounter = 1;
    this.questionIdCounter = 1;
    this.userAnswerIdCounter = 1;
    this.userProgressIdCounter = 1;
    this.userActivityIdCounter = 1;
    this.practiceSetIdCounter = 1;
    
    // Initialize with sample data
    this.initializeData();
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
    const user: User = { ...insertUser, id, streakDays: 0, lastLoginDate: new Date() };
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
  
  // Question operations
  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.topicId === topicId
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
  
  private initializeData(): void {
    // Add sample user
    const user: User = {
      id: this.userIdCounter++,
      username: 'alex',
      password: 'password123',
      level: 'Level II Candidate',
      streakDays: 15,
      lastLoginDate: new Date()
    };
    this.users.set(user.id, user);
    
    // Add sample topics
    const topicData: InsertTopic[] = [
      { name: 'Ethics & Professional Standards', description: 'Ethics, professional standards, and regulation', icon: 'book' },
      { name: 'Economics', description: 'Microeconomics and macroeconomics', icon: 'book' },
      { name: 'Financial Statement Analysis', description: 'Financial reporting and analysis', icon: 'book' },
      { name: 'Corporate Finance', description: 'Corporate finance principles', icon: 'book' },
      { name: 'Equity Investments', description: 'Equity valuation and analysis', icon: 'book' },
      { name: 'Fixed Income', description: 'Fixed income securities and analysis', icon: 'book' },
      { name: 'Derivatives', description: 'Derivative instruments and strategies', icon: 'book' },
      { name: 'Portfolio Management', description: 'Portfolio management principles', icon: 'book' }
    ];
    
    const topics: Topic[] = topicData.map(t => {
      const topic: Topic = { ...t, id: this.topicIdCounter++ };
      this.topics.set(topic.id, topic);
      return topic;
    });
    
    // Add sample questions for Ethics topic
    const ethicsQuestions: InsertQuestion[] = [
      {
        topicId: topics[0].id,
        subtopic: 'Code of Ethics',
        questionText: 'According to the CFA Institute Code of Ethics, which of the following best describes the duty of a CFA charterholder when facing a potential conflict of interest?',
        context: 'A CFA charterholder is employed by an investment firm and also serves on the board of a local charity. The charterholder is responsible for managing the charity\'s investment portfolio. What action should the charterholder take?',
        optionA: 'Decline to manage the charity\'s portfolio, as the conflict cannot be adequately addressed.',
        optionB: 'Disclose the conflict to both parties and obtain written consent before proceeding with managing the investments.',
        optionC: 'Manage the investments but avoid charging fees to the charity.',
        optionD: 'Continue managing both portfolios but create a blind trust for the charity\'s investments.',
        correctOption: 'B',
        explanation: 'According to the CFA Institute Standard VI(A) on Disclosure of Conflicts, members must make full and fair disclosure of all matters that could reasonably be expected to impair their independence and objectivity or interfere with their duties to clients. In this case, the charterholder has obligations to both the investment firm and the charity. The proper course of action is to disclose the conflict to both parties and obtain their consent before managing the charity\'s investments.',
        difficulty: 2
      },
      {
        topicId: topics[0].id,
        subtopic: 'Standards of Practice',
        questionText: 'Which of the following actions would most likely violate the CFA Institute Standards of Professional Conduct?',
        context: 'A portfolio manager at an investment firm is considering various actions.',
        optionA: 'Using the firm\'s research reports to make personal investment decisions after the information has been disseminated to clients',
        optionB: 'Accepting a small gift from a client during the holiday season',
        optionC: 'Stating in marketing materials that the firm\'s investment strategy has outperformed the S&P 500 for the past 5 years without providing appropriate disclosures about the methodology',
        optionD: 'Informing clients that the firm uses a proprietary investment model',
        correctOption: 'C',
        explanation: 'Standard III(D) - Performance Presentation requires that members make reasonable efforts to ensure that performance information is fair, accurate, and complete. Stating that the firm\'s strategy has outperformed the S&P 500 without providing appropriate disclosures about the methodology violates this standard. Without proper disclosures about how returns were calculated, whether they are net of fees, and other relevant information, clients may be misled about the actual performance of the investment strategy.',
        difficulty: 1
      }
    ];
    
    for (const q of ethicsQuestions) {
      const question: Question = { ...q, id: this.questionIdCounter++ };
      this.questions.set(question.id, question);
    }
    
    // Add sample user progress data
    const progressData: InsertUserProgress[] = [
      { userId: user.id, topicId: topics[0].id, questionsAttempted: 150, questionsCorrect: 127, totalTimeSpent: 9750 },
      { userId: user.id, topicId: topics[1].id, questionsAttempted: 85, questionsCorrect: 53, totalTimeSpent: 6970 },
      { userId: user.id, topicId: topics[2].id, questionsAttempted: 65, questionsCorrect: 26, totalTimeSpent: 6175 }
    ];
    
    for (const p of progressData) {
      const progress: UserProgress = { ...p, id: this.userProgressIdCounter++, lastUpdated: new Date() };
      this.userProgress.set(progress.id, progress);
    }
    
    // Add sample user activity
    const activityData: InsertUserActivity[] = [
      { 
        userId: user.id, 
        activityType: 'practice_completed', 
        topicId: topics[0].id, 
        details: { score: 85, questions: 10 } 
      },
      { 
        userId: user.id, 
        activityType: 'practice_completed', 
        topicId: topics[1].id, 
        details: { score: 67, questions: 10 } 
      },
      { 
        userId: user.id, 
        activityType: 'badge_earned', 
        topicId: topics[2].id, 
        details: { badge: 'FSA Explorer' } 
      },
      { 
        userId: user.id, 
        activityType: 'practice_completed', 
        topicId: topics[2].id, 
        details: { score: 45, questions: 10 } 
      }
    ];
    
    // Add with different dates to create history
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    activityData.forEach((a, i) => {
      const activity: UserActivity = { 
        ...a, 
        id: this.userActivityIdCounter++, 
        activityDate: new Date(now.getTime() - (i * dayInMs)) 
      };
      this.userActivity.set(activity.id, activity);
    });
    
    // Add sample practice sets
    const practiceSetsData: InsertPracticeSet[] = [
      {
        name: 'Code of Ethics Advanced',
        topicId: topics[0].id,
        subtopic: 'Code of Ethics',
        questionCount: 15,
        estimatedTime: 20,
        difficulty: 2,
        isRecommended: true,
        status: 'new'
      },
      {
        name: 'FSA Basics',
        topicId: topics[2].id,
        subtopic: 'Financial Reporting',
        questionCount: 10,
        estimatedTime: 15,
        difficulty: 1,
        isRecommended: true,
        status: 'needs_review'
      },
      {
        name: 'Economics: Business Cycles',
        topicId: topics[1].id,
        subtopic: 'Macroeconomics',
        questionCount: 12,
        estimatedTime: 18,
        difficulty: 2,
        isRecommended: true,
        status: 'new'
      }
    ];
    
    for (const ps of practiceSetsData) {
      const practiceSet: PracticeSet = { ...ps, id: this.practiceSetIdCounter++ };
      this.practiceSets.set(practiceSet.id, practiceSet);
    }
  }
}

export const storage = new MemStorage();
