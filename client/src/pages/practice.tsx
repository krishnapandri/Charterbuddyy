import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { SideNavigation } from '@/components/layout/side-navigation';
import { QuestionCard, Question } from '@/components/practice/question-card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Timer } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

export default function Practice() {
  // Get topicId from URL parameter
  const [match, params] = useRoute('/practice/:topicId');
  const [, setLocation] = useLocation();
  const topicId = match ? parseInt(params.topicId) : null;

  // State for practice session
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Fetch user data first
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch topic data
  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: topicId ? ['/api/topics', topicId] : [''],
    enabled: !!topicId,
  });

  // Fetch questions for the topic
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: topicId ? ['/api/topic-questions/'+topicId] : [''],
    enabled: !!topicId,
  });
  
  // Log when questions data changes
  useEffect(() => {
    if (questionsData) {
      console.log("Successfully fetched questions for topic:", topicId, "Data:", questionsData);
    }
  }, [questionsData, topicId]);

  // Fetch all topics for the sidebar
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });
  
  // Fetch user progress data (after userData is fetched)
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/progress', userData?.id],
    enabled: !!userData?.id,
  });

  // Format topics with actual progress data
  const topics = topicsData?.map((topic: any) => {
    const topicProgress = progressData?.find((p: any) => p.topicId === topic.id);
    return {
      ...topic,
      progress: topicProgress 
        ? Math.round((topicProgress.questionsCorrect / topicProgress.questionsAttempted) * 100) || 0
        : 0
    };
  });

  // Submit answer mutation
  const answerMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/answers', data),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      if (userData?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/progress', userData.id] });
      }
    },
  });

  // Initialize practice session when questions are loaded
  useEffect(() => {
    console.log("Questions data:", questionsData, "Topic ID:", topicId);
    if (questionsData && questionsData.length > 0) {
      // Take a subset of questions for the practice session
      setQuestions(questionsData.slice(0, 10));
      setCurrentQuestionIndex(0);
      startTimer();
    } else if (questionsData && questionsData.length === 0) {
      console.log("No questions found for topic ID:", topicId);
    }
  }, [questionsData, topicId]);

  // Timer functions
  const startTimer = () => {
    setStartTime(Date.now());
    setTimer(0);
    
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Start a new timer
    const id = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    setIntervalId(id);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Handle submitting an answer
  const handleSubmitAnswer = (answer: string, isCorrect: boolean, timeSpent: number) => {
    if (!topicId || !userData?.id) return;
    
    answerMutation.mutate({
      userId: userData.id,
      questionId: questions[currentQuestionIndex].id,
      userOption: answer,
      isCorrect,
      timeSpent
    });
  };

  // Handle moving to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStartTime(Date.now()); // Reset the start time for the next question
    } else {
      // End of practice session
      if (intervalId) {
        clearInterval(intervalId);
      }
      setLocation('/'); // Go back to dashboard
    }
  };

  // Go back to dashboard
  const handleBackToDashboard = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setLocation('/');
  };

  if (topicLoading || questionsLoading || topicsLoading || !topicData) {
    return <div className="p-8">Loading...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

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
        activeTopic={topicId || undefined}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center lg:hidden">
              <h1 className="text-xl font-bold text-primary">CFA Practice Hub</h1>
            </div>
            <div></div> {/* Empty div to maintain flex spacing */}
          </div>
        </div>

        {/* Practice Content */}
        <div className="p-6">
          {/* Practice Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <button 
                  onClick={handleBackToDashboard}
                  className="mr-3 text-neutral-400 hover:text-neutral-800"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-neutral-800">{topicData.name}</h2>
              </div>
              <p className="text-neutral-400 mt-1">
                Practice Session - Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="bg-white rounded-full px-4 py-2 shadow-sm flex items-center">
                <Timer className="h-5 w-5 text-[#FFC107] mr-2" />
                <span className="text-sm font-medium">{formatTime(timer)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="w-full h-2 mb-8" />

          {/* Question Card or No Questions Message */}
          {currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onSubmit={handleSubmitAnswer}
              onNext={handleNextQuestion}
              startTime={startTime}
            />
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">No Questions Available</h3>
              <p className="text-neutral-600 mb-6">
                There are currently no practice questions available for this topic. 
                Please check back later or select another topic.
              </p>
              <button 
                onClick={handleBackToDashboard}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
