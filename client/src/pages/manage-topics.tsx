import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Save, Trash2, Edit, BookIcon } from 'lucide-react';
import { insertTopicSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Extended schema with validation
const topicFormSchema = insertTopicSchema.extend({
  name: z.string().min(3, 'Topic name must be at least 3 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

export default function ManageTopics() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Fetch all topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });
  
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'book', // Default icon
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: TopicFormValues) => 
      apiRequest('POST', '/api/topics', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Topic created successfully',
      });
      form.reset();
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create topic',
        variant: 'destructive',
      });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: (data: TopicFormValues & { id: number }) => 
      apiRequest('PATCH', `/api/topics/${data.id}`, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Topic updated successfully',
      });
      setIsEditModalOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update topic',
        variant: 'destructive',
      });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/topics/${id}`),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Topic deleted successfully',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete topic',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TopicFormValues) => {
    createTopicMutation.mutate(data);
  };

  const onEdit = (topic: any) => {
    setCurrentTopic(topic);
    setIsEditModalOpen(true);
    
    // Update form with topic data
    form.setValue('name', topic.name);
    form.setValue('description', topic.description || '');
    form.setValue('icon', topic.icon || 'book');
  };

  const onUpdate = (data: TopicFormValues) => {
    if (!currentTopic) return;
    
    updateTopicMutation.mutate({
      id: currentTopic.id,
      ...data,
    });
  };

  const onDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this topic? This will also delete all associated chapters and questions.')) {
      deleteTopicMutation.mutate(id);
    }
  };

  const handleBackToDashboard = () => {
    setLocation('/');
  };

  if (userLoading || topicsLoading) {
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
              <h1 className="text-xl font-bold text-neutral-800">Manage Topics</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/manage-chapters')}
              >
                Manage Chapters
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/manage-questions')}
              >
                Manage Questions
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Card */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <PlusCircle className="mr-2" size={20} />
                  Add New Topic
                </h2>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Topic Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Topic Name *</Label>
                    <Input 
                      id="name" 
                      {...form.register('name')}
                      placeholder="E.g., Ethics and Professional Standards"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      {...form.register('description')}
                      placeholder="Enter a brief description of this topic"
                      className="min-h-20"
                    />
                  </div>

                  {/* Icon (simplified) */}
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon (Optional)</Label>
                    <Input 
                      id="icon" 
                      {...form.register('icon')}
                      placeholder="Icon name (e.g., book, chart, graph, calculator)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Icons are used in the sidebar navigation. Default is 'book'.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createTopicMutation.isPending}
                  >
                    {createTopicMutation.isPending ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Topic
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Topics List Card */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6">Existing Topics</h2>
                
                {topicsData && topicsData.length > 0 ? (
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topicsData.map((topic: any) => (
                          <TableRow key={topic.id}>
                            <TableCell className="font-medium">{topic.name}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{topic.description || '-'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(topic)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(topic.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No topics found. Create your first topic to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Topic Dialog */}
      {currentTopic && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 py-4">
              {/* Topic Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Topic Name *</Label>
                <Input 
                  id="name" 
                  defaultValue={currentTopic.name}
                  {...form.register('name')}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  defaultValue={currentTopic.description || ''}
                  {...form.register('description')}
                  className="min-h-20"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Optional)</Label>
                <Input 
                  id="icon" 
                  defaultValue={currentTopic.icon || 'book'}
                  {...form.register('icon')}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateTopicMutation.isPending}
              >
                {updateTopicMutation.isPending ? 'Updating...' : 'Update Topic'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}