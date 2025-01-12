#!/bin/bash

# Local PostgreSQL connection string from .env
DATABASE_URL="postgresql://therunclubuser:therunclubpass@localhost:5432/therunclubdb"

# Create exports directory if it doesn't exist
mkdir -p exports

# Export only athlete-related tables from local database
pg_dump "$DATABASE_URL" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --no-comments \
    --table=public.athletes \
    --table=public.athlete_honors \
    --table=public.athlete_results \
    --table=public.athlete_sponsors \
    --table=public.athlete_gear \
    --table=public.athlete_events \
    --file=exports/athletes.sql

echo "✅ Export completed! The data has been saved to exports/athletes.sql"
echo ""
echo "To import this data into Supabase, use:"
echo "PGSSLMODE=require psql YOUR_SUPABASE_DATABASE_URL -f exports/athletes.sql"
echo ""
echo "Get your Supabase connection string from:"
echo "Project Settings -> Database -> Connection string -> URI" 