# Folder Structure

```
src/
├── app/               # Next.js App Router (Pages, API Routes, Layouts)
├── features/          # Feature-specific modules containing their own components, hooks, logic
├── shared/            # Shared components and utilities across multiple features
├── components/        # Reusable UI components (Design System, App Shell)
├── domain/            # Entities, Interfaces, Types
├── application/       # Services and Use Cases
├── infrastructure/    # Database configuration, external APIs, Repository implementations
├── providers/         # Global React Context Providers
├── hooks/             # Global Custom Hooks
├── lib/               # Third-party library initializations (Auth.js, etc.)
├── config/            # Application configuration
├── types/             # Global TypeScript types
├── constants/         # Global Constants
├── styles/            # Global CSS (Tailwind variables)
└── docs/              # Project Documentation
```
