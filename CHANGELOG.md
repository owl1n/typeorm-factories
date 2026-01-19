# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-01-19

### Breaking Changes
- Migrated from `yarn` to `pnpm` package manager
- Updated from `faker` to `@faker-js/faker` (v10.x)
- Updated `glob` API usage (v13.x)
- Updated all dependencies to latest versions:
  - TypeScript: 3.4.4 → 5.9.3
  - TypeORM: 0.2.45 → 0.3.28
  - NestJS: 6.11.11 → 11.1.12
  - Jest: 24.9.0 → 30.2.0

### Added
- **Sequences**: Auto-incrementing sequence numbers for unique values
  - Each factory maintains its own sequence counter
  - Access via third parameter in factory function: `(faker, settings, sequence) => { ... }`
  
- **States**: Reusable entity modifications
  - Define states with `.state(name, fn)`
  - Apply single state: `.state('admin')`
  - Apply multiple states: `.states(['admin', 'verified'])`
  
- **Lifecycle Hooks**: Execute code before/after entity creation
  - `.beforeMake(fn)` - runs before entity creation
  - `.afterMake(fn)` - runs after entity creation
  - Multiple hooks are executed in order of definition
  
- **Associations**: Automatically create related entities
  - Define with `.association(fieldName, EntityClass, options)`
  - Supports single entities and arrays
  - Example: `.association('comments', Comment, { count: 5 })`
  
- **Build Method**: Create entities without faker
  - `factory(Entity).build(params)` - creates plain object
  - Useful for mocks and stubs in tests
  
- **Reset Sequences**: Utility to reset sequence counters
  - `resetSequences()` - resets all counters to 0
  - Useful in `beforeEach()` hooks for test isolation

### Enhanced
- Factory function now receives sequence parameter
- Improved TypeScript typings for all new features
- Better error messages when factories are not defined
- Enhanced documentation with comprehensive examples

### Documentation
- Completely rewritten README.md with better structure
- Added README.ru.md (Russian translation)
- Created EXAMPLES.md with real-world usage scenarios
- Improved code examples throughout documentation
- Added migration guide for breaking changes

### Internal
- Refactored `EntityFactory` class for extensibility
- Added `FactoryDefinitionBuilder` for fluent factory definitions
- Improved error handling and validation
- Better separation of concerns in codebase

## [1.0.1] - Previous Version

Initial stable release with basic factory functionality.

### Features
- Define factories for TypeORM entities
- Generate entities with faker.js
- Override entity properties
- Create single or multiple entities
- Map function for entity transformation
- Nested entity support
