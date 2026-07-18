<!-- This document explains how to add pages correctly to this React/Vite project and is formatted for sharing or PDF conversion. -->

# How to Add Pages Correctly to the Frontend

## React and Vite Integration Guide

This project uses React, TypeScript, Vite, and React Router. Every application page must be connected to the React application. Creating a separate HTML file does not automatically add that page to the application.

This guide explains the mistake we encountered, why it happened, how it was corrected, and how to avoid it in future frontend work.

## What Went Wrong

The login screen was originally created using two standalone files:

```text
frontend/login.html
frontend/UI.css
```

The HTML and CSS were valid, but they were not connected to the React application. As a result, opening the main frontend URL displayed only the minimal content from `App.tsx` instead of the designed login screen.

The separate login page could potentially be opened directly at `/login.html` during development, but it was not part of the actual application.

## Why It Happened

Vite starts this React application through the following chain:

```text
frontend/index.html
        ↓
frontend/src/main.tsx
        ↓
frontend/src/App.tsx
        ↓
React Router
        ↓
Page component
```

Only pages connected to this chain appear in the main application.

A separate file such as `frontend/login.html` does not automatically become a React page. It remains disconnected from:

- React Router
- Shared React state
- Authentication state
- Application layouts
- Reusable components
- Normal application navigation
- Frontend API services
- The standard production build

## Correct Way to Create a Page

Create application pages as React components inside:

```text
frontend/src/pages/
```

For example:

```text
frontend/src/pages/LoginPage.tsx
```

A simple page component looks like this:

```tsx
export function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
    </main>
  );
}
```

The page must then be registered with React Router in `App.tsx`:

```tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

The page can then be opened at:

```text
http://localhost:5173/login
```

## Correct Way to Add CSS

Put application styles inside the source folder. For example:

```text
frontend/src/styles/login.css
```

Import the stylesheet from the relevant React component:

```tsx
import "../styles/login.css";
```

Vite will then include, process, and optimize the stylesheet in both development and production builds.

Do not create a stylesheet that is linked only from a separate HTML page:

```html
<link rel="stylesheet" href="UI.css" />
```

That stylesheet will not affect the React application unless React imports it or the main `index.html` intentionally includes it.

## Correct Way to Use Images

### Importing images through TypeScript

An image can be imported directly into a React component:

```tsx
import logoUrl from "../../EGAS.png";

export function LoginPage() {
  return <img src={logoUrl} alt="EGAS logo" />;
}
```

Vite processes the imported image and generates the correct production URL.

### Referencing images from CSS

CSS can reference an image using a valid relative path:

```css
.login-page {
  background-image: url("../../Background.jpg");
}
```

Vite will also process this image during the build.

### Public assets

Files that must keep a direct public URL may be placed inside:

```text
frontend/public/
```

For example:

```text
frontend/public/images/logo.png
```

It can be referenced as:

```tsx
<img src="/images/logo.png" alt="Company logo" />
```

Choose one asset approach and use it consistently. Do not assume that every file placed somewhere under `frontend/` will automatically appear in the production build.

## Correct Way to Handle Forms

A normal HTML form reloads the browser page when submitted. React forms usually prevent that default behavior:

```tsx
import type { FormEvent } from "react";

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  // Validate the fields and call the backend here.
}
```

Connect the function to the form:

```tsx
<form onSubmit={handleSubmit}>
  {/* Form fields */}
</form>
```

Avoid traditional submission markup such as:

```html
<form action="#" method="POST">
```

Use traditional form submission only when the application intentionally submits to a non-React server page.

## Correct Way to Navigate

Do not navigate between application pages using separate HTML files:

```html
<a href="dashboard.html">Dashboard</a>
```

Use React Router links:

```tsx
import { Link } from "react-router-dom";

<Link to="/dashboard">Dashboard</Link>
```

For navigation after an action such as login:

```tsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/dashboard");
```

This keeps navigation inside the React application without performing a full page reload.

## Where Files Belong

```text
frontend/
├── index.html                  Vite HTML shell only
├── public/                     Optional directly accessible static assets
└── src/
    ├── main.tsx               Mounts React in the browser
    ├── App.tsx                Defines routes and global providers
    ├── pages/                 Complete route-level screens
    ├── components/            Reusable parts of screens
    ├── services/              Backend API functions
    └── styles/                Application and page styles
```

Examples:

| File | Responsibility |
| --- | --- |
| `pages/LoginPage.tsx` | Complete login screen |
| `pages/DashboardPage.tsx` | Complete dashboard screen |
| `components/layout/Header.tsx` | Reusable page header |
| `components/requests/RequestForm.tsx` | Reusable travel-request form |
| `services/api.ts` | Central HTTP helper |
| `styles/login.css` | Login-specific styling |

Pages coordinate complete screens. Components contain reusable sections. Services communicate with the backend. Styles control presentation.

## What Was Changed in This Project

### Removed

```text
frontend/login.html
frontend/UI.css
```

These standalone files were removed because they were not connected to the React application.

### Created

```text
frontend/src/styles/login.css
```

This file contains the login-page styles and is imported by the React login page.

### Updated

```text
frontend/src/pages/LoginPage.tsx
frontend/src/pages/DashboardPage.tsx
frontend/src/App.tsx
```

- `LoginPage.tsx` now contains the React login interface.
- `DashboardPage.tsx` provides a temporary destination after development sign-in.
- `App.tsx` connects `/login` and `/dashboard` through React Router.
- `/` and unknown paths redirect to `/login`.

### Retained assets

```text
frontend/EGAS.png
frontend/Background.jpg
```

These assets are now connected to the Vite asset pipeline and are included in production builds.

## Generated Files

Do not manually edit generated files such as:

```text
frontend/tsconfig.tsbuildinfo
frontend/dist/
```

- `tsconfig.tsbuildinfo` is a TypeScript build cache.
- `dist/` is the generated production build.

Application changes belong in `frontend/src/` and configuration files. Generated files should normally be excluded from source control.

## Page Completion Checklist

Before saying a page is complete, verify:

1. The page is a `.tsx` React component.
2. It is placed in `src/pages` or built from components in `src/components`.
3. It is registered with React Router in `App.tsx`.
4. Its URL works through the normal application.
5. Its CSS is imported by the application.
6. Its images are imported through Vite or intentionally placed in `public/`.
7. Form submission does not accidentally reload the page.
8. Internal navigation uses React Router.
9. Backend calls go through the frontend service layer.
10. Loading, empty, validation, and error states are handled.
11. Keyboard navigation and visible form labels work.
12. Type checking and the production build pass.

## Verification Commands

From the repository root, run:

```bash
npm run typecheck --workspace frontend
npm run test --workspace frontend
npm run build --workspace frontend
```

Start the application with:

```bash
npm run dev
```

Then test through the normal application URL:

```text
http://localhost:5173
```

Do not consider a page integrated only because a separate HTML file opens directly.

## Main Rule to Remember

> In a React/Vite project, build pages as React components and connect them through the application router. Do not create separate HTML pages unless the project has intentionally been configured as a multi-page application.

Following this rule keeps routing, authentication, shared state, components, styling, API access, testing, and production builds working as one application.
