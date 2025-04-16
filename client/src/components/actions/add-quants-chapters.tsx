import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const QUANTS_TOPIC_ID = 12; // Make sure this matches your database
const QUANTS_CHAPTERS = [
  "Rates & Returns",
  "Time Value of Money",
  "Statistical Measures of Asset Returns",
  "Probabililty",
  "Portfolio Management",
  "Simulation Methods",
  "Hypothesis Testing",
  "Parametric and Non-Parametric Tests Of Independence",
  "Simple Linear Regression",
  "Big Data Techniques"
];

export function AddQuantsChapters() {
  const { toast } = useToast();
  const [missingChapters, setMissingChapters] = useState<string[]>([]);
  const [isMissingChaptersLoaded, setIsMissingChaptersLoaded] = useState(false);
  
  // Fetch existing chapters
  const { data: chapters, isLoading } = useQuery({
    queryKey: [`/api/chapters/topic/${QUANTS_TOPIC_ID}`],
    queryFn: async () => {
      const response = await fetch(`/api/chapters/topic/${QUANTS_TOPIC_ID}`);
      if (!response.ok) throw new Error('Failed to fetch chapters');
      return response.json();
    }
  });
  
  // Calculate which chapters are missing once data is loaded
  useEffect(() => {
    if (chapters && Array.isArray(chapters)) {
      const existingChapterNames = new Set(
        chapters.map((chapter: any) => chapter.name.toLowerCase())
      );
      
      const missing = QUANTS_CHAPTERS.filter(
        chapter => !existingChapterNames.has(chapter.toLowerCase())
      );
      
      setMissingChapters(missing);
      setIsMissingChaptersLoaded(true);
    }
  }, [chapters]);
  
  // Mutation to add a chapter
  const addChapterMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await apiRequest('POST', '/api/chapters', {
        topicId: QUANTS_TOPIC_ID,
        name,
        description: '',
        order: 0 // The database will handle default ordering
      });
      
      if (!response.ok) throw new Error('Failed to add chapter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chapters/topic/${QUANTS_TOPIC_ID}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
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
  const handleAddMissingChapters = () => {
    if (missingChapters.length === 0) {
      toast({
        title: 'Info',
        description: 'All required Quants chapters already exist.',
      });
      return;
    }
    
    // Confirm before adding multiple chapters
    if (missingChapters.length > 0 && window.confirm(`Add these ${missingChapters.length} missing Quants chapters?\n${missingChapters.join('\n')}`)) {
      // Add chapters sequentially to avoid race conditions
      let completedCount = 0;
      
      const addNextChapter = (index: number) => {
        if (index >= missingChapters.length) {
          toast({
            title: 'Success',
            description: `Added ${completedCount} Quants chapters`,
          });
          return;
        }
        
        addChapterMutation.mutate(
          { name: missingChapters[index] },
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
    }
  };
  
  if (isLoading) {
    return <Button disabled>Loading chapters...</Button>;
  }
  
  return (
    <Button 
      onClick={handleAddMissingChapters}
      variant="outline"
      className="w-full mt-2"
      disabled={!isMissingChaptersLoaded || addChapterMutation.isPending}
    >
      {addChapterMutation.isPending ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          Adding chapters...
        </div>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Add {missingChapters.length > 0 ? `${missingChapters.length} missing` : 'all'} Quants chapters
        </>
      )}
    </Button>
  );
}