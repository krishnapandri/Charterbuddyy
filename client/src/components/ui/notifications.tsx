import React, { useState } from 'react';
import { Bell, X, Settings, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  Popover, 
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  time: string;
  read: boolean;
};

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New practice set available',
      message: 'A new practice set for Quants has been added.',
      type: 'info',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      title: 'Streak milestone',
      message: 'You\'ve maintained a 5-day streak! Keep it up!',
      type: 'success',
      time: '1 day ago',
      read: false
    },
    {
      id: '3',
      title: 'Reminder',
      message: 'You haven\'t practiced Economics in the last week.',
      type: 'warning',
      time: '3 days ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative text-neutral-400 hover:text-neutral-800">
          <Bell />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white border-none"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0">
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="font-medium text-lg">Notifications</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs"
            >
              Mark all as read
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`relative p-4 border-b last:border-b-0 ${notification.read ? 'bg-white' : 'bg-neutral-50'}`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <span className="text-xs text-neutral-400">{notification.time}</span>
                      </div>
                      <p className="text-sm text-neutral-600">{notification.message}</p>
                    </div>
                    <div className="flex flex-col space-y-1 ml-2">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-neutral-400" 
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center">
              <Bell className="h-12 w-12 text-neutral-300 mb-4" />
              <h4 className="text-lg font-medium text-neutral-800 mb-2">No notifications</h4>
              <p className="text-sm text-neutral-500">You're all caught up! We'll notify you when there's new activity.</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}