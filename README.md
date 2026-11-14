# train-ticket-graph-frontend

A demo frontend for the service-graph query API
([`train-ticket-graph-api`](../train-ticket-graph-api)). It draws the full
service call graph and lets you explore the routes that match the backend's
filters, such as routes that start at a public service, end in a database, or
pass through a vulnerable service.

## What it does

- Draws the whole graph from `GET /graph` in a left-to-right layered layout,
  with zoom, pan, fit-to-view and a minimap.
- Builds the filter toggles from `GET /filters`. No filter name is hard-coded,
  so a filter added to the backend appears here without a code change.
- Calls `GET /routes` when filters or the All/Any match mode change, then
  highlights the matching nodes and edges. Everything else is dimmed, not
  removed, and highlighted edges are animated in the call direction.
- Lists the matching routes with a count. Hover a route to preview it alone on
  the graph; click to pin it and zoom to it.
- Opens a details panel when you click a node: kind, exposure, vulnerabilities
  (severity, message, file), callers and callees, and a note for placeholder
  nodes.
- Shows separate loading, backend-unreachable, API-error and "no routes match"
  states. Zero routes (for example `public` + `sink` with match All) is a
  neutral empty state, not an error.

## Run locally

Requires Node 20.19+ (or 22.12+).

1. Start the backend. It listens on `http://localhost:3000` and already allows
   the Vite dev origin `http://localhost:5173` outside production:

   ```sh
   cd ../train-ticket-graph-api
   npm install
   npm run dev
   ```

2. Start the frontend:

   ```sh
   npm install
   cp .env.example .env   # optional; the default already points at localhost:3000
   npm run dev
   ```

3. Open <http://localhost:5173>.

If Vite picks another port because 5173 is taken, add that origin to the
backend's `ALLOWED_ORIGINS`, or the browser will block the requests and the
app will show "Can't reach the graph API".

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the production build locally |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the graph API, without a trailing slash |

Vite inlines `VITE_*` variables at build time, so changing the value requires
a rebuild (on Vercel, a redeploy).

## Deploy on Vercel

1. Import this repository in Vercel. It detects Vite; keep the defaults
   (build command `npm run build`, output directory `dist`).
2. Under **Settings → Environment Variables**, set `VITE_API_URL` to the
   deployed backend URL, for example `https://my-graph-api.vercel.app`.
3. Deploy, and note the frontend URL.
4. In the **backend** project, add the frontend URL to `ALLOWED_ORIGINS`
   (comma-separated exact origins, no trailing slash), for example
   `https://my-graph-frontend.vercel.app`, and redeploy the backend. In
   production the backend allows no origins by default.

Preview deployments get their own URLs, so each one you want to use must be
added to `ALLOWED_ORIGINS` as well.

## Project structure

```
src/
  api/
    client.ts        fetch wrapper, VITE_API_URL, typed ApiError
    types.ts         API response types
  hooks/
    useAsync.ts      shared request state with abort and retry
    useGraph.ts      GET /graph, then layout
    useFilters.ts    GET /filters
    useRoutes.ts     GET /routes for the selected filters and match mode
  lib/
    layout.ts        elkjs layered layout (lazy-loaded)
    nodeStyle.ts     node kind → icon, shape and colour; severity colours
  components/
    GraphView.tsx    React Flow canvas, controls, minimap
    ServiceNode.tsx  custom node
    graphContext.ts  highlight state shared with nodes
    FilterPanel.tsx  filter toggles and All/Any switch
    RouteList.tsx    matching routes, hover to preview, click to pin
    NodeDetails.tsx  details panel
    Legend.tsx       legend strip under the canvas
    StateViews.tsx   loading and error views
  App.tsx            page layout and state
```

Node kinds are interpreted in one place, `src/lib/nodeStyle.ts`. Kinds it does
not recognise render as a regular service, so new backend kinds do not break
the graph; add them there to give them their own icon.

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS 4,
[`@xyflow/react`](https://reactflow.dev) for the graph, `elkjs` for layout and
`lucide-react` for icons.
