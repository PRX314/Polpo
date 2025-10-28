import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { getProductImageUrl } from '../../utils/imageHelper';
import { useState } from 'react';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedVariant) return;
    
    await addToCart(product._id, selectedVariant._id, 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const hasStock = selectedVariant && selectedVariant.stock > 0;
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-48 h-48 bg-[#f8f9fa] overflow-hidden rounded-t-[16px] md:rounded-l-[16px] md:rounded-tr-none">
            <img
              src={getProductImageUrl(product, 0) || '/api/placeholder/300/300'}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-[1.02] transition-all duration-300"
            />
          </div>
          
          <div className="flex-1 p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <Link to={`/products/${product._id}`}>
                  <h3 className="text-lg font-semibold text-[#333333] hover:text-[#48dbfb] transition-colors duration-300">
                    {product.name}
                  </h3>
                </Link>

                <p className="text-[#666666] text-sm capitalize font-medium tracking-wide">
                  {product.category}
                </p>

                <p className="text-[#666666] text-sm line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                {/* Variants */}
                <div className="flex flex-wrap gap-2">
                  {product.variants?.slice(0, 3).map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border-2 transition-all duration-300 ${
                        selectedVariant?._id === variant._id
                          ? 'bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] text-white border-[#48dbfb] shadow-md'
                          : 'bg-white text-[#666666] border-[#e9ecef] hover:border-[#48dbfb] hover:text-[#48dbfb]'
                      }`}
                    >
                      {variant.size} - {variant.color}
                    </button>
                  ))}
                  {product.variants?.length > 3 && (
                    <span className="text-xs text-[#999999] px-2 py-1">
                      +{product.variants.length - 3} altre
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <span className={`font-medium px-3 py-1 rounded-[6px] ${totalStock > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {totalStock > 0 ? `${totalStock} disponibili` : 'Esaurito'}
                  </span>
                </div>
              </div>

              <div className="text-right ml-6 flex flex-col items-end gap-4">
                <p className="text-2xl font-bold bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] bg-clip-text text-transparent">
                  {formatPrice(product.basePrice + (selectedVariant?.priceModifier || 0))}
                </p>

                <div className="flex gap-2">
                  <Link
                    to={`/products/${product._id}`}
                    className="btn-outline p-2.5"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleQuickAdd}
                    disabled={!hasStock}
                    className={`p-2.5 rounded-[10px] transition-all duration-300 ${hasStock ? 'bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' : 'bg-[#e9ecef] text-[#999999] cursor-not-allowed'}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-[#e9ecef] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 group">
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-square bg-[#f8f9fa] overflow-hidden relative">
          <img
            src={getProductImageUrl(product, 0) || '/api/placeholder/300/300'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-300"
          />

          {/* Stock badge */}
          {totalStock === 0 && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#d63031] to-[#e17055] text-white px-3 py-1.5 text-xs font-medium rounded-[10px] shadow-lg">
              Esaurito
            </div>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={handleQuickAdd}
                disabled={!hasStock}
                className={`p-3 rounded-[10px] transition-all duration-300 ${hasStock ? 'bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] text-white shadow-lg hover:shadow-xl hover:-translate-y-1' : 'bg-[#e9ecef] text-[#999999] cursor-not-allowed'}`}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5 space-y-3">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-[#333333] hover:text-[#48dbfb] truncate transition-colors duration-300 text-base">
            {product.name}
          </h3>
        </Link>

        <p className="text-[#666666] text-sm capitalize font-medium tracking-wide">{product.category}</p>

        {/* Variant selector */}
        <div className="flex flex-wrap gap-2">
          {product.variants?.slice(0, 3).map((variant) => (
            <button
              key={variant._id}
              onClick={() => setSelectedVariant(variant)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border-2 transition-all duration-300 ${
                selectedVariant?._id === variant._id
                  ? 'bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] text-white border-[#48dbfb] shadow-md'
                  : 'bg-white text-[#666666] border-[#e9ecef] hover:border-[#48dbfb] hover:text-[#48dbfb]'
              }`}
            >
              {variant.size}
            </button>
          ))}
          {product.variants?.length > 3 && (
            <span className="text-xs text-[#999999] px-2 py-1">+{product.variants.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xl font-bold bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] bg-clip-text text-transparent">
            {formatPrice(product.basePrice + (selectedVariant?.priceModifier || 0))}
          </p>

          <span className={`text-xs font-medium px-2 py-1 rounded-[6px] ${totalStock > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            {totalStock > 0 ? `${totalStock} pz` : 'Esaurito'}
          </span>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={!hasStock}
          className={`w-full btn ${hasStock ? 'btn-primary' : 'bg-[#e9ecef] text-[#999999] cursor-not-allowed hover:transform-none hover:shadow-[0_2px_10px_rgba(0,0,0,0.1)]'}`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Aggiungi al carrello
        </button>
      </div>
    </div>
  );
};

export default ProductCard;