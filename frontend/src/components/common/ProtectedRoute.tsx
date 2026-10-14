import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          Verifying security authorization...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login preserving the attempted destination
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 dark:border-rose-800">
            <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            This administrative area is strictly protected. Your account (<strong>{user.email}</strong>) does not hold authorized administrator credentials.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-md transition"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Safety (Storefront)
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center py-2.5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition"
            >
              Go to My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
