# ASSESSMENT-PDO

Full-stack contact support assessment app with a Vite React frontend and an Express/MongoDB backend.

## Structure

```text
.
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- styles/
|   |   |-- types/
|   |   |-- App.tsx
|   |   `-- main.tsx
|   |-- .env.example
|   |-- index.html
|   `-- package.json
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- app.ts
|   |   `-- index.ts
|   |-- .env.example
|   |-- package.json
|   |-- tsconfig.json
|   `-- pnpm-lock.yaml
|-- .env.example
|-- .gitignore
`-- README.md
```

## Development

Install and run each app from its own folder.

```bash
cd backend
pnpm install
pnpm dev
```

## Email Template

The contact support HTML email layout is stored in MongoDB in the `emailtemplates` collection with the key `contact-support`. On startup, the backend seeds the default layout if it does not already exist.

Supported template placeholders are `{{name}}`, `{{email}}`, `{{message}}`, `{{sentDate}}`, and `{{initial}}`.

```bash
cd frontend
pnpm install
pnpm dev
```
