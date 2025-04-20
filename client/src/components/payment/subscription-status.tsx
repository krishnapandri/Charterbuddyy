import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Check, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface SubscriptionStatus {
  is_premium: boolean;
  payment_history: Array<{
    id: number;
    status: string;
    amount: number;
    currency: string;
    plan_type: string;
    created_at: string;
  }>;
  latest_payment: {
    id: number;
    status: string;
    amount: number;
    currency: string;
    plan_type: string;
    created_at: string;
  } | null;
}

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
}

export function SubscriptionStatus({ onUpgrade }: SubscriptionStatusProps) {
  const { toast } = useToast();

  // Fetch subscription status
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription/status');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      return response.json() as Promise<SubscriptionStatus>;
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest('POST', '/api/subscription/cancel', { reason });
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription cancelled',
        description: 'Your premium subscription has been cancelled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error cancelling subscription',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error loading subscription
          </CardTitle>
          <CardDescription>
            We couldn't load your subscription information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] })}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If no data was returned
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>No subscription information available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Unable to retrieve your subscription details
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onUpgrade}>Subscribe Now</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={data.is_premium ? "border-primary" : "border-muted"}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Subscription Status</CardTitle>
          <Badge variant={data.is_premium ? "default" : "outline"}>
            {data.is_premium ? 'Premium' : 'Free Tier'}
          </Badge>
        </div>
        <CardDescription>
          {data.is_premium 
            ? "You have access to all premium features" 
            : "Upgrade to access premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.is_premium ? (
            <>
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="font-medium">Active Premium Subscription</span>
              </div>
              
              {data.latest_payment && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Plan: {data.latest_payment.plan_type}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Started: {formatDate(data.latest_payment.created_at)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Unlock className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  All premium content and features unlocked
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
                <span>No active premium subscription</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  Premium content and features are locked
                </span>
              </div>
              
              <div className="mt-4 bg-muted/50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Premium Features:</h4>
                <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                  <li>Access all advanced practice questions</li>
                  <li>Detailed performance analytics and insights</li>
                  <li>Create unlimited custom practice sets</li>
                  <li>Personalized study recommendations</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className={`${data.is_premium ? "justify-between" : "justify-center"}`}>
        {data.is_premium ? (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose access to all premium features immediately. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => cancelSubscriptionMutation.mutate('User initiated cancellation')}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button variant="link" className="text-primary">
              Manage Subscription
            </Button>
          </>
        ) : (
          <Button onClick={onUpgrade}>Upgrade to Premium</Button>
        )}
      </CardFooter>
    </Card>
  );
}