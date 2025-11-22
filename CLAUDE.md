# CLAUDE.md - Portfolio Hub Monorepo

This file provides guidance to Claude Code when working with code in this repository.

## Repository Overview

This is Paolo Repetto's portfolio hub monorepo containing five distinct projects:
1. **Portfolio Showcase** - Static HTML/CSS/JS projects, mini games, and CV
2. **X World** - Web3 NFT crowdfunding ecosystem with blockchain integration
3. **Gestionale-X** - React + Firebase project management app (deployed to Netlify)
4. **OG-2025** - Olimpiadi Goliardiche event management system (vanilla JS)
5. **Paolino E-commerce** - Full-stack MERN e-commerce platform

**Primary Entry Point**: `/index.html` (main portfolio hub)
**Language**: Italian (all user-facing content)

## Quick Project Finder

| Project | Location | Tech Stack | Port | Documentation | Status |
|---------|----------|------------|------|---------------|--------|
| **Portfolio Hub** | `/index.html` | HTML/CSS/JS | 8000 | N/A | ✅ Production |
| **X World** | `/progetti/xworld/` | HTML+Solidity | 8000 | [README](progetti/xworld/README.md) | 🚧 85% (blockchain testing) |
| **Gestionale-X** | `/gestionale-x/` | React+Firebase | 5173 | [README](gestionale-x/README.md) | ✅ Production ([Deployed](https://gestionalepolpo.netlify.app/)) |
| **OG-2025** | `/OG-2025/` | Vanilla JS | 8000 | [README](OG-2025/README.md), [CLAUDE.md](OG-2025/CLAUDE.md) | ✅ Production |
| **Paolino** | `/Paolino-main/` | MERN Stack | 5031/5173 | [README](Paolino-main/README.md) | 🚧 95% (checkout pending) |

**Quick Decision Tree**:
- Working on portfolio homepage? → `/index.html`
- Working on Web3/NFT features? → `/progetti/xworld/` → [README](progetti/xworld/README.md)
- Working on project management app? → `/gestionale-x/` → [README](gestionale-x/README.md)
- Working on Olympics event system? → `/OG-2025/` → [README](OG-2025/README.md) or [CLAUDE.md](OG-2025/CLAUDE.md)
- Working on e-commerce platform? → `/Paolino-main/` → [README](Paolino-main/README.md)

## First-Time Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd polpo

# 2. Install root dependencies (optional, for Firebase features)
npm install

# 3. Choose which project to work on:

# Portfolio/X World (static sites)
python -m http.server 8000
# Or use VS Code Live Server

# Gestionale-X
cd gestionale-x && npm install && npm run dev

# OG-2025 (static site)
cd OG-2025 && python -m http.server 8000

# Paolino (MUST start in order: MongoDB → Backend → Frontend)
sudo service mongodb start
cd Paolino-main/backend && npm install && npm run dev    # Terminal 1 (port 5031)
cd Paolino-main/frontend && npm install && npm run dev   # Terminal 2 (port 5173)
```

## Common Development Commands

### Static Sites (Portfolio, X World, OG-2025)
```bash
# Serve with Python
python -m http.server 8000

# Or use VS Code Live Server
# Right-click HTML file → "Open with Live Server"

# Or with Node.js
npx serve .
```

### Gestionale-X (React + Firebase)
```bash
cd gestionale-x
npm run dev          # Port 5173
npm run build        # Production build
npm run lint         # ESLint check
```

### Paolino E-commerce (MERN Stack)
```bash
# Step 1: Start MongoDB (REQUIRED)
sudo service mongodb start

# Step 2: Backend (Terminal 1)
cd Paolino-main/backend
npm run dev          # Port 5031

# Step 3: Frontend (Terminal 2)
cd Paolino-main/frontend
npm run dev          # Port 5173

# First-time setup (creates admin + sample products)
cd Paolino-main/backend
npm run setup
```

**⚠️ CRITICAL**: For Paolino, backend MUST be running before frontend.

### OG-2025 (Olimpiadi Goliardiche)
```bash
cd OG-2025
python -m http.server 8000
# Then open http://localhost:8000/homepage.html
```

## Port Assignments

- **Static sites** (Portfolio, X World, OG-2025): Port 8000
- **Gestionale-X frontend**: Port 5173
- **Paolino frontend**: Port 5173 (conflicts if both run simultaneously)
- **Paolino backend**: Port 5031
- **MongoDB** (Paolino): Port 27017

**Port Conflict Resolution**:
```bash
# Check what's running on a port
lsof -i :5173

# Kill process on port
kill -9 $(lsof -t -i:5173)

# Or use different port for Vite
vite --port 5174
```

## Common Troubleshooting

### 1. Port Conflicts (Gestionale-X + Paolino)
**Problem**: Both use port 5173, can't run simultaneously
**Solution**: Stop one project or change port with `vite --port 5174`

### 2. Paolino: "ERR_CONNECTION_REFUSED"
**Problem**: Backend not running
**Solution**: Start backend first (`cd Paolino-main/backend && npm run dev`), wait for "Server running on port 5031", then refresh frontend

### 3. Paolino: "MongoDB connection failed"
**Problem**: MongoDB not running
**Solution**: `sudo service mongodb start` or use MongoDB Compass

### 4. Paolino: No products displayed
**Problem**: Empty database
**Solution**: `cd Paolino-main/backend && npm run setup` (creates admin + 6 sample products)

### 5. OG-2025: Google Sheets not syncing
**Problem**: Scoreboard not loading from Google Sheets
**Solution**:
- Verify sheet is "Anyone with the link can view"
- Check Sheet ID in `index.html` line 664
- Try logo long-press (5 seconds) for manual sync

### 6. Static sites not loading correctly
**Problem**: Incorrect paths or server not running
**Solution**: Use Python HTTP server (`python -m http.server 8000`) or VS Code Live Server

## Git Workflow

### Branch Strategy
- **Single `main` branch** is production-ready (no dev/staging branches)
- Commit messages in Italian preferred

### Common Modified Files
- `CLAUDE.md` - Documentation updates
- `.env` files - Configuration (NEVER commit)
- `package.json` - Dependency updates

### Untracked Projects
- `Paolino-main/` directory currently untracked (consider separate repo if committing)

### Pre-commit Checklist
```bash
git status           # Verify tracked changes
git diff             # Review changes
git add <files>      # Stage changes
git commit -m "..."  # Italian commit message
```

### Recent Development Focus (Nov 2024)
- X World: Toggle Layer System, Crypto Studio unification, glassmorphism design
- Portfolio Hub: Interactive CV, navigation reorganization
- Paolino: Complete admin panel, ProductShowcasePage landing

## Development Best Practices

### Multi-Project Pitfalls
1. **Port Conflicts**: Never run Gestionale-X and Paolino simultaneously without changing ports
2. **Wrong Directory**: Always `cd` into correct project before `npm` commands
3. **Missing Backend**: Paolino frontend fails silently if backend isn't running
4. **MongoDB Not Running**: Paolino requires MongoDB service active
5. **Build vs Source**: Netlify only builds `/gestionale-x/`, not other projects

### Common Command Mistakes
```bash
# ❌ WRONG - Running npm in root
npm run dev

# ✅ CORRECT - Navigate to project first
cd gestionale-x && npm run dev

# ❌ WRONG - Forgetting MongoDB for Paolino
cd Paolino-main/backend && npm run dev

# ✅ CORRECT - Start MongoDB first
sudo service mongodb start && cd Paolino-main/backend && npm run dev
```

## Environment Configuration

### Root Level
- `/package.json` - Firebase 12.3.0 (shared dependency for static files)

### Project-Specific
- **Gestionale-X**: Firebase config in `src/firebaseService.js` (public keys OK)
- **Paolino Backend**: `.env` with MongoDB, JWT, Stripe, Cloudinary (NEVER commit)
- **Paolino Frontend**: `.env` with API URL and Stripe public key

### Security Notes
- `.env` files protected by `.gitignore` ✅
- Firebase public keys are normal (security in Firestore rules)
- Paolino JWT secrets are cryptographically secure 512-bit keys
- See project-specific READMEs for security checklists

## Browser Compatibility
- Modern browser features required: ES6+, CSS Grid, Custom Properties
- Touch device optimization for portfolio hub
- WebGL support recommended for X World visualizations

## Additional Resources

### Project Documentation
- **X World**: [README](progetti/xworld/README.md) - Complete Web3 ecosystem docs
- **Paolino**: [README](Paolino-main/README.md) - MERN architecture, API docs, security
  - [SECURITY.md](Paolino-main/SECURITY.md) - ⚠️ Critical security guide
  - [QUICK_START.md](Paolino-main/QUICK_START.md) - Fast setup guide
  - [STATUS.md](Paolino-main/STATUS.md) - Project completion status
- **Gestionale-X**: [README](gestionale-x/README.md) - Firebase setup, deployment
- **OG-2025**: [README](OG-2025/README.md) - Quick overview
  - [CLAUDE.md](OG-2025/CLAUDE.md) - Complete developer guide with console commands

### External Links
- Gestionale-X Deployed: https://gestionalepolpo.netlify.app/

---

**Note**: This is a monorepo with independent projects. Each has its own dependencies, development workflow, and documentation. Always refer to project-specific README files for detailed information.

*Repository Structure: Portfolio Hub (root) + 4 major projects*
*Total Lines Reduced: ~2000 → ~300 (85% reduction) ✅*
