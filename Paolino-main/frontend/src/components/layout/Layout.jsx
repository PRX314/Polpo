import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import WaveBanner from '../ui/WaveBanner';
import RainbowStripes from '../ui/RainbowStripes';

const Layout = ({ children }) => {
  const location = useLocation();
  const { bannerData, showBanner, closeBanner, currentCollectionTheme } = useTheme();

  // Hide layout elements for ProductShowcase page (minimal UI)
  const isProductShowcase = location.pathname === '/';

  // Hide layout elements for Admin Panel (has its own layout)
  const isAdminPanel = location.pathname.startsWith('/admin');

  // Determina la variante delle strisce arcobaleno in base al tema corrente
  const getStripesVariant = () => {
    switch (currentCollectionTheme.name) {
      case 'romantic':
        return 'romantic';
      case 'energy':
        return 'energy';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Wave Banner - Only show on non-showcase and non-admin pages */}
      {!isProductShowcase && !isAdminPanel && (
        <WaveBanner
          data={bannerData}
          show={showBanner}
          onClose={closeBanner}
        />
      )}

      {/* Rainbow Stripes Top - Only show on non-showcase and non-admin pages */}
      {!isProductShowcase && !isAdminPanel && (
        <RainbowStripes position="top" variant={getStripesVariant()} />
      )}

      {/* Header - Only show on non-showcase and non-admin pages */}
      {!isProductShowcase && !isAdminPanel && <Header />}

      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Only show on non-showcase and non-admin pages */}
      {!isProductShowcase && !isAdminPanel && <Footer />}

      {/* Rainbow Stripes Bottom - Only show on non-showcase and non-admin pages */}
      {!isProductShowcase && !isAdminPanel && (
        <RainbowStripes position="bottom" variant={getStripesVariant()} />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#202124',
            border: '1px solid #dadce0',
          },
          success: {
            iconTheme: {
              primary: '#5f6368',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ea4335',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;