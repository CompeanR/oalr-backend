# CLAUDE.md - Development Guidelines & Context

## Project Overview

This is a production-ready NestJS backend template designed for rapid development of secure, scalable applications. It serves as a foundational template for multiple project ideas with enterprise-grade features.

## Code Style & Conventions

### 1. Class Declarations

```typescript
// ✅ Correct - Single class/service files: Export at bottom
class AuthController {
    // implementation
}

export { AuthController };

// ✅ Also correct - Utility files with multiple exports: Direct export
export class UserFactory {
    // implementation
}

export const mockConfigService = {
    // implementation
};

export function createMockRepository() {
    // implementation
}

// ❌ Avoid - Mixed patterns in same file
```

### 2. Import Organization

```typescript
// ✅ Correct - NestJS/external first, then internal
import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { AppLoggerService } from 'src/shared/services/logger.service';
```

### 3. Formatting Standards

-   **Indentation**: 4 spaces (configured in .prettierrc)
-   **Width**: 120 characters max (configured in .prettierrc)
-   **Quotes**: Single quotes for strings
-   **Semicolons**: Always required

### 4. Documentation Standards

```typescript
/**
 * Detailed method description explaining the purpose.
 *
 * @param param1 Description of parameter.
 * @param param2 Description of parameter.
 * @returns Description of return value.
 * @throws ExceptionType when specific condition occurs.
 */
public async methodName(param1: string, param2: number): Promise<ReturnType> {
    // implementation
}
```

### 5. Method Visibility

-   Always explicitly declare `public`, `private`, or `protected`
-   Use `readonly` for properties that shouldn't change after initialization

## Architecture Patterns

### 1. Directory Structure

```
src/
├── auth/                   # Authentication module
├── modules/user/           # User management
├── shared/                 # Shared utilities
│   ├── services/          # Shared services (logger, etc.)
│   ├── guards/            # Custom guards (rate limiting, etc.)
│   ├── filters/           # Exception filters
│   ├── middleware/        # Custom middleware
│   └── interceptors/      # Response transformers
├── config/                # Configuration management
├── core/database/         # Database configuration
└── health/               # Health check endpoints
```

### 2. Module Organization

-   Each feature gets its own module
-   Controllers handle HTTP concerns only
-   Services contain business logic
-   DTOs for data validation and transformation

### 3. Error Handling Strategy

-   Global exception filter handles all errors
-   Structured logging with context
-   Environment-aware error messages (detailed in dev, minimal in prod)

## Security Implementation

### 1. Current Security Features

-   Environment variable validation with class-validator
-   Rate limiting on sensitive endpoints
-   CORS configuration with environment-based origins
-   Security headers middleware (CSP, HSTS, etc.)
-   JWT authentication with passport strategies
-   Input validation with class-validator (whitelist, forbidNonWhitelisted)

### 2. Security Headers Applied

-   Content-Security-Policy
-   X-Frame-Options: DENY
-   X-Content-Type-Options: nosniff
-   X-XSS-Protection
-   Strict-Transport-Security (production only)

## Environment Configuration

### 1. Configuration Pattern

-   Environment variables validated at startup
-   Structured config object with nested properties
-   Type-safe access via ConfigService
-   Separate validation class using class-validator

### 2. Environment Variables

