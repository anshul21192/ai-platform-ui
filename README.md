# AI Platform UI

A React-based frontend for an AI-powered financial platform that enables users to manage beneficiaries, send and request money, view transactions, and monitor activity through a dashboard.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for dev server and bundling
- **MUI (Material UI)** for component library and theming
- **React Router** for client-side routing
- **MSW** for API mocking during development
- **oxlint** for linting

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

### Lint

```bash
pnpm lint
```

## Pages

| Route                     | Description                      |
| ------------------------- | -------------------------------- |
| `/`                       | Dashboard with activity summary  |
| `/beneficiaries`          | List and manage beneficiaries    |
| `/manageBeneficiary`      | Add or edit a beneficiary        |
| `/transactions`           | View transaction history         |
| `/payments/send-money`    | Send money to a beneficiary      |
| `/payments/request-money` | Request money from a beneficiary |
| `/settings`               | User settings                    |
