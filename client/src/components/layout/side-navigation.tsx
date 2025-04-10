import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Book, BarChart2, ChevronRight, Settings, HelpCircle, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export type Topic = {
  id: number;
  name: string;
  progress?: number;
  icon?: string;
};

type User = {
  username: string;
  level: string;
  avatar?: string;
};

type SideNavigationProps = {
  topics: Topic[];
  user: User;
  activeTopic?: number;
};

export function SideNavigation({ topics, user, activeTopic }: SideNavigationProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

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

  const IconComponent = ({ icon }: { icon: string }) => {
    switch (icon) {
      case 'book':
        return <Book className="h-5 w-5 text-neutral-400" />;
      default:
        return <Book className="h-5 w-5 text-neutral-400" />;
    }
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
            <h1 className="text-xl font-bold text-white">CFA Practice Hub</h1>
          </div>
          
          <div className="flex flex-col justify-between h-full">
            {/* User profile */}
            <div className="px-4 py-3 bg-neutral-100">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=48&h=48&q=80" alt={user.username} />
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
                  <Link href="/">
                    <div className={cn(
                      "block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100 cursor-pointer",
                      location === "/" && "bg-neutral-100"
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
              
              {/* Topics list */}
              <div className="mt-6">
                <div className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Topics
                </div>
                <div className="mt-1">
                  {topics.map((topic) => (
                    <Link key={topic.id} href={`/practice/${topic.id}`}>
                      <div className={cn(
                        "block px-4 py-2 text-sm hover:bg-neutral-100 cursor-pointer",
                        activeTopic === topic.id && "active-topic"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <IconComponent icon={topic.icon || 'book'} />
                            <span className="ml-3">{topic.name}</span>
                          </div>
                          {topic.progress !== undefined && (
                            <Badge
                              variant={topic.progress >= 60 ? "default" : "neutral"}
                              className="px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {topic.progress}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer links */}
            <div className="p-4 border-t border-neutral-200">
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
