# Migration Guide: v1.x to v2.0

This guide helps you migrate from typeorm-factories v1.x to v2.0.

## Package Manager

**v1.x:**
```bash
yarn add typeorm-factories
```

**v2.0:**
```bash
pnpm add -D typeorm-factories @faker-js/faker
# or
npm install --save-dev typeorm-factories @faker-js/faker
```

## Faker Import

**v1.x:**
```typescript
import * as Faker from 'faker';

define(User, (faker: typeof Faker) => {
  const user = new User();
  user.id = faker.random.uuid();
  user.title = faker.lorem.word();
  return user;
});
```

**v2.0:**
```typescript
import { faker } from '@faker-js/faker';

define(User, (fakerInstance) => {
  const user = new User();
  user.id = fakerInstance.string.uuid();
  user.title = fakerInstance.lorem.word();
  return user;
});
```

## Faker API Changes

Some faker methods have changed in @faker-js/faker:

| v1.x (faker 4.x)        | v2.0 (@faker-js/faker 10.x)        |
|-------------------------|-------------------------------------|
| `faker.random.uuid()`   | `faker.string.uuid()`              |
| `faker.random.number()` | `faker.number.int()`               |
| `faker.name.firstName()`| `faker.person.firstName()`         |
| `faker.name.lastName()` | `faker.person.lastName()`          |
| `faker.name.findName()` | `faker.person.fullName()`          |

## New Features (Optional)

These features are new in v2.0 and completely optional:

### 1. Sequences (New)

```typescript
define(User, (faker, settings, sequence) => {
  const user = new User();
  user.email = `user${sequence}@example.com`; // New parameter
  return user;
});
```

### 2. States (New)

```typescript
define(User, (faker) => {
  const user = new User();
  user.role = 'user';
  return user;
})
  .state('admin', (user) => {
    user.role = 'admin';
    return user;
  });

// Usage
const admin = await factory(User).state('admin').make();
```

### 3. Lifecycle Hooks (New)

```typescript
define(User, (faker) => {
  const user = new User();
  user.password = 'plain';
  return user;
})
  .beforeMake(async (user) => {
    user.password = await hash(user.password);
  });
```

### 4. Associations (New)

```typescript
define(Post, (faker) => {
  const post = new Post();
  post.title = faker.lorem.sentence();
  return post;
})
  .association('author', User)
  .association('comments', Comment, { count: 3 });
```

### 5. Build Method (New)

```typescript
const userMock = factory(User).build({
  id: '123',
  email: 'test@example.com',
});
```

### 6. Reset Sequences (New)

```typescript
import { resetSequences } from 'typeorm-factories';

beforeEach(() => {
  resetSequences();
});
```

## Breaking Changes Summary

1. **Faker package changed**: `faker` → `@faker-js/faker`
2. **Faker API changed**: Many method paths updated (see table above)
3. **Minimum versions updated**:
   - TypeScript: 5.x
   - TypeORM: 0.3.x
   - NestJS: 11.x
   - Node.js: 18.x

## Step-by-Step Migration

1. **Update dependencies**:
   ```bash
   pnpm remove faker @types/faker
   pnpm add -D @faker-js/faker
   pnpm update typeorm @nestjs/common
   ```

2. **Update imports in factories**:
   ```typescript
   // Old
   import * as Faker from 'faker';
   
   // New
   import { faker } from '@faker-js/faker';
   ```

3. **Update faker method calls**:
   - Replace `faker.random.uuid()` with `faker.string.uuid()`
   - Replace `faker.name.*` with `faker.person.*`
   - Replace `faker.random.number()` with `faker.number.int()`

4. **Update type annotations** (if any):
   ```typescript
   // Old
   (faker: typeof Faker) => { ... }
   
   // New
   (faker) => { ... }
   // or with type
   (faker: Faker) => { ... }
   ```

5. **Test your factories**:
   ```bash
   pnpm test
   ```

## Need Help?

- Check [EXAMPLES.md](EXAMPLES.md) for usage examples
- Read the updated [README.md](README.md) or [README.ru.md](README.ru.md)
- Open an issue on [GitHub](https://github.com/owl1n/typeorm-factories/issues)

## Backward Compatibility

If you cannot migrate immediately, continue using v1.x. However, v2.0 is recommended for:
- Better TypeScript support
- Active maintenance
- New features
- Security updates
