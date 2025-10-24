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

### Testing

Vitest is configured with React Testing Library and jsdom. Coverage focuses on scoring helpers, filter serialization, component behavior, and the API route. Run tests with:

```bash
npm run test
```

### Data source

Seed data lives in `seed/places.json` and is loaded through `lib/repository.ts`. Swap in Postgres or an external data feed by replacing the repository module while keeping the same interface.

### Future integrations

To ingest live OpenStreetMap/Overpass data, connect the repository layer to your fetch pipeline and persist results before listing them in `/api/places`.
