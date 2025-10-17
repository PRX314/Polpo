import { useEffect, useState } from 'react';
import './WaveBanner.css';

const WaveBanner = ({ data, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Banner visibile per 4 secondi

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div className={`wave-banner ${show ? 'wave-banner-show' : ''} ${data?.theme || ''}`}>
      <div className="wave-banner-content">
        <div className="wave-banner-icon">{data?.icon || '🎨'}</div>
        <div className="wave-banner-text">
          <h3 className="wave-banner-title">{data?.title || 'Benvenuto'}</h3>
          <p className="wave-banner-subtitle">{data?.subtitle || 'Esplora la collezione'}</p>
        </div>
      </div>
      <div className="wave-banner-wave"></div>
    </div>
  );
};

export default WaveBanner;
