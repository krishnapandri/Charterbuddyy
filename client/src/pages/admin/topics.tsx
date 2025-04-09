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
  CardTitle 
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InsertTopic, Topic } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BookOpen, 
  Edit, 
  Plus, 
  Save, 
  Trash, 
  LucideIcon,
  BookText,
  Calculator,
  LineChart,
  FileText,
  Building,
  Briefcase,
  TrendingUp,
  DollarSign,
  GitBranch,
  Database
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TopicsManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertTopic>>({
    name: "",
    description: "",
    icon: "book"
  });
  const { toast } = useToast();

  const icons: Record<string, LucideIcon> = {
    "book": BookText,
    "calculator": Calculator,
    "line-chart": LineChart,
    "file-text": FileText,
    "building": Building,
    "briefcase": Briefcase,
    "trending-up": TrendingUp,
    "dollar-sign": DollarSign,
    "git-branch": GitBranch,
    "database": Database
  };

  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
    refetchOnWindowFocus: false,
  });

  const createTopicMutation = useMutation({
    mutationFn: async (newTopic: InsertTopic) => {
      const res = await apiRequest("POST", "/api/topics", newTopic);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topic created",
        description: "The topic has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: async (topic: Partial<Topic>) => {
      const res = await apiRequest("PATCH", `/api/topics/${topic.id}`, topic);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topic updated",
        description: "The topic has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/topics/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete topic");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Topic deleted",
        description: "The topic has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsDeleteAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "book"
    });
    setSelectedTopic(null);
  };

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (value: string) => {
    setFormData((prev) => ({ ...prev, icon: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTopicMutation.mutate(formData as InsertTopic);
  };

  const handleEditClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || "",
      icon: topic.icon || "book"
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    
    updateTopicMutation.mutate({
      id: selectedTopic.id,
      ...formData
    });
  };

  const handleDeleteClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTopic) {
      deleteTopicMutation.mutate(selectedTopic.id);
    }
  };

  const renderIconComponent = (iconName: string) => {
    const IconComponent = icons[iconName] || BookText;
    return <IconComponent className="h-5 w-5" />;
  };

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
            <h1 className="text-3xl font-bold">Topics Management</h1>
            <p className="text-muted-foreground">
              Manage CFA Level I topics and subject areas.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Topic</DialogTitle>
                <DialogDescription>
                  Create a new CFA Level I topic or subject area.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Topic Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Equity Investments"
                      value={formData.name}
                      onChange={handleAddFormChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description of the topic"
                      value={formData.description}
                      onChange={handleAddFormChange}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={handleIconChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(icons).map(([key, Icon]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center">
                              <Icon className="mr-2 h-4 w-4" />
                              {key}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createTopicMutation.isPending}
                  >
                    {createTopicMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Create Topic
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics?.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">{topic.name}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full">
                  {renderIconComponent(topic.icon || "book")}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 min-h-[72px]">
                  {topic.description || "No description provided."}
                </CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(topic)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(topic)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {topics?.length === 0 && (
          <div className="text-center p-8 border rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No topics found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first topic.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          </div>
        )}
      </div>

      {/* Edit Topic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update the details for this topic.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Topic Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleAddFormChange}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={handleIconChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(icons).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {key}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateTopicMutation.isPending}
              >
                {updateTopicMutation.isPending ? (
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
              This will permanently delete the topic "{selectedTopic?.name}". 
              This action cannot be undone, and all associated questions and data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTopicMutation.isPending ? (
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