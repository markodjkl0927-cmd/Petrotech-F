'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';

export default function DriverActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invite token is missing. Please ask admin to generate a new invite link.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/driver/auth/activate', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Activate / Reset Password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set (or reset) your driver password. Then sign in to the Driver App.
        </p>

        {!token ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Invite token is missing. Please use the full invite link from admin.
          </div>
        ) : null}

        {success ? (
          <div className="mt-6">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Password updated. You can now log in using your email and new password.
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex-1 h-11 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
              >
                Admin/Customer Login
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Note: Driver login happens in the Driver App (mobile/web). This page only sets your password.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400 transition-colors font-medium"
            >
              {loading ? 'Saving…' : 'Save password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

