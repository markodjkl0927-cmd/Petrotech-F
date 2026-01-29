'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { ChargingOrder } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function ChargingOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<ChargingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Ensure cookie is synced before making API calls
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      if (localToken) {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
        const cookieToken = tokenCookie?.split('=')[1];
        
        if (!cookieToken || cookieToken !== localToken) {
          const expiresIn = 7 * 24 * 60 * 60; // 7 days
          document.cookie = `token=${localToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
        }
      }
    }
    
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await apiClient.get(`/charging/${orderId}`);
      setOrder(response.data);
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      if (error.response?.status === 404) {
        router.push('/ev-charging');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      await apiClient.delete(`/charging/${order.id}`);
      fetchOrder(order.id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Processing';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'ASSIGNED':
        return 'Assigned';
      case 'IN_PROGRESS':
        return 'Charging in Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case 'ONE_HOUR':
        return '1 Hour';
      case 'TWO_HOURS':
        return '2 Hours';
      case 'FIVE_HOURS':
        return '5 Hours';
      case 'TWENTY_FOUR_HOURS':
        return '24 Hours (Full Battery)';
      default:
        return duration;
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'ONLINE':
        return 'Online Payment';
      case 'CASH_ON_DELIVERY':
        return 'Cash on Delivery';
      case 'CARD_ON_DELIVERY':
        return 'Card on Delivery';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link href="/ev-charging" className="text-primary-600 hover:text-primary-700">
            Back to Charging Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Charging Order Details</h1>
              <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
            </div>
            <Link
              href="/ev-charging"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusDisplay(order.status)}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Order Date:</span> {formatDateTime(order.createdAt)}</p>
                {order.scheduledAt && (
                  <p><span className="font-medium">Scheduled For:</span> {formatDateTime(order.scheduledAt)}</p>
                )}
                {order.startedAt && (
                  <p><span className="font-medium">Started At:</span> {formatDateTime(order.startedAt)}</p>
                )}
                {order.completedAt && (
                  <p><span className="font-medium">Completed At:</span> {formatDateTime(order.completedAt)}</p>
                )}
                {order.cancelledAt && (
                  <p><span className="font-medium">Cancelled At:</span> {formatDateTime(order.cancelledAt)}</p>
                )}
              </div>
            </div>

            {/* Charging Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Charging Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{getDurationLabel(order.chargingDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of Cars:</span>
                  <span className="font-medium text-gray-900">{order.numberOfCars}</span>
                </div>
                {order.chargingUnit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charging Unit:</span>
                    <span className="font-medium text-gray-900">{order.chargingUnit.name}</span>
                  </div>
                )}
                {order.driver && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium text-gray-900">
                      {order.driver.firstName} {order.driver.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cars */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cars to Charge</h2>
              <div className="space-y-3">
                {order.cars.map((orderCar) => (
                  <div key={orderCar.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">
                      {orderCar.car.nickname || `${orderCar.car.make} ${orderCar.car.model}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {orderCar.car.year && `${orderCar.car.year} • `}
                      {orderCar.car.connectorType}
                      {orderCar.car.licensePlate && ` • ${orderCar.car.licensePlate}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.address.label}</p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state} {order.address.zipCode}
                </p>
                {order.address.instructions && (
                  <p className="mt-2 text-gray-500">
                    <span className="font-medium">Instructions:</span> {order.address.instructions}
                  </p>
                )}
                <p className="mt-2">
                  <span className="font-medium">Distance:</span> {order.distance.toFixed(2)} miles
                </p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* Cancel Order */}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h2>
                <p className="text-sm text-gray-600 mb-4">
                  If you need to cancel this order, please click the button below.
                </p>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Charging Fee:</span>
                  <span className="font-medium">{formatCurrency(order.baseFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(order.tax)}</span>
                </div>
                {order.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip:</span>
                    <span className="font-medium">{formatCurrency(order.tip)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-primary-600 text-lg">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900">{getPaymentMethodDisplay(order.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'PAID' ? 'text-green-600' : 
                      order.paymentStatus === 'FAILED' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {order.paymentStatus === 'PENDING' && order.paymentMethod === 'ONLINE' && (
                  <Link
                    href={`/payment?orderId=${order.id}&type=charging`}
                    className="block w-full mt-4 px-4 py-2 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Complete Payment
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
