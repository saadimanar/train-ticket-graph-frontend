# train-ticket-graph-frontend

**[Live demo](https://train-ticket-graph-frontend.vercel.app)** · **[Backend API](https://train-ticket-graph-api.vercel.app)** · **[Backend repo](https://github.com/saadimanar/train-ticket-graph-api)**

A demo client for my Backslash backend home exercise, a query engine over the
Train Ticket microservices graph. The
[backend repo](https://github.com/saadimanar/train-ticket-graph-api) is the
main deliverable; this app is a visual way to explore its API.

## Features

- **Full graph view:** the whole service call graph from `GET /graph`, in a
  left-to-right layered layout with zoom, pan, fit-to-view and a minimap.
- **Dynamic filters:** the filter toggles are built from `GET /filters`, so a
  filter added to the backend appears here without a frontend change.
- **All / Any match mode:** routes must satisfy every selected filter, or any
  one of them.
- **Highlighted routes:** matching nodes and edges from `GET /routes` are
  highlighted on the graph and the edges animate in the call direction.
  Everything else is dimmed, not removed.
- **Route list:** every matching route with a count. Hover a route to
  highlight only that route; click to pin it and zoom to it.
- **Node details panel:** click a node to see its kind, whether it is public,
  its vulnerabilities (severity, message, file), its callers and callees, and
  a note for missing placeholder nodes.
- **Legend:** explains the node styles (service, public entry point, database,
  queue, missing/unknown, vulnerable by severity) and the route highlight.
- **Loading, error and empty states:** separate views for loading, an
  unreachable backend, API errors, and filters that match nothing.

"Public + sink" with match All returns 0 routes on this data by design: no
route goes from a public service to a database. The app shows this as an
empty state ("No routes match"), not as an error.

## Run locally

### Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite)
- npm
- A local copy of the
  [backend](https://github.com/saadimanar/train-ticket-graph-api)

### 1. Start the backend

The backend listens on `http://localhost:3000`. Outside production it allows
requests from the Vite dev origin `http://localhost:5173`.

```sh
git clone https://github.com/saadimanar/train-ticket-graph-api.git
cd train-ticket-graph-api
npm install
npm run dev
```

### 2. Start the frontend

```sh
npm install
cp .env.example .env
npm run dev
```

`.env` sets `VITE_API_URL`, which defaults to `http://localhost:3000`. Open
<http://localhost:5173>.

If port 5173 is taken, Vite uses another port. Add that origin to the
backend's `ALLOWED_ORIGINS`, or the browser will block the requests and the
app will show "Can't reach the graph API".

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the production build locally |

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the graph API, without a trailing slash |

## Deployment

The live demo is deployed on Vercel.

1. Import this repository in Vercel and keep the **Vite** framework preset
   (build command `npm run build`, output directory `dist`).
2. Set `VITE_API_URL` to the backend URL, for example
   `https://train-ticket-graph-api.vercel.app`, **before** building. Vite bakes
   `VITE_*` variables into the bundle at build time, so after changing it you
   must redeploy for the change to take effect.
3. Add the frontend URL, for example
   `https://train-ticket-graph-frontend.vercel.app`, to the backend's
   `ALLOWED_ORIGINS` (comma-separated exact origins, no trailing slash) and
   redeploy the backend. In production the backend allows no origins by
   default, so without this every request is blocked by CORS.

Preview deployments get their own URLs; add any you want to use to
`ALLOWED_ORIGINS` as well.

## Tech stack

- [Vite](https://vite.dev) 8 with React 19 and TypeScript (strict)
- [React Flow](https://reactflow.dev) (`@xyflow/react`) for the graph
- [elkjs](https://github.com/kieler/elkjs) for the layered layout, lazy-loaded
- [Tailwind CSS](https://tailwindcss.com) 4
- [Lucide](https://lucide.dev) (`lucide-react`) for icons

No state management or routing library; state lives in React hooks.

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
    layout.ts        elkjs layered layout
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
