import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User } from './entities';

describe('Factory States', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should apply single state', async () => {
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

    const user = await factory(User).state('admin').make();
    expect(user.role).toBe('admin');
  });

  it('should apply multiple states', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      user.emailVerified = false;
      return user;
    })
      .state('admin', (user) => {
        user.role = 'admin';
        return user;
      })
      .state('verified', (user) => {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        return user;
      });

    const user = await factory(User).states(['admin', 'verified']).make();
    expect(user.role).toBe('admin');
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('should support async states', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.password = 'plain-password';
      return user;
    }).state('hashed', async (user) => {
      // Simulate async password hashing
      user.password = await Promise.resolve(`hashed_${user.password}`);
      return user;
    });

    const user = await factory(User).state('hashed').make();
    expect(user.password).toBe('hashed_plain-password');
  });

  it('should throw error for undefined state', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    await expect(factory(User).state('nonexistent').make()).rejects.toThrow(
      'State "nonexistent" is not defined',
    );
  });

  it('should allow state modifications to persist with overrides', async () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      user.role = 'user';
      user.status = 'active';
      return user;
    }).state('suspended', (user) => {
      user.status = 'suspended';
      user.suspendedAt = new Date();
      return user;
    });

    const user = await factory(User).state('suspended').make({ role: 'admin' });

    expect(user.status).toBe('suspended');
    expect(user.role).toBe('admin');
    expect(user.suspendedAt).toBeInstanceOf(Date);
  });

  it('should work with makeMany', async () => {
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

    const users = await factory(User).state('admin').makeMany(3);

    expect(users).toHaveLength(3);
    users.forEach((user) => {
      expect(user.role).toBe('admin');
    });
  });
});
