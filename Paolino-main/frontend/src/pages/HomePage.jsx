import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, Shield, Headphones } from 'lucide-react';
import { productsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { changeCollectionTheme } = useTheme();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 8, sortBy: 'createdAt' });
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Qualità Premium",
      description: "Materiali di alta qualità selezionati con cura"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Spedizione Veloce",
      description: "Consegna rapida in tutta Italia"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Pagamenti Sicuri",
      description: "Transazioni protette con Stripe"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Assistenza",
      description: "Supporto clienti sempre disponibile"
    }
  ];

  const categories = [
    {
      name: "Magliette",
      image: "/api/placeholder/300/300",
      link: "/products?category=magliette",
      description: "Comfort e stile per ogni giorno"
    },
    {
      name: "Felpe",
      image: "/api/placeholder/300/300",
      link: "/products?category=felpe",
      description: "Calde e confortevoli"
    },
    {
      name: "Sciarpe",
      image: "/api/placeholder/300/300",
      link: "/products?category=sciarpe",
      description: "Eleganti e pratiche"
    },
    {
      name: "Accessori",
      image: "/api/placeholder/300/300",
      link: "/products?category=accessori",
      description: "Il tocco finale perfetto"
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative py-20" style={{background: 'linear-gradient(135deg, #48dbfb, #54a0ff)'}}>
        <div className="max-w-[1200px] mx-auto px-[20px]">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>
              Benvenuto da <span className="font-black">Paolino</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-medium">
              Scopri la nostra collezione di magliette, felpe e accessori di qualità.
              Stile e comfort per ogni occasione.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn-primary text-lg px-8 py-4">
                Esplora i Prodotti
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link
                to="/products?category=magliette"
                className="bg-white text-[#48dbfb] px-8 py-4 rounded-[10px] font-medium text-lg uppercase tracking-[0.5px] min-h-[48px] inline-flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] border-2 border-white/20"
              >
                Magliette in Offerta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Tester */}
      <section className="max-w-[1200px] mx-auto px-[20px]">
        <div className="card text-center space-y-6">
          <h2 className="text-2xl font-bold text-[#333333] uppercase tracking-wide">Prova i Temi</h2>
          <p className="text-[#666666]">Clicca su un tema per vedere il banner animato e cambiare lo stile della pagina</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => changeCollectionTheme('romantic')}
              className="px-6 py-3 bg-gradient-to-r from-[#E4002B] to-[#FF6B9D] text-white rounded-[10px] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              ❤️ Tema Romantico
            </button>
            <button
              onClick={() => changeCollectionTheme('energy')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF2AA5] to-[#FFD600] text-white rounded-[10px] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              ⚡ Tema Energia
            </button>
            <button
              onClick={() => changeCollectionTheme('classic')}
              className="px-6 py-3 bg-gradient-to-r from-[#2C3E50] to-[#3498DB] text-white rounded-[10px] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              🎨 Tema Classico
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1200px] mx-auto px-[20px]">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-[#333333] uppercase tracking-wide">Le Nostre Categorie</h2>
          <p className="text-[#666666] text-lg font-medium">Trova quello che stai cercando</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.link}
              className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 group"
            >
              <div className="aspect-square bg-[#f8f9fa] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg text-[#333333] mb-2">{category.name}</h3>
                <p className="text-[#666666] text-sm">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-[20px]">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-[#333333] uppercase tracking-wide">Prodotti in Evidenza</h2>
            <p className="text-[#666666] text-lg font-medium">I nostri prodotti più popolari</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 group"
              >
                <div className="aspect-square bg-[#f8f9fa] overflow-hidden">
                  <img
                    src={product.images?.[0]?.url || '/api/placeholder/300/300'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#333333] truncate mb-2">{product.name}</h3>
                  <p className="text-[#666666] text-sm capitalize mb-3">{product.category}</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] bg-clip-text text-transparent">
                    €{product.basePrice}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/products" className="btn-outline inline-flex items-center gap-2">
              Vedi Tutti i Prodotti
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-[1200px] mx-auto px-[20px]">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-[#333333] uppercase tracking-wide">Perché Scegliere Paolino</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4 bg-white rounded-[16px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1">
                <div className="w-14 h-14 rounded-[10px] flex items-center justify-center mx-auto text-white" style={{background: 'linear-gradient(135deg, #48dbfb, #54a0ff)'}}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg text-[#333333] uppercase tracking-wide">{feature.title}</h3>
                <p className="text-[#666666] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;