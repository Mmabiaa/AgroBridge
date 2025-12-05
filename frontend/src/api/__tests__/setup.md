# Test Setup Guide

This directory contains test files for the authentication system. To run these tests, you need to set up a testing framework.

## Setting up Vitest

1. Install the required testing dependencies:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

2. Create a `vitest.config.ts` file in the frontend root:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

3. Create a test setup file at `src/__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

4. Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

5. Run the tests:

```bash
npm test
```

## Test Files

- `contexts/__tests__/AuthContext.test.tsx` - Tests for the AuthContext
- `pages/__tests__/Login.test.tsx` - Tests for the Login component
- `pages/__tests__/Register.test.tsx` - Tests for the Register component
- `components/__tests__/ProtectedRoute.test.tsx` - Tests for the ProtectedRoute component

## Test Coverage

The tests cover:

- Authentication state management
- Login and registration form validation
- Permission-based route protection
- Error handling
- User interaction flows

## Running Individual Test Files

```bash
# Run specific test file
npm test -- Login.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```