import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ChevronDown } from 'lucide-react';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import NavigationMenu from '../components/navigation/NavigationMenu';
import CollectionBanner from '../components/CollectionBanner';
import ThemedProductCard from '../components/products/ThemedProductCard';
import './ProductShowcasePage.css';

const ProductShowcasePage = () => {
  const { currentDetailedTheme, changeDetailedTheme, availableDetailedThemes } = useTheme();

  // Collections data - ora usa i temi dal ThemeContext
  const collections = [
    {
      id: 'fijo-de-n-amore',
      slug: 'fijo-de-n-amore',
      name: "Fijo de'n Amore",
      subtitle: "AMORE • PASSIONE • ELEGANZA • ROMANTICISMO",
      icon: '❤️'
    },
    {
      id: 'g-power',
      slug: 'g-power',
      name: "G.Power",
      subtitle: "POWER • ENERGIA • FORZA • URBAN STREET",
      icon: '⚡'
    }
  ];

  const [selectedCollection, setSelectedCollection] = useState(collections[0]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  const { addToCart, cart } = useCart() || { cart: { items: [] }, addToCart: () => {} };

  // Inizializza tema al primo carico
  useEffect(() => {
    // Sincronizza selectedCollection con currentDetailedTheme
    const currentCollection = collections.find(c => c.slug === currentDetailedTheme.slug);
    if (currentCollection) {
      setSelectedCollection(currentCollection);
    }

    // Mostra banner al primo carico (solo una volta per sessione)
    const hasSeenInitialBanner = sessionStorage.getItem('initial-banner-shown');
    if (!hasSeenInitialBanner) {
      // Forza il banner anche se è lo stesso tema
      changeDetailedTheme(currentDetailedTheme.slug, true);
      sessionStorage.setItem('initial-banner-shown', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al mount iniziale

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ category: 'magliette', limit: 1 });
      const productsList = response.data.products;
      setProducts(productsList);

      if (productsList.length > 0) {
        setSelectedProduct(productsList[0]);
        // Set default color and size
        if (productsList[0].variants?.length > 0) {
          const firstVariant = productsList[0].variants[0];
          setSelectedColor(firstVariant.color || '');
          setSelectedSize(firstVariant.size || '');
        }
      } else {
        setError('Nessun prodotto disponibile al momento');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Impossibile connettersi al server. Assicurati che il backend sia in esecuzione.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionChange = (e) => {
    const collection = collections.find(c => c.id === e.target.value);
    setSelectedCollection(collection);

    // Cambia tema con banner animato
    changeDetailedTheme(collection.slug);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct || !selectedColor || !selectedSize) {
      alert('Seleziona colore e taglia');
      return;
    }

    const variant = selectedProduct.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );

    if (!variant) {
      alert('Variante non disponibile');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedProduct._id, variant._id, 1);
      alert('Prodotto aggiunto al carrello!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Errore nell\'aggiunta al carrello');
    } finally {
      setAddingToCart(false);
    }
  };

  const availableColors = selectedProduct?.variants
    ? [...new Set(selectedProduct.variants.map(v => v.color))]
    : [];

  const availableSizes = selectedProduct?.variants
    ? [...new Set(selectedProduct.variants
        .filter(v => v.color === selectedColor)
        .map(v => v.size))]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E4002B] mx-auto mb-4"></div>
          <p className="text-[#666666] font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-[#333333] mb-4">Ops! Qualcosa è andato storto</h2>
          <p className="text-[#666666] mb-6 leading-relaxed">{error}</p>
          <div className="space-y-4">
            <button
              onClick={fetchProducts}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#E4002B] to-[#FF6B9D] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              🔄 Riprova
            </button>
            <div className="text-sm text-[#999999] space-y-2">
              <p className="font-medium">Suggerimenti:</p>
              <ul className="text-left space-y-1 list-disc list-inside">
                <li>Verifica che il backend sia in esecuzione su porta 5031</li>
                <li>Controlla la connessione internet</li>
                <li>Ricarica la pagina</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentDetailedTheme.colors.background.main }}>
      {/* Navigation Menu - Top Left */}
      <NavigationMenu />

      {/* Collection Banner - Animato quando si cambia collezione */}
      <CollectionBanner />

      {/* Banner Trigger Button - Piccolo bottone fisso */}
      <button
        onClick={() => changeDetailedTheme(currentDetailedTheme.slug, true)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
        style={{
          background: currentDetailedTheme.gradients.primary,
          color: 'white'
        }}
        title="Mostra banner collezione"
      >
        <span className="text-xl animate-pulse">{selectedCollection.icon}</span>
      </button>

      {/* Collection Header */}
      <section
        className="py-6 text-center relative overflow-hidden"
        style={{ background: currentDetailedTheme.gradients.hero }}
      >
        <div className="max-w-[1200px] mx-auto px-[20px] relative z-10">
          {/* Collection Title */}
          <h1
            className="text-xl md:text-2xl font-black mb-2 tracking-wide"
            style={{
              fontFamily: currentDetailedTheme.fonts.heading,
              color: currentDetailedTheme.colors.text.light
            }}
          >
            {selectedCollection.name}
          </h1>

          {/* Collection Subtitle */}
          <p
            className="text-sm md:text-base font-medium tracking-widest uppercase"
            style={{
              fontFamily: currentDetailedTheme.fonts.body,
              color: currentDetailedTheme.colors.text.light,
              opacity: 0.9
            }}
          >
            {selectedCollection.subtitle}
          </p>

          {/* Badge if exists */}
          {selectedCollection.badge && (
            <div className="mt-4 inline-block">
              <span
                className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border"
                style={{
                  backgroundColor: `${currentDetailedTheme.colors.background.overlay}`,
                  color: currentDetailedTheme.colors.text.light,
                  borderColor: currentDetailedTheme.colors.border
                }}
              >
                ✨ {selectedCollection.badge}
              </span>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-white rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* Collection Selector */}
      <section className="bg-white py-6 border-b-2 border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[800px] mx-auto px-[20px]">
          <label className="block text-sm font-bold text-[#333333] mb-3 uppercase tracking-wider">
            Scegli la Collezione:
          </label>
          <select
            value={selectedCollection.id}
            onChange={handleCollectionChange}
            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-[#E4002B] focus:outline-none transition-all font-medium appearance-none bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5rem',
              paddingRight: '3rem'
            }}
          >
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>
                {collection.icon} {collection.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Product Image Section */}
      {selectedProduct && (
        <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-[600px] mx-auto px-[20px]">
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-8">
                <img
                  src={selectedProduct.images?.[0]?.url || '/api/placeholder/600/600'}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="text-center mt-6 space-y-2">
              <h2 className="text-2xl font-bold text-[#333333]">
                {selectedProduct.name}
              </h2>
              <p className="text-[#666666] leading-relaxed">
                {selectedProduct.description}
              </p>
              <p className="text-3xl font-black" style={{ color: currentDetailedTheme.colors.primary }}>
                €{selectedProduct.basePrice}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Product Options & Actions Section */}
      {selectedProduct && (
        <section className="py-12 bg-white">
          <div className="max-w-[600px] mx-auto px-[20px] space-y-6">

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-3 uppercase tracking-wider">
                  Colore:
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setSelectedSize(''); // Reset size when color changes
                  }}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-[#E4002B] focus:outline-none transition-all font-medium capitalize"
                >
                  <option value="">Seleziona colore</option>
                  {availableColors.map(color => (
                    <option key={color} value={color} className="capitalize">
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Selector */}
            {selectedColor && availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-3 uppercase tracking-wider">
                  Taglia:
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-[#E4002B] focus:outline-none transition-all font-medium uppercase"
                >
                  <option value="">Seleziona taglia</option>
                  {availableSizes.map(size => (
                    <option key={size} value={size} className="uppercase">
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {/* Wishlist Button */}
              <button
                onClick={() => alert('Wishlist feature coming soon!')}
                className="w-full py-4 rounded-2xl font-bold text-white uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ background: currentDetailedTheme.gradients.primary }}
              >
                <Heart className="w-5 h-5" />
                Wishlist
              </button>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedColor || !selectedSize || addingToCart}
                className="w-full py-4 rounded-2xl font-bold text-white uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: currentDetailedTheme.gradients.primary }}
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? 'Aggiungendo...' : 'Aggiungi al carrello'}
              </button>
            </div>

            {/* Validation Message */}
            {(!selectedColor || !selectedSize) && (
              <p className="text-sm text-gray-500 text-center italic">
                Seleziona colore e taglia per aggiungere al carrello
              </p>
            )}
          </div>
        </section>
      )}

      {/* Mini Cart Section */}
      {cart && cart.items && cart.items.length > 0 && (
        <section className="py-12 bg-gray-50 border-t-2 border-gray-100">
          <div className="max-w-[600px] mx-auto px-[20px]">
            <h3 className="text-2xl font-bold text-[#333333] mb-6 uppercase tracking-wide">
              Carrello
            </h3>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
              <p className="text-center text-[#666666] mb-4">
                {cart?.items?.length || 0} {cart?.items?.length === 1 ? 'prodotto' : 'prodotti'} nel carrello
              </p>

              <Link
                to="/cart"
                className="block w-full py-4 text-center rounded-xl font-bold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ background: currentDetailedTheme.gradients.primary }}
              >
                Vai al carrello
              </Link>
            </div>

            {/* Wishlist Toggle */}
            <button
              onClick={() => setShowWishlist(!showWishlist)}
              className="w-full py-3 bg-white rounded-xl font-semibold text-[#666666] border-2 border-gray-200 uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 hover:border-gray-300"
            >
              <Heart className="w-4 h-4" />
              {showWishlist ? 'Nascondi' : 'Mostra'} Wishlist
            </button>

            {showWishlist && (
              <div className="mt-4 p-6 bg-white rounded-2xl shadow-md text-center text-[#666666]">
                La tua wishlist è vuota
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom Spacing */}
      <div className="h-12"></div>
    </div>
  );
};

export default ProductShowcasePage;
