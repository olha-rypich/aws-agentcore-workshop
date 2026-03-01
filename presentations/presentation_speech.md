# Повний спіч для презентації Amazon Bedrock AgentCore

**Загальна тривалість:** 30-40 хвилин
**Аудиторія:** Junior/Mid розробники
**Мова:** Українська з англійськими технічними термінами

---

## Слайд 1: Титульна сторінка

**[00:00 - 00:30]**

Доброго дня всім! Сьогодні ми поговоримо про Amazon Bedrock AgentCore - модульну платформу для AI агентів від AWS.

Це не просто черговий інструмент для роботи з LLM, а комплексне рішення для деплою production-ready агентів з enterprise-grade безпекою та масштабованістю.

Протягом наступних 30-40 хвилин ми розглянемо п'ять ключових компонентів платформи та зрозуміємо, чому AgentCore може значно спростити ваш шлях від локального прототипу до промислового рішення.

---

## Слайд 2: Що таке AgentCore?

**[00:30 - 02:00]**

Отже, що таке AgentCore?

AgentCore - це модульна agentic платформа, яка покриває повний життєвий цикл AI агента:
- Побудову - ви пишете логіку агента
- Розгортання - платформа деплоїть у production
- Управління та governance - централізований контроль безпеки та доступу

На слайді ви бачите офіційну діаграму від AWS, яка показує архітектуру платформи.

Три ключові характеристики, які відрізняють AgentCore:

**По-перше, Enterprise-grade безпека** - це не toy project, а рішення для корпоративних потреб з повним контролем доступу, аудитом, та шифруванням.

**По-друге, Framework-agnostic** - ви можете використовувати LangGraph, CrewAI, LlamaIndex, Strands, або написати власний фреймворк. AgentCore не нав'язує конкретний інструмент.

**По-третє, Model-agnostic** - Claude, Gemini, GPT-4, моделі з Bedrock - будь-яка LLM працює з платформою.

Це означає, що ви не прив'язані до екосистеми одного вендора і можете змінювати стек без переписування інфраструктурного коду.

---

## Слайд 3: 9 модульних сервісів

**[02:00 - 04:00]**

AgentCore складається з 9 незалежних модульних сервісів. Ви можете використовувати їх разом або вибірково, залежно від ваших потреб.

Швидко пройдемося по кожному:

**Runtime** - serverless середовище, де живе ваш агент. Ви не управляєте серверами, контейнерами або Lambda functions вручну.

**Memory** - короткострокова та довгострокова пам'ять. Агент пам'ятає контекст розмови та user preferences між сесіями.

**Gateway** - перетворює зовнішні APIs та Lambda в MCP-compatible tools. Це unified interface для всіх інструментів вашого агента.

**Identity** - централізоване управління автентифікацією та авторизацією. Як inbound - хто може викликати агента, так і outbound - до яких ресурсів агент має доступ від імені користувача.

**Code Interpreter** - ізольоване виконання коду в sandbox середовищі. Агент може запускати Python для calculations або data analysis безпечно.

**Browser** - агент може взаємодіяти з веб-додатками, скрейпити сторінки, робити screenshots.

**Observability** - централізований моніторинг та трейсинг через OpenTelemetry. Ви бачите весь lifecycle агента - від reasoning до tool invocations.

**Evaluations** - оцінка якості відповідей агента за різними метриками.

**Policy** - контроль доступу через Cedar policy language. Ви описуєте rules у декларативному форматі.

Ключовий месседж - ці модулі працюють разом, але ви не зобов'язані використовувати всі. Можна почати з Runtime та Gateway, а потім додати Memory чи Observability за потреби.

---

## Слайд 4: Use Cases

**[04:00 - 05:30]**

Давайте подивимося на три основні категорії use cases для AgentCore.

**Автономні агенти** - найпопулярніший сценарій. Customer support bots, які можуть читати knowledge base, відповідати на питання, та ескалейтувати складні кейси. Workflow automation агенти для internal processes - наприклад, approval workflows для invoices або travel requests. Research assistants, які збирають інформацію з різних джерел та готують summaries.

