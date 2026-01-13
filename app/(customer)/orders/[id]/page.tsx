"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api";
import { Order } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

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

  return (
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto shadow-soft rounded-xl bg-white p-4">
        <div className="space-y-6">
          {/* Card 1: Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order #{order.orderNumber} Summary
            </h1>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Placed on {formatDate(order.createdAt)}. Status:{" "}
                <span className="font-medium text-gray-900">
                  {getStatusDisplay(order.status)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Estimated Delivery:{" "}
                <span className="font-medium text-gray-900">
                  {getEstimatedDeliveryDate(order)}
                </span>
              </p>
            </div>
          </div>

          {/* Card 2: Items List */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Items list
            </h2>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-3 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <span className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-base font-semibold text-primary-600 min-w-[80px] text-right">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Delivery Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delivery Information
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Shipping Address:</span>{" "}
                <span className="text-gray-600">
                  {order.address.street}, {order.address.city},{" "}
                  {order.address.state} {order.address.zipCode}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Contact Name:</span>{" "}
                <span className="text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Contact Phone:</span>{" "}
                <span className="text-gray-600">{user?.phone || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Card 4: Payment Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Payment Method:</span>{" "}
                <span className="text-gray-600">
                  {getPaymentMethodDisplay(order.paymentMethod)}
                </span>
              </p>
              {(order as any).transactionId && (
                <p className="text-gray-700">
                  <span className="font-medium">Transaction ID:</span>{" "}
                  <span className="text-gray-600">
                    {(order as any).transactionId}
                  </span>
                </p>
              )}
              <p className="text-gray-700 pt-2 border-t border-gray-200">
                <span className="font-medium">Total Amount:</span>{" "}
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </p>
            </div>
          </div>

          {/* Card 5: Driver Information (if assigned) */}
          {order.driver && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Driver Information
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Driver Name:</span>{" "}
                  <span className="text-gray-600">
                    {order.driver.firstName} {order.driver.lastName}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Driver Contact:</span>{" "}
                  <span className="text-gray-600">{order.driver.phone}</span>
                </p>
              </div>
            </div>
          )}

          {/* Cancel Order Button */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-primary-600 text-white py-3.5 px-6 rounded-md hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {cancelling ? "Cancelling Order..." : "Cancel Order"}
            </button>
          )}

          {/* Cancellation Info (if cancelled) */}
          {order.cancelledAt && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Order Cancelled
              </h2>
              <p className="text-sm text-red-700">
                Cancelled on: {formatDateTime(order.cancelledAt)}
              </p>
              {order.cancellationReason && (
                <p className="text-sm text-red-700 mt-2">
                  Reason: {order.cancellationReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
