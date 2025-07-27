# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build production application
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## Architecture Overview

**Next.js 15 Full-Stack Application** with app router, tRPC, and comprehensive authentication system.

### Core Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI components
- **Backend**: tRPC for type-safe APIs, Next-Auth v5 for authentication
- **Database**: PostgreSQL with Drizzle ORM, pgvector for embeddings
- **State Management**: Zustand for client state, React Query for server state
- **Email**: Resend for transactional emails
- **File Processing**: LangChain for document processing and chunking

### Database Schema Structure

The database uses a modular design with three main domains:

1. **Authentication System** (`users`, `accounts`, `sessions`, various token tables)
   - Comprehensive security features: 2FA, account locking, login activity tracking
   - Email verification and password reset workflows
   - OAuth support (Google, GitHub)

2. **Subjects System** (`subjects` table)
   - User-owned subjects with color coding and archival
   - User evaluation levels: beginner, intermediate, advanced

3. **File Processing System** (`files`, `fileChunks` tables)
   - Document upload and processing with vector embeddings
   - Chunking system with semantic deduplication
   - Support for multiple content types: text, images, tables, diagrams

### tRPC Router Structure

Main routers located in `trpc/routers/_app.ts`:

- `auth` - Authentication procedures
- `admin` - Admin-only procedures
- `subjects` - Subject management procedures

### Key Architectural Patterns

**Feature-Based Organization**: Each domain (auth, admin, subjects, files) has its own folder structure:

```
lib/[domain]/
├── hooks/          # React hooks
├── server/         # tRPC procedures
├── store/          # Zustand stores (if needed)
├── types/          # TypeScript types
├── utils/          # Helper functions
└── validation/     # Zod schemas
```

**Authentication Flow**: Uses Next-Auth v5 with custom credential provider, rate limiting via Upstash Redis, and comprehensive security logging.

**Component Structure**:

- `components/ui/` - Radix UI-based design system components (Shadcn)
- `components/[domain]/` - Feature-specific components
- Layout components for different app sections (auth, app, admin)

### File Processing System

Uses LangChain for document processing with:

- Vector embeddings (768 dimensions) for semantic search
- Chunk-based content storage with metadata
- Support for various file types with extraction capabilities
- pgvector extension for similarity search

### Environment Requirements

The application requires several environment variables for:

- Database connection (Neon/PostgreSQL)
- Next-Auth configuration and providers
- Email service (Resend)
- Redis for rate limiting
- OAuth provider credentials

### Security Features

- Account locking after failed login attempts
- Two-factor authentication support
- Email verification workflows
- Rate limiting on authentication endpoints
- Security version tracking for users
- Comprehensive audit logging

### Process Documentation

Every time you perform actions related to the project, append your actions to logs.txt and read that file whenever you find it necessary to assist you. Please include every prompt I give. Also the technical description and the implementation strategy are in the following files: technical.txt and implementation.txt respectively, read those files whenever you find them necessary to assist you with the implementation.

### Git Repository

Every time you make successful changes, give me a commit message that best describes the new changes. The commit message should be short but packed with information, no more than 70 chars
