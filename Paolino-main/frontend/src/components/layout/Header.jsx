import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Settings, Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import ThemeSwitcher from '../ui/ThemeSwitcher';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] shadow-[0_4px_6px_rgba(0,0,0,0.07)] border-b-2 border-transparent transition-all duration-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-bold text-[1.8rem] text-white tracking-tight">Paolino</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105">
              Prodotti
            </Link>
            {isAuthenticated && (
              <Link to="/wishlist" className="text-white/40 hover:text-white transition-all duration-200 flex items-center gap-1 text-xs uppercase tracking-wider font-light">
                <Bookmark size={13} strokeWidth={1} />
                <span>Salvati</span>
              </Link>
            )}
            <Link to="/products?category=magliette" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">
              Magliette
            </Link>
            <Link to="/products?category=felpe" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">
              Felpe
            </Link>
            <Link to="/products?category=sciarpe" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">
              Sciarpe
            </Link>
            <Link to="/products?category=accessori" className="text-white/90 hover:text-white transition-all duration-300 hover:scale-105">
              Accessori
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-white/90 hover:text-white transition-all duration-300 hover:scale-110">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#48dbfb] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-white/90 hover:text-white transition-all duration-300 hover:scale-105"
                >
                  <User size={22} />
                  <span className="hidden sm:block font-medium">{user?.firstName}</span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-[16px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] border border-[#e9ecef] z-20">
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-[#333333] hover:bg-[#f8f9fa] transition-all duration-300"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings size={16} className="mr-3" />
                          Il mio profilo
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center px-4 py-3 text-sm text-[#333333] hover:bg-[#f8f9fa] transition-all duration-300"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingCart size={16} className="mr-3" />
                          I miei ordini
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-3 text-sm text-[#333333] hover:bg-[#f8f9fa] transition-all duration-300"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings size={16} className="mr-3" />
                            Pannello Admin
                          </Link>
                        )}
                        <hr className="my-2 border-[#e9ecef]" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-300"
                        >
                          <LogOut size={16} className="mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white border-2 border-white/30 rounded-[10px] backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:scale-105"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-[#48dbfb] bg-white rounded-[10px] transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Registrati
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white/90 hover:text-white transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-white/10 backdrop-blur-lg">
            <div className="px-3 pt-3 pb-4 space-y-2">
              <Link
                to="/products"
                className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] font-medium transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Tutti i Prodotti
              </Link>
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="flex items-center px-4 py-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg font-light transition-all duration-200 text-xs uppercase tracking-wide"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bookmark size={14} strokeWidth={1} className="mr-2.5" />
                  Salvati
                </Link>
              )}
              <Link
                to="/products?category=magliette"
                className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Magliette
              </Link>
              <Link
                to="/products?category=felpe"
                className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Felpe
              </Link>
              <Link
                to="/products?category=sciarpe"
                className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Sciarpe
              </Link>
              <Link
                to="/products?category=accessori"
                className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-[10px] transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Accessori
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;