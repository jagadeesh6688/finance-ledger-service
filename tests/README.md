# Finance Ledger Service Tests

Comprehensive unit and integration tests for the Finance Ledger Service.

## Test Coverage

The test suite includes:

- Constants and role-based permissions
- JWT token generation and verification  
- Error handling and custom error classes
- Authentication and authorization middleware
- RBAC permission checking
- Mongoose models with validation
- Edge cases and error conditions

## Running Tests

```bash
npm test                    # Run all tests with coverage
npm run test:unit          # Run unit tests only
npm run test:watch         # Run in watch mode
```

## Test Files Created

- tests/unit/constants/roles.test.js
- tests/unit/constants/permissions.test.js
- tests/unit/utils/jwt.test.js
- tests/unit/handles/errors.test.js
- tests/unit/handles/permissions.test.js
- tests/unit/middleware/auth.test.js
- tests/unit/middleware/rbac.test.js
- tests/unit/models/User.test.js

Each test file includes comprehensive coverage of happy paths, edge cases, error conditions, and integration scenarios.