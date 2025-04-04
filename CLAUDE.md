# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Dev Commands
- `bun run dev`: Start Next.js dev server with Turbopack
- `bun run build`: Build the Next.js application
- `bun run typecheck`: Run TypeScript type checking
- `bun run db:migrate`: Run database migrations for development
- `bun run db:seed`: Seed the development database

## Code Style
- Use tabs for indentation with 2-space width (configured in biome.json)
- Line width: 80 characters max
- Use TypeScript with strict mode enabled
- Import structure: Use `@/*` aliases for internal imports
- Component patterns: Follow shadcn/ui component structure
- Use class-variance-authority for component variants
- Error handling: Use proper type checking and error boundaries
- Naming: React components use PascalCase, functions/variables use camelCase
- Always use proper TypeScript types, avoid `any`
- For CSS, use Tailwind with composition via `cn` utility

## Database
- Use Drizzle ORM for database operations
- Run migrations with `bun run db:migrate`
- Use `bun run db:studio` to view database