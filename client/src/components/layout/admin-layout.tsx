import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  BookOpen, 
  HelpCircle, 
  Layout, 
  LogOut, 
  Settings, 
  User,
  BookText,
  Layers,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get first letter of username for avatar
  const firstLetter = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <Layout className="h-5 w-5 mr-2" /> },
    { path: '/admin/topics', label: 'Topics', icon: <BookOpen className="h-5 w-5 mr-2" /> },
    { path: '/admin/chapters', label: 'Chapters', icon: <FileText className="h-5 w-5 mr-2" /> },
    { path: '/admin/questions', label: 'Questions', icon: <HelpCircle className="h-5 w-5 mr-2" /> },
    { path: '/admin/practice-sets', label: 'Practice Sets', icon: <Layers className="h-5 w-5 mr-2" /> },
    { path: '/admin/users', label: 'Users', icon: <User className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 flex items-center space-x-2">
          <BookText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CFA Admin</span>
        </div>
        
        <Separator />
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-5 w-5 mr-2" />
                Student Dashboard
              </Button>
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{firstLetter}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}