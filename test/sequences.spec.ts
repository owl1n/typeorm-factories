import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User, Post, Comment } from './entities';

describe('Factory Sequences', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should generate sequential numbers for each entity', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.id = `user-${sequence}`;
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const users = await factory(User).makeMany(3);

    expect(users[0].email).toBe('user0@example.com');
    expect(users[1].email).toBe('user1@example.com');
    expect(users[2].email).toBe('user2@example.com');
  });

  it('should maintain separate sequences for different entities', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Post, (fakerInstance, settings, sequence) => {
      const post = new Post();
      post.title = `Post ${sequence}`;
      post.content = fakerInstance.lorem.paragraph();
      return post;
    });

    const user = await factory(User).make();
    const post = await factory(Post).make();
    const user2 = await factory(User).make();

    expect(user.email).toBe('user0@example.com');
    expect(post.title).toBe('Post 0');
    expect(user2.email).toBe('user1@example.com');
  });

  it('should reset sequences when resetSequences is called', async () => {
    define(User, (fakerInstance, settings, sequence) => {
      const user = new User();
      user.email = `user${sequence}@example.com`;
      user.name = fakerInstance.person.fullName();
      return user;
    });

    await factory(User).makeMany(3);
    resetSequences();
    const user = await factory(User).make();

    expect(user.email).toBe('user0@example.com');
  });

  it('should work without sequence parameter', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const user = await factory(User).make();
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
  });
});
