'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Address } from '@/types';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false);
        setAddressToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDeleteModal]);

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

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete({ id: address.id, label: address.label });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;

    try {
      await apiClient.delete(`/addresses/${addressToDelete.id}`);
      setShowDeleteModal(false);
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete address');
      setShowDeleteModal(false);
      setAddressToDelete(null);
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
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-gray-300 h-96 md:h-[450px] lg:h-[450px] flex items-center">
        <div className="absolute inset-0 bg-gray-400">
          <Image src="/assets/address.jpg" alt="Petrotech Addresses" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-red-600 opacity-70">
              PETROTECH
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl text-white opacity-70">
              Manage your delivery addresses for quick and easy fuel delivery
            </p>
          </div>
        </div>
      </section>

      {/* Addresses Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h2>
              <p className="text-gray-600">Manage your delivery addresses for quick and easy checkout</p>
            </div>
            <Link
              href="/addresses/new"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Address
            </Link>
          </div>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved yet</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <Link 
              href="/addresses/new" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Address
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-xl shadow-sm border p-6 relative transition-all duration-200 hover:shadow-md ${
                  address.isDefault ? 'border-2 border-primary-600 bg-primary-50/30' : 'border-gray-200'
                }`}
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-primary-600 text-white rounded-full shadow-sm">
                      Default
                    </span>
                  </div>
                )}

                {/* Address Icon & Title */}
                <div className="flex items-start gap-3 mb-4 pr-16">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    address.isDefault ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${address.isDefault ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {address.label}
                    </h3>
                  </div>
                </div>

                {/* Address Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {formatFullAddress(address)}
                    </p>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(user.phone)}</p>
                    </div>
                  )}
                  {address.instructions && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Delivery Instructions:</p>
                      <p className="text-sm text-gray-700">{address.instructions}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <Link
                    href={`/addresses/${address.id}/edit`}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(address)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && addressToDelete && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowDeleteModal(false);
                setAddressToDelete(null);
              }}
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Delete Address</h2>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setAddressToDelete(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700">
                      Are you sure you want to delete <span className="font-semibold">"{addressToDelete.label}"</span>?
                    </p>
                    <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setAddressToDelete(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
