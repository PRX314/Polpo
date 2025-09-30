# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Paolo Repetto's portfolio hub repository - a collection of web-based mini-games, interactive projects, and React applications. The repository features vanilla HTML/CSS/JS games alongside a modern React + Firebase application.

**Primary Entry Point**: `/index.html` (main portfolio hub)
**Language**: Italian (all user-facing content)

## Repository Structure

### 1. Main Portfolio Hub (`/`)
- **Entry Point**: `index.html`
- **Tech Stack**: Vanilla HTML5, CSS3, JavaScript ES6+
- **Key Features**:
  - Dark/light theme toggle with localStorage persistence
  - CSS Grid-based responsive layout (6/3/2 columns)
  - Mobile-first touch optimization
  - SVG polpo (octopus) logo with 1.5s long-press redirect to gestionale
  - Project card expansion on hover (desktop) or tap (mobile)

### 2. Mini Games Collection (`/minigiochi/`)
- **Entry Point**: `minigiochi/index.html`
- **Architecture**: Self-contained HTML files with embedded CSS/JS
- **Games**:
  - **TRIX Bolt Edition** (`trix.html`): Three game modes (Classic, Memory Mobile, Ultimate Bolt Timer)
  - **DVD Screensaver** (`dvd-screensaver/`): Class-based game with betting system and image upload
  - **Pixxa Generator** (`pixxa/`): Pizza recipe generator with modular data files
  - **Test ISTINTO** (`test/istinto.html`): Personality assessment game
  - **Style Generator** (`style-generator.html`): T-shirt style combination generator

### 3. Gestionale-X React Application (`/gestionale-x/`)
- **Type**: React 19 + Vite 7 + Firebase 12
- **Purpose**: Project and note management with Firebase backend
- **Key Features**:
  - Firebase Authentication (email/password + Google OAuth)
  - Firestore database with real-time subscriptions
  - User data isolation via security rules
  - Component-based architecture with CRUD operations

### 4. E-commerce Store (`/Sito Magliette/`)
- **Entry Point**: `Sito Magliette/index.html`
- **Type**: Static e-commerce with PayPal integration
- **Key Features**:
  - Multi-collection product catalog
  - Shopping cart with localStorage persistence
  - PayPal SDK integration
  - Italian language interface
- **Laboratorio Subfolder** (`/Sito Magliette/laboratorio/`):
  - Business admin panel with KPI tracking
  - Style generator with 2000+ T-shirt combinations
  - Creative and technical specification tabs

### 5. Projects Showcase (`/progetti/`)
- Portfolio page for larger development projects
- Consistent design system with main hub

## Development Commands

### Static Sites (Portfolio, Mini Games, E-commerce)
```bash
# Serve with Python 3 (recommended)
python -m http.server 8000

# Or with Node.js
npx serve .

# Or use VS Code Live Server extension (recommended for development)
# Right-click any HTML file → "Open with Live Server"
```

### Gestionale-X React Application
```bash
cd gestionale-x

# Install dependencies (first time only)
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture Patterns

### Frontend Architecture (Static Sites)
- **Pure Vanilla JavaScript** - No frameworks or build tools
- **ES6+ Features** - Classes, arrow functions, modules
- **CSS Custom Properties** - Theme system with CSS variables
- **Mobile-First Design** - Progressive enhancement for larger screens
- **Self-contained Files** - Each game is a complete HTML document with inline CSS/JS

### Theme System Pattern
```javascript
function toggleTheme() {
    const body = document.body;
    const newTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
}

// Load saved theme on initialization
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.dataset.theme = savedTheme;
```

### Mobile Touch Handling Pattern
```javascript
// Touch optimization for mobile card expansion
card.addEventListener('click', function(e) {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        if (!this.classList.contains('mobile-expanded')) {
            e.preventDefault();
            // Close other expanded cards
            cards.forEach(otherCard => {
                if (otherCard !== this) {
                    otherCard.classList.remove('mobile-expanded');
                }
            });
            this.classList.add('mobile-expanded');
        }
    }
});
```

### Class-Based Game Architecture
```javascript
// Example: DVDScreensaver class pattern
class DVDScreensaver {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.speedX = 3;
        this.speedY = 2;
        this.players = [];
        this.init();
    }

    init() {
        // Event listeners
        // Initialize game state
    }

    start() { /* animation loop */ }
    stop() { /* cleanup */ }
}
```

### Modular Data Management (Pixxa Generator)
- **Separate data files**: `ingredienti.js`, `pizzeClassiche.js`, `pizzeLeggendarie.js`, `pizzeRegionali.js`
- **Core logic**: `main.js` with `generaNomeDaIngredienti()` smart naming algorithm
- **Random selection utility**: `scegliRandom(lista, quanti)` for ingredient combinations

## Key Interactive Features

### Portfolio Hub (`index.html` + `script.js`)
- **Polpo Logo Long Press** (script.js:42-85): 1.5s hold redirects to `gestionalepolpo.netlify.app`
- **Project Card Mobile Expansion** (script.js:1-39): Touch-based card reveal system
- **Theme Toggle**: Dark/light mode with localStorage persistence
- **Responsive Grid**: 6 columns (1400px+), 3 columns (900px+), 2 columns (mobile)
- **Touch Optimization**: Separate hover states for touch vs. mouse devices

### Gestionale-X React Application
- **Real-time Data**: Firestore subscriptions for live updates
- **Authentication Flow**: Email/password and Google OAuth
- **Security**: User data isolation via Firestore rules
- **Component Structure**: Auth, AddProjectForm, AddNoteForm, ProjectCard, NoteCard, StatusBadge

## File Organization

### Naming Conventions
- **Files**: kebab-case (e.g., `dvd-screensaver`, `style-generator.html`)
- **CSS Classes**: kebab-case with descriptive names
- **JavaScript Variables/Functions**: camelCase
- **JavaScript Classes**: PascalCase (e.g., `DVDScreensaver`)
- **IDs**: camelCase for DOM element references

### Project Structure Best Practices
- **Self-contained HTML files** for games (inline CSS/JS for portability)
- **Modular data files** for game content (separate logic from data)
- **Consistent theme system** across all static pages
- **Mobile-first responsive design** with 768px breakpoint

## Development Workflow

### Working with Static Sites
1. Open files directly in browser or use local server
2. Modify HTML/CSS/JS in place (no build step required)
3. Test responsive behavior using browser dev tools
4. Verify theme switching across pages
5. Test touch interactions on actual mobile devices when possible

### Working with Gestionale-X
1. Navigate to `/gestionale-x/` directory
2. Configure Firebase settings in `src/firebase.js` (IMPORTANT: Do this before running)
3. Review `SECURITY_SETUP.md` for Firestore security rules (CRITICAL for production)
4. Run `npm install` first time
5. Use `npm run dev` for development with hot reload
6. Run `npm run lint` before committing
7. Test production builds with `npm run build`

### Adding New Mini Games
1. Create self-contained HTML file in `/minigiochi/` directory
2. Include embedded CSS and JavaScript (avoid external dependencies)
3. Implement responsive design with mobile-first approach
4. Add back navigation link to `/minigiochi/index.html`
5. Update `/minigiochi/index.html` games grid with new card
6. Follow touch optimization patterns for mobile devices
7. Consider adding to main portfolio hub (`/index.html`) if significant

### Modifying Existing Games
- **Pixxa Generator**: Edit data files (`ingredienti.js`, `pizzeClassiche.js`, etc.) or logic in `main.js`
- **DVD Screensaver**: Modify `DVDScreensaver` class in `script.js`
- **TRIX**: Edit self-contained `trix.html` file
- **Style Generator**: Edit self-contained `style-generator.html` file

## Important Technical Details

### Portfolio Hub Long-Press Feature
The polpo logo uses a 1.5-second long press (mouse or touch) to redirect:
```javascript
// Location: script.js:68-76
polpoLongPressTimer = setTimeout(() => {
    if (polpoPressed) {
        window.location.href = 'https://gestionalepolpo.netlify.app/';
    }
}, 1500);
```

### CSS Grid Responsive Breakpoints
```css
/* 6 columns for large desktop (1400px+) */
@media (min-width: 1400px) {
    .projects-grid { grid-template-columns: repeat(6, 1fr); }
}

/* 3 columns for medium desktop/tablet (900px - 1200px) */
@media (max-width: 1200px) and (min-width: 900px) {
    .projects-grid { grid-template-columns: repeat(3, 1fr); }
}

/* 2 columns for mobile (<600px) */
@media (max-width: 600px) {
    .projects-grid { grid-template-columns: repeat(2, 1fr); }
}
```

### Touch Device Detection
```javascript
// Check for touch capability
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    // Touch-specific behavior
}
```

## Security Considerations

### Static Projects
- **No server-side code** - Pure client-side implementation
- **Local storage only** - No external data transmission (except PayPal in e-commerce)
- **XSS prevention** - Avoid `innerHTML` with user data
- **File upload validation** - Image type checking in games

### Gestionale-X Firebase
- **CRITICAL**: Implement Firestore security rules immediately (see `SECURITY_SETUP.md`)
- **Default state is VULNERABLE** - Anyone can read/write without rules
- **Authentication required** - Firebase Auth enforces user identity
- **Data isolation** - Firestore rules restrict users to their own data
- **Real-time security** - Rules apply to all queries and subscriptions

## Performance Considerations

### Static Sites
- **No build process** - Direct file serving for fast development
- **Optimized animations** - CSS transitions over JavaScript
- **Lazy loading** - Games load content on demand
- **Mobile optimization** - Touch-first interaction design
- **Asset-light** - Minimal external dependencies

### React Application (Gestionale-X)
- **Vite HMR** - Fast hot module replacement during development
- **Code splitting** - React.lazy() for component lazy loading
- **Firebase optimization** - Real-time subscriptions with efficient queries
- **Production builds** - Minification and tree-shaking via Vite

## Browser Compatibility

- **Modern browser features**: ES6+ syntax, CSS Grid, Custom Properties
- **Mobile-first responsive design**: Works across device sizes
- **Touch device optimization**: Separate hover states for touch vs. mouse
- **Audio API**: Required for radio player in laboratorio interfaces
- **WebGL support**: Required for advanced visualizations (if any)

## External Resources

### Portfolio Hub
- **Fonts**: Google Fonts (JetBrains Mono)
- **Icons**: Inline SVG (polpo logo, social icons)
- **No external JS libraries**: Pure vanilla JavaScript

### Gestionale-X
- **Firebase**: Authentication, Firestore database, hosting ready
- **React**: Version 19.1.1
- **Vite**: Version 7.1.6 for build tooling

This repository represents a creative showcase of modern web development techniques using both vanilla technologies and modern frameworks, emphasizing performance, accessibility, and mobile-first design principles.
