# DayCast Web

React SPA frontend for DayCast — a personal AI-powered service that transforms daily inputs into tailored content for multiple channels.

Built with React 19, TypeScript, Vite, and React Router.

## Pages

- **Feed** — chat-like input stream. Add text, links (with URL extraction), and photos. Edit and delete items. Star importance rating (1–5). AI toggle to include/exclude items from generation. Edit history viewer. Export day as text. Publish input items directly. Drag & drop support. "Clear day" soft-deletes all items.
- **Generate** — trigger AI generation for all active channels. View results as cards with Copy button. Regenerate per-channel or all. Generate New button for fresh generation with updated settings. Switch between multiple generations per day. Publish/unpublish results to the public blog.
- **Channels** — configure which channels are active. Set default style, language, and output length per channel. Generation settings: custom AI instruction and separate business/personal toggle. All settings auto-save on change (debounced).
- **History** — browse past days with search. Click into a day to see all inputs (with cleared/edited badges) and all generations. Copy any result. View edit history for modified items. Publish/unpublish from history detail.
- **Login / Register** — username + password authentication. JWT stored in localStorage. Auto-redirect to login page without token. Auto-logout on 401.

## Tech Stack

- **React 19** with functional components and hooks
- **TypeScript 5.7**
- **Vite 6** — dev server with API proxy, production builds
- **React Router 7** — client-side routing
- **CSS** — custom styles (no framework), CSS variables for theming

## Project Structure

```
daycast-web/
├── src/
│   ├── api/client.ts         # API client (fetch wrapper, JWT auth, auto-logout)
│   ├── components/
│   │   ├── Layout.tsx        # App shell with navigation
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Feed.tsx          # Input stream (main page)
│   │   ├── Generate.tsx      # AI generation results
│   │   ├── Channels.tsx      # Channel settings
│   │   ├── History.tsx       # Day list with search
│   │   ├── HistoryDetail.tsx # Single day detail view
│   │   ├── Login.tsx         # Login / Register page
│   │   └── Login.css
│   ├── types/index.ts        # TypeScript types (mirrors API schemas)
│   ├── hooks/                # (reserved)
│   ├── main.tsx              # App entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 5173, proxies /api to localhost:8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server proxies `/api` requests to `http://localhost:8000` (the API backend).

## Production

The production build (`npm run build` → `dist/`) is served by the API backend directly. No separate web server needed.

Deploy is handled from the API repo:
```bash
cd ../daycast-api
make deploy-mac
```

This builds the web, copies `dist/` to the Mac, and the API serves it as static files.

## API Integration

The web app communicates with the backend via REST API at `/api/v1/`. Authentication is via JWT — token stored in localStorage and sent as `Authorization: Bearer` header with every request. On 401 response, the user is automatically logged out and redirected to `/login`.

Key API calls:
- `GET/POST/PUT/DELETE /api/v1/inputs` — manage input items
- `POST /api/v1/generate` — trigger AI content generation
- `GET /api/v1/days` — browse history
- `GET/POST /api/v1/settings/channels` — channel configuration
- `GET/POST /api/v1/settings/generation` — generation settings (custom instruction, business/personal)
- `GET /api/v1/channels`, `/styles`, `/languages`, `/lengths` — catalog data
- `POST /api/v1/publish`, `DELETE /api/v1/publish/{id}`, `GET /api/v1/publish/status` — publishing (generation results)
- `POST /api/v1/publish/input`, `GET /api/v1/publish/input-status` — publishing (input items)
- `GET /api/v1/inputs/export?date=&format=` — export day as text

## License

Private project.
