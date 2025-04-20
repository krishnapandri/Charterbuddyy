import { useState } from 'react';
import { RazorpayCheckout } from "@/components/payment/razorpay-checkout";
import { SubscriptionStatus } from "@/components/payment/subscription-status";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("status");
  
  // Handle redirect after successful payment
  const handlePaymentSuccess = () => {
    setActiveTab("status");
  };
  
  // Handle upgrade button click
  const handleUpgradeClick = () => {
    setActiveTab("subscribe");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          View and manage your subscription status or upgrade to premium
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="status">Subscription Status</TabsTrigger>
            <TabsTrigger value="subscribe">Upgrade to Premium</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="status" className="space-y-6">
          <SubscriptionStatus onUpgrade={handleUpgradeClick} />
          
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium">Premium Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-md p-4 border">
                <h4 className="font-medium mb-2">Advanced Practice Questions</h4>
                <p className="text-sm text-muted-foreground">
                  Access our entire library of high-quality questions curated by CFA experts.
                </p>
              </div>
              <div className="bg-card rounded-md p-4 border">
                <h4 className="font-medium mb-2">Performance Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Get detailed insights into your performance with comprehensive analytics.
                </p>
              </div>
              <div className="bg-card rounded-md p-4 border">
                <h4 className="font-medium mb-2">Custom Practice Sets</h4>
                <p className="text-sm text-muted-foreground">
                  Create unlimited custom practice sets tailored to your needs.
                </p>
              </div>
              <div className="bg-card rounded-md p-4 border">
                <h4 className="font-medium mb-2">Personalized Study Plans</h4>
                <p className="text-sm text-muted-foreground">
                  Receive customized study recommendations based on your performance.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="subscribe" className="space-y-6">
          <RazorpayCheckout onSuccess={handlePaymentSuccess} />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}