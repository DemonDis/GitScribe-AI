# Публикация релиза

## Автоматически (через GitHub Actions)

```bash
# 1. Убедиться, что все изменения закоммичены и запушены
git add .
git commit -m "chore: bump version to 1.1.0"
git push

# 2. Создать и запушить тег (должен начинаться с v)
git tag v1.1.0
git push origin v1.1.0
```

После этого GitHub Actions сам:
- Соберёт проект
- Создаст `.vsix` файл
- Опубликует Release на GitHub с прикреплённым `.vsix`

---

## Вручную (локально)

```bash
# 1. Собрать VSIX
npx @vscode/vsce package

# 2. Создать Release на GitHub
#    - Зайти в репозиторий → Releases → Create a new release
#    - Выбрать тег (или создать новый)
#    - Прикрепить .vsix файл
#    - Опубликовать

# 3. Или через gh CLI
gh release create v1.1.0 git-scribe-ai-1.1.0.vsix --generate-notes
```

---

## Публикация в VS Code Marketplace

Когда расширение готово для публичного доступа:

```bash
# 1. Зарегистрировать publisher на marketplace.visualstudio.com
# 2. Создать Personal Access Token в Azure DevOps
# 3. Опубликовать
npx @vscode/vsce publish
```

Альтернатива — опубликовать через GitHub Actions Marketplace publish workflow.
