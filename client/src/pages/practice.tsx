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

  // Fetch topic data
  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: topicId ? [`/api/topics/${topicId}`] : null,
    enabled: !!topicId,
  });

  // Fetch questions for the topic
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: topicId ? [`/api/questions/topic/${topicId}`] : null,
    enabled: !!topicId,
  });

  // Fetch all topics for the sidebar
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });

  // Format topics with progress data (simplified for demo)
  const topics = topicsData?.map((topic: any) => ({
    ...topic,
    progress: topic.id === topicId ? 75 : 50, // Placeholder progress
  }));

  // Submit answer mutation
  const answerMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/answers', data),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/progress/1`] });
    },
  });

  // Initialize practice session when questions are loaded
  useEffect(() => {
    if (questionsData && questionsData.length > 0) {
      // Take a subset of questions for the practice session
      setQuestions(questionsData.slice(0, 10));
      setCurrentQuestionIndex(0);
      startTimer();
    }
  }, [questionsData]);

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
    if (!topicId) return;
    
    answerMutation.mutate({
      userId: 1, // Hardcoded for demo
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
          username: 'Alex Morgan', // Hardcoded for demo
          level: 'Level II Candidate', // Hardcoded for demo
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

          {/* Question Card */}
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onSubmit={handleSubmitAnswer}
              onNext={handleNextQuestion}
              startTime={startTime}
            />
          )}
        </div>
      </div>
    </div>
  );
}
