# TypeORM Entity Factory

English | [Русский](README.ru.md)

A library for creating TypeORM entity factories to simplify test data generation in NestJS applications.

## Why Use This

When writing unit tests, you often need to create entity instances with populated data. Instead of manually creating objects in every test, factories allow you to:

- Centrally define test data structure
- Quickly generate realistic data using Faker
- Override specific fields when needed
- Create multiple instances with a single command
- Avoid code duplication across tests

## Installation

```bash
pnpm add -D typeorm-factories @faker-js/faker
# or
npm install --save-dev typeorm-factories @faker-js/faker
```

The library uses [@faker-js/faker](https://github.com/faker-js/faker) to generate fake data.

## Quick Start

### 1. Define a Factory

Create a factory file (e.g., `factories/task.factory.ts`):

```typescript
import { faker } from '@faker-js/faker';
import { define } from 'typeorm-factories';
import { Task } from '../src/entities/task.entity';

define(Task, (fakerInstance) => {
  const task = new Task();
  
  task.id = fakerInstance.string.uuid();
  task.title = fakerInstance.lorem.sentence();
  task.description = fakerInstance.lorem.paragraph();
  task.completed = fakerInstance.datatype.boolean();
  task.createdAt = fakerInstance.date.past();
  
  return task;
});
```

### 2. Use the Factory in Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactoryModule, factory } from 'typeorm-factories';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoryModule],
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();
    
    await module.init();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const taskData = await factory(Task).make();
      
      jest.spyOn(repository, 'save').mockResolvedValue(taskData);

      const result = await service.create(taskData);
      
      expect(result).toEqual(taskData);
      expect(repository.save).toHaveBeenCalledWith(taskData);
    });
  });

  describe('findCompleted', () => {
    it('should return only completed tasks', async () => {
      const completedTasks = await factory(Task)
        .makeMany(3, { completed: true });
      
      jest.spyOn(repository, 'find').mockResolvedValue(completedTasks);

      const result = await service.findCompleted();
      
      expect(result).toHaveLength(3);
      expect(result.every(task => task.completed)).toBe(true);
    });
  });
});
```

## API

### `define(Entity, factoryFunction)`

Registers a factory for an entity.

**Parameters:**
- `Entity`: TypeORM entity class
- `factoryFunction`: Function that receives a Faker instance and optional settings, returns a populated entity

```typescript
define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.name = faker.person.fullName();
  return user;
});
```

### `factory(Entity, settings?)`

Creates an EntityFactory instance for generating entity objects.

**Parameters:**
- `Entity`: Entity class
- `settings` (optional): Additional settings for the factory

**Returns:** `EntityFactory<Entity, Settings>`

### EntityFactory API

#### `make(overrideParams?)`

Creates a single entity instance.

```typescript
const task = await factory(Task).make();

// With field overrides
const urgentTask = await factory(Task).make({ 
  priority: 'high',
  dueDate: new Date('2024-12-31')
});
```

#### `makeMany(count, overrideParams?)`

Creates an array of entity instances.

```typescript
// Create 5 tasks
const tasks = await factory(Task).makeMany(5);

// Create 3 tasks with "completed" status
const completedTasks = await factory(Task).makeMany(3, { completed: true });
```

#### `map(callback)`

Applies a function to each created object. Useful for additional processing.

```typescript
const tasksWithTimestamps = await factory(Task)
  .map(async (task) => {
    task.updatedAt = new Date();
    return task;
  })
  .makeMany(5);
```

## Advanced Usage

### Sequences

Generate unique sequential values for each entity:

```typescript
define(User, (faker, settings, sequence) => {
  const user = new User();
  user.email = `user${sequence}@example.com`;
  user.username = `user_${sequence}`;
  user.name = faker.person.fullName();
  return user;
});

// Creates users with emails: user0@, user1@, user2@
const users = await factory(User).makeMany(3);
```

### States

Define reusable modifications to your entities:

```typescript
define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.role = 'user';
  user.status = 'active';
  return user;
})
  .state('admin', (user) => {
    user.role = 'admin';
    user.permissions = ['read', 'write', 'delete'];
    return user;
  })
  .state('suspended', (user) => {
    user.status = 'suspended';
    user.suspendedAt = new Date();
    return user;
  })
  .state('premium', async (user) => {
    user.subscriptionTier = 'premium';
    user.subscriptionEndsAt = faker.date.future();
    return user;
  });

// Apply single state
const admin = await factory(User).state('admin').make();

// Apply multiple states
const suspendedAdmin = await factory(User)
  .states(['admin', 'suspended'])
  .make();
```

### Lifecycle Hooks

Execute code before or after entity creation:

```typescript
define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.password = 'plain-password';
  return user;
})
  .beforeMake(async (user) => {
    // Hash password before creating
    user.password = await bcrypt.hash(user.password, 10);
  })
  .afterMake(async (user) => {
    // Log or perform additional setup
    console.log('User created:', user.email);
  });

const user = await factory(User).make();
// Password is automatically hashed
```

### Associations

Automatically create related entities:

```typescript
define(Post, (faker) => {
  const post = new Post();
  post.title = faker.lorem.sentence();
  post.content = faker.lorem.paragraphs();
  return post;
})
  .association('author', User)
  .association('comments', Comment, { count: 3 });

