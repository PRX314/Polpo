import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Heart
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductImageUrl } from '../utils/imageHelper';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setUpdatingItems(prev => new Set([...prev, itemId]));
    
    try {
      await updateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingItems(prev => new Set([...prev, itemId]));
    
    try {
      await removeFromCart(itemId);
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }
  };

  const calculateShipping = () => {
    const shippingThreshold = 50;
    return cartTotal >= shippingThreshold ? 0 : 5.99;
  };

  const calculateTotal = () => {
    return cartTotal + calculateShipping();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-primary-400 mb-4" />
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Accedi per vedere il carrello
          </h2>
          <p className="text-primary-600 mb-6">
            Effettua il login per visualizzare i prodotti nel tuo carrello
          </p>
          <Link to="/login" className="btn-primary">
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-primary-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-primary-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-primary-200 rounded"></div>
                      <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-6">
              <div className="space-y-4">
                <div className="h-6 bg-primary-200 rounded"></div>
                <div className="h-4 bg-primary-200 rounded"></div>
                <div className="h-4 bg-primary-200 rounded"></div>
                <div className="h-10 bg-primary-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-primary-300 mb-6" />
          <h2 className="text-3xl font-bold text-primary-900 mb-4">
            Il tuo carrello è vuoto
          </h2>
          <p className="text-primary-600 mb-8 max-w-md mx-auto">
            Sembra che tu non abbia ancora aggiunto nulla al carrello. 
            Esplora i nostri prodotti e trova quello che fa per te!
          </p>
          <Link to="/products" className="btn-primary">
            Inizia lo Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Carrello</h1>
          <p className="text-primary-600 mt-1">
            {cart.items.length} {cart.items.length === 1 ? 'prodotto' : 'prodotti'}
          </p>
        </div>
        
        <Link 
          to="/products"
          className="btn-outline flex items-center space-x-2"
        >
          <ArrowLeft size={16} />
          <span>Continua Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item._id} className="card">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <Link 
                      to={`/products/${item.product._id}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-24 h-24 bg-primary-50 rounded-lg overflow-hidden">
                        {item.product.images && item.product.images[0] ? (
                          <img
                            src={getProductImageUrl(item.product, 0)}
                            alt={item.product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-400">
                            <ShoppingBag size={24} />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/products/${item.product._id}`}
                        className="text-lg font-semibold text-primary-900 hover:text-primary-700"
                      >
                        {item.product.name}
                      </Link>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-primary-600">
                        <span>Taglia: {item.variant.size}</span>
                        <span>•</span>
                        <span>Colore: {item.variant.color}</span>
                      </div>
                      
                      <p className="text-sm text-primary-500 mt-1">
                        SKU: {item.variant.sku}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-primary-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                              disabled={updatingItems.has(item._id) || item.quantity <= 1}
                              className="p-2 text-primary-600 hover:text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus size={16} />
                            </button>
                            
                            <span className="px-4 py-2 font-medium text-primary-900 min-w-16 text-center">
                              {updatingItems.has(item._id) ? '...' : item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              disabled={updatingItems.has(item._id)}
                              className="p-2 text-primary-600 hover:text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={updatingItems.has(item._id)}
                            className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Rimuovi dal carrello"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary-900">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-primary-500">
                              {formatCurrency(item.price)} cad.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={clearCart}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
            >
              Svuota Carrello
            </button>
            
            <button className="btn-outline flex items-center space-x-2">
              <Heart size={16} />
              <span>Salva per dopo</span>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-6">
              Riepilogo Ordine
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-primary-700">
                <span>Subtotale ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} prodotti)</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <div className="flex justify-between text-primary-700">
                <span>Spedizione</span>
                <span>
                  {calculateShipping() === 0 ? (
                    <span className="text-green-600 font-medium">Gratuita</span>
                  ) : (
                    formatCurrency(calculateShipping())
                  )}
                </span>
              </div>

              {cartTotal < 50 && (
                <div className="text-sm text-primary-500 bg-primary-50 p-3 rounded-lg">
                  Aggiungi {formatCurrency(50 - cartTotal)} per la spedizione gratuita!
                </div>
              )}

              <div className="border-t border-primary-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-primary-900">
                  <span>Totale</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2"
            >
              <span>Procedi al Checkout</span>
              <ArrowRight size={18} />
            </button>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-primary-500">
                <span>Pagamento sicuro con</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                    VISA
                  </div>
                  <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center">
                    MC
                  </div>
                  <div className="w-8 h-5 bg-primary-800 rounded text-white text-xs flex items-center justify-center">
                    S
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Products */}
          <div className="card mt-6 p-6">
            <h3 className="font-semibold text-primary-900 mb-4">
              Potrebbero interessarti
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-primary-600 text-center py-4">
                Suggerimenti prodotti in arrivo...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;