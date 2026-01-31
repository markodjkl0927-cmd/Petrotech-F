import { Suspense } from 'react';
import ActivateClient from './ActivateClient';

export default function DriverActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-4 w-80 bg-gray-100 rounded animate-pulse" />
            <div className="mt-8 space-y-3">
              <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <ActivateClient />
    </Suspense>
  );
}

