# Remote-Friendly Café Finder (El Paso MVP)

This Next.js 13 App Router project provides a filterable map and list experience for finding remote-work friendly cafés across El Paso. It includes a fully server-side filtered `/api/places` endpoint backed by a seed JSON repository and a responsive client UI featuring URL-synced filters, geolocation distance search, and MapLibre-based visualization.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to explore the app.

### Available scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – create an optimized production build
- `npm run start` – run the production server
- `npm run lint` – run ESLint with the Next.js core-web-vitals config
- `npm run test` – execute Vitest unit/integration tests

### Resolving merge conflicts

If your branch diverges from `main` (for example, GitHub reports conflicts in
files such as `README.md`, `components/FilterBar.tsx`, or `seed/places.json`),
resolve the conflicts locally before pushing again:

1. Fetch the latest changes and merge them into your branch:

   ```bash
   git fetch origin
   git merge origin/main
   ```

2. Git pauses the merge when a file has competing edits. Open each reported
   file, look for the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), and
   decide how to combine the two versions. Remove the markers after keeping the
   desired code.

3. When every conflict is cleared, mark the files as resolved and complete the
   merge:

   ```bash
   git add <file1> <file2> ...
   git commit
   ```

4. Finally, rerun the automated checks and push the merged branch:

   ```bash
   npm test
   git push
   ```

These steps mirror the GitHub UI prompts shown during a conflicted merge and
keep your branch aligned with the canonical history.

### Testing

Vitest is configured with React Testing Library and jsdom. Coverage focuses on scoring helpers, filter serialization, component behavior, and the API route. Run tests with:

```bash
npm run test
```

### Data source

Seed data lives in `seed/places.json` and is loaded through `lib/repository.ts`. If you provide a Google Places API key via `GOOGLE_PLACES_API_KEY`, the repository will hydrate the catalog with live café listings around El Paso (fetched from the Places Text Search API) and merge them with the seed data. Swap in Postgres or an external data feed by replacing the repository module while keeping the same interface.

### Google Places hydration

1. Create a Google Cloud project with the Places API enabled and generate a restricted API key.
2. Add `GOOGLE_PLACES_API_KEY` to `.env.local` (see above) before starting the dev server.
3. The server will request remote-friendly cafés on first access and cache the normalized results in memory for the life of the process.

If the API key is missing or the request fails, the application automatically falls back to the bundled seed data so the UI and tests continue to operate offline.

Create a `.env.local` file to enable Google Places lookups:

```env
GOOGLE_PLACES_API_KEY=your-api-key
```

Requests are deduplicated and cached in memory so the external API is queried at most once per server instance.

### Future integrations

To ingest live OpenStreetMap/Overpass data, connect the repository layer to your fetch pipeline and persist results before listing them in `/api/places`.
