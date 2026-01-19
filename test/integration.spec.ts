import { describe, it, expect, beforeEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User, Post } from './entities';

describe('Integration Tests', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should combine sequences, states, hooks, and associations', async () => {
    const beforeHook = vi.fn();
    const afterHook = vi.fn();

    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.id = `user-${sequence}`;
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      user.password = 'plain';
      return user;
    })
      .state('admin', (user) => {
        user.role = 'admin';
        return user;
      })
      .beforeMake(async (user) => {
        beforeHook();
        user.password = `hashed_${user.password}`;
      })
      .afterMake(async (user) => {
        afterHook();
        user.createdAt = new Date();
      });

    define(Post, (fakerInstance, settings, sequence) => {
      const post = new Post();
      post.id = `post-${sequence}`;
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    }).association('author', User);

    const post = await factory(Post).make();

    // Check associations
    expect(post.author).toBeDefined();
    expect(post.author).toBeInstanceOf(User);

    // Check sequences
    expect(post.id).toBe('post-0');
    expect(post.author!.id).toBe('user-0');
    expect(post.author!.email).toBe('user0@example.com');

    // Check hooks were executed
    expect(beforeHook).toHaveBeenCalledTimes(1);
    expect(afterHook).toHaveBeenCalledTimes(1);

    // Check hooks effect
    expect(post.author!.password).toBe('hashed_plain');
    expect(post.author!.createdAt).toBeInstanceOf(Date);
  });

  it('should apply states to associated entities', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      return user;
    }).state('admin', (user) => {
      user.role = 'admin';
      return user;
    });

    define(Post, (fakerInstance) => {
      const post = new Post();
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      post.published = false;
      return post;
    })
      .state('published', (post) => {
        post.published = true;
        return post;
      })
      .association('author', User);

    const post = await factory(Post).state('published').make();

    expect(post.published).toBe(true);
    expect(post.author!.role).toBe('user'); // Default role
  });

  it('should handle complex nested associations with all features', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.id = `user-${sequence}`;
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Post, (fakerInstance, settings, sequence) => {
      const post = new Post();
      post.id = `post-${sequence}`;
      post.title = `Post ${sequence}`;
      post.content = fakerInstance.lorem.paragraph();
      return post;
    })
      .association('author', User)
      .beforeMake(async (post) => {
        post.published = true;
      });

    const posts = await factory(Post).makeMany(3);

    expect(posts).toHaveLength(3);

    posts.forEach((post, index) => {
      expect(post.id).toBe(`post-${index}`);
      expect(post.title).toBe(`Post ${index}`);
      expect(post.published).toBe(true);
      expect(post.author).toBeInstanceOf(User);
      expect(post.author!.id).toBe(`user-${index}`);
    });
  });

  it('should allow overriding values with all features active', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      return user;
    })
      .state('admin', (user) => {
        user.role = 'admin';
        return user;
      })
      .beforeMake(async (user) => {
        user.createdAt = new Date('2024-01-01');
      });

    const user = await factory(User).state('admin').make({
      email: 'custom@example.com',
      name: 'Custom Name',
    });

    // Overrides should take precedence
    expect(user.email).toBe('custom@example.com');
    expect(user.name).toBe('Custom Name');

    // State should still be applied
    expect(user.role).toBe('admin');

    // Hook should still execute
    expect(user.createdAt).toEqual(new Date('2024-01-01'));
  });

  it('should work with map function and other features', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      return user;
    }).state('verified', (user) => {
      user.emailVerified = true;
      return user;
    });

    const users = await factory(User)
      .state('verified')
      .map(async (user) => {
        user.status = 'premium';
        return user;
      })
      .makeMany(2);

    users.forEach((user) => {
      expect(user.emailVerified).toBe(true);
      expect(user.status).toBe('premium');
    });
  });

  it('should reset sequences independently per entity', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.id = `user-${sequence}`;
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Post, (fakerInstance, settings, sequence) => {
      const post = new Post();
      post.id = `post-${sequence}`;
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    });

    await factory(User).makeMany(2);
    await factory(Post).makeMany(3);

    resetSequences();

    const user = await factory(User).make();
    const post = await factory(Post).make();

    expect(user.id).toBe('user-0');
    expect(post.id).toBe('post-0');
  });
});
