import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  duration: string;
}

interface RazorpayCheckoutProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RazorpayCheckout({ onSuccess, onCancel }: RazorpayCheckoutProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch available subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      return response.json() as Promise<SubscriptionPlan[]>;
    }
  });

  // Create a new payment order
  const createOrderMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/create-order', { planId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (isScriptLoaded) {
        openRazorpayCheckout(data);
      } else {
        toast({
          title: "Payment gateway not loaded",
          description: "Please try again in a moment",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to initiate payment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Verify the payment
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/subscription/verify-payment', paymentData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment successful",
        description: "Your premium subscription is now active",
        variant: "default"
      });
      
      // Invalidate subscription status query to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment verification failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Open Razorpay checkout
  const openRazorpayCheckout = (orderData: any) => {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount * 100, // Amount in paise
      currency: orderData.currency,
      name: "CharterBuddy Practice Hub",
      description: `Premium Subscription - ${orderData.plan_type}`,
      order_id: orderData.order_id,
      handler: function (response: any) {
        // Verify payment with our server
        verifyPaymentMutation.mutate({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      prefill: {
        name: "CFA Student",
        email: ""
      },
      theme: {
        color: "#6366F1"
      },
      modal: {
        ondismiss: function() {
          // User closed the checkout form
          if (onCancel) {
            onCancel();
          }
        }
      }
    };

    try {
      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
    } catch (error) {
      console.error("Failed to initialize Razorpay:", error);
      toast({
        title: "Payment gateway error",
        description: "Could not initialize payment gateway. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Handle plan selection and checkout
  const handleSubscribe = () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "You need to select a subscription plan to continue",
        variant: "destructive"
      });
      return;
    }
    
    createOrderMutation.mutate(selectedPlan);
  };

  if (isLoadingPlans) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Premium Plan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans?.map((plan) => (
          <Card 
            key={plan.id} 
            className={`border-2 cursor-pointer transition-all ${
              selectedPlan === plan.id 
                ? 'border-primary shadow-lg scale-105' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.name}</CardTitle>
                {selectedPlan === plan.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold">₹{plan.amount}</span>
                <span className="text-muted-foreground ml-1">/ {plan.duration}</span>
              </div>
              <Badge variant="outline" className="mt-2">{plan.duration} Access</Badge>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedPlan === plan.id ? "default" : "outline"} 
                className="w-full"
                onClick={() => setSelectedPlan(plan.id)}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          size="lg" 
          disabled={!selectedPlan || createOrderMutation.isPending || verifyPaymentMutation.isPending}
          onClick={handleSubscribe}
          className="px-8"
        >
          {(createOrderMutation.isPending || verifyPaymentMutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Subscribe Now</>
          )}
        </Button>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>By subscribing, you agree to our terms of service and privacy policy.</p>
        <div className="flex justify-center items-center gap-2 mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>For demo purposes only. No actual payment will be processed.</span>
        </div>
      </div>
    </div>
  );
}