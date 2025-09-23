# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Paolo Repetto's portfolio hub repository - a collection of web-based mini-games and interactive projects built with vanilla HTML, CSS, and JavaScript. The repository serves as a showcase for creative web development projects focused on gaming and interactive experiences.

## Repository Structure

### Main Portfolio Hub
**Entry Point**: `/index.html`
**Tech Stack**: Vanilla HTML5, CSS3, JavaScript ES6+
**Key Features**:
- Responsive design with mobile optimization
- Dark/light theme toggle with localStorage persistence
- CSS Grid-based project showcase
- Touch-optimized mobile interactions
- Custom SVG polpo (octopus) logo with interactive modal

### Mini App Collection
**Location**: `/minigiochi/`
**Entry Point**: `/minigiochi/index.html`

#### TRIX Bolt Edition Game
**File**: `/minigiochi/trix.html`
**Type**: Strategic card-based puzzle game
**Features**:
- Notebook-style paper UI design
- Multiple game modes
- Local score tracking
- Responsive mobile gameplay

#### DVD Screensaver Game
**Location**: `/minigiochi/dvd-screensaver/`
**Type**: Interactive nostalgic screensaver with betting game
**Architecture**: Class-based JavaScript (`DVDScreensaver` class)
**Features**:
- Image upload functionality
- Multi-player betting system
- Corner collision detection
- Real-time score tracking
- Fullscreen screensaver mode

#### Pixxa Generator
**Location**: `/minigiochi/pixxa/`
**Type**: Random pizza recipe generator with Italian restaurant styling
**Architecture**: Modular JavaScript with data separation
**Key Files**:
- `index.html` - Main interface with Italian restaurant theme
- `main.js` - Core generation logic with smart naming algorithm
- `ingredienti.js` - Ingredient database
- `pizzeClassiche.js` - Classic pizza recipes
- `pizzeLeggendarie.js` - Legendary pizza variants
- `pizzeRegionali.js` - Regional pizza variants
**Features**:
- Three generation modes: Classica, Leggendaria, Pazza
- Smart pizza naming based on ingredient combinations
- Random pricing and calorie calculation
- Italian restaurant aesthetic with custom fonts
- Loading animations and Italian flag design elements

#### Istinto Personality Test
**File**: `/minigiochi/test/istinto.html`
**Type**: Interactive personality assessment game
**Features**: Dark theme, fullscreen experience

### Projects Showcase
**File**: `/progetti/index.html`
**Purpose**: Portfolio page for larger development projects
**Features**: Same design system as main hub with theme support

### Sito Magliette - E-commerce T-shirt Store
**Location**: `/Sito Magliette/`
**Type**: E-commerce web application with PayPal integration
**Tech Stack**: Vanilla HTML5, CSS3, JavaScript ES6+
**Key Files**:
- `index.html` - Main e-commerce interface with Italian localization
- `style.css` - Responsive styling with theme system
- `script.js` - Shopping cart logic and PayPal integration
- `productData.js` - Product catalog with collections and variants
- `images/` - Product image assets
**Key Features**:
- Multi-collection product catalog system
- Dynamic variant selection (type, color, size)
- Shopping cart with local storage persistence
- PayPal SDK integration for payments
- Responsive design with mobile optimization
- Italian language interface ("Fijo de'n amore" collection)

### Gestionale-X React Application
**Location**: `/gestionale-x/`
**Type**: React + Vite modern web application
**Tech Stack**: React 19, Vite 7, ESLint 9
**Key Features**:
- Modern React application with Vite for fast development
- ESLint configuration with React hooks and refresh plugins
- Hot Module Replacement (HMR) for development
- Production build optimization

## Architecture Patterns

### Frontend Architecture
- **Pure Vanilla JavaScript** - No frameworks or build tools (main portfolio and games)
- **React + Vite** - Modern React application for gestionale-x project
- **ES6+ Features** - Modern JavaScript with classes, arrow functions, modules
- **CSS Custom Properties** - Theme system using CSS variables
- **Mobile-First Design** - Progressive enhancement for larger screens
- **Component-Based CSS** - Modular styling with BEM-like naming

