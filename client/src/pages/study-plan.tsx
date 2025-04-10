import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, CircleDashed, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import { StudyPlan, StudyPlanItem, Topic } from "@shared/schema";

export default function StudyPlanPage() {
  const [, params] = useRoute("/study-plan/:id");
  const { toast } = useToast();
  const planId = params?.id ? parseInt(params.id) : null;
  const userId = 1; // TODO: Get from authenticated user

  // Fetch the study plan
  const {
    data: studyPlan,
    isLoading: isLoadingPlan,
    error: planError,
  } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plan", planId],
    queryFn: async () => {
      if (!planId) throw new Error("Plan ID not provided");
      const res = await fetch(`/api/study-plan/${planId}`);
      if (!res.ok) throw new Error("Failed to fetch study plan");
      return res.json();
    },
    enabled: !!planId,
  });

  // Fetch the study plan items
  const {
    data: planItems,
    isLoading: isLoadingItems,
    error: itemsError,
  } = useQuery<StudyPlanItem[]>({
    queryKey: ["/api/study-plan-items", planId],
    queryFn: async () => {
      if (!planId) throw new Error("Plan ID not provided");
      const res = await fetch(`/api/study-plan/${planId}/items`);
      if (!res.ok) throw new Error("Failed to fetch study plan items");
      return res.json();
    },
    enabled: !!planId,
  });

  // Fetch all topics to get the topic names
  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error("Failed to fetch topics");
      return res.json();
    },
  });

  // Mark item as completed mutation
  const markItemCompletedMutation = useMutation({
    mutationFn: async ({
      itemId,
      completed,
    }: {
      itemId: number;
      completed: boolean;
    }) => {
      const res = await apiRequest("PUT", `/api/study-plan-item/${itemId}`, {
        completed,
        status: completed ? "completed" : "pending",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plan-items", planId] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plan", planId] });
      toast({
        title: "Progress Updated",
        description: "Your study plan progress has been updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete study plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("Plan ID not provided");
      const res = await apiRequest("DELETE", `/api/study-plan/${planId}`);
      if (!res.ok) throw new Error("Failed to delete study plan");
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Study Plan Deleted",
        description: "Your study plan has been deleted successfully.",
      });
      window.location.href = "/study-plans";
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to get topic name by ID
  const getTopicName = (topicId: number) => {
    if (!topics) return "Loading...";
    const topic = topics.find((t) => t.id === topicId);
    return topic ? topic.name : "Unknown Topic";
  };

  // Group items by date
  const groupedItems = planItems
    ? planItems.reduce<Record<string, StudyPlanItem[]>>((acc, item) => {
        const date = item.scheduledDate;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {})
    : {};

  // Sort dates
  const sortedDates = Object.keys(groupedItems).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const handleToggleItemCompletion = (item: StudyPlanItem) => {
    markItemCompletedMutation.mutate({
      itemId: item.id,
      completed: !item.completed,
    });
  };

  if (isLoadingPlan || isLoadingItems) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (planError || itemsError) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Error loading study plan: {((planError || itemsError) as Error).message}
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/study-plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Plans
          </Link>
        </Button>
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Study plan not found
        </div>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/study-plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Plans
          </Link>
        </Button>
      </div>
    );
  }

  // Calculate overdue items
  const overdueItems = planItems
    ? planItems.filter(
        (item) =>
          !item.completed &&
          isPast(new Date(item.scheduledDate)) &&
          !isToday(new Date(item.scheduledDate))
      )
    : [];

  // Calculate today's items
  const todayItems = planItems
    ? planItems.filter(
        (item) =>
          !item.completed && isToday(new Date(item.scheduledDate))
      )
    : [];

  // Calculate upcoming items
  const upcomingItems = planItems
    ? planItems.filter(
        (item) =>
          !item.completed &&
          !isPast(new Date(item.scheduledDate)) &&
          !isToday(new Date(item.scheduledDate))
      )
    : [];

  // Calculate completion percentage
  const completionPercentage = planItems?.length
    ? Math.round(
        (planItems.filter((item) => item.completed).length / planItems.length) *
          100
      )
    : 0;

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" asChild>
          <Link href="/study-plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              Delete Plan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                study plan and all associated study items.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePlanMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{studyPlan.name}</CardTitle>
              <CardDescription>
                {format(new Date(studyPlan.startDate), "PPP")} to{" "}
                {format(new Date(studyPlan.endDate), "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-semibold">Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {studyPlan.focusAreas && Array.isArray(studyPlan.focusAreas) &&
                    (studyPlan.focusAreas as {topicName: string, priority: number}[]).map((area, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted"
                      >
                        {area.topicName}
                        {area.priority > 1 && (
                          <span className="ml-1 text-xs px-1.5 py-0.5 bg-primary/10 rounded-full">
                            {area.priority === 3
                              ? "High"
                              : area.priority === 2
                              ? "Medium"
                              : "Low"}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="today">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">
                  Today ({todayItems.length})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="text-destructive">
                  Overdue ({overdueItems.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingItems.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="mt-4">
                {todayItems.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-1">No Items for Today</h3>
                    <p className="text-muted-foreground">
                      You don't have any study items scheduled for today.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayItems.map((item) => (
                      <StudyPlanItemCard
                        key={item.id}
                        item={item}
                        onToggleCompletion={handleToggleItemCompletion}
                        getTopicName={getTopicName}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overdue" className="mt-4">
                {overdueItems.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-1">No Overdue Items</h3>
                    <p className="text-muted-foreground">
                      Great job staying on track with your study plan!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueItems.map((item) => (
                      <StudyPlanItemCard
                        key={item.id}
                        item={item}
                        onToggleCompletion={handleToggleItemCompletion}
                        getTopicName={getTopicName}
                        isOverdue
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-4">
                {upcomingItems.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-1">No Upcoming Items</h3>
                    <p className="text-muted-foreground">
                      You've reached the end of your study plan!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingItems.slice(0, 5).map((item) => (
                      <StudyPlanItemCard
                        key={item.id}
                        item={item}
                        onToggleCompletion={handleToggleItemCompletion}
                        getTopicName={getTopicName}
                      />
                    ))}
                    {upcomingItems.length > 5 && (
                      <div className="text-center p-2">
                        <Button variant="link">
                          Show More ({upcomingItems.length - 5} items)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Your study plan schedule by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedDates.map((date) => {
                  const items = groupedItems[date];
                  const dateObj = new Date(date);
                  const isPastDate = isPast(dateObj) && !isToday(dateObj);
                  const isTodayDate = isToday(dateObj);
                  
                  const allCompleted = items.every(item => item.completed);
                  const noneCompleted = items.every(item => !item.completed);
                  
                  return (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center">
                        <div 
                          className={`text-sm font-medium ${
                            isTodayDate 
                              ? "text-primary" 
                              : isPastDate && noneCompleted 
                                ? "text-destructive" 
                                : ""
                          }`}>
                          {isTodayDate 
                            ? "Today" 
                            : dateObj.toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                        </div>
                        {allCompleted && (
                          <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      <div className="ml-1 pl-4 border-l-2 border-muted space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-2 text-sm ${
                              item.completed
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs">{getTopicName(item.topicId)}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleToggleItemCompletion(item)}
                            >
                              {item.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <CircleDashed className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StudyPlanItemCardProps {
  item: StudyPlanItem;
  onToggleCompletion: (item: StudyPlanItem) => void;
  getTopicName: (topicId: number) => string;
  isOverdue?: boolean;
}

function StudyPlanItemCard({
  item,
  onToggleCompletion,
  getTopicName,
  isOverdue = false,
}: StudyPlanItemCardProps) {
  return (
    <Card className={isOverdue ? "border-destructive/50" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{item.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleCompletion(item)}
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <CircleDashed className="h-5 w-5" />
            )}
          </Button>
        </div>
        <CardDescription>
          {getTopicName(item.topicId)} • {item.estimatedDuration} minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm">{item.description}</p>
        {isOverdue && (
          <div className="mt-2 text-xs font-medium text-destructive">
            Scheduled for {format(new Date(item.scheduledDate), "PPP")}
            {" - "}
            {formatDistanceToNow(new Date(item.scheduledDate))} overdue
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/practice-set/${item.practiceSetId}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            Start Practice Set
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}