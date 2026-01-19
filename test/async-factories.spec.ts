import { describe, it, expect, beforeEach } from "vitest";
import { User } from "./entities";
import { define, factory, resetSequences } from "../src/factory.util";

describe("Async Factory Functions", () => {
  beforeEach(() => {
    resetSequences();
  });

  it("should support async factory functions", async () => {
    define(User, async (faker) => {
      // Simulate async operation (e.g., fetching from external API)
      await new Promise((resolve) => setTimeout(resolve, 10));

      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      return user;
    });

    const user = await factory(User).make();

    expect(user).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
  });

  it("should support async factory functions with makeMany", async () => {
    define(User, async (faker) => {
      await new Promise((resolve) => setTimeout(resolve, 5));

      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      return user;
    });

    const users = await factory(User).makeMany(3);

    expect(users).toHaveLength(3);
    users.forEach((user) => {
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
    });
  });

  it("should support async operations within factory functions", async () => {
    define(User, async (faker) => {
      const user = new User();

      // Simulate async data fetching
      const fetchedEmail = await Promise.resolve(faker.internet.email());
      const fetchedName = await Promise.resolve(faker.person.fullName());

      user.email = fetchedEmail;
      user.name = fetchedName;
      user.emailVerified = true;

      return user;
    });

    const user = await factory(User).make();

    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.emailVerified).toBe(true);
  });

  it("should work with async factory and states", async () => {
    define(User, async (faker) => {
      await new Promise((resolve) => setTimeout(resolve, 5));

      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      user.status = "active";
      return user;
    })
      .state("admin", async (user) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        user.role = "admin";
        return user;
      })
      .state("verified", (user) => {
        user.emailVerified = true;
        return user;
      });

    const admin = await factory(User).state("admin").state("verified").make();

    expect(admin.role).toBe("admin");
    expect(admin.emailVerified).toBe(true);
    expect(admin.status).toBe("active");
  });

  it("should work with async factory and hooks", async () => {
    const hookCalls: string[] = [];

    define(User, async (faker) => {
      await new Promise((resolve) => setTimeout(resolve, 5));

      const user = new User();
      user.email = faker.internet.email();
      user.name = faker.person.fullName();
      return user;
    })
      .beforeMake(async (user) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        hookCalls.push("before");
      })
      .afterMake(async (user) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        hookCalls.push("after");
      });

    await factory(User).make();

    expect(hookCalls).toEqual(["before", "after"]);
  });

  it("should handle errors in async factory functions", async () => {
    define(User, async (faker) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("Async factory error");
    });

    await expect(factory(User).make()).rejects.toThrow("Async factory error");
  });

  it("should mix sync and async factories", async () => {
    // Sync factory
    define(User, (faker) => {
      const user = new User();
      user.email = faker.internet.email();
      user.name = "Sync User";
      return user;
    });

    const syncUser = await factory(User).make();
    expect(syncUser.name).toBe("Sync User");

    // Async factory (overwrite)
    define(User, async (faker) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      const user = new User();
      user.email = faker.internet.email();
      user.name = "Async User";
      return user;
    });

    const asyncUser = await factory(User).make();
    expect(asyncUser.name).toBe("Async User");
  });
});
