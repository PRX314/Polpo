import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { productsAPI, wishlistAPI, API_SERVER_URL } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Prodotto non trovato');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Effettua il login per aggiungere prodotti al carrello');
      navigate('/login');
      return;
    }

    if (!selectedVariant) {
      toast.error('Seleziona una variante del prodotto');
      return;
    }

    if (selectedVariant.stock < quantity) {
      toast.error('Quantità non disponibile');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, selectedVariant._id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getFinalPrice = () => {
    if (!product || !selectedVariant) return 0;
    return product.basePrice + (selectedVariant.priceModifier || 0);
  };

  const getAvailableStock = () => {
    return selectedVariant ? selectedVariant.stock : 0;
  };

  const isInStock = () => {
    return getAvailableStock() > 0;
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Guarda questo prodotto: ${product.name}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiato negli appunti!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback: try clipboard again
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiato negli appunti!');
      } catch (clipboardError) {
        toast.error('Impossibile condividere il prodotto');
      }
    }
  };

  const checkWishlistStatus = async () => {
    if (!isAuthenticated || !product) return;
    
    try {
      const response = await wishlistAPI.check(product._id);
      setIsInWishlist(response.data.data.inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Effettua il login per aggiungere ai preferiti');
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    try {
      const response = await wishlistAPI.toggle(product._id);
      setIsInWishlist(response.data.inWishlist);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento dei preferiti');
    } finally {
      setWishlistLoading(false);
    }
  };

  const nextImage = () => {
    if (!product.images) return;
    setSelectedImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!product.images) return;
    setSelectedImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-primary-200 rounded-lg"></div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-primary-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-primary-200 rounded"></div>
              <div className="h-6 bg-primary-200 rounded w-2/3"></div>
              <div className="h-12 bg-primary-200 rounded"></div>
              <div className="h-10 bg-primary-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Prodotto non trovato
          </h2>
          <p className="text-primary-600 mb-6">
            Il prodotto che stai cercando non esiste o è stato rimosso.
          </p>
          <Link to="/products" className="btn-primary">
            Torna al Catalogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-primary-600 mb-8">
        <Link to="/" className="hover:text-primary-900">Home</Link>
        <ChevronRight size={16} />
        <Link to="/products" className="hover:text-primary-900">Prodotti</Link>
        <ChevronRight size={16} />
        <Link 
          to={`/products?category=${product.category}`} 
          className="hover:text-primary-900 capitalize"
        >
          {product.category}
        </Link>
        <ChevronRight size={16} />
        <span className="text-primary-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-primary-50 rounded-2xl overflow-hidden group">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={`${API_SERVER_URL}${product.images[selectedImageIndex].url}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-400">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto mb-2" />
                  <p>Nessuna immagine disponibile</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    index === selectedImageIndex 
                      ? 'border-primary-600' 
                      : 'border-primary-200 hover:border-primary-400'
                  }`}
                >
                  <img
                    src={`${API_SERVER_URL}${image.url}`}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Price */}
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-3xl font-bold text-primary-800">
                {formatCurrency(getFinalPrice())}
              </span>
              {selectedVariant?.priceModifier > 0 && (
                <span className="text-lg text-primary-500 line-through">
                  {formatCurrency(product.basePrice)}
                </span>
              )}
            </div>
            
            {/* Rating placeholder */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className="text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <span className="text-sm text-primary-600">(24 recensioni)</span>
            </div>

            <p className="text-primary-600 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Variant Selection */}
          <div className="space-y-4">
            {/* Size Selection */}
            <div>
              <h3 className="font-semibold text-primary-900 mb-3">
                Taglia: {selectedVariant?.size}
              </h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(product.variants.map(v => v.size))].map((size) => {
                  const sizeVariants = product.variants.filter(v => v.size === size);
                  const hasStock = sizeVariants.some(v => v.stock > 0);
                  const isSelected = selectedVariant?.size === size;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (hasStock) {
                          const variant = sizeVariants.find(v => v.stock > 0) || sizeVariants[0];
                          setSelectedVariant(variant);
                        }
                      }}
                      disabled={!hasStock}
                      className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : hasStock
                          ? 'border-primary-300 text-primary-700 hover:border-primary-400'
                          : 'border-primary-200 text-primary-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection */}
            {selectedVariant?.size && (
              <div>
                <h3 className="font-semibold text-primary-900 mb-3">
                  Colore: {selectedVariant?.color}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants
                    .filter(v => v.size === selectedVariant.size)
                    .map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={variant.stock === 0}
                        className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                          selectedVariant?._id === variant._id
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : variant.stock > 0
                            ? 'border-primary-300 text-primary-700 hover:border-primary-400'
                            : 'border-primary-200 text-primary-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {variant.color}
                        {variant.stock === 0 && ' (Esaurito)'}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {isInStock() ? (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="font-medium">
                  {getAvailableStock() > 10 
                    ? 'Disponibile' 
                    : `Solo ${getAvailableStock()} rimasti`
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="font-medium">Non disponibile</span>
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Quantità
                </label>
                <div className="flex items-center border border-primary-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-primary-600 hover:text-primary-900 disabled:opacity-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 font-medium text-primary-900 min-w-16 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))}
                    disabled={quantity >= getAvailableStock()}
                    className="p-2 text-primary-600 hover:text-primary-900 disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock() || addingToCart}
                className={`flex-1 btn-primary py-3 flex items-center justify-center space-x-2 ${
                  !isInStock() || addingToCart ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ShoppingCart size={20} />
                <span>
                  {addingToCart ? 'Aggiunta...' : 'Aggiungi al Carrello'}
                </span>
              </button>
              
              <button 
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`p-3 border rounded-lg transition-colors ${
                  isInWishlist 
                    ? 'border-red-500 bg-red-50 text-red-600' 
                    : 'btn-outline'
                } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isInWishlist ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <Heart 
                  size={20} 
                  className={isInWishlist ? 'fill-current' : ''} 
                />
              </button>
              
              <button 
                onClick={handleShare}
                className="btn-outline p-3"
                title="Condividi prodotto"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Product Features */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-primary-200">
            <div className="text-center">
              <Truck className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-900">Spedizione Gratuita</p>
              <p className="text-xs text-primary-600">Ordini sopra €50</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-900">Garanzia</p>
              <p className="text-xs text-primary-600">24 mesi</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-900">Resi Facili</p>
              <p className="text-xs text-primary-600">30 giorni</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16 border-t border-primary-200 pt-16">
        <div className="flex border-b border-primary-200 mb-8">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary-900 border-b-2 border-primary-600'
                  : 'text-primary-600 hover:text-primary-900'
              }`}
            >
              {tab === 'description' && 'Descrizione'}
              {tab === 'specifications' && 'Specifiche'}
              {tab === 'reviews' && 'Recensioni'}
            </button>
          ))}
        </div>

        <div className="prose max-w-none">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary-900">Descrizione Prodotto</h3>
              <p className="text-primary-700 leading-relaxed">
                {product.description}
              </p>
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-primary-900 mb-2">Caratteristiche:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary-900">Specifiche Tecniche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary-900 mb-3">Generale</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-primary-600">Categoria:</dt>
                      <dd className="font-medium capitalize">{product.category}</dd>
                    </div>
                    {product.weight && (
                      <div className="flex justify-between">
                        <dt className="text-primary-600">Peso:</dt>
                        <dd className="font-medium">{product.weight}g</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary-900 mb-3">Varianti</h4>
                  <div className="space-y-2">
                    <p className="text-primary-600">
                      Taglie disponibili: {[...new Set(product.variants.map(v => v.size))].join(', ')}
                    </p>
                    <p className="text-primary-600">
                      Colori disponibili: {[...new Set(product.variants.map(v => v.color))].join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-primary-900">Recensioni Clienti</h3>
              <div className="text-center py-8 text-primary-500">
                Sistema recensioni in arrivo...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;