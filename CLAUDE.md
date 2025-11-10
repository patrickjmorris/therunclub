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

### Supabase Database Access
Access the production Supabase database using psql:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM podcasts;"
```

Common queries for debugging:
```bash
# Check podcast rankings count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM podcast_rankings;"

# Check latest podcast rankings
psql $DATABASE_URL -c "SELECT pr.rank, pr.podcast_name, pr.itunes_id FROM podcast_rankings pr ORDER BY pr.created_at DESC, pr.rank LIMIT 10;"

# Check athlete mentions within timeframe
psql $DATABASE_URL -c "SELECT COUNT(*) FROM athlete_mentions WHERE created_at >= NOW() - INTERVAL '365 days';"

# Check athlete mentions date range
psql $DATABASE_URL -c "SELECT MIN(created_at) as earliest, MAX(created_at) as latest FROM athlete_mentions;"

# Check distinct athletes mentioned
psql $DATABASE_URL -c "SELECT COUNT(DISTINCT athlete_id) FROM athlete_mentions WHERE created_at >= NOW() - INTERVAL '365 days';"
```