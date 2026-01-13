'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Address } from '@/types';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/addresses');
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await apiClient.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.put(`/addresses/${id}/default`);
      fetchAddresses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to set default address');
    }
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    // Format phone number if it exists
    return phone;
  };

  const formatFullAddress = (address: Address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <Link
            href="/addresses/new"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-md hover:bg-primary-700 font-medium transition-colors"
          >
            Add Address
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-soft p-12 text-center">
            <p className="text-gray-500 mb-4">No addresses saved yet.</p>
            <Link href="/addresses/new" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
              Add your first address
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white border rounded-xl shadow-soft p-6 relative ${
                  address.isDefault ? 'border-2 border-primary-600' : 'border border-gray-200'
                }`}
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-primary-600 text-white rounded">
                      Default
                    </span>
                  </div>
                )}

                {/* Address Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pr-20">
                  {address.label}
                </h3>

                {/* Address Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {formatFullAddress(address)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {formatPhoneNumber(user?.phone)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <Link
                    href={`/addresses/${address.id}/edit`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
