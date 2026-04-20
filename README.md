# 3dFiler

Upload 3D models, create interactive points of interest (text or nested 3D models), manage your library, publish to a global explore page, and share via private links.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + React Three Fiber (Three.js) |
| Backend | Node.js + Express |
| Auth | JWT (in-memory for now, DB ready) |
| 3D Rendering | Three.js via @react-three/fiber & @react-three/drei |

## Project Structure

```
3dFiler/
├── frontend/          # React client
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/   # AuthContext
│   │   ├── pages/      # Home, Login, Register, Dashboard, Upload, Explore, ModelViewer
│   │   └── App.jsx
│   └── package.json
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/     # auth.js, models.js, pois.js
│   │   └── index.js
│   ├── uploads/        # Uploaded 3D files
│   └── package.json
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
npm run dev
# API runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm run dev
# Client runs on http://localhost:5173
```

## Core Features

- **Model Upload** — Drag/drop GLTF, GLB, OBJ, FBX (up to 100MB)
- **3D Viewer** — Orbit controls, grid, wireframe fallback
- **Points of Interest** — Double-click anywhere on the model to drop a pin
  - Text annotations
  - Nested model links (drill-down)
- **Auth** — Register / login with JWT
- **Dashboard** — Manage your models, publish/unpublish, generate share links
- **Explore** — Global feed of published models

## License

MIT
