# Публикация

Хостинг — бесплатный GitHub Pages из ветки `main`, корень репозитория. Платный домен не используется.

1. Войти: `gh auth login --hostname github.com --git-protocol https --web`
2. Из корня проекта, где уже есть коммит: `gh repo create slasti --public --source=. --remote=origin --push`
3. Включить Pages: `gh api --method POST repos/OWNER/slasti/pages -f "source[branch]=main" -f "source[path]=/"`

`index.html` в корне сразу открывает `html/index.html`. Кейс: `portfolio-case/`. Файл `.nojekyll` нужен, чтобы Pages отдал каталог как есть.

В репозиторий не кладутся видео, архивы, `site/node_modules` и неиспользуемые исходники фотографий.
