'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Address, Car, CreateChargingOrderDto } from '@/types';
import { formatCurrency } from '@/lib/utils';

const CHARGING_DURATIONS = [
  { value: 'ONE_HOUR', label: '1 Hour', price: 25 },
  { value: 'TWO_HOURS', label: '2 Hours', price: 45 },
  { value: 'FIVE_HOURS', label: '5 Hours', price: 100 },
  { value: 'TWENTY_FOUR_HOURS', label: '24 Hours (Full Battery)', price: 350 },
] as const;

export default function NewChargingOrderPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [chargingDuration, setChargingDuration] = useState<'ONE_HOUR' | 'TWO_HOURS' | 'FIVE_HOURS' | 'TWENTY_FOUR_HOURS'>('ONE_HOUR');
  const [numberOfCars, setNumberOfCars] = useState<number>(1);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH_ON_DELIVERY' | 'CARD_ON_DELIVERY'>('ONLINE');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState<number>(0);
  const [error, setError] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [pricing, setPricing] = useState<Record<string, number>>({});

  useEffect(() => {
    // Don't redirect here - let middleware handle authentication
    // Just ensure cookie is synced and load data if we have a token
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
        
        // Load data (API will handle auth errors)
        loadData();
        loadPricing();
      }
    }
  }, []);

  useEffect(() => {
    if (selectedAddress) {
      calculateDistanceForAddress(selectedAddress);
    }
  }, [selectedAddress]);

  useEffect(() => {
    // Auto-select cars when numberOfCars changes
    if (numberOfCars > selectedCars.length) {
      const availableCars = cars.filter(car => !selectedCars.includes(car.id));
      const newSelections = availableCars.slice(0, numberOfCars - selectedCars.length).map(c => c.id);
      setSelectedCars([...selectedCars, ...newSelections]);
    } else if (numberOfCars < selectedCars.length) {
      setSelectedCars(selectedCars.slice(0, numberOfCars));
    }
  }, [numberOfCars, cars]);

  const loadData = async () => {
    try {
      const [addressesRes, carsRes] = await Promise.all([
        apiClient.get('/addresses'),
        apiClient.get('/cars'),
      ]);

      const addressesData = Array.isArray(addressesRes.data)
        ? addressesRes.data
        : (addressesRes.data?.addresses ?? []);

      const carsData = Array.isArray(carsRes.data)
        ? carsRes.data
        : (carsRes.data?.cars ?? []);

      setAddresses(addressesData);
      setCars(carsData);

      // Set default address
      const defaultAddress =
        addressesData.find((a: Address) => a.isDefault) || addressesData[0];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      }

      // Set default cars
      const defaultCars = carsData.filter((c: Car) => c.isDefault);
      if (defaultCars.length > 0) {
        setSelectedCars(defaultCars.slice(0, numberOfCars).map((c: Car) => c.id));
      } else if (carsData.length > 0) {
        setSelectedCars(carsData.slice(0, numberOfCars).map((c: Car) => c.id));
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.error || 'Failed to load data');
    }
  };

  const loadPricing = async () => {
    try {
      const res = await apiClient.get('/charging/pricing');
      setPricing(res.data);
    } catch (error: any) {
      console.error('Error loading pricing:', error);
    }
  };

  const calculateDistanceForAddress = async (addressId: string) => {
    try {
      setCalculatingDistance(true);
      const res = await apiClient.get(`/addresses/${addressId}/distance`);
      setDistance(res.data.distance);
      setDeliveryFee(res.data.deliveryFee);
    } catch (error: any) {
      console.error('Error calculating distance:', error);
      setDistance(null);
      setDeliveryFee(0);
    } finally {
      setCalculatingDistance(false);
    }
  };

  const calculateTotal = () => {
    const selectedDuration = CHARGING_DURATIONS.find(d => d.value === chargingDuration);
    const basePrice = selectedDuration?.price || pricing[chargingDuration] || 0;
    const baseFee = basePrice * numberOfCars;
    const subtotal = baseFee + deliveryFee;
    const tax = subtotal * 0.06; // 6% tax
    return {
      baseFee: Math.round(baseFee * 100) / 100,
      deliveryFee,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      tip,
      total: Math.round((subtotal + tax + tip) * 100) / 100,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (selectedCars.length !== numberOfCars) {
      setError(`Please select ${numberOfCars} car${numberOfCars > 1 ? 's' : ''}`);
      return;
    }

    if (numberOfCars < 1) {
      setError('Please select at least 1 car');
      return;
    }

    try {
      setLoading(true);

      const orderData: CreateChargingOrderDto = {
        addressId: selectedAddress,
        chargingDuration,
        numberOfCars,
        carIds: selectedCars,
        paymentMethod,
        scheduledAt: scheduledAt || undefined,
        notes: notes || undefined,
        tip: tip || 0,
      };

      const res = await apiClient.post('/charging', orderData);

      if (paymentMethod === 'ONLINE') {
        // Redirect to payment page
        router.push(`/payment?orderId=${res.data.id}&type=charging`);
      } else {
        // Redirect to order confirmation
        router.push(`/ev-charging/${res.data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New EV Charging Order</h1>
              <p className="text-sm text-gray-600 mt-1">Schedule mobile EV charging service</p>
            </div>
            <Link
              href="/ev-charging"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Charging Duration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Charging Duration</h2>
              <div className="grid grid-cols-2 gap-4">
                {CHARGING_DURATIONS.map((duration) => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setChargingDuration(duration.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      chargingDuration === duration.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{duration.label}</div>
                      <div className="text-primary-600 font-bold mt-1">
                        {formatCurrency(pricing[duration.value] || duration.price)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">per car</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Cars */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Number of Cars</h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setNumberOfCars(Math.max(1, numberOfCars - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  disabled={numberOfCars <= 1}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">{numberOfCars}</span>
                <button
                  type="button"
                  onClick={() => setNumberOfCars(Math.min(10, numberOfCars + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  disabled={numberOfCars >= 10}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Select Cars */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Cars</h2>
                <Link
                  href="/cars/new"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add New Car
                </Link>
              </div>
              {cars.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No cars saved yet</p>
                  <Link
                    href="/cars/new"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Your First Car
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars.map((car) => (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => {
                        if (selectedCars.includes(car.id)) {
                          setSelectedCars(selectedCars.filter(id => id !== car.id));
                        } else if (selectedCars.length < numberOfCars) {
                          setSelectedCars([...selectedCars, car.id]);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedCars.includes(car.id)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {car.nickname || `${car.make} ${car.model}`}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {car.year && `${car.year} `}
                        {car.connectorType}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedCars.length < numberOfCars && cars.length > 0 && (
                <p className="text-sm text-amber-600 mt-4">
                  Please select {numberOfCars - selectedCars.length} more car{numberOfCars - selectedCars.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                <Link
                  href="/addresses/new"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add New Address
                </Link>
              </div>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select an address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} - {address.street}, {address.city}, {address.state} {address.zipCode}
                  </option>
                ))}
              </select>
              {calculatingDistance && (
                <p className="text-sm text-gray-600 mt-2">Calculating distance...</p>
              )}
              {distance !== null && !calculatingDistance && (
                <p className="text-sm text-gray-600 mt-2">
                  Distance: {distance.toFixed(2)} miles
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {(['ONLINE', 'CASH_ON_DELIVERY', 'CARD_ON_DELIVERY'] as const).map((method) => (
                  <label key={method} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-900">
                      {method === 'ONLINE' ? 'Online Payment' : method === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Card on Delivery'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any special instructions or notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip for Driver (Optional)
                  </label>
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Charging Fee ({numberOfCars} car{numberOfCars > 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatCurrency(totals.baseFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{formatCurrency(totals.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tip</span>
                    <span className="font-medium">{formatCurrency(tip)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600 text-lg">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selectedAddress || selectedCars.length !== numberOfCars || (distance === null && !!selectedAddress)}
                className="w-full mt-6 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
