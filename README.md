# 3dFiler

Upload 3D models, create points of interest (text or nested 3D models), manage, publish, and share.

## What It Does

- **Upload 3D models** — drag and drop GLTF, GLB, OBJ, FBX, and other common formats.
- **Create Points of Interest (POIs)** — click anywhere on the model to drop pins that hold:
  - Text annotations / information cards
  - Links to nested 3D models (drill-down into detail)
- **User Accounts** — sign up, log in, manage your model library.
- **Publish** — push models to a global explore page for discovery.
- **Share** — generate private share links for controlled access.

## Tech Stack (TBD)

| Layer | Candidates |
|-------|------------|
| Frontend | React / Vue / Svelte + Three.js / Babylon.js |
| Backend | Node.js (Express/Nest) or Python (FastAPI) |
| Database | PostgreSQL + S3-compatible storage for models |
| Auth | JWT or OAuth (GitHub / Google) |
| 3D Rendering | Three.js (web-first, huge ecosystem) |

## Project Structure

```
3dFiler/
├── frontend/          # Web client
├── backend/           # API server
├── docs/              # Architecture & design docs
└── README.md
```

## Getting Started

_TBD — instructions will go here once the stack is chosen and scaffolding is in place._

## License

MIT
