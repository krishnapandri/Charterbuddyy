import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Star, Trophy } from 'lucide-react';

type ActivityItem = {
  id: number;
  type: 'completed' | 'badge' | 'achievement';
  title: string;
  details: string;
  timestamp: string;
  topic?: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
  onViewAllActivity?: () => void;
};

export function RecentActivity({ activities, onViewAllActivity }: RecentActivityProps) {
  // Icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="text-primary-light" size={16} />;
      case 'badge':
        return <Star className="text-[#FF9800]" size={16} />;
      case 'achievement':
        return <Trophy className="text-[#FFC107]" size={16} />;
      default:
        return <CheckCircle className="text-primary-light" size={16} />;
    }
  };

  // Background color based on activity type
  const getActivityBg = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-primary-light bg-opacity-10';
      case 'badge':
      case 'achievement':
        return 'bg-[#FF9800] bg-opacity-10';
      default:
        return 'bg-primary-light bg-opacity-10';
    }
  };

  // Text color based on activity type
  const getActivityTextColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'text-primary-light';
      case 'badge':
      case 'achievement':
        return 'text-[#FF9800]';
      default:
        return 'text-primary-light';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getActivityBg(activity.type)} mr-3 flex-shrink-0`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-neutral-400 mt-1">{activity.details} • {activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        {onViewAllActivity && (
          <button onClick={onViewAllActivity} className="mt-4 text-sm text-primary font-medium">
            View all activity
          </button>
        )}
      </CardContent>
    </Card>
  );
}
