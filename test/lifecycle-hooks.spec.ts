import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User } from './entities';

describe('Lifecycle Hooks', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should execute beforeMake hook', async () => {
    const beforeMakeHook = vi.fn();

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.password = 'plain-password';
      return user;
    }).beforeMake(async (user) => {
      beforeMakeHook();
      user.password = `hashed_${user.password}`;
    });

    const user = await factory(User).make();

    expect(beforeMakeHook).toHaveBeenCalledTimes(1);
    expect(user.password).toBe('hashed_plain-password');
  });

  it('should execute afterMake hook', async () => {
    const afterMakeHook = vi.fn();

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    }).afterMake(async (user) => {
      afterMakeHook();
      user.createdAt = new Date();
    });

    const user = await factory(User).make();

    expect(afterMakeHook).toHaveBeenCalledTimes(1);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should execute multiple hooks in order', async () => {
    const callOrder: string[] = [];

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    })
      .beforeMake(async (user) => {
        callOrder.push('before1');
      })
      .beforeMake(async (user) => {
        callOrder.push('before2');
      })
      .afterMake(async (user) => {
        callOrder.push('after1');
      })
      .afterMake(async (user) => {
        callOrder.push('after2');
      });

    await factory(User).make();

    expect(callOrder).toEqual(['before1', 'before2', 'after1', 'after2']);
  });

  it('should execute hooks for each entity in makeMany', async () => {
    let beforeCount = 0;
    let afterCount = 0;

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    })
      .beforeMake(async (user) => {
        beforeCount++;
      })
      .afterMake(async (user) => {
        afterCount++;
      });

    await factory(User).makeMany(3);

    expect(beforeCount).toBe(3);
    expect(afterCount).toBe(3);
  });

  it('should execute hooks before and after states', async () => {
    const callOrder: string[] = [];

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      return user;
    })
      .beforeMake(async (user) => {
        callOrder.push('beforeMake');
      })
      .state('admin', (user) => {
        callOrder.push('state');
        user.role = 'admin';
        return user;
      })
      .afterMake(async (user) => {
        callOrder.push('afterMake');
      });

    await factory(User).state('admin').make();

    expect(callOrder).toEqual(['beforeMake', 'state', 'afterMake']);
  });

  it('should support async hooks', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.password = 'password';
      return user;
    }).beforeMake(async (user) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      user.password = `async_${user.password}`;
    });

    const user = await factory(User).make();
    expect(user.password).toBe('async_password');
  });

  it('should pass entity to hooks', async () => {
    let hookEmail: string = '';

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = 'test@example.com';
      user.name = fakerInstance.person.fullName();
      return user;
    }).beforeMake(async (user) => {
      hookEmail = user.email;
    });

    await factory(User).make();
    expect(hookEmail).toBe('test@example.com');
  });
});
