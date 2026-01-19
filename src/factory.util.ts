import { faker } from "@faker-js/faker";
import { ObjectType, Repository } from "typeorm";
import {
  EntityFactoryDefinition,
  EntityProperty,
  Factory,
  FactoryFunction,
} from "./types";

export const entityFactories = new Map<
  string,
  EntityFactoryDefinition<any, any>
>();

export const define = <Entity, Settings>(
  entity: ObjectType<Entity>,
  factoryFn: FactoryFunction<Entity, Settings>,
) => {
  entityFactories.set(getNameOfEntity(entity), {
    entity,
    factory: factoryFn,
  });
};

export const factory: Factory = <Entity, Settings>(
  entity: ObjectType<Entity>,
  settings?: Settings,
) => {
  const name = getNameOfEntity(entity);
  const entityFactoryObject = entityFactories.get(name);
  return new EntityFactory<Entity, Settings>(
    name,
    entity,
    entityFactoryObject.factory,
    settings,
  );
};

export const getNameOfEntity = <T>(entity: ObjectType<T>): string => {
  if (entity instanceof Function) {
    return entity.name;
  } else if (entity) {
    return new (entity as any)().constructor.name;
  }
  throw new Error("Enity is not defined");
};

export const isPromiseLike = (o: any): boolean =>
  !!o &&
  (typeof o === "object" || typeof o === "function") &&
  typeof o.then === "function" &&
  !(o instanceof Date);

export class EntityFactory<Entity, Settings> {
  private mapFunction: (entity: Entity) => Promise<Entity>;

  constructor(
    public name: string,
    public entity: ObjectType<Entity>,
    private factory: FactoryFunction<Entity, Settings>,
    private settings: Settings,
  ) {}

  public map(
    mapFunction: (entity: Entity) => Promise<Entity>,
  ): EntityFactory<Entity, Settings> {
    this.mapFunction = mapFunction;
    return this;
  }

  public async make(
    overrideParams: EntityProperty<Entity> = {},
  ): Promise<Entity> {
    if (this.factory) {
      let entity = await this.resolveEntity(this.factory(faker, this.settings));
      if (this.mapFunction) {
        entity = await this.mapFunction(entity);
      }

      for (const key in overrideParams) {
        if (overrideParams.hasOwnProperty(key)) {
          (entity as any)[key] = overrideParams[key];
        }
      }

      return entity;
    }
    throw new Error("Could not found entity");
  }

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
          typeof entity[attribute] === "object" &&
          !(entity[attribute] instanceof Date)
        ) {
          const subEntityFactory = entity[attribute];
          try {
            if (typeof (subEntityFactory as any).make === "function") {
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
