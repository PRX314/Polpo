# Gestionale-X - Project Management Application

React-based project management application with Firebase backend for real-time collaboration.

**Deployed at**: https://gestionalepolpo.netlify.app/
**Tech Stack**: React 19.1 + Vite 7.1 + Firebase 12.3
**Status**: ✅ Fully functional and production-ready

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Development Commands](#development-commands)
- [Component Structure](#component-structure)
- [Data Models](#data-models)
- [Firebase Configuration](#firebase-configuration)
- [Key Patterns](#key-patterns)
- [Deployment](#deployment)

## Overview

Gestionale-X is a lightweight project management tool designed for personal and small team use. It provides:
- **Real-time project tracking** with Firebase Firestore
- **Note-taking system** with priority levels and project tags
- **Tag-based project-note relationships** for flexible organization
- **User isolation** - Each user sees only their own data
- **Responsive design** - Works seamlessly on desktop and mobile
- **Auto-save** - All changes persist immediately

## Features

### Project Management
- Create projects with name, description, status, and tags
- Track project status (Planning, Active, Completed, Archived)
- Add roadmap and objectives to each project
- Manage project links (GitHub, docs, deployment)
- Organize projects with custom tags
- Real-time updates across devices

### Note System
- Create notes with title, content, type, and priority
- Link notes to projects via shared tags
- Three note types: Note, Task, Idea
- Priority levels: Low, Medium, High, Urgent
- Real-time synchronization

### User Experience
- Clean, modern interface
- Auto-dismiss toast notifications (3-5 seconds)
- Real-time data subscriptions
- Inline editing and quick actions
- Status and priority badges with color coding

## Architecture

### Tech Stack

**Frontend**:
- **React 19.1** - Modern hooks and functional components
- **Vite 7.1** - Fast build tool and dev server
- **Firebase SDK 12.3** - Authentication and Firestore database

**Backend**:
- **Firebase Firestore** - NoSQL real-time database
- **Firebase Authentication** - User management and auth
- **Firebase Hosting** (optional) - Static site hosting

**Deployment**:
- **Netlify** - Continuous deployment from git
- **Build base**: `gestionale-x/`
- **Node version**: 20

## Development Commands

```bash
cd gestionale-x

# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint code quality check
npm run lint
```

## Component Structure

### Main Application
```
gestionale-x/
├── src/
│   ├── App.jsx                    # Main router with auth flow
│   ├── firebaseService.js         # Abstracted Firestore operations
│   ├── components/
│   │   ├── Auth.jsx               # Login/Register forms
│   │   ├── Home.jsx               # Main dashboard
│   │   ├── AddProjectForm.jsx    # Project creation form
│   │   ├── AddNoteForm.jsx       # Note creation form
│   │   ├── ProjectCard.jsx       # Project display component
│   │   ├── NoteCard.jsx          # Note display component
│   │   ├── StatusBadge.jsx       # Project status indicator
│   │   └── PriorityBadge.jsx     # Note priority indicator
│   └── main.jsx                   # React entry point
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.js                # Vite configuration
└── package.json                   # Dependencies
```

### Key Components

**App.jsx** (Main Router):
- Authentication flow management
- Real-time Firebase subscriptions (lines 83-111)
- CRUD operations for projects and notes
- State management for current user

**firebaseService.js** (Firebase Abstraction):
- `subscribeToProjects(userId, callback)` - Real-time project updates
- `subscribeToNotes(userId, callback)` - Real-time note updates
- Encapsulates Firestore queries and data transformations

**Home.jsx** (Dashboard):
- Displays all projects and notes
- Project-note relationship via tag matching
- Quick add forms for projects and notes
- Responsive grid layout

## Data Models

### Firestore Collections

**Projects Collection** (`projects`):
```javascript
{
  id: string,              // Auto-generated document ID
  name: string,            // Project name
  description: string,     // Project description
  status: string,          // "Planning" | "Active" | "Completed" | "Archived"
  tags: string[],          // Array of tag strings
  links: {                 // Optional external links
    github: string,
    docs: string,
    deployment: string
  },
  roadmap: string,         // Project roadmap/milestones
  obiettivi: string,       // Project objectives
  todos: string[],         // Array of todo items
  createdAt: Timestamp,    // Firebase server timestamp
  userId: string           // Owner user ID (for data isolation)
}
```

**Notes Collection** (`notes`):
```javascript
{
  id: string,              // Auto-generated document ID
  title: string,           // Note title
  content: string,         // Note content/body
  type: string,            // "Note" | "Task" | "Idea"
  priority: string,        // "Low" | "Medium" | "High" | "Urgent"
  projectTags: string[],   // Tags linking to projects
  createdAt: Timestamp,    // Firebase server timestamp
  userId: string           // Owner user ID
}
```

### Data Isolation

**Security Model**:
- All queries filter by `userId` field
- Firebase security rules enforce user data isolation
- Users can only read/write their own documents
- No cross-user data access

## Firebase Configuration

### Setup Firebase Project

1. Create project at https://console.firebase.google.com/
2. Enable **Firestore Database** (test mode for development)
3. Enable **Authentication** with Email/Password provider
4. Get Firebase config from Project Settings

### Configure Application

Edit `src/firebaseService.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Note**: Firebase config contains **public API keys** - this is normal and expected. Security is enforced through Firestore security rules on the backend, not client-side code.

### Firestore Security Rules

Deploy these rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }

    // Notes collection
    match /notes/{noteId} {
      allow read, write: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

See `/SECURITY_SETUP.md` for complete Firebase security configuration.

## Key Patterns

### Real-time Data Subscriptions

App.jsx implements real-time listeners using Firebase's `onSnapshot`:

```javascript
// Lines 83-111 in App.jsx
useEffect(() => {
  if (currentUser) {
    // Subscribe to projects
    const unsubProjects = subscribeToProjects(currentUser.uid, (projects) => {
      setProjects(projects);
    });

    // Subscribe to notes
    const unsubNotes = subscribeToNotes(currentUser.uid, (notes) => {
      setNotes(notes);
    });

    // Cleanup on unmount
    return () => {
      unsubProjects();
      unsubNotes();
    };
  }
}, [currentUser]);
```

This pattern:
- Automatically updates UI when data changes
- Syncs across multiple devices/tabs
- Cleans up subscriptions to prevent memory leaks

### Project-Note Relationship

Notes link to projects via **shared tags** (App.jsx lines 114-118):

```javascript
const getProjectNotes = (project) => {
  return notes.filter(note =>
    note.projectTags && note.projectTags.some(tag =>
      project.tags && project.tags.includes(tag)
    )
  );
};
```

This flexible approach allows:
- One note to relate to multiple projects
- Dynamic relationships without foreign keys
- Easy reorganization by changing tags

### Toast Notifications

Auto-dismiss notifications provide user feedback:
- Success messages: 3 seconds
- Error messages: 5 seconds
- Positioned at top-right
- Non-blocking UI interaction

## Deployment

### Netlify Configuration

Configured in `/netlify.toml`:

```toml
[build]
  base = "gestionale-x/"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Important**: Only Gestionale-X is deployed to Netlify. The root `/index.html` and other projects are separate.

### Deployment Process

1. **Push to Git** - Changes are automatically detected
2. **Netlify builds** - Runs `npm run build` in `gestionale-x/`
3. **Deploy** - Publishes to https://gestionalepolpo.netlify.app/
4. **SPA redirect** - All routes redirect to `/index.html` (status 200)

### Build Output

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20
- **Build time**: ~30-60 seconds

## Hidden Easter Egg

The portfolio hub (`/index.html` at root) contains a **long-press Easter egg** on the Polpo logo:
- Hold logo for 1.5 seconds
- Redirects to https://gestionalepolpo.netlify.app/
- Implementation in `/script.js` lines 68-76

This provides a hidden way to access Gestionale-X from the main portfolio.

## Common Issues

### Firebase Errors

**Problem**: "Permission denied" errors
**Solution**: Verify Firestore security rules are deployed and user is authenticated

**Problem**: Data not syncing across devices
**Solution**: Check that `userId` field is properly set on all documents

### Build Issues

**Problem**: Netlify build fails
**Solution**:
- Verify `netlify.toml` base directory is correct
- Check Node version compatibility
- Ensure all dependencies are in `package.json`

### Port Conflicts

**Problem**: Port 5173 already in use
**Solution**:
```bash
# Kill process on port
kill -9 $(lsof -t -i:5173)

# Or use different port
vite --port 5174
```

## Additional Documentation

- **`/SECURITY_SETUP.md`** - Complete Firebase security configuration guide
- **`/firestore.rules`** - Firestore security rules file
- **Root `/CLAUDE.md`** - Repository-wide documentation

---

*Deployed at: https://gestionalepolpo.netlify.app/*
*Status: Production Ready ✅*
