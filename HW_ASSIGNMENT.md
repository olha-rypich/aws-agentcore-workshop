# Домашнє завдання: Production-Ready AgentCore Deployment

## Контекст
Це домашнє завдання є прямим продовженням воркшопу й має бути побудоване на тій самій архітектурі, яку ви вже реалізували:
- AgentCore Runtime
- Inbound Auth (Cognito JWT)
- Gateway
- Outbound OAuth до Google Docs
- Observability

Не змінюйте архітектуру на інший стек. Мета — довести воркшопне рішення до production-ready рівня.

## Обов'язково перед стартом
Ознайомтесь з інструкцією з MCP-інструментів:
- [Агентський кодінг (MCP setup)](docs/агентський%20кодінг.md)

## Мета
Перетворити E2E-воркшоп рішення на відтворюваний, безпечний, спостережуваний і надійний деплоймент.

## Обов'язковий обсяг
1. Runtime-агент задеплоєний через `BedrockAgentCoreApp`, `@app.entrypoint` та `app.run()`.
2. Inbound-аутентифікація через Cognito JWT з коректною перевіркою `allowedClients`.
3. Gateway + Google Docs target з outbound OAuth.
4. Реальний tool-calling із runtime-агента (без cloud mock у основному флоу).
5. Коректна обробка трьох станів:
   - `consent_required=true` на першому виклику, якщо consent відсутній.
   - Успішний другий виклик після consent.
   - Контрольоване fallback-повідомлення, якщо tool виклик падає.
6. Observability-докази щонайменше для двох інвокацій.
7. Cleanup-флоу для всіх створених ресурсів.

## Definition Of Done
1. End-to-end флоу працює з чистого середовища.
2. Перший invoke повертає consent challenge (або коректно обробляє вже виданий consent).
3. Другий invoke повертає валідну відповідь із `sources` і `tools_used` (або еквівалентним trace-полем).
4. Логи/трейси чітко показують фактичний виклик tool.
5. Деплой і teardown відтворюються за документованими кроками.

## Що здати
1. Репозиторій з кодом.
2. `README.md` з runbook: setup, deploy, invoke, troubleshooting, cleanup.
3. `ARCHITECTURE.md` з поясненням inbound/outbound/runtime флоу.
4. `EVIDENCE.md` з:
   - виводом першого invoke;
   - виводом другого invoke;
   - observability-доказами (скріншоти/CLI output);
   - підтвердженням cleanup.
5. Відео-демо або live-демо (5-7 хв).

## Рубрика оцінювання (100)
1. Коректність архітектури відносно воркшопу: 25
2. Коректність безпеки/аутентифікації (inbound + outbound): 25
3. Якість runtime та orchestration tool-викликів: 20
4. Надійність та обробка помилок: 15
5. Якість observability-доказів: 10
6. Документація та відтворюваність: 5

## Бонус (+20)
1. Додати policy checks перед виконанням tool.
2. Додати невеликий evaluation-набір (5-10 prompt-ів) з очікуваною поведінкою.
3. Додати CI-перевірки (lint/tests/deployment safety checks).

---

## Чекліст для ментора

### 1) Відтворюваність
- `README.md` повний та реально виконується.
- Є `.env.example` без реальних секретів.
- Свіжий запуск не потребує ручних недокументованих фіксів.

### 2) Runtime
- Використовується `BedrockAgentCoreApp`.
- Використовується `@app.entrypoint`.
- Runtime має статус `READY`.
- Повертається структурований формат відповіді.

### 3) Inbound Auth (Cognito JWT)
- Неавторизовані виклики відхиляються.
- Виклики з валідним JWT працюють.
- `allowedClients` налаштовано коректно.
- Є хоча б один negative auth test.

### 4) Gateway + OAuth Outbound
- Gateway і target у статусі `READY`.
- Tool реально викликається через Gateway.
- OAuth consent flow працює коректно.
- Після consent tool повертає реальні дані Google Docs.

### 5) Поведінка агента
- Немає hardcoded фінальних відповідей у runtime-шляху.
- Відповідь містить source links.
- Використання tool видно явно (`tools_used` або trace evidence).
- Fallback/error-відповідь контрольована і зрозуміла.

### 6) Надійність
- На зовнішніх викликах задані timeout.
- Є retry або чітка failure strategy.
- Є обмеження recursion/tool call budget.
- Немає зависань при типових помилках.

### 7) Observability
- Є CloudWatch runtime logs.
- Є trace-докази щонайменше для двох запусків.
- Tool-call path видно в логах/трейсах.
- Кроки дебагу задокументовані.

### 8) Базова безпека
- У репозиторії/історії немає секретів.
- IAM permissions максимально звужені (наскільки можливо).
- OAuth callback/return URL конфіг узгоджений.
- Cleanup-процедура видаляє створені ресурси.

### 9) Підсумкова перевірка
- `ARCHITECTURE.md` чітко пояснює флоу.
- `EVIDENCE.md` доводить E2E-поведінку.
- Демо чітке й відтворюване.
- Рішення лишається в межах матеріалів воркшопу.

---

## Типові Red Flags (швидкі fail-індикатори)
1. Працює тільки в одній локальній shell-сесії і ламається після перезапуску.
2. Значення token/callback копіюються вручну з прихованого стану.
3. Відповідь агента hardcoded, хоча trace показує нібито tool-call.
4. Немає negative auth test.
5. Немає observability-доказів.
6. Cleanup відсутній або не працює.
