import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import Maintenance from './pages/Maintenance';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import Navbar from './components/Navbar';
import { PrivateRoute, AdminRoute } from './components/ProtectedRoute';
import SpinWheelPopup from './components/SpinWheelPopup';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Rewards from './pages/Rewards';
import PaymentGateway from './pages/PaymentGateway';


// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import DiscountBanner from './pages/admin/DiscountBanner';
import HeroSettings from './pages/admin/HeroSettings';
import AdminReviews from './pages/admin/Reviews';
import Settings from './pages/admin/Settings';

function MaintenanceGuard({ children }) {
  const { settings } = useSettings();
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (settings.maintenanceMode && !isAdmin && location.pathname !== '/login') {
    return <Maintenance />;
  }

  return children;
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
        <Router>
          {/* Global Toast Notifications */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
              },
              success: { iconTheme: { primary: '#D4AF37', secondary: '#1a1a1a' } }
            }}
          />
          
          <Routes>
            {/* Admin Routes (No public Navbar/Footer) */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="hero-settings" element={<HeroSettings />} />
              <Route path="discount-banner" element={<DiscountBanner />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Payment Gateway (No Navbar/Footer) */}
            <Route path="/payment-gateway" element={<PrivateRoute><PaymentGateway /></PrivateRoute>} />

            {/* Public/User Routes */}
            <Route path="*" element={
              <MaintenanceGuard>
                <div className="flex flex-col min-h-screen">
                <Navbar />
                <SpinWheelPopup />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    
                    {/* Protected User Routes */}
                    <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                    <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                    <Route path="/rewards" element={<PrivateRoute><Rewards /></PrivateRoute>} />
                  </Routes>

                </main>
              </div>
            </MaintenanceGuard>
            } />
          </Routes>
        </Router>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
