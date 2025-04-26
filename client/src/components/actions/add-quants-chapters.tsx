import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddQuantsChapters() {
  const { toast } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [chapterNames, setChapterNames] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingChapters, setIsAddingChapters] = useState(false);
  
  // Fetch topics
  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['/api/topics'],
    queryFn: async () => {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    }
  });
  
  // Fetch existing chapters for the selected topic
  const { data: chapters, isLoading: isLoadingChapters, refetch: refetchChapters } = useQuery({
    queryKey: [`/api/chapters/topic/${selectedTopicId}`],
    queryFn: async () => {
      if (!selectedTopicId) return [];
      const response = await fetch(`/api/chapters/topic/${selectedTopicId}`);
      if (!response.ok) throw new Error('Failed to fetch chapters');
      return response.json();
    },
    enabled: !!selectedTopicId
  });
  
  // Process chapter names from textarea input
  const processChapterNames = (): string[] => {
    return chapterNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
  };
  
  // Filter out already existing chapters
  const getMissingChapters = (): string[] => {
    if (!chapters || !Array.isArray(chapters)) return [];
    
    const newChaptersList = processChapterNames();
    const existingChapterNames = new Set(
      chapters.map((chapter: any) => chapter.name.toLowerCase())
    );
    
    return newChaptersList.filter(
      chapter => !existingChapterNames.has(chapter.toLowerCase())
    );
  };
  
  // Mutation to add a chapter
  const addChapterMutation = useMutation({
    mutationFn: async ({ name, topicId }: { name: string, topicId: number }) => {
      const response = await apiRequest('POST', '/api/chapters', {
        topicId,
        name,
        description: '',
        order: 0 // The database will handle default ordering
      });
      
      if (!response.ok) throw new Error('Failed to add chapter');
      return response.json();
    },
    onSuccess: () => {
      if (selectedTopicId) {
        queryClient.invalidateQueries({ queryKey: [`/api/chapters/topic/${selectedTopicId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Add all missing chapters
  const handleAddChapters = () => {
    if (!selectedTopicId) {
      toast({
        title: 'Warning',
        description: 'Please select a topic first',
        variant: 'destructive'
      });
      return;
    }
    
    const missingChapters = getMissingChapters();
    
    if (missingChapters.length === 0) {
      toast({
        title: 'Info',
        description: 'All chapters already exist in the selected topic.',
      });
      return;
    }
    
    setIsAddingChapters(true);
    
    // Add chapters sequentially to avoid race conditions
    let completedCount = 0;
    
    const addNextChapter = (index: number) => {
      if (index >= missingChapters.length) {
        toast({
          title: 'Success',
          description: `Added ${completedCount} chapters to ${selectedTopicName}`,
        });
        setIsAddingChapters(false);
        setIsDialogOpen(false);
        setChapterNames(''); // Reset input
        return;
      }
      
      addChapterMutation.mutate(
        { name: missingChapters[index], topicId: selectedTopicId },
        {
          onSuccess: () => {
            completedCount++;
            // Add the next chapter after a short delay to prevent race conditions
            setTimeout(() => addNextChapter(index + 1), 300);
          },
          onError: () => {
            // Continue with the next chapter even if one fails
            setTimeout(() => addNextChapter(index + 1), 300);
          }
        }
      );
    };
    
    // Start adding the chapters
    addNextChapter(0);
  };
  
  const isLoading = isLoadingTopics || (selectedTopicId && isLoadingChapters);
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Chapters to Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Chapters to Topic</DialogTitle>
          <DialogDescription>
            Select a topic and enter chapter names (one per line) to add to the selected topic.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topic" className="text-right">
              Topic
            </Label>
            <div className="col-span-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {selectedTopicName || "Select a topic"}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px]">
                  <DropdownMenuLabel>Available Topics</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isLoadingTopics ? (
                    <DropdownMenuItem>Loading topics...</DropdownMenuItem>
                  ) : (
                    topics && topics.map((topic: any) => (
                      <DropdownMenuItem 
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopicId(topic.id);
                          setSelectedTopicName(topic.name);
                          refetchChapters();
                        }}
                      >
                        {topic.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chapters" className="text-right">
              Chapters
            </Label>
            <Textarea 
              id="chapters"
              className="col-span-3"
              placeholder="Enter chapter names (one per line)"
              rows={8}
              value={chapterNames}
              onChange={(e) => setChapterNames(e.target.value)}
              disabled={isAddingChapters}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleAddChapters}
            disabled={!selectedTopicId || !chapterNames.trim() || isAddingChapters}
          >
            {isAddingChapters ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                Adding chapters...
              </div>
            ) : (
              "Add Chapters"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}