'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Car } from '@/types';

export default function CarsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cars');
      return;
    }
    loadCars();
  }, [isAuthenticated, router]);

  const loadCars = async () => {
    try {
      const res = await apiClient.get('/cars');
      setCars(res.data);
    } catch (error: any) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) {
      return;
    }

    try {
      setDeleteLoading(carId);
      await apiClient.delete(`/cars/${carId}`);
      setCars(cars.filter(c => c.id !== carId));
    } catch (error: any) {
      console.error('Error deleting car:', error);
      alert(error.response?.data?.error || 'Failed to delete car');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Cars</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your electric vehicles</p>
            </div>
            <Link
              href="/cars/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Car
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cars...</p>
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars saved yet</h3>
            <p className="text-gray-600 mb-6">Add your first electric vehicle to get started</p>
            <Link
              href="/cars/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors"
            >
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {car.nickname || `${car.make} ${car.model}`}
                      </h3>
                      {car.isDefault && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {car.year && `${car.year} • `}
                      {car.connectorType}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {car.licensePlate && (
                    <p><span className="font-medium">License:</span> {car.licensePlate}</p>
                  )}
                  {car.color && (
                    <p><span className="font-medium">Color:</span> {car.color}</p>
                  )}
                  {car.batteryCapacity && (
                    <p><span className="font-medium">Battery:</span> {car.batteryCapacity} kWh</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/cars/${car.id}/edit`}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(car.id)}
                    disabled={deleteLoading === car.id}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === car.id ? 'Deleting...' : 'Delete'}
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
