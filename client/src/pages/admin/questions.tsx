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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  InsertQuestion, 
  Question, 
  Topic 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ChevronDown, 
  Edit, 
  Eye, 
  FileQuestion, 
  HelpCircle, 
  Plus, 
  Save, 
  Trash 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function QuestionsManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<InsertQuestion>>({
    topicId: 0,
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    explanation: "",
    difficulty: 1,
    subtopic: "",
    context: "",
  });
  const { toast } = useToast();

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    refetchOnWindowFocus: false,
  });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions/all"],
    refetchOnWindowFocus: false,
  });

  const filteredQuestions = selectedTopicId
    ? questions?.filter((q) => q.topicId === selectedTopicId)
    : questions;

  const createQuestionMutation = useMutation({
    mutationFn: async (newQuestion: InsertQuestion) => {
      const res = await apiRequest("POST", "/api/questions", newQuestion);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question created",
        description: "The question has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/all"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (question: Partial<Question>) => {
      const res = await apiRequest("PATCH", `/api/questions/${question.id}`, question);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question updated",
        description: "The question has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/all"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete question");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/all"] });
      setIsDeleteAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      topicId: 0,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      explanation: "",
      difficulty: 1,
      subtopic: "",
      context: "",
    });
    setSelectedQuestion(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "topicId" || name === "difficulty" ? parseInt(value) : value 
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topicId) {
      toast({
        title: "Topic required",
        description: "Please select a topic for this question.",
        variant: "destructive",
      });
      return;
    }
    createQuestionMutation.mutate(formData as InsertQuestion);
  };

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      topicId: question.topicId,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      explanation: question.explanation,
      difficulty: question.difficulty,
      subtopic: question.subtopic || "",
      context: question.context || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsViewDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;
    
    updateQuestionMutation.mutate({
      id: selectedQuestion.id,
      ...formData
    });
  };

  const handleDeleteClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion.id);
    }
  };

  const getTopicName = (topicId: number) => {
    return topics?.find(t => t.id === topicId)?.name || "Unknown Topic";
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return <Badge variant="outline">Easy</Badge>;
      case 2: return <Badge variant="outline" className="bg-amber-50">Medium</Badge>;
      case 3: return <Badge variant="outline" className="bg-red-50">Hard</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const questionForm = (
    <div className="grid gap-4 py-4">
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
                {topic.name}
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

      <div className="grid gap-2">
        <Label htmlFor="questionText">Question Text</Label>
        <Textarea
          id="questionText"
          name="questionText"
          placeholder="Enter the question text"
          value={formData.questionText}
          onChange={handleFormChange}
          rows={3}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="context">Context (Optional)</Label>
        <Textarea
          id="context"
          name="context"
          placeholder="Additional context for the question"
          value={formData.context}
          onChange={handleFormChange}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="optionA">Option A</Label>
          <Input
            id="optionA"
            name="optionA"
            placeholder="Option A"
            value={formData.optionA}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="optionB">Option B</Label>
          <Input
            id="optionB"
            name="optionB"
            placeholder="Option B"
            value={formData.optionB}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="optionC">Option C</Label>
          <Input
            id="optionC"
            name="optionC"
            placeholder="Option C"
            value={formData.optionC}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="optionD">Option D</Label>
          <Input
            id="optionD"
            name="optionD"
            placeholder="Option D"
            value={formData.optionD}
            onChange={handleFormChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="correctOption">Correct Option</Label>
          <Select
            value={formData.correctOption?.toString() || "A"}
            onValueChange={(value) => handleSelectChange("correctOption", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select correct option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Option A</SelectItem>
              <SelectItem value="B">Option B</SelectItem>
              <SelectItem value="C">Option C</SelectItem>
              <SelectItem value="D">Option D</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>

      <div className="grid gap-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          placeholder="Explanation of the correct answer"
          value={formData.explanation}
          onChange={handleFormChange}
          rows={3}
          required
        />
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
            <h1 className="text-3xl font-bold">Questions Management</h1>
            <p className="text-muted-foreground">
              Manage CFA Level I practice questions.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Create a new CFA Level I practice question.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                {questionForm}
                <DialogFooter className="mt-4">
                  <Button 
                    type="submit" 
                    disabled={createQuestionMutation.isPending}
                  >
                    {createQuestionMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Create Question
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Questions Database</CardTitle>
              <Select
                value={selectedTopicId?.toString() || ""}
                onValueChange={(value) => setSelectedTopicId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[200px]">
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
          </CardHeader>
          <CardContent>
            {filteredQuestions?.length === 0 ? (
              <div className="text-center p-8">
                <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No questions found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTopicId
                    ? "No questions for the selected topic. Try selecting a different topic or create a new question."
                    : "Get started by creating your first question."}
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Subtopic</TableHead>
                      <TableHead className="w-1/3">Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions?.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>{getTopicName(question.topicId)}</TableCell>
                        <TableCell>{question.subtopic || "-"}</TableCell>
                        <TableCell className="font-medium truncate max-w-[300px]">
                          {question.questionText}
                        </TableCell>
                        <TableCell>{getDifficultyLabel(question.difficulty)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewClick(question)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(question)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(question)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the details for this question.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            {questionForm}
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                disabled={updateQuestionMutation.isPending}
              >
                {updateQuestionMutation.isPending ? (
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

      {/* View Question Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>
              {selectedQuestion && getTopicName(selectedQuestion.topicId)}
              {selectedQuestion?.subtopic && ` > ${selectedQuestion.subtopic}`}
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <Tabs defaultValue="question" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="answer">Answer & Explanation</TabsTrigger>
              </TabsList>
              <TabsContent value="question" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Question:</h3>
                  <div className="p-3 border rounded-md bg-muted/50">
                    {selectedQuestion.context && (
                      <div className="mb-2 text-sm text-muted-foreground italic">
                        {selectedQuestion.context}
                      </div>
                    )}
                    <p>{selectedQuestion.questionText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 border rounded-md">
                    <span className="font-semibold mr-2">A:</span>
                    {selectedQuestion.optionA}
                  </div>
                  <div className="p-3 border rounded-md">
                    <span className="font-semibold mr-2">B:</span>
                    {selectedQuestion.optionB}
                  </div>
                  <div className="p-3 border rounded-md">
                    <span className="font-semibold mr-2">C:</span>
                    {selectedQuestion.optionC}
                  </div>
                  <div className="p-3 border rounded-md">
                    <span className="font-semibold mr-2">D:</span>
                    {selectedQuestion.optionD}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="mr-2">Difficulty:</Label>
                    {getDifficultyLabel(selectedQuestion.difficulty)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="answer" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Correct Answer:</h3>
                  <div className="p-3 border rounded-md bg-green-50 dark:bg-green-950/20">
                    <span className="font-semibold mr-2">{selectedQuestion.correctOption}:</span>
                    {selectedQuestion.correctOption === "A" ? selectedQuestion.optionA :
                     selectedQuestion.correctOption === "B" ? selectedQuestion.optionB :
                     selectedQuestion.correctOption === "C" ? selectedQuestion.optionC :
                     selectedQuestion.optionD}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Explanation:</h3>
                  <div className="p-3 border rounded-md">
                    {selectedQuestion.explanation}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => {
              setIsViewDialogOpen(false);
              handleEditClick(selectedQuestion!);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question. 
              This action cannot be undone, and all associated data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteQuestionMutation.isPending ? (
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