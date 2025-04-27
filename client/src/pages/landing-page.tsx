import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, LineChart, CheckCircle, Award, Target } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PricingTier = ({
  title,
  price,
  features,
  isPopular,
  onClick,
  isPending
}: {
  title: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  onClick: () => void;
  isPending?: boolean;
}) => (
  <Card className={`flex flex-col justify-between ${isPopular ? 'border-primary shadow-lg' : ''}`}>
    {isPopular && (
      <div className="bg-primary text-primary-foreground text-sm py-1.5 text-center rounded-t-lg font-medium">
        Most Popular
      </div>
    )}
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="mt-2">
        <span className="text-3xl font-bold">₹{price}</span>
        {title !== 'Basic' && ' / month'}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-3" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button 
        onClick={onClick} 
        className="w-full" 
        disabled={isPending}
        variant={isPopular ? "default" : "outline"}
      >
        {isPending ? "Processing..." : `Get ${title}`}
      </Button>
    </CardFooter>
  </Card>
);

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve();
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planType: string, amount: number) => {
    try {
      setIsPending(true);
      
      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }
      
      // Create order
      const response = await apiRequest('POST', '/api/subscription/create-order', {
        planId: planType.toLowerCase()
      });
      
      const orderData = await response.json();
      
      if (!orderData.orderId) {
        throw new Error("Failed to create order");
      }
      
      const options = {
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id', // Public key
        amount: orderData.amount * 100, // Amount is in paise
        currency: orderData.currency,
        name: "CharterBuddyy Practice Hub",
        description: `${planType} Plan Subscription`,
        order_id: orderData.orderId,
        handler: function(response: any) {
          // Handle successful payment
          verifyPayment(response, orderData);
        },
        prefill: {
          email: "",
          contact: ""
        },
        theme: {
          color: "#6366F1" // Primary color
        },
        modal: {
          ondismiss: function() {
            setIsPending(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again when you're ready.",
              variant: "destructive",
            });
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error("Payment error:", error);
      setIsPending(false);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const verifyPayment = async (paymentResponse: any, orderData: any) => {
    try {
      const response = await apiRequest('POST', '/api/subscription/verify-payment', {
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        planType: orderData.planType
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Successful",
          description: "Please register or login to access your premium content.",
        });
        
        // Redirect to auth page
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: "Payment couldn't be verified. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleBasicAccess = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Practice CFA Level 1 Exam Questions
              </h1>
              <p className="text-xl mb-8 text-primary-foreground/90">
                Join thousands of candidates who've improved their CFA exam scores with our comprehensive practice platform.
              </p>
              <div className="flex flex-wrap gap-4">
                {/* <Button 
                  size="lg" 
                  variant="default" 
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => handlePayment('Premium', 2999)}
                >
                  Get Premium Access
                </Button> */}
                <Button 
                  size="lg" 
                  variant="secondary"
                  className='text-black' 
                  // className="border-white text-white hover:bg-white/10"
                  onClick={handleBasicAccess}
                >
                  Try Free For Now!
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              {/* Illustration or chart showing success rates */}
              <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">CFA Pass Rate Comparison</h3>
                  <div className="flex justify-around items-end gap-4 h-64 my-6">
                    <div className="flex flex-col items-center">
                      <div className="bg-white/20 w-16 h-24 rounded-t-lg"></div>
                      <p className="mt-2 font-medium">Average</p>
                      <p className="text-sm">42%</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-white w-16 h-52 rounded-t-lg"></div>
                      <p className="mt-2 font-medium">Our Users</p>
                      <p className="text-sm">78%</p>
                    </div>
                  </div>
                  <p className="text-sm">Based on our user survey data from 2022-2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CharterBuddyy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed specifically for CFA Level I candidates to maximize study efficiency and effectiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border rounded-lg p-6 bg-card">
              <BookOpen className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Comprehensive Question Bank</h3>
              <p className="text-muted-foreground">
                Access thousands of practice questions covering all 10 topics in the CFA Level I curriculum.
              </p>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <LineChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track your performance across topics and identify areas for improvement with detailed analytics.
              </p>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <Target className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Focused Practice</h3>
              <p className="text-muted-foreground">
                Create custom practice sets tailored to your specific strengths and weaknesses.
              </p>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <Award className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Expert Explanations</h3>
              <p className="text-muted-foreground">
                Understand concepts better with detailed explanations for every question.
              </p>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <CheckCircle className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Exam-Like Experience</h3>
              <p className="text-muted-foreground">
                Practice in an environment that simulates the actual CFA exam format and timing.
              </p>
            </div>
            
            <div className="border rounded-lg p-6 bg-card">
              <LineChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with comprehensive progress tracking features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select the plan that best fits your exam preparation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingTier
              title="Basic"
              price="Free"
              features={[
                "Limited question bank (50 questions)",
                "Basic performance tracking",
                "Limited topic coverage",
                "Web access only",
                "Community support"
              ]}
              onClick={handleBasicAccess}
              isPending={isPending}
            />
            
            <PricingTier
              title="Premium"
              price="2,999"
              features={[
                "Full question bank (5,000+ questions)",
                "Advanced analytics",
                "Complete topic coverage",
                "Custom practice sets",
                "Detailed explanations",
                "Priority support"
              ]}
              isPopular
              onClick={() => handlePayment('Premium', 2999)}
              isPending={isPending}
            />
            
            <PricingTier
              title="Ultimate"
              price="4,999"
              features={[
                "Everything in Premium",
                "Mock exams with timing",
                "Personalized study plan",
                "Performance forecasting",
                "One-on-one coaching session",
                "Guaranteed pass or money back"
              ]}
              onClick={() => handlePayment('Ultimate', 4999)}
              isPending={isPending}
            />
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-muted py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="font-bold text-lg">CharterBuddyy Practice Hub</h2>
              <p className="text-sm text-muted-foreground">© 2023 All rights reserved</p>
            </div>
            <div className="flex gap-6">
              <Button variant="ghost" size="sm">Terms</Button>
              <Button variant="ghost" size="sm">Privacy</Button>
              <Button variant="ghost" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}