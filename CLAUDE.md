# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Paolo Repetto's portfolio hub repository containing five distinct parts:
1. **Portfolio Showcase** (`/`, `/minigiochi/`, `/progetti/`, `/Sito Magliette/`) - Static HTML/CSS/JS projects and games
2. **Gestionale-X** (`/gestionale-x/`) - React + Firebase project management application deployed at gestionalepolpo.netlify.app
3. **OG-2025** (`/OG-2025/`) - Olimpiadi Goliardiche event management system with Google Sheets integration
4. **OGv2** (`/OGv2/`) - Comprehensive documentation and analysis for Olimpiadi Goliardiche 2025 (documentation only, no code)
5. **Paolino E-commerce** (`/Paolino-main/`) - Full-stack MERN e-commerce platform (currently untracked in git)

**Primary Entry Point**: `/index.html` (main portfolio hub)
**Language**: Italian (all user-facing content)

### Repository Structure Note
This is a **monorepo** containing multiple independent projects. Each sub-project has its own:
- Package.json and dependencies (Gestionale-X, Paolino frontend/backend)
- Development environment and build process
- Documentation (most have their own CLAUDE.md or README.md)
- Deployment target (Netlify, local server, GitHub Pages)

## Quick Reference

### Starting Development
```bash
# Portfolio/Mini Games - Choose one:
python -m http.server 8000        # Python HTTP server
# OR use VS Code Live Server        # Right-click index.html → "Open with Live Server"

# Gestionale-X
cd gestionale-x && npm run dev    # Port 5173

# OG-2025 (Olimpiadi Goliardiche) - Static site
cd OG-2025
python -m http.server 8000        # Then open http://localhost:8000/homepage.html
# OR npx serve .

# Paolino (MUST start in order: MongoDB → Backend → Frontend)
sudo service mongodb start                    # Step 1: Database
cd Paolino-main/backend && npm run dev        # Step 2: Backend (port 5031)
cd Paolino-main/frontend && npm run dev       # Step 3: Frontend (port 5173)
```

### Portfolio Showcase Contents
- **Mini Games** (`/minigiochi/`): Interactive browser games
  - Pixxa Generator - Pizza name generator with modular data files
  - DVD Screensaver - Classic bouncing logo animation
  - Trix - Interactive game
  - Rhythm Click - Rhythm-based clicking game
  - Style Generator - CSS style generation tool
- **Projects** (`/progetti/`): Showcased projects
  - **X World Project** (`/progetti/xworld/`) - Complete Web3 ecosystem with NFT crowdfunding and tokenized investments
    - `index.html` - Visual showcase with POLPOPOLI projects (Sciarcuffia 🧣, 00X 🎩, I8I 👓, PolpoVerse 🐙)
    - `whitepaper.html` - Comprehensive documentation (~1100 lines) with blockchain strategy, tokenomics, risks
    - `app-prototype.html` - NFT-gated app simulator with tier-based chat access
    - `crypto-academy.html` - Advanced blockchain learning platform with progress tracking
    - `crypto-studio.html` - Basic crypto education with live CoinGecko price ticker
    - `nav-hub.html` - Navigation hub for all X World apps
    - `blockchain-study/` - Study materials and resources subdirectory
  - Olimpiadi - Links to OG-2025 event management system
  - Quotify - External project showcase
  - Documenti - Document showcase
- **Sito Magliette** - T-shirt website demo

## Development Commands

### Static Sites (Portfolio, Mini Games)
```bash
# Serve with Python 3
python -m http.server 8000

# Or use VS Code Live Server (recommended for development)
# Right-click HTML file → "Open with Live Server"
```

### Gestionale-X React Application
```bash
cd gestionale-x
npm install           # First time only
npm run dev           # Development server (port 5173)
npm run build         # Production build
npm run lint          # ESLint code quality check
npm run preview       # Preview production build
```

### OG-2025 Olimpiadi Goliardiche
```bash
cd OG-2025

# Serve with Python 3
python -m http.server 8000

# Or with Node.js
npx serve .

# Then open browser to:
http://localhost:8000/homepage.html      # Landing page (start here)
http://localhost:8000/index.html         # Classifica Finale (main scoreboard)
http://localhost:8000/hub-capitani.html  # Captain Hub (team management)
```

**Note**: Pure vanilla JavaScript, no build process or dependencies required. All files run directly in browser.

### OGv2 - Documentation Only
```bash
# OGv2 is a documentation-only directory (no code to run)
# Contains markdown files extracted from OG-2025 project and PDF sources

cd OGv2
# Read documentation with any markdown viewer or text editor
```