```bash
# Required variables (validated at startup)
JWT_SECRET_KEY=<long-random-string>
DB_HOST=localhost
DB_USERNAME=<username>
DB_PASSWORD=<password>
DB_NAME=<database>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>

# Optional with defaults
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Database & ORM

### 1. TypeORM Configuration

-   Database configuration in `src/core/database/`
-   Migrations managed via npm scripts
-   Entities use class-based approach with decorators

### 2. Database Scripts

```bash
npm run generate-migration  # Generate new migration
npm run run-migration      # Apply migrations
npm run revert-migration   # Rollback last migration
npm run db:reset          # Drop schema and reapply migrations
```

## Testing Philosophy

### 1. Testing Approach

-   Unit tests for services and utilities
-   Integration tests for controllers with mocked dependencies
-   E2E tests for complete user flows
-   Test utilities for common mocks and factories

### 2. Testing Commands

```bash
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests
```

## Health Check Implementation

### 1. Available Endpoints

-   `GET /health` - Basic status for load balancers
-   `GET /health/detailed` - Complete system information
-   `GET /health/ready` - Kubernetes readiness probe
-   `GET /health/live` - Kubernetes liveness probe

### 2. Health Check Features

-   Database connectivity verification
-   Memory usage monitoring
-   System information reporting
-   Environment-aware responses

## Logging Strategy

### 1. Logging Service (AppLoggerService)

-   Centralized logging with NestJS Logger
-   Environment-aware log levels (debug only in development)
-   Structured logging for user actions and system events
-   Context-aware logging with request information

### 2. Exception Logging

-   Automatic logging of all exceptions with context
-   Different log levels based on HTTP status codes
-   Request metadata included (IP, user agent, method, URL)

## Development Workflow

### 1. Code Quality

```bash
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting
npm run build             # TypeScript compilation
```

### 2. ESLint Rules

-   Explicit return types required (`@typescript-eslint/explicit-function-return-type`)
-   Unused variables must be prefixed with underscore
-   Prettier integration for consistent formatting

## Production Considerations

### 1. Environment Setup

-   Validation prevents startup with missing configuration
-   Security headers enabled automatically
-   Rate limiting active on sensitive endpoints
-   Structured error responses without exposing internals

### 2. Monitoring & Observability

-   Health check endpoints for load balancer integration
-   Structured logging for log aggregation systems
-   Memory and system monitoring built-in

## Dependencies Philosophy

### 1. Minimal Dependencies

-   Prefer existing NestJS ecosystem packages
-   Avoid adding new dependencies when functionality can be implemented with existing ones
-   Security-focused: bcrypt for passwords, helmet-like middleware implemented manually

### 2. Current Key Dependencies

-   `@nestjs/*` - Core framework and modules
-   `typeorm` + `pg` - Database ORM and PostgreSQL driver
-   `passport-*` - Authentication strategies
-   `class-validator` + `class-transformer` - Input validation
-   `bcrypt` - Password hashing

## Common Patterns

### 1. Service Injection

```typescript
constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
) {}
```

### 2. DTO Validation

```typescript
class LoginDto {
    @IsString()
    @Length(8, 50)
    email: string;

    @IsString()
    @Length(8, 50)
    password: string;
}
```

### 3. Exception Handling

```typescript
if (!user) {
    throw new UnauthorizedException('Invalid credentials');
}
```

## Future Enhancements Roadmap

### 1. Testing (In Progress)

-   Comprehensive unit test coverage
-   Integration test setup with mocked dependencies
-   E2E test scenarios for auth flows

### 2. Database Optimization

-   Connection pooling configuration
-   Query optimization and monitoring
-   Database health checks enhancement

### 3. Containerization

-   Docker configuration for development and production
-   Docker Compose for local development
-   Multi-stage build optimization

### 4. CI/CD Pipeline

-   GitHub Actions workflow
-   Automated testing and linting
-   Docker image building and deployment

## Commands Reference

```bash
# Development
npm run start:dev         # Start with hot reload
npm run start:debug       # Start with debugger
npm run start:prod        # Production start

# Code Quality
npm run lint              # ESLint check and fix
npm run format            # Prettier formatting
npm run build             # TypeScript build

# Testing
npm run test              # Unit tests
npm run test:watch        # Test watch mode
npm run test:cov          # Test coverage
npm run test:e2e          # End-to-end tests

# Database
npm run generate-migration
npm run run-migration
npm run revert-migration
npm run db:reset
```

## Notes for Claude

### 1. When Making Changes

-   Always follow the class declaration pattern (export at bottom)
-   Use 4-space indentation consistently
-   Add comprehensive JSDoc comments for new methods
-   Maintain the existing import organization style
-   Prefer editing existing files over creating new ones unless explicitly required

### 2. When Adding Features

-   Check existing dependencies before suggesting new ones
-   Follow the established directory structure
-   Implement security considerations by default
-   Add appropriate error handling and validation
-   Consider environment configuration needs

### 3. When Writing Tests

-   Use the established testing utilities and patterns
-   Mock external dependencies appropriately
-   Follow the testing philosophy outlined above
-   Ensure tests are meaningful and test actual functionality

This template is designed to be a solid foundation for rapid development while maintaining production-grade quality and security standards.

## System Design Context

Load-balancers-website: https://www.educative.io/courses/grokking-the-system-design-interview/advanced-details-of-load-balancers
Building-blocks-website: https://www.educative.io/courses/grokking-the-system-design-interview/introduction-to-building-blocks-for-modern-system-design

## System Design Building Blocks Implementation Plan

This project serves as a comprehensive learning environment for implementing all 16 system design building blocks from the Grokking the System Design Interview course, following NestJS architectural best practices.

### **NestJS-Recommended Project Structure**

Based on official NestJS documentation and community best practices, the following structure will be implemented:

```
src/
├── config/                    # Environment configurations
├── common/                    # Global shared (guards, filters, etc.)
│   ├── guards/               # Your existing rate-limit.guard.ts
│   ├── filters/              # Your existing exception filters
│   ├── interceptors/         # Your existing interceptors
│   └── middleware/           # Your existing security middleware
├── shared/                   # Reusable business services
│   ├── cache/               # Distributed Caching
│   ├── storage/             # Key-Value Store + Blob Store
│   ├── messaging/           # Pub/Sub + Message Queue
│   ├── search/              # Distributed Search
│   ├── scheduler/           # Task Scheduling
│   ├── counter/             # Sharded Counters
│   ├── sequencer/           # Unique ID generation
│   └── services/            # Your existing logger.service.ts
├── modules/                 # Business domains
│   ├── auth/                # Your existing auth module
│   ├── user/                # Your existing user module
│   ├── content/             # Content management (uses blob, search, cdn)
│   └── analytics/           # Analytics (uses counters, messaging)
├── core/                    # Core infrastructure
│   ├── database/            # Your existing database config
│   └── health/              # Your existing health checks
└── main.ts
```

### **Building Blocks Implementation Status**

#### ✅ **Already Implemented (5/16)**
1. **Load Balancers** - Health check endpoints at `src/health/`
2. **Databases** - TypeORM PostgreSQL configuration at `src/core/database/`
3. **Service Monitoring** - Health service with checks at `src/health/health.service.ts`
4. **Rate Limiter** - Request throttling guard at `src/shared/guards/rate-limit.guard.ts`
5. **Distributed Logging** - Centralized logging service at `src/shared/services/logger.service.ts`

#### 🔧 **Phase 1: Storage Foundation (Weeks 1-2)**
6. **Key-Value Store** - `src/shared/storage/kv.service.ts` (Redis integration)
7. **Distributed Caching** - `src/shared/cache/cache.service.ts` (Multi-layer caching)
8. **Sequencer** - `src/shared/sequencer/sequencer.service.ts` (UUID, Snowflake algorithms)

#### 📡 **Phase 2: Communication Systems (Weeks 3-4)**
9. **Publish-Subscribe System** - `src/shared/messaging/pubsub.service.ts` (Redis pub/sub)
10. **Distributed Messaging Queue** - `src/shared/messaging/queue.service.ts` (Bull Queue)

#### 🗄️ **Phase 3: File & Search (Weeks 5-6)**
11. **Blob Store** - `src/shared/storage/blob.service.ts` (S3/MinIO integration)
12. **Distributed Search** - `src/shared/search/search.service.ts` (Elasticsearch)

#### 🔍 **Phase 4: Advanced Features (Weeks 7-8)**
13. **Content Delivery Network** - `src/modules/content/cdn.service.ts` (CDN configuration)
14. **Distributed Task Scheduling** - `src/shared/scheduler/scheduler.service.ts` (Cron jobs)
15. **Sharded Counters** - `src/shared/counter/counter.service.ts` (Performance counters)
16. **Domain Name System** - Configuration and health check integration

### **Implementation Principles**

1. **Modular Architecture** - Each building block is implemented as a NestJS module
2. **Domain-Driven Design** - Business modules (`content`, `analytics`) use infrastructure services
3. **Shared Services** - Reusable infrastructure components in `src/shared/`
4. **Dependency Injection** - All services follow NestJS DI patterns
5. **Testability** - Each building block has comprehensive unit and integration tests

### **Environment Variables for Building Blocks**

```bash
# Redis Configuration (Cache, KV Store, Pub/Sub, Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<password>

# Elasticsearch Configuration (Search)
ELASTICSEARCH_URL=http://localhost:9200

# Storage Configuration (Blob Store)
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_S3_BUCKET=<bucket-name>
AWS_REGION=us-east-1

# CDN Configuration
CLOUDFRONT_DISTRIBUTION_ID=<distribution-id>
```

### **Commands for Building Blocks**

```bash
# Building Blocks Development
npm run building-blocks:dev    # Start with all building blocks services
npm run building-blocks:test   # Test all building blocks
npm run building-blocks:bench  # Benchmark performance

# Individual Building Block Commands
npm run cache:clear           # Clear distributed cache
npm run queue:status          # Check message queue status
npm run search:reindex        # Reindex search data
npm run scheduler:status      # Check scheduled tasks status
npm run counter:metrics       # View performance metrics
```

### **Learning Objectives**

Each building block implementation focuses on:
- **Understanding**: Core concepts, trade-offs, and design patterns
- **Implementation**: Production-ready code following NestJS conventions
- **Testing**: Comprehensive unit and integration tests
- **Monitoring**: Health checks and performance metrics integration
- **Documentation**: Clear JSDoc comments and usage examples
- **Scalability**: Designed to handle production workloads

### **Dependencies Strategy**

Following the minimal dependencies philosophy, leveraging:
- **Redis**: Key-Value Store, Caching, Pub/Sub, Messaging Queue
- **Elasticsearch**: Distributed Search capabilities
- **AWS SDK**: Blob Store and CDN integration
- **Bull**: Advanced queue processing with Redis
- **Node-cron**: Distributed task scheduling
- **Existing NestJS ecosystem**: Leveraging current dependencies where possible

