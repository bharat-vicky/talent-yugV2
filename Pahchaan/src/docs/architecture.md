# Clean Architecture

The platform follows a layered Clean Architecture pattern, isolating business logic from framework-specific implementation.

1. **Domain Layer**: Contains business entities, types, and interfaces (e.g. `Repository<T>`). Completely independent of any framework.
2. **Application Layer**: Contains Use Cases/Services orchestrating business logic.
3. **Infrastructure Layer**: Contains external implementations (Database drivers, third-party API clients like Stripe/SendGrid).
4. **Presentation Layer**: Next.js App Router (`app/`), React Components (`components/`, `features/`), and Hooks.

## API Flow
`UI Component` -> `API Route` -> `Service (Application)` -> `Repository (Infrastructure)` -> `MongoDB`
