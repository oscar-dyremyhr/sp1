# sp1

> **Side project 1** — working title. The repo will be renamed once the project has a proper name.

A website built with **TypeScript**, **React** and **Vue**, powered by [Vite](https://vite.dev).

## Tech stack

| Tool | Purpose |
| --- | --- |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [React](https://react.dev/) | UI library (`apps/react`) |
| [Vue 3](https://vuejs.org/) | UI framework (`apps/vue`) |
| [Vite](https://vite.dev/) | Dev server & bundler |
| npm workspaces | Monorepo management |

## Project structure

```
sp1/
├── apps/
│   ├── react/        # React + TypeScript app (Vite)
│   └── vue/          # Vue 3 + TypeScript app (Vite)
├── .github/
│   └── workflows/    # CI (lint + build)
├── package.json      # Root workspace config & scripts
└── README.md
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (22 recommended — see `.nvmrc`)
- npm 10+

### Install

```bash
npm install
```

### Develop

```bash
npm run dev:react   # http://localhost:5173
npm run dev:vue     # http://localhost:5174
npm run dev         # both at once
```

### Build

```bash
npm run build       # builds every app into apps/*/dist
```

### Lint

```bash
npm run lint
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start all apps in dev mode |
| `npm run dev:react` | Start the React app |
| `npm run dev:vue` | Start the Vue app |
| `npm run build` | Type-check and build all apps |
| `npm run build:react` | Build the React app |
| `npm run build:vue` | Build the Vue app |
| `npm run lint` | Lint all apps that define a lint script |

## Roadmap

- [ ] Decide on a project name and rename the repo
- [ ] Decide how React and Vue fit together (separate pages, micro-frontends, or pick one)
- [ ] Add shared packages (UI components, utilities) under `packages/`
- [ ] Add testing (Vitest)
- [ ] Set up deployment

## License

[MIT](LICENSE)
