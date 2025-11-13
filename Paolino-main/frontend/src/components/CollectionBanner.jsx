import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './CollectionBanner.css';

/**
 * CollectionBanner - Banner animato che appare quando si cambia collezione
 * Mostra keyword/frasi rappresentative del tema della collezione
 */
const CollectionBanner = () => {
  const { showBanner, bannerData, closeBanner } = useTheme();

  // Auto-chiudi il banner dopo la durata specificata
  useEffect(() => {
    if (showBanner && bannerData?.duration) {
      const timer = setTimeout(() => {
        closeBanner();
      }, bannerData.duration);

      return () => clearTimeout(timer);
    }
  }, [showBanner, bannerData, closeBanner]);

  // Non renderizzare nulla se il banner non deve essere mostrato
  if (!showBanner || !bannerData) {
    return null;
  }

  // Estrai i dati del banner
  const {
    title = '',
    subtitle = '',
    icon = '',
    keyword = '',
    collectionName = '',
    backgroundColor = '#000',
    textColor = '#fff',
    animation = 'fade-slide-up',
    textShadow = 'none',
  } = bannerData;

  return (
    <div
      className={`collection-banner ${animation} ${showBanner ? 'show' : ''}`}
      style={{
        '--banner-bg': backgroundColor,
        '--banner-text': textColor,
        '--banner-shadow': textShadow,
      }}
      onClick={closeBanner}
      role="dialog"
      aria-label={`Banner collezione ${title || collectionName}`}
    >
      <div className="collection-banner__content">
        {icon && <div className="collection-banner__icon">{icon}</div>}
        <div className="collection-banner__text">
          <h1 className="collection-banner__title">{title || collectionName}</h1>
          {subtitle && <p className="collection-banner__subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="collection-banner__wave"></div>
    </div>
  );
};

export default CollectionBanner;
