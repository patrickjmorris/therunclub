# Athlete System Implementation Plan

## Overview
This plan outlines the implementation of several improvements to the athlete system, including:
- Reducing reliance on World Athletics API
- Enabling manual athlete creation
- Adding athlete categories
- Improving data update mechanisms
- Adding Strava integration

## 1. Database Schema Updates

### A. Athlete Categories
1. Create new `athlete_categories` table:
```sql
CREATE TABLE athlete_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

2. Insert initial categories:
- Elite (World Athletics athletes)
- Sub-elite (competitive but not World Athletics)
- Coach
- Content Creator
- Casual Runner

### B. Athletes Table Updates
1. Add new UUID primary key
2. Rename existing ID to world_athletics_id
3. Add category relationship
4. Update social media JSON structure

```sql
ALTER TABLE athletes
    ADD COLUMN uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    RENAME COLUMN id TO world_athletics_id,
    ADD COLUMN category_id UUID REFERENCES athlete_categories(id),
    ADD CONSTRAINT unique_world_athletics_id UNIQUE (world_athletics_id),
    ADD CONSTRAINT elite_athletes_require_world_athletics_id 
        CHECK (category_id != 'elite' OR world_athletics_id IS NOT NULL);
```

### C. Related Tables Updates
1. Update foreign key references in:
- athleteHonors
- athleteResults
- athleteSponsors
- athleteGear
- athleteEvents
- athleteMentions

## 2. Drizzle Schema Updates

### A. New Types and Enums
```typescript
export const athleteCategories = pgTable('athlete_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export type AthleteCategory = typeof athleteCategories.$inferSelect;
export type NewAthleteCategory = typeof athleteCategories.$inferInsert;
```

### B. Updated Athletes Schema
```typescript
export const athletes = pgTable('athletes', {
    uuid: uuid('uuid').primaryKey().defaultRandom(),
    worldAthleticsId: text('world_athletics_id').unique(),
    categoryId: uuid('category_id').references(() => athleteCategories.id),
    // ... existing fields ...
    socialMedia: jsonb('social_media').$type<{
        twitter?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
        strava?: string;
    }>(),
});
```

## 3. Migration Strategy

### A. Schema Updates
1. Update Drizzle schema files:
   - Add `athleteCategories` table definition
   - Modify `athletes` table with new structure
   - Update all related table references

2. Use Drizzle's codebase-first approach:
   ```bash
   # Generate migration files
   bun run db:generate
   
   # Push schema changes directly to database
   bun run db:migrate
   ```

3. Handle data migration:
   ```typescript
   // scripts/migrate-athletes.ts
   import { db } from "@/db/client";
   import { athletes, athleteCategories } from "@/db/schema";
   import { eq } from "drizzle-orm";
   
   async function migrateAthletes() {
     // 1. Create elite category
     const eliteCategory = await db.insert(athleteCategories).values({
       name: "Elite",
       description: "World Athletics athletes"
     }).returning();
   
     // 2. Update existing athletes
     await db.update(athletes)
       .set({
         categoryId: eliteCategory[0].id,
         worldAthleticsId: sql`id` // Copy existing ID to new column
       })
       .where(sql`id IS NOT NULL`);
   
     // 3. Verify data integrity
     const athleteCount = await db.select({ count: sql`count(*)` }).from(athletes);
     console.log(`Migrated ${athleteCount[0].count} athletes`);
   }
   ```

### B. Development Workflow
1. Local Development:
   ```bash
   # Start development server with schema push enabled
   bun run db:migrate
   ```

2. Staging/Production:
   ```bash
   # Generate migration files
   bun run db:generate
   
   # Review generated SQL
   # Apply migrations
   bun run db:migrate:prod
   ```

### C. Rollback Strategy
1. Schema Rollback:
   ```typescript
   // scripts/rollback-athletes.ts
   import { db } from "@/db/client";
   import { athletes } from "@/db/schema";
   
   async function rollbackAthletes() {
     // 1. Restore original ID column
     await db.execute(sql`
       ALTER TABLE athletes
       RENAME COLUMN world_athletics_id TO id;
       
       ALTER TABLE athletes
       DROP COLUMN uuid;
       
       ALTER TABLE athletes
       DROP COLUMN category_id;
     `);
   }
   ```

2. Data Rollback:
   ```typescript
   // Backup data before migration
   await db.execute(sql`
     CREATE TABLE athletes_backup AS 
     SELECT * FROM athletes;
   `);
   ```

### D. Verification Steps
1. Schema Verification:
   ```typescript
   // scripts/verify-schema.ts
   import { db } from "@/db/client";
   import { athletes, athleteCategories } from "@/db/schema";
   
   async function verifySchema() {
     // Check athlete categories
     const categories = await db.select().from(athleteCategories);
     console.log("Categories:", categories);
   
     // Check athlete references
     const athletesWithCategories = await db
       .select()
       .from(athletes)
       .leftJoin(athleteCategories, eq(athletes.categoryId, athleteCategories.id));
     console.log("Athletes with categories:", athletesWithCategories);
   }
   ```

2. Data Integrity Checks:
   ```typescript
   // Verify no data loss
   const originalCount = await db.execute(sql`
     SELECT COUNT(*) FROM athletes_backup
   `);
   const newCount = await db.execute(sql`
     SELECT COUNT(*) FROM athletes
   `);
   
   if (originalCount !== newCount) {
     throw new Error("Data loss detected during migration");
   }
   ```

## 4. UI Implementation

### A. Athlete Creation Modal
1. Create new server action for athlete creation
2. Implement form with fields:
   - Basic Info (name, country, DOB)
   - Category Selection
   - World Athletics ID (optional)
   - Social Media Links
   - Profile Image
3. Add validation rules
4. Implement error handling
5. Add success notifications

### B. Category Management
1. Add category management UI for admins
2. Implement CRUD operations for categories
3. Add validation to prevent category deletion if in use

## 5. API Updates

### A. World Athletics Integration
1. Update import functions to handle new schema
2. Add validation for World Athletics ID uniqueness
3. Update error handling for API failures

### B. New API Endpoints
1. Create athlete
2. Update athlete
3. Delete athlete
4. List categories
5. Manage categories

## 6. Testing Strategy

### A. Unit Tests
1. Schema validation
2. Data transformation
3. API integration
4. Form validation

### B. Integration Tests
1. Database operations
2. API endpoints
3. UI components
4. Server actions

### C. End-to-End Tests
1. Athlete creation flow
2. Category management
3. World Athletics data updates

## 7. Implementation Phases

### Phase 1: Database Updates
1. Create migration scripts
2. Update schema
3. Migrate data
4. Verify integrity

### Phase 2: Core Functionality
1. Implement athlete creation
2. Add category management
3. Update existing queries
4. Add validation

### Phase 3: UI/UX
1. Create athlete form modal
2. Add category management UI
3. Implement error handling
4. Add loading states

### Phase 4: Testing & Deployment
1. Write tests
2. Perform testing
3. Deploy changes
4. Monitor for issues

## 8. Rollback Plan

### A. Database Rollback
1. Backup before migration
2. Create rollback scripts
3. Test rollback procedures

### B. Application Rollback
1. Version control
2. Feature flags
3. Monitoring

## 9. Post-Implementation Tasks

### A. Documentation
1. Update API documentation
2. Add migration guides
3. Update user guides

### B. Monitoring
1. Add logging
2. Set up alerts
3. Monitor performance

## 10. Future Considerations

### A. Potential Enhancements
1. Bulk athlete import
2. Advanced Strava integration
3. Athlete verification system
4. Community features

### B. Scalability
1. Caching strategy
2. Performance optimization
3. Data archival 