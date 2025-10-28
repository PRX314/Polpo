import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { wishlistAPI, cartAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getProductImageUrl } from '../utils/imageHelper';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingProducts, setProcessingProducts] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.get();
      setWishlist(response.data.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Errore nel caricamento dei preferiti');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    if (processingProducts.has(productId)) return;

    setProcessingProducts(prev => new Set(prev).add(productId));
    try {
      await wishlistAPI.remove(productId);
      setWishlist(prev => prev.filter(product => product._id !== productId));
      toast.success('Prodotto rimosso dai preferiti');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Errore nella rimozione dai preferiti');
    } finally {
      setProcessingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (product) => {
    if (processingProducts.has(product._id)) return;

    // Find the first available variant
    const availableVariant = product.variants?.find(variant => variant.stock > 0);
    if (!availableVariant) {
      toast.error('Prodotto non disponibile');
      return;
    }

    setProcessingProducts(prev => new Set(prev).add(product._id));
    try {
      await addToCart(product._id, availableVariant._id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setProcessingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product._id);
        return newSet;
      });
    }
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getProductPrice = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return product.basePrice;
    }
    
    // Get the lowest price considering variants
    const minVariantPrice = Math.min(
      ...product.variants.map(variant => 
        product.basePrice + (variant.priceModifier || 0)
      )
    );
    return minVariantPrice;
  };

  const isProductInStock = (product) => {
    return product.variants?.some(variant => variant.stock > 0) || false;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Heart className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Accedi per vedere i tuoi preferiti
          </h2>
          <p className="text-primary-600 mb-6">
            Effettua il login per visualizzare e gestire i tuoi prodotti preferiti.
          </p>
          <div className="space-x-4">
            <Link to="/login" className="btn-primary">
              Accedi
            </Link>
            <Link to="/register" className="btn-outline">
              Registrati
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-primary-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-primary-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-primary-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-primary-200 rounded"></div>
                <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                <div className="h-8 bg-primary-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          I Miei Preferiti
        </h1>
        <p className="text-primary-600">
          {wishlist.length === 0 
            ? 'Non hai ancora aggiunto prodotti ai tuoi preferiti'
            : `${wishlist.length} ${wishlist.length === 1 ? 'prodotto preferito' : 'prodotti preferiti'}`
          }
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-primary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary-900 mb-2">
            Nessun prodotto nei preferiti
          </h3>
          <p className="text-primary-600 mb-6">
            Inizia ad esplorare i nostri prodotti e aggiungi quelli che ti piacciono ai preferiti.
          </p>
          <Link to="/products" className="btn-primary">
            Esplora Prodotti
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product._id} className="card group hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="relative aspect-square bg-primary-50 rounded-lg overflow-hidden mb-4">
                <Link to={`/products/${product._id}`}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getProductImageUrl(product, 0)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400">
                      <ShoppingCart size={32} />
                    </div>
                  )}
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFromWishlist(product._id)}
                  disabled={processingProducts.has(product._id)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                  title="Rimuovi dai preferiti"
                >
                  {processingProducts.has(product._id) ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart size={16} className="fill-current" />
                  )}
                </button>

                {/* Stock badge */}
                {!isProductInStock(product) && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                    Esaurito
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link to={`/products/${product._id}`}>
                  <h3 className="font-semibold text-primary-900 mb-1 hover:text-primary-700 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-400 fill-current" />
                  ))}
                  <span className="text-xs text-primary-500 ml-1">(4.5)</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary-800">
                    {formatCurrency(getProductPrice(product))}
                  </span>
                  <span className="text-xs text-primary-500 capitalize">
                    {product.category}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!isProductInStock(product) || processingProducts.has(product._id)}
                    className={`flex-1 btn-primary btn-sm flex items-center justify-center space-x-2 ${
                      !isProductInStock(product) || processingProducts.has(product._id)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {processingProducts.has(product._id) ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        <span className="text-sm">
                          {isProductInStock(product) ? 'Aggiungi' : 'Esaurito'}
                        </span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleRemoveFromWishlist(product._id)}
                    disabled={processingProducts.has(product._id)}
                    className="btn-outline btn-sm p-2 disabled:opacity-50"
                    title="Rimuovi dai preferiti"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;