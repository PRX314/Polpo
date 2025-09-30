# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a creative project repository for "Laboratorio X" - a micro-laboratory for custom textile printing and personalized merchandise production. The repository contains static HTML/CSS/JS web interfaces, business documentation, and project planning tools for a small-scale creative manufacturing venture.

**Architecture**: Static web application with no backend dependencies
**Tech Stack**: Vanilla HTML5, CSS3, JavaScript ES6
**Entry Point**: `index.html` (main project interface)
**Language**: All content in Italian for local Italian market

## Project: Laboratorio X

**Location**: `/home/paolo/laboratorio/`
**Type**: Creative business project with web-based documentation and planning tools
**Tech Stack**: Vanilla HTML, CSS3, JavaScript

### Project Description

Laboratorio X is a micro-creative laboratory designed to produce custom t-shirts, canvas bags, and personalized articles. It combines artisanal techniques with semi-professional tools for flexible, independent, and customizable production.

**Philosophy**: Small is beautiful • Complete creative control • Modern craftsmanship combining manual work with digital tools

**Vision**: Become a reference point for local micro-creative production, offering authentic and original products for online sales, markets, concept stores, and merchandising for events and artists.

### Key Features

- **Custom Textile Printing**: DTF (Direct To Film), screen printing, thermal transfer
- **Personalized Labeling**: Thermal label printing, custom branding, QR codes
- **Artisanal Screen Printing**: Homemade screen printing setup for small batches
- **Eco-friendly Approach**: Sustainable materials, biodegradable packaging
- **Modular Growth**: Start simple and expand capabilities over time

## Project Files

### Core Documentation Files

- **`config.json`**: **MAIN CONFIGURATION FILE** - Contains all variable data (prices, timeline, content, links) that can be modified without touching HTML code
- **`GUIDA-CONFIG.md`**: Complete guide for modifying config.json without coding knowledge
- **`Intro Progetto.txt`**: Project introduction and collaboration proposal  
- **`Laboratorio-X-Progetto-Completo.txt`**: Complete project documentation including philosophy, materials list, screen printing guide, timeline, and budget breakdown
- **`Lista prodotti.txt`**: Materials and equipment list with supplier links
- **`Telaio Serigrafico Homemade – Guida Completa.txt`**: Complete guide for DIY screen printing setup
- **`tipi di stampa.txt`**: Overview of different printing techniques

### Web Interface Files

- **`business-admin.html`**: **BUSINESS ADMIN PANEL** - Advanced business management interface with economic calculators, KPI tracking, and goal management
- **`admin.html`**: **GENERAL ADMIN PANEL** - Complete web interface to modify all project configuration without coding
- **`index.html`**: V2 main interface with radio player, collapsible sections, and comprehensive project dashboard
- **`minimal-lab.html`**: Clean, minimal project dashboard with organized sections
- **`progetto-condiviso.html`**: Industrial-style collaborative project presentation
- **`progetto-dashboard.html`**: Control panel-style dashboard with terminal aesthetics
- **`ultra-minimal.html`** & **`ultra-minimal-v2.html`**: Ultra-clean project overviews with budget breakdowns
- **`laboratorio-x-style-generator.html`** & **`minimal-lab-style-generator.html`**: Style generators for interface customization

### Commands

**Viewing the project**:
```bash
# Open main interface (JSON-driven configuration)
open index.html
# or for Linux systems
xdg-open index.html

# View specific interface variants
open minimal-lab.html
open progetto-condiviso.html
open ultra-minimal.html
open progetto-dashboard.html
```

**Configuration management via web interfaces**:
```bash
# RECOMMENDED: Business admin panel (advanced KPI tracking, economic calculators)
open business-admin.html

# General admin panel (comprehensive configuration interface)  
open admin.html

# Style generators for interface customization
open laboratorio-x-style-generator.html
open minimal-lab-style-generator.html
```

**Direct configuration editing**:
```bash
# Manual JSON editing (requires JSON syntax knowledge)
nano config.json

# View non-technical configuration guide
cat GUIDA-CONFIG.md

# Validate JSON syntax after manual edits
python -m json.tool config.json
```

**No build process required** - All files are static HTML/CSS/JS that run directly in browser

## Development Guidelines

### HTML Structure Patterns

All HTML files follow consistent patterns:
- **Grid-based layouts** using CSS Grid for responsive design
- **Modular sections** with collapsible content areas
- **Modal-based detailed information** for complex topics (screen printing guide, printing techniques)
- **Industrial/terminal aesthetics** with monospace fonts (JetBrains Mono, Courier Prime)

### CSS Architecture