**Available Documentation**:
- **`DOCUMENTAZIONE_COMPLETA_OG.md`**: Complete event documentation (~400 lines) - full reference, organizer manual
- **`QUICK_REFERENCE.md`**: Quick reference guide (~150 lines) - cheat sheet, essential info tables
- **`README.md`**: Index and usage guide for the documentation

**Key Content**:
- 14 temples/bars with complete schedules
- 12 games with detailed rules
- 45 questions for "Sussurro delle Sirene" game
- Evaluation system (3 criteria × 5 points)
- 8 challenge categories
- Special mechanics (Menu OG, dual language)
- Team strategies and organizer guidelines

### Paolino E-commerce Platform
```bash
# Step 1: Start MongoDB (REQUIRED)
sudo service mongodb start         # Linux/WSL
# Or use MongoDB Compass

# Step 2: Backend (port 5031) - MUST BE RUNNING
cd Paolino-main/backend
npm install
npm run dev                        # Development with nodemon
npm run setup                      # Initialize admin user and sample products
npm run clean:products             # Delete all products from database

# Step 3: Frontend (port 5173)
cd Paolino-main/frontend
npm install
npm run dev                        # Development server
npm run build                      # Production build
npm run lint                       # ESLint analysis
```

**⚠️ CRITICAL**: Backend must be running BEFORE frontend for proper operation.
**Paolino Test Credentials**: admin@paolino.com / admin123
**Database**: MongoDB on port 27017, database name `paolino_ecommerce`

## Architecture Overview

