# AWS AgentCore Workshop

Практичний репозиторій воркшопу з фокусом на E2E сценарій:
- AgentCore Runtime
- Inbound Auth (Cognito JWT)
- Gateway + OAuth outbound
- Tool calling + Observability

## Швидкий старт
1. Основний воркшоп: `workshop_google_docs_rag_e2e.ipynb`
2. Runtime код для деплою: `runtime_app_agentcore_full.py`
3. Домашнє завдання: `HW_ASSIGNMENT.md`

## Структура проєкту
- `workshop_google_docs_rag_e2e.ipynb` — головний E2E notebook.
- `runtime_app_agentcore_full.py` — runtime app для AgentCore deploy.
- `HW_ASSIGNMENT.md` — домашнє завдання та чекліст для ментора.
- `docs/` — теорія, шпаргалки та додаткові інструкції.
- `presentations/` — презентації та супутні матеріали.
- `archive/` — legacy/історичні артефакти, винесені з основного потоку.

## Docs
- [Агентський кодінг (MCP setup)](docs/агентський%20кодінг.md)
- [Workshop cheatsheet](docs/workshop-cheatsheet.md)
- [Module 11: Google Docs RAG + Gateway](docs/module11-google-docs-rag-gateway.md)

## Примітки
- Локальні секрети/сесії винесені в `.env`, `.gateway_auth.env` та інші локальні файли (ігноруються через `.gitignore`).
- Runtime/build артефакти (`tmp/`, `__pycache__/`) прибираються з робочого дерева як тимчасові.
- Локальний state/секрети для AgentCore CLI та runtime (наприклад `.bedrock_agentcore*`, identity env/json, `vertex-credentials.json`) винесені в `local/` і не трекаються git.
