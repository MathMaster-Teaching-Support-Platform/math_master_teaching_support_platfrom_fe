# MathMaster Teaching Support Platform - Frontend

> An AI-powered teaching support platform designed to help mathematics educators in Vietnam efficiently create, manage, and deliver high-quality educational content with minimal preparation time.

[![License:  MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61dafb? logo=react)](https://reactjs.org)
[![Node](https://img.shields.io/badge/Node-18.x-339933?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6? logo=typescript)](https://www.typescriptlang.org)
[![Code Quality](https://img.shields.io/badge/Code_Quality-SonarQube-4E98F0)](https://www.sonarqube.org)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

## Overview

**MathMaster** is a comprehensive AI-powered platform designed to revolutionize mathematics education in Vietnam. It empowers educators to: 

- Generate curriculum-aligned teaching materials (slides, mindmaps, lesson plans)
- Create adaptive exercises and assessments with adjustable difficulty
- Build accurate mathematical visualizations and diagrams
- Leverage AI-powered assistance for content generation and student support
- Track student progress with advanced analytics
- Manage comprehensive digital teaching resources

The frontend is a modern, responsive React application built with TypeScript, providing an intuitive interface for teachers, students, and administrators.

**Project Code**: SP26SE026  
**Version**:  1.0.0  
**Status**: Active Development  
**Last Updated**: 2026-01-07

### User Personas

- **Teachers (Educators)**: Create and manage courses, generate content, track student performance
- **Students**:  Access learning materials, complete assignments, track progress
- **Administrators**:  Manage system settings, user accounts, and platform configuration

## Key Features

### For Teachers

- 📚 **Content Generation**
  - AI-powered material generator for slides, mindmaps, and lesson plans
  - Support for mathematical formulas and LaTeX rendering
  - Curriculum alignment for grades 1-12 in Vietnam
  - Template library and customizable designs

- ✏️ **Assessment Management**
  - Smart exercise generator with difficulty levels
  - Multiple question types:  MCQ, short-answer, proof-based, word problems
  - Automated grading and performance analytics
  - Test and answer key generation

- 📊 **Visualization Tools**
  - Interactive diagram and graph builder
  - Function plotting and geometric constructions
  - Coordinate system visualization
  - Statistical chart generation

- 📁 **Resource Management**
  - Personal teaching resource library
  - Material organization and tagging
  - Version control and export functionality
  - Content sharing and collaboration

- 📈 **Analytics Dashboard**
  - Real-time student performance tracking
  - Class-wide analytics and insights
  - Progress reports and visualizations
  - Learning pattern analysis

### For Students

- 📖 **Learning Interface**
  - Access to teacher-published materials and lessons
  - Interactive learning content with mathematical visualizations
  - Detailed explanations and step-by-step solutions

- ✅ **Assessment Participation**
  - Solve assignments and practice tests
  - Complete quizzes and exams
  - Real-time feedback and grade tracking
  - Solution reviews and explanations

- 📊 **Progress Tracking**
  - Personal learning dashboard
  - Progress analytics and performance reports
  - Strength and weakness analysis
  - Goal setting and achievement tracking

- 🤖 **AI Assistant**
  - Math-specialized AI for explanation and guidance
  - Solution step-by-step walkthroughs
  - Concept clarification and learning support

### For Administrators

- 👥 **User Management**
  - Account creation and permission management
  - Role-based access control (RBAC)
  - User activity monitoring

- ⚙️ **System Configuration**
  - AI engine settings and parameters
  - Platform content and template management
  - System monitoring and logs

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────┐
│           User Interface Layer                   │
│  (React Components, Pages, Layouts)             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│      State Management & Context                 │
│   (Redux Toolkit / Context API)                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         API Integration Layer                   │
│   (API Client, Hooks, Services)                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│       Backend API (Spring Boot)                 │
│   (RESTful Endpoints, WebSocket)                │
└─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Layout
│   ├── Header (Navigation, User Profile)
│   ├── Sidebar (Routes, Menu)
│   └── Footer
├── Pages
│   ├── Auth (Login, Register, Password Reset)
│   ├── Dashboard
│   │   ├── Teacher Dashboard
│   ���   ├── Student Dashboard
│   │   └── Admin Dashboard
│   ├── Content Management
│   │   ├── Material Generator
│   │   ├── Exercise Generator
│   │   ├── Diagram Builder
│   │   └── Resource Library
│   ├── Courses
│   │   ├── Course List
│   │   ├── Course Detail
│   │   └── Lesson Plan
│   ├── Assignments
│   │   ├── Assignment List
│   │   ├── Assignment Detail
│   │   ├── Student Submission
│   │   └── Grading Interface
│   ├── Analytics
│   │   ├── Performance Reports
│   │   ├── Learning Analytics
│   │   └── Visualizations
│   └── Admin Panel
│       ├── User Management
│       ├── System Settings
│       └── Monitoring
└── Common Components
    ├── Modals & Dialogs
    ├── Forms
    ├── Data Tables
    └── Utilities
```

## Tech Stack

### Frontend Framework
- **React** 18.x - UI library
- **TypeScript** 5.x - Type safety and development experience
- **Next.js** 14.x (Optional) - Framework for better structure and SSR
- **Vite** - Fast build tool and development server

### State Management
- **Redux Toolkit** - Global state management
- **React Query** / **TanStack Query** - Server state management and caching
- **Context API** - Local state management

### UI & Styling
- **Material-UI (MUI)** v5.x - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Emotion** - CSS-in-JS solution
- **Framer Motion** - Animation library

### HTTP & APIs
- **Axios** - HTTP client
- **Socket.io** - Real-time communication (WebSocket)

### Forms & Validation
- **React Hook Form** - Efficient form management
- **Yup** / **Zod** - Schema validation

### Utilities
- **Day.js** - Date manipulation
- **Lodash-es** - Utility library
- **Classnames** - Conditional class names
- **uuid** - Unique ID generation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Staged git file linting
- **Storybook** - Component documentation and testing

### Testing
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing
- **Jest** - Testing framework
- **Cypress** / **Playwright** - E2E testing
- **Mock Service Worker (MSW)** - API mocking

### Build & Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Vercel** / **Netlify** - Deployment platform

## Getting Started

### Prerequisites

```bash
# Verify Node.js version (18.x or higher)
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher

# Optional: Use nvm for Node version management
nvm use 18
```

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/MathMaster-Teaching-Support-Platform/math_master_teaching_support_platfrom_fe.git
   cd math_master_teaching_support_platfrom_fe
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example . env. local
   
   # Edit with your configuration
   nano .env.local
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   
   # Server runs at http://localhost:3000
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_API_TIMEOUT=30000

# WebSocket Configuration
REACT_APP_WS_URL=ws://localhost:8080/ws

# Authentication
REACT_APP_JWT_KEY=mathmaster_jwt_token
REACT_APP_REFRESH_TOKEN_KEY=mathmaster_refresh_token

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_AI_ASSISTANT=true
REACT_APP_ENABLE_COLLABORATION=true

# Third-party Services (Optional)
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id

# Application Settings
REACT_APP_APP_NAME=MathMaster
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Project Structure

```
src/
├── pages/                      # Page components and routes
│   ├── auth/                   # Authentication pages
│   │   ├── login. tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── dashboard/              # Dashboard pages
│   │   ├── teacher/
│   │   ├── student/
│   │   └── admin/
│   ├── content/                # Content management pages
│   │   ├── material-generator/
│   │   ├── exercise-generator/
│   │   ├── diagram-builder/
│   │   └── resource-library/
│   ├── courses/                # Course management
│   ├── assignments/            # Assignment pages
│   ├── analytics/              # Analytics pages
│   └── 404.tsx
│
├── components/                 # Reusable React components
│   ├── common/                 # Shared components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── ui/                     # UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Card/
│   │   ├── Form/
│   │   ├── DataTable/
│   │   └── Charts/
│   ├── features/               # Feature-specific components
│   │   ├── ContentGenerator/
│   │   ├── ExerciseBuilder/
│   │   ├── DiagramEditor/
│   │   └── StudentProgress/
│   └── editor/                 # Editors
│       ├── RichTextEditor/
│       ├── CodeEditor/
│       └── DiagramEditor/
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useFetch.ts
│   ├── useLocalStorage.ts
│   └── useWebSocket.ts
│
├── services/                   # Business logic and API calls
│   ├── api/
│   │   ├── authService.ts
│   │   ├── courseService.ts
│   │   ├── contentService.ts
│   │   ├── assignmentService.ts
│   │   ���── analyticsService.ts
│   ├── storage/
│   │   └── localStorageService.ts
│   └── notification/
│       └── notificationService.ts
│
├── store/                      # Redux store
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── contentSlice.ts
│   │   ├── courseSlice.ts
│   │   └── uiSlice.ts
│   ├── middleware/
│   └── store.ts
│
├── types/                      # TypeScript type definitions
│   ├── api.types.ts
│   ├── entity.types.ts
│   ├── ui.types.ts
│   └── common.types.ts
│
├── constants/                  # Application constants
│   ├── api.constants.ts
│   ├── routes.constants.ts
│   ├── ui.constants.ts
│   └── grade-levels.ts
│
├── utils/                      # Utility functions
│   ├── api.utils.ts
│   ├── date.utils.ts
│   ├── format.utils.ts
│   ├── validation.utils.ts
│   └── math.utils.ts
│
├── styles/                     # Global styles
│   ├── globals.css
│   ├── variables.css
│   ├── theme.ts
│   └── animations.css
│
├── config/                     # Configuration files
│   ├── api.config.ts
│   ├── routes.config.ts
│   └── theme.config.ts
│
├── middleware/                 # Middleware (auth, error handling)
│   ├── authMiddleware.ts
│   ├── errorHandler.ts
│   └── requestInterceptor.ts
│
├── App.tsx                     # Main App component
├── main.tsx                    # Entry point
└── index.css                   # Root styles

tests/                          # Test files
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── integration/
├── e2e/
│   └── cypress/
└── setup.ts

public/                         # Static assets
├── favicon. ico
├── images/
└── icons/

. github/                        # GitHub configuration
├── workflows/
│   ├── ci.yml
│   ├── deploy.yml
│   └── test.yml
└── ISSUE_TEMPLATE/

.storybook/                     # Storybook configuration
├── main.js
└── preview.js

docs/                           # Documentation
├── ARCHITECTURE.md
├── CODING_STANDARDS.md
├── SETUP_GUIDE.md
├── API_INTEGRATION.md
├── COMPONENT_GUIDE.md
└── TROUBLESHOOTING.md
```

## Configuration

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintignore'],
  parser: '@typescript-eslint/parser',
  rules: {
    'react-refresh/only-exports-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
```

## Development Guide

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint: fix
```

### Code Style & Best Practices

- **TypeScript**: Use strict mode and avoid `any` types
- **Component**:  Create functional components with hooks
- **Naming**: Use descriptive names (PascalCase for components)
- **Imports**: Use absolute imports with path aliases
- **Comments**: Document complex logic and components
- **Error Handling**:  Implement comprehensive error boundaries
- **Performance**: Use React. memo, useMemo, useCallback appropriately

### Component Example

```typescript
// src/components/ui/Button/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className || ''}`}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? <span className="spinner" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### API Integration Example

```typescript
// src/services/api/courseService.ts
import axiosInstance from '@/config/api. config';
import { Course, CreateCourseDto } from '@/types';

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    const { data } = await axiosInstance. get('/v1/courses');
    return data;
  },

  async getCourseById(id: string): Promise<Course> {
    const { data } = await axiosInstance. get(`/v1/courses/${id}`);
    return data;
  },

  async createCourse(payload: CreateCourseDto): Promise<Course> {
    const { data } = await axiosInstance. post('/v1/courses', payload);
    return data;
  },

  async updateCourse(id: string, payload: Partial<Course>): Promise<Course> {
    const { data } = await axiosInstance.put(`/v1/courses/${id}`, payload);
    return data;
  },

  async deleteCourse(id: string): Promise<void> {
    await axiosInstance.delete(`/v1/courses/${id}`);
  },
};
```

### Custom Hook Example

```typescript
// src/hooks/useFetch.ts
import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions {
  immediate?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  const { immediate = true, onError, onSuccess } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onError, onSuccess]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, refetch: execute };
}
```

## Testing Strategy

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- Button.test.tsx
```

### Unit Testing Example

```typescript
// src/components/ui/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('displays loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('respects variant prop', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });
});
```

### E2E Testing Example

```typescript
// tests/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('allows user to login with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('teacher@mathmaster.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-profile"]').should('be.visible');
  });

  it('shows error message for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@email. com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// src/pages/index.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/dashboard'));
