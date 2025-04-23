# The Run Club
The Run Club website

## Features

### Dynamic Open Graph (OG) Images

This project automatically generates custom Open Graph images for podcasts, episodes, videos, and athletes to improve social sharing previews.

- Images are generated dynamically using Next.js Route Handlers (`opengraph-image.tsx`) located alongside the relevant page components (e.g., `src/app/podcasts/[podcast]/opengraph-image.tsx`).
- A reusable template (`src/components/og/OgImageTemplate.tsx`) defines the standard layout, incorporating the content's title and cover image against a branded background.
- Fallback OG images (`src/app/opengraph-image.tsx` and `src/app/twitter-image.tsx`) are provided for pages without specific content or if dynamic generation fails. These display the site logo.
- Caching is handled via time-based revalidation in the route handlers and path-based revalidation (`revalidatePath`) triggered by content updates in server actions (e.g., `src/lib/podcast-service.ts`, `src/app/athletes/[slug]/actions.ts`).

### Environment Variables

- `NEXT_PUBLIC_BASE_URL`: **Required**. The public base URL of the deployment (e.g., `https://www.therunclub.com` or the Vercel preview URL). This is used by the OG image templates to construct absolute URLs for assets like the logo.