**MCP сервери** - якщо у вас є APIs, які ви хочете зробити доступними для агентів через стандартизований протокол. Замість того щоб писати custom integration для кожного агента, ви створюєте один MCP server через Gateway, і всі агенти можуть його використовувати. Це unified tool interface для вашої організації.

**Agent платформи** - якщо ви будуєте platform as a service для AI агентів. AgentCore надає централізований governance - ви контролюєте security policies, observability, та compliance в одному місці. Multi-tenant deployment з ізоляцією між різними командами або клієнтами. Enterprise security built-in.

Тепер перейдемо до детального розгляду кожного ключового компонента, починаючи з Runtime.

---

## Слайд 5: AgentCore Runtime - Overview

**[05:30 - 07:00]**

Runtime - це серце AgentCore. Secure, serverless середовище, спеціально створене для AI агентів.

На діаграмі ви бачите flow: developer пише код агента з будь-яким фреймворком та моделлю, додає простий decorator `@app.entrypoint`, запускає `configure` та `launch` - і ваш локальний код деплоїться у AWS.

Ключова перевага, яку я хочу підкреслити: **Локальний код стає production deployment за кілька рядків**.

Немає складних Dockerfile, Kubernetes manifests, Lambda configurations. Ви пишете звичайну Python функцію, обгортаєте її в `BedrockAgentCoreApp`, і платформа робить все інше - packaging, deployment, scaling, monitoring.

Це величезна різниця порівняно з традиційним підходом, де перехід від Jupyter notebook до production вимагає тижнів роботи DevOps team.

З Runtime ви фокусуєтеся на business logic агента, а не на інфраструктурі. Саме тому це називається "production-ready platform" - production перестає бути болючою частиною процесу.

Давайте подивимося детальніше на можливості Runtime.

---

## Слайд 6: Runtime - Ключові можливості (1/2)

**[07:00 - 09:00]**

Перша половина ключових можливостей Runtime. Я пройдуся по кожній.

**Framework Agnostic** - LangGraph, CrewAI, Strands, Custom frameworks - все працює. Платформа не нав'язує конкретний orchestration tool. Ваша команда використовує LangGraph? Чудово. Хтось інший пише custom state machine? Теж працює.

**Model Flexibility** - Claude від Anthropic, Gemini від Google, GPT-4 від OpenAI, моделі з Amazon Bedrock - будь-яка LLM. Ви не прив'язані до одного model provider. Можете A/B тестувати різні моделі або використовувати дешевшу модель для простих tasks, а потужнішу для складних.

**Protocol Support** - MCP (Model Context Protocol) та A2A (Agent-to-Agent communication). MCP для tool calling, A2A для multi-agent orchestration. Обидва протоколи підтримуються natively.

**Session Isolation** - кожна user session запускається в окремій microVM. Це означає повну ізоляцію на рівні CPU, memory, filesystem. Якщо у одного користувача агент падає або споживає багато ресурсів, це не впливає на інших користувачів.

**Extended Execution** - до 8 годин для асинхронних workloads. Це не типові 15 хвилин Lambda limit. Якщо ваш агент робить довгий research task або complex data processing, він може працювати години.

**Consumption Pricing** - ви платите тільки за фактичне використання, не за I/O wait. Якщо агент чекає на відповідь від external API, ви не платите за цей час. Це важливо для cost optimization.

---

## Слайд 7: Runtime - Ключові можливості (2/2)

**[09:00 - 10:30]**

Друга половина features, які роблять Runtime потужним.

**Built-in Auth** - інтеграція з Identity Providers. Cognito, Okta, Azure Entra ID - ви не пишете authentication layer з нуля. Підключаєте свій IdP, і Runtime автоматично валідує JWT tokens.

**Agent Observability** - трейсинг reasoning steps та tool invocations. Це не просто application logs. Ви бачите, як агент "думає" - які reasoning steps він робить, які tools викликає, що отримує у відповідь. Це критично для debugging складних agentic workflows.

**100MB Payloads** - підтримка multimodal content. Ви можете передавати великі зображення, документи, відео. Це не обмеження в 6MB як у API Gateway. AgentCore створений для роботи з rich media.

