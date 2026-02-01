# SalesMind AI Dashboard

A modern sales dashboard for managing leads and launching AI agent calls. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🎯 Complete Sales Flow
1. **Dashboard** - View available agents and leads pipeline
2. **Start Call Modal** - Select agent and configure call parameters
3. **Connecting State** - Animated loading with progress timeline
4. **Agent Ready** - Success confirmation before call starts
5. **Live Call** - Real-time call monitoring with transcript

### 🤖 AI Agents
- Real-time availability status
- Success rate tracking
- Specialty tags (Enterprise, SaaS, Healthcare, etc.)
- Smart agent-lead matching with match scores

### 📊 Leads Management
- Lead status badges (Hot, Warm, Cold, New, Qualified)
- Deal size and company information
- Last contact tracking
- Industry categorization
- Best match agent recommendations

### 🎨 Design System
- **Colors**: Primary (#6567f1) with purple-blue gradient theme
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion with custom keyframes
- **Styling**: Tailwind CSS with HSL-based color system

## Tech Stack

- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool
- **Tailwind CSS 3.4.1** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon system
- **Framer Motion** - Animations

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Main dashboard (Screen 1)
│   │   ├── StartCallModal.tsx       # Agent selection modal (Screen 2)
│   │   ├── CallConnecting.tsx       # Loading state (Screen 3)
│   │   ├── CallReady.tsx            # Success state (Screen 4)
│   │   └── LiveCall.tsx             # Live call monitoring (Screen 5)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── avatar.tsx
│       └── input.tsx
├── types/
│   └── index.ts                      # TypeScript interfaces
├── lib/
│   └── utils.ts                      # Utility functions
├── App.tsx                           # Main app with state management
└── main.tsx                          # Entry point
```

## State Management

The app uses a discriminated union type for state management:

```typescript
type AppState = 
  | { screen: 'dashboard' }
  | { screen: 'start-call-modal'; lead: Lead }
  | { screen: 'connecting'; lead: Lead; agent: Agent }
  | { screen: 'ready'; lead: Lead; agent: Agent }
  | { screen: 'live-call'; lead: Lead; agent: Agent };
```

This ensures type safety throughout the application and makes state transitions explicit.

## Key Components

### DashboardScreen
- 35/65 split layout (agents sidebar / leads table)
- Search and filter functionality
- Real-time agent status indicators
- Match score visualization

### StartCallModal
- Agent selection with recommendation badges
- Call configuration options
- Toggle switches for coaching and escalation
- Responsive 2-column grid layout

### CallConnecting
- Animated phone icon with ping effects
- Progress bar with gradient animation
- Step-by-step timeline with status indicators
- Auto-advances to next screen

### CallReady
- Success confirmation with green check
- Completed timeline visualization
- Auto-advances to live call

### LiveCall
- Live call header with timer
- Audio waveform visualization
- Real-time transcript with speech bubbles
- Call insights and suggestions panel
- Mute/speaker controls

## Customization

### Colors
Edit `tailwind.config.js` to change the primary color:

```javascript
colors: {
  primary: {
    DEFAULT: "#6567f1", // Your color here
  },
}
```

### Mock Data
Edit `App.tsx` to modify `mockAgents` and `mockLeads` arrays.

## Build Output

- **JavaScript**: ~248 KB (76 KB gzipped)
- **CSS**: ~34 KB (6.5 KB gzipped)

## License

MIT
