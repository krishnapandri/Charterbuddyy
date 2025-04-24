import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, User, Shield, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schemas
const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const notificationsFormSchema = z.object({
  practiceReminders: z.boolean(),
  newContentAlerts: z.boolean(),
  progressUpdates: z.boolean(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountFormStatus, setAccountFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationFormStatus, setNotificationFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordFormStatus, setPasswordFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Fetch topics for sidebar
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    retry: false,
  });

  // Setup forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userData?.username || '',
      email: userData?.email || '',
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      practiceReminders: userData?.notificationPreferences?.practiceReminders ?? true,
      newContentAlerts: userData?.notificationPreferences?.newContentAlerts ?? true,
      progressUpdates: userData?.notificationPreferences?.progressUpdates ?? false,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Set up mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return apiRequest('PUT', '/api/updateProfile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setAccountFormStatus('success');
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
      
      // Reset status after a delay
      setTimeout(() => setAccountFormStatus('idle'), 3000);
    },
    onError: (error) => {
      setAccountFormStatus('error');
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Reset status after a delay
      setTimeout(() => setAccountFormStatus('idle'), 3000);
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationsFormSchema>) => {
      return apiRequest('PUT', '/api/updateNotifications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setNotificationFormStatus('success');
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully",
      });
      
      // Reset status after a delay
      setTimeout(() => setNotificationFormStatus('idle'), 3000);
    },
    onError: (error) => {
      setNotificationFormStatus('error');
      toast({
        title: "Error updating notification preferences",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Reset status after a delay
      setTimeout(() => setNotificationFormStatus('idle'), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      // Only send required fields to API
      const { confirmNewPassword, ...passwordData } = data;
      return apiRequest('PUT', '/api/changePassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      setPasswordFormStatus('success');
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
      
      // Reset status after a delay
      setTimeout(() => setPasswordFormStatus('idle'), 3000);
    },
    onError: (error) => {
      setPasswordFormStatus('error');
      toast({
        title: "Error changing password",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Reset status after a delay
      setTimeout(() => setPasswordFormStatus('idle'), 3000);
    },
  });

  // Handle form submissions
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: z.infer<typeof notificationsFormSchema>) => {
    updateNotificationsMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  // Update form defaults when user data arrives
  React.useEffect(() => {
    if (userData) {
      profileForm.reset({
        username: userData.username || '',
        email: userData.email || '',
      });
      
      notificationsForm.reset({
        practiceReminders: userData.notificationPreferences?.practiceReminders ?? true,
        newContentAlerts: userData.notificationPreferences?.newContentAlerts ?? true,
        progressUpdates: userData.notificationPreferences?.progressUpdates ?? false,
      });
    }
  }, [userData, profileForm, notificationsForm]);

  if (userLoading || topicsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const topics = topicsData?.map((topic: any) => ({
    id: topic.id,
    name: topic.name,
    icon: topic.icon,
  })) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topics}
        user={{
          username: userData?.username || 'User',
          level: userData?.level || 'CFA Candidate',
          role: userData?.role || 'student',
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-800">Settings</h2>
            <p className="text-neutral-400">Manage your account and preferences</p>
          </div>

          <Tabs defaultValue="account">
            <TabsList className="mb-6">
              <TabsTrigger value="account" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountFormStatus === 'success' && (
                    <Alert className="bg-green-50 border-green-200 mb-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Profile updated successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                  {accountFormStatus === 'error' && (
                    <Alert className="bg-red-50 border-red-200 mb-4">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Error updating profile. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <Label htmlFor="level">CFA Level</Label>
                        <Input id="level" value={userData?.level || ''} disabled />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="mt-4"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationFormStatus === 'success' && (
                    <Alert className="bg-green-50 border-green-200 mb-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Notification preferences updated successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                  {notificationFormStatus === 'error' && (
                    <Alert className="bg-red-50 border-red-200 mb-4">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Error updating notification preferences. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...notificationsForm}>
                    <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)}>
                      <FormField
                        control={notificationsForm.control}
                        name="practiceReminders"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-medium">Practice Reminders</h4>
                                <p className="text-sm text-neutral-500">Receive reminders to practice daily</p>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                            <Separator />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="newContentAlerts"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between my-4">
                              <div>
                                <h4 className="font-medium">New Content Alerts</h4>
                                <p className="text-sm text-neutral-500">Get notified when new questions are added</p>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                            <Separator />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="progressUpdates"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between my-4">
                              <div>
                                <h4 className="font-medium">Progress Updates</h4>
                                <p className="text-sm text-neutral-500">Weekly summaries of your progress</p>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        className="mt-6"
                        disabled={updateNotificationsMutation.isPending}
                      >
                        {updateNotificationsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Preferences'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {passwordFormStatus === 'success' && (
                    <Alert className="bg-green-50 border-green-200 mb-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Password changed successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                  {passwordFormStatus === 'error' && (
                    <Alert className="bg-red-50 border-red-200 mb-4">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Error changing password. Please ensure your current password is correct.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showCurrentPassword ? "text" : "password"} 
                                  {...field} 
                                />
                              </FormControl>
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-2 top-2.5 text-gray-500"
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showNewPassword ? "text" : "password"} 
                                  {...field} 
                                />
                              </FormControl>
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2 top-2.5 text-gray-500"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  {...field} 
                                />
                              </FormControl>
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-2.5 text-gray-500"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="mt-4"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}