import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, BarChart, Clock } from 'lucide-react';

type ProgressSummaryProps = {
  overallProgress: {
    percentage: number;
    completed: number;
    total: number;
  };
  streakDays: number;
  averageScore: {
    percentage: number;
    change: number;
  };
};

export function ProgressSummary({ overallProgress, streakDays, averageScore }: ProgressSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Overall Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Overall Progress</h3>
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-4">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E4E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3949AB"
                  strokeWidth="3"
                  strokeDasharray={`${overallProgress.percentage}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                {overallProgress.percentage}%
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Overall completion</p>
              <p className="text-sm font-medium mt-1">{overallProgress.completed} of {overallProgress.total} questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Streak Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Study Streak</h3>
            <span className="text-[#FF9800]">🔥</span>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-[#FF9800] mr-4">{streakDays}</div>
            <div>
              <p className="text-sm text-neutral-400">Consecutive days</p>
              <p className="text-sm font-medium mt-1">Keep going!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Average Score</h3>
            <BarChart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-primary mr-4">{averageScore.percentage}%</div>
            <div>
              <p className="text-sm text-neutral-400">Across all topics</p>
              <p className="text-sm font-medium mt-1">
                {averageScore.change > 0 ? '+' : ''}{averageScore.change}% last week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
