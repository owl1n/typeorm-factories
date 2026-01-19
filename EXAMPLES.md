# Examples of New Features

This file demonstrates all the new features added to typeorm-factories.

## 1. Sequences

```typescript
// factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { define } from 'typeorm-factories';
import { User } from '../src/entities/user.entity';

define(User, (fakerInstance, settings, sequence) => {
  const user = new User();
  user.id = sequence;
  user.email = `user${sequence}@example.com`;
  user.username = `user_${sequence}`;
  user.name = fakerInstance.person.fullName();
  return user;
});

// In tests
const users = await factory(User).makeMany(3);
// users[0].email = 'user0@example.com'
// users[1].email = 'user1@example.com'
// users[2].email = 'user2@example.com'
```

## 2. States

```typescript
// factories/user.factory.ts
define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.name = faker.person.fullName();
  user.role = 'user';
  user.status = 'active';
  user.emailVerified = false;
  return user;
})
  .state('admin', (user) => {
    user.role = 'admin';
    user.permissions = ['read', 'write', 'delete', 'admin'];
    return user;
  })
  .state('verified', (user) => {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    return user;
  })
  .state('suspended', (user) => {
    user.status = 'suspended';
    user.suspendedAt = new Date();
    user.suspendedReason = 'Policy violation';
    return user;
  })
  .state('premium', async (user) => {
    user.subscriptionTier = 'premium';
    user.subscriptionStartedAt = new Date();
    user.subscriptionEndsAt = faker.date.future();
    return user;
  });

// In tests
const admin = await factory(User).state('admin').make();
const verifiedAdmin = await factory(User).states(['admin', 'verified']).make();
const suspendedPremium = await factory(User).states(['suspended', 'premium']).make();
```

## 3. Lifecycle Hooks

```typescript
// factories/user.factory.ts
import * as bcrypt from 'bcrypt';

define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.password = 'password123';
  user.name = faker.person.fullName();
  return user;
})
  .beforeMake(async (user) => {
    // Hash password before entity is created
    user.password = await bcrypt.hash(user.password, 10);
  })
  .beforeMake(async (user) => {
    // Generate avatar URL
    user.avatarUrl = `https://avatar.example.com/${user.email}`;
  })
  .afterMake(async (user) => {
    // Log creation
    console.log(`User created: ${user.email}`);
  })
  .afterMake(async (user) => {
    // Send welcome email (in real scenario)
    // await emailService.sendWelcome(user.email);
  });

// In tests
const user = await factory(User).make();
// Password is automatically hashed
// Avatar URL is generated
// Logs and emails are sent
```

## 4. Associations

```typescript
// factories/post.factory.ts
define(Post, (faker) => {
  const post = new Post();
  post.title = faker.lorem.sentence();
  post.content = faker.lorem.paragraphs(3);
  post.published = true;
  return post;
})
  .association('author', User)  // Creates one User
  .association('comments', Comment, { count: 5 })  // Creates 5 Comments
  .association('category', Category);

// In tests
const post = await factory(Post).make();
console.log(post.author);     // User instance
console.log(post.comments);   // Array of 5 Comment instances
console.log(post.category);   // Category instance
```

## 5. Build Method

```typescript
// In tests - useful for creating mocks without faker
const userMock = factory(User).build({
  id: 1,
  email: 'specific@example.com',
  name: 'John Doe',
  role: 'admin',
});

expect(userMock.email).toBe('specific@example.com');
expect(userMock.role).toBe('admin');

// Use in mocks
jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
```

## 6. Reset Sequences

```typescript
// test/user.service.spec.ts
import { resetSequences } from 'typeorm-factories';

describe('UserService', () => {
  beforeEach(() => {
    // Reset sequences before each test to ensure predictable data
    resetSequences();
  });

  it('creates users with sequential IDs', async () => {
    const users = await factory(User).makeMany(3);
    
    expect(users[0].email).toBe('user0@example.com');
    expect(users[1].email).toBe('user1@example.com');
    expect(users[2].email).toBe('user2@example.com');
  });

  it('resets sequences between tests', async () => {
    // This test will also start from user0@example.com
    const user = await factory(User).make();
    expect(user.email).toBe('user0@example.com');
  });
});
```

## 7. Combining All Features

```typescript
// Complex factory with all features
define(User, (faker, settings, sequence) => {
  const user = new User();
  user.id = sequence;
  user.email = `user${sequence}@example.com`;
  user.name = faker.person.fullName();
  user.role = settings?.role || 'user';
  user.status = 'active';
  return user;
})
  .state('withPosts', async (user) => {
    user.posts = await factory(Post).makeMany(5, { authorId: user.id });
    return user;
  })
  .state('withFollowers', async (user) => {
    const followers = await factory(User).makeMany(10);
    user.followers = followers;
    user.followerCount = followers.length;
    return user;
  })
  .beforeMake(async (user) => {
    user.createdAt = new Date();
    user.updatedAt = new Date();
  })
  .afterMake(async (user) => {
    // Generate user slug
    user.slug = user.name.toLowerCase().replace(/\s+/g, '-');
  })
  .association('profile', UserProfile);

// Usage
const popularAuthor = await factory(User, { role: 'author' })
  .states(['withPosts', 'withFollowers'])
  .make({ name: 'Jane Author' });

console.log(popularAuthor.email);        // user0@example.com
console.log(popularAuthor.role);         // 'author'
console.log(popularAuthor.name);         // 'Jane Author'
console.log(popularAuthor.posts.length); // 5
console.log(popularAuthor.followers.length); // 10
console.log(popularAuthor.profile);      // UserProfile instance
console.log(popularAuthor.slug);         // 'jane-author'
```

## 8. Real-World Test Example

```typescript
// test/post.service.spec.ts
import { Test } from '@nestjs/testing';
import { FactoryModule, factory, resetSequences } from 'typeorm-factories';
import { Post } from '../src/entities/post.entity';
import { User } from '../src/entities/user.entity';

describe('PostService', () => {
  let service: PostService;
  let repository: Repository<Post>;

  beforeEach(async () => {
    resetSequences();

    const module = await Test.createTestingModule({
      imports: [FactoryModule],
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();
    
    await module.init();
    service = module.get<PostService>(PostService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  describe('getPublishedPosts', () => {
    it('should return only published posts', async () => {
      const publishedPosts = await factory(Post)
        .state('published')
        .makeMany(3);
      
      jest.spyOn(repository, 'find').mockResolvedValue(publishedPosts);
      
      const result = await service.getPublishedPosts();
      
      expect(result).toHaveLength(3);
      expect(result.every(post => post.published)).toBe(true);
    });
  });

  describe('getPostWithAuthor', () => {
    it('should return post with author details', async () => {
      const post = await factory(Post)
        .association('author', User)
        .make();
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(post);
      
      const result = await service.getPostWithAuthor(post.id);
      
      expect(result.author).toBeDefined();
      expect(result.author.email).toContain('@example.com');
    });
  });

  describe('createPostByAdmin', () => {
    it('should create post with admin author', async () => {
      const admin = await factory(User)
        .state('admin')
        .make();
      
      const postData = factory(Post).build({
        title: 'Admin Post',
        content: 'Important announcement',
      });
      
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...postData,
        author: admin,
      });
      
      const result = await service.createPost(postData, admin.id);
      
      expect(result.author.role).toBe('admin');
    });
  });
});
```
