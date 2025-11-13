import { createContext, useContext, useState, useEffect } from 'react';
import fijoTheme from '../themes/fijoTheme';
import gpowerTheme from '../themes/gpowerTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme registry - mappa slug collezione → theme object
const themeRegistry = {
  'fijo-de-n-amore': fijoTheme,
  'g-power': gpowerTheme,
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

  // LEGACY - Collection themes semplici (mantenuti per retro-compatibilità)
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

  // NUOVO: Current detailed theme (dai file theme dedicati)
  const [currentDetailedTheme, setCurrentDetailedTheme] = useState(() => {
    const saved = localStorage.getItem('detailed-theme-slug');
    return themeRegistry[saved] || fijoTheme; // Default: Fijo de'n Amore
  });

  // Apply theme to document
  useEffect(() => {
    // Apply header theme
    document.body.dataset.headerTheme = currentHeaderTheme.name;
    localStorage.setItem('header-theme', currentHeaderTheme.name);

    // Apply global dark mode
    document.body.dataset.globalTheme = globalDarkMode ? 'dark' : 'light';
    localStorage.setItem('global-theme', globalDarkMode ? 'dark' : 'light');

    // Apply collection theme (legacy)
    document.body.dataset.collectionTheme = currentCollectionTheme.name;
    localStorage.setItem('collection-theme', currentCollectionTheme.name);

    // Apply CSS variables (legacy)
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentCollectionTheme.colors.primary);
    root.style.setProperty('--theme-secondary', currentCollectionTheme.colors.secondary);
    root.style.setProperty('--theme-accent', currentCollectionTheme.colors.accent);
    root.style.setProperty('--theme-font', currentCollectionTheme.font);
    root.style.setProperty('--theme-gradient', currentCollectionTheme.gradient);
  }, [currentHeaderTheme, globalDarkMode, currentCollectionTheme]);

  // Apply detailed theme CSS variables
  useEffect(() => {
    const theme = currentDetailedTheme;
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--color-text-light', theme.colors.text.light);
    root.style.setProperty('--color-bg-main', theme.colors.background.main);
    root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary);
    root.style.setProperty('--color-bg-card', theme.colors.background.card);
    root.style.setProperty('--color-border', theme.colors.border);

    // Typography
    root.style.setProperty('--font-heading', theme.fonts.heading);
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-accent', theme.fonts.accent);

    // Spacing
    root.style.setProperty('--spacing-sm', theme.spacing.sm);
    root.style.setProperty('--spacing-md', theme.spacing.md);
    root.style.setProperty('--spacing-lg', theme.spacing.lg);

    // Border radius
    root.style.setProperty('--radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--radius-md', theme.borderRadius.md);
    root.style.setProperty('--radius-lg', theme.borderRadius.lg);

    // Shadows
    root.style.setProperty('--shadow-sm', theme.shadows.sm);
    root.style.setProperty('--shadow-md', theme.shadows.md);
    root.style.setProperty('--shadow-hover', theme.shadows.hover);

    // Gradients
    root.style.setProperty('--gradient-primary', theme.gradients.primary);
    root.style.setProperty('--gradient-hero', theme.gradients.hero);

    // Save to localStorage
    localStorage.setItem('detailed-theme-slug', theme.slug);
  }, [currentDetailedTheme]);

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

  // NUOVO: Cambia detailed theme con banner animato
  const changeDetailedTheme = (collectionSlug, forceShowBanner = false) => {
    const newTheme = themeRegistry[collectionSlug];

    if (!newTheme) {
      console.warn(`Theme "${collectionSlug}" not found in registry`);
      return;
    }

    // Se è lo stesso tema e non è forzato, non fare nulla
    if (newTheme.slug === currentDetailedTheme.slug && !forceShowBanner) {
      return;
    }

    // Cambia tema solo se diverso
    if (newTheme.slug !== currentDetailedTheme.slug) {
      setCurrentDetailedTheme(newTheme);
    }

    // Mostra banner con tutti i dati dal theme
    const bannerInfo = {
      theme: newTheme.slug,
      title: newTheme.banner.title,
      subtitle: newTheme.banner.subtitle,
      icon: newTheme.banner.icon,
      collectionName: newTheme.name,
      backgroundColor: newTheme.banner.backgroundColor,
      textColor: newTheme.banner.textColor,
      textShadow: newTheme.banner.textShadow || 'none',
      duration: newTheme.banner.duration,
      animation: newTheme.banner.animation,
    };

    setBannerData(bannerInfo);
    setShowBanner(true);

    // Auto-chiudi banner dopo la durata
    setTimeout(() => {
      setShowBanner(false);
    }, newTheme.banner.duration);
  };

  // NUOVO: Ottieni lista temi disponibili
  const availableDetailedThemes = Object.keys(themeRegistry).map(slug => ({
    slug,
    name: themeRegistry[slug].name,
  }));

  const value = {
    // Header theme
    currentHeaderTheme,
    headerThemes,
    cycleHeaderTheme,

    // Global dark mode
    globalDarkMode,
    toggleGlobalDarkMode,

    // Collection theme (legacy)
    currentCollectionTheme,
    collectionThemes,
    changeCollectionTheme,

    // NUOVO: Detailed themes
    currentDetailedTheme,
    changeDetailedTheme,
    availableDetailedThemes,
    themeRegistry,

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
