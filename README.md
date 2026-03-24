# App — TypeScript Frontend + Express Backend

A basic service project with a TypeScript frontend (Vite) and Express backend, designed to communicate with an external data processing & storage server.

## Project Structure

```
app/
├── frontend/          # TypeScript frontend (Vite)
│   ├── src/
│   │   └── main.ts
│   ├── index.html
│   └── package.json
├── backend/           # Express backend (TypeScript)
│   ├── src/
│   │   ├── index.ts           # Server entry
│   │   ├── routes/
│   │   │   └── data.ts        # Data server proxy routes
│   │   ├── services/
│   │   │   └── dataServerClient.ts  # Client for data server
│   │   └── types/
│   ├── .env.example
│   └── package.json
├── package.json       # Root workspace
└── README.md
```

## Prerequisites

- Node.js 18+ and npm (install via `sudo apt install nodejs npm` or use [nvm](https://github.com/nvm-sh/nvm))

## Setup

1. **Install dependencies**
   ```bash
   cd /home/ubuntu/app
   npm install
   ```

2. **Configure the data server** (optional)
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and set DATA_SERVER_URL to your data server's base URL
   ```

## Running

- **Development** (frontend + backend concurrently):
  ```bash
  npm run dev
  ```

- **Frontend only** (dev server at http://localhost:5173):
  ```bash
  npm run dev:frontend
  ```

- **Backend only** (API at http://localhost:3000):
  ```bash
  npm run dev:backend
  ```

- **Production** (build + serve in one step):
  ```bash
  npm run serve
  ```

- **Or** build and start separately:
  ```bash
  npm run build
  npm run start
  ```

## Public Access (Tencent Cloud)

The server binds to `0.0.0.0` so it accepts connections from any IP. To make the site publicly accessible:

1. **Open the port** in Tencent Cloud Console:
   - Go to **Security Groups** → select your instance's security group
   - Add inbound rule: **TCP**, port **3000** (or your `PORT`), source `0.0.0.0/0`

2. **Run the site**:
   ```bash
   npm run serve
   ```

3. **Access** via `http://<your-server-public-ip>:3000`

For production on port 80, use `PORT=80 npm run serve` (requires root) or put nginx in front as a reverse proxy.

## API Endpoints

| Endpoint      | Description                          |
|---------------|--------------------------------------|
| `GET /api/health` | Health check                       |
| `* /api/data/*`   | Proxied to the data server       |

The frontend is configured to proxy `/api` requests to the backend during development.

## Data Server Integration

The backend includes a `DataServerClient` that forwards requests from `/api/data/*` to your data processing & storage server. Set `DATA_SERVER_URL` in `backend/.env` to enable this.

Example: A request to `GET /api/data/items` is forwarded to `{DATA_SERVER_URL}/items`.

Extend `backend/src/services/dataServerClient.ts` and `backend/src/routes/data.ts` to add custom logic or endpoints.
