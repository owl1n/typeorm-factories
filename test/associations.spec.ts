import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User, Post, Comment } from './entities';

describe('Associations', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should create single association', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Post, (fakerInstance) => {
      const post = new Post();
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    }).association('author', User);

    const post = await factory(Post).make();

    expect(post.author).toBeDefined();
    expect(post.author).toBeInstanceOf(User);
    expect(post.author!.email).toBeDefined();
  });

  it('should create array association', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Comment, (fakerInstance) => {
      const comment = new Comment();
      comment.text = fakerInstance.lorem.paragraph();
      return comment;
    });

    define(Post, (fakerInstance) => {
      const post = new Post();
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    })
      .association('author', User)
      .association('comments', Comment, { count: 3 });

    const post = await factory(Post).make();

    expect(post.author).toBeDefined();
    expect(post.comments).toBeDefined();
    expect(post.comments).toHaveLength(3);
    post.comments!.forEach((comment) => {
      expect(comment).toBeInstanceOf(Comment);
      expect(comment.text).toBeDefined();
    });
  });

  it('should create multiple associations', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Comment, (fakerInstance) => {
      const comment = new Comment();
      comment.text = fakerInstance.lorem.paragraph();
      return comment;
    }).association('author', User);

    const comment = await factory(Comment).make();

    expect(comment.author).toBeDefined();
    expect(comment.author).toBeInstanceOf(User);
  });

  it('should allow overriding association fields', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Post, (fakerInstance) => {
      const post = new Post();
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    }).association('author', User);

    const customAuthor = new User();
    customAuthor.email = 'custom@example.com';
    customAuthor.name = 'Custom Author';

    const post = await factory(Post).make({ author: customAuthor });

    expect(post.author).toBe(customAuthor);
    expect(post.author!.email).toBe('custom@example.com');
  });

  it('should work with states and associations', async () => {
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
      return post;
    }).association('author', User);

    const post = await factory(Post).make();

    expect(post.author).toBeDefined();
    expect(post.author!.role).toBe('user');
  });

  it('should create nested associations', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    define(Comment, (fakerInstance) => {
      const comment = new Comment();
      comment.text = fakerInstance.lorem.paragraph();
      return comment;
    }).association('author', User);

    define(Post, (fakerInstance) => {
      const post = new Post();
      post.title = fakerInstance.lorem.sentence();
      post.content = fakerInstance.lorem.paragraph();
      return post;
    })
      .association('author', User)
      .association('comments', Comment, { count: 2 });

    const post = await factory(Post).make();

    expect(post.author).toBeInstanceOf(User);
    expect(post.comments).toHaveLength(2);
    post.comments!.forEach((comment) => {
      expect(comment.author).toBeInstanceOf(User);
    });
  });
});
