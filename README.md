# Ray Land EDI Operations

Minimal authenticated dashboard for the BusinessOS EDI Gateway.

The UI shows actual transaction states. A generated 997 is shown as queued until
the backend receives a successful response from the configured GEX outbound
endpoint. EDI 856 controls are intentionally absent until FEMA/GEX approves the
document and mapping.

## Local development

1. Copy `.env.example` to `.env` and set `VITE_API_URL`.
2. Run `npm install` and `npm run dev`.
3. Use the backend `ADMIN_PASSWORD` on the login screen.

## Production

`npm run build` produces the static application. `npm start` serves `dist` with
the Node static server on Railway's `PORT`. Set `VITE_API_URL` as a build-time
variable to the connector's public URL and set `API_ORIGIN` to the same origin
for the runtime Content Security Policy.
