import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, LogIn, UserPlus, User, ShoppingCart, Package, LogOut, Shield, Grid3x3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const NavigationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart() || { cart: { items: [] } };
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsOpen(false);

  const cartItemsCount = cart?.items?.length || 0;

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="group relative p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:bg-white hover:shadow-xl transition-all duration-300"
        aria-label="Menu di navigazione"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}

        {/* Cart badge */}
        {cartItemsCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartItemsCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-14 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Info Header */}
          {isAuthenticated && user && (
            <div className="px-4 py-3 bg-gradient-to-r from-[#E4002B] to-[#FF6B9D] text-white">
              <p className="text-sm font-medium">Ciao, {user.firstName || user.email}!</p>
              {isAdmin && (
                <span className="inline-block mt-1 text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  ⭐ Admin
                </span>
              )}
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {/* Home Link */}
            <Link
              to="/home"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>

            {/* Catalog Link */}
            <Link
              to="/products"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Grid3x3 className="w-5 h-5" />
              <span className="font-medium">Catalogo Prodotti</span>
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Carrello</span>
              {cartItemsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            <div className="my-2 border-t border-gray-200"></div>

            {/* Auth-dependent links */}
            {!isAuthenticated ? (
              <>
                {/* Login */}
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Accedi</span>
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">Registrati</span>
                </Link>
              </>
            ) : (
              <>
                {/* Profile */}
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profilo</span>
                </Link>

                {/* Orders */}
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">I Miei Ordini</span>
                </Link>

                {/* Admin Panel (only for admins) */}
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-gray-200"></div>
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 text-[#E4002B] hover:bg-red-50 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-bold">Admin Panel</span>
                    </Link>
                  </>
                )}

                <div className="my-2 border-t border-gray-200"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Esci</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationMenu;
