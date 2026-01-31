'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Driver } from '@/types';

export default function AdminDriversPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleNumber: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteDriverName, setInviteDriverName] = useState<string>('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false);
        setEditingDriver(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          licenseNumber: '',
          vehicleType: '',
          vehicleNumber: '',
        });
      }
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false);
        setDriverToDelete(null);
      }
      if (e.key === 'Escape' && showInviteModal) {
        setShowInviteModal(false);
        setInviteLink(null);
        setInviteCopied(false);
        setInviteDriverName('');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showForm, showDeleteModal, showInviteModal]);

  const fetchDrivers = async () => {
    try {
      const response = await apiClient.get('/admin/drivers');
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await apiClient.put(`/admin/drivers/${editingDriver.id}`, formData);
      } else {
        await apiClient.post('/admin/drivers', formData);
      }
      setShowForm(false);
      setEditingDriver(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        vehicleType: '',
        vehicleNumber: '',
      });
      fetchDrivers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save driver');
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete({ id: driver.id, name: `${driver.firstName} ${driver.lastName}` });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      await apiClient.delete(`/admin/drivers/${driverToDelete.id}`);
      setShowDeleteModal(false);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete driver');
      setShowDeleteModal(false);
      setDriverToDelete(null);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/drivers/${id}`, { isAvailable: !currentStatus });
      fetchDrivers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update driver');
    }
  };

  const handleGenerateInvite = async (driver: Driver) => {
    try {
      const res = await apiClient.post(`/admin/drivers/${driver.id}/invite`, {});
      const token: string | undefined = res.data?.token;
      if (!token) throw new Error('Invite token was not returned');

      const link = `${window.location.origin}/driver/activate?token=${encodeURIComponent(token)}`;
      setInviteDriverName(`${driver.firstName} ${driver.lastName}`);
      setInviteLink(link);
      setInviteCopied(false);
      setShowInviteModal(true);

      try {
        await navigator.clipboard.writeText(link);
        setInviteCopied(true);
      } catch {
        // Clipboard may be unavailable on some browsers / insecure contexts.
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Failed to generate invite link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingDriver(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  licenseNumber: '',
                  vehicleType: '',
                  vehicleNumber: '',
                });
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Driver
            </button>
          </div>

          {/* Edit/Add Modal */}
          {showForm && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => {
                  setShowForm(false);
                  setEditingDriver(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    licenseNumber: '',
                    vehicleType: '',
                    vehicleNumber: '',
                  });
                }}
              >
                {/* Modal Content */}
                <div
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setEditingDriver(null);
                          setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            licenseNumber: '',
                            vehicleType: '',
                            vehicleNumber: '',
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter first name"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter last name"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            placeholder="Enter email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            License Number *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter license number"
                            required
                            value={formData.licenseNumber}
                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Type *
                          </label>
                          <input
                            type="text"
                            placeholder="Tanker/Car"
                            required
                            value={formData.vehicleType}
                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Number *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter vehicle number"
                            required
                            value={formData.vehicleNumber}
                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingDriver(null);
                            setFormData({
                              firstName: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              licenseNumber: '',
                              vehicleType: '',
                              vehicleNumber: '',
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
                        >
                          {editingDriver ? 'Update Driver' : 'Create Driver'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && driverToDelete && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDriverToDelete(null);
                }}
              >
                {/* Modal Content */}
                <div
                  className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Delete Driver</h2>
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDriverToDelete(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="mb-6">
                      <p className="text-gray-700">
                        Are you sure you want to delete <span className="font-semibold">"{driverToDelete.name}"</span>?
                      </p>
                      <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDriverToDelete(null);
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

          {/* Invite Link Modal */}
          {showInviteModal && inviteLink && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink(null);
                  setInviteCopied(false);
                  setInviteDriverName('');
                }}
              >
                <div
                  className="bg-white rounded-lg shadow-xl max-w-xl w-full animate-scaleIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Invite link</h2>
                      <button
                        onClick={() => {
                          setShowInviteModal(false);
                          setInviteLink(null);
                          setInviteCopied(false);
                          setInviteDriverName('');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-sm text-gray-700">
                      Send this link to <span className="font-semibold">{inviteDriverName}</span> so they can set (or reset) their password.
                    </p>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invite link</label>
                      <div className="flex gap-2">
                        <input
                          value={inviteLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(inviteLink);
                              setInviteCopied(true);
                            } catch {
                              alert('Copy failed. Please copy the link manually.');
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Copy
                        </button>
                      </div>
                      {inviteCopied ? <p className="mt-2 text-sm text-green-700">Copied to clipboard.</p> : null}
                      <p className="mt-2 text-xs text-gray-500">MVP: we’re not sending email/SMS automatically yet.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {driver.firstName} {driver.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.vehicleType} ({driver.vehicleNumber})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          driver.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {driver.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateInvite(driver)}
                          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          title="Generate invite link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 010 5.656m-1.414-1.414a2 2 0 000-2.828m-2.828 2.828l-2.121 2.121a4 4 0 01-5.657-5.657l2.121-2.121m2.828-2.828l2.121-2.121a4 4 0 015.657 5.657l-2.121 2.121"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(driver)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                          title="Edit Driver"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(driver)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Driver"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
