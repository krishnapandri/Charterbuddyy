import { AdminLayout } from "@/components/layout/admin-layout";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Eye,
  EyeOff,
  Lock, 
  Plus, 
  Save, 
  Settings, 
  Trash, 
  User as UserIcon,
  Users as UsersIcon,
  Search,
  ChevronDown
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
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    level: "Level I Candidate",
    role: "student",
  });
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  const filteredUsers = searchQuery
    ? users?.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      level: "Level I Candidate",
      role: "student",
    });
    setSelectedUser(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "", // We don't show or edit password
      level: user.level,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const updateData: Partial<User> = {
      level: formData.level,
      role: formData.role,
    };
    
    // Only include password in update if it was provided
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: updateData
    });
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge className="bg-blue-500 hover:bg-blue-500/90">Admin</Badge>;
    }
    return <Badge variant="outline">Student</Badge>;
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
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage students and administrators.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new student or administrator account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="e.g., johndoe"
                      value={formData.username}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showAddPassword ? "text" : "password"}
                        placeholder="Enter a secure password"
                        value={formData.password}
                        onChange={handleFormChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        tabIndex={-1}
                      >
                        {showAddPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleSelectChange("level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Level I Candidate">Level I Candidate</SelectItem>
                        <SelectItem value="Level II Candidate">Level II Candidate</SelectItem>
                        <SelectItem value="Level III Candidate">Level III Candidate</SelectItem>
                        <SelectItem value="CFA Charterholder">CFA Charterholder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Create User
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex gap-2 items-center">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <span>Users ({filteredUsers?.length || 0})</span>
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers?.length === 0 ? (
              <div className="text-center p-8">
                <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "No users match your search criteria."
                    : "Get started by creating your first user."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.level}</TableCell>
                        <TableCell>{user.streakDays} days</TableCell>
                        <TableCell>
                          {user.lastLoginDate 
                            ? format(new Date(user.lastLoginDate), 'MMM d, yyyy')
                            : 'Never'
                          }
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewClick(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete User
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Username cannot be changed.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">New Password (Optional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChange={handleFormChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    tabIndex={-1}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level I Candidate">Level I Candidate</SelectItem>
                    <SelectItem value="Level II Candidate">Level II Candidate</SelectItem>
                    <SelectItem value="Level III Candidate">Level III Candidate</SelectItem>
                    <SelectItem value="CFA Charterholder">CFA Charterholder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
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

      {/* View User Dialog */}
      {selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                View user details and activity.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                <div className="flex items-center justify-center mt-1">
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Level</p>
                <p className="text-sm">{selectedUser.level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Streak</p>
                <p className="text-sm">{selectedUser.streakDays} days</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-sm">{
                  selectedUser.lastLoginDate 
                    ? format(new Date(selectedUser.lastLoginDate), 'MMM d, yyyy')
                    : 'Never'
                }</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-sm">{selectedUser.id}</p>
              </div>
            </div>
                        
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button variant="default" onClick={() => {
                setIsViewDialogOpen(false);
                handleEditClick(selectedUser);
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.username}". 
              This action cannot be undone, and all associated data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
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