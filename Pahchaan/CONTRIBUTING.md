# Contributing to Identify

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Qr-code-identify.git`
3. Install dependencies: `npm install` (from the `Identify/` directory)
4. Copy `.env.local.example` to `.env.local` and fill in your credentials
5. Start the dev server: `npm run dev`

## Code Standards

- **TypeScript**: Strict mode is enforced. Avoid `any` types.
- **Linting**: Run `npm run lint` before submitting. PRs must pass lint checks.
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- **Architecture**: Follow the Clean Architecture pattern — new features go in `application/services/`, data access in `infrastructure/repositories/`.

## Submitting a PR

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes
3. Run `npm run lint` and `npm run typecheck`
4. Submit a PR with a clear description of the change and its motivation

## Reporting Issues

Open a GitHub Issue with a clear title, reproduction steps, and expected vs. actual behavior.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
