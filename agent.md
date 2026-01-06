# Agent Guide

## Local development
- From the repo root, run `cd trading-analytics-dashboard && npm install` followed by `npm run dev` to start the Vite dev server.

## Build
- Run `npm run build` from `trading-analytics-dashboard` to produce the production bundle.

## UI location
- Main UI entry lives at `trading-analytics-dashboard/src/pages/index.tsx`.

## Deployment
- GitHub Actions workflow: `azure-static-web-apps-lively-bush-0409b5010.yml`.
- Deployment secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_LIVELY_BUSH_0409B5010`.
- Do **not** commit secrets.

## API expansion
- To add an API later, create an Azure Functions project under `/api` with its own `host.json` and `package.json` before wiring it into the Static Web Apps workflow.