### Portfolio Hub Architecture
- **Pure Vanilla JavaScript** - No frameworks, self-contained HTML files with inline CSS/JS for games
- **CSS Custom Properties** - Theme system with light/dark modes
  - Variables: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`, `--gradient-accent`
  - Theme toggle button in header with localStorage persistence
  - Attribute-based switching: `[data-theme="dark"]`
- **Mobile-First Design** - Touch-optimized with responsive grid (6/3/2 columns)
- **Font**: JetBrains Mono (monospace) for developer aesthetic
- **LocalStorage** - Theme persistence across sessions
- **Key Interactive Features**:
  - Polpo logo long-press (1.5s) redirects to gestionalepolpo.netlify.app (script.js:68-76)
  - Touch-based card expansion for mobile devices (script.js:2-38)

### Gestionale-X Architecture
**Tech Stack**: React 19.1 + Vite 7.1 + Firebase 12.3

**Component Structure**:
- `App.jsx`: Main router with authentication flow, real-time subscriptions, CRUD operations
- `firebaseService.js`: Abstracted Firestore operations with `subscribeToProjects()` and `subscribeToNotes()`
- `components/`: Auth, Home, AddProjectForm, AddNoteForm, ProjectCard, NoteCard, StatusBadge, PriorityBadge

**Data Models** (Firestore):
- **Projects**: `{id, name, description, status, tags, links, roadmap, obiettivi, todos, createdAt, userId}`
- **Notes**: `{id, title, content, type, priority, projectTags, createdAt, userId}`

**Key Patterns**:
- Real-time data via Firebase subscriptions (App.jsx:83-111)
- User data isolation enforced by `userId` field in security rules
- Auto-dismiss toast notifications (3-5 seconds)
- Inline styles strategically combined with CSS classes

### OG-2025 Olimpiadi Goliardiche Architecture
**Tech Stack**: Pure Vanilla JavaScript + HTML5 + CSS3 (no frameworks, no build process)

**Three-Page Application**:
1. **`homepage.html`**: Landing page with event info, 14 temples/bars, rules, navigation
2. **`index.html`**: Main scoreboard (Classifica Finale) with Google Sheets integration
3. **`hub-capitani.html`**: Team captain dashboard with challenge logging and team management

**Core Files**:
- `script.js`: ES6+ class-based logic for captain hub (`OlympicCaptainHub` class)
- `styles.css`: Greek vase aesthetic (gold/bronze theme: #daa520, #ffd700, #b8860b)
- `template_classifica.csv`: Google Sheets template structure

**Data Storage**:
- **LocalStorage Keys**:
  - `olimpiadiClassifica`: Scoreboard data (team names, scores, rankings)
  - `olympicCaptainHubData`: Captain hub data (team info, members, challenges, stats)
- **Google Sheets Integration**: JSONP technique for live data sync (avoids CORS issues)
  - Automatic silent loading on page load
  - Manual sync via 5-second logo long-press
  - Hardcoded Sheet ID in index.html:664

**Key Features**:
- 14 Temples/Bars (Caligo, Casa Gotuzzo, Cereria, Circolo Sport, Excalibur, Le Fontane, Loomi, Mary Jo, Storico, Teleria 108, Tirebouchon, Vinoria, Vinoteca, Vitae)
- Team scoring system (0-100 points per challenge + bonus)
- Responsive design with separate mobile/desktop views (768px breakpoint)
- Captain hub stats tracking: Morale, Energy, Strategy (0-100)
- Developer console commands for testing/debugging
- Greek/Olympic design system (Cinzel font for headings, JetBrains Mono for UI)

**Architecture Patterns**:
- No backend - pure client-side application
- No authentication - all data is local and public
- Auto-save to LocalStorage on all changes
- Event-driven with DOM event listeners
- Functional programming for scoreboard logic
- Object-oriented for captain hub (`OlympicCaptainHub` class)

### Paolino E-commerce Architecture
**Tech Stack**: Node.js/Express 4.18 + MongoDB 7.5 + React 19.1 + Vite 7.1 + Tailwind CSS 3.3 + Stripe 13.6

**Backend Structure** (`/Paolino-main/backend/`):
- `serverPaolino.js`: Express server with helmet, CORS, rate limiting
- `models/`: Mongoose schemas (User, Product, Order, Cart)
- `routes/`: API endpoints (auth, products, cart, orders, admin)
- `services/`: Stripe integration
- `middlewares/`: Auth, upload validation

**Frontend Structure** (`/Paolino-main/frontend/`):
- `App.jsx`: Router with protected routes and admin route guards
- `contexts/`: AuthContext (user auth), CartContext (shopping cart state)
- `pages/`: ProductShowcasePage (new landing), HomePage, ProductsPage, CartPage, CheckoutPage, ProfilePage
- `pages/admin/`: Dashboard, ProductsAdmin, OrdersAdmin, UsersAdmin, AnalyticsAdmin, SettingsAdmin
- `components/`: Header with navigation, Footer, ProductCard, Layout
- `services/api.js`: Axios-based API layer with auth interceptors

**API Endpoints**:
- `/api/auth/*`: Authentication (register, login, profile, logout)
- `/api/products/*`: Catalog with search/filters/pagination, single product details
- `/api/cart/*`: Shopping cart (authenticated users only)
- `/api/orders/*`: Order management and Stripe payment processing
- `/api/admin/*`: Admin CRUD, analytics, user management, product uploads
- `/api/wishlist/*`: User wishlist management

**Key Backend Dependencies**:
- `express`: Web framework with middleware
- `mongoose`: MongoDB ODM with schemas
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `stripe`: Payment processing
- `cloudinary` + `multer-storage-cloudinary`: Image upload and storage
- `helmet`: Security headers
- `express-rate-limit`: API rate limiting
- `joi`: Request validation
- `cors`: Cross-origin resource sharing

**Key Frontend Dependencies**:
- `react` + `react-dom`: v19.1.1 UI library
- `react-router-dom`: v6.20 Client-side routing
- `@stripe/stripe-js`: Stripe payment integration
- `axios`: HTTP client with interceptors
- `tailwindcss`: v3.3 Utility-first CSS
- `lucide-react`: Icon library
- `react-hot-toast`: Toast notifications
- `clsx` + `tailwind-merge`: Conditional CSS classes

## Important Code Locations

### Portfolio Hub Touch Behavior
Mobile card expansion system in `script.js:2-38` handles touch events to expand project cards on mobile devices.

### Gestionale-X Real-time Subscriptions
Firebase real-time listeners in `App.jsx:83-111` use `onSnapshot` to sync projects and notes instantly across clients.

### Gestionale-X Project-Note Relationship
Notes link to projects via shared tags (App.jsx:114-118):
```javascript
const getProjectNotes = (project) => {
  return notes.filter(note =>
    note.projectTags && note.projectTags.some(tag =>
      project.tags && project.tags.includes(tag)
    )
  )
}
```

### Portfolio Hub Theme System
Light/dark theme implementation in `index.html`:
- Theme state stored in localStorage as `theme` key
- Toggle function switches between light/dark modes
- CSS custom properties automatically update via `[data-theme="dark"]` attribute
- Theme persists across page reloads
- No JavaScript framework required - pure DOM manipulation

### Mini Games Modular Data Pattern
Pixxa Generator uses separate data files (`minigiochi/pixxa/ingredienti.js`, `pizzeClassiche.js`, etc.) with core logic in `main.js` and smart naming algorithm. Games are self-contained in single HTML files with inline CSS/JS for maximum portability.

### OG-2025 Google Sheets Integration
Scoreboard (`index.html`) uses JSONP technique to fetch data from Google Sheets:
- Sheet ID hardcoded at line 664
- Automatic silent loading on page load via `loadFromGoogleSheets(false)`
- Logo long-press (5 seconds) triggers manual sync with visual feedback
- JSONP creates script tag: `https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:json`
- Data parsed via `window.google.visualization.Query.setResponse()` callback
- Sheet must be publicly accessible: "Anyone with the link can view"

### OG-2025 Developer Console Commands
Hidden debugging commands available in browser console:
```javascript
olympicCommands.reset()           // Reset all data
olympicCommands.export()          // Export backup JSON
olympicCommands.summary()         // Show team summary
olympicCommands.addPoints(n)      // Add points to team
olympicCommands.setMorale(n)      // Set morale (0-100)
olympicCommands.help()            // Show all commands
```

## Deployment

### Netlify Configuration
Configured in `netlify.toml` for Gestionale-X deployment:
- **Build base**: `gestionale-x/`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20
- **SPA redirect**: All routes → `/index.html` (status 200)
- **Deployed at**: https://gestionalepolpo.netlify.app/

**Important**: Only the Gestionale-X React app is built and deployed via Netlify. The static portfolio files (`/index.html`, `/minigiochi/`, `/progetti/`) are NOT part of the Netlify build process.

### Portfolio Hub Deployment
Static files can be deployed separately to any static hosting service (GitHub Pages, Netlify static, Vercel, etc.) or served via Python HTTP server for local development.

## CSS Responsive Breakpoints
```css
/* 6 columns: 1400px+ */
@media (min-width: 1400px) { grid-template-columns: repeat(6, 1fr); }

