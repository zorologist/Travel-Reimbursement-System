# Backend Person 2 — TypeScript Shared Imports and Build Output

Updated: 19 July 2026

## Assignment

This task belongs to **Backend Person 2**.

There were two related TypeScript/build concerns around importing code from the repository-level `shared` directory:

1. Backend TypeScript files previously showed unresolved imports from `shared`.
2. The current TypeScript configuration resolves those imports, but it creates a production build layout that does not match the backend start command.

The original import-resolution problem is fixed. The build/start mismatch still needs to be fixed and verified from a clean build.

## Project Layout

```text
Travel-Reimbursement-System/
├── backend/
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
└── shared/
    ├── salary/
    ├── schemas/
    └── types/
```

Backend source files currently import shared code using relative imports such as:

```ts
import type { TravelRequest } from "../../../shared/types/TravelRequest.js";
import type { SystemRole } from "../../../shared/types/User.js";
import type {
  AuditEvent,
  WorkflowAction,
  WorkflowStage,
} from "../../../shared/types/Workflow.js";
```

The `.js` extension is intentional when TypeScript uses `module: "NodeNext"`. TypeScript resolves it to the corresponding `.ts` source during development and preserves a valid `.js` import in compiled ESM output.

## Issue 1 — Shared Imports Previously Failed

The earlier backend configuration treated `backend/src` as the only source root. Files under the repository-level `shared` directory were therefore outside the configured TypeScript root, which caused editor errors or compiler errors when backend code imported shared types and calculations.

The current `backend/tsconfig.json` uses:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "..",
    "outDir": "dist"
  },
  "include": [
    "src",
    "../shared"
  ]
}
```

This allows both `backend/src` and `shared` to sit under the TypeScript source root.

### Current verification

The following checks pass:

```bash
npm run typecheck --workspace backend
npm run build --workspace backend
```

The shared salary suite also passes all 41 tests:

```bash
cd shared
npm test
```

Therefore, do not remove `../shared` or change `rootDir` back to `src` without replacing the current relative-import approach with a complete workspace/package solution.

## Issue 2 — Build Output Does Not Match `npm start`

Because `rootDir` is `..`, TypeScript preserves the directory structure beneath the repository root. A fresh build emits the backend entry point at:

```text
backend/dist/backend/src/server.js
```

It emits shared runtime files under:

```text
backend/dist/shared/
```

However, `backend/package.json` currently starts:

```json
{
  "scripts": {
    "start": "node dist/server.js"
  }
}
```

That command expects:

```text
backend/dist/server.js
```

The repository currently has an older `backend/dist/server.js`, but `dist` is ignored by Git. This stale local artifact can hide the problem. On a clean clone, or after deleting the old build output and rebuilding, `npm start` may fail because the file it expects was not generated at that location.

## Required Work

Choose and implement one consistent build strategy. Acceptable approaches include:

### Option A — Keep the current compilation layout

- Keep `rootDir: ".."` and the current direct shared imports.
- Change the backend start script to the actual emitted entry point:

```json
"start": "node dist/backend/src/server.js"
```

- Confirm that the emitted relative imports find `dist/shared` correctly.

This is the smallest immediate correction.

### Option B — Make `shared` a proper workspace package

- Add `shared` to the root npm workspaces.
- Define package exports and TypeScript declarations for shared contracts and calculations.
- Make frontend and backend depend on the shared package.
- Build shared before its consumers.
- Restore a backend-only source root if appropriate, so the server can emit to `dist/server.js` or another intentionally selected location.

This is cleaner for long-term frontend/backend sharing, but it is a larger integration change and must be coordinated with the frontend.

Do not combine pieces of both approaches without confirming the emitted file structure and Node runtime resolution.

## Clean Verification Required

The final verification must not rely on old files already present in `backend/dist`.

Use a clean or temporary build directory, then confirm:

1. Backend type-check passes.
2. Backend build passes.
3. The configured start entry point exists after the build.
4. The server starts from the compiled JavaScript.
5. Compiled imports of runtime shared modules resolve successfully.
6. Backend tests pass.
7. Shared salary tests remain at 41 passing.

Recommended commands after safely clearing only the generated backend build output:

```bash
npm run typecheck --workspace backend
npm run build --workspace backend
npm run start --workspace backend
npm run test --workspace backend
cd shared && npm test
```

## Frontend Coordination Note

The frontend currently does not import the repository's shared contracts. That means the backend import issue is verified, but true frontend/backend contract sharing is not complete yet.

If Option B is selected, coordinate with the frontend developer so both applications import the same exported schemas, types, constants, and salary rules rather than creating duplicate local interfaces.

## Done When

- Backend imports from `shared` have no editor or TypeScript errors.
- `npm run typecheck --workspace backend` passes.
- A fresh backend build produces exactly the entry point used by `npm start`.
- The compiled backend starts without relying on stale ignored files.
- Runtime shared imports resolve from compiled JavaScript.
- Backend and shared tests pass.
- The chosen strategy is documented so another developer does not reintroduce the old `rootDir` problem.
