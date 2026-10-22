# TaskFlow — Smart Task Management System

TaskFlow is a task management portfolio project. This phase implements the React frontend only; the Express API and infrastructure remain planned work.

## Frontend setup

Use Node.js 22.12 or newer. From the frontend directory, install dependencies with npm ci, copy .env.example to .env, and start the development server with npm run dev.

The development server prints its local URL. The app opens in mock mode by default and shows a small “Sample data” indicator. Mock tasks live in memory and reset when the page is refreshed; they are not stored in a database or browser storage.

To use a backend later, set VITE_TASKFLOW_DATA_MODE=api and set VITE_API_BASE_URL to the API root, such as http://localhost:5000/api. API mode expects the documented /tasks and /tasks/stats endpoints and the { success, data, message } response envelope. A failed API request remains an error; it does not silently switch to mock data. This integration has not been verified against a running backend.

## Checks

Run from the frontend directory:

- npm test
- npm run build

## Current scope and assumptions

- The frontend supports the documented dashboard, task list, create/edit form, search, status and priority filters, and delete confirmation.
- The first pass is single-user and has no authentication.
- Pagination is not enabled; the initial task list is treated as a small collection.
- Due dates use calendar dates in the browser’s local timezone.
- Mock sample data resets on refresh. Use API mode only when a compatible backend is available.

MongoDB persistence, Redis, backend endpoints, Docker, Nginx, and CI remain future phases.