/* 3 columns: 900px-1200px */
@media (max-width: 1200px) and (min-width: 900px) { grid-template-columns: repeat(3, 1fr); }

/* 2 columns: <600px */
@media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
```

## Security Considerations

### Gestionale-X Firebase
- Firebase config contains **public API keys** (normal and expected for Firebase web apps)
- Security enforced through **Firestore security rules** on backend, not client-side
- Each user accesses only their own data via `userId` field filtering

### Paolino E-commerce
- Bcrypt password hashing
- JWT token-based authentication (7-day expiry)
- Express rate limiting on API endpoints
- Helmet security headers
- Input validation with Joi schemas
- File upload validation (5MB max, JPEG/PNG/WebP only)

## Port Assignments
- **Static sites**: Port 8000 (Python HTTP server)
- **Gestionale-X frontend**: Port 5173 (Vite default)
- **Paolino frontend**: Port 5173 (conflicts with gestionale-x if both run simultaneously)
- **Paolino backend**: Port 5031
- **MongoDB**: Port 27017 (required for Paolino)

**Port Conflict Resolution**:
```bash
# Check what's running on a port
lsof -i :5173

# Kill a process on a port
kill -9 $(lsof -t -i:5173)

# Or use different port for Vite
vite --port 5174
```

## Git Workflow Notes
- Main branch is production-ready
- Commit messages in Italian preferred for consistency
- `Paolino-main/` directory currently untracked (consider separate repo if committing)
- **Modified files often include**: CLAUDE.md updates, .env configuration, package.json dependencies
- Use `git status` to check tracked changes before committing
- `.nojekyll` file at root enables GitHub Pages deployment without Jekyll processing

### Recent Development Focus (from git history)
- Reorganized homepage navigation (Olimpiadi, Quotify, Brand sections)
- Fixed onclick handlers for button navigation
- Renamed "I Miei Progetti" to "Progetti" for cleaner presentation
- Updated project showcase with X World, Olimpiadi Goliardiche, and Quotify

## Project Status
- **Portfolio Hub**: ✅ Stable, production-ready, deployed
- **Gestionale-X**: ✅ Fully functional, deployed at gestionalepolpo.netlify.app
- **OG-2025 (Olimpiadi Goliardiche)**: ✅ Complete, production-ready
  - **Event**: Olimpiadi Goliardiche 2025 (Chiavari, Italy)
  - **Features**: 14 temples/bars, 20 teams, Google Sheets integration, captain dashboard
  - **Tech**: Pure vanilla JavaScript, no dependencies, no build process
  - **Deployment**: Static files deployable to any hosting (GitHub Pages, Netlify, etc.)
  - **Documentation**: Complete CLAUDE.md in `/OG-2025/CLAUDE.md`
- **OGv2 (Olimpiadi Goliardiche Documentation)**: ✅ Complete, documentation-only
  - **Purpose**: Comprehensive documentation and analysis extracted from OG-2025 and PDF sources
  - **Created**: 2025-11-07
  - **Content**: 3 markdown files with event details, game rules, strategies, quick reference
  - **Sources**: OG-2025 codebase + "OG Giochi.pdf" (19 pages)
  - **Use Cases**: Event organizers, participating teams, developers planning OGv2 features
- **Paolino E-commerce**: 🚧 ~90% complete, core functionality working
  - **Test Credentials**: admin@paolino.com / admin123
  - ✅ Completed: Backend API, Authentication, Admin panel, Product catalog, Cart functionality, ProductShowcasePage landing
  - 🚧 In Progress: Checkout flow with Stripe, User profile with order history
  - ⚠️ Known Issues: Frontend requires backend running at all times (see QUICK_START.md)
  - 📁 Status: Currently untracked in git (consider separate repository)

## Browser Compatibility
- Modern browser features required: ES6+ syntax, CSS Grid, Custom Properties
- Touch device optimization with separate hover states
- WebGL support recommended for advanced visualizations

## File Organization Best Practices
- **Self-contained HTML files** for games (inline CSS/JS for portability)
- **Modular data files** for game content (separate logic from data)
- **Maximum 500 lines per file** - Split larger files into modules
- **Naming conventions**:
  - Files: kebab-case (e.g., `style-generator.html`)
  - React Components: PascalCase (e.g., `AddProjectForm.jsx`)
  - Functions/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE

## Common Troubleshooting

### Paolino: "ERR_CONNECTION_REFUSED"
**Problem**: Backend not running
**Solution**: Start backend first (`cd Paolino-main/backend && npm run dev`), wait for "Server running on port 5031", then refresh frontend

### Paolino: "MongoDB connection failed"
**Problem**: MongoDB not running
**Solution**: `sudo service mongodb start` or use MongoDB Compass

### Paolino: No products displayed
**Problem**: Empty database
**Solution**: Run `npm run setup` in backend directory to create admin and sample products

### Gestionale-X: Firebase errors
**Problem**: Security rules or authentication issues
**Solution**: Check that user is logged in, Firebase config is correct in environment

### Static sites: Not loading correctly
**Problem**: Incorrect paths or server not running
**Solution**: Use Python HTTP server (`python -m http.server 8000`) or VS Code Live Server

### OG-2025: Google Sheets not syncing
**Problem**: Scoreboard not loading data from Google Sheets
**Solution**:
1. Verify sheet is set to "Anyone with the link can view"
2. Check Sheet ID is correct in `index.html` line 664
3. Ensure internet connection is active
4. Check browser console for JSONP errors
5. Try logo long-press (5 seconds) for manual sync

### OG-2025: LocalStorage data lost
**Problem**: Team data or scores disappeared
**Solution**:
- Browser privacy mode blocks LocalStorage
- Cache clearing deletes data
- Use export functionality (`olympicCommands.export()` in console) to create backups
- Google Sheets data overwrites LocalStorage on page load

## Additional Resources

### Paolino E-commerce Documentation
- **`/Paolino-main/CLAUDE.md`** - Complete backend/frontend architecture reference
- **`/Paolino-main/QUICK_START.md`** - Step-by-step troubleshooting guide
- **`/Paolino-main/SECURITY.md`** - ⚠️ **CRITICAL**: Security checklist, .env setup, key rotation
- **`/Paolino-main/STRIPE_SETUP.md`** - Stripe payment integration configuration (referenced but may not exist)
- **`/Paolino-main/CLOUDINARY_INTEGRATION.md`** - Image upload and storage setup
- **`/Paolino-main/STATUS.md`** - Project completion status and roadmap
- **`/Paolino-main/deploy.md`** - Deployment instructions

### Other Project Documentation
- **`/OG-2025/CLAUDE.md`** - Complete Olimpiadi Goliardiche implementation and developer commands
- **`/OG-2025/README.md`** - Italian-language project overview and features
- **`/OGv2/DOCUMENTAZIONE_COMPLETA_OG.md`** - Complete event documentation (~400 lines) with all game rules
- **`/OGv2/QUICK_REFERENCE.md`** - Quick reference guide with tables and checklists
- **`/OGv2/README.md`** - Index and usage guide for OGv2 documentation
- **`/gestionale-x/SECURITY_SETUP.md`** - Firebase security configuration
- **`/gestionale-x/firestore.rules`** - Firestore security rules
