import { ReactNode, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Loader2 } from 'lucide-react';

interface PremiumContentGuardProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export function PremiumContentGuard({ 
  children, 
  fallbackMessage = "This content is available exclusively to premium subscribers."
}: PremiumContentGuardProps) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  
  // Query to check if the user has premium access
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await apiRequest('GET', '/api/subscription/status');
      if (!response.ok) {
        throw new Error('Failed to check premium status');
      }
      
      return response.json();
    },
    enabled: !!user
  });
  
  // Update the isChecking state when the query settles
  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);
  
  // If the auth check is loading
  if (isLoading || isChecking) {
    return (
      <div className="w-full py-8">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center text-muted-foreground">Checking access rights...</p>
      </div>
    );
  }
  
  // If there's an error or user is not authenticated
  if (error || !user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to access this content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You need to be logged in to view this content.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/auth">Log In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If user doesn't have premium access
  if (!data?.is_premium) {
    return (
      <Card className="w-full max-w-lg mx-auto border-primary/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Premium Content</CardTitle>
          </div>
          <CardDescription>
            This content requires a premium subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {fallbackMessage}
          </p>
          
          <div className="bg-muted/30 p-4 rounded-md">
            <h4 className="font-medium mb-2">Why upgrade to premium?</h4>
            <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
              <li>Access to all premium practice questions</li>
              <li>Detailed performance analytics</li>
              <li>Custom practice sets</li>
              <li>Personalized study recommendations</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/subscription">Upgrade Now</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // User has premium access, render the children
  return <>{children}</>;
}