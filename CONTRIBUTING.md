# Contributing to FiberPulse

Thank you for your interest in contributing to FiberPulse!

## Development Workflow

1. **Fork the repository** and clone your fork locally.
2. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Follow Conventional Commits**:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation updates
   - `refactor:` for code refactoring
   - `test:` for adding or updating tests
4. **Run linters and tests** before submitting a pull request:
   ```bash
   # Backend
   cd backend && php artisan test
   
   # Frontend
   cd frontend && npm run build
   ```
5. **Open a Pull Request** with a detailed summary of your changes.