**Bidirectional Streaming** - WebSocket для real-time взаємодії. User пише повідомлення, агент починає відповідати ще до того як закінчив reasoning. Це покращує user experience - користувач бачить progress, а не чекає 30 секунд на повну відповідь.

Всі ці features "працюють з коробки" - ви не конфігуруєте їх manually, вони частина платформи.

---

## Слайд 8: Runtime - Simple Integration

**[10:30 - 12:00]**

А тепер найважливіше - як це виглядає в коді?

На слайді ви бачите мінімальний приклад. **Три рядки коду для production deployment**.

```python
from bedrock_agentcore import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    return your_agent_logic(payload)

app.run()
```

**Перший рядок** - import. Ви встановили SDK через pip, тепер імпортуєте клас.

**Другий рядок** - ініціалізація app. Це wrapper навколо вашого агента.

**Третій блок** - decorate свою entrypoint функцію. `@app.entrypoint` каже платформі: "ось entry point мого агента". У цій функції ви викликаєте свій LangGraph граф, CrewAI crew, або custom logic.

**Четвертий рядок** - `app.run()`. Локально це запускає development server. В production це створює HTTP endpoint для invocation.

Весь ваш existing код агента залишається без змін. Ви просто додаєте ці 3 рядки wrapper коду.

Після цього ви запускаєте `agentcore configure` для setup AWS resources та `agentcore launch` для deployment. Платформа package ваш код, створює Docker image, деплоїть у Runtime, налаштовує networking, security, observability.

Це принципова різниця порівняно з написанням CloudFormation templates, ECS task definitions, або Lambda layers вручну.

Тепер перейдемо до Identity - як контролювати хто має доступ до агента та до яких ресурсів агент має доступ.

---

## Слайд 9: AgentCore Identity - Overview

**[12:00 - 13:30]**

Identity - це comprehensive сервіс для управління автентифікацією та авторизацією.

Фундаментальна проблема, яку він вирішує: **Безпечний доступ агентів до user-specific даних**.

Уявіть: ваш агент читає Google Docs користувача. Як забезпечити, що агент бачить тільки ті документи, до яких користувач має доступ? Не більше, не менше. Це non-trivial проблема.

AgentCore Identity базується на ключовому принципі: **Delegation, not Impersonation**.

Що це означає? Агент НЕ прикидається користувачем. Агент автентифікується як він сам (як окрема identity), але несе verifiable user context.

Це важливо для audit trails. Ви завжди знаєте: це агент викликав API, але від імені конкретного користувача. У logs ви бачите обидві identities.

На діаграмі показано flow: User викликає Agent, Agent має свою власну identity ("Who is this agent?"), але також несе user context для outbound calls до external resources.

Identity має два напрямки: Inbound та Outbound. Зараз розглянемо кожен детальніше.

---

## Слайд 10: Inbound Authentication

**[13:30 - 15:00]**

Inbound Authentication відповідає на два питання:

**"Who is this user?"** - хто викликає мого агента?

**"Is user allowed to call this agent?"** - чи має цей користувач permission викликати цього конкретного агента?

На діаграмі ви бачите повний flow:

1. User логіниться у вашу application через Identity Provider (наприклад, Cognito)
2. Application отримує JWT access token
3. Application викликає AgentCore Runtime з цим token у Authorization header
4. Runtime валідує token через JWKS (JSON Web Key Set)
5. Runtime перевіряє claims у token - issuer, expiration, audience
6. Runtime перевіряє `allowedClients` - чи є цей client_id у whitelist
7. Якщо все ok - invoke проходить, якщо ні - отримуєте 401 Unauthorized

Ключовий момент: ви не пишете цю логіку вручну. Ви просто конфігуруєте у AgentCore:
- `discoveryUrl` вашого IdP (наприклад, `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX/.well-known/openid-configuration`)
- `allowedClients` - список client IDs, які мають permission

Платформа робить всю валідацію автоматично.

Підтримка різних IdP - Cognito, Okta, Azure Entra ID, Auth0, будь-який OIDC-compliant provider.

---

## Слайд 11: Outbound Authentication

**[15:00 - 16:30]**

Outbound Authentication - це коли агент викликає зовнішні ресурси.

