# Financial Transaction Ledger Backend - Feature Map

## 1. PROJECT INFRASTRUCTURE & SETUP

### 1.1 Base Project Configuration

- **Description**: Initialize Node.js project with serverless framework for AWS Lambda
- **Structure**:
- `package.json` - dependencies (express, apollo-server-lambda, mongoose, jsonwebtoken, etc.)
- `serverless.yml` - AWS Lambda configuration
- `.env.example` - environment variables template
- `.gitignore`, `.eslintrc.js`, `jest.config.js`
- **Dependencies**: express, apollo-server-lambda, mongoose, jsonwebtoken, bcryptjs, joi, winston, dotenv
- **PR**: "Project Setup & Dependencies"

### 1.2 Database Connection & Configuration

- **Description**: MongoDB connection with connection pooling and error handling
- **Structure**: `src/config/database.js`
- **Features**: Connection retry logic, environment-based config
- **PR**: "Database Configuration"

### 1.3 Logger Configuration

- **Description**: Winston-based centralized logging
- **Structure**: `src/config/logger.js`
- **Features**: Different log levels, file/console transports, structured logging
- **PR**: "Logging Infrastructure"

---

## 2. AUTHENTICATION & AUTHORIZATION

### 2.1 JWT Authentication Module

- **Description**: JWT token generation, validation, and refresh mechanism
- **Models**: User (linked to Employee)
- **Structure**:
- `src/models/User.js` - username, password (hashed), employee ref, refreshToken
- `src/utils/jwt.js` - token generation/validation utilities
- `src/middleware/auth.js` - JWT verification middleware
- **Endpoints**:
- `mutation login(username, password)` → JWT token
- `mutation refreshToken(refreshToken)` → new JWT
- `mutation logout` → invalidate refresh token
- **Permissions**: Public access for login, authenticated for refresh/logout
- **PR**: "JWT Authentication System"

### 2.2 RBAC Permission System

- **Description**: Role-based access control with granular permissions
- **Models**: Permission definitions in Employee schema
- **Structure**:
- `src/handles/permissions.js` - permission checking utilities
- `src/middleware/rbac.js` - GraphQL resolver permission wrapper
- `src/constants/roles.js` - role definitions (Admin, BranchManager, Employee, Vendor)
- `src/constants/permissions.js` - permission matrix
- **Utilities**:
- `isAuthorized(user, action, resource)` - check if user can perform action
- `@requirePermission(permission)` - decorator for resolvers
- **Features**: Action-level permissions, resource ownership checks
- **PR**: "RBAC Permission Framework"

### 2.3 Audit Logging

- **Description**: Track all operations and unauthorized access attempts
- **Models**: AuditLog
- **Structure**:
- `src/models/AuditLog.js` - userId, action, resource, timestamp, status, metadata
- `src/middleware/audit.js` - audit middleware for GraphQL
- **Features**: Auto-log all mutations, permission violations
- **PR**: "Audit Logging System"

---

## 3. DATA MODELS & SCHEMAS

### 3.1 Organization Model

- **Description**: Root entity representing the organization
- **Structure**: `src/models/Organization.js`
- **Fields**:
- `name` (String, required, indexed)
- `branches` ([ref Branch])
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `addBranch(branchId)` - link branch to organization
- `getDetails()` - populate full organization structure
- **Indexes**: `name`
- **PR**: "Organization Model"

### 3.2 Branch Model

- **Description**: Branch entity with employees and manager
- **Structure**: `src/models/Branch.js`
- **Fields**:
- `name` (String, required, indexed)
- `organization` (ref Organization)
- `employees` ([ref Employee])
- `manager` (ref Employee)
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `addEmployee(employeeId)` - add employee to branch
- `getEmployees()` - get all branch employees
- **Indexes**: `name`, `organization`
- **PR**: "Branch Model"

### 3.3 Employee Model

- **Description**: Employee with designation, manager hierarchy, permissions
- **Structure**: `src/models/Employee.js`
- **Fields**:
- `userId` (String, unique, required)
- `name` (String, required)
- `branch` (ref Branch)
- `designation` (String, enum: ['Admin', 'BranchManager', 'Employee'])
- `manager` (ref Employee, optional)
- `permissions` ([String]) - array of permission keys
- `expenses` ([ref Transaction])
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `hasPermission(permission)` - check if employee has permission
- `getSubordinates()` - get all reporting employees
- `getTotalExpenses(startDate, endDate)` - aggregate expenses
- **Indexes**: `userId`, `branch`, `manager`, `designation`
- **PR**: "Employee Model"

