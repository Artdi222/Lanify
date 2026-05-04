# Lanify Frontend

## Description
Lanify is a web-based rhythm game platform. It allows users to play vertical scrolling rhythm games in the browser. The application includes a rendering engine for gameplay, audio synchronization logic, and a system for managing beatmap data.

## Technical Stack
The project is built using the following technologies:

### Core Frameworks
- Next.js 16 (App Router): Handles routing and navigation.
- React 19: Used for building the user interface.
- TypeScript: Provides type checking for the codebase.

### Performance and Rendering
- PIXI.js 7: A 2D engine used for rendering gameplay elements.
- Framer Motion: Used for UI transitions and animations.

### Audio Engine
- Howler.js: Manages audio playback and seeking.
- Timing Logic: Uses performance.now() for timing interpolation during gameplay.

### State Management
- Zustand: Manages global application state, including settings and session data.

### Styling and UI
- Tailwind CSS 4: Used for styling the application.
- Shadcn/UI: A set of UI components built with Radix UI.
- Lucide React: Provides icons for the interface.

### Beatmap Processing
- Custom Parsers: Utilities like `OszInspector` that manually parse `.osz` archives and `.osu` files locally using `jszip` to extract metadata and hit objects.

## Key Features
- Song Selection: Interface for browsing and selecting beatmaps.
- Gameplay Engine: Supports standard and hold notes with configurable scroll speeds.
- Music Player: A global player for audio playback across the site.
- Leaderboards: Displays scores and rankings from the backend.
- Settings: Configuration options for volume, offsets, and visuals.
- Admin Dashboard: Tools for beatmap management, including automated star rating calculation via backend integration.

## Getting Started

### Prerequisites
- Bun runtime
- Node.js (version 20 or higher)

### Installation
Install dependencies:

```bash
bun install
```

### Development
Start the development server:

```bash
bun dev
```

The application will be available at http://localhost:3000.

### Production Build
Build and start the application:

```bash
bun run build
bun start
```

## Project Structure
- /app: Routes and page components.
- /components: UI components for game, admin, and general use.
- /lib: Core logic, API utilities, and state stores.
- /public: Static assets.
- /types: Type definitions.
