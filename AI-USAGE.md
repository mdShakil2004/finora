# AI Usage & Verification Record

This document describes how AI-assisted development tools were used during the implementation of the Finora project, how generated output was reviewed and modified, and how the resulting application was verified.

The purpose of this document is to provide transparency into the development workflow while clearly distinguishing AI-assisted implementation from developer review, engineering decisions, and final verification.

---

## 1. AI Tools Used

The following AI-assisted development tools were used during the project:

- **Google AI Studio / Antigravity Agent** — used for code generation, debugging, implementation assistance, and technical review.
- **VS Code / AI-assisted development environment** — used for code suggestions, refactoring, and development assistance.

AI was used as a development aid rather than as an autonomous source of final engineering decisions.

---

## 2. Areas Where AI Assistance Was Used

AI assistance was used across several parts of the application.

### 2.1 Project Scaffolding

AI assistance was used to establish the initial project structure for:

- React + TypeScript frontend
- FastAPI backend
- SQLAlchemy database layer
- API route organization
- Shared schemas and models
- Development and deployment configuration

The generated structure was subsequently reviewed and adapted to the requirements of the assessment.

---

### 2.2 Frontend Development

AI assistance was used to draft and refine several frontend components, including:

- `TransactionTable.tsx`
- `AnalyticsSection.tsx`
- `SummaryCards.tsx`
- `FilterBar.tsx`
- `TransactionDetailDrawer.tsx`
- `RewardsCatalogue.tsx`
- Reusable UI components such as buttons, cards, badges, inputs, modals, drawers, skeletons, and toast notifications.

AI assistance was also used for:

- TypeScript type definitions
- API integration
- Formatting utilities
- Responsive UI implementation
- Loading and empty states
- Component refactoring
- Frontend build/debugging

The final implementation was reviewed against the functional requirements and the expected user workflow.

---

### 2.3 Backend Development

AI assistance was used during implementation of:

- FastAPI application structure
- REST API routes
- SQLAlchemy ORM models
- Pydantic request and response schemas
- Repository layer
- Service layer
- Database configuration
- Transaction filtering and pagination
- Analytics calculations
- Reward catalogue and redemption logic
- Health-check endpoint
- Error handling and logging

The backend was organized into separate API, service, repository, model, schema, and configuration layers to keep responsibilities separated.

---

### 2.4 Data Ingestion and Seed Pipeline

AI assistance was used to develop the dataset ingestion workflow:

```text
transactions.json
       ↓
seed.py
       ↓
PostgreSQL
       ↓
FastAPI
       ↓
Frontend
