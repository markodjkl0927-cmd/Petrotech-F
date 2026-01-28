'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Product, Address, Order } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function NewOrderPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PAYPAL' | 'BANK_TRANSFER'>('CARD');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Address form fields (for manual entry)
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated) {
      // Store the current path for redirect after login
      sessionStorage.setItem('redirectAfterLogin', '/orders/new');
      router.push('/login');
      return;
    }

    const initializePage = async () => {
      const fromProducts = sessionStorage.getItem('fromProducts');
      
      if (!fromProducts) {
        const savedItems = sessionStorage.getItem('orderItems');
        if (savedItems) {
          sessionStorage.removeItem('orderItems');
        }
      }
      
      await loadData();
      
      if (fromProducts) {
        sessionStorage.removeItem('fromProducts');
      }
      
      const returningFromAddress = sessionStorage.getItem('returnToOrder');
      if (returningFromAddress === 'true') {
        sessionStorage.removeItem('returnToOrder');
        await loadData();
      }
    };
    
    initializePage();
  }, [isAuthenticated, router]);

  // Pre-fill address form when addresses or user data loads
  useEffect(() => {
    if (addresses.length > 0 && !addressForm.street) {
      const defaultAddress = addresses.find((a: Address) => a.isDefault) || addresses[0];
      if (defaultAddress) {
        setAddressForm({
          fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          street: defaultAddress.street || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          zipCode: defaultAddress.zipCode || '',
          country: defaultAddress.country || 'US',
        });
        setSelectedAddress(defaultAddress.id);
      }
    } else if (user && !addressForm.fullName) {
      setAddressForm({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      });
    }
  }, [addresses, user]);

  const loadData = async () => {
    try {
      const productsRes = await apiClient.get('/products');
      setProducts(productsRes.data.products || []);

      const addressesRes = await apiClient.get('/addresses');
      const userAddresses = addressesRes.data.addresses || [];
      setAddresses(userAddresses);
      if (userAddresses.length > 0) {
        const defaultAddress = userAddresses.find((a: Address) => a.isDefault) || userAddresses[0];
        setSelectedAddress(defaultAddress.id);
      }

      const savedItems = sessionStorage.getItem('orderItems');
      if (savedItems) {
        try {
          const parsedItems = JSON.parse(savedItems);
          setOrderItems(parsedItems);
        } catch (error) {
          sessionStorage.removeItem('orderItems');
          setOrderItems([]);
        }
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        return total + product.pricePerLiter * item.quantity;
      }
      return total;
    }, 0);
  };

  const showErrorToast = (message: string) => {
    setError(message);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
      setError('');
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    setLoading(true);

    // Validate address fields
    if (!addressForm.fullName || !addressForm.street || !addressForm.city || !addressForm.zipCode) {
      showErrorToast('Please fill in all required address fields');
      setLoading(false);
      return;
    }

    if (orderItems.length === 0) {
      showErrorToast('Please add products to your order');
      setLoading(false);
      return;
    }

    // Validate quantities
    for (const item of orderItems) {
      if (item.quantity < 50) {
        showErrorToast('Minimum order quantity is 50 liters per product');
        setLoading(false);
        return;
      }
      if (item.quantity > 5000) {
        showErrorToast('Maximum order quantity is 5000 liters per product');
        setLoading(false);
        return;
      }
    }

    try {
      // Create or use existing address
      let addressId = selectedAddress;
      
      // Check if we should use existing address or create new one
      if (selectedAddress) {
        const existingAddress = addresses.find(a => a.id === selectedAddress);
        if (existingAddress && 
            (existingAddress.street !== addressForm.street || 
             existingAddress.city !== addressForm.city ||
             existingAddress.zipCode !== addressForm.zipCode)) {
          // User modified the address, create new one
          const newAddressRes = await apiClient.post('/addresses', {
            label: 'Order Address',
            street: addressForm.street,
            city: addressForm.city,
            state: addressForm.state,
            zipCode: addressForm.zipCode,
            country: addressForm.country,
            isDefault: false,
          });
          addressId = newAddressRes.data.address.id;
        }
      } else {
        // No address selected, create new one from form
        const newAddressRes = await apiClient.post('/addresses', {
          label: 'Order Address',
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zipCode: addressForm.zipCode,
          country: addressForm.country,
          isDefault: false,
        });
        addressId = newAddressRes.data.address.id;
      }

      // Map delivery type: STANDARD -> PRIVATE, EXPRESS -> COMMERCIAL
      const mappedDeliveryType = deliveryType === 'EXPRESS' ? 'COMMERCIAL' : 'PRIVATE';

      // Map payment method: CARD -> ONLINE, PAYPAL -> ONLINE, BANK_TRANSFER -> ONLINE
      const mappedPaymentMethod = 'ONLINE';

      const orderData = {
        addressId,
        deliveryType: mappedDeliveryType,
        paymentMethod: mappedPaymentMethod,
        deliveryDate: deliveryDate || undefined,
        items: orderItems,
        notes: notes || undefined,
      };

      const response = await apiClient.post('/orders', orderData);
      const createdOrder = response.data.order;
      
      sessionStorage.removeItem('orderItems');
      sessionStorage.removeItem('returnToOrder');
      
      // If payment method is ONLINE, redirect to payment page
      if (mappedPaymentMethod === 'ONLINE') {
        router.push(`/payment?orderId=${createdOrder.id}`);
      } else {
        // For other payment methods (cash on delivery), go to order page
        router.push(`/orders/${createdOrder.id}`);
      }
    } catch (err: any) {
      showErrorToast(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Error Toast Notification - Top Right */}
      {showError && error && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowError(false);
                    setError('');
                  }}
                  className="inline-flex text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='max-w-6xl mx-auto bg-white p-4 rounded-xl shadow-soft'>
      <div className="">

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Order Items Card */}
              <div className="border border-gray-200 rounded-xl">
                <div className="pt-4 px-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                </div>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No items in order.</p>
                    <Link href="/products" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
                      Add products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {orderItems.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      if (!product) return null;
                      
                      const subtotal = product.pricePerLiter * item.quantity;
                      
                      return (
                        <div key={item.productId} className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-0">
                          {/* Product Image Placeholder */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(product.pricePerLiter)}</p>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...orderItems];
                                if (newItems[index].quantity > 1) {
                                  newItems[index].quantity -= 1;
                                  setOrderItems(newItems);
                                  sessionStorage.setItem('orderItems', JSON.stringify(newItems));
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors text-sm font-medium"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                const newItems = [...orderItems];
                                newItems[index].quantity = newQuantity;
                                setOrderItems(newItems);
                                sessionStorage.setItem('orderItems', JSON.stringify(newItems));
                              }}
                              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...orderItems];
                                newItems[index].quantity += 1;
                                setOrderItems(newItems);
                                sessionStorage.setItem('orderItems', JSON.stringify(newItems));
                              }}
                              className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white transition-colors text-sm font-medium"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Subtotal */}
                          <div className="text-right min-w-[80px]">
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = orderItems.filter((_, i) => i !== index);
                              setOrderItems(newItems);
                              if (newItems.length > 0) {
                                sessionStorage.setItem('orderItems', JSON.stringify(newItems));
                              } else {
                                sessionStorage.removeItem('orderItems');
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium px-2 py-1 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delivery Type Card */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Type</h2>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="STANDARD"
                      checked={deliveryType === 'STANDARD'}
                      onChange={(e) => setDeliveryType(e.target.value as 'STANDARD')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                    />
                    <span className="ml-3 text-gray-700">Standard Delivery (3-5 business days)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="EXPRESS"
                      checked={deliveryType === 'EXPRESS'}
                      onChange={(e) => setDeliveryType(e.target.value as 'EXPRESS')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                    />
                    <span className="ml-3 text-gray-700">Express Delivery (1-2 business days)</span>
                  </label>
                </div>
              </div>

              {/* Delivery Date Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Date</h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    min={getMinDeliveryDate()}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Delivery Address Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="State/Province"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="ZIP/Postal Code"
                      required
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'CARD')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                    />
                    <span className="ml-3 text-gray-700">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAYPAL"
                      checked={paymentMethod === 'PAYPAL'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'PAYPAL')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                    />
                    <span className="ml-3 text-gray-700">PayPal</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'BANK_TRANSFER')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                    />
                    <span className="ml-3 text-gray-700">Bank Transfer</span>
                  </label>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any special instructions or notes for your order here..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-600 focus:border-primary-600 placeholder-gray-400 resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bottom Section - Total and Submit */}
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">Total: {formatCurrency(getOrderTotal())}</span>
            </div>
            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="w-full bg-primary-600 text-white py-3.5 px-6 rounded-md hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {loading ? 'Submitting Order...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
