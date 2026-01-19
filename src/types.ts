import { Faker } from '@faker-js/faker';
import { ObjectType } from 'typeorm';
import { EntityFactory } from './factory.util';

/**
 * FactoryFunction is the function, which generate a new filled entity
 */
export type FactoryFunction<Entity, Settings> = (
  faker: Faker,
  settings?: Settings,
  sequence?: number,
) => Entity;

/**
 * EntityProperty defines an object whose keys and values must be properties of the given Entity.
 */
export type EntityProperty<Entity> = {
  [Property in keyof Entity]?: Entity[Property];
};

/**
 * Factory gets the EntityFactory to the given Entity and pass the settings along
 */
export type Factory = <Entity, Settings>(
  entity: ObjectType<Entity>,
  settings?: Settings,
) => EntityFactory<Entity, Settings>;

/**
 * State function that modifies an entity
 */
export type StateFunction<Entity> = (
  entity: Entity,
) => Entity | Promise<Entity>;

/**
 * Lifecycle hook function
 */
export type LifecycleHook<Entity> = (entity: Entity) => void | Promise<void>;

/**
 * Association definition
 */
export interface AssociationDefinition {
  entityClass: ObjectType<any>;
  fieldName: string;
  isArray?: boolean;
  count?: number;
}

/**
 * Value of our EntityFactory state
 */
export interface EntityFactoryDefinition<Entity, Settings> {
  entity: ObjectType<Entity>;
  factory: FactoryFunction<Entity, Settings>;
  states?: Map<string, StateFunction<Entity>>;
  beforeMakeHooks?: LifecycleHook<Entity>[];
  afterMakeHooks?: LifecycleHook<Entity>[];
  associations?: AssociationDefinition[];
}

export interface ModuleOptions {
  path?: string;
}
