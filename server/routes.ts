import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertUserAnswerSchema,
  insertUserProgressSchema,
  insertUserActivitySchema,
  insertPracticeSetSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/user - Get current user info (for demo purposes)
  app.get("/api/user", async (req, res) => {
    // For demo, we'll fetch the dummy user (ID 1)
    const user = await storage.getUser(1);
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

  const httpServer = createServer(app);
  return httpServer;
}