// Automatically creates a User and 3 Comments
const post = await factory(Post).make();
console.log(post.author); // User instance
console.log(post.comments); // Array of 3 Comment instances
```

### Build Method

Create entities without using Faker (useful for mocks):

```typescript
const userMock = factory(User).build({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
});

// Returns a plain object without calling faker
expect(userMock.email).toBe('test@example.com');
```

### Combining Features

All features can be combined for complex scenarios:

```typescript
define(User, (faker, settings, sequence) => {
  const user = new User();
  user.email = `user${sequence}@example.com`;
  user.name = faker.person.fullName();
  user.role = 'user';
  return user;
})
  .state('withPosts', async (user) => {
    user.posts = await factory(Post).makeMany(5, { authorId: user.id });
    return user;
  })
  .beforeMake(async (user) => {
    user.createdAt = new Date();
  })
  .association('profile', UserProfile);

// Create an admin user with posts and profile
const admin = await factory(User)
  .state('withPosts')
  .make({ role: 'admin' });
```

### Factories with Settings

```typescript
interface UserSettings {
  role: 'admin' | 'user';
}

define(User, (faker, settings?: UserSettings) => {
  const user = new User();
  user.email = faker.internet.email();
  user.name = faker.person.fullName();
  user.role = settings?.role || 'user';
  return user;
});

// Usage
const admin = await factory(User, { role: 'admin' }).make();
const regularUser = await factory(User, { role: 'user' }).make();
```

### Nested Entities

Factories can automatically resolve nested entities:

```typescript
define(Comment, (faker) => {
  const comment = new Comment();
  comment.text = faker.lorem.paragraph();
  comment.author = factory(User).make(); // Returns a Promise
  return comment;
});

// Nested entity will be automatically resolved
const comment = await factory(Comment).make();
console.log(comment.author); // User object
```

### Related Entities

```typescript
define(Post, (faker) => {
  const post = new Post();
  post.title = faker.lorem.sentence();
  post.content = faker.lorem.paragraphs();
  return post;
});

define(Comment, (faker) => {
  const comment = new Comment();
  comment.text = faker.lorem.paragraph();
  return comment;
});

// Creating a post with comments
const post = await factory(Post).make();
const comments = await factory(Comment).makeMany(3, { postId: post.id });
```

### Resetting Sequences

Reset sequence counters between tests to ensure consistent data:

```typescript
import { resetSequences } from 'typeorm-factories';

describe('UserService', () => {
  beforeEach(() => {
    resetSequences(); // Reset all sequence counters
  });

  it('creates users with sequential emails', async () => {
    const users = await factory(User).makeMany(2);
    expect(users[0].email).toBe('user0@example.com');
    expect(users[1].email).toBe('user1@example.com');
  });
});
```

## Project Structure

It's recommended to keep factories in a separate directory:

```
your-project/
├── src/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── task.entity.ts
│   └── ...
├── factories/
│   ├── user.factory.ts
│   └── task.factory.ts
└── test/
    └── ...
```

The library automatically finds all files matching the pattern `**/*.factory.{js,ts}` when the module initializes.

## How It Works

1. When `FactoryModule` is imported into a test module, it scans the project for factory files
2. All found factories are registered in a global registry
3. The `factory()` function retrieves the registered factory by entity class
4. `make()` and `makeMany()` methods use Faker to generate data
5. Nested factories and promises are automatically resolved

## Compatibility

- TypeORM: ^0.3.0
- NestJS: ^11.0.0
- @faker-js/faker: ^10.0.0
- Node.js: >=18.0.0

## Complete Setup Example

**factories/task.factory.ts:**
```typescript
import { faker } from '@faker-js/faker';
import { define } from 'typeorm-factories';
import { Task, TaskStatus } from '../src/entities/task.entity';

define(Task, (fakerInstance) => {
  const task = new Task();
  
  task.id = fakerInstance.string.uuid();
  task.title = fakerInstance.lorem.sentence({ min: 3, max: 8 });
  task.description = fakerInstance.lorem.paragraph();
  task.status = fakerInstance.helpers.arrayElement([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE
  ]);
  task.priority = fakerInstance.number.int({ min: 1, max: 5 });
  task.dueDate = fakerInstance.date.future();
  task.createdAt = fakerInstance.date.past();
  task.updatedAt = new Date();
  
  return task;
});
```

**test/tasks.service.spec.ts:**
```typescript
import { Test } from '@nestjs/testing';
import { FactoryModule, factory } from 'typeorm-factories';
import { Task } from '../src/entities/task.entity';

describe('TasksService', () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [FactoryModule],
      // ... other providers
    }).compile();
    
    await module.init();
  });

  it('example test', async () => {
    const task = await factory(Task).make({ priority: 5 });
    expect(task.priority).toBe(5);
  });
});
```

## Support

If you have questions or issues, please create an [Issue](https://github.com/owl1n/typeorm-factories/issues/new) in the project repository.

## License

MIT
