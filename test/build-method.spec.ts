import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from '@faker-js/faker';
import { define, factory, resetSequences } from '../src/factory.util';
import { User } from './entities';

describe('Build Method', () => {
  beforeEach(() => {
    resetSequences();
  });

  it('should create entity without using faker', () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const user = factory(User).build({
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.id).toBe('test-id');
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should create entity with partial params', () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const user = factory(User).build({
      email: 'partial@example.com',
    });

    expect(user.email).toBe('partial@example.com');
    expect(user.name).toBeUndefined();
  });

  it('should not execute factory function', () => {
    const factoryFn = vi.fn(() => {
      const user = new User();
      user.email = 'faker@example.com';
      user.name = 'Faker Name';
      return user;
    });

    define(User, factoryFn);

    const user = factory(User).build({
      email: 'build@example.com',
      name: 'Build Name',
    });

    expect(factoryFn).not.toHaveBeenCalled();
    expect(user.email).toBe('build@example.com');
    expect(user.name).toBe('Build Name');
  });

  it('should not execute hooks', () => {
    const beforeMakeHook = vi.fn();
    const afterMakeHook = vi.fn();

    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    })
      .beforeMake(beforeMakeHook)
      .afterMake(afterMakeHook);

    factory(User).build({
      email: 'test@example.com',
    });

    expect(beforeMakeHook).not.toHaveBeenCalled();
    expect(afterMakeHook).not.toHaveBeenCalled();
  });

  it('should be useful for creating mocks', () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const mockUser = factory(User).build({
      id: 'mock-123',
      email: 'mock@example.com',
      name: 'Mock User',
      role: 'admin',
    });

    // Can be used directly in mocks
    const mockRepository = {
      findOne: vi.fn().mockResolvedValue(mockUser),
    };

    expect(mockUser.id).toBe('mock-123');
    expect(mockUser.role).toBe('admin');
  });

  it('should return instance of entity class', () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const user = factory(User).build({
      email: 'test@example.com',
    });

    expect(user).toBeInstanceOf(User);
  });

  it('should support all entity properties', () => {
    define(User, (fakerInstance) => {
      const user = new User();
      user.email = fakerInstance.internet.email();
      user.name = fakerInstance.person.fullName();
      return user;
    });

    const user = factory(User).build({
      id: '1',
      email: 'complete@example.com',
      name: 'Complete User',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      emailVerifiedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
    });

    expect(user.id).toBe('1');
    expect(user.email).toBe('complete@example.com');
    expect(user.name).toBe('Complete User');
    expect(user.role).toBe('admin');
    expect(user.status).toBe('active');
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifiedAt).toEqual(new Date('2024-01-01'));
    expect(user.createdAt).toEqual(new Date('2024-01-01'));
  });
});