const ContentGenerator = lazy(() => import('@/pages/content/material-generator'));

export function Routes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
      <ContentGenerator />
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// Use Next.js Image component for automatic optimization
import Image from 'next/image';

export function UserAvatar({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      priority={false}
      loading="lazy"
    />
  );
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build: analyze

# Generate visual report
npm run bundle-report
```

### Performance Metrics

```typescript
// src/utils/performance.utils.ts
export const reportWebVitals = (metric: any) => {
  if (metric.label === 'web-vital') {
    console.log(`${metric.name}: ${metric. value}`);
    // Send to analytics service
    trackMetric(metric);
  }
};
```

## Deployment

### Build Process

```bash
# Install dependencies
npm install --production

# Build application
npm run build

# Run type check
npm run type-check

# Verify build
npm run preview
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push: 
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with: 
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test: coverage
        
      - name:  Build
        run: npm run build
        
      - name: Deploy
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets. VERCEL_TOKEN }}
```

### Environment-Specific Configuration

- **Development**: Hot reload, debug logs, mock APIs
- **Staging**: Production-like environment, real APIs
- **Production**:  Optimized builds, analytics, error tracking

## Contributing

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.  Please review our [Code of Conduct](CODE_OF_CONDUCT.md).

### Contributing Guidelines

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/add-new-feature
   ```
