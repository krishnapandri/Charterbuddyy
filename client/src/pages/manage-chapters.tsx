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
import { ArrowLeft, PlusCircle, Save, Trash2, Edit } from 'lucide-react';
import { insertChapterSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Extended schema with validation
const chapterFormSchema = insertChapterSchema.extend({
  topicId: z.coerce.number().min(1, 'Please select a topic'),
  name: z.string().min(3, 'Chapter name must be at least 3 characters'),
  description: z.string().optional(),
  order: z.coerce.number().min(1, 'Order must be at least 1'),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

export default function ManageChapters() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Fetch topics
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
  });
  
  // Fetch all chapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/chapters'],
  });
  
  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      topicId: 0,
      name: '',
      description: '',
      order: 1,
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data: ChapterFormValues) => 
      apiRequest('POST', '/api/chapters', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Chapter created successfully',
      });
      form.reset();
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create chapter',
        variant: 'destructive',
      });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: (data: ChapterFormValues & { id: number }) => 
      apiRequest('PATCH', `/api/chapters/${data.id}`, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Chapter updated successfully',
      });
      setIsEditModalOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update chapter',
        variant: 'destructive',
      });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/chapters/${id}`),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Chapter deleted successfully',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete chapter',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ChapterFormValues) => {
    createChapterMutation.mutate(data);
  };

  const onEdit = (chapter: any) => {
    setCurrentChapter(chapter);
    setIsEditModalOpen(true);
    
    // Initialize form with chapter data
    const editForm = useForm<ChapterFormValues>({
      resolver: zodResolver(chapterFormSchema),
      defaultValues: {
        topicId: chapter.topicId,
        name: chapter.name,
        description: chapter.description || '',
        order: chapter.order,
      },
    });
    
    // Update form with chapter data
    editForm.setValue('topicId', chapter.topicId);
    editForm.setValue('name', chapter.name);
    editForm.setValue('description', chapter.description || '');
    editForm.setValue('order', chapter.order);
  };

  const onUpdate = (data: ChapterFormValues) => {
    if (!currentChapter) return;
    
    updateChapterMutation.mutate({
      id: currentChapter.id,
      ...data,
    });
  };

  const onDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      deleteChapterMutation.mutate(id);
    }
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
              <h1 className="text-xl font-bold text-neutral-800">Manage Chapters</h1>
            </div>
            <div>
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
                  Add New Chapter
                </h2>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Topic Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="topicId">Topic *</Label>
                    <Select 
                      onValueChange={(value) => form.setValue('topicId', parseInt(value))}
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

                  {/* Chapter Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Chapter Name *</Label>
                    <Input 
                      id="name" 
                      {...form.register('name')}
                      placeholder="E.g., Introduction to Ethics"
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
                      placeholder="Enter a brief description of this chapter"
                      className="min-h-20"
                    />
                  </div>

                  {/* Order */}
                  <div className="space-y-2">
                    <Label htmlFor="order">Order *</Label>
                    <Input 
                      id="order" 
                      type="number"
                      min="1"
                      {...form.register('order')}
                      placeholder="1"
                    />
                    {form.formState.errors.order && (
                      <p className="text-sm text-red-500">{form.formState.errors.order.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createChapterMutation.isPending}
                  >
                    {createChapterMutation.isPending ? 'Saving...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Chapter
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Chapters List Card */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6">Existing Chapters</h2>
                
                {chaptersData && chaptersData.length > 0 ? (
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic</TableHead>
                          <TableHead>Chapter Name</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chaptersData.map((chapter: any) => {
                          const topic = topicsData?.find((t: any) => t.id === chapter.topicId);
                          return (
                            <TableRow key={chapter.id}>
                              <TableCell>{topic?.name || '-'}</TableCell>
                              <TableCell>{chapter.name}</TableCell>
                              <TableCell>{chapter.order}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(chapter)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(chapter.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No chapters found. Create your first chapter to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Chapter Dialog */}
      {currentChapter && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Chapter</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 py-4">
              {/* Topic Selection */}
              <div className="space-y-2">
                <Label htmlFor="topicId">Topic *</Label>
                <Select 
                  onValueChange={(value) => form.setValue('topicId', parseInt(value))}
                  defaultValue={currentChapter.topicId.toString()}
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
              </div>

              {/* Chapter Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Chapter Name *</Label>
                <Input 
                  id="name" 
                  defaultValue={currentChapter.name}
                  {...form.register('name')}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  defaultValue={currentChapter.description || ''}
                  {...form.register('description')}
                  className="min-h-20"
                />
              </div>

              {/* Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Order *</Label>
                <Input 
                  id="order" 
                  type="number"
                  min="1"
                  defaultValue={currentChapter.order}
                  {...form.register('order')}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateChapterMutation.isPending}
              >
                {updateChapterMutation.isPending ? 'Updating...' : 'Update Chapter'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}