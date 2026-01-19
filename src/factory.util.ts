import { faker } from '@faker-js/faker';
import { ObjectType, Repository } from 'typeorm';
import {
  AssociationDefinition,
  EntityFactoryDefinition,
  EntityProperty,
  Factory,
  FactoryFunction,
  LifecycleHook,
  StateFunction,
} from './types';

export const entityFactories = new Map<
  string,
  EntityFactoryDefinition<any, any>
>();

// Sequences storage for each entity
const sequences = new Map<string, number>();

export const define = <Entity, Settings>(
  entity: ObjectType<Entity>,
  factoryFn: FactoryFunction<Entity, Settings>,
) => {
  const name = getNameOfEntity(entity);
  const definition: EntityFactoryDefinition<Entity, Settings> = {
    entity,
    factory: factoryFn,
    states: new Map(),
    beforeMakeHooks: [],
    afterMakeHooks: [],
    associations: [],
  };

  entityFactories.set(name, definition);

  // Initialize sequence counter
  if (!sequences.has(name)) {
    sequences.set(name, 0);
  }

  return new FactoryDefinitionBuilder<Entity, Settings>(name, definition);
};

export const factory: Factory = <Entity, Settings>(
  entity: ObjectType<Entity>,
  settings?: Settings,
) => {
  const name = getNameOfEntity(entity);
  const entityFactoryObject = entityFactories.get(name);

  if (!entityFactoryObject) {
    throw new Error(`Factory for ${name} is not defined`);
  }

  return new EntityFactory<Entity, Settings>(
    name,
    entity,
    entityFactoryObject.factory,
    settings,
    entityFactoryObject,
  );
};

export const resetSequences = () => {
  sequences.forEach((_, key) => sequences.set(key, 0));
};

export const getNameOfEntity = <T>(entity: ObjectType<T>): string => {
  if (entity instanceof Function) {
    return entity.name;
  } else if (entity) {
    return new (entity as any)().constructor.name;
  }
  throw new Error('Entity is not defined');
};

export const isPromiseLike = (o: any): boolean =>
  !!o &&
  (typeof o === 'object' || typeof o === 'function') &&
  typeof o.then === 'function' &&
  !(o instanceof Date);

/**
 * Builder class for defining factory states, hooks, and associations
 */
export class FactoryDefinitionBuilder<Entity, Settings> {
  constructor(
    private entityName: string,
    private definition: EntityFactoryDefinition<Entity, Settings>,
  ) {}

  /**
   * Define a state for the factory
   */
  state(name: string, stateFn: StateFunction<Entity>): this {
    this.definition.states!.set(name, stateFn);
    return this;
  }

  /**
   * Add a before make hook
   */
  beforeMake(hook: LifecycleHook<Entity>): this {
    this.definition.beforeMakeHooks!.push(hook);
    return this;
  }

  /**
   * Add an after make hook
   */
  afterMake(hook: LifecycleHook<Entity>): this {
    this.definition.afterMakeHooks!.push(hook);
    return this;
  }

  /**
   * Define an association
   */
  association<T>(
    fieldName: string,
    entityClass: ObjectType<T>,
    options?: { count?: number },
  ): this {
    this.definition.associations!.push({
      fieldName,
      entityClass,
      isArray: options?.count !== undefined && options.count > 1,
      count: options?.count,
    });
    return this;
  }
}

export class EntityFactory<Entity, Settings> {
  private mapFunction: (entity: Entity) => Promise<Entity>;
  private activeStates: string[] = [];

  constructor(
    public name: string,
    public entity: ObjectType<Entity>,
    private factoryFunction: FactoryFunction<Entity, Settings>,
    private settings: Settings,
    private definition: EntityFactoryDefinition<Entity, Settings>,
  ) {}

  /**
   * Apply a map function to the entity
   */
  public map(
    mapFunction: (entity: Entity) => Promise<Entity>,
  ): EntityFactory<Entity, Settings> {
    this.mapFunction = mapFunction;
    return this;
  }

  /**
   * Apply one or more states to the entity
   */
  public state(stateName: string): EntityFactory<Entity, Settings> {
    this.activeStates.push(stateName);
    return this;
  }

  /**
   * Apply multiple states to the entity
   */
  public states(stateNames: string[]): EntityFactory<Entity, Settings> {
    this.activeStates.push(...stateNames);
    return this;
  }

  /**
   * Build an entity without using faker (only with provided params)
   */
  public build(params: EntityProperty<Entity>): Entity {
    const entity = new (this.entity as any)() as Entity;

    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        (entity as any)[key] = params[key];
      }
    }

    return entity;
  }

  /**
   * Make a single entity instance
   */
  public async make(
    overrideParams: EntityProperty<Entity> = {},
  ): Promise<Entity> {
    if (!this.factoryFunction) {
      throw new Error('Could not found entity');
    }

    // Get and increment sequence
    const currentSequence = sequences.get(this.name) || 0;
    sequences.set(this.name, currentSequence + 1);

    // Create base entity
    let entity = await this.resolveEntity(
      this.factoryFunction(faker, this.settings, currentSequence),
    );

    // Apply before make hooks
    if (this.definition.beforeMakeHooks) {
      for (const hook of this.definition.beforeMakeHooks) {
        await hook(entity);
      }
    }

    // Apply associations
    if (
      this.definition.associations &&
      this.definition.associations.length > 0
    ) {
      for (const assoc of this.definition.associations) {
        if (assoc.isArray && assoc.count) {
          (entity as any)[assoc.fieldName] = await factory(
            assoc.entityClass,
          ).makeMany(assoc.count);
        } else {
          (entity as any)[assoc.fieldName] = await factory(
            assoc.entityClass,
          ).make();
        }
      }
    }

    // Apply states
    if (this.activeStates.length > 0 && this.definition.states) {
      for (const stateName of this.activeStates) {
        const stateFn = this.definition.states.get(stateName);
        if (stateFn) {
          entity = await stateFn(entity);
        } else {
          throw new Error(
            `State "${stateName}" is not defined for ${this.name}`,
          );
        }
      }
    }

    // Apply map function
    if (this.mapFunction) {
      entity = await this.mapFunction(entity);
    }

    // Override parameters
    for (const key in overrideParams) {
      if (overrideParams.hasOwnProperty(key)) {
        (entity as any)[key] = overrideParams[key];
      }
    }

    // Apply after make hooks
    if (this.definition.afterMakeHooks) {
      for (const hook of this.definition.afterMakeHooks) {
        await hook(entity);
      }
    }

    return entity;
  }

  /**
   * Make multiple entity instances
   */
  public async makeMany(
    amount: number,
    overrideParams: EntityProperty<Entity> = {},
  ): Promise<Entity[]> {
    const list = [];
    for (let index = 0; index < amount; index++) {
      list[index] = await this.make(overrideParams);
    }
    return list;
  }

  private async resolveEntity(entity: Entity): Promise<Entity> {
    for (const attribute in entity) {
      if (entity.hasOwnProperty(attribute)) {
        if (isPromiseLike(entity[attribute])) {
          entity[attribute] = await entity[attribute];
        }

        if (
          typeof entity[attribute] === 'object' &&
          !(entity[attribute] instanceof Date)
        ) {
          const subEntityFactory = entity[attribute];
          try {
            if (typeof (subEntityFactory as any).make === 'function') {
              entity[attribute] = await (subEntityFactory as any).make();
            }
          } catch (error) {
            const message = `Could not make ${(subEntityFactory as any).name}`;
            throw new Error(message);
          }
        }
      }
    }
    return entity;
  }
}
