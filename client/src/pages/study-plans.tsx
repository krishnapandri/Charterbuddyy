import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, BookOpen, CalendarDays, Calendar, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StudyPlan, StudyPlanItem, Topic } from "@shared/schema";

// Define the form schema for generating a study plan
const studyPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  dailyStudyTime: z.number().min(15, "Minimum study time is 15 minutes").max(480, "Maximum study time is 8 hours"),
  generateFromUserProgress: z.boolean().default(true),
  includedTopics: z.array(z.number()).optional(),
  excludedTopics: z.array(z.number()).optional(),
  targetExamDate: z.date().optional(),
});

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;

export default function StudyPlans() {
  const { toast } = useToast();
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const userId = 1; // TODO: Get from authenticated user

  // Fetch study plans for current user
  const {
    data: studyPlans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans", userId],
    queryFn: async () => {
      const res = await fetch(`/api/study-plans/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch study plans");
      return res.json();
    },
  });

  // Fetch topics for the form
  const {
    data: topics,
    isLoading: isLoadingTopics,
  } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error("Failed to fetch topics");
      return res.json();
    },
  });

  // Form setup
  const form = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      name: `CFA Level I Study Plan (${new Date().toLocaleDateString()})`,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      dailyStudyTime: 60,
      generateFromUserProgress: true,
      includedTopics: [],
      excludedTopics: [],
    },
  });

  // Generate study plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (formData: StudyPlanFormValues) => {
      const res = await apiRequest("POST", "/api/generate-study-plan", {
        userId,
        options: formData,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Study Plan Created",
        description: "Your personalized study plan has been generated successfully!",
      });
      setIsCreatingPlan(false);
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Study Plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StudyPlanFormValues) => {
    generatePlanMutation.mutate(data);
  };

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Error loading study plans: {(plansError as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Plans</h1>
          <p className="text-muted-foreground">
            Your personalized CFA Level I study plans based on your performance and goals.
          </p>
        </div>
        <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
              <DialogDescription>
                Generate a personalized study plan based on your performance and goals.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="CFA Level I Study Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date <= form.getValues("startDate")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dailyStudyTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Study Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={15}
                          max={480}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended: 60-120 minutes per day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="generateFromUserProgress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Generate from my progress</FormLabel>
                        <FormDescription>
                          Analyze your past performance to focus on weak areas
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {isLoadingTopics ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="includedTopics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Included Topics (Optional)</FormLabel>
                        <FormDescription>
                          Select specific topics to include in your study plan
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {topics?.map((topic) => (
                            <div key={topic.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`topic-${topic.id}`}
                                checked={field.value?.includes(topic.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, topic.id]);
                                  } else {
                                    field.onChange(
                                      currentValues.filter((id) => id !== topic.id)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`topic-${topic.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {topic.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={generatePlanMutation.isPending}
                    className="w-full"
                  >
                    {generatePlanMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Study Plan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {studyPlans && studyPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyPlans.map((plan) => (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center mt-1">
                    <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm">{plan.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${plan.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold mb-1">Focus Areas:</h4>
                    <div className="flex flex-wrap gap-1">
                      {plan.focusAreas && Array.isArray(plan.focusAreas) && (plan.focusAreas as {topicName: string}[]).map((area, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted"
                        >
                          {area.topicName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/study-plan/${plan.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Plan
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/10">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-1">No Study Plans Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first personalized study plan to optimize your CFA exam preparation.
          </p>
          <Button onClick={() => setIsCreatingPlan(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Plan
          </Button>
        </div>
      )}
    </div>
  );
}