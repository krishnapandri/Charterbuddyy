import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define the chapter schema for form validation
const chapterSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
  topicId: z.string().min(1, "Topic is required"),
  description: z.string().nullable().optional(),
  order: z.coerce.number().int().min(1, "Order must be a positive number"),
});

type ChapterFormValues = z.infer<typeof chapterSchema>;

// Define types for our API data
type Topic = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type Chapter = {
  id: number;
  name: string;
  topicId: number;
  description: string | null;
  order: number;
  topic?: Topic; // Optional joined topic data
};

export default function AdminChaptersPage() {
  const { toast } = useToast();
  
  // State for dialog control
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  
  // Fetch topics for dropdown
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });
  
  // Fetch chapters
  const { data: chapters, isLoading: isLoadingChapters } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters/all"],
    queryFn: async () => {
      // Since we don't have a direct endpoint to get all chapters,
      // we first fetch all topics and then get chapters for each topic
      const topicsData = await queryClient.fetchQuery<Topic[]>({
        queryKey: ["/api/topics"],
      });
      
      let allChapters: Chapter[] = [];
      
      for (const topic of topicsData) {
        const res = await apiRequest(
          "GET",
          `/api/chapters/topic/${topic.id}`
        );
        const topicChapters = await res.json();
        
        // Add topic name to each chapter for display
        const chaptersWithTopic = topicChapters.map((chapter: Chapter) => ({
          ...chapter,
          topic: topic,
        }));
        
        allChapters = [...allChapters, ...chaptersWithTopic];
      }
      
      return allChapters;
    },
  });
  
  // Filter chapters by selected topic
  const filteredChapters = chapters?.filter(chapter => 
    selectedTopicFilter === "all" || chapter.topicId.toString() === selectedTopicFilter
  );
  
  // Form for adding and editing chapters
  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      topicId: "",
      description: "",
      order: 1,
    },
  });
  
  // Create chapter mutation
  const createMutation = useMutation({
    mutationFn: async (values: ChapterFormValues) => {
      const res = await apiRequest("POST", "/api/chapters", {
        name: values.name,
        topicId: parseInt(values.topicId),
        description: values.description || null,
        order: values.order,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapter created",
        description: "The chapter has been added successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/chapters/all"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create chapter: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Update chapter mutation
  const updateMutation = useMutation({
    mutationFn: async (values: ChapterFormValues & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/chapters/${values.id}`, {
        name: values.name,
        topicId: parseInt(values.topicId),
        description: values.description || null,
        order: values.order,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapter updated",
        description: "The chapter has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedChapter(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chapters/all"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update chapter: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete chapter mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/chapters/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Chapter deleted",
        description: "The chapter has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedChapter(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chapters/all"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete chapter: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for adding a chapter
  const onSubmit = (values: ChapterFormValues) => {
    createMutation.mutate(values);
  };
  
  // Handle form submission for editing a chapter
  const onEdit = (values: ChapterFormValues) => {
    if (selectedChapter) {
      updateMutation.mutate({ ...values, id: selectedChapter.id });
    }
  };
  
  // Handle chapter deletion
  const onDelete = () => {
    if (selectedChapter) {
      deleteMutation.mutate(selectedChapter.id);
    }
  };
  
  // Open edit dialog and populate form with chapter data
  const handleEditClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    form.reset({
      name: chapter.name,
      topicId: chapter.topicId.toString(),
      description: chapter.description || "",
      order: chapter.order,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const handleDeleteClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chapters</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Chapters</h2>
            <p className="text-muted-foreground">
              Manage chapters for each topic
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Chapter</DialogTitle>
                <DialogDescription>
                  Add a new chapter to organize questions within a topic.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingTopics ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              topics?.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id.toString()}>
                                  {topic.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter chapter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter chapter description (optional)"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of what this chapter covers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          The display order of this chapter within the topic.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Chapter
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Chapters List</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-4">
                <span>Filter by topic:</span>
                <Select
                  value={selectedTopicFilter}
                  onValueChange={setSelectedTopicFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingChapters ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredChapters && filteredChapters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>{chapter.order}</TableCell>
                      <TableCell className="font-medium">{chapter.name}</TableCell>
                      <TableCell>{chapter.topic?.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {chapter.description}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(chapter)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(chapter)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/80" />
                <h3 className="mt-4 text-lg font-semibold">No chapters found</h3>
                <p className="text-muted-foreground">
                  {selectedTopicFilter === "all"
                    ? "There are no chapters created yet. Add your first chapter to get started."
                    : "There are no chapters for the selected topic. Add a chapter or select a different topic."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Chapter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update the details of this chapter.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingTopics ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          topics?.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id.toString()}>
                              {topic.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chapter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter chapter description (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of what this chapter covers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display order of this chapter within the topic.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Chapter
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the chapter "{selectedChapter?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}