import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { SideNavigation } from '@/components/layout/side-navigation';
import { ProgressSummary } from '@/components/dashboard/progress-summary';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { RecommendedSets } from '@/components/dashboard/recommended-sets';
import { TopicBarChart } from '@/components/analytics/topic-bar-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AdminLoginDialog } from '@/components/admin-login-dialog';
import { NotificationsPopover } from '@/components/ui/notifications';

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    retry: false,
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics', userData?.id],
    enabled: !!userData?.id,
    retry: false,
  });

  // Fetch recommended practice sets
  const { data: recommendedSets, isLoading: setsLoading } = useQuery({
    queryKey: ['/api/practice-sets/recommended', userData?.id],
    enabled: !!userData?.id,
    retry: false,
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/activity', userData?.id],
    enabled: !!userData?.id,
    retry: false,
  });

  if (userLoading || topicsLoading || analyticsLoading || setsLoading || activityLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Format topics with progress data
  const topics = topicsData?.map((topic: any) => {
    const topicProgress = analyticsData?.topicPerformance.find(
      (p: any) => p.topicId === topic.id
    );
    return {
      ...topic,
      progress: topicProgress?.accuracy || 0,
    };
  });

  // Format recent activity data
  const formattedActivity = activityData?.map((activity: any) => {
    let type = 'completed';
    let title = 'Completed practice';
    let details = '';

    if (activity.activityType === 'practice_completed') {
      title = `Completed ${activity.topic?.name || ''} practice set`;
      details = `Score: ${activity.details.score}%`;
      type = 'completed';
    } else if (activity.activityType === 'badge_earned') {
      title = `Earned badge: ${activity.details.badge}`;
      type = 'badge';
    } else if (activity.activityType === 'question_answered') {
      title = `Answered a question in ${activity.topic?.name || ''}`;
      details = activity.details.isCorrect ? 'Correct' : 'Incorrect';
      type = 'completed';
    }

    // Format date
    const date = new Date(activity.activityDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let timestamp = '';
    if (date.toDateString() === today.toDateString()) {
      timestamp = `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      timestamp = `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      timestamp = `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }

    return {
      id: activity.id,
      type,
      title,
      details,
      timestamp,
      topic: activity.topic?.name,
    };
  });

  // Format recommended sets
  const formattedSets = recommendedSets?.map((set: any) => ({
    id: set.id,
    name: set.name,
    topic: set.topic?.name || '',
    topicId: set.topicId,
    questions: set.questionCount,
    duration: set.estimatedTime,
    status: set.status,
  }));

  // Format topic data for chart
  const topicChartData = analyticsData?.topicPerformance
    .filter((topic: any) => topic.questionsAttempted > 0)
    .map((topic: any) => ({
      topic: topic.topicName,
      shortName: topic.topicName.split(' ')[0],
      percentage: topic.accuracy,
    }));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topics || []}
        user={{
          username: userData?.username || 'User',
          level: userData?.level || 'CFA Candidate',
          role: userData?.role || 'student',
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center lg:hidden">
              <h1 className="text-xl font-bold text-primary">CharterBuddyy Practice Hub</h1>
            </div>
            <div className="flex items-center">
              <div className="mr-4">
                <NotificationsPopover />
              </div>
              <div className="relative">
                <button className="flex items-center text-sm text-neutral-800 focus:outline-none">
                  <span className="hidden md:block mr-2">{userData?.username}</span>
                  <Avatar>
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.username || 'U')}&background=random`} alt={userData?.username} />
                    <AvatarFallback>{userData?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Welcome back, {userData?.username}!</h2>
              <p className="text-neutral-400">Continue your {userData?.level} preparation journey.</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              {/* {userData?.role !== 'admin' && <AdminLoginDialog />} */}
              {
                userData?.role === 'admin' && <Link href="/manage-questions">
                                    <Button className="flex items-center">
                                      <PlusCircle className="mr-2 h-5 w-5" />
                                      Add Questions
                                    </Button>
                                  </Link>
              }
              
            </div>
          </div>

          {/* Progress Summary */}
          <ProgressSummary
            overallProgress={{
              percentage: analyticsData?.summary?.accuracy || 0,
              completed: analyticsData?.summary?.totalQuestions || 0,
              total: analyticsData?.summary?.totalAvailableQuestions || 0,
            }}
            streakDays={userData?.streakDays || 0}
            averageScore={{
              percentage: analyticsData?.summary?.accuracy || 0,
              change: analyticsData?.summary?.change || 0
            }}
          />

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance By Topic Chart */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-neutral-800 mb-4">Performance By Topic</h3>
                <TopicBarChart data={topicChartData || []} />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <RecentActivity
              activities={formattedActivity || []}
              onViewAllActivity={() => setLocation('/analytics')}
            />
          </div>

          {/* Recommended Practice Sets */}
          <RecommendedSets sets={formattedSets || []} />
        </div>
      </div>
    </div>
  );
}
