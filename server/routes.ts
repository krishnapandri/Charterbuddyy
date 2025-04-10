import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertUserAnswerSchema,
  insertUserProgressSchema,
  insertUserActivitySchema,
  insertPracticeSetSchema,
  insertQuestionSchema,
  insertTopicSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    next();
  };
  
  // GET /api/user - Get current authenticated user info
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // GET /api/topics - Get all topics
  app.get("/api/topics", async (req, res) => {
    const topics = await storage.getAllTopics();
    res.json(topics);
  });

  // GET /api/topics/:id - Get a specific topic
  app.get("/api/topics/:id", async (req, res) => {
    const topicId = parseInt(req.params.id);
    const topic = await storage.getTopic(topicId);
    
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    
    res.json(topic);
  });

  // GET /api/questions/topic/:topicId - Get questions by topic
  app.get("/api/questions/topic/:topicId", async (req, res) => {
    const topicId = parseInt(req.params.topicId);
    const questions = await storage.getQuestionsByTopic(topicId);
    res.json(questions);
  });

  // GET /api/questions/:id - Get a specific question
  app.get("/api/questions/:id", async (req, res) => {
    const questionId = parseInt(req.params.id);
    const question = await storage.getQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.json(question);
  });

  // POST /api/answers - Submit an answer
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertUserAnswerSchema.parse(req.body);
      const answer = await storage.createUserAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error submitting answer" });
    }
  });

  // GET /api/progress/:userId - Get user progress across all topics
  app.get("/api/progress/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const progress = await storage.getUserProgress(userId);
    
    // Combine with topic data for the full response
    const topics = await storage.getAllTopics();
    const topicsMap = new Map(topics.map(t => [t.id, t]));
    
    const progressWithTopics = progress.map(p => ({
      ...p,
      topic: topicsMap.get(p.topicId)
    }));
    
    res.json(progressWithTopics);
  });

  // GET /api/progress/:userId/topic/:topicId - Get user progress for a specific topic
  app.get("/api/progress/:userId/topic/:topicId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const topicId = parseInt(req.params.topicId);
    
    const progress = await storage.getUserProgressByTopic(userId, topicId);
    
    if (!progress) {
      return res.json({ 
        userId,
        topicId,
        questionsAttempted: 0,
        questionsCorrect: 0,
        totalTimeSpent: 0
      });
    }
    
    res.json(progress);
  });

  // GET /api/activity/:userId - Get user activity
  app.get("/api/activity/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const activities = await storage.getUserActivity(userId, limit);
    
    // Enrich with topic data
    const topics = await storage.getAllTopics();
    const topicsMap = new Map(topics.map(t => [t.id, t]));
    
    const enrichedActivities = activities.map(activity => ({
      ...activity,
      topic: activity.topicId ? topicsMap.get(activity.topicId) : undefined
    }));
    
    res.json(enrichedActivities);
  });

  // GET /api/practice-sets - Get all practice sets
  app.get("/api/practice-sets", async (req, res) => {
    const topicId = req.query.topic ? parseInt(req.query.topic as string) : undefined;
    const sets = await storage.getPracticeSets(topicId);
    
    // Enrich with topic data
    const topics = await storage.getAllTopics();
    const topicsMap = new Map(topics.map(t => [t.id, t]));
    
    const enrichedSets = sets.map(set => ({
      ...set,
      topic: topicsMap.get(set.topicId)
    }));
    
    res.json(enrichedSets);
  });

  // GET /api/practice-sets/recommended/:userId - Get recommended practice sets
  app.get("/api/practice-sets/recommended/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const recommendedSets = await storage.getRecommendedPracticeSets(userId);
    
    // Enrich with topic data
    const topics = await storage.getAllTopics();
    const topicsMap = new Map(topics.map(t => [t.id, t]));
    
    const enrichedSets = recommendedSets.map(set => ({
      ...set,
      topic: topicsMap.get(set.topicId)
    }));
    
    res.json(enrichedSets);
  });

  // GET /api/questions/all - Get all questions (admin only)
  app.get("/api/questions/all", isAdmin, async (req, res) => {
    try {
      const allQuestions = [];
      const topics = await storage.getAllTopics();
      
      for (const topic of topics) {
        const questions = await storage.getQuestionsByTopic(topic.id);
        allQuestions.push(...questions);
      }
      
      res.json(allQuestions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions" });
    }
  });
  
  // GET /api/users - Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from the response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // POST /api/topics - Create a new topic (admin only)
  app.post("/api/topics", isAdmin, async (req, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating topic" });
    }
  });
  
  // PATCH /api/topics/:id - Update a topic (admin only)
  app.patch("/api/topics/:id", isAdmin, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      // Get the topic first to ensure it exists
      const existingTopic = await storage.getTopic(topicId);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      const topicData = req.body; // Already validated by isAdmin middleware
      const topic = await storage.updateTopic(topicId, topicData);
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Error updating topic" });
    }
  });
  
  // DELETE /api/topics/:id - Delete a topic (admin only)
  app.delete("/api/topics/:id", isAdmin, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      // Get the topic first to ensure it exists
      const existingTopic = await storage.getTopic(topicId);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      await storage.deleteTopic(topicId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting topic" });
    }
  });

  // POST /api/questions - Create a new question (admin only)
  app.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating question" });
    }
  });
  
  // PATCH /api/questions/:id - Update a question (admin only)
  app.patch("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      
      // Get the question first to ensure it exists
      const existingQuestion = await storage.getQuestion(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const questionData = req.body; // Already validated by isAdmin middleware
      const question = await storage.updateQuestion(questionId, questionData);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Error updating question" });
    }
  });
  
  // DELETE /api/questions/:id - Delete a question (admin only)
  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      
      // Get the question first to ensure it exists
      const existingQuestion = await storage.getQuestion(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      await storage.deleteQuestion(questionId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting question" });
    }
  });
  
  // POST /api/practice-sets - Create a practice set (admin only)
  app.post("/api/practice-sets", isAdmin, async (req, res) => {
    try {
      const practiceSetData = insertPracticeSetSchema.parse(req.body);
      const practiceSet = await storage.createPracticeSet(practiceSetData);
      res.status(201).json(practiceSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating practice set" });
    }
  });
  
  // PATCH /api/practice-sets/:id - Update a practice set (admin only)
  app.patch("/api/practice-sets/:id", isAdmin, async (req, res) => {
    try {
      const practiceSetId = parseInt(req.params.id);
      
      // Ensure the practice set exists
      const practiceSet = await storage.getPracticeSet(practiceSetId);
      if (!practiceSet) {
        return res.status(404).json({ message: "Practice set not found" });
      }
      
      const practiceSetData = req.body;
      const updatedPracticeSet = await storage.updatePracticeSet(practiceSetId, practiceSetData);
      res.json(updatedPracticeSet);
    } catch (error) {
      res.status(500).json({ message: "Error updating practice set" });
    }
  });
  
  // DELETE /api/practice-sets/:id - Delete a practice set (admin only)
  app.delete("/api/practice-sets/:id", isAdmin, async (req, res) => {
    try {
      const practiceSetId = parseInt(req.params.id);
      
      // Ensure the practice set exists
      const practiceSet = await storage.getPracticeSet(practiceSetId);
      if (!practiceSet) {
        return res.status(404).json({ message: "Practice set not found" });
      }
      
      await storage.deletePracticeSet(practiceSetId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting practice set" });
    }
  });
  
  // PATCH /api/users/:id - Update a user (admin only)
  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userData = req.body;
      
      // Hash password if it's being updated
      if (userData.password) {
        const { hashPassword } = await import('./auth');
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // DELETE /api/users/:id - Delete a user (admin only)
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // GET /api/analytics/:userId - Get comprehensive user analytics
  app.get("/api/analytics/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get overall progress across topics
    const progress = await storage.getUserProgress(userId);
    
    // Get all topics for reference
    const topics = await storage.getAllTopics();
    
    // Calculate overall stats
    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalTimeSpent = 0;
    
    progress.forEach(p => {
      totalAttempted += p.questionsAttempted;
      totalCorrect += p.questionsCorrect;
      totalTimeSpent += p.totalTimeSpent;
    });
    
    // Calculate average time per question (in seconds)
    const avgTimePerQuestion = totalAttempted > 0 
      ? Math.round(totalTimeSpent / totalAttempted) 
      : 0;
    
    // Calculate overall accuracy
    const overallAccuracy = totalAttempted > 0
      ? Math.round((totalCorrect / totalAttempted) * 100)
      : 0;
    
    // Prepare topic performance data
    const topicPerformance = topics.map(topic => {
      const topicProgress = progress.find(p => p.topicId === topic.id);
      
      if (!topicProgress) {
        return {
          topicId: topic.id,
          topicName: topic.name,
          questionsAttempted: 0,
          questionsCorrect: 0,
          accuracy: 0,
          avgTimePerQuestion: 0,
          progress: 0
        };
      }
      
      const accuracy = topicProgress.questionsAttempted > 0
        ? Math.round((topicProgress.questionsCorrect / topicProgress.questionsAttempted) * 100)
        : 0;
        
      const avgTime = topicProgress.questionsAttempted > 0
        ? Math.round(topicProgress.totalTimeSpent / topicProgress.questionsAttempted)
        : 0;
      
      return {
        topicId: topic.id,
        topicName: topic.name,
        questionsAttempted: topicProgress.questionsAttempted,
        questionsCorrect: topicProgress.questionsCorrect,
        accuracy,
        avgTimePerQuestion: avgTime,
        progress: accuracy // For now, use accuracy as progress indicator
      };
    });
    
    // Get recent activity
    const recentActivity = await storage.getUserActivity(userId, 5);
    
    // Create analytics response
    const analytics = {
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        streakDays: user.streakDays
      },
      summary: {
        totalQuestions: totalAttempted,
        accuracy: overallAccuracy,
        totalTimeSpent: Math.round(totalTimeSpent / 3600), // Convert to hours
        avgTimePerQuestion
      },
      topicPerformance,
      recentActivity
    };
    
    res.json(analytics);
  });
  
  // Study Plan routes and Generator are removed per user's request

  const httpServer = createServer(app);
  return httpServer;
}