3. **Commit** your changes with descriptive messages
   ```bash
   git commit -m "feat: add new feature description"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/add-new-feature
   ```
5. **Open** a Pull Request with detailed description

### PR Requirements

- [ ] Code follows project style guide
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] TypeScript has no errors
- [ ] Bundle size impact is minimal
- [ ] All CI checks pass

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:  `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: my feature description"

# Update with main branch
git fetch origin
git rebase origin/main

# Push to remote
git push origin feature/my-feature

# Create Pull Request via GitHub UI
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
VITE_PORT=3001 npm run dev
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Issues

```bash
# Clear build cache
npm run clean
npm run build
```

#### API Connection Issues

- Verify backend is running on correct port
- Check `.env.local` API URL
- Inspect network tab in browser DevTools
- Check CORS configuration in backend

#### Performance Issues

```bash
# Analyze bundle
npm run build:analyze

# Check for unused dependencies
npm audit
npx depcheck
```

## Support

### Documentation
- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Integration](docs/API_INTEGRATION.md)
- [Component Library](docs/COMPONENT_GUIDE.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING. md)

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/MathMaster-Teaching-Support-Platform/math_master_teaching_support_platfrom_fe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MathMaster-Teaching-Support-Platform/math_master_teaching_support_platfrom_fe/discussions)
- **Email**: support@mathmaster.com
- **Documentation**: [https://docs.mathmaster.com](https://docs.mathmaster.com)

### Reporting Issues

When reporting issues, please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recording

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contributors

<a href="https://github.com/MathMaster-Teaching-Support-Platform/math_master_teaching_support_platfrom_fe/graphs/contributors">
  <img src="https://contrib.rocks/image? repo=MathMaster-Teaching-Support-Platform/math_master_teaching_support_platfrom_fe" />
</a>

---

**Maintained by:** MathMaster Teaching Support Platform Team  
**Last Updated:** 2026-01-07  
**Status:** Active Development 🚀  
**Node Version:** 18.x  
**React Version:** 18.x  
**TypeScript:** 5.x
