# Builder Management System

A production-grade, modular monolith portal designed for builder management. Built on Next.js, PostgreSQL, Prisma, Redis, WebSocket, and AWS S3/R2 storage.

## Project Structure

```text
builder-management/
│
├── .github/workflows/         # CI/CD and automation workflows
├── apps/
│   └── web/                   # Main Next.js application (Frontend + Backend APIs)
├── packages/
│   ├── config/                # Shared ESLint, Tailwind, TypeScript configurations
│   ├── types/                 # Shared TypeScript types & interfaces
│   ├── ui/                    # Shared component library (built with shadcn/ui boilerplate)
│   └── validation/            # Shared validation schemas (Zod)
├── infra/
│   ├── docker/                # Local database & container configs
│   ├── terraform/             # Terraform infrastructure configurations
│   └── scripts/               # Utility shell scripts
├── docker-compose.yml         # Dev services orchestration (PostgreSQL & Redis)
├── pnpm-workspace.yaml        # Workspace configuration for pnpm
└── package.json               # Root scripts and workspace settings
```

## Technology Stack

- **Framework**: Next.js 15 (App Router, Tailwind CSS, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Realtime**: WebSockets
- **Caching & Queues**: Redis & BullMQ
- **Storage**: AWS S3 / Cloudflare R2
- **Testing**: Vitest & Playwright

## Getting Started

### Prerequisites

- Node.js >= 24
- npm >= 11
- pnpm (installed globally: `npm i -g pnpm`)
- Docker Desktop

### Installation & Run

1. **Clone & Setup Environment**
   ```bash
   cp .env.example .env
   ```
   *Modify the `.env` values to match your local setup if necessary.*

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Services**
   ```bash
   docker-compose up -d
   ```

4. **Run DB Migrations & Seed**
   ```bash
   pnpm --filter web prisma:migrate
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```
   *The portal will be running at [http://localhost:3000](http://localhost:3000).*

## Core Functional Modules

1. **Material Management**: Stock ledgers, categories, stocks, request/approvals, receipts, issues, and transfers.
2. **Employee Management**: Personal records, designation, documents, and venture assignments.
3. **Venture-wise Chat**: Realtime workspace messaging restricted by venture-level permissions.
