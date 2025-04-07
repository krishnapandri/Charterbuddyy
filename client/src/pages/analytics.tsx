import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PerformanceChart } from '@/components/analytics/performance-chart';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  Timer, 
  Bell
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'wouter';

export default function Analytics() {
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
    queryKey: ['/api/analytics/1'], // Hardcoded user ID for demo
    retry: false,
  });

  if (userLoading || topicsLoading || analyticsLoading) {
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

  // Mock performance trend data (would come from API in a real app)
  const performanceTrendData = [
    { date: 'Nov 1', score: 60 },
    { date: 'Nov 7', score: 65 },
    { date: 'Nov 14', score: 67 },
    { date: 'Nov 21', score: 66 },
    { date: 'Nov 28', score: 70 },
    { date: 'Dec 5', score: 72 },
    { date: 'Dec 12', score: 75 },
    { date: 'Dec 19', score: 77 },
    { date: 'Today', score: 80 },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topics || []}
        user={{
          username: userData?.username || 'User',
          level: userData?.level || 'CFA Candidate',
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center lg:hidden">
              <h1 className="text-xl font-bold text-primary">CFA Practice Hub</h1>
            </div>
            <div className="flex items-center">
              <button className="mr-4 text-neutral-400 hover:text-neutral-800">
                <Bell />
              </button>
              <div className="relative">
                <button className="flex items-center text-sm text-neutral-800 focus:outline-none">
                  <span className="hidden md:block mr-2">{userData?.username}</span>
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=32&h=32&q=80" alt={userData?.username} />
                    <AvatarFallback>{userData?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Performance Analytics</h2>
            <p className="text-neutral-400">Track your progress and identify areas for improvement.</p>
          </div>

          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-800">Questions</h3>
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-neutral-800">
                  {analyticsData?.summary?.totalQuestions || 0}
                </div>
                <p className="text-sm text-neutral-400 mt-1">Total answered</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-800">Accuracy</h3>
                  <CheckCircle className="h-5 w-5 text-[#4CAF50]" />
                </div>
                <div className="text-3xl font-bold text-[#4CAF50]">
                  {analyticsData?.summary?.accuracy || 0}%
                </div>
                <p className="text-sm text-neutral-400 mt-1">Overall accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-800">Study Time</h3>
                  <Clock className="h-5 w-5 text-[#FF9800]" />
                </div>
                <div className="text-3xl font-bold text-[#FF9800]">
                  {analyticsData?.summary?.totalTimeSpent || 0}h
                </div>
                <p className="text-sm text-neutral-400 mt-1">Total time spent</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-800">Avg. Time</h3>
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  {analyticsData?.summary?.avgTimePerQuestion || 0}s
                </div>
                <p className="text-sm text-neutral-400 mt-1">Per question</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trend Chart */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Performance Trend</h3>
              <PerformanceChart data={performanceTrendData} />
            </CardContent>
          </Card>

          {/* Topic Performance Table */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Topic Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Accuracy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {analyticsData?.topicPerformance.map((topic: any) => (
                      <tr key={topic.topicId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-neutral-800">{topic.topicName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {topic.questionsAttempted}/{topic.questionsAttempted + 25} {/* Adding 25 more for total */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={topic.accuracy >= 60 ? "correct" : "incorrect"}
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          >
                            {topic.accuracy}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {topic.avgTimePerQuestion}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Progress value={topic.accuracy} className="w-full h-2" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link href={`/practice/${topic.topicId}`}>
                            <a className="text-primary hover:text-primary-dark">Practice</a>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
