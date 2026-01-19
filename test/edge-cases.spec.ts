import { describe, it, expect, beforeEach } from 'vitest';
import { User, Post } from './entities';
import {
  define,
  factory,
  resetSequences,
  getNameOfEntity,
} from '../src/factory.util';

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should throw error when factory is not defined', () => {
    class UnknownEntity {
      id?: string;
    }

    expect(() => factory(UnknownEntity)).toThrow(
      'Factory for UnknownEntity is not defined',
    );
  });

  it('should get name from entity class', () => {
    const name = getNameOfEntity(User);
    expect(name).toBe('User');
  });

  it('should throw error for undefined entity', () => {
    expect(() => getNameOfEntity(null as any)).toThrow('Entity is not defined');
  });

  it('should handle promise-like attributes in make', async () => {
    define(User, (faker) => {
      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      // Create a promise-like attribute
      (user as any).asyncField = Promise.resolve('async value');
      return user;
    });

    const user = await factory(User).make();
    expect((user as any).asyncField).toBe('async value');
  });

  it('should handle nested factory objects in make', async () => {
    define(User, (faker) => {
      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      return user;
    });

    define(Post, (faker) => {
      const post = new Post();
      post.title = faker.lorem.sentence();
      post.content = faker.lorem.paragraph();
      // Assign a factory object instead of an entity
      post.author = factory(User) as any;
      return post;
    });

    const post = await factory(Post).make();
    expect(post.author).toBeDefined();
    expect(post.author?.email).toBeDefined();
    expect(post.author?.name).toBeDefined();
  });

  it('should throw error when nested factory make fails', async () => {
    class BrokenEntity {
      id?: string;
    }

    define(Post, (faker) => {
      const post = new Post();
      post.title = faker.lorem.sentence();
      post.content = faker.lorem.paragraph();
      // Assign an object that looks like a factory but will fail
      post.author = {
        make: () => {
          throw new Error('Broken factory');
        },
      } as any;
      return post;
    });

    await expect(factory(Post).make()).rejects.toThrow(
      'Could not make undefined',
    );
  });

  it('should handle Date objects correctly (not treat as sub-factory)', async () => {
    define(User, (faker) => {
      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      user.createdAt = new Date();
      return user;
    });

    const user = await factory(User).make();
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should preserve non-promise, non-object attributes', async () => {
    define(User, (faker) => {
      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      user.emailVerified = true;
      return user;
    });

    const user = await factory(User).make();
    expect(user.emailVerified).toBe(true);
  });
});
