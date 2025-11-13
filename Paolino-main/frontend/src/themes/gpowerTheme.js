// Theme definition for "G.Power" collection
// Urban, powerful, energetic aesthetic

export const gpowerTheme = {
  // Collection metadata
  name: 'G.Power',
  slug: 'g-power',

  // Color palette - Urban Power (semplificato e meno acceso)
  colors: {
    primary: '#FF1744',        // Red-pink (meno brillante)
    secondary: '#FFD54F',      // Soft yellow
    accent: '#FF4081',         // Pink accent
    text: {
      primary: '#1A1A1A',      // Dark gray (migliore contrasto)
      secondary: '#4A4A4A',    // Medium gray
      light: '#FFFFFF',        // White per titoli su sfondo scuro
    },
    background: {
      main: '#FAFAFA',         // Light gray background
      secondary: '#F5F5F5',    // Lighter gray
      card: '#FFFFFF',         // White cards
      overlay: 'rgba(255, 23, 68, 0.1)', // Light pink overlay
    },
    border: '#FFE0E6',         // Soft pink border
    shadow: 'rgba(255, 23, 68, 0.2)', // Soft shadow
  },

  // Typography - FUTURISTICA
  fonts: {
    heading: '"Space Grotesk", "Impact", sans-serif',  // Geometric & Tech
    body: '"Urbanist", "Arial", sans-serif',           // Modern & Clean
    accent: '"Chivo", "Helvetica", sans-serif',        // Bold & Impactful
  },

  // Font sizes (mobile-first) - Ridotti per proporzioni migliori
  fontSize: {
    h1: 'clamp(1.75rem, 4vw, 2.5rem)',  // Ridotto per proporzioni migliori
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

  // Border radius - Angular, sharp shapes
  borderRadius: {
    sm: '4px',       // Sharp corners
    md: '8px',
    lg: '12px',
    full: '9999px',  // For specific circular elements
  },

  // Animations
  animations: {
    duration: {
      fast: '100ms',   // Snappier
      normal: '200ms',
      slow: '400ms',
    },
    easing: {
      default: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      aggressive: 'cubic-bezier(0.87, 0, 0.13, 1)',
    },
  },

  // Shadows - Soft, minimal (come Fijo)
  shadows: {
    sm: '0 2px 8px rgba(255, 23, 68, 0.1)',
    md: '0 4px 16px rgba(255, 23, 68, 0.15)',
    lg: '0 8px 32px rgba(255, 23, 68, 0.2)',
    hover: '0 12px 40px rgba(255, 23, 68, 0.25)',
  },

  // Gradients - Semplificati e meno accesi
  gradients: {
    primary: 'linear-gradient(135deg, #FF1744 0%, #FF4081 100%)',
    secondary: 'linear-gradient(135deg, #FFD54F 0%, #FF4081 100%)',
    overlay: 'linear-gradient(180deg, rgba(250, 250, 250, 0.9) 0%, rgba(255, 23, 68, 0.1) 100%)',
    hero: 'linear-gradient(135deg, #FF1744 0%, #FF4081 50%, #FFD54F 100%)',
    neon: 'linear-gradient(135deg, #FF1744 0%, #FF4081 100%)',
  },

  // Banner configuration
  banner: {
    title: 'G Power',
    subtitle: 'FORZA • FEMMINILITÀ • POTERE • POP-ART • ENERGIA',
    icon: '⚡',
    keywords: [
      'POWER',
      'ENERGIA',
      'FORZA',
      'URBAN',
      'STREET',
      'ATTITUDE',
      'POP-ART',
      'FEMMINILITÀ',
    ],
    animation: 'explosive-zoom',  // Aggressive entrance
    duration: 4000,               // 4 seconds come nel prototipo
    backgroundColor: 'linear-gradient(135deg, #1A1A1A 0%, #FF1744 100%)', // Sfondo scuro per contrasto
    textColor: '#FFFFFF',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  },

  // Button styles
  button: {
    primary: {
      background: 'linear-gradient(135deg, #FF006E 0%, #FB5607 100%)',
      color: '#FFFFFF',
      hoverBackground: 'linear-gradient(135deg, #FB5607 0%, #FFBE0B 100%)',
      hoverTransform: 'scale(1.05)',
      textTransform: 'uppercase',
      fontWeight: '900',
      letterSpacing: '1px',
    },
    secondary: {
      background: 'transparent',
      color: '#FF006E',
      hoverBackground: '#FF006E',
      hoverColor: '#000000',
      border: '3px solid #FF006E',
      textTransform: 'uppercase',
      fontWeight: '700',
    },
  },

  // Card styles
  card: {
    background: '#2A2A2A',
    border: '2px solid #FF006E',
    borderRadius: '8px',
    padding: '1.5rem',
    hoverShadow: '0 16px 48px rgba(255, 0, 110, 0.5), 0 0 20px rgba(255, 0, 110, 0.6)',
    hoverTransform: 'translateY(-6px) scale(1.02)',
    hoverBorder: '2px solid #FFBE0B',
  },

  // Product card specific
  productCard: {
    imageOverlay: 'rgba(255, 0, 110, 0.1)',
    priceColor: '#FFBE0B',
    badgeBackground: 'linear-gradient(135deg, #FF006E 0%, #FB5607 100%)',
    badgeColor: '#FFFFFF',
    badgeFontWeight: '900',
    badgeTextTransform: 'uppercase',
  },

  // Mood & Atmosphere
  mood: {
    description: 'Urban, powerful, energetic',
    emotion: 'Strength, confidence, rebellion',
    target: 'Urban youth, gym enthusiasts, streetwear lovers',
  },

  // Layout configuration
  layout: {
    maxWidth: '1400px',       // Wider layout
    gridGap: '2rem',          // More spacing
    mobileColumns: 2,
    tabletColumns: 3,
    desktopColumns: 4,
  },

  // Special effects
  effects: {
    neonGlow: {
      filter: 'drop-shadow(0 0 10px rgba(255, 0, 110, 0.6)) drop-shadow(0 0 20px rgba(255, 190, 11, 0.4))',
    },
    glitch: {
      textShadow: '2px 2px #FF006E, -2px -2px #FFBE0B',
    },
    scanlines: {
      background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
    },
  },
};

export default gpowerTheme;
