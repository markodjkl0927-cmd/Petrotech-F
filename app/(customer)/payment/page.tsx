'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm({ order, clientSecret }: { order: Order; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showViewOrder, setShowViewOrder] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment with backend
        try {
          await apiClient.post('/payments/confirm', {
            paymentIntentId: paymentIntent.id,
          });

          // Show success state
          setPaymentSuccess(true);
          setLoading(false);

          // After 2.5 seconds, show "View Order Detail" button
          setTimeout(() => {
            setShowViewOrder(true);
          }, 2500);
        } catch (confirmError: any) {
          console.error('Payment confirmation error:', confirmError);
          setError('Payment succeeded but confirmation failed. Please contact support.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    router.push(`/orders/${order.id}?payment=success`);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
      complete: {
        color: '#10b981',
        iconColor: '#10b981',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Section */}
      <div className={`bg-white border rounded-xl shadow-sm p-6 transition-all duration-300 ${
        paymentSuccess ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
          {paymentSuccess ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-green-700">Payment Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-gray-500">Secure Payment</span>
            </div>
          )}
        </div>

        {/* Card Input Container */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className={`border-2 rounded-lg p-4 transition-all duration-200 ${
            paymentSuccess 
              ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed' 
              : 'border-gray-200 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100 bg-gray-50'
          }`}>
            {paymentSuccess ? (
              <div className="flex items-center gap-3 py-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">Payment information confirmed</span>
              </div>
            ) : (
              <CardElement 
                options={cardElementOptions}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  if (e.error) {
                    setError(e.error.message);
                  } else {
                    setError(null);
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Payment Method Icons */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-500">We accept:</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div className="w-10 h-6 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">MC</span>
            </div>
            <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">AMEX</span>
            </div>
            <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">DISC</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeInUp">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Your payment is secure</p>
              <p className="text-xs text-gray-600 mt-1">
                All transactions are encrypted and processed securely by Stripe. We never store your card details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Button Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-700">Total Amount</span>
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          
          {/* Success Message */}
          {paymentSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-green-900">Payment Successful!</p>
                  <p className="text-sm text-green-700 mt-1">Your order has been confirmed and is being processed.</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Button / View Order Button */}
          {showViewOrder ? (
            <button
              type="button"
              onClick={handleViewOrder}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg hover:bg-primary-700 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 animate-fadeInUp"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>View Order Details</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!stripe || loading || !cardComplete || paymentSuccess}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                paymentSuccess
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Payment...</span>
                </>
              ) : paymentSuccess ? (
                <>
                  <svg className="w-6 h-6 text-white animate-scaleIn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Payment Completed</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Complete Payment</span>
                </>
              )}
            </button>
          )}

          {!paymentSuccess && (
            <p className="text-xs text-center text-gray-500">
              By completing this payment, you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/payment');
      return;
    }

    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    const initializePayment = async () => {
      try {
        // Fetch order details
        const orderRes = await apiClient.get(`/orders/${orderId}`);
        const orderData = orderRes.data.order;

        // Check if order is already paid
        if (orderData.paymentStatus === 'PAID') {
          router.push(`/orders/${orderId}`);
          return;
        }

        setOrder(orderData);

        // Create payment intent
        const paymentRes = await apiClient.post('/payments/create-intent', {
          orderId: orderId,
        });

        setClientSecret(paymentRes.data.clientSecret);
      } catch (err: any) {
        console.error('Payment initialization error:', err);
        setError(err.response?.data?.error || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [orderId, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to initialize payment'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Go to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-gray-600">Order Details</span>
            </div>
            <div className="w-12 h-0.5 bg-primary-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-primary-600">Payment</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                3
              </div>
              <span className="text-sm font-medium text-gray-400">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                  <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm order={order} clientSecret={clientSecret} />
              </Elements>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Order Summary
              </h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.orderItems?.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity}L × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-gray-900 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900 font-medium">Included</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              {order.address && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Address</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{order.address.street}</p>
                    <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                    <p>{order.address.country}</p>
                  </div>
                </div>
              )}

              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Need Help?</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Contact our support team if you have any questions about your order.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
