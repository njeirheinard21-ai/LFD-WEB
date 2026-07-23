# Developer Onboarding

Welcome to the Optimal Healthcare engineering team!

## Project Structure
- `/src/components` - Reusable UI components (buttons, navbars, modals).
- `/src/pages` - Route-level page components (lazy-loaded).
- `/src/lib` - Core utilities, Firebase configuration, logger, pricing constants, and AI services.
- `/src/locales` - i18n translation files.
- `/docs` - Architecture and operational documentation.

## Setup Instructions
1. Clone the repository.
2. Run `npm install`.
3. Set up your local `.env.local` using `.env.example` (ensure `VITE_GEMINI_API_KEY` is present if testing AI capabilities locally).
4. Run `npm run dev` to start the Vite development server.

## Coding Standards
- **TypeScript**: No `any` types allowed. Use `unknown` and type guards.
- **Styling**: Tailwind CSS exclusively.
- **Commits**: Follow conventional commits (e.g., `feat:`, `fix:`, `chore:`).
- **Error Handling**: Use `try/catch` and `logger.error()`. Never swallow exceptions silently.