Питання: **"Is agent allowed to access this resource on behalf of user?"**

Два основні типи:

**AWS Resources** - використовуємо IAM execution roles. Ваш агент має IAM role з permissions для доступу до S3, DynamoDB, або інших AWS сервісів. Це standard AWS security model.

**External Services** - Google, Salesforce, Stripe, будь-який third-party API. Тут використовуємо OAuth 2.0.

Два варіанти OAuth:
- **2-legged (client credentials)** - агент автентифікується як application. Доступ до ресурсів, які належать application, не конкретному user.
- **3-legged (authorization code)** - user дає explicit consent. Агент отримує user-scoped access token. Це той сценарій, який ми бачили в use case - агент читає Google Docs користувача.

На слайді ви бачите приклад use case: **Агент читає Google Docs користувача**.

Як це працює практично:
1. User викликає агента
2. Агент намагається прочитати Google Doc
3. Gateway перевіряє - чи є у нас OAuth token для цього user?
4. Якщо немає - повертає `authorization_url`
5. User відкриває цей URL у browser, логіниться в Google, дає consent
6. Google redirects back до AgentCore
7. AgentCore зберігає encrypted access token
8. Наступний виклик агента вже має доступ до Google Docs

Весь цей flow управляється платформою. Ви не пишете OAuth redirect logic, token refresh, secure storage.

---

## Слайд 12: Inbound vs Outbound

**[16:30 - 17:30]**

Швидке порівняння двох типів authentication, щоб закріпити розуміння.

**Inbound** - це про вхідний traffic. User → Agent. Validate user access to agent. Питання: хто має право викликати цього агента? Protocol: JWT/OIDC.

**Outbound** - це про вихідний traffic. Agent → External API. Delegate user permissions to resources. Питання: до яких ресурсів агент може достукатися від імені user? Protocol: OAuth 2.0.

Security boundary різний:
- Inbound - це identity perimeter. Хто може зайти в систему.
- Outbound - це delegation to external services. Що агент може робити за межами системи.

Обидва критично важливі для secure production deployment. Якщо у вас є тільки inbound auth, але немає outbound - агент може мати надмірні permissions. Якщо є outbound, але немає inbound - будь-хто може викликати вашого агента.

AgentCore покриває обидва напрямки natively.

---

## Слайд 13: Identity Benefits

**[17:30 - 18:30]**

Три ключові переваги AgentCore Identity.

**Zero Trust Security** - принцип least privilege. Кожен component має мінімально необхідні permissions. User має доступ тільки до тих агентів, які йому потрібні. Агент має доступ тільки до тих resources, які необхідні для виконання task. Немає "admin" users з доступом до всього.

**Cross-Platform** - працює не тільки з AWS. Ви можете інтегрувати з іншими clouds - GCP, Azure. Можете підключати on-premise resources. Це не lock-in в AWS ecosystem. Identity працює як universal layer поверх різних providers.

**Audit Trails** - compliance та security monitoring. Кожен authentication attempt, кожен API call логується. Ви бачите who, when, what. Це критично для enterprise compliance requirements - SOC 2, HIPAA, GDPR. Ви можете показати auditors повний trail хто і коли мав доступ до sensitive data.

Тепер перейдемо до Memory - як зробити агента stateful.

---

## Слайд 14: AgentCore Memory - Overview

**[18:30 - 20:00]**

Memory вирішує фундаментальну проблему: AI агенти за замовчуванням stateless.

Кожен запит до LLM - це fresh start. Модель не пам'ятає попередню розмову, якщо ви не передаєте весь history у prompt. Це працює для simple use cases, але не масштабується.

AgentCore Memory - це fully managed сервіс для збереження context.

Два типи пам'яті:

**Short-term Memory** - turn-by-turn у межах однієї сесії. User каже: "What's the weather in Seattle?" Агент відповідає. User каже: "What about tomorrow?" Агент розуміє, що "tomorrow" означає Seattle, бо пам'ятає контекст.

Це зберігається в conversation history. Весь prompt + response chain для поточної сесії.