### JavaScript Patterns
- **Class-based Organization** - Games use ES6 classes (e.g., `DVDScreensaver` class in dvd-screensaver)
- **Event-Driven Programming** - DOM event listeners for interactions and mobile touch support
- **Local Storage Integration** - Theme persistence and game state management
- **Modular Data Management** - Separate JS files for game data (e.g., `ingredienti.js`, `pizzeClassiche.js` in Pixxa)
- **Self-contained Architecture** - Each game is a complete HTML file with embedded CSS/JS
- **Mobile-First Touch Handling** - Specific touch event patterns for mobile devices

### CSS Architecture
- **CSS Grid & Flexbox** - Modern layout techniques
- **CSS Custom Properties** - Dynamic theming system
- **Mobile Touch Optimization** - Touch-specific hover states and interactions
- **Animation-First Design** - CSS animations for smooth UX

### Theme System Implementation
```javascript
// Theme persistence pattern used across projects
function toggleTheme() {
    const body = document.body;
    const newTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
}

// Load theme on page initialization
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.dataset.theme = savedTheme;
```

### Mobile Touch Handling Pattern
```javascript
// Touch optimization pattern for mobile cards
card.addEventListener('click', function(e) {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        if (!this.classList.contains('mobile-expanded')) {
            e.preventDefault();
            // Close other expanded cards first
            cards.forEach(otherCard => {
                if (otherCard !== this) {
                    otherCard.classList.remove('mobile-expanded');
                }
            });
            this.classList.add('mobile-expanded');
        }
    }
});

// Touch start/end for visual feedback
card.addEventListener('touchstart', function() {
    this.classList.add('touch-active');
});

card.addEventListener('touchend', function() {
    this.classList.remove('touch-active');
});
```

## Development Guidelines

### File Organization
- **Self-contained HTML files** - Each game/project is a complete HTML document
- **Inline CSS and JavaScript** - Styles and scripts embedded for portability
- **Modular game data** - Separate JS files for game content and logic
- **Asset-light approach** - Minimal external dependencies

### Naming Conventions
- **Files**: kebab-case (e.g., `dvd-screensaver`, `istinto.html`)
- **CSS Classes**: kebab-case with descriptive names
- **JavaScript**: camelCase for variables/functions, PascalCase for classes
- **IDs**: camelCase for DOM element references

### Performance Considerations
- **No build process** - Direct file serving for fast development
- **Optimized animations** - CSS transitions over JavaScript animations
- **Lazy loading** - Games load content on demand
- **Mobile optimization** - Touch-first interaction design

### Browser Compatibility
- **Modern browser features** - ES6+ syntax, CSS Grid, Custom Properties
- **Mobile-first responsive design** - Works across device sizes
- **Touch device optimization** - Separate hover states for touch vs. mouse

## Key Interactive Features

### Portfolio Hub Features (`index.html` + `script.js`)
- **Polpo Logo Interaction** - 3-second long press (mouse/touch) to open modal (`script.js:42-77`)
- **Project Card Expansion** - Hover on desktop, tap to expand on mobile (`script.js:1-39`)
- **Theme Persistence** - Dark/light mode with localStorage (embedded in `index.html`)
- **Responsive Design** - CSS Grid with breakpoints: 6 columns (1400px+), 3 columns (900px+), 2 columns (mobile)
- **SVG Logo** - Complex gradient polpo/octopus logo with custom animations

### Mini Apps Architecture
- **State Management** - Local storage for scores and preferences
- **Responsive Layouts** - Adaptive UI for different screen sizes
- **Touch Optimizations** - Gesture handling for mobile interactions

### Visual Design System
- **Gradient Themes** - Consistent color schemes across projects
- **Typography** - JetBrains Mono for technical aesthetic
- **Micro-animations** - Smooth transitions and hover effects

## Common Development Tasks

