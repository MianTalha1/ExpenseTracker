# Casha - Personal Expense Tracker

A modern expense tracking application with AI-powered insights, built with a Bento grid design system.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS + Recharts
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT + bcrypt
- **AI**: OpenRouter API (for insights)
- **Mobile**: Capacitor (Android)
- **Package Manager**: pnpm monorepo

## Project Structure

```
casha/
├── apps/
│   ├── frontend/          # React + Vite application
│   │   ├── src/
│   │   │   ├── app/       # Route-based pages
│   │   │   ├── components/
│   │   │   │   ├── atoms/      # Basic UI components
│   │   │   │   ├── molecules/  # Composite components
│   │   │   │   ├── organisms/  # Complex components
│   │   │   │   └── templates/  # Page layouts
│   │   │   └── lib/
│   │   │       ├── api/        # API client & repositories
│   │   │       ├── context/    # React contexts
│   │   │       └── utils/      # Utility functions
│   │   └── ...
│   │
│   └── tracker-api/       # Express.js API
│       ├── src/
│       │   ├── db/        # Drizzle schema & connection
│       │   ├── middleware/
│       │   └── routes/    # API endpoints
│       └── ...
│
├── packages/
│   └── shared/            # Shared types & utilities
│       └── src/
│           ├── types/     # TypeScript types
│           ├── constants/ # Shared constants
│           └── utils/     # Utility functions
│
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd Expense-tracker
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

3. **Set up the database**:
   ```bash
   # Create database
   createdb casha

   # Run migrations
   pnpm db:push
   ```

4. **Start development servers**:
   ```bash
   # Start both frontend and API
   pnpm dev

   # Or start individually
   pnpm dev:frontend  # http://localhost:5173
   pnpm dev:api       # http://localhost:3001
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all services in development mode |
| `pnpm dev:frontend` | Start frontend only |
| `pnpm dev:api` | Start API only |
| `pnpm build` | Build all packages |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed database (creates test@example.com / password123) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/budgets` | List budgets with progress |
| POST | `/api/budgets` | Create budget |
| GET | `/api/insights/summary` | Spending summary |
| GET | `/api/insights/trends` | Period comparison |
| POST | `/api/insights/ai-advice` | AI recommendations |

## Design System

Casha uses a **Bento Grid** design language:

- Modular card-based layouts
- 16px border radius (rounded-bento)
- Subtle shadows for depth
- Clean typography with Inter font
- Primary color: Emerald (#10B981)

### Component Architecture

Following **Atomic Design** principles:

- **Atoms**: BentoCard, Button, Input, Badge, ProgressBar
- **Molecules**: FormField, StatCard, ExpenseItem
- **Organisms**: LoginForm, Sidebar, TopBar, ExpenseList
- **Templates**: AuthLayout, AppShell, ProtectedRoute

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/casha

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# API
API_PORT=3001
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3001

# Optional: AI Insights
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Mobile App (Android)

Casha includes Capacitor for building a native Android app.

### Prerequisites

- Android Studio installed
- Android SDK configured

### Mobile Scripts

| Script | Description |
|--------|-------------|
| `pnpm --filter frontend cap:build` | Build frontend + sync to Android |
| `pnpm --filter frontend cap:sync` | Sync web assets to Android |
| `pnpm --filter frontend cap:android` | Open project in Android Studio |

### Building for Android

1. **Configure API URL** (required for mobile):
   ```bash
   # Edit apps/frontend/.env
   VITE_API_URL=https://your-api-server.com
   ```
   > Note: `localhost` won't work on mobile - use your server URL or computer's IP for local testing.

2. **Build and sync**:
   ```bash
   pnpm --filter frontend cap:build
   ```

3. **Open in Android Studio**:
   ```bash
   pnpm --filter frontend cap:android
   ```

4. **Run on device/emulator** from Android Studio.

### Local Testing

To test with your local API server:
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Set `VITE_API_URL=http://192.168.x.x:3001` in `.env`
3. Ensure phone and computer are on the same WiFi network
4. Rebuild: `pnpm --filter frontend cap:build`

## License

MIT