**Long-term Memory** - user preferences між сесіями. User каже: "I prefer window seats." Агент зберігає це як fact. Через тиждень, коли user бронює наступний flight, агент automatically пропонує window seat, навіть якщо user не згадав про це.

Це не просто RAG over conversation history. Це intelligent extraction ключових facts, preferences, summaries.

Memory не просто зберігає - вона структурує інформацію так, щоб агент міг ефективно її використовувати.

---

## Слайд 15: Without vs With Memory

**[20:00 - 21:00]**

Візуальне порівняння, яке показує різницю.

**Without Memory** - кожна взаємодія незалежна. User задає питання, агент відповідає. User задає наступне питання - агент не пам'ятає попередню розмову. Як розмова з кимось, хто має amnesia після кожної фрази.

На діаграмі ви бачите: Agent handles each interaction independently. Немає стрілок між interactions. Кожен запит починається з blank slate.

**With Memory** - context carried forward. Агент пам'ятає попередні turn, знає user preferences. Розмова стає natural, як з людиною.

На діаграмі: Agent ↔ Memory. Bidirectional arrows. Агент читає memory перед тим як відповісти, і пише в memory після interaction.

Новий користувач приходить - агент має context про цього user з попередніх сесій. Навіть якщо це через день, тиждень, місяць.

"New conversation: With context carried forward, the agent delivers smarter, more natural and personalized interactions every time."

Це transforms user experience. Ви не повторюєте себе кожного разу. Агент "знає" вас.

---

## Слайд 16: Memory Use Cases

**[21:00 - 22:00]**

Чотири concrete use cases для Memory.

**Conversational agents** - customer support з historical context. User звертається вдруге з тією ж проблемою. Агент каже: "I see you contacted us last week about the same issue. Let me check if the solution I provided worked." Це dramatically покращує satisfaction.

**Task-oriented agents** - workflow tracking. Invoice approval процес розтягується на кілька днів. User каже агенту: "Approve this invoice." Агент: "Got it, I'll process it." Через два дні user питає: "What's the status?" Агент: "The invoice you asked me to approve is now in the finance queue." Агент пам'ятає контекст task.

**Multi-agent systems** - shared memory для coordination. У вас є research agent та writing agent. Research agent збирає facts, пише їх у shared memory. Writing agent читає ці facts та пише article. Agents coordinate через memory, не через direct communication.

**Autonomous agents** - learning from past experiences. Агент робить помилку, ви даєте feedback. Агент зберігає це у long-term memory. Наступного разу агент не повторює цю помилку, бо "запам'ятав" lesson.

Memory - це те, що робить агента truly intelligent в довгостроковій перспективі.

---

## Слайд 17: AgentCore Gateway - Overview

**[22:00 - 23:30]**

Переходимо до Gateway - можливо найскладнішого, але дуже потужного компоненту.

Gateway вирішує проблему: як зробити зовнішні APIs доступними для агентів через unified interface?

У вас може бути 10 різних APIs - Google Docs, Slack, Stripe, internal REST APIs. Кожен має свою authentication, свій schema, свій error handling.

Без Gateway: ви пишете custom integration для кожного API у кожному агенті. Багато boilerplate code, дублювання логіки.

**З Gateway: ви перетворюєте всі ці APIs у MCP servers**. MCP - Model Context Protocol - це стандартизований протокол для tool calling.

Агент бачить unified interface. Замість "як викликати Google Docs API з OAuth?" агент просто каже: "listTools" - отримує список доступних tools. "invokeTool('read_google_doc', {doc_id: 'xxx'})" - викликає tool.

Gateway під капотом робить всю складну роботу:
- OAuth token management
- API schema transformation
- Error handling та retry logic
- Rate limiting
- Logging та monitoring

На діаграмі ви бачите: Agents викликають MCP Client → AgentCore Gateway → External APIs.

Gateway - це те, що дозволяє агентам легко інтегруватися з будь-якими зовнішніми системами.

---

## Слайд 18: Gateway - Як працює

**[23:30 - 25:00]**

Gateway працює через концепцію **Gateway Target**.

Три типи targets:

