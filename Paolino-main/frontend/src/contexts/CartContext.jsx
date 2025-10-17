import { createContext, useContext, useEffect, useState } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext({});

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await cartAPI.get();
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, variantId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Devi effettuare il login per aggiungere prodotti al carrello');
      return { success: false };
    }

    try {
      const response = await cartAPI.add({
        productId,
        variantId,
        quantity
      });
      
      setCart(response.data.cart);
      toast.success('Prodotto aggiunto al carrello');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nell\'aggiunta al carrello';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartAPI.update(itemId, { quantity });
      setCart(response.data.cart);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nell\'aggiornamento';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await cartAPI.remove(itemId);
      setCart(response.data.cart);
      toast.success('Prodotto rimosso dal carrello');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nella rimozione';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart(null);
      toast.success('Carrello svuotato');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nello svuotamento';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const getCartTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
    cartTotal: getCartTotal(),
    cartItemsCount: getCartItemsCount(),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};