import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SideNavigation } from '@/components/layout/side-navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schema
const contactFormSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function HelpCenter() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFormStatus, setContactFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
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

  // Setup contact form
  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  // Contact form mutation
  const contactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactFormSchema>) => {
      return apiRequest('POST', '/api/contactSupport', data);
    },
    onSuccess: () => {
      contactForm.reset();
      setContactFormStatus('success');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully. We'll get back to you soon.",
      });
      
      // Reset status after a delay
      setTimeout(() => setContactFormStatus('idle'), 5000);
    },
    onError: (error) => {
      setContactFormStatus('error');
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Reset status after a delay
      setTimeout(() => setContactFormStatus('idle'), 5000);
    },
  });

  // Handle contact form submission
  const onContactSubmit = (data: z.infer<typeof contactFormSchema>) => {
    contactMutation.mutate(data);
  };

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
    },
    {
      id: 'faq-7',
      question: 'Is there a mobile app?',
      answer: 'Currently, we offer a responsive web application that works well on mobile devices, but a dedicated mobile app is planned for future release.'
    },
    {
      id: 'faq-8',
      question: 'How can I get a premium subscription?',
      answer: 'Premium subscriptions can be purchased from the subscription page. We offer monthly and annual plans with additional features and content.'
    }
  ];

  // Filter FAQs based on search query
  const filteredFaqs = searchQuery.trim() === '' 
    ? faqs 
    : faqs.filter(faq => {
        const query = searchQuery.toLowerCase();
        return (
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
        );
      });

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
            <h2 className="text-2xl font-bold text-neutral-800">Help Center</h2>
            <p className="text-neutral-400">Find answers to your questions and get support</p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Search for help..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                {searchQuery.trim() !== '' 
                  ? `Showing ${filteredFaqs.length} results for "${searchQuery}"` 
                  : 'Common questions about using CharterBuddyy Practice Hub'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-neutral-500">
                    We couldn't find any FAQs matching your search. Try different keywords or contact support below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Can't find what you're looking for? Send us a message</CardDescription>
            </CardHeader>
            <CardContent>
              {contactFormStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Message sent successfully! We'll get back to you soon.
                  </AlertDescription>
                </Alert>
              )}
              {contactFormStatus === 'error' && (
                <Alert className="bg-red-50 border-red-200 mb-4">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    Error sending message. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Briefly describe your issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide details about your issue or question..." 
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="flex items-center"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-sm text-neutral-500 border-t pt-4">
              Typically, we respond to inquiries within 24-48 hours during business days.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}