# Content API Endpoints (`/api/content`)

Documentation for the API endpoints used to update various content types.

**Base URLs:**
- Local: `http://localhost:3000/api/content`
- Production: `https://www.therunclub.xyz/api/content`

**Authorization:** All endpoints require authorization via one of the following methods:
- `x-api-key` header: `-H "x-api-key:  $UPDATE_API_KEY"`
- Cron Secret header: `-H "Authorization: Bearer YOUR_CRON_SECRET"`

**Methods:** `GET`, `POST` (interchangeable for these endpoints)

---

## 1. Update Videos (`type=videos`)

Updates video data for multiple channels based on their `updatedAt` timestamp and other criteria.

**Parameters:**

| Parameter           | Type    | Default        | Description                                                                     |
| ------------------- | ------- | -------------- | ------------------------------------------------------------------------------- |
| `type`              | String  | **Required**   | Must be `videos`.                                                               |
| `updateStrategy`    | String  | `null`         | If set to `lastUpdated`, fetches channels based *only* on `updatedAt` time.     |
| `minHoursSinceUpdate`| Number  | `24`           | How many hours back to check for channels needing updates (based on `updatedAt`). |
| `channelLimit`      | Number  | `50`           | Maximum number of channels to process in one run.                               |
| `videosPerChannel`  | Number  | `10`           | Maximum number of videos to fetch/update per channel.                           |
| `maxVideos`         | Number  | `videosPerChannel` | Total maximum number of videos to process across all channels? (Seems redundant). |
| `randomSample`      | Boolean | `false`        | If `true`, processes a random sample of channels needing update.               |
| `importTypeFilter`  | String  | `full_channel` | Filters channels by import type (`full_channel`, `selected_videos`, `none`).    |

**Example (Local):** Update the 10 most recently updated channels (full_channel type), processing up to 5 videos each.
```bash
curl -X GET "http://localhost:3000/api/content?type=videos&updateStrategy=lastUpdated&channelLimit=10&videosPerChannel=5&importTypeFilter=full_channel" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=videos&updateStrategy=lastUpdated&channelLimit=10&videosPerChannel=5&importTypeFilter=full_channel" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 2. Update Specific Channel Videos (`type=channel-videos`)

Force-updates all videos for a specific YouTube channel, regardless of timestamps.

**Parameters:**

| Parameter   | Type   | Default      | Description                             |
| ----------- | ------ | ------------ | --------------------------------------- |
| `type`      | String | **Required** | Must be `channel-videos`.               |
| `channelId` | String | **Required** | The YouTube Channel ID (`UC...`) to update. |

**Example (Local):** Update all videos for channel `UCXXXXXXXXXXXXXXXXXXXXXX`.
```bash
curl -X GET "http://localhost:3000/api/content?type=channel-videos&channelId=UCXXXXXXXXXXXXXXXXXXXXXX" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=channel-videos&channelId=UCXXXXXXXXXXXXXXXXXXXXXX" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 3. Update Channel Colors (`type=channel-colors`)

Extracts and saves vibrant colors from channel thumbnails for channels that don't have one yet (where `vibrantColor` is `null`).

**Parameters:**

| Parameter | Type   | Default      | Description              |
| --------- | ------ | ------------ | ------------------------ |
| `type`    | String | **Required** | Must be `channel-colors`. |

**Example (Local):**
```bash
curl -X GET "http://localhost:3000/api/content?type=channel-colors" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=channel-colors" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 4. Update Podcasts (`type=podcasts`)

Updates podcast metadata and fetches new episodes based on the feed's `lastBuildDate` or the podcast's `updatedAt` timestamp.

**Parameters:**

| Parameter           | Type    | Default      | Description                                                                       |
| ------------------- | ------- | ------------ | --------------------------------------------------------------------------------- |
| `type`              | String  | **Required** | Must be `podcasts`.                                                               |
| `minHoursSinceUpdate`| Number  | `24`           | How many hours back to check for podcasts needing updates (`updatedAt` or `lastBuildDate`). |
| `limit`             | Number  | `50`           | Maximum number of podcasts to process in one run.                                 |
| `randomSample`      | Boolean | `false`        | If `true`, processes a random sample of podcasts needing update.                 |

**Example (Local):** Update up to 20 podcasts that haven't been updated in the last 12 hours.
```bash
curl -X GET "http://localhost:3000/api/content?type=podcasts&limit=20&minHoursSinceUpdate=12" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=podcasts&limit=20&minHoursSinceUpdate=12" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 5. Update Athletes (`type=athletes`)

