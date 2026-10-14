import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';

import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';

import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { AdminDashboard } from './pages/AdminDashboard';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { NotFound } from './pages/NotFound';
import { Feedback } from './pages/Feedback';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { ScrollToTop } from './components/ScrollToTop';

const queryClient = new QueryClient();

export function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013400030560-63k32pve6lsh27g68j0r1d5k9n0a4dcb.apps.googleusercontent.com'}>
      <QueryClientProvider client={queryClient}>
      <HelmetProvider>
    <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
              <ScrollToTop />
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slateCustom-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden w-full">
                <Header />
                <main className="flex-1 pb-20 md:pb-0">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/order-success/:id" element={<OrderSuccess />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/about" element={<About />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="/shipping" element={<ShippingPolicy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <CartDrawer />
                <Footer />
                <MobileBottomNav />
              </div>
            </Router>
          </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;