### 3.4 Vendor Model

- **Description**: External vendor tracking
- **Structure**: `src/models/Vendor.js`
- **Fields**:
- `name` (String, required, indexed)
- `contactInfo` (Object: { email, phone, address })
- `transactions` ([ref Transaction])
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `getLedger(startDate, endDate)` - get vendor transaction history
- `getOutstandingBalance()` - calculate balance
- **Indexes**: `name`
- **PR**: "Vendor Model"

### 3.5 Transaction Model (Double-Entry Bookkeeping)

- **Description**: Financial transactions with double-entry system
- **Structure**: `src/models/Transaction.js`
- **Fields**:
- `transactionId` (String, unique, auto-generated)
- `amount` (Number, required)
- `type` (String, enum: ['credit', 'debit', 'refund', 'purchase', 'transfer'])
- `debitAccount` (Object: { accountType, accountId }) - where money comes from
- `creditAccount` (Object: { accountType, accountId }) - where money goes to
- `reference` (Object: { refType, refId }) - employee/branch/vendor ref
- `description` (String)
- `status` (String, enum: ['pending', 'approved', 'rejected'])
- `approvedBy` (ref Employee, optional)
- `linkedTransaction` (ref Transaction) - for double-entry pair
- `metadata` (Object) - additional context
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `approve(approverId)` - approve transaction
- `reject(approverId, reason)` - reject transaction
- `createDoubleEntry()` - create matching debit/credit entry
- **Indexes**: `transactionId`, `reference.refId`, `createdAt`, `type`, `status`
- **PR**: "Transaction Model with Double-Entry"

### 3.6 Account Model (for Double-Entry System)