Imports or updates athlete data from the World Athletics API. Filters based on internal logic, not simple timestamps.

**Parameters:**

| Parameter | Type   | Default      | Description                                         |
| --------- | ------ | ------------ | --------------------------------------------------- |
| `type`    | String | **Required** | Must be `athletes`.                                 |
| `limit`   | Number | `50`           | Maximum number of athletes to import/update per run.  |

**Example (Local):** Import/update up to 100 athletes.
```bash
curl -X GET "http://localhost:3000/api/content?type=athletes&limit=100" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=athletes&limit=100" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 6. Detect Athlete Mentions in Episodes (`type=athlete-detection`)

Scans podcast episodes published within a specific timeframe for athlete mentions.

**Parameters:**

| Parameter    | Type   | Default      | Description                                                                       |
| ------------ | ------ | ------------ | --------------------------------------------------------------------------------- |
| `type`       | String | **Required** | Must be `athlete-detection`.                                                      |
| `maxAgeHours`| Number | `24`           | Process episodes with a `pubDate` within the last `maxAgeHours` hours.            |
| `batchSize`  | Number | `10`           | Maximum number of episodes to process in one run (that meet the `maxAgeHours` criteria). |

**Example (Local):** Process the 5 newest episodes published in the last 6 hours.
```bash
curl -X GET "http://localhost:3000/api/content?type=athlete-detection&maxAgeHours=6&batchSize=5" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=athlete-detection&maxAgeHours=6&batchSize=5" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 7. Detect Athlete Mentions in Videos (`type=video-mentions`)

Scans videos created within a specific timeframe for athlete mentions.

**Parameters:**

| Parameter    | Type   | Default      | Description                                                                       |
| ------------ | ------ | ------------ | --------------------------------------------------------------------------------- |
| `type`       | String | **Required** | Must be `video-mentions`.                                                         |
| `maxAgeHours`| Number | `24`           | Process videos with a `createdAt` within the last `maxAgeHours` hours.            |
| `batchSize`  | Number | `10`           | Maximum number of videos to process in one run (that meet the `maxAgeHours` criteria). |

**Example (Local):** Process the 15 newest videos created in the last 48 hours.
```bash
curl -X GET "http://localhost:3000/api/content?type=video-mentions&maxAgeHours=48&batchSize=15" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=video-mentions&maxAgeHours=48&batchSize=15" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 8. Update Podcast Rankings (`type=podcast-rankings`)

Updates podcast rankings using the Taddy service.

**Parameters:**

| Parameter | Type   | Default      | Description                 |
| --------- | ------ | ------------ | --------------------------- |
| `type`    | String | **Required** | Must be `podcast-rankings`. |

**Example (Local):**
```bash
curl -X GET "http://localhost:3000/api/content?type=podcast-rankings" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=podcast-rankings" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

---

## 9. Tagging (`type=tagging`)

This endpoint type is handled by `/api/tagging`. Calling this endpoint (`/api/content?type=tagging`) will return a message directing you to the correct endpoint.

**Parameters:**

| Parameter | Type   | Default      | Description          |
| --------- | ------ | ------------ | -------------------- |
| `type`    | String | **Required** | Must be `tagging`.   |

**Example (Local - Informational Only):**
```bash
curl -X GET "http://localhost:3000/api/content?type=tagging" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

**Example (Production - Informational Only):**
```bash
curl -X GET "https://www.therunclub.xyz/api/content?type=tagging" \
  -H "x-api-key:  $UPDATE_API_KEY"
``` 