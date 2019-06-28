# gitlab_helper_bot

### About

Телеграм бот, который оповещает о новых merge requests (gitlab) и назначет проверяющих.

Принцип бота основан на периодическом обновлении данных через api Gitlab и хранении информации в базе MongoDB.

[Документация по фреймворку бота](https://telegraf.js.org)

### Requirements

- MongoDB
- docker-compose

### Deployment

Для работы бота необходимы:

- [токен Telegram][telegram_token]
- [токен Gitlab][gitlab_token]

Конфигурирование бота происходит через переменные окружения, которые необходимо указать в файле `.env`

Обязательные переменные окружения:

- `TELEGRAM_TOKEN` [токен Telegram][telegram_token]
- `GITLAB_TOKEN` [токен Gitlab][gitlab_token]
- `DEFAULT_PROJECT` проект Gitlab, example:`username/projectname`
- `ADMIN_ID` числовой идентификатор юзера telegram
- `DB_USER` юзер базы данных
- `DB_PASS` пароль для юзера базы данных
- `DB_NAME` имя базы Mongodb
- `NODE_ENV` development/production

Перед первым запуском необходмио создать базу данных MongoDB. После создания базы данных необходимо
инициализировать данные проекта с помощью команды `docker-compose run --entrypoint "node bin/init-database" bot-cron-job`

Для периодического обновления необходимо запускать команду `docker-compose run bot-cron-job`. Рекомендуется
использовать cron (желательно запускать команду не чаще чем каждые 4 минуты, так как Gitlab иногда очень долго отвечает)

### Deployment Polling

- Запуск бота в режиме демона `docker-compose up -d --no-recreate bot-polling`
- Обновить контейнер `docker-compose up -d --force-recreate --build bot-polling`
- Остановка `docker-compose down`

### Deployment Webhook

Для запуска в этом режиме требуется указать дополнительные переменные окружения:

- `BOT_PORT` порт на котором будет слушать бот
- `SECRET_PATH` путь по которому бот будет принимать запросы
  (например вывод команды `openssl rand -base64 32 | tr -- '+=/' '-_~'`)
- `SECRET_LOCATION` путь по которому будет слушать nginx (например `https://example.com/secret_location/`)

- Запуск бота в режиме демона `docker-compose up -d --no-recreate bot-webhook`
- Обновить контейнер `docker-compose up -d --force-recreate --build bot-webhook`
- Остановка `docker-compose down`

Для работы в этом режиме необходимо настроить nginx (обязательно должен быть валидный сертификат ssl)
Ниже приводится часть конфига

```
server {

    location /secret_location/ { # часть SECRET_LOCATION из переменной окружения
        proxy_pass         http://127.0.0.1:BOT_PORT/; # порт на котором слушает бот
        proxy_redirect     off;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;
    }
}
```

### Management

Для начала необходимо инициализировать базу и добавить бота в необходимую группу Telegram

Чтобы включить оповещения необходимо выполнить команду `/activate` в чате группы Telegram
(отключение происходит через команду `/deactivate` в личном чате с ботом)

Обновление базы (информация о пользователях Gitlab, если юзер был создан после начальной инициализации)
происходит через команду `/update` в личном чате с ботом

Чтобы привязать пользователя Telegram к пользователю Gitlab необходимо выполнить команду
`/attach @telegramusername`. В появившемся списке необходимо выбрать пользователя Gitlab.
После добавления бот будет проверять наличие новых merge request для привязанного юзера.

###### Дополнительные команды для администратора (используются без аргументов в личном чате с ботом)

- `/grant` Присвоить пользователю права проверяющиего (бот будет назначать на него merge requests)
- `/revoke` Забрать у пользователя права проверяющего
- `/grant_pm` Присвоить пользователю права менеджера
  (бот будет оповещать о проверке всеми проверяющими и назначать merge request на Gitlab)
- `/revoke_pm` Забрать у пользователя права менеджера
- `/grant_tester` Присвоить пользователю права тестера
  (бот будет назначать merge request на Gitlab вместо менеджера)
- `/revoke_tester` Забрать у пользователя права тестера
- `/unsafe` Пометить разработчика как не очень надежного
  (бот будет назначать все его merge request после проверки аппруверами на тестера)
- `/safe` Восстановить доверие к разработчику =\)
- `/delete_all_messages` удаляет все сообщения бота в групповом чате за последние 48 часов

###### Команды для пользователей (в личном чате)

- `/enable_notifications` Включает оповещения в личку (например о конфликтах в merge request)
- `/disable_notifications` Отключает оповещения
- `/for_me` Выводит список merge requests назначенных на текущего пользователя
- `/report` Выводит статус текущих merge requests
- `/reassign` Переназначить текущий merge request на другого проверяющего

### Authors

- Роман Громов

[gitlab_token]: https://gitlab.com/profile/personal_access_tokens
[telegram_token]: https://core.telegram.org/bots#3-how-do-i-create-a-bot
