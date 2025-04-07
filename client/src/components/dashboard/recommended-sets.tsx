import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { Link } from 'wouter';

type PracticeSet = {
  id: number;
  name: string;
  topic: string;
  topicId: number;
  questions: number;
  duration: number;
  status: 'new' | 'needs_review' | null;
};

type RecommendedSetsProps = {
  sets: PracticeSet[];
};

export function RecommendedSets({ sets }: RecommendedSetsProps) {
  const getBorderColor = (status: PracticeSet['status']) => {
    switch (status) {
      case 'new':
        return 'border-neutral-200';
      case 'needs_review':
        return 'border-[#F44336]';
      default:
        return 'border-primary';
    }
  };

  const getBadgeVariant = (status: PracticeSet['status']) => {
    switch (status) {
      case 'new':
        return 'neutral';
      case 'needs_review':
        return 'incorrect';
      default:
        return 'topic';
    }
  };

  const getBadgeText = (status: PracticeSet['status'], topic: string) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'needs_review':
        return 'Needs Review';
      default:
        return topic;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-800 mb-4">Recommended Practice Sets</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((set) => (
          <Card
            key={set.id}
            className={`p-5 border-l-4 ${getBorderColor(set.status)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <Badge
                  variant={getBadgeVariant(set.status)}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {getBadgeText(set.status, set.topic)}
                </Badge>
                <h4 className="text-base font-medium mt-2">{set.name}</h4>
                <p className="text-sm text-neutral-400 mt-1">{set.questions} questions • ~{set.duration} min</p>
              </div>
              <Link href={`/practice/${set.topicId}?set=${set.id}`}>
                <a className="mt-1 text-primary hover:text-primary-dark">
                  <Play />
                </a>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
