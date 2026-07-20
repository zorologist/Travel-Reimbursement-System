# Frontend Completion Status

Updated: 20 July 2026

The frontend is connected to the completed Express API by default.

## Implemented

- Session login/restoration/logout for all nine development accounts.
- Protected, role-aware routes and navigation.
- Original Arabic new-request design with functional receipt/ticket upload.
- Personal request list, filters, details, dynamic workflow tracker, cancellation reason, final amount, and audit history.
- Manager approve/reject, PR accommodation/comments, Transportation attachment preview/cost verification, and Timing same-day/night identification.
- Salary queue, revision history, bonus/penalty preview, confirmation, finalization, and queue refresh.
- Loading, empty, validation, forbidden, not-found, network, and server-error states.
- Central API client with credential cookies and normalized backend errors.

Normal `npm run dev` uses the backend through Vite's `/api` proxy. The browser-only repository is retained for isolated tests and can be explicitly enabled with:

```bash
VITE_USE_DEVELOPMENT_REPOSITORY=true npm run dev --workspace frontend
```

## Verified

- 18 frontend tests pass.
- Frontend TypeScript passes.
- The production Vite build passes.
- Backend response adapters cover requests, department queues, and Salary records.

Company identity, durable database/file storage, and deployment remain external infrastructure integrations rather than unfinished frontend pages.
