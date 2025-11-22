import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  X
} from 'lucide-react';
import { adminAPI, productsAPI } from '../../services/api';
import { getProductImageUrl } from '../../utils/imageHelper';
import toast from 'react-hot-toast';

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters, pagination.currentPage]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...filters
      };
      
      if (filters.category === 'all') {
        delete params.category;
      }

      const response = await adminAPI.getProducts(params);
      setProducts(response.data.products);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Errore nel caricamento prodotti');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories([
        { name: 'all', label: 'Tutte' },
        ...response.data.categories.map(cat => ({
          name: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }))
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    fetchProducts(page);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      return;
    }

    try {
      await productsAPI.delete(productId);
      toast.success('Prodotto eliminato con successo');
      fetchProducts(pagination.currentPage);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Errore nell\'eliminazione del prodotto');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getTotalStock = (variants) => {
    return variants.reduce((total, variant) => total + variant.stock, 0);
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-primary-200 rounded animate-pulse"></div>
        <div className="card p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-primary-200 rounded"></div>
                  <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Gestione Prodotti</h1>
          <p className="text-primary-600 mt-1">
            {pagination.total} {pagination.total === 1 ? 'prodotto' : 'prodotti'} totali
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuovo Prodotto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca prodotti..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input w-auto min-w-32"
          >
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Prodotto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Prezzo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-primary-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg overflow-hidden flex-shrink-0">
                        {getProductImageUrl(product, 0) ? (
                          <img
                            src={getProductImageUrl(product, 0)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-400">
                            <Upload size={16} />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-primary-900">{product.name}</p>
                        <p className="text-sm text-primary-500 truncate max-w-xs">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                    {formatCurrency(product.basePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      getTotalStock(product.variants) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getTotalStock(product.variants)} pz
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Attivo' : 'Disattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/products/${product._id}`, '_blank')}
                        className="text-primary-600 hover:text-primary-900"
                        title="Visualizza"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifica"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl text-primary-300 mb-4">📦</div>
            <h3 className="text-lg font-medium text-primary-900 mb-2">Nessun prodotto trovato</h3>
            <p className="text-primary-500 mb-4">
              Non ci sono prodotti che corrispondono ai filtri selezionati.
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="btn-primary"
            >
              Crea il primo prodotto
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
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

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchProducts(pagination.currentPage);
          }}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'magliette',
    collectionType: product?.collectionType || 'standard',
    basePrice: product?.basePrice || '',
    variants: product?.variants || [
      { size: 'M', color: '', colorCode: '', stock: 0, sku: '', priceModifier: 0, printPosition: '' }
    ],
    tags: product?.tags?.join(', ') || '',
    weight: product?.weight || '',
    isActive: product?.isActive !== false
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const categories = ['magliette', 'felpe', 'sciarpe', 'accessori'];
  const collections = [
    { value: 'standard', label: 'Standard (Taglia + Colore)' },
    { value: 'fijo', label: 'Fijo (Taglia + Posizione Stampa)' },
    { value: 'gpower', label: 'G-Power (Taglia + Colore)' }
  ];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'];
  const printPositions = ['centro', 'sinistra', 'destra', 'dietro', 'manica-sx', 'manica-dx'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    
    // Auto-generate SKU if product name and variant details are available
    if (field === 'size' || field === 'color') {
      const namePrefix = formData.name.substring(0, 3).toUpperCase();
      const colorPrefix = newVariants[index].color.substring(0, 3).toUpperCase();
      const size = newVariants[index].size;
      if (namePrefix && colorPrefix && size) {
        newVariants[index].sku = `${namePrefix}-${colorPrefix}-${size}`;
      }
    }
    
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    const newVariant = {
      size: 'M',
      stock: 0,
      sku: '',
      priceModifier: 0
    };

    // Add collection-specific fields
    if (formData.collectionType === 'fijo') {
      newVariant.printPosition = 'centro';
    } else {
      newVariant.color = '';
      newVariant.colorCode = '';
    }

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('collectionType', formData.collectionType);
      submitData.append('basePrice', parseFloat(formData.basePrice));
      submitData.append('variants', JSON.stringify(formData.variants));
      submitData.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
      submitData.append('weight', formData.weight || 0);
      submitData.append('isActive', formData.isActive);

      selectedFiles.forEach(file => {
        submitData.append('images', file);
      });

      if (product) {
        await productsAPI.update(product._id, submitData);
        toast.success('Prodotto aggiornato con successo');
      } else {
        await productsAPI.create(submitData);
        toast.success('Prodotto creato con successo');
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Errore nel salvataggio del prodotto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h2 className="text-xl font-bold text-primary-900">
            {product ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          </h2>
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Nome Prodotto *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Categoria *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collection Type */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Tipo Collezione *
            </label>
            <select
              required
              value={formData.collectionType}
              onChange={(e) => handleInputChange('collectionType', e.target.value)}
              className="input"
            >
              {collections.map(col => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-primary-500 mt-1">
              {formData.collectionType === 'fijo' && '🧣 Fijo: Solo posizione stampa (nessuna selezione colore)'}
              {formData.collectionType === 'gpower' && '⚡ G-Power: Taglia e colore standard'}
              {formData.collectionType === 'standard' && '👕 Standard: Taglia e colore standard'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Descrizione *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Prezzo Base (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Peso (g)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-primary-700">Prodotto attivo</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary-700">
                Varianti del Prodotto *
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="btn-secondary text-sm"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi Variante
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-primary-900">Variante {index + 1}</h4>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Taglia - Always visible */}
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">
                        Taglia *
                      </label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className="input text-sm"
                      >
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    {/* Colore - Only for 'standard' and 'gpower' */}
                    {formData.collectionType !== 'fijo' && (
                      <div>
                        <label className="block text-xs font-medium text-primary-600 mb-1">
                          Colore
                        </label>
                        <input
                          type="text"
                          value={variant.color || ''}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          className="input text-sm"
                          placeholder="es. Rosso"
                        />
                      </div>
                    )}

                    {/* Posizione Stampa - Only for 'fijo' */}
                    {formData.collectionType === 'fijo' && (
                      <div>
                        <label className="block text-xs font-medium text-primary-600 mb-1">
                          Posizione Stampa *
                        </label>
                        <select
                          value={variant.printPosition || 'centro'}
                          onChange={(e) => handleVariantChange(index, 'printPosition', e.target.value)}
                          className="input text-sm"
                        >
                          {printPositions.map(pos => (
                            <option key={pos} value={pos}>
                              {pos.charAt(0).toUpperCase() + pos.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Stock - Always visible */}
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                        className="input text-sm"
                      />
                    </div>

                    {/* SKU - Always visible */}
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="input text-sm"
                        placeholder="AUTO"
                      />
                    </div>

                    {/* Prezzo Extra - Always visible */}
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">
                        Prezzo Extra (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.priceModifier}
                        onChange={(e) => handleVariantChange(index, 'priceModifier', parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Immagini Prodotto
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles([...e.target.files])}
              className="input"
            />
            <p className="text-xs text-primary-500 mt-1">
              Seleziona fino a 5 immagini (JPEG, PNG, WebP)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Tags (separati da virgola)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="input"
              placeholder="es. casual, cotone, estate"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-primary-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvataggio...
                </div>
              ) : (
                product ? 'Aggiorna Prodotto' : 'Crea Prodotto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductsAdmin;