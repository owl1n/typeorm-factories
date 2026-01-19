# TypeORM Entity Factory

[English](README.md) | Русский

Библиотека для создания фабрик сущностей TypeORM, упрощающая генерацию тестовых данных в NestJS приложениях.

## Зачем это нужно

При написании юнит-тестов часто требуется создавать экземпляры сущностей с заполненными данными. Вместо ручного создания объектов в каждом тесте, фабрики позволяют:

- Централизованно определить структуру тестовых данных
- Быстро генерировать реалистичные данные с помощью Faker
- Переопределять отдельные поля при необходимости
- Создавать множественные экземпляры одной командой
- Избежать дублирования кода в тестах

## Установка

```bash
pnpm add -D typeorm-factories @faker-js/faker
# или
npm install --save-dev typeorm-factories @faker-js/faker
```

Библиотека использует [@faker-js/faker](https://github.com/faker-js/faker) для генерации фейковых данных.

## Быстрый старт

### 1. Определение фабрики

Создайте файл фабрики (например, `factories/task.factory.ts`):

```typescript
import { faker } from '@faker-js/faker';
import { define } from 'typeorm-factories';
import { Task } from '../src/entities/task.entity';

define(Task, (fakerInstance) => {
  const task = new Task();
  
  task.id = fakerInstance.string.uuid();
  task.title = fakerInstance.lorem.sentence();
  task.description = fakerInstance.lorem.paragraph();
  task.completed = fakerInstance.datatype.boolean();
  task.createdAt = fakerInstance.date.past();
  
  return task;
});
```

### 2. Использование фабрики в тестах

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactoryModule, factory } from 'typeorm-factories';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoryModule],
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();
    
    await module.init();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('должен создать новую задачу', async () => {
      const taskData = await factory(Task).make();
      
      jest.spyOn(repository, 'save').mockResolvedValue(taskData);

      const result = await service.create(taskData);
      
      expect(result).toEqual(taskData);
      expect(repository.save).toHaveBeenCalledWith(taskData);
    });
  });

  describe('findCompleted', () => {
    it('должен вернуть только выполненные задачи', async () => {
      const completedTasks = await factory(Task)
        .makeMany(3, { completed: true });
      
      jest.spyOn(repository, 'find').mockResolvedValue(completedTasks);

      const result = await service.findCompleted();
      
      expect(result).toHaveLength(3);
      expect(result.every(task => task.completed)).toBe(true);
    });
  });
});
```

## API

### `define(Entity, factoryFunction)`

Регистрирует фабрику для сущности.

**Параметры:**
- `Entity`: Класс сущности TypeORM
- `factoryFunction`: Функция, принимающая экземпляр Faker и опциональные настройки, возвращающая заполненную сущность

```typescript
define(User, (faker) => {
  const user = new User();
  user.email = faker.internet.email();
  user.name = faker.person.fullName();
  return user;
});
```

### `factory(Entity, settings?)`

Создает экземпляр EntityFactory для генерации объектов сущности.

**Параметры:**
- `Entity`: Класс сущности
- `settings` (опционально): Дополнительные настройки для фабрики

**Возвращает:** `EntityFactory<Entity, Settings>`

### EntityFactory API

#### `make(overrideParams?)`

Создает один экземпляр сущности.

```typescript
const task = await factory(Task).make();

// С переопределением полей
const urgentTask = await factory(Task).make({ 
  priority: 'high',
  dueDate: new Date('2024-12-31')
});
```

#### `makeMany(count, overrideParams?)`

Создает массив экземпляров сущности.

```typescript
// Создать 5 задач
const tasks = await factory(Task).makeMany(5);

// Создать 3 задачи со статусом "completed"
const completedTasks = await factory(Task).makeMany(3, { completed: true });
```

#### `map(callback)`

Применяет функцию к каждому созданному объекту. Полезно для дополнительной обработки.

```typescript
const tasksWithTimestamps = await factory(Task)
  .map(async (task) => {
    task.updatedAt = new Date();
    return task;
  })
  .makeMany(5);
```

## Продвинутое использование

### Фабрики с настройками

```typescript
interface UserSettings {
  role: 'admin' | 'user';
}

define(User, (faker, settings?: UserSettings) => {
  const user = new User();
  user.email = faker.internet.email();
  user.name = faker.person.fullName();
  user.role = settings?.role || 'user';
  return user;
});

// Использование
const admin = await factory(User, { role: 'admin' }).make();
const regularUser = await factory(User, { role: 'user' }).make();
```

### Вложенные сущности

Фабрики могут автоматически разрешать вложенные сущности:

```typescript
define(Comment, (faker) => {
  const comment = new Comment();
  comment.text = faker.lorem.paragraph();
  comment.author = factory(User).make(); // Вернет Promise
  return comment;
});

// Вложенная сущность будет автоматически разрешена
const comment = await factory(Comment).make();
console.log(comment.author); // Объект User
```

### Связанные сущности

```typescript
define(Post, (faker) => {
  const post = new Post();
  post.title = faker.lorem.sentence();
  post.content = faker.lorem.paragraphs();
  return post;
});

define(Comment, (faker) => {
  const comment = new Comment();
  comment.text = faker.lorem.paragraph();
  return comment;
});

// Создание поста с комментариями
const post = await factory(Post).make();
const comments = await factory(Comment).makeMany(3, { postId: post.id });
```

## Структура проекта

Рекомендуется хранить фабрики в отдельной директории:

```
your-project/
├── src/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── task.entity.ts
│   └── ...
├── factories/
│   ├── user.factory.ts
│   └── task.factory.ts
└── test/
    └── ...
```

Библиотека автоматически находит все файлы с паттерном `**/*.factory.{js,ts}` при инициализации модуля.

## Как это работает

1. При импорте `FactoryModule` в тестовый модуль, он сканирует проект на наличие файлов фабрик
2. Все найденные фабрики регистрируются в глобальном реестре
3. Функция `factory()` получает зарегистрированную фабрику по классу сущности
4. Методы `make()` и `makeMany()` используют Faker для генерации данных
5. Вложенные фабрики и промисы автоматически разрешаются

## Совместимость

- TypeORM: ^0.3.0
- NestJS: ^11.0.0
- @faker-js/faker: ^10.0.0
- Node.js: >=18.0.0

## Пример полной настройки

**factories/task.factory.ts:**
```typescript
import { faker } from '@faker-js/faker';
import { define } from 'typeorm-factories';
import { Task, TaskStatus } from '../src/entities/task.entity';

define(Task, (fakerInstance) => {
  const task = new Task();
  
  task.id = fakerInstance.string.uuid();
  task.title = fakerInstance.lorem.sentence({ min: 3, max: 8 });
  task.description = fakerInstance.lorem.paragraph();
  task.status = fakerInstance.helpers.arrayElement([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE
  ]);
  task.priority = fakerInstance.number.int({ min: 1, max: 5 });
  task.dueDate = fakerInstance.date.future();
  task.createdAt = fakerInstance.date.past();
  task.updatedAt = new Date();
  
  return task;
});
```

**test/tasks.service.spec.ts:**
```typescript
import { Test } from '@nestjs/testing';
import { FactoryModule, factory } from 'typeorm-factories';
import { Task } from '../src/entities/task.entity';

describe('TasksService', () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [FactoryModule],
      // ... остальные провайдеры
    }).compile();
    
    await module.init();
  });

  it('пример теста', async () => {
    const task = await factory(Task).make({ priority: 5 });
    expect(task.priority).toBe(5);
  });
});
```

## Поддержка

Если у вас возникли вопросы или проблемы, создайте [Issue](https://github.com/owl1n/typeorm-factories/issues/new) в репозитории проекта.

## Лицензия

MIT