**1. Lambda ARNs** - ви пишете custom Lambda function з будь-якою логікою. Gateway викликає цю Lambda як tool. Це дає максимальну flexibility - ви можете робити що завгодно у Lambda: query database, call internal APIs, complex business logic.

**2. API specifications** - OpenAPI або Smithy schemas. Ви просто даєте Gateway API schema, і він автоматично генерує MCP tools. Наприклад, OpenAPI spec для Google Docs API → Gateway створює tool `read_document`, `list_documents`, etc. Без написання коду.

**3. MCP Transport** - Streamable HTTP. Якщо у вас вже є MCP server, Gateway може proxy calls до нього.

MCP операції:

**listTools** - агент питає: які tools доступні? Gateway повертає список з descriptions. LLM використовує ці descriptions для reasoning - який tool викликати.

**invokeTool** - агент викликає конкретний tool з arguments. Gateway валідує arguments, викликає backend (Lambda або API), повертає result.

На діаграмі внизу ви бачите flow:
- Framework з MCP Client → Gateway
- Gateway має API Endpoint Targets (Tools 1-3) та Lambda Targets (Tools 4-6)

Gateway - це abstraction layer, який приховує complexity backend integrations від агента.

---

## Слайд 19: Gateway - Авторизація

**[25:00 - 26:00]**

Gateway також управляє authentication - як inbound, так і outbound.

**Inbound** - User → App → Agent → Gateway. OAuth token передається від user через agent до Gateway. Gateway валідує: чи має цей user доступ до цього Gateway? Чи дозволено викликати ці tools?

На діаграмі ліворуч: Token vault з Integration Identity Provider. Gateway перевіряє token перед тим як allow/deny access.

**Outbound** - Gateway → External resources. Gateway використовує credentials для виклику backend APIs.

Три типи credentials:
- **API Key** → REST endpoint. Просто статичний key.
- **IAM** → Lambda function. AWS signature v4 для secure calls.
- **OAuth token** → 3rd party services. Для Google, Salesforce, etc.

На діаграмі праворуч: Gateway викликає різні backends з різними auth mechanisms.

Gateway інтегрується з AgentCore Identity для централізованого управління credentials.

Observability через CloudTrail - кожен call логується. Ви бачите audit trail.

---

## Слайд 20: Gateway - Tool Discovery

**[26:00 - 27:30]**

Проблема масштабу: у production системі може бути сотні tools.

На слайді приклад: Target 1 має 250 tools, Target 2 має 100 tools, Target 3 має 10 tools. Total 360 tools.

**Without search**: агент викликає `listTools` → отримує всі 360 tools. LLM повинна обробити descriptions всіх 360 tools у prompt. Це:
- Дорого (tokens)
- Повільно (latency)
- Неефективно (LLM gublиться серед irrelevant tools)

**Using search**: агент каже `search("draft a new advertisement")` → Gateway робить semantic search через vector embeddings → повертає 4 most relevant tools.

Як це працює:
1. Коли ви створюєте Gateway Target, платформа automatically генерує embeddings для кожного tool description
2. Ці embeddings зберігаються у vector database
3. Коли агент робить search query, Gateway embedить query та шукає k-nearest neighbors
4. Повертає тільки relevant tools

Це opt-in feature. Ви enable semantic search при CreateGateway API call.

На діаграмі внизу ви бачите приклад: "draft a new advertisement" → returns 4 most relevant tools замість 360.

Приклад: якщо у вас є 50 tools для email operations та 300 tools для інших domains, агент який працює з email отримає тільки relevant email tools, не весь catalog.

---

## Слайд 21: Gateway Benefits

**[27:30 - 28:30]**

П'ять ключових переваг Gateway.

**No Infrastructure Management** - fully managed. Ви не deploy Gateway server, не manage scaling, не monitor uptime. AWS робить це за вас.

**Unified Interface** - MCP protocol для всіх tools. Агент не знає, що під капотом - Lambda, REST API, або gRPC service. Для агента все виглядає як MCP tools.

**Built-in Auth** - OAuth lifecycle management. Коли user дає consent, Gateway зберігає token securely, автоматично refresh коли expired, handle revocation. Ви не пишете цю логіку.

