# TypeORM Entity factory

The library allows you to create factories for your entities. Useful when unit-testing your [NestJS](https://github.com/nestjs/nest) project.

### Faker

Library using [@faker-js/faker](https://github.com/faker-js/faker) to provide fake-data in your factories.

Library has peer dependency for @faker-js/faker, make sure you have it installed.

### How to

1) Install library:

    `pnpm add typeorm-factories` or `npm install typeorm-factories`

2) Library can find factory file everywhere in project folder. But could be better if you can create folder for them:

    Create folder in project root: `mkdir factories`
    
3) Create your first factory:

    ```typescript
    import { faker } from '@faker-js/faker';
    import { define } from 'typeorm-factories';
    import { Task } from '../src/tasks/task.entity';
    
    define(Task, (fakerInstance) => {
      const task = new Task();
    
      task.id = fakerInstance.string.uuid();
      task.title = fakerInstance.lorem.word();
    
      return task;
    });
    ```
   
   Here we have factory for `Task` entity. Entity has this interface:
   
   ```typescript
    @Entity({ name: 'tasks' })
    export class Task {
      @PrimaryGeneratedColumn('uuid')
      id: string;
    
      @Column()
      title: string;
   }
    ```
   
4) Use it everywhere:

    In my case i wanted to create unit-testing of my project without database hitting. Just test it on mock data. How?
    
    Look at my test file for my tasks controller in project:
    
    For first we need to create `mockFactory` for repositories. Place this code everywhere you want:
    
    ```typescript   
    export type MockType<T> = {
        [P in keyof T]: jest.Mock<{}>;
    };

    // @ts-ignore
    export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
        findOne: jest.fn(entity => entity),
        findOneOrFail: jest.fn(entity => entity),
        // there u can implement another functions of your repositories
    }));
    ```
   
    And lookup to code of test file for my controller
    
    ```typescript
    describe('TasksController', () => {
        let controller: TasksController;
        let repository: MockType<Repository<Task>>;
        
        beforeEach(async () => {
            const module = await Test.createTestingModule({
            imports: [FactoryModule],
            controllers: [TasksController],
            providers: [
               TasksService,
               { provide: getRepositoryToken(Task), useFactory: repositoryMockFactory },
               ],
            }).compile();
            await module.init(); // we are need to wait for module creating, but we inject our factory module to testing module
            
            controller = module.get<TasksController>(TasksController);
            repository = module.get(getRepositoryToken(Task));
        });
            
        describe('getOne', () => {
            it('should return entity', async () => {
                const task = await factory(Task).make();
                repository.findOneOrFail.mockReturnValue(task);

                expect(await repository.findOneOrFail(task.id)).toEqual(task);
                expect(repository.findOneOrFail).toBeCalledWith(task.id);
            })
        })
    });
    ```

    As you can see, we are create entity by factory via `factory()` function.
    After call this we have object of type `EntityFactory`.
    
    `EnityFactory` provide 3 functions:
    - `map(callback)` - callback will be called for every item in array or solo item when we call `make` or `makeMany` functions.
    - `makeMany(count, params)` - create many objects of your entity. Override default params in original object by passed params from variable.
    - `make(params)` - create one one entity object and override. About params see above.


##### Few words

Detailed instructions for use in development. I have not told even half of all the possibilities of this library. If you have a question about the library’s work, you can create [Issue](https://github.com/owl1n/typeorm-factories/issues/new).
If you have a desire to help me and make the documentation better, contact me. I have some problems with the narration and I think there are people who do it better than me.
