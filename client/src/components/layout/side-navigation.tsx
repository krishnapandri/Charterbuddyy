import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  BarChart2, 
  ChevronRight, 
  Settings, 
  HelpCircle, 
  Menu, 
  LogOut, 
  FileText, 
  Layers, 
  FolderOpen, 
  ChevronDown, 
  X, 
  Plus,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Topic = {
  id: number;
  name: string;
  progress?: number;
  icon?: string;
};

export type Chapter = {
  id: number;
  topicId: number;
  name: string;
  description?: string;
};

type User = {
  username: string;
  level: string;
  avatar?: string;
  role?: string;
};

type SideNavigationProps = {
  topics: Topic[];
  user: User;
  activeTopic?: number;
};

export function SideNavigation({ topics, user, activeTopic }: SideNavigationProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({});
  const [chaptersMap, setChaptersMap] = useState<Record<number, Chapter[]>>({});
  const [newChapterName, setNewChapterName] = useState<Record<number, string>>({});
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

  // Fetch chapters for all topics
  const { data: allChapters } = useQuery({ 
    queryKey: ['/api/chapters'],
    queryFn: async () => {
      const response = await fetch('/api/chapters');
      if (!response.ok) throw new Error('Failed to fetch chapters');
      return response.json();
    }
  });

  // Automatically expand the active topic if one is set
  useEffect(() => {
    if (activeTopic && !expandedTopics[activeTopic]) {
      setExpandedTopics(prev => ({...prev, [activeTopic]: true}));
    }
  }, [activeTopic]);

  // Organize chapters by topic
  useEffect(() => {
    if (allChapters && Array.isArray(allChapters)) {
      const chaptersByTopic: Record<number, Chapter[]> = {};
      
      allChapters.forEach((chapter: Chapter) => {
        if (!chaptersByTopic[chapter.topicId]) {
          chaptersByTopic[chapter.topicId] = [];
        }
        chaptersByTopic[chapter.topicId].push(chapter);
      });
      
      setChaptersMap(chaptersByTopic);
    }
  }, [allChapters]);

  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      const response = await apiRequest('DELETE', `/api/chapters/${chapterId}`);
      if (!response.ok) throw new Error('Failed to delete chapter');
      return chapterId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Chapter deleted successfully',
      });
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

  const addChapterMutation = useMutation({
    mutationFn: async ({ topicId, name }: { topicId: number, name: string }) => {
      const response = await apiRequest('POST', '/api/chapters', { 
        topicId, 
        name,
        description: ''
      });
      if (!response.ok) throw new Error('Failed to add chapter');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: 'Chapter added successfully',
      });
      setNewChapterName(prev => ({...prev, [variables.topicId]: ''}));
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

  const handleAddChapter = (topicId: number) => {
    const name = newChapterName[topicId]?.trim();
    if (name) {
      addChapterMutation.mutate({ topicId, name });
    } else {
      toast({
        title: 'Error',
        description: 'Chapter name cannot be empty',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChapter = (e: React.MouseEvent, chapterId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to log out: " + error.message,
          variant: "destructive",
        });
      }
    });
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleTopicExpansion = (topicId: number) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const IconComponent = ({ icon }: { icon: string }) => {
    switch (icon) {
      case 'book':
        return <Book className="h-5 w-5 text-neutral-400" />;
      default:
        return <Book className="h-5 w-5 text-neutral-400" />;
    }
  };

  // Check if a topic is Quants for special chapter treatment
  const isQuantsTopic = (topicId: number, name: string) => {
    return name === 'Quants' || topicId === 12; // Assuming 12 is the ID for Quants
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-white rounded-md shadow-md"
        >
          <Menu className="h-6 w-6 text-neutral-800" />
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col w-64 h-full border-r border-neutral-200 bg-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200 bg-primary">
            <h1 className="text-xl font-bold text-white">CharterBuddyy Practice Hub</h1>
          </div>
          
          <div className="flex flex-col justify-between h-full">
            {/* User profile */}
            <div className="px-4 py-3 bg-neutral-100">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-800">{user.username}</p>
                  <p className="text-xs text-neutral-400">{user.level}</p>
                </div>
              </div>
            </div>
            
            {/* Main navigation */}
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              {/* Dashboard links */}
              <div className="mt-4">
                <div className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Dashboard
                </div>
                <div className="mt-1">
                  <Link href="/dashboard">
                    <div className={cn(
                      "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                      (location === "/" || location === "/dashboard") && "bg-neutral-100"
                    )}>
                      <div className="flex items-center">
                        <ChevronRight className="h-5 w-5 text-neutral-400 mr-3" />
                        Overview
                      </div>
                    </div>
                  </Link>
                  <Link href="/analytics">
                    <div className={cn(
                      "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                      location === "/analytics" && "bg-neutral-100"
                    )}>
                      <div className="flex items-center">
                        <BarChart2 className="h-5 w-5 text-neutral-400 mr-3" />
                        Analytics
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* Management Section - Only visible to admin users */}
              {user.role === 'admin' && (
                <div className="mt-6">
                  <div className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Management
                  </div>
                  <div className="mt-1">
                    <Link href="/manage-topics">
                      <div className={cn(
                        "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                        location === "/manage-topics" && "bg-neutral-100"
                      )}>
                        <div className="flex items-center">
                          <FolderOpen className="h-5 w-5 text-neutral-400 mr-3" />
                          Manage Topics
                        </div>
                      </div>
                    </Link>
                    <Link href="/manage-chapters">
                      <div className={cn(
                        "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                        location === "/manage-chapters" && "bg-neutral-100"
                      )}>
                        <div className="flex items-center">
                          <Layers className="h-5 w-5 text-neutral-400 mr-3" />
                          Manage Chapters
                        </div>
                      </div>
                    </Link>
                    <Link href="/manage-questions">
                      <div className={cn(
                        "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                        location === "/manage-questions" && "bg-neutral-100"
                      )}>
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-neutral-400 mr-3" />
                          Manage Questions
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Topics list with collapsible chapters */}
              <div>
                <div className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Practice Topics
                </div>
                <div className="mt-1">
                  {topics.map((topic) => (
                    <div key={topic.id}>
                      {/* Topic header */}
                      <div 
                        className={cn(
                          "block px-4 py-2 text-sm hover:bg-neutral-100 cursor-pointer",
                          activeTopic === topic.id && "bg-neutral-100 text-primary"
                        )}
                        onClick={() => toggleTopicExpansion(topic.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <IconComponent icon={topic.icon || 'book'} />
                            <span className="ml-3">{topic.name}</span>
                          </div>
                          <div className="flex items-center">
                            {topic.progress !== undefined && (
                              <Badge
                                variant={topic.progress >= 60 ? "default" : "neutral"}
                                className="px-2 py-0.5 rounded text-xs font-medium mr-2"
                              >
                                {topic.progress}%
                              </Badge>
                            )}
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 text-neutral-400 transition-transform",
                                expandedTopics[topic.id] && "transform rotate-180"
                              )} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Chapters for this topic */}
                      {expandedTopics[topic.id] && (
                        <div className="pl-6 pr-4 py-1 bg-neutral-50">
                          {chaptersMap[topic.id]?.length > 0 ? (
                            <>
                              {chaptersMap[topic.id].map((chapter) => (
                                <Link key={chapter.id} href={`/practice/${topic.id}?chapter=${chapter.id}`}>
                                  <div 
                                    className="flex items-center justify-between py-2 px-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded cursor-pointer"
                                  >
                                    <div className="flex-1 truncate">{chapter.name}</div>
                                    
                                    {user.role === 'admin' && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault(); // Prevent navigation when clicking delete
                                          e.stopPropagation(); // Stop event from bubbling up
                                          handleDeleteChapter(e, chapter.id);
                                        }}
                                        className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                        aria-label="Delete chapter"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </>
                          ) : (
                            <div className="py-2 px-2 text-sm text-neutral-500 italic">
                              No chapters available
                            </div>
                          )}
                          
                          {/* Add chapter form - only for admin users */}
                          {user.role === 'admin' && (
                            <div className="mt-2 mb-1">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  placeholder="New chapter name"
                                  className="text-sm p-1 border border-neutral-300 rounded-l w-full"
                                  value={newChapterName[topic.id] || ''}
                                  onChange={(e) => setNewChapterName(prev => ({
                                    ...prev,
                                    [topic.id]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddChapter(topic.id);
                                    }
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="rounded-l-none" 
                                  onClick={() => handleAddChapter(topic.id)}
                                  disabled={addChapterMutation.isPending}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* For Quants topic specifically, ensure all required chapters are available */}
                      {isQuantsTopic(topic.id, topic.name) && expandedTopics[topic.id] && user.role === 'admin' && (
                        <div className="pl-6 pr-4 py-1 text-xs font-medium text-primary">
                          <button 
                            className="text-left hover:underline"
                            onClick={() => {
                              const quantsChapters = [
                                "Rates & Returns",
                                "Time Value of Money",
                                "Statistical Measures of Asset Returns",
                                "Probabililty",
                                "Portfolio Management",
                                "Simulation Methods",
                                "Hypothesis Testing",
                                "Parametric and Non- Parametric Tests Of Independence",
                                "Simple Linear Regression",
                                "Big Data Techniques"
                              ];
                              
                              // Check which chapters are missing
                              const existingChapters = new Set(chaptersMap[topic.id]?.map(c => c.name.toLowerCase()) || []);
                              const missingChapters = quantsChapters.filter(
                                c => !existingChapters.has(c.toLowerCase())
                              );
                              
                              if (missingChapters.length > 0 && confirm(`Add these missing Quants chapters?\n${missingChapters.join('\n')}`)) {
                                // Add the missing chapters one by one
                                missingChapters.forEach(chapterName => {
                                  addChapterMutation.mutate({ topicId: topic.id, name: chapterName });
                                });
                              }
                            }}
                          >
                            Check for missing Quants chapters
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer links */}
            <div className="p-4 border-t border-neutral-200">
              {/* <Link href="/subscription">
                <div className={cn(
                  "flex items-center text-sm text-neutral-800 hover:text-primary cursor-pointer",
                  location === "/subscription" && "text-primary"
                )}>
                  <CreditCard className="h-5 w-5 text-neutral-400 mr-3" />
                  Subscription
                </div>
              </Link> */}
              <div className="flex items-center text-sm text-neutral-800 hover:text-primary cursor-pointer">
                <Settings className="h-5 w-5 text-neutral-400 mr-3" />
                Settings
              </div>
              <div className="flex items-center mt-3 text-sm text-neutral-800 hover:text-primary cursor-pointer">
                <HelpCircle className="h-5 w-5 text-neutral-400 mr-3" />
                Help Center
              </div>
              <div 
                className="flex items-center mt-3 text-sm text-neutral-800 hover:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-neutral-400 mr-3" />
                Logout
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
