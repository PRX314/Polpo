import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Listen to URL changes and update filters
  useEffect(() => {
    const categoryFromURL = searchParams.get('category') || 'all';
    const searchFromURL = searchParams.get('search') || '';
    
    setFilters(prev => ({
      ...prev,
      category: categoryFromURL,
      search: searchFromURL
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...filters
      };
      
      if (filters.category === 'all') {
        delete params.category;
      }

      const response = await productsAPI.getAll(params);
      setProducts(response.data.products);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories([{ name: 'all', label: 'Tutti' }, ...response.data.categories.map(cat => ({ name: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateURL = () => {
    const newParams = new URLSearchParams();
    if (filters.category !== 'all') newParams.set('category', filters.category);
    if (filters.search) newParams.set('search', filters.search);
    setSearchParams(newParams);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Update URL when filters change manually
    const newParams = new URLSearchParams();
    const updatedFilters = { ...filters, [key]: value };
    if (updatedFilters.category !== 'all') newParams.set('category', updatedFilters.category);
    if (updatedFilters.search) newParams.set('search', updatedFilters.search);
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    fetchProducts(page);
  };

  if (loading && products.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-[20px] py-[40px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] animate-pulse">
              <div className="aspect-square bg-[#f8f9fa]"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#e9ecef] rounded-[6px]"></div>
                <div className="h-4 bg-[#e9ecef] rounded-[6px] w-2/3"></div>
                <div className="h-5 bg-[#e9ecef] rounded-[6px] w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-[20px] py-[40px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#333333] mb-2 uppercase tracking-wide">
          {filters.category === 'all' ? 'Tutti i Prodotti' : filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
        </h1>
        <p className="text-[#666666] text-lg font-medium">
          {pagination.total} {pagination.total === 1 ? 'prodotto trovato' : 'prodotti trovati'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${
            filters.search ? 'opacity-0' : 'opacity-100'
          }`}>
            <Search className="text-primary-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input pl-10"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input w-auto min-w-32"
            >
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="input w-auto min-w-40"
            >
              <option value="createdAt-desc">Più recenti</option>
              <option value="createdAt-asc">Meno recenti</option>
              <option value="basePrice-asc">Prezzo crescente</option>
              <option value="basePrice-desc">Prezzo decrescente</option>
              <option value="name-asc">Nome A-Z</option>
              <option value="name-desc">Nome Z-A</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-primary-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-800' : 'text-primary-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-800' : 'text-primary-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-primary-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-primary-200 rounded"></div>
                <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                <div className="h-4 bg-primary-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl text-primary-300 mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-primary-900 mb-2">Nessun prodotto trovato</h3>
          <p className="text-primary-600 mb-4">
            Prova a modificare i filtri di ricerca o esplora le nostre categorie.
          </p>
          <Link to="/products" className="btn-primary">
            Vedi Tutti i Prodotti
          </Link>
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-1'
        }`}>
          {products.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <div className="flex space-x-2">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === pagination.currentPage
                      ? 'bg-primary-800 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;