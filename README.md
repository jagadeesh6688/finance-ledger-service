# Financial Transaction Ledger Backend Service

## Overview

A backend service for managing financial transaction ledgers across multiple branches, employees, and vendors with Role-Based Access Controls (RBAC).

## Tech Stack

- **Runtime**: Node.js (ES2020+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **API**: GraphQL with Apollo Server 5
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest
- **Deployment**: AWS Lambda (Serverless Framework)

## Features

- Multi-organization structure with branches
- Employee hierarchy with manager relationships
- Vendor management
- Transaction ledger with double-entry bookkeeping
- RBAC with granular permissions
- Audit logging
- Expense approval workflow
- Comprehensive reporting and analytics

## Project Structure

```
finance-ledger-service/
├── src/
│   ├── config/           # Configuration files
│   ├── models/           # Mongoose models
│   ├── graphql/          # GraphQL schema and resolvers
│   ├── middleware/       # Express/Apollo middleware
│   ├── handlers/         # Error, permission, validation handlers
│   ├── utils/            # Utility functions
│   └── constants/        # Constants and enums
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── helpers/          # Test utilities
├── docs/                 # Documentation
└── serverless.yml        # Serverless framework config
```

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- MongoDB >= 4.4
- AWS account (for deployment)
- Serverless Framework

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd finance-ledger-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Local Development

```bash
# Start MongoDB (using Docker or local instance)
docker run -d -p 27017:27017 mongo:latest

# Run in development mode
npm run dev

# The GraphQL server will be available at http://localhost:4000
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

### Deployment

```bash
# Deploy to dev environment
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## Environment Variables

See `.env.example` for required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development, staging, production)
- And more...

## API Documentation

Once the server is running, access the GraphQL Playground at:
- Development: http://localhost:4000/graphql
- API Documentation: See `docs/API.md`

## Roles & Permissions

- **Admin**: Full access to all resources
- **BranchManager**: Manage own branch and subordinates
- **Employee**: Create and view own expenses
- **Vendor**: View own transactions

See `docs/RBAC.md` for detailed permission matrix.

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests (aim for 90%+ coverage)
4. Run linting: `npm run lint:fix`
5. Submit a pull request

## License

ISC