- **Description**: Chart of accounts for double-entry bookkeeping
- **Structure**: `src/models/Account.js`
- **Fields**:
- `accountCode` (String, unique)
- `accountName` (String)
- `accountType` (String, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'])
- `parentAccount` (ref Account, optional)
- `balance` (Number, default 0)
- `entity` (Object: { entityType, entityId }) - link to employee/branch/vendor
- `createdAt`, `updatedAt` (Date)
- **Methods**:
- `updateBalance(amount, operation)` - debit/credit balance
- `getBalance()` - current balance
- `getLedger(startDate, endDate)` - transaction history
- **Indexes**: `accountCode`, `entity.entityId`, `accountType`
- **PR**: "Account Model for Chart of Accounts"

---

## 4. GRAPHQL API LAYER

### 4.1 GraphQL Schema Definition

- **Description**: Complete type definitions for all entities
- **Structure**: `src/graphql/schema/`
- `typeDefs.js` - main schema composition
- `types/organization.graphql` - Organization types
- `types/branch.graphql` - Branch types
- `types/employee.graphql` - Employee types
- `types/vendor.graphql` - Vendor types
- `types/transaction.graphql` - Transaction types
- `types/account.graphql` - Account types
- `types/auth.graphql` - Auth types
- **PR**: "GraphQL Schema Definitions"

### 4.2 Organization Resolvers

- **Description**: CRUD operations for organizations
- **Structure**: `src/graphql/resolvers/organizationResolvers.js`
- **Queries**:
- `organization(id)` - get single organization
- `organizations(filter, pagination)` - list organizations
- **Mutations**:
- `createOrganization(input)` - create organization
- `updateOrganization(id, input)` - update organization
- `deleteOrganization(id)` - soft delete organization
- **Permissions**:
- Queries: Admin, BranchManager (own org only)
- Mutations: Admin only
- **PR**: "Organization Resolvers"

### 4.3 Branch Resolvers

- **Description**: CRUD operations for branches
- **Structure**: `src/graphql/resolvers/branchResolvers.js`
- **Queries**:
- `branch(id)` - get single branch
- `branches(organizationId, filter, pagination)` - list branches
- `branchEmployees(branchId)` - get branch employees
- **Mutations**:
- `createBranch(input)` - create branch
- `updateBranch(id, input)` - update branch
- `deleteBranch(id)` - soft delete branch
- `assignManager(branchId, employeeId)` - assign branch manager
- **Permissions**:
- Queries: All authenticated (filtered by access)
- Mutations: Admin, BranchManager (own branch only)
- **PR**: "Branch Resolvers"

### 4.4 Employee Resolvers

- **Description**: CRUD and management operations for employees
- **Structure**: `src/graphql/resolvers/employeeResolvers.js`
- **Queries**:
- `employee(id)` - get single employee
- `employees(branchId, filter, pagination)` - list employees
- `employeeSubordinates(employeeId)` - get subordinates
- `employeeExpenses(employeeId, dateRange)` - get employee expenses
- **Mutations**:
- `createEmployee(input)` - create employee
- `updateEmployee(id, input)` - update employee
- `deleteEmployee(id)` - soft delete employee
- `assignManager(employeeId, managerId)` - assign manager
- `updatePermissions(employeeId, permissions)` - update permissions
- **Permissions**:
- Queries: All authenticated (filtered by hierarchy)
- Mutations: Admin, BranchManager (own branch only)
- **PR**: "Employee Resolvers"

### 4.5 Vendor Resolvers

- **Description**: CRUD operations for vendors
- **Structure**: `src/graphql/resolvers/vendorResolvers.js`
- **Queries**:
- `vendor(id)` - get single vendor
- `vendors(filter, pagination)` - list vendors
- `vendorLedger(vendorId, dateRange)` - get vendor transactions
- `vendorBalance(vendorId)` - get outstanding balance
- **Mutations**:
- `createVendor(input)` - create vendor
- `updateVendor(id, input)` - update vendor
- `deleteVendor(id)` - soft delete vendor
- **Permissions**:
- Queries: All authenticated
- Mutations: Admin, BranchManager
- **PR**: "Vendor Resolvers"

### 4.6 Transaction Resolvers

- **Description**: Transaction operations with approval workflow
- **Structure**: `src/graphql/resolvers/transactionResolvers.js`
- **Queries**:
- `transaction(id)` - get single transaction
- `transactions(filter, dateRange, pagination)` - list transactions
- `employeeLedger(employeeId, dateRange)` - employee transaction history
- `branchLedger(branchId, dateRange)` - branch transaction history
- `organizationLedger(orgId, dateRange)` - org transaction history
- `pendingApprovals(managerId)` - transactions awaiting approval
- **Mutations**:
- `createTransaction(input)` - record transaction (creates double-entry)
- `updateTransaction(id, input)` - update pending transaction
- `approveTransaction(id)` - approve expense (manager only)
- `rejectTransaction(id, reason)` - reject expense (manager only)
- `recordExpense(input)` - employee records expense
- **Permissions**:
- Queries: All authenticated (filtered by access)
- Mutations:
- create/update: Employee (own), BranchManager, Admin
- approve/reject: Manager of the employee only
- **PR**: "Transaction Resolvers"

### 4.7 Account Resolvers (Double-Entry)

- **Description**: Chart of accounts management
- **Structure**: `src/graphql/resolvers/accountResolvers.js`
- **Queries**:
- `account(id)` - get single account
- `accounts(filter, pagination)` - list accounts
- `accountBalance(accountId)` - get current balance
- `chartOfAccounts()` - get full chart of accounts
- **Mutations**:
- `createAccount(input)` - create account
- `updateAccount(id, input)` - update account
- `closeAccount(id)` - close account
- **Permissions**:
- Queries: Admin, BranchManager
- Mutations: Admin only
- **PR**: "Account Resolvers"

### 4.8 Reporting & Analytics Resolvers

- **Description**: Aggregate queries and reporting
- **Structure**: `src/graphql/resolvers/reportResolvers.js`
- **Queries**:
- `expenseSummary(entityType, entityId, dateRange)` - expense aggregations
- `branchExpenseComparison(dateRange)` - compare branch expenses
- `employeeExpenseReport(branchId, dateRange)` - employee expense breakdown
- `vendorSpendingReport(dateRange)` - vendor spending analysis
- `balanceSheet(date)` - organization balance sheet
- `incomeStatement(startDate, endDate)` - profit/loss statement
- **Permissions**: Admin, BranchManager (own branch only)
- **PR**: "Reporting & Analytics Resolvers"

---

## 5. BUSINESS LOGIC & UTILITIES

### 5.1 Input Validation Module

- **Description**: Joi-based input validation schemas
- **Structure**: `src/handles/validation.js`, `src/schemas/`
- `schemas/organizationSchema.js` - organization validation
- `schemas/branchSchema.js` - branch validation
- `schemas/employeeSchema.js` - employee validation
- `schemas/vendorSchema.js` - vendor validation
- `schemas/transactionSchema.js` - transaction validation
- **Utilities**:
- `validateInput(data, schema)` - validate and sanitize
- `validateObjectId(id)` - MongoDB ObjectId validation
- **PR**: "Input Validation Schemas"

### 5.2 Error Handling Module

- **Description**: Centralized error handling with custom error classes
- **Structure**: `src/handles/errors.js`
- **Classes**:
- `ValidationError` - input validation failures
- `AuthenticationError` - auth failures
- `AuthorizationError` - permission denied
- `NotFoundError` - resource not found
- `ConflictError` - duplicate/conflict
- `DatabaseError` - DB operation failures
- **Utilities**:
- `errorHandler(error, context)` - format and log errors
- `asyncHandler(fn)` - wrap async functions
- **PR**: "Error Handling Framework"

### 5.3 Transaction Management (Double-Entry Logic)

- **Description**: Business logic for double-entry bookkeeping
- **Structure**: `src/utils/doubleEntry.js`
- **Functions**:
- `createDoubleEntryTransaction(debit, credit, amount, description)` - create matched pair
- `validateDoubleEntry(transaction)` - ensure debits = credits
- `reconcileAccounts(accountIds)` - reconcile account balances
- `getEntityBalance(entityType, entityId)` - calculate entity balance
- **PR**: "Double-Entry Bookkeeping Logic"

### 5.4 Expense Approval Workflow

- **Description**: Manager approval logic for employee expenses
- **Structure**: `src/utils/approvalWorkflow.js`
- **Functions**:
- `getApprover(employeeId)` - find employee's manager
- `canApprove(managerId, transactionId)` - check approval authority
- `notifyApprover(transactionId)` - send approval notification
- `processApproval(transactionId, approverId, decision)` - approve/reject
- **PR**: "Approval Workflow Logic"

### 5.5 Ledger & Balance Calculation

- **Description**: Utilities for ledger queries and balance calculations
- **Structure**: `src/utils/ledger.js`
- **Functions**:
- `calculateEntityLedger(entityType, entityId, dateRange)` - generate ledger
- `calculateRunningBalance(transactions)` - running balance calculation
- `aggregateByPeriod(transactions, period)` - group by day/week/month
- `generateBalanceSheet(orgId, date)` - balance sheet calculation
- **PR**: "Ledger Calculation Utilities"

---

## 6. MIDDLEWARE & INTERCEPTORS

### 6.1 GraphQL Context Builder

- **Description**: Build context for each GraphQL request
- **Structure**: `src/middleware/context.js`
- **Features**: Extract JWT, attach user, attach logger, attach permissions
- **PR**: "GraphQL Context Middleware"

### 6.2 Rate Limiting Middleware

- **Description**: Protect API from abuse
- **Structure**: `src/middleware/rateLimit.js`
- **Features**: Per-user rate limits, configurable thresholds
- **PR**: "Rate Limiting Middleware"

### 6.3 Request Logging Middleware

- **Description**: Log all incoming requests
- **Structure**: `src/middleware/requestLogger.js`
- **Features**: Log query/mutation name, user, execution time
- **PR**: "Request Logging Middleware"

---

## 7. TESTING

### 7.1 Unit Tests - Models

- **Description**: Test model methods and validations
- **Structure**: `tests/unit/models/`
- `organization.test.js`
- `branch.test.js`
- `employee.test.js`
- `vendor.test.js`
- `transaction.test.js`
- `account.test.js`
- **Coverage**: Schema validation, model methods, edge cases
- **PR**: "Unit Tests - Models"

### 7.2 Unit Tests - Utilities

- **Description**: Test utility functions
- **Structure**: `tests/unit/utils/`
- `jwt.test.js`
- `doubleEntry.test.js`
- `ledger.test.js`
- `approvalWorkflow.test.js`
- **Coverage**: Business logic, error cases, edge cases
- **PR**: "Unit Tests - Utilities"

### 7.3 Unit Tests - RBAC

- **Description**: Test permission checking
- **Structure**: `tests/unit/handles/permissions.test.js`
- **Coverage**: All permission scenarios, role hierarchies
- **PR**: "Unit Tests - RBAC"

### 7.4 Integration Tests - Authentication

- **Description**: Test auth flow end-to-end
- **Structure**: `tests/integration/auth.test.js`
- **Coverage**: Login, token refresh, logout, invalid tokens
- **PR**: "Integration Tests - Authentication"

### 7.5 Integration Tests - CRUD Operations

- **Description**: Test all CRUD flows
- **Structure**: `tests/integration/`
- `organization.test.js`
- `branch.test.js`
- `employee.test.js`
- `vendor.test.js`
- `transaction.test.js`
- **Coverage**: Create, read, update, delete for each entity, permission boundaries
- **PR**: "Integration Tests - CRUD"

### 7.6 Integration Tests - Transactions & Approvals

- **Description**: Test transaction recording and approval workflow
- **Structure**: `tests/integration/transactionFlow.test.js`
- **Coverage**: Record expense, approval by manager, rejection, double-entry validation
- **PR**: "Integration Tests - Transaction Flow"

### 7.7 Integration Tests - Reporting

- **Description**: Test aggregate queries and reports
- **Structure**: `tests/integration/reporting.test.js`
- **Coverage**: All report types, date ranges, filtering, accuracy
- **PR**: "Integration Tests - Reporting"

### 7.8 Test Utilities & Fixtures

- **Description**: Shared test utilities and data fixtures
- **Structure**: `tests/helpers/`
- `dbSetup.js` - test DB setup/teardown
- `fixtures.js` - sample data generators
- `authHelper.js` - generate test tokens
- **PR**: "Test Infrastructure"

---

## 8. DOCUMENTATION

### 8.1 API Documentation

- **Description**: Complete GraphQL schema documentation
- **Structure**: `docs/API.md`
- **Content**: All queries/mutations, input types, examples, error codes
- **PR**: "API Documentation"

### 8.2 RBAC Permission Matrix

- **Description**: Table of roles and permissions
- **Structure**: `docs/RBAC.md`
- **Content**: Permission matrix, role descriptions, examples
- **PR**: "RBAC Documentation"

### 8.3 Double-Entry Bookkeeping Guide

- **Description**: Explain double-entry system implementation
- **Structure**: `docs/ACCOUNTING.md`
- **Content**: Account types, transaction flow, chart of accounts, reconciliation
- **PR**: "Accounting Documentation"

### 8.4 Deployment Guide

- **Description**: AWS Lambda deployment instructions
- **Structure**: `docs/DEPLOYMENT.md`
- **Content**: Environment setup, serverless deploy, CI/CD, monitoring
- **PR**: "Deployment Documentation"

### 8.5 Development Setup Guide

- **Description**: Local development setup
- **Structure**: `README.md`
- **Content**: Prerequisites, installation, running locally, testing, contributing
- **PR**: "README & Setup Guide"

### 8.6 Schema Diagrams

- **Description**: ERD and architecture diagrams
- **Structure**: `docs/diagrams/`
- `erd.png` - entity relationship diagram
- `architecture.png` - system architecture
- `transaction-flow.png` - transaction approval flow
- **PR**: "Schema & Architecture Diagrams"

---

## 9. AWS LAMBDA & SERVERLESS DEPLOYMENT

### 9.1 Serverless Framework Configuration

- **Description**: Configure serverless.yml for AWS Lambda
- **Structure**: `serverless.yml`
- **Configuration**:
- Lambda function definitions
- API Gateway integration
- Environment variables
- IAM roles and permissions
- VPC configuration (for MongoDB connection)
- **Features**: Separate stages (dev, staging, prod), custom domains
- **PR**: "Serverless Configuration"

### 9.2 Lambda Handler

- **Description**: Entry point for AWS Lambda
- **Structure**: `src/lambda.js`
- **Features**: Apollo Server Lambda integration, connection pooling optimization
- **PR**: "Lambda Handler Setup"

### 9.3 Environment Configuration

- **Description**: Environment-specific configurations
- **Structure**: `src/config/environments/`
- `development.js`
- `staging.js`
- `production.js`
- **PR**: "Environment Configurations"

### 9.4 MongoDB Connection Optimization

- **Description**: Optimize DB connections for Lambda
- **Structure**: `src/config/database.js` (enhancement)
- **Features**: Connection reuse across invocations, connection pooling
- **PR**: "Lambda DB Connection Optimization"

### 9.5 CI/CD Pipeline

- **Description**: Automated deployment pipeline
- **Structure**: `.github/workflows/deploy.yml` or `buildspec.yml`
- **Features**: Automated testing, deployment on merge, rollback capability
- **PR**: "CI/CD Pipeline Setup"

---

## 10. SECURITY & MONITORING

### 10.1 Input Sanitization

- **Description**: Sanitize all inputs to prevent injection attacks
- **Structure**: `src/middleware/sanitization.js`
- **Features**: MongoDB injection prevention, XSS prevention
- **PR**: "Input Sanitization"

### 10.2 CloudWatch Integration

- **Description**: AWS CloudWatch logging and monitoring
- **Structure**: `src/config/cloudwatch.js`
- **Features**: Custom metrics, alarms, log aggregation
- **PR**: "CloudWatch Monitoring"

### 10.3 Secrets Management

- **Description**: Use AWS Secrets Manager for sensitive data
- **Structure**: `src/config/secrets.js`
- **Features**: JWT secret, DB credentials from Secrets Manager
- **PR**: "Secrets Management"

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (PRs 1-10)

- [ ] Project Setup & Dependencies
- [ ] Database Configuration
- [ ] Logging Infrastructure
- [ ] JWT Authentication System
- [ ] RBAC Permission Framework
- [ ] Organization Model
- [ ] Branch Model
- [ ] Employee Model
- [ ] Vendor Model
- [ ] Error Handling Framework

### Phase 2: Core Models & Double-Entry (PRs 11-15)

- [ ] Transaction Model with Double-Entry
- [ ] Account Model for Chart of Accounts
- [ ] Double-Entry Bookkeeping Logic
- [ ] Input Validation Schemas
- [ ] Ledger Calculation Utilities

### Phase 3: GraphQL API (PRs 16-25)

- [ ] GraphQL Schema Definitions
- [ ] GraphQL Context Middleware
- [ ] Organization Resolvers
- [ ] Branch Resolvers
- [ ] Employee Resolvers
- [ ] Vendor Resolvers
- [ ] Transaction Resolvers
- [ ] Account Resolvers
- [ ] Reporting & Analytics Resolvers
- [ ] Approval Workflow Logic

### Phase 4: Security & Middleware (PRs 26-30)

- [ ] Audit Logging System
- [ ] Rate Limiting Middleware
- [ ] Request Logging Middleware
- [ ] Input Sanitization
- [ ] Secrets Management

### Phase 5: Testing (PRs 31-40)

- [ ] Test Infrastructure
- [ ] Unit Tests - Models
- [ ] Unit Tests - Utilities
- [ ] Unit Tests - RBAC
- [ ] Integration Tests - Authentication
- [ ] Integration Tests - CRUD
- [ ] Integration Tests - Transaction Flow
- [ ] Integration Tests - Reporting
- [ ] Test coverage validation (90%+)
- [ ] E2E smoke tests

### Phase 6: AWS Lambda Deployment (PRs 41-45)

- [ ] Serverless Configuration
- [ ] Lambda Handler Setup
- [ ] Environment Configurations
- [ ] Lambda DB Connection Optimization
- [ ] CI/CD Pipeline Setup

### Phase 7: Monitoring & Documentation (PRs 46-52)

- [ ] CloudWatch Monitoring
- [ ] API Documentation
- [ ] RBAC Documentation
- [ ] Accounting Documentation
- [ ] Deployment Documentation
- [ ] README & Setup Guide
- [ ] Schema & Architecture Diagrams

---

## PERMISSION MATRIX

| Role              | Organization | Branch     | Employee        | Vendor    | Transaction             | Account   | Reports            |
| ----------------- | ------------ | ---------- | --------------- | --------- | ----------------------- | --------- | ------------------ |
| **Admin**         | Full CRUD    | Full CRUD  | Full CRUD       | Full CRUD | Full CRUD + Approve All | Full CRUD | All Reports        |
| **BranchManager** | Read Own     | Update Own | CRUD Own Branch | CRUD      | Approve Subordinates    | Read Own  | Own Branch Reports |
| **Employee**      | Read Own     | Read Own   | Read Self       | Read      | Create Own Expenses     | Read Own  | Own Reports        |
| **Vendor**        | None         | None       | None            | Read Self | Read Own                | Read Own  | Own Reports        |

---

## ESTIMATED COMPLEXITY

- **Total PRs**: ~52
- **Models**: 7 (Organization, Branch, Employee, Vendor, Transaction, Account, User, AuditLog)
- **GraphQL Queries**: ~30
- **GraphQL Mutations**: ~25
- **Utility Modules**: ~15
- **Test Files**: ~20
- **Documentation Files**: 6
- **Estimated Development Time**: 8-10 weeks (1 developer)
