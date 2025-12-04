# CHANGELOG_IronLord8.md

## Added
- `.env.example` files for frontend and backend
- Removed all hardcoded API keys; all env-based now
- Backend logger module `/utils/logger.js` with .info(), .warn(), .error()
- Input validation on logging form: valid odds, stake, CLV/EV bounds
- Express middleware guards against malformed requests
- React error boundary added (with fallback UI)
- Folder cleanup: removed unused files and stubs

## Improved
- Stable environment setup for Render and Vercel
- Scan and logging APIs now reject invalid payloads cleanly