### Adding New Mini Apps
1. Create new HTML file in `/minigiochi/` directory following self-contained pattern
2. Include embedded CSS and JavaScript (avoid external dependencies)
3. Implement responsive design with mobile-first approach
4. Add back navigation link to `/minigiochi/index.html`
5. Update `/minigiochi/index.html` with new app card in the games grid
6. Follow touch optimization patterns for mobile devices
7. Consider adding to main portfolio hub (`/index.html`) if significant

### Working with Sito Magliette E-commerce
1. Navigate to `/Sito Magliette/` directory
2. Modify product data in `productData.js` to add new collections or variants
3. Update styling in `style.css` for theme customizations
4. Test shopping cart functionality and PayPal integration
5. Ensure all product images are optimized and placed in `images/` directory
6. Verify responsive design across different screen sizes

### Working with React Application (Gestionale-X)
1. Navigate to `/gestionale-x/` directory
2. Install dependencies with `npm install` if first time
3. Start development server with `npm run dev`
4. React components are in `/src/` directory
5. Follow React 19 patterns and modern hooks
6. Run `npm run lint` before committing changes
7. Use `npm run build` to test production builds

### Updating Portfolio Hub
1. Modify `/index.html` for main hub changes
2. Update project cards in `.projects-grid` section (lines ~928-958)
3. Maintain consistent theme system implementation (`data-theme` attribute)
4. Test mobile touch interactions across breakpoints
5. Ensure SVG logo and polpo modal functionality works
6. Verify responsive grid behavior: 6/3/2 column layout

### Modifying Mini Apps
1. **Pixxa Generator**:
   - Data files: `ingredienti.js`, `pizzeClassiche.js`, `pizzeLeggendarie.js`, `pizzeRegionali.js`
   - Core logic: `main.js` (includes smart naming algorithm in `generaNomeDaIngredienti()`)
   - UI: `index.html` (self-contained with embedded CSS)
2. **DVD Screensaver**:
   - Main class: `DVDScreensaver` in `/minigiochi/dvd-screensaver/script.js`
   - Supports image upload, betting system, collision detection
   - Separate HTML/CSS/JS architecture
3. **TRIX**: Edit `/minigiochi/trix.html` (self-contained)
4. **Istinto Test**: Edit `/minigiochi/test/istinto.html` (self-contained)

## Development Commands

### Portfolio and Mini Apps (Static Files)
```bash
# Python 3 (recommended for development)
python -m http.server 8000

# Node.js alternative (if available)
npx serve .

# Live Server (VS Code extension) - recommended for development
# Install Live Server extension and right-click any HTML file → "Open with Live Server"
```

### Gestionale-X React Application
```bash
# Navigate to the React project
cd gestionale-x

# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

### File Serving and Testing

**Static Files (Portfolio & Mini Apps)**:
- Opened directly in browser (`file://` protocol) - limited functionality due to CORS
- Served with any static file server for full functionality (recommended)
- Deployed to static hosting (GitHub Pages, Netlify, Vercel)

**React Application (Gestionale-X)**:
- Requires Node.js development server (`npm run dev`)
- Uses Vite for fast builds and HMR
- Production builds can be served statically

**Testing Approach**:
- **Static sites**: Manual testing by navigating to HTML files
- **React app**: Use Vite dev server with hot reload
- Verify mobile responsiveness using browser dev tools
- Test theme switching functionality across all pages
- Validate touch interactions on actual mobile devices when possible

### Git Workflow
```bash
# View current changes
git status
git diff

# Stage and commit changes
git add .
git commit -m "Update: description of changes"

# Push to remote
git push origin main
```

## Security Considerations

- **No server-side code** - Pure client-side implementation
- **Local storage only** - No external data transmission
- **XSS prevention** - Avoid `innerHTML` with user data
- **File upload validation** - Image type checking in games

This repository represents a creative showcase of modern web development techniques using vanilla technologies, emphasizing performance, accessibility, and mobile-first design principles.