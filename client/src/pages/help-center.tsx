import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail } from 'lucide-react';

export default function HelpCenter() {
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

  const faqs = [
    {
      id: 'faq-1',
      question: 'How do I track my progress?',
      answer: 'Your progress is automatically tracked as you answer questions. You can view detailed analytics in the Analytics section, which shows your performance by topic, recent activity, and overall progress.'
    },
    {
      id: 'faq-2',
      question: 'Why am I seeing the same questions again?',
      answer: 'The system is designed to help you practice effectively. You may see questions you\'ve answered before to reinforce learning, especially if you answered them incorrectly previously.'
    },
    {
      id: 'faq-3',
      question: 'How do I change my password?',
      answer: 'You can change your password in the Settings page. Go to the Security tab, where you can enter your current password and set a new one.'
    },
    {
      id: 'faq-4',
      question: 'How are the practice sets organized?',
      answer: 'Practice sets are organized by topics and chapters. Each topic contains multiple chapters, and each chapter contains questions related to that specific topic area.'
    },
    {
      id: 'faq-5',
      question: 'What if I find an error in a question?',
      answer: 'If you find an error in a question, please contact support through the contact form at the bottom of this page. We appreciate your feedback and will correct any errors promptly.'
    },
    {
      id: 'faq-6',
      question: 'How do streaks work?',
      answer: 'Streaks track your consecutive days of practice. Each day you complete at least one practice session, your streak count increases. Maintaining a streak helps build consistent study habits.'
    }
  ];

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
            <h2 className="text-2xl font-bold text-neutral-800">Help Center</h2>
            <p className="text-neutral-400">Find answers to your questions and get support</p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Search for help..." 
                className="pl-10"
              />
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about using CharterBuddyy Practice Hub</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Can't find what you're looking for? Send us a message</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Input placeholder="Subject" className="mb-2" />
                  <textarea 
                    className="w-full min-h-[150px] p-3 border border-neutral-200 rounded-md"
                    placeholder="Describe your issue or question..."
                  ></textarea>
                </div>
                <Button className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}