- **Modern CSS3** with CSS Grid and Flexbox
- **Consistent color schemes**: Industrial grays, accent oranges (#ff6b35), blues (#74b9ff), greens (#00b894)
- **Typography**: JetBrains Mono for headers and technical content, readable sans-serif for body text
- **Responsive design** with mobile-first approach
- **Interactive elements**: Hover effects, transitions, collapsible sections

### JavaScript Architecture

**Core Features**:
- **Modal system** for detailed guides (screen printing, printing techniques)
- **Collapsible sections** with smooth animations
- **Radio player** with persistent settings (localStorage)
- **Interactive state management** for UI components

**Key JavaScript Patterns**:
- **Event delegation** for dynamic content
- **LocalStorage persistence** for user preferences
- **Audio API integration** for radio streaming
- **CSS animation triggers** from JavaScript interactions
- **Responsive design helpers** for mobile/desktop switching

## Technical Specifications

### Budget Planning

**Initial Setup**: €500-800
- **Primary expenses** (€470-640): Large press, mini press, thermal label printer, t-shirt stock, shipping materials
- **Secondary expenses** (€180-300): Screen printing kit, sewing machine, various materials
- **Total complete setup**: €650-940

### Production Techniques

1. **DTF (Direct To Film)**: Primary technique for small batches and color prints
2. **Screen Printing**: For larger series with bright, resistant colors
3. **Thermal Vinyl**: For simple logos and text
4. **Manual Stamps**: For decorative details and artisanal effects

### Materials & Equipment

- **Textiles**: White and black t-shirts (mixed sizes), natural canvas bags
- **Printing**: Large thermal press (30x38cm min), mini press, DTF service
- **Labeling**: Thermal printer (COLOP, Dymo, Brother), custom adhesive labels
- **Packaging**: Biodegradable shipping bags, personalized thank-you cards

## Business Model

### Target Market
- Young creatives, local artists, small brands
- Cultural events, concept stores
- Online sales, local markets

### Collaboration Structure
- **Space Partner**: Provides workspace and logistical support
- **Creative Partner (Paolo)**: Ideas, design, production, testing
- **Revenue Sharing**: Split expenses and profits or workspace usage in exchange for sales percentage

### Timeline

1. **Phase 1**: Laboratory setup, equipment purchase, initial screen printing tests
2. **Phase 2**: First production run, quality testing, branding development
3. **Phase 3**: Sales channel setup, online presence, local market testing
4. **Phase 4**: Expansion - new products, artist collaborations, advanced techniques

## File Organization

### Text Files
- Project documentation and guides in Italian
- Materials lists with direct supplier links
- Technical specifications and processes

### HTML Files
- Interactive project presentations
- Different visual styles (minimal, industrial, dashboard)
- Responsive design for mobile and desktop
- Modal-based detailed information

## Development Workflow

### Configuration Management Workflow

**Recommended approach for content updates**:
```bash
# STEP 1: Use web-based admin interface (non-technical users)
open business-admin.html

# STEP 2: Direct JSON editing (technical users)
nano config.json

# STEP 3: Validate JSON syntax
python -m json.tool config.json

# STEP 4: Test changes across interfaces
open index.html && open minimal-lab.html
```

**Documentation synchronization**:
```bash
# Edit core project documentation
nano "Laboratorio-X-Progetto-Completo.txt"

# Sync configuration file to match
nano config.json

# Update HTML interfaces if needed
nano index.html
```

**Interface testing workflow**:
```bash
# Test primary interfaces
open index.html
open minimal-lab.html
open business-admin.html

# Test specialized variants  
open ultra-minimal.html
open progetto-dashboard.html
open progetto-condiviso.html
```

### Development Process

**Making Changes to Documentation**:
1. **Update text files first** for content changes in `.txt` files
2. **Sync HTML files** to reflect updated information
3. **Maintain consistent styling** across all HTML variants
4. **Test responsive behavior** on different screen sizes
5. **Verify all external Amazon.it links** for equipment suppliers

**Adding New Features**:
1. **Follow existing CSS patterns** - Use CSS Grid, consistent color schemes, JetBrains Mono
2. **Use modular JavaScript** - Add to existing event listeners, maintain localStorage patterns
3. **Maintain accessibility** with proper HTML structure and keyboard navigation
4. **Test modal functionality** and collapsible sections across browsers
5. **Preserve mobile responsiveness** - Test on mobile breakpoints

## Important Notes & Architecture Decisions

- **Italian Language**: All content is in Italian, targeting Italian market
- **Equipment Links**: All external links point to Amazon.it for Italian suppliers and pricing
- **Mobile Optimization**: All interfaces must work on mobile devices (responsive breakpoint at 768px)
- **Print-Friendly**: Content should be readable in print format
- **No Backend Required**: Static HTML/CSS/JS implementation only - no server needed
- **Browser Compatibility**: Designed for modern browsers with CSS Grid and Audio API support
- **Persistent Settings**: Radio player settings saved to localStorage for user experience
- **Accessibility**: Proper semantic HTML, keyboard navigation, screen reader friendly

## Key Technical Patterns

### Configuration-Driven Architecture
- **config.json** serves as single source of truth for all variable data
- **Web-based admin panels** (business-admin.html, admin.html) provide GUI configuration
- **GUIDA-CONFIG.md** enables non-technical users to modify JSON directly
- **Real-time configuration loading** via JavaScript fetch API (where implemented)
- **Separation of content and presentation** - HTML templates populated from JSON data

### CSS Architecture
- **CSS Grid layouts** with responsive 2-3 column configurations
- **Gradient-based visual hierarchy** using `linear-gradient` throughout interfaces
- **JetBrains Mono typography** for technical/monospace content consistency
- **Border-image gradients** for colored accent elements
- **Consistent shadow patterns** for depth and visual layering
- **Mobile-first responsive design** with 768px breakpoint

### JavaScript Architecture
- **Module pattern** for radio player functionality and settings persistence
- **Event delegation** for modal controls and collapsible content sections  
- **LocalStorage integration** for user preferences (radio volume, station selection)
- **Audio API integration** for streaming radio with persistent controls
- **CSS animation triggers** via JavaScript class manipulation
- **Vanilla ES6** approach - no framework dependencies

## External Resources

### Equipment Suppliers
- Amazon.it for thermal presses, label printers, and basic equipment
- Specialized suppliers for screen printing materials (emulsion, mesh, inks)
- Local suppliers for textiles and packaging materials

### Design Tools
- Standard graphic design software for creating designs
- Acetate film printing for screen printing stencils
- Digital design tools for DTF preparation

This repository represents a comprehensive business planning and documentation system for a small-scale creative manufacturing venture, with web-based interfaces for project management and presentation.