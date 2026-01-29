'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { ChargingOrder } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function EVChargingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<ChargingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Don't redirect here - let middleware handle authentication
    // Just ensure cookie is synced and load orders if we have a token
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      if (localToken) {
        // Ensure cookie is set
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
        const cookieToken = tokenCookie?.split('=')[1];
        
        if (!cookieToken || cookieToken !== localToken) {
          const expiresIn = 7 * 24 * 60 * 60; // 7 days
          document.cookie = `token=${localToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
        }
        
        // Load orders (API will handle auth errors)
        loadOrders();
      } else {
        // No token - set loading to false so UI shows empty state
        setLoading(false);
      }
    }
  }, []);

  const loadOrders = async () => {
    try {
      const res = await apiClient.get('/charging');
      setOrders(res.data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
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
        return '24 Hours';
      default:
        return duration;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative w-full h-80 md:h-96 lg:h-[450px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/assets/products.jpg" 
            alt="EV Charging" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
          <div className="text-left max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fadeInUp">
              EV Charging Service
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              Get mobile EV charging delivered to your location. Fast, convenient, and reliable charging service.
            </p>
            <div className="mt-6 animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <Link
                href="/ev-charging/new"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-500 ease-out shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
              >
                <span>Order EV Charging</span>
                <svg className="ml-2 w-5 h-5 transition-transform duration-500 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/ev-charging/new"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">New Charging Order</h3>
                <p className="text-sm text-gray-600">Schedule mobile EV charging</p>
              </div>
            </div>
          </Link>

          <Link
            href="/cars"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Manage Cars</h3>
                <p className="text-sm text-gray-600">Add or edit your vehicles</p>
              </div>
            </div>
          </Link>

          <Link
            href="/addresses"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Manage Addresses</h3>
                <p className="text-sm text-gray-600">Update delivery locations</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Charging Orders</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No charging orders yet</h3>
              <p className="text-gray-600 mb-6">Get started by placing your first EV charging order</p>
              <Link
                href="/ev-charging/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors"
              >
                Place Your First Order
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/ev-charging/${order.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">Order #{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{getDurationLabel(order.chargingDuration)} • {order.numberOfCars} car{order.numberOfCars > 1 ? 's' : ''}</p>
                        <p>{order.address.street}, {order.address.city}, {order.address.state}</p>
                        <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-sm text-gray-500">{order.paymentStatus}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
