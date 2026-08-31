import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import Maintenance from './pages/Maintenance';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import Navbar from './components/Navbar';
import { PrivateRoute, AdminRoute, ArtisanRoute } from './components/ProtectedRoute';
import SpinWheelPopup from './components/SpinWheelPopup';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import PaymentGateway from './pages/PaymentGateway';
import ArtisanStore from './pages/ArtisanStore';

// Artisan Pages
import ArtisanLayout from './pages/artisan/ArtisanLayout';
import ArtisanDashboard from './pages/artisan/ArtisanDashboard';
import ArtisanProducts from './pages/artisan/ArtisanProducts';
import AIProductStudio from './pages/artisan/AIProductStudio';
import AIPriceSuggestion from './pages/artisan/AIPriceSuggestion';
import AIArtisanStory from './pages/artisan/AIArtisanStory';
import AIInsightsDashboard from './pages/artisan/AIInsightsDashboard';
import ArtisanOrders from './pages/artisan/ArtisanOrders';
import ArtisanEarnings from './pages/artisan/ArtisanEarnings';
import ArtisanProfile from './pages/artisan/ArtisanProfile';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminArtisans from './pages/admin/Artisans';
import Customers from './pages/admin/Customers';
import AdminProducts from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import Payments from './pages/admin/Payments';
import AIManagement from './pages/admin/AIManagement';
import AdminReviews from './pages/admin/Reviews';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import Notifications from './pages/admin/Notifications';
import ContentManagement from './pages/admin/ContentManagement';
import HeroSettings from './pages/admin/HeroSettings';
import DiscountBanner from './pages/admin/DiscountBanner';
import ActivityLogs from './pages/admin/ActivityLogs';
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
          <WishlistProvider>
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
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="artisans" element={<AdminArtisans />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="ai" element={<AIManagement />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="content" element={<ContentManagement />} />
                  <Route path="hero-settings" element={<HeroSettings />} />
                  <Route path="discount-banner" element={<DiscountBanner />} />
                  <Route path="activity" element={<ActivityLogs />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Artisan Routes */}
                <Route path="/artisan" element={<ArtisanRoute><ArtisanLayout /></ArtisanRoute>}>
                  <Route index element={<ArtisanDashboard />} />
                  <Route path="products"    element={<ArtisanProducts />} />
                  <Route path="ai-studio"   element={<AIProductStudio />} />
                  <Route path="ai-price"    element={<AIPriceSuggestion />} />
                  <Route path="ai-story"    element={<AIArtisanStory />} />
                  <Route path="ai-insights" element={<AIInsightsDashboard />} />
                  <Route path="orders"      element={<ArtisanOrders />} />
                  <Route path="earnings"    element={<ArtisanEarnings />} />
                  <Route path="profile"     element={<ArtisanProfile />} />
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
                        <Route path="/categories/:categorySlug" element={<ProductList />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/artisans/:id" element={<ArtisanStore />} />
                        
                        {/* Protected User Routes */}
                        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                        <Route path="/rewards" element={<PrivateRoute><Rewards /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                      </Routes>

                    </main>
                  </div>
                </MaintenanceGuard>
                } />
              </Routes>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
