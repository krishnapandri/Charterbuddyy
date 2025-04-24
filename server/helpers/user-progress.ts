import { db } from "../db";
import { userAnswers, UserAnswer } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Checks if a user has previously answered the given question
 * Used to avoid counting repeat answers in progress tracking
 */
export async function hasUserPreviouslyAnswered(userId: number, questionId: number): Promise<boolean> {
  try {
    const previousAnswers = await db
      .select()
      .from(userAnswers)
      .where(and(
        eq(userAnswers.userId, userId),
        eq(userAnswers.questionId, questionId)
      ));
    
    return previousAnswers.length > 0;
  } catch (error) {
    console.error("Error checking previous answers:", error);
    return false;
  }
}