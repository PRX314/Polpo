import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Header themes (ciclici con click normale)
  const headerThemes = [
    { name: 'light', icon: '🌙', label: 'Dark', displayName: 'Light' },
    { name: 'dark', icon: '🌈', label: 'Neon', displayName: 'Dark' },
    { name: 'neon', icon: '🌅', label: 'Sunset', displayName: 'Neon' },
    { name: 'sunset', icon: '🌊', label: 'Ocean', displayName: 'Sunset' },
    { name: 'ocean', icon: '☀️', label: 'Light', displayName: 'Ocean' }
  ];

  // Collection themes (quando cambi collezione)
  const collectionThemes = {
    romantic: {
      name: 'romantic',
      displayName: 'Romantico',
      colors: {
        primary: '#E4002B',
        secondary: '#FF6B9D',
        accent: '#FF1744'
      },
      font: "'Poppins', sans-serif",
      gradient: 'linear-gradient(135deg, #E4002B, #FF1744)'
    },
    energy: {
      name: 'energy',
      displayName: 'Energia',
      colors: {
        primary: '#FF2AA5',
        secondary: '#FFD600',
        accent: '#FF3B30'
      },
      font: "'Montserrat', sans-serif",
      gradient: 'linear-gradient(45deg, #FF2AA5, #FFD600)'
    },
    classic: {
      name: 'classic',
      displayName: 'Classico',
      colors: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#3498DB'
      },
      font: "'Inter', sans-serif",
      gradient: 'linear-gradient(135deg, #2C3E50, #3498DB)'
    }
  };

  // States
  const [currentHeaderTheme, setCurrentHeaderTheme] = useState(() => {
    const saved = localStorage.getItem('header-theme');
    return headerThemes.find(t => t.name === saved) || headerThemes[0];
  });

  const [globalDarkMode, setGlobalDarkMode] = useState(() => {
    const saved = localStorage.getItem('global-theme');
    return saved === 'dark';
  });

  const [currentCollectionTheme, setCurrentCollectionTheme] = useState(() => {
    const saved = localStorage.getItem('collection-theme');
    return collectionThemes[saved] || collectionThemes.classic;
  });

  const [bannerData, setBannerData] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Apply theme to document
  useEffect(() => {
    // Apply header theme
    document.body.dataset.headerTheme = currentHeaderTheme.name;
    localStorage.setItem('header-theme', currentHeaderTheme.name);

    // Apply global dark mode
    document.body.dataset.globalTheme = globalDarkMode ? 'dark' : 'light';
    localStorage.setItem('global-theme', globalDarkMode ? 'dark' : 'light');

    // Apply collection theme
    document.body.dataset.collectionTheme = currentCollectionTheme.name;
    localStorage.setItem('collection-theme', currentCollectionTheme.name);

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentCollectionTheme.colors.primary);
    root.style.setProperty('--theme-secondary', currentCollectionTheme.colors.secondary);
    root.style.setProperty('--theme-accent', currentCollectionTheme.colors.accent);
    root.style.setProperty('--theme-font', currentCollectionTheme.font);
    root.style.setProperty('--theme-gradient', currentCollectionTheme.gradient);
  }, [currentHeaderTheme, globalDarkMode, currentCollectionTheme]);

  // Cycle through header themes
  const cycleHeaderTheme = () => {
    const currentIndex = headerThemes.findIndex(t => t.name === currentHeaderTheme.name);
    const nextIndex = (currentIndex + 1) % headerThemes.length;
    setCurrentHeaderTheme(headerThemes[nextIndex]);
  };

  // Toggle global dark mode
  const toggleGlobalDarkMode = () => {
    setGlobalDarkMode(prev => !prev);
  };

  // Change collection theme and show banner
  const changeCollectionTheme = (themeName) => {
    const theme = collectionThemes[themeName];
    if (theme) {
      setCurrentCollectionTheme(theme);

      // Show banner with theme data
      const bannerThemes = {
        romantic: {
          theme: 'theme-romantic',
          icon: '❤️',
          title: 'Collezione Romantica',
          subtitle: 'Stile elegante e appassionato'
        },
        energy: {
          theme: 'theme-energy',
          icon: '⚡',
          title: 'Collezione Energia',
          subtitle: 'Potenza e dinamismo'
        },
        classic: {
          theme: 'theme-ocean',
          icon: '🎨',
          title: 'Collezione Classica',
          subtitle: 'Tradizione e qualità'
        }
      };

      setBannerData(bannerThemes[themeName] || bannerThemes.classic);
      setShowBanner(true);
    }
  };

  // Show custom banner
  const showCustomBanner = (data) => {
    setBannerData(data);
    setShowBanner(true);
  };

  const closeBanner = () => {
    setShowBanner(false);
  };

  const value = {
    // Header theme
    currentHeaderTheme,
    headerThemes,
    cycleHeaderTheme,

    // Global dark mode
    globalDarkMode,
    toggleGlobalDarkMode,

    // Collection theme
    currentCollectionTheme,
    collectionThemes,
    changeCollectionTheme,

    // Banner
    bannerData,
    showBanner,
    showCustomBanner,
    closeBanner
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
