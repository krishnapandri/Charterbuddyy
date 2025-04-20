import Razorpay from 'razorpay';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { createHash, createHmac } from 'crypto';

// Initialize Razorpay with dummy values (to be replaced in production)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// Available subscription plans
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly',
    name: 'Monthly Subscription',
    description: 'Access to all premium features for one month',
    amount: 499, // in rupees (₹499)
    currency: 'INR',
    duration: '1 month'
  },
  QUARTERLY: {
    id: 'quarterly',
    name: 'Quarterly Subscription',
    description: 'Access to all premium features for three months',
    amount: 1299, // in rupees (₹1299)
    currency: 'INR',
    duration: '3 months'
  },
  YEARLY: {
    id: 'yearly',
    name: 'Annual Subscription',
    description: 'Access to all premium features for one year',
    amount: 4999, // in rupees (₹4999)
    currency: 'INR',
    duration: '1 year'
  },
};

// Create a Razorpay order for a subscription
export async function createSubscriptionOrder(
  userId: number,
  planId: string
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  planType: string;
}> {
  // Get the plan details
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  try {
    // Create an order
    const options = {
      amount: plan.amount * 100, // Amount in smallest currency unit (paise)
      currency: plan.currency,
      receipt: `receipt_order_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        planId: plan.id,
      },
    };

    const order = await razorpay.orders.create(options);

    // Create a payment record in pending state
    await storage.createPayment({
      userId,
      status: 'created',
      amount: plan.amount,
      currency: plan.currency,
      razorpayOrderId: order.id,
      razorpayPaymentId: null,
      razorpaySignature: null,
      planType: plan.id,
      metadata: {
        planDetails: plan,
      },
    });

    return {
      orderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      planType: plan.id,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

// Verify the payment signature from Razorpay
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    // Get the secret key
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    
    // Create the expected signature
    const generatedSignature = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    // Compare the signatures
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Middleware to check if user has premium access
export function requirePremium(req: Request, res: Response, next: NextFunction) {
  // Check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if the user has premium access
  if (!req.user.isPremium) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      requiresUpgrade: true 
    });
  }

  // User has premium access, proceed
  next();
}