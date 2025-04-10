// Type definitions for study plan generation

export interface WeakArea {
  topicId: number;
  proficiency: number; // 0-100%
  priority: number; // 1-3 (low, medium, high)
}

export interface StudyPlanGenerationOptions {
  name?: string;
  startDate: Date;
  endDate: Date;
  dailyStudyTime?: number; // minutes
  targetExamDate?: Date;
  includedTopics?: number[]; // topicIds
  excludedTopics?: number[]; // topicIds
  focusAreas?: WeakArea[]; // Explicitly defined weak areas to focus on
  generateFromUserProgress?: boolean; // Whether to auto-generate weak areas from user progress
}

export interface FocusAreaWithDetails {
  topicId: number;
  priority: number; // 1-3
  topicName: string;
  proficiency: number; // 0-100%
}