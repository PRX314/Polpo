// Theme definition for "Fijo de'n Amore" collection
// Romantic, minimalist, elegant aesthetic

export const fijoTheme = {
  // Collection metadata
  name: 'Fijo de\'n Amore',
  slug: 'fijo-de-n-amore',

  // Color palette - RED/CORAL passionate & modern
  colors: {
    primary: '#FF3366',        // Bright coral red (more vibrant!)
    secondary: '#FFF5F7',      // Soft pink cream
    accent: '#FF6B9D',         // Hot pink accent
    text: {
      primary: '#2D1B2E',      // Deep purple-black (più caldo)
      secondary: '#6B4E71',    // Muted purple (più romantico)
      light: '#F8D7DA',        // Soft pink (più delicato)
    },
    background: {
      main: '#FFFBFC',         // Warm white
      secondary: '#FFF0F3',    // Light pink
      card: '#FFFFFF',         // Pure white cards
      overlay: 'rgba(255, 51, 102, 0.12)', // Coral overlay
    },
    border: '#FFD6E0',         // Soft coral border
    shadow: 'rgba(255, 51, 102, 0.2)', // Coral shadow
  },

  // Typography - INNOVATIVA
  fonts: {
    heading: '"Syne", "Georgia", serif',          // Bold & Modern
    body: '"DM Sans", "Helvetica Neue", sans-serif', // Clean & Readable
    accent: '"Outfit", sans-serif',               // Geometric & Friendly
  },

  // Font sizes (mobile-first) - Ridotti per proporzioni migliori
  fontSize: {
    h1: 'clamp(1.75rem, 4vw, 2.5rem)',  // Ridotto
    h2: 'clamp(1.25rem, 3.5vw, 2rem)',
    h3: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    body: 'clamp(0.875rem, 2.5vw, 1rem)',
    small: 'clamp(0.75rem, 2vw, 0.875rem)',
  },

  // Spacing system (8px base) - MINIMAL
  spacing: {
    xs: '0.25rem',  // 4px - micro spacing
    sm: '0.5rem',   // 8px - tight
    md: '1rem',     // 16px - default
    lg: '1.5rem',   // 24px - comfortable
    xl: '2rem',     // 32px - spacious
    xxl: '3rem',    // 48px - very spacious
  },

  // Border radius - Circular, soft shapes
  borderRadius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',  // Perfect circles
  },

  // Animations
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Shadows - Soft, romantic
  shadows: {
    sm: '0 2px 8px rgba(230, 57, 70, 0.1)',
    md: '0 4px 16px rgba(230, 57, 70, 0.15)',
    lg: '0 8px 32px rgba(230, 57, 70, 0.2)',
    hover: '0 12px 40px rgba(230, 57, 70, 0.25)',
  },

  // Gradients - VIBRANTI
  gradients: {
    primary: 'linear-gradient(135deg, #FF3366 0%, #FF6B9D 100%)',
    secondary: 'linear-gradient(135deg, #FFF0F3 0%, #FFFFFF 100%)',
    overlay: 'linear-gradient(180deg, rgba(255, 51, 102, 0) 0%, rgba(255, 51, 102, 0.12) 100%)',
    hero: 'linear-gradient(135deg, #FF3366 0%, #FF6B9D 50%, #FFD6E0 100%)',
  },

  // Banner configuration
  banner: {
    title: "Fijo de'n Amore",
    subtitle: "IRONIA • AMORE • FERTILITÀ • MINIMALISMO PROVOCATORIO",
    icon: '♥',
    keywords: [
      'Amore',
      'Passione',
      'Cuore',
      'Romantico',
      'Elegante',
      'Delicato',
      'Fertilità',
      'Ironia',
    ],
    animation: 'fade-slide-up',  // Gentle entrance
    duration: 4000,              // 4 seconds come nel prototipo
    backgroundColor: 'linear-gradient(135deg, #E4002B 0%, #FF1744 50%, #E91E63 100%)',
    textColor: '#FFFFFF',
  },

  // Button styles
  button: {
    primary: {
      background: '#E63946',
      color: '#FFFFFF',
      hoverBackground: '#FF6B9D',
      hoverTransform: 'translateY(-2px)',
    },
    secondary: {
      background: '#F1FAEE',
      color: '#E63946',
      hoverBackground: '#FFFFFF',
      border: '2px solid #E63946',
    },
  },

  // Card styles
  card: {
    background: '#FFFFFF',
    border: '1px solid #FFE5E8',
    borderRadius: '16px',
    padding: '1.5rem',
    hoverShadow: '0 12px 40px rgba(230, 57, 70, 0.25)',
    hoverTransform: 'translateY(-4px)',
  },

  // Product card specific
  productCard: {
    imageOverlay: 'rgba(230, 57, 70, 0.05)',
    priceColor: '#E63946',
    badgeBackground: '#FF6B9D',
    badgeColor: '#FFFFFF',
  },

  // Mood & Atmosphere
  mood: {
    description: 'Romantic, elegant, minimalist',
    emotion: 'Love, passion, tenderness',
    target: 'Romantic souls, couples, gift seekers',
  },

  // Layout configuration
  layout: {
    maxWidth: '1200px',
    gridGap: '1.5rem',
    mobileColumns: 2,
    tabletColumns: 3,
    desktopColumns: 4,
  },
};

export default fijoTheme;