**Auto Scaling** - no capacity planning. 10 requests per second або 10,000 requests per second - Gateway scales automatically. Ви не provision capacity заздалегідь.

**Enterprise Security** - encryption at rest та in transit. Audit logging через CloudTrail. Access controls через IAM policies. Built-in security best practices.

Gateway - це те, що дозволяє швидко додавати нові integrations без переписування infrastructure code кожного разу.

---

## Слайд 22: Ключові переваги AgentCore

**[28:30 - 30:00]**

Ми розглянули всі ключові компоненти. Тепер підсумуємо переваги для трьох груп stakeholders.

**Для розробників:**

**Framework-agnostic** - ви не змінюєте свій існуючий код. LangGraph, CrewAI, custom - все працює.

**Minimal code** - три рядки wrapper коду для production deployment. Не тижні DevOps роботи.

**Local → Cloud seamless** - ваш агент працює локально з mock tools. Той самий код деплоїться у production з real integrations. Smooth transition.

**Для операцій:**

**Fully managed** - немає servers для patch, немає containers для orchestrate. AWS manages infrastructure.

**Security built-in** - authentication, authorization, encryption, audit logs - все out of the box. Ви не пишете security layer з нуля.

**Auto-scaling** - від zero до thousands requests. No manual capacity planning.

**Для бізнесу:**

**Production-ready day one** - ви не чекаєте місяці на production deployment. Prototype → production за days.

**Pay per use** - consumption-based pricing. Ви платите за actual invocations, не за idle capacity.

**Compliance** - built-in features для SOC 2, HIPAA, GDPR compliance. Audit trails, encryption, access controls.

AgentCore - це інвестиція у швидкість delivery та якість production systems.

---

## Слайд 23: Наступний воркшоп

**[30:00 - 32:00]**

Дякую за увагу!

Ми розглянули фундаментальні концепції AgentCore - Runtime, Identity, Memory, та Gateway.

Але теорія - це тільки початок. **Наступний воркшоп буде повністю практичним**.

Ми будемо hands-on будувати реальний AI агент:

**По-перше**, створимо локального ReAct агента з LangGraph - це той самий агент, про який ми говорили. Він буде розмовляти, reasoning робити, tools викликати. Протестуємо його локально.

**По-друге**, деплоїмо цей агент у AgentCore Runtime - три рядки коду, як ми бачили сьогодні. Локальний код стане production service.

**По-третє**, підключимо OAuth авторизацію - трьохстороння авторизація з Google. User дає consent, агент отримує доступ до Google Docs конкретного користувача.

**По-четверте**, інтеграція з Gateway - агент буде читати реальні Google Docs, робити RAG over documents, відповідати на питання на основі контенту.

**І нарешті**, додамо persistence - session management, щоб агент пам'ятав контекст між викликами.

Повний цикл від нуля до production-ready агента за один воркшоп.

Це буде jupyter notebook з покроковими інструкціями - ви зможете запускати кожну комірку, бачити результати, експериментувати.

До зустрічі на наступному воркшопі! 🚀

---

**Загальні рекомендації по delivery:**

1. **Темп** - не поспішайте. Краще закінчити за 35 хвилин з pauses для питань, ніж гнати 40 слайдів за 25 хвилин.

2. **Eye contact** - дивіться на аудиторію, не на слайди. Слайди - це support для вас, не script для читання.

3. **Паузи** - після кожного ключового statement робіть паузу 2-3 секунди. Це дає час аудиторії засвоїти information.

4. **Примери** - коли говорите про abstract concepts (authentication, memory), давайте concrete приклади. "Уявіть, що ви будуєте customer support bot..."

5. **Енергія** - перші 5 хвилин та останні 5 хвилин - найважливіші. Hook аудиторію на початку, strong finish наприкінці.

6. **Питання** - якщо хтось задає питання під час презентації, швидко відповідайте якщо це clarification, або кажіть "гарне питання, давайте повернемося до цього після слайду про X".

7. **Технічні терміни** - коли вперше використовуєте термін (MCP, OAuth 3LO, microVM), коротко explain що це означає. Аудиторія Junior/Mid, не всі можуть знати.

Успіху з презентацією! 🎤
