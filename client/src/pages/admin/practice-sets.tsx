import { AdminLayout } from "@/components/layout/admin-layout";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  InsertPracticeSet, 
  PracticeSet, 
  Topic,
  Question 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  Clock, 
  Edit, 
  Layers, 
  Plus, 
  Save, 
  Trash,
  BookOpen,
  Star,
  BellRing
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function PracticeSetsManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<PracticeSet | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<InsertPracticeSet>>({
    name: "",
    topicId: 0,
    subtopic: "",
    questionCount: 10,
    estimatedTime: 15,
    difficulty: 1,
    isRecommended: false,
    status: "new"
  });
  const { toast } = useToast();

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    refetchOnWindowFocus: false,
  });

  const { data: practiceSets, isLoading } = useQuery<PracticeSet[]>({
    queryKey: ["/api/practice-sets"],
    refetchOnWindowFocus: false,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions/all"],
    refetchOnWindowFocus: false,
  });

  const filteredPracticeSets = selectedTopicId
    ? practiceSets?.filter((ps) => ps.topicId === selectedTopicId)
    : practiceSets;

  const createPracticeSetMutation = useMutation({
    mutationFn: async (newPracticeSet: InsertPracticeSet) => {
      const res = await apiRequest("POST", "/api/practice-sets", newPracticeSet);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Practice set created",
        description: "The practice set has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create practice set",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePracticeSetMutation = useMutation({
    mutationFn: async (practiceSet: Partial<PracticeSet>) => {
      const res = await apiRequest("PATCH", `/api/practice-sets/${practiceSet.id}`, practiceSet);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Practice set updated",
        description: "The practice set has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update practice set",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePracticeSetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/practice-sets/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete practice set");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Practice set deleted",
        description: "The practice set has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
      setIsDeleteAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete practice set",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      topicId: 0,
      subtopic: "",
      questionCount: 10,
      estimatedTime: 15,
      difficulty: 1,
      isRecommended: false,
      status: "new"
    });
    setSelectedPracticeSet(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "questionCount" || name === "estimatedTime") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "topicId" || name === "difficulty") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topicId) {
      toast({
        title: "Topic required",
        description: "Please select a topic for this practice set.",
        variant: "destructive",
      });
      return;
    }
    createPracticeSetMutation.mutate(formData as InsertPracticeSet);
  };

  const handleEditClick = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setFormData({
      name: practiceSet.name,
      topicId: practiceSet.topicId,
      subtopic: practiceSet.subtopic || "",
      questionCount: practiceSet.questionCount,
      estimatedTime: practiceSet.estimatedTime,
      difficulty: practiceSet.difficulty,
      isRecommended: practiceSet.isRecommended,
      status: practiceSet.status || "new"
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPracticeSet) return;
    
    updatePracticeSetMutation.mutate({
      id: selectedPracticeSet.id,
      ...formData
    });
  };

  const handleDeleteClick = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedPracticeSet) {
      deletePracticeSetMutation.mutate(selectedPracticeSet.id);
    }
  };

  const getTopicName = (topicId: number) => {
    return topics?.find(t => t.id === topicId)?.name || "Unknown Topic";
  };

  const getTopicCount = (topicId: number) => {
    return questions?.filter(q => q.topicId === topicId).length || 0;
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return <Badge variant="outline">Easy</Badge>;
      case 2: return <Badge variant="outline" className="bg-amber-50">Medium</Badge>;
      case 3: return <Badge variant="outline" className="bg-red-50">Hard</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": 
        return <Badge variant="outline" className="bg-blue-50 text-blue-600">New</Badge>;
      case "needs_review": 
        return <Badge variant="outline" className="bg-amber-50 text-amber-600">Needs Review</Badge>;
      case "completed": 
        return <Badge variant="outline" className="bg-green-50 text-green-600">Completed</Badge>;
      default: 
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const practiceSetForm = (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Practice Set Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Ethics Fundamentals"
          value={formData.name}
          onChange={handleFormChange}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="topicId">Topic</Label>
          <Select
            value={formData.topicId?.toString() || ""}
            onValueChange={(value) => handleSelectChange("topicId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {topics?.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.name} ({getTopicCount(topic.id)} questions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="subtopic">Subtopic (Optional)</Label>
          <Input
            id="subtopic"
            name="subtopic"
            placeholder="e.g., Time Value of Money"
            value={formData.subtopic}
            onChange={handleFormChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="questionCount">Number of Questions</Label>
          <Input
            id="questionCount"
            name="questionCount"
            type="number"
            min="1"
            max="50"
            value={formData.questionCount}
            onChange={handleFormChange}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
          <Input
            id="estimatedTime"
            name="estimatedTime"
            type="number"
            min="5"
            max="120"
            value={formData.estimatedTime}
            onChange={handleFormChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={formData.difficulty?.toString() || "1"}
            onValueChange={(value) => handleSelectChange("difficulty", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Easy</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || "new"}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch 
          id="isRecommended"
          checked={formData.isRecommended || false}
          onCheckedChange={(checked) => handleSwitchChange("isRecommended", checked)}
        />
        <Label htmlFor="isRecommended" className="cursor-pointer">
          Recommend this practice set to students
        </Label>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Practice Sets Management</h1>
            <p className="text-muted-foreground">
              Manage CFA Level I practice sets for students.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Practice Set
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Practice Set</DialogTitle>
                <DialogDescription>
                  Create a new practice set for students.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                {practiceSetForm}
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    disabled={createPracticeSetMutation.isPending}
                  >
                    {createPracticeSetMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Create Practice Set
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="pb-4">
          <Select
            value={selectedTopicId?.toString() || ""}
            onValueChange={(value) => setSelectedTopicId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Topics</SelectItem>
              {topics?.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredPracticeSets?.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No practice sets found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedTopicId
                ? "No practice sets for the selected topic. Try selecting a different topic or create a new practice set."
                : "Get started by creating your first practice set."}
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Practice Set
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPracticeSets?.map((practiceSet) => (
              <Card key={practiceSet.id} className="relative">
                {practiceSet.isRecommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-amber-400 text-black hover:bg-amber-400">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Recommended
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{practiceSet.name}</span>
                    <div className="flex-shrink-0">
                      {getStatusBadge(practiceSet.status || "new")}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {getTopicName(practiceSet.topicId)}
                    {practiceSet.subtopic && ` • ${practiceSet.subtopic}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{practiceSet.questionCount} questions</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{practiceSet.estimatedTime} minutes</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Difficulty: {getDifficultyLabel(practiceSet.difficulty)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(practiceSet)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(practiceSet)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Practice Set Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Practice Set</DialogTitle>
            <DialogDescription>
              Update the details for this practice set.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            {practiceSetForm}
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                disabled={updatePracticeSetMutation.isPending}
              >
                {updatePracticeSetMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the practice set "{selectedPracticeSet?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePracticeSetMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  Deleting...
                </div>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}