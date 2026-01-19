# GitHub Actions CI/CD

Проект использует GitHub Actions для автоматизации тестирования, сборки и публикации.

## Workflows

### CI (Continuous Integration)
**Файл:** `.github/workflows/ci.yml`

Запускается при:
- Push в ветки `main` и `feature/*`
- Pull Request в `main`

Выполняет:
- ✅ **Тестирование** на Node.js 18.x, 20.x, 22.x
- ✅ **Генерация coverage** и отправка в Codecov
- ✅ **Сборка** проекта
- ✅ **Проверка форматирования**

### Release (Автоматический релиз)
**Файл:** `.github/workflows/release.yml`

Запускается при:
- Push тега `v*` (например, `v2.0.0`)

Выполняет:
- ✅ Тестирование
- ✅ Сборка
- ✅ Генерация changelog
- ✅ Создание GitHub Release
- ✅ Публикация в npm

**Использование:**
```bash
git tag v2.0.0
git push origin v2.0.0
```

### Publish (Ручная публикация)
**Файл:** `.github/workflows/publish.yml`

Запускается:
- Вручную через GitHub Actions UI

Позволяет:
- Указать версию (patch/minor/major или конкретную)
- Автоматически обновить version в package.json
- Создать коммит и тег
- Опубликовать в npm
- Создать GitHub Release

**Использование:**
1. Перейти в Actions → Publish Package
2. Нажать "Run workflow"
3. Выбрать версию (patch/minor/major)
4. Запустить

## Настройка

### Secrets
Необходимо добавить в Settings → Secrets and variables → Actions:

- `NPM_TOKEN` - токен для публикации в npm
  - Получить на https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Тип: Automation token

### Codecov (опционально)
Для интеграции с Codecov:
1. Зарегистрировать проект на https://codecov.io
2. Добавить badge в README.md

## Локальная проверка

Перед push можно проверить локально:

```bash
# Тесты
pnpm test

# Coverage
pnpm coverage

# Сборка
pnpm build

# Форматирование
pnpm format
```

## Статусы

После настройки будут доступны badges:

```markdown
[![CI](https://github.com/owl1n/typeorm-factories/workflows/CI/badge.svg)](https://github.com/owl1n/typeorm-factories/actions)
[![codecov](https://codecov.io/gh/owl1n/typeorm-factories/branch/main/graph/badge.svg)](https://codecov.io/gh/owl1n/typeorm-factories)
[![npm version](https://badge.fury.io/js/typeorm-factories.svg)](https://www.npmjs.com/package/typeorm-factories)
```
