"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api";
import { Order } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [tracking, setTracking] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingPlace, setTrackingPlace] = useState<string | null>(null);
  const [trackingPlaceLoading, setTrackingPlaceLoading] = useState(false);
  const trackingPlaceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
    
    // Check for payment success query param
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Remove query param from URL
      router.replace(`/orders/${params.id}`, { scroll: false });
      // Hide success message after 5 seconds
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    }
  }, [params.id, searchParams, router]);

  useEffect(() => {
    if (!order?.id) return;
    if (!order.driverId) return;

    const isActive = order.status === "DISPATCHED" || order.status === "IN_TRANSIT";
    if (!isActive) return;

    let mounted = true;
    let timer: any;

    const fetchTracking = async () => {
      try {
        setTrackingError(null);
        const res = await apiClient.get(`/orders/${order.id}/tracking`);
        if (!mounted) return;
        setTracking(res.data?.tracking || null);
      } catch (e: any) {
        if (!mounted) return;
        setTrackingError(e?.response?.data?.error || e?.message || "Failed to load tracking");
      } finally {
        if (!mounted) return;
        timer = setTimeout(fetchTracking, 10000);
      }
    };

    fetchTracking();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [order?.id, order?.driverId, order?.status]);

  useEffect(() => {
    const loc = tracking?.location;
    if (!loc?.latitude || !loc?.longitude) return;
    const key = `${Number(loc.latitude).toFixed(4)},${Number(loc.longitude).toFixed(4)}`;
    if (trackingPlaceKeyRef.current === key) return;

    trackingPlaceKeyRef.current = key;
    setTrackingPlaceLoading(true);
    setTrackingPlace(null);

    const controller = new AbortController();
    apiClient
      .get(`/tracking/reverse`, {
        params: { lat: loc.latitude, lng: loc.longitude },
        timeout: 6500,
        signal: controller.signal as any,
      })
      .then((res) => {
        setTrackingPlace(res.data?.place || null);
      })
      .catch(() => {
        // ignore (timeout / abort / network)
        setTrackingPlace(null);
      })
      .finally(() => {
        setTrackingPlaceLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [tracking?.location?.latitude, tracking?.location?.longitude]);

  const formatRelativeAge = (iso?: string) => {
    if (!iso) return null;
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  };

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelling(true);
    try {
      await apiClient.put(`/orders/${order.id}/cancel`);
      // Refresh order data
      fetchOrder(order.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Processing";
      case "CONFIRMED":
        return "Confirmed";
      case "DISPATCHED":
        return "Dispatched";
      case "IN_TRANSIT":
        return "In Transit";
      case "DELIVERED":
        return "Delivered";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getEstimatedDeliveryDate = (order: Order) => {
    if (order.deliveryDate) {
      return formatDate(order.deliveryDate);
    }
    if (order.deliveredAt) {
      return formatDate(order.deliveredAt);
    }
    // Default: 3-5 business days from order date
    const deliveryDate = new Date(order.createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    return formatDate(deliveryDate.toISOString());
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "ONLINE":
        return "Credit/Debit Card";
      case "CASH_ON_DELIVERY":
        return "Cash on Delivery";
      case "CARD_ON_DELIVERY":
        return "Card on Delivery";
      default:
        return method.replace("_", " ");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <Link
            href="/orders"
            className="text-primary-600 hover:text-primary-700 hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
  const needsPayment = order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DISPATCHED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED":
        return "bg-primary-100 text-primary-800 border-primary-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getOrderTimeline = () => {
    const statuses = [
      { key: "PENDING", label: "Order Placed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      { key: "CONFIRMED", label: "Confirmed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      { key: "DISPATCHED", label: "Dispatched", icon: "M5 13l4 4L19 7" },
      { key: "IN_TRANSIT", label: "In Transit", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
      { key: "DELIVERED", label: "Delivered", icon: "M5 13l4 4L19 7" },
    ];
    
    const currentIndex = statuses.findIndex(s => s.key === order.status);
    return statuses.map((status, index) => ({
      ...status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Payment Success Message */}
        {showPaymentSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-6 animate-fadeInUp shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">Payment Successful!</h3>
                <p className="text-green-700">Your order has been confirmed and is being processed. You'll receive an email confirmation shortly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                  {getStatusDisplay(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Placed on <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <Link
                href="/products"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
          <div className="relative">
            <div className="flex items-center justify-between relative">
              {/* Connecting Lines */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-primary-600 transition-all duration-500"
                  style={{ 
                    width: `${(getOrderTimeline().findIndex(s => s.current || s.key === order.status) + 1) * (100 / getOrderTimeline().length)}%` 
                  }}
                ></div>
              </div>
              
              {getOrderTimeline().map((step, index) => (
                <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step.completed
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : step.current
                      ? 'bg-primary-100 border-primary-600 text-primary-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                    step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {step.current && (
                    <p className="mt-1 text-xs text-primary-600 font-medium">Current</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-900">Estimated Delivery:</span>
              <span>{getEstimatedDeliveryDate(order)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.product.description || 'Premium fuel product'}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Quantity: <span className="font-medium text-gray-900">{item.quantity}L</span>
                        </span>
                        <span className="text-gray-600">
                          Price: <span className="font-medium text-gray-900">{formatCurrency(item.price)}/L</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Delivery Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Shipping Address</p>
                  <p className="text-gray-900 font-medium">
                    {order.address.street}
                  </p>
                  <p className="text-gray-600">
                    {order.address.city}, {order.address.state} {order.address.zipCode}
                  </p>
                  <p className="text-gray-600">{order.address.country}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Contact Details</p>
                  <p className="text-gray-900">
                    <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  </p>
                  <p className="text-gray-600">{user?.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Driver Information (if assigned) */}
            {order.driver && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Driver Information</h2>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium">{order.driver.firstName} {order.driver.lastName}</span>
                  </p>
                  <p className="text-gray-600">{order.driver.phone}</p>
                  <p className="text-sm text-gray-500">
                    Vehicle: {order.driver.vehicleType} ({order.driver.vehicleNumber})
                  </p>
                </div>
              </div>
            )}

            {/* Live Tracking (MVP) */}
            {order.driver && (order.status === "DISPATCHED" || order.status === "IN_TRANSIT") && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                </div>

                {trackingError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {trackingError}
                  </div>
                ) : tracking?.location ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Last update:</span>{" "}
                      {tracking.location.updatedAt ? formatDateTime(tracking.location.updatedAt) : "—"}
                      {tracking.location.updatedAt ? (
                        <span className="text-gray-500">
                          {" "}
                          ({formatRelativeAge(tracking.location.updatedAt) || "just now"})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      Near:{" "}
                      {trackingPlaceLoading ? (
                        <span className="text-gray-600 font-medium">Resolving area…</span>
                      ) : trackingPlace ? (
                        trackingPlace
                      ) : (
                        <span className="text-gray-600 font-medium">Location available</span>
                      )}
                    </p>
                    <a
                      className="inline-flex items-center gap-2 mt-2 text-primary-600 hover:text-primary-700 font-medium"
                      href={`https://www.google.com/maps?q=${tracking.location.latitude},${tracking.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14m-1 7H3v-6" />
                      </svg>
                    </a>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500 select-none">
                        Advanced (coordinates)
                      </summary>
                      <div className="mt-2 text-xs text-gray-600">
                        {Number(tracking.location.latitude).toFixed(5)}, {Number(tracking.location.longitude).toFixed(5)}
                      </div>
                    </details>
                    <p className="text-xs text-gray-500">
                      MVP: location updates while the driver app is active.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Waiting for driver location…</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fuel Cost</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(order.fuelCost || 0)}
                  </span>
                </div>
                {order.distance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance</span>
                    <span className="text-gray-900 font-medium">
                      {order.distance.toFixed(2)} miles
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(order.deliveryFee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(order.tax || 0)}
                  </span>
                </div>
                {order.tip && order.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tip</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(order.tip)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="text-gray-900 font-medium">
                      {getPaymentMethodDisplay(order.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'PAID' ? 'text-green-600' : 
                      order.paymentStatus === 'FAILED' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              {needsPayment && (
                <button
                  onClick={() => router.push(`/payment?orderId=${order.id}`)}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pay Now
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel Order</span>
                    </>
                  )}
                </button>
              )}

              {/* Support Link */}
              <Link
                href="/contact"
                className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contact Support
              </Link>
            </div>

            {/* Cancellation Info (if cancelled) */}
            {order.cancelledAt && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Order Cancelled</h3>
                    <p className="text-sm text-red-700 mb-1">
                      Cancelled on: <span className="font-medium">{formatDateTime(order.cancelledAt)}</span>
                    </p>
                    {order.cancellationReason && (
                      <p className="text-sm text-red-700">
                        Reason: <span className="font-medium">{order.cancellationReason}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Secure Order</p>
                    <p className="text-xs text-gray-600 mt-1">Your order is protected by our secure payment system</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">24/7 Support</p>
                    <p className="text-xs text-gray-600 mt-1">We're here to help with any questions</p>
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
