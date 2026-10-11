# Database Architecture

We use **MongoDB** with the Native Node.js Driver (not Mongoose).

- Connection logic is managed in `src/infrastructure/db.ts` utilizing `clientPromise` to handle hot reloads in development.
- Data access is mediated through the **Repository Pattern**.
- All repositories must implement the generic `Repository<T>` interface defined in `src/domain/repository.ts`.
