import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { SideNavigation } from '@/components/layout/side-navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart as PieChartIcon, Users, BookOpen, Timer, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function StudentAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  // Fetch authenticated user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch all users (students)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!userData && userData.role === 'admin',
  });

  // Fetch all topics for context
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });

  // Fetch progress data for the selected student
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/progress', selectedStudent],
    enabled: !!selectedStudent,
  });

  // Fetch activity data for the selected student
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/activity', selectedStudent],
    enabled: !!selectedStudent,
  });

  // Filter to only get student users
  const students = usersData?.filter(user => user.role === 'student') || [];

  // Redirect if not admin
  if (userData && userData.role !== 'admin') {
    setLocation('/');
    return null;
  }

  if (userLoading || usersLoading || topicsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-neutral-600">Loading student data...</p>
        </div>
      </div>
    );
  }
  
  // Format topics with progress data
  const topics = topicsData?.map((topic) => {
    const topicProgress = progressData?.find((p) => p.topicId === topic.id);
    return {
      ...topic,
      progress: topicProgress
        ? Math.round((topicProgress.questionsCorrect / topicProgress.questionsAttempted) * 100) || 0
        : 0,
      totalQuestions: topicProgress?.questionsAttempted || 0,
      correctAnswers: topicProgress?.questionsCorrect || 0,
    };
  }) || [];

  // Generate data for charts
  const pieData = topics
    .filter(topic => topic.totalQuestions > 0)
    .map(topic => ({
      name: topic.name,
      value: topic.totalQuestions,
    }));

  const barData = topics
    .filter(topic => topic.totalQuestions > 0)
    .map(topic => ({
      name: topic.name,
      score: topic.progress,
    }));

  // Calculate summary metrics
  const totalQuestionsAnswered = progressData?.reduce((acc, curr) => acc + curr.questionsAttempted, 0) || 0;
  const totalCorrectAnswers = progressData?.reduce((acc, curr) => acc + curr.questionsCorrect, 0) || 0;
  const overallAccuracy = totalQuestionsAnswered > 0 
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) 
    : 0;
  const totalTimeSpent = progressData?.reduce((acc, curr) => acc + curr.totalTimeSpent, 0) || 0;
  const totalTimeSpentMinutes = Math.round(totalTimeSpent / 60);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Format date for activity
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topicsData || []}
        user={{
          username: userData?.username || 'Admin',
          level: 'Administrator',
          role: 'admin',
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Page Header */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">Student Analytics</h1>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Student Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Students
                </CardTitle>
                <CardDescription>
                  Select a student to view detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Streak</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student) => (
                          <TableRow 
                            key={student.id}
                            className={selectedStudent === student.id ? "bg-primary/10" : ""}
                          >
                            <TableCell className="font-medium">{student.username}</TableCell>
                            <TableCell>{student.email || 'No email'}</TableCell>
                            <TableCell>{student.level || 'CFA Candidate'}</TableCell>
                            <TableCell>
                              {student.streakDays ? (
                                <Badge variant="outline" className="bg-primary/5 text-primary">
                                  {student.streakDays} day streak
                                </Badge>
                              ) : (
                                'No streak'
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant={selectedStudent === student.id ? "secondary" : "outline"}
                                onClick={() => setSelectedStudent(student.id)}
                                size="sm"
                              >
                                {selectedStudent === student.id ? 'Selected' : 'View Analytics'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Section */}
            {selectedStudent && (
              <>
                {progressLoading || activityLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-neutral-600">Loading analytics...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Student Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Questions Attempted</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold flex items-center">
                            {totalQuestionsAnswered}
                            <BookOpen className="ml-2 h-5 w-5 text-primary/70" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Overall Accuracy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold flex items-center">
                            {overallAccuracy}%
                            <Activity className="ml-2 h-5 w-5 text-primary/70" />
                          </div>
                          <Progress value={overallAccuracy} className="h-2 mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Time Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold flex items-center">
                            {totalTimeSpentMinutes} mins
                            <Timer className="ml-2 h-5 w-5 text-primary/70" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Topics Practiced</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold flex items-center">
                            {topics.filter(t => t.totalQuestions > 0).length} / {topics.length}
                            <BookOpen className="ml-2 h-5 w-5 text-primary/70" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <Tabs defaultValue="performance" className="mb-6">
                      <TabsList className="mb-2">
                        <TabsTrigger value="performance" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Performance by Topic
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center">
                          <PieChartIcon className="mr-2 h-4 w-4" />
                          Activity Distribution
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="performance" className="mt-0">
                        <Card>
                          <CardHeader>
                            <CardTitle>Performance by Topic</CardTitle>
                            <CardDescription>
                              Accuracy percentage across different topics
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {barData.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <BarChart3 className="h-16 w-16 mb-4 text-muted-foreground/30" />
                                <p>No performance data available yet</p>
                              </div>
                            ) : (
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    width={500}
                                    height={300}
                                    data={barData}
                                    margin={{
                                      top: 5,
                                      right: 30,
                                      left: 20,
                                      bottom: 5,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#4f46e5" name="Accuracy %" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="activity" className="mt-0">
                        <Card>
                          <CardHeader>
                            <CardTitle>Activity Distribution</CardTitle>
                            <CardDescription>
                              Questions attempted per topic
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {pieData.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <PieChartIcon className="h-16 w-16 mb-4 text-muted-foreground/30" />
                                <p>No activity data available yet</p>
                              </div>
                            ) : (
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart width={400} height={400}>
                                    <Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="mr-2 h-5 w-5 text-primary" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>
                          Last {activityData?.length || 0} activities by this student
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Activity Type</TableHead>
                                <TableHead>Topic</TableHead>
                                <TableHead>Details</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activityData?.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No activity recorded yet
                                  </TableCell>
                                </TableRow>
                              ) : (
                                activityData?.map((activity) => (
                                  <TableRow key={activity.id}>
                                    <TableCell>{formatDate(activity.activityDate)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize">
                                        {activity.activityType}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {activity.topic?.name || 'General'}
                                    </TableCell>
                                    <TableCell>
                                      {activity.details && typeof activity.details === 'object'
                                        ? activity.details.isCorrect !== undefined
                                          ? activity.details.isCorrect
                                            ? 'Correct answer'
                                            : 'Incorrect answer'
                                          : JSON.stringify(activity.details)
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}