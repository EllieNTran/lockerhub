# GitHub Actions Workflows

## CI Workflow (`ci.yml`)

Runs on every push to `main` or `develop` branches and on all pull requests.

### Checks Performed

**TypeScript Services** (API, Webapp, Auth):
- ✅ ESLint - Code style and quality checks
- ✅ TypeScript - Type checking with `tsc --noEmit`

**Python Services** (Admin, Booking):
- ✅ Black - Code formatting check

### Running Locally

Before pushing, ensure all checks pass locally:

**TypeScript services:**
```bash
cd apps/api      # or apps/webapp, services/auth
npm run lint
npm run lint:fix  # Auto-fix issues
npm run typecheck
```

**Python services:**
```bash
cd services/admin  # or any other microservice
black src/         # Format code
black --check src/ # Check formatting
```

### Matrix Strategy

The workflow uses a matrix strategy to run checks in parallel for all services, reducing total CI time.

## CodeQL Security Scanning (`codeql.yml`)

Automated security vulnerability scanning for JavaScript/TypeScript and Python code.

- Runs on push/PR to `main` and `develop`
- Weekly scheduled scan every Monday at 6am UTC
- Uses extended security query suite
- Results visible in Security tab → Code scanning alerts

## Docker Build Validation (`docker-build.yml`)

Validates that all Docker images build successfully.

- Runs on all PRs and pushes to `main`/`develop`
- Builds all services
- Uses GitHub Actions cache for faster builds
- Prevents merging PRs with broken Docker builds

## Dependabot (`dependabot.yml`)

Automated dependency updates for npm, pip, and Docker base images.

- Weekly check for updates
- Creates PRs automatically
- Max 5 open PRs per package manager
- Monitors all services and Docker images

**Package ecosystems monitored:**
- npm: API, Webapp, Auth
- pip: Admin, Booking
- Docker: All services
