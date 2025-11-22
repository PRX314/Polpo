// Theme definition for "Fijo de'n Amore" collection
// Romantic, minimalist, elegant aesthetic

export const fijoTheme = {
  // Collection metadata
  name: 'Fijo de\'n Amore',
  slug: 'fijo-de-n-amore',

  // Color palette - FIJO MAGLIA G.POWER (Black + Coral/Pink)
  colors: {
    primary: '#FF3B4F',        // Rosso corallo (pantaloni)
    secondary: '#1A1A1A',      // Nero maglia
    accent: '#FF69B4',         // Rosa neon (spada)
    text: {
      primary: '#1A1A1A',      // Nero profondo
      secondary: '#4A4A4A',    // Grigio edifici
      light: '#FFE5E8',        // Rosa tenue
    },
    background: {
      main: '#FAFAFA',         // Off-white neutro
      secondary: '#FFF0F3',    // Rosa pallido
      card: '#FFFFFF',         // Pure white
      overlay: 'rgba(255, 59, 79, 0.08)', // Coral overlay
    },
    border: '#FFD6E0',         // Rosa pastello
    shadow: 'rgba(26, 26, 26, 0.15)', // Black shadow
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

  // Shadows - Black/Coral
  shadows: {
    sm: '0 2px 8px rgba(26, 26, 26, 0.08)',
    md: '0 4px 16px rgba(26, 26, 26, 0.12)',
    lg: '0 8px 32px rgba(26, 26, 26, 0.15)',
    hover: '0 12px 40px rgba(255, 59, 79, 0.25)',
  },

  // Gradients - G.POWER BLACK/CORAL/PINK
  gradients: {
    primary: 'linear-gradient(135deg, #1A1A1A 0%, #FF3B4F 100%)',
    secondary: 'linear-gradient(135deg, #FFF0F3 0%, #FFFFFF 100%)',
    overlay: 'linear-gradient(180deg, rgba(255, 59, 79, 0) 0%, rgba(255, 59, 79, 0.05) 100%)',
    hero: 'linear-gradient(135deg, #1A1A1A 0%, #FF3B4F 50%, #FF69B4 100%)',
  },

  // Banner configuration
  banner: {
    title: "Fijo de'n Amore",
    subtitle: "IRONIA • AMORE • FERTILITÀ • MINIMALISMO PROVOCATORIO",
    icon: '⚡',
    keywords: [
      'Amore',
      'Power',
      'Urban',
      'Street',
      'Energico',
      'Bold',
      'Fertilità',
      'Ironia',
    ],
    animation: 'fade-slide-up',
    duration: 4000,
    backgroundColor: 'linear-gradient(135deg, #1A1A1A 0%, #FF3B4F 50%, #FF69B4 100%)',
    textColor: '#FFFFFF',
  },

  // Button styles
  button: {
    primary: {
      background: '#FF3B4F',
      color: '#FFFFFF',
      hoverBackground: '#FF69B4',
      hoverTransform: 'translateY(-2px)',
    },
    secondary: {
      background: '#FFF0F3',
      color: '#1A1A1A',
      hoverBackground: '#FFFFFF',
      border: '2px solid #FF3B4F',
    },
  },

  // Card styles
  card: {
    background: '#FFFFFF',
    border: '1px solid #FFD6E0',
    borderRadius: '16px',
    padding: '1.5rem',
    hoverShadow: '0 12px 40px rgba(255, 59, 79, 0.25)',
    hoverTransform: 'translateY(-4px)',
  },

  // Product card specific
  productCard: {
    imageOverlay: 'rgba(255, 59, 79, 0.03)',
    priceColor: '#FF3B4F',
    badgeBackground: '#1A1A1A',
    badgeColor: '#FFFFFF',
  },

  // Mood & Atmosphere
  mood: {
    description: 'Urban, street, bold',
    emotion: 'Power, energy, passion',
    target: 'Street style lovers, bold spirits, urban warriors',
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
