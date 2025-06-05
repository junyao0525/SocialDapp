# Hardhat Todo Monorepo

This is a monorepo containing a Hardhat backend and Next.js frontend for a Todo application.

## Project Structure

```
hardhat-todo/
├── packages/
│   ├── backend/     # Hardhat project
│   └── frontend/    # Next.js project
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:

For frontend:
```bash
npm run dev:frontend
```

For backend:
```bash
npm run dev:backend
```

## Available Scripts

- `npm run dev:frontend` - Start Next.js development server
- `npm run dev:backend` - Start Hardhat development server
- `npm run build:frontend` - Build Next.js application
- `npm run build:backend` - Build Hardhat contracts 