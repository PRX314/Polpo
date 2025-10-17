import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import WaveBanner from '../ui/WaveBanner';
import RainbowStripes from '../ui/RainbowStripes';

const Layout = ({ children }) => {
  const { bannerData, showBanner, closeBanner, currentCollectionTheme } = useTheme();

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
      {/* Wave Banner */}
      <WaveBanner
        data={bannerData}
        show={showBanner}
        onClose={closeBanner}
      />

      {/* Rainbow Stripes Top */}
      <RainbowStripes position="top" variant={getStripesVariant()} />

      <Header />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

      {/* Rainbow Stripes Bottom */}
      <RainbowStripes position="bottom" variant={getStripesVariant()} />

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