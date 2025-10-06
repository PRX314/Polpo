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
- **ES6+ Features** - Classes, arrow functions, modules, template literals
- **CSS Custom Properties** - Theme system with CSS variables (--bg-primary, --text-primary, etc.)
- **Mobile-First Design** - Progressive enhancement for larger screens
- **Self-contained Files** - Each game is a complete HTML document with inline CSS/JS
- **Event-driven** - DOMContentLoaded events, touch/mouse event listeners
- **LocalStorage** - Theme persistence and user preferences

### Gestionale-X React Architecture
- **Component-based** - Modular React components with single responsibility
- **Hooks-based state** - useState, useEffect for local and side-effect state
- **Firebase integration** - Real-time subscriptions via `subscribeToProjects()` and `subscribeToNotes()`
- **Service layer** - `firebaseService.js` abstracts Firestore operations (CRUD + subscriptions)
- **Authentication flow** - `onAuthStateChanged` listener in App.jsx
- **Form modals** - Reusable AddProjectForm/AddNoteForm with edit capabilities
- **Inline styles** - Strategic use alongside CSS classes for dynamic styling
- **Italian language** - All UI text in Italian for target audience

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
- **Component Structure**: Auth, Home, AddProjectForm, AddNoteForm, ProjectCard, NoteCard, StatusBadge, PriorityBadge
- **App State Management**: React hooks with useState/useEffect for UI, Firebase subscriptions for data
- **Views**: Home dashboard, Projects list, Notes list, Project detail with associated notes
- **Sample Data Initialization**: Automatic on first user login via `initializeSampleData()`

## File Organization

### Key File Locations

**Root Level**
- `index.html` - Main portfolio hub entry point
- `script.js` - Touch handlers, polpo long-press, mobile card expansion
- `CLAUDE.md` - This file (project documentation for Claude Code)

**Mini Games** (`/minigiochi/`)
- `index.html` - Games collection landing page
- `trix.html` - TRIX Bolt Edition game
- `dvd-screensaver/` - DVD screensaver with betting system
- `pixxa/` - Pizza generator with modular data files
- `test/istinto.html` - Personality assessment game
- `style-generator.html` - T-shirt style combination generator

**E-commerce** (`/Sito Magliette/`)
- `index.html` - Store front with PayPal integration
- `productData.js` - Product catalog data
- `laboratorio/` - Business admin panel and configuration tools

**Gestionale-X** (`/gestionale-x/`)
- `src/App.jsx` - Main application component with routing and state
- `src/firebase.js` - Firebase configuration and initialization
- `src/firebaseService.js` - Firestore CRUD operations and subscriptions
- `src/components/Auth.jsx` - Authentication component
- `src/components/Home.jsx` - Dashboard home view
- `src/components/AddProjectForm.jsx` - Project creation/editing form
- `src/components/AddNoteForm.jsx` - Note/idea creation/editing form
- `src/components/ProjectCard.jsx` - Project display card
- `src/components/NoteCard.jsx` - Note/idea display card
- `src/components/ui/StatusBadge.jsx` - Status indicator component
- `src/components/ui/PriorityBadge.jsx` - Priority indicator component

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
2. Firebase settings in `src/firebase.js` are already configured for production deployment
3. Run `npm install` first time
4. Use `npm run dev` for development with hot reload (port 5173)
5. Run `npm run lint` before committing changes
6. Test production builds with `npm run build`
7. Preview production build with `npm run preview`

**IMPORTANT**: The Firebase configuration includes public API keys which is normal for Firebase web apps. Security is enforced through Firestore security rules on the backend, not through hiding the config.

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

## Data Models

### Gestionale-X Firebase Collections

**Projects Collection** (`projects`)
- `id` (auto-generated)
- `name` - Project name
- `description` - Project description
- `status` - One of: `pending`, `in_progress`, `completed`, `paused`
- `tags` - Array of tag strings for categorization
- `links` - Array of objects with `{title, url}` for project links
- `roadmap` - Text field for project roadmap/timeline
- `obiettivi` - Text field for project objectives
- `todos` - Array of objects with `{text, completed}` for task tracking
- `createdAt` - ISO timestamp
- `userId` - Owner's Firebase Auth UID (for data isolation)

**Notes Collection** (`notes`)
- `id` (auto-generated)
- `title` - Note/idea title
- `content` - Note/idea content
- `type` - One of: `note`, `idea`
- `priority` - One of: `high`, `medium`, `low`
- `projectTags` - Array of tag strings linking to projects
- `createdAt` - ISO timestamp
- `userId` - Owner's Firebase Auth UID (for data isolation)

**Data Relationships**
- Notes are associated with projects via shared tags in `projectTags` and `project.tags`
- Each user's data is isolated by `userId` field (enforced by Firestore security rules)
- Real-time subscriptions keep UI synchronized with database changes

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
- **Authentication required** - Firebase Auth enforces user identity via email/password or Google OAuth
- **Data isolation** - Each user can only access their own projects and notes (enforced via Firestore rules)
- **Real-time security** - Rules apply to all queries and subscriptions
- **Public API keys** - Firebase config in `src/firebase.js` contains public keys, which is normal and expected
- **Backend security** - Security is enforced through Firestore security rules on the Firebase backend, not client-side code hiding

## Performance Considerations

### Static Sites
- **No build process** - Direct file serving for fast development
- **Optimized animations** - CSS transitions over JavaScript
- **Lazy loading** - Games load content on demand
- **Mobile optimization** - Touch-first interaction design
- **Asset-light** - Minimal external dependencies

### React Application (Gestionale-X)
- **Vite HMR** - Fast hot module replacement during development
- **Firebase optimization** - Real-time subscriptions with efficient queries
- **Production builds** - Minification and tree-shaking via Vite
- **State management** - React hooks-based architecture without external state libraries
- **Toast notifications** - Auto-dismiss after 3-5 seconds for user feedback

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
- **Firebase**: Version 12.3.0 - Authentication, Firestore database, deployed at gestionalepolpo.netlify.app
- **React**: Version 19.1.1
- **React DOM**: Version 19.1.1
- **Vite**: Version 7.1.6 for build tooling
- **ESLint**: Version 9.35.0 for code quality

This repository represents a creative showcase of modern web development techniques using both vanilla technologies and modern frameworks, emphasizing performance, accessibility, and mobile-first design principles.
