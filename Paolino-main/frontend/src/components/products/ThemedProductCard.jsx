import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getProductImageUrl } from '../../utils/imageHelper';
import { useState } from 'react';
import './ThemedProductCard.css';

/**
 * ThemedProductCard - Versione tematizzata di ProductCard
 * Usa CSS variables dal ThemeContext per styling dinamico
 */
const ThemedProductCard = ({ product, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const { currentDetailedTheme } = useTheme();
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

  // List view
  if (viewMode === 'list') {
    return (
      <div className="themed-product-card themed-product-card--list">
        <div className="themed-product-card__wrapper">
          <div className="themed-product-card__image-container themed-product-card__image-container--list">
            <img
              src={getProductImageUrl(product, 0) || '/api/placeholder/300/300'}
              alt={product.name}
              className="themed-product-card__image"
            />
          </div>

          <div className="themed-product-card__content themed-product-card__content--list">
            <div className="themed-product-card__info">
              <div className="themed-product-card__details">
                <Link to={`/products/${product._id}`}>
                  <h3 className="themed-product-card__title">
                    {product.name}
                  </h3>
                </Link>

                <p className="themed-product-card__category">
                  {product.category}
                </p>

                <p className="themed-product-card__description">
                  {product.description}
                </p>

                {/* Variants */}
                <div className="themed-product-card__variants">
                  {product.variants?.slice(0, 3).map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`themed-product-card__variant-btn ${
                        selectedVariant?._id === variant._id ? 'active' : ''
                      }`}
                    >
                      {variant.size} - {variant.color}
                    </button>
                  ))}
                  {product.variants?.length > 3 && (
                    <span className="themed-product-card__variant-more">
                      +{product.variants.length - 3} altre
                    </span>
                  )}
                </div>

                <div className="themed-product-card__stock-info">
                  <span className={`themed-product-card__stock-badge ${totalStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {totalStock > 0 ? `${totalStock} disponibili` : 'Esaurito'}
                  </span>
                </div>
              </div>

              <div className="themed-product-card__actions themed-product-card__actions--list">
                <p className="themed-product-card__price">
                  {formatPrice(product.basePrice + (selectedVariant?.priceModifier || 0))}
                </p>

                <div className="themed-product-card__buttons">
                  <Link
                    to={`/products/${product._id}`}
                    className="themed-product-card__btn themed-product-card__btn--outline"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleQuickAdd}
                    disabled={!hasStock}
                    className={`themed-product-card__btn themed-product-card__btn--primary ${!hasStock ? 'disabled' : ''}`}
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
    <div className="themed-product-card themed-product-card--grid">
      <Link to={`/products/${product._id}`} className="themed-product-card__link">
        <div className="themed-product-card__image-container">
          <img
            src={getProductImageUrl(product, 0) || '/api/placeholder/300/300'}
            alt={product.name}
            className="themed-product-card__image"
          />

          {/* Stock badge */}
          {totalStock === 0 && (
            <div className="themed-product-card__badge themed-product-card__badge--out-of-stock">
              Esaurito
            </div>
          )}

          {/* Quick actions overlay */}
          <div className="themed-product-card__overlay">
            <div className="themed-product-card__quick-actions">
              <button
                onClick={handleQuickAdd}
                disabled={!hasStock}
                className={`themed-product-card__btn themed-product-card__btn--primary ${!hasStock ? 'disabled' : ''}`}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <div className="themed-product-card__content">
        <Link to={`/products/${product._id}`}>
          <h3 className="themed-product-card__title">
            {product.name}
          </h3>
        </Link>

        <p className="themed-product-card__category">{product.category}</p>

        {/* Variant selector */}
        <div className="themed-product-card__variants">
          {product.variants?.slice(0, 3).map((variant) => (
            <button
              key={variant._id}
              onClick={() => setSelectedVariant(variant)}
              className={`themed-product-card__variant-btn ${
                selectedVariant?._id === variant._id ? 'active' : ''
              }`}
            >
              {variant.size}
            </button>
          ))}
          {product.variants?.length > 3 && (
            <span className="themed-product-card__variant-more">
              +{product.variants.length - 3}
            </span>
          )}
        </div>

        <div className="themed-product-card__footer">
          <p className="themed-product-card__price">
            {formatPrice(product.basePrice + (selectedVariant?.priceModifier || 0))}
          </p>

          <span className={`themed-product-card__stock-badge ${totalStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {totalStock > 0 ? `${totalStock} pz` : 'Esaurito'}
          </span>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={!hasStock}
          className={`themed-product-card__btn themed-product-card__btn--add-to-cart ${!hasStock ? 'disabled' : ''}`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Aggiungi al carrello
        </button>
      </div>
    </div>
  );
};

export default ThemedProductCard;
