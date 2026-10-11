# API Architecture

The application implements a strict layered architecture for API calls to ensure decoupling from the UI.

1. **API Client**: (e.g. React Query hooks or fetch wrappers) initiates the request from the UI.
2. **Next.js API Route**: (`app/api/.../route.ts`) acts as the Controller. Validates incoming requests and formats responses.
3. **Service Layer**: (`src/application/`) executes core business logic.
4. **Repository Layer**: (`src/infrastructure/`) interacts with the database.

**Rule**: UI Components must **never** call the database or third-party APIs directly.
