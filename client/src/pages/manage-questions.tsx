import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Save } from 'lucide-react';
import { insertQuestionSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Extended schema with validation
const questionFormSchema = insertQuestionSchema.extend({
  topicId: z.coerce.number().min(1, 'Please select a topic'),
  chapterId: z.coerce.number().min(1, 'Please select a chapter'),
  questionText: z.string().min(10, 'Question must be at least 10 characters'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  correctOption: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function ManageQuestions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Fetch topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });
  
  // Fetch chapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/chapters'],
  });
  
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      topicId: 0,
      chapterId: 0,
      subtopic: '',
      questionText: '',
      context: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: '',
      explanation: '',
      difficulty: 1,
    },
  });
  
  // State to store filtered chapters based on selected topic
  const [filteredChapters, setFilteredChapters] = useState<any[]>([]);
  
  // Update chapters when topic changes
  const handleTopicChange = (topicId: number) => {
    form.setValue('topicId', topicId);
    form.setValue('chapterId', 0); // Reset chapter selection
    
    if (chaptersData) {
      const filtered = chaptersData.filter((chapter: any) => chapter.topicId === topicId);
      setFilteredChapters(filtered);
    }
  };

  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormValues) => 
      apiRequest('POST', '/api/questions', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Question created successfully',
      });
      form.reset();
      // Invalidate queries to refresh data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create question',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: QuestionFormValues) => {
    createQuestionMutation.mutate(data);
  };

  const handleBackToDashboard = () => {
    setLocation('/');
  };

  if (userLoading || topicsLoading || chaptersLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topicsData || []}
        user={{
          username: userData?.username || 'User',
          level: userData?.level || 'CFA Candidate',
          role: 'admin', // Force admin role since this is an admin-only page
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button 
                onClick={handleBackToDashboard}
                className="mr-3 text-neutral-400 hover:text-neutral-800"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-neutral-800">Manage Questions</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/manage-topics')}
              >
                Manage Topics
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/manage-chapters')}
              >
                Manage Chapters
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <PlusCircle className="mr-2" size={20} />
                Add New Question
              </h2>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Topic Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="topicId">Topic *</Label>
                    <Select 
                      onValueChange={(value) => handleTopicChange(parseInt(value))}
                      defaultValue={form.getValues('topicId').toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topicsData?.map((topic: any) => (
                          <SelectItem key={topic.id} value={topic.id.toString()}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.topicId && (
                      <p className="text-sm text-red-500">{form.formState.errors.topicId.message}</p>
                    )}
                  </div>

                  {/* Chapter Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="chapterId">Chapter *</Label>
                    <Select 
                      onValueChange={(value) => form.setValue('chapterId', parseInt(value))}
                      defaultValue={form.getValues('chapterId').toString()}
                      disabled={!form.getValues('topicId')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredChapters.map((chapter: any) => (
                          <SelectItem key={chapter.id} value={chapter.id.toString()}>
                            {chapter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.chapterId && (
                      <p className="text-sm text-red-500">{form.formState.errors.chapterId.message}</p>
                    )}
                    {filteredChapters.length === 0 && form.getValues('topicId') > 0 && (
                      <p className="text-sm text-amber-500">
                        No chapters found for this topic. Please <a href="/manage-chapters" className="text-primary underline">add some chapters</a> first.
                      </p>
                    )}
                  </div>

                  {/* Subtopic */}
                  <div className="space-y-2">
                    <Label htmlFor="subtopic">Subtopic (Optional)</Label>
                    <Input 
                      id="subtopic" 
                      {...form.register('subtopic')}
                      placeholder="E.g., Code of Ethics, Ratio Analysis"
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text *</Label>
                  <Textarea 
                    id="questionText" 
                    {...form.register('questionText')}
                    placeholder="Enter the question text here"
                    className="min-h-24"
                  />
                  {form.formState.errors.questionText && (
                    <p className="text-sm text-red-500">{form.formState.errors.questionText.message}</p>
                  )}
                </div>

                {/* Context */}
                <div className="space-y-2">
                  <Label htmlFor="context">Context/Scenario (Optional)</Label>
                  <Textarea 
                    id="context" 
                    {...form.register('context')}
                    placeholder="Provide any additional context or scenario for the question"
                    className="min-h-20"
                  />
                </div>

                {/* Answer Options */}
                <div className="space-y-4">
                  <h3 className="font-medium">Answer Options *</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="optionA">Option A</Label>
                    <Input 
                      id="optionA" 
                      {...form.register('optionA')}
                      placeholder="Enter option A"
                    />
                    {form.formState.errors.optionA && (
                      <p className="text-sm text-red-500">{form.formState.errors.optionA.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="optionB">Option B</Label>
                    <Input 
                      id="optionB" 
                      {...form.register('optionB')}
                      placeholder="Enter option B"
                    />
                    {form.formState.errors.optionB && (
                      <p className="text-sm text-red-500">{form.formState.errors.optionB.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="optionC">Option C</Label>
                    <Input 
                      id="optionC" 
                      {...form.register('optionC')}
                      placeholder="Enter option C"
                    />
                    {form.formState.errors.optionC && (
                      <p className="text-sm text-red-500">{form.formState.errors.optionC.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="optionD">Option D</Label>
                    <Input 
                      id="optionD" 
                      {...form.register('optionD')}
                      placeholder="Enter option D"
                    />
                    {form.formState.errors.optionD && (
                      <p className="text-sm text-red-500">{form.formState.errors.optionD.message}</p>
                    )}
                  </div>
                </div>

                {/* Correct Answer */}
                <div className="space-y-2">
                  <Label htmlFor="correctOption">Correct Answer *</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('correctOption', value)}
                    defaultValue={form.getValues('correctOption')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Option A</SelectItem>
                      <SelectItem value="B">Option B</SelectItem>
                      <SelectItem value="C">Option C</SelectItem>
                      <SelectItem value="D">Option D</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.correctOption && (
                    <p className="text-sm text-red-500">{form.formState.errors.correctOption.message}</p>
                  )}
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation *</Label>
                  <Textarea 
                    id="explanation" 
                    {...form.register('explanation')}
                    placeholder="Explain why the correct answer is right and why the other options are wrong"
                    className="min-h-28"
                  />
                  {form.formState.errors.explanation && (
                    <p className="text-sm text-red-500">{form.formState.errors.explanation.message}</p>
                  )}
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('difficulty', parseInt(value))}
                    defaultValue={form.getValues('difficulty').toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={createQuestionMutation.isPending}
                >
                  {createQuestionMutation.isPending ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Question
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}