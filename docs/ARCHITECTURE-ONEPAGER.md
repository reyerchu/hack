## Stack
Next.js (React + SSR/SSG + API Routes), TypeScript, Firebase Admin/Client, MUI, DevExpress Scheduler, PWA (next-pwa)

## Structure (where to look)
- pages/
  - index.tsx: Home (SSR fetches key data via internal APIs)
  - schedule/index.tsx: Schedule UI (DevExpress Scheduler, robust timestamp parsing)
  - dashboard/*: Admin/overview pages
  - auth/*: Sign in/up/out
  - api/*: Server APIs (return [] if Firebase not configured)
- components/
  - homeComponents/*, adminComponents/*, AppHeader.tsx
- lib/
  - admin/init.ts: Firebase Admin init (guards dummy/missing env)
  - firebase-client.ts: Firebase Client init (guards dummy NEXT_PUBLIC_* env)
  - user/AuthContext.tsx: Auth context
  - request-helper.ts: fetch wrapper with safe fallbacks
  - service-worker/FCMContext.tsx: PWA/FCM
- public/: static assets, sw.js

## Data Flow
SSR pages → RequestHelper → pages/api/* → Firestore (if configured) → props → render.
APIs get firestore() inside handlers with try/catch; when not configured → return [].

## Env Vars (essentials)
- Client (NEXT_PUBLIC_*): API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID(optional)
- Server (Admin): SERVICE_ACCOUNT_PROJECT_ID, SERVICE_ACCOUNT_CLIENT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY (\n newlines)

## Patterns to Follow
- Page needs data: add SSR getServerSideProps and call internal API
- Add API: pages/api/<resource>/index.tsx with safe firestore() in handler and try/catch
- Use RequestHelper for fetch (non-2xx → returns [])
- Keep UI resilient to empty arrays

## Key Endpoints (GET)
- /api/schedule, /api/challenges, /api/keynotespeakers, /api/members, /api/questions/faq, /api/sponsor, /api/announcements

## Add a Feature (checklist)
1) Define route (pages/<route>/index.tsx) and SSR needs
2) Add/extend API under pages/api/<resource> with guards
3) Wire UI → RequestHelper to the API
4) Handle empty data state
5) If auth/roles required, extend AuthContext and API checks


