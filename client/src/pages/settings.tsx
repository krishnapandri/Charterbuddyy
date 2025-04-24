import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, User, Shield, Eye } from 'lucide-react';

export default function Settings() {
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

  if (userLoading || topicsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  const topics = topicsData?.map((topic: any) => ({
    id: topic.id,
    name: topic.name,
    icon: topic.icon,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SideNavigation
        topics={topics || []}
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
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={userData?.username} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={userData?.email || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">CFA Level</Label>
                    <Input id="level" defaultValue={userData?.level} disabled />
                  </div>
                  <Button className="mt-4">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Practice Reminders</h4>
                      <p className="text-sm text-neutral-500">Receive reminders to practice daily</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Content Alerts</h4>
                      <p className="text-sm text-neutral-500">Get notified when new questions are added</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Progress Updates</h4>
                      <p className="text-sm text-neutral-500">Weekly summaries of your progress</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button className="mt-4">Update Password</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}