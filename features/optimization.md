# Performance Optimization Plan

## Overview
This document outlines our plan to optimize the performance of The Run Club website to match or exceed the performance of Nextfast. The plan focuses on implementing aggressive caching, proper static generation, and optimized data fetching strategies.

## Current State
- Main pages (`/`, `/videos`, `/podcasts`) update once per hour
- Individual content pages (slugs) are rarely updated
- Data is mostly static with infrequent updates
- Current implementation has some performance bottlenecks

## Optimization Phases

### Phase 1: Caching Strategy Optimization
- [x] Implement aggressive static generation with ISR
  - [x] Set 24-hour revalidation for main listing pages
  - [x] Set 1-week revalidation for individual content pages
  - [x] Implement `generateStaticParams` for all dynamic routes
  - [x] Optimize parallel data fetching with `Promise.all`

- [x] Implement granular caching for data fetching
  - [x] Create new caching layer using `unstable_cache` with React's `cache`
  - [x] Cache expensive database queries
  - [x] Implement stale-while-revalidate pattern
  - [x] Add cache tags for better cache invalidation

### Phase 2: Component Architecture Optimization
- [x] Break down large pages into smaller streaming components
  - [x] Split `page.tsx` into separate streaming sections
  - [x] Implement proper Suspense boundaries
  - [x] Add loading states for each section
  - [x] Use `loading.tsx` for better loading UX

- [ ] Implement proper code splitting
  - [ ] Use dynamic imports for non-critical components
  - [ ] Lazy load below-the-fold content
  - [ ] Implement proper chunking strategies

### Phase 3: Data Fetching Optimization
- [ ] Optimize database queries
  - [ ] Implement query caching
  - [ ] Add proper indexes
  - [ ] Optimize JOIN operations
  - [ ] Implement proper pagination

- [ ] Implement proper data preloading
  - [ ] Preload critical data
  - [ ] Implement proper data prefetching
  - [ ] Use `generateMetadata` for better SEO

### Phase 4: Asset Optimization
- [ ] Implement proper image optimization
  - [ ] Use proper image sizes
  - [ ] Implement proper lazy loading
  - [ ] Use proper image formats
  - [ ] Implement proper image caching

- [ ] Implement proper font optimization
  - [ ] Use proper font loading strategies
  - [ ] Implement proper font subsetting
  - [ ] Use proper font formats

### Phase 5: Performance Monitoring
- [ ] Implement proper performance monitoring
  - [ ] Add proper performance metrics
  - [ ] Implement proper error tracking
  - [ ] Add proper analytics
  - [ ] Implement proper logging

## Progress Tracking

### Completed Tasks
- [x] Created reusable caching layer in `src/lib/utils/cache.ts`
- [x] Updated homepage to use 24-hour revalidation
- [x] Updated videos page to use 24-hour revalidation 
- [x] Updated podcasts page to use 24-hour revalidation
- [x] Implemented parallel data fetching for all main pages
- [x] Added preloading for all main pages
- [x] Updated podcast detail page to use weekly caching
- [x] Updated podcast episode page to use weekly caching
- [x] Updated video detail page to use weekly caching
- [x] Implemented proper data caching on detail pages
- [x] Split homepage into smaller streaming components
- [x] Added proper Suspense boundaries on homepage
- [x] Created appropriate loading skeletons for each component

### In Progress
- [ ] Implement proper code splitting

### Next Steps
1. Begin implementing code splitting and lazy loading for below-the-fold content
2. Use dynamic imports for non-critical components
3. Begin implementing Phase 3: Data Fetching Optimization

## Performance Metrics
We will track the following metrics to measure our progress:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

## Notes
- All changes should be implemented incrementally
- Each phase should be tested thoroughly before moving to the next
- Performance metrics should be collected before and after each major change
- Regular performance audits should be conducted 