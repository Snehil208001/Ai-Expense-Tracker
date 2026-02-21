# AI Expense Tracker - Backend API

Node.js + Fastify + TypeScript + Prisma backend for the AI Expense Tracker SaaS.

## Prerequisites

- Node.js 18+
- PostgreSQL (running on localhost:5432)
- Database `expenseTracker` created

## Setup

### 1. Create database (if not exists)

```sql
CREATE DATABASE expenseTracker;
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and set your values. Default `.env` is pre-configured for local dev.

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/signup` | No | Register (creates tenant + user) |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user (Bearer token) |

### User
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Yes | Get profile |
| PATCH | `/api/users/me` | Yes | Update profile (name, avatar, currency, monthlyBudget) |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Yes | List (query: `?type=expense\|income`) |
| POST | `/api/categories` | Yes | Create |
| GET | `/api/categories/:id` | Yes | Get by id |
| PATCH | `/api/categories/:id` | Yes | Update |
| DELETE | `/api/categories/:id` | Yes | Delete |

### Expenses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/expenses` | Yes | List (query: `page`, `limit`, `from`, `to`, `categoryId`, `search`) |
| POST | `/api/expenses` | Yes | Create |
| GET | `/api/expenses/:id` | Yes | Get by id |
| PATCH | `/api/expenses/:id` | Yes | Update |
| DELETE | `/api/expenses/:id` | Yes | Delete |

### Receipts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/receipts/upload` | Yes | Upload (multipart form, field: `file`) |
| GET | `/api/receipts` | Yes | List user's receipts |
| GET | `/api/receipts/:id` | Yes | Get by id |

### AI (Phase 3+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ai/status` | Yes | Check if AI is configured |
| POST | `/api/ai/receipt-parse` | Yes | Parse receipt from image (multipart `file`) |
| POST | `/api/ai/receipt-parse-by-id` | Yes | Parse receipt by ID (body: `{ receiptId }`) |
| POST | `/api/ai/receipt-to-expense` | Yes | Create expense from receipt data (body: `{ receiptData, receiptId?, createExpense? }`) |
| POST | `/api/ai/categorize` | Yes | Suggest category (body: `{ text, categories? }`) |
| GET | `/api/ai/insights` | Yes | Generate spending insights |
| POST | `/api/ai/expense-from-text` | Yes | Parse/create expense from natural language (body: `{ text, createExpense? }`) |
| GET | `/api/ai/recurring` | Yes | Detect recurring expense patterns |
| GET | `/api/ai/report` | Yes | Monthly report (query: `?month=1&year=2025`) |
| GET | `/api/ai/anomalies` | Yes | Spending anomaly alerts |
| POST | `/api/ai/check-duplicate` | Yes | Check for duplicate expense (body: `{ amount, date, description? }`) |
| POST | `/api/ai/chat` | Yes | Q&A about spending (body: `{ query }`) |

## Auth Flow

- **Signup**: Creates a new tenant + user. Use `tenantName` for org name.
- **Login**: Pass `email` + `password`. Optionally `tenantId` if user has multiple tenants.
- **Protected routes**: Add header `Authorization: Bearer <token>`

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   └── index.ts
└── package.json
```
