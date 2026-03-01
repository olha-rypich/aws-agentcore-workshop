#!/usr/bin/env node

const pptxgen = require("pptxgenjs");

// EPAM Brand Colors
const COLORS = {
  epamBlue: "39C2D7",
  epamDark: "3D3D3D",
  epamWhite: "FFFFFF",
  textDark: "2C2C2C",
  textLight: "F5F5F5",
  accentGreen: "00B4A8",
  bgLight: "F8F9FA",
};

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'EPAM Workshop';
pres.title = 'AWS AgentCore Workshop';

const makeShadow = () => ({
  type: "outer",
  blur: 8,
  offset: 3,
  angle: 135,
  color: "000000",
  opacity: 0.15
});

function addEPAMFooter(slide, slideNumber) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.4, w: 10, h: 0.225,
    fill: { color: COLORS.epamBlue }
  });
  slide.addText("EPAM", {
    x: 0.3, y: 5.42, w: 1.5, h: 0.18,
    fontSize: 14, bold: true, color: COLORS.epamWhite,
    fontFace: "Arial", margin: 0
  });
  if (slideNumber) {
    slide.addText(String(slideNumber), {
      x: 9.2, y: 5.42, w: 0.5, h: 0.18,
      fontSize: 11, color: COLORS.epamWhite,
      align: "right", fontFace: "Arial", margin: 0
    });
  }
}

// SLIDE 1: Title
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.epamDark };
slide1.addText("AWS AgentCore", {
  x: 0.5, y: 1.8, w: 9, h: 0.8,
  fontSize: 54, bold: true, color: COLORS.epamWhite,
  align: "center", fontFace: "Arial"
});
slide1.addText("Production-Ready Platform для AI Агентів", {
  x: 0.5, y: 2.8, w: 9, h: 0.5,
  fontSize: 28, color: COLORS.epamBlue,
  align: "center", fontFace: "Arial"
});
slide1.addText("Workshop для розробників", {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 20, color: COLORS.textLight,
  align: "center", fontFace: "Arial"
});
slide1.addText("EPAM", {
  x: 0.5, y: 5, w: 1.5, h: 0.4,
  fontSize: 24, bold: true, color: COLORS.epamBlue,
  fontFace: "Arial"
});

// SLIDE 2-6 (keeping existing)
let slide2 = pres.addSlide();
slide2.background = { color: COLORS.bgLight };
slide2.addText("Що таке AI Agent?", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.2, w: 9, h: 1.2,
  fill: { color: COLORS.epamWhite }, shadow: makeShadow()
});
slide2.addText("Автономна система, яка приймає рішення та виконує дії", {
  x: 0.8, y: 1.5, w: 8.4, h: 0.6,
  fontSize: 20, color: COLORS.textDark, align: "center", valign: "middle", fontFace: "Arial"
});
slide2.addText("Ключові компоненти:", {
  x: 0.5, y: 2.6, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
const components = [
  { icon: "🤖", text: "LLM (Large Language Model)" },
  { icon: "🔧", text: "Tools (інструменти для дій)" },
  { icon: "💾", text: "Memory (пам'ять контексту)" },
  { icon: "🎯", text: "Planning (планування кроків)" }
];
components.forEach((comp, idx) => {
  slide2.addText(comp.icon + "  " + comp.text, {
    x: 1.5, y: 3.2 + (idx * 0.45), w: 7, h: 0.4,
    fontSize: 16, color: COLORS.textDark, fontFace: "Arial"
  });
});
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 5, w: 9, h: 0.4,
  fill: { color: COLORS.epamBlue, transparency: 20 }
});
slide2.addText("💡 Приклад use case: RAG agent з Google Docs", {
  x: 0.8, y: 5.05, w: 8.4, h: 0.3,
  fontSize: 14, italic: true, color: COLORS.epamDark,
  fontFace: "Arial", valign: "middle"
});
addEPAMFooter(slide2, 2);

// SLIDE 3: Problems
let slide3 = pres.addSlide();
slide3.background = { color: COLORS.bgLight };
slide3.addText("Проблеми при деплої агентів у production", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
const problemsData = [
  [
    { text: "Проблема", options: { bold: true, fill: { color: COLORS.epamBlue }, color: COLORS.epamWhite, fontSize: 14 } },
    { text: "AgentCore Рішення", options: { bold: true, fill: { color: COLORS.epamBlue }, color: COLORS.epamWhite, fontSize: 14 } }
  ],
  ["Agent hosting complexity", "Managed Runtime"],
  ["Security perimeter", "Centralized Identity"],
  ["Tool integration overhead", "MCP Gateway"],
  ["Authentication sprawl", "Unified OAuth flows"],
  ["Observability fragmentation", "Centralized logging/tracing"],
  ["Code execution safety", "Isolated Code Interpreter"],
  ["Memory management", "Persistent Memory service"],
  ["Scale-to-zero architecture", "Stateless multi-tenant design"]
];
slide3.addTable(problemsData, {
  x: 0.5, y: 1.2, w: 9, h: 3.8,
  border: { pt: 1, color: COLORS.epamDark },
  fontSize: 13, color: COLORS.textDark, fontFace: "Arial",
  colW: [4.5, 4.5], valign: "middle"
});
addEPAMFooter(slide3, 3);

// SLIDE 4: What is AgentCore
let slide4 = pres.addSlide();
slide4.background = { color: COLORS.bgLight };
slide4.addText("Що таке AWS AgentCore?", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide4.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 9, h: 0.9,
  fill: { color: COLORS.epamBlue }, shadow: makeShadow()
});
slide4.addText("Managed platform для деплою AI агентів", {
  x: 0.8, y: 1.5, w: 8.4, h: 0.5,
  fontSize: 24, bold: true, color: COLORS.epamWhite,
  align: "center", valign: "middle", fontFace: "Arial"
});
const keyPoints = [
  { title: "Розділення відповідальностей", desc: "LangGraph → Business Logic | AgentCore → Infrastructure" },
  { title: "Ключова перевага", desc: "Focus on business logic, not infrastructure" }
];
keyPoints.forEach((point, idx) => {
  const y = 2.5 + (idx * 1.2);
  slide4.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: y, w: 8, h: 1,
    fill: { color: COLORS.epamWhite }, shadow: makeShadow()
  });
  slide4.addText(point.title, {
    x: 1.3, y: y + 0.15, w: 7.4, h: 0.35,
    fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
  });
  slide4.addText(point.desc, {
    x: 1.3, y: y + 0.55, w: 7.4, h: 0.3,
    fontSize: 14, color: COLORS.textDark, fontFace: "Arial"
  });
});
addEPAMFooter(slide4, 4);

// SLIDE 5: Architecture
let slide5 = pres.addSlide();
slide5.background = { color: COLORS.bgLight };
slide5.addText("High-level Архітектура", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
const archBoxes = [
  { x: 0.8, y: 1.5, text: "User/Client", color: COLORS.epamBlue },
  { x: 3.2, y: 1.5, text: "AgentCore\nIdentity", color: COLORS.accentGreen },
  { x: 5.6, y: 1.5, text: "AgentCore\nRuntime", color: COLORS.epamDark },
  { x: 1.5, y: 3.2, text: "AgentCore\nGateway", color: COLORS.accentGreen },
  { x: 4.5, y: 3.2, text: "AgentCore\nMemory", color: COLORS.accentGreen },
  { x: 7.5, y: 3.2, text: "LangGraph\nAgent", color: COLORS.epamBlue },
  { x: 1.5, y: 4.5, text: "External APIs\n(Google, Slack...)", color: COLORS.textDark }
];
archBoxes.forEach(box => {
  slide5.addShape(pres.shapes.RECTANGLE, {
    x: box.x, y: box.y, w: 1.8, h: 0.8,
    fill: { color: box.color }, shadow: makeShadow()
  });
  slide5.addText(box.text, {
    x: box.x, y: box.y + 0.15, w: 1.8, h: 0.5,
    fontSize: 12, bold: true, color: COLORS.epamWhite,
    align: "center", valign: "middle", fontFace: "Arial"
  });
});
addEPAMFooter(slide5, 5);

// SLIDE 6: Runtime
let slide6 = pres.addSlide();
slide6.background = { color: COLORS.bgLight };
slide6.addText("AgentCore Runtime", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide6.addText("Що робить:", {
  x: 0.5, y: 1.2, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const runtimeFeatures = ["Manages agent lifecycle", "Session tracking", "Deployment orchestration"];
runtimeFeatures.forEach((feature, idx) => {
  slide6.addText("•  " + feature, {
    x: 0.8, y: 1.7 + (idx * 0.35), w: 3.7, h: 0.3,
    fontSize: 15, color: COLORS.textDark, fontFace: "Arial"
  });
});
slide6.addShape(pres.shapes.RECTANGLE, {
  x: 5, y: 1.2, w: 4.5, h: 2.8,
  fill: { color: COLORS.epamDark }, shadow: makeShadow()
});
slide6.addText("Canonical Contract:", {
  x: 5.2, y: 1.35, w: 4.1, h: 0.3,
  fontSize: 14, bold: true, color: COLORS.epamBlue, fontFace: "Consolas"
});
const codeLines = [
  "from bedrock_agentcore import \\", "    BedrockAgentCoreApp", "",
  "app = BedrockAgentCoreApp()", "", "@app.entrypoint",
  "def invoke(payload, context):", "    return graph.invoke(payload)",
  "", "app.run()"
];
slide6.addText(codeLines.map((line, idx) => ({
  text: line, options: { breakLine: idx < codeLines.length - 1 }
})), {
  x: 5.2, y: 1.75, w: 4.1, h: 2,
  fontSize: 11, fontFace: "Consolas", color: COLORS.textLight
});
slide6.addText("Переваги:", {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const benefits = ["⚡ Serverless scaling", "🔄 Session continuity", "🚀 No Lambda/container management"];
benefits.forEach((benefit, idx) => {
  slide6.addText(benefit, {
    x: 1, y: 4 + (idx * 0.4), w: 8, h: 0.35,
    fontSize: 15, color: COLORS.textDark, fontFace: "Arial"
  });
});
addEPAMFooter(slide6, 6);

console.log("✅ Created slides 1-6, creating 7-12...");

// SLIDE 7: Inbound Authentication
let slide7 = pres.addSlide();
slide7.background = { color: COLORS.bgLight };
slide7.addText("AgentCore Identity - Inbound Authentication", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide7.addText("Мета: Контроль доступу - хто може викликати агента?", {
  x: 0.5, y: 1.1, w: 9, h: 0.4,
  fontSize: 16, italic: true, color: COLORS.textDark, fontFace: "Arial"
});

// Flow boxes
const authFlow = [
  { x: 0.5, y: 1.8, text: "User", w: 1.2 },
  { x: 2.2, y: 1.8, text: "Cognito", w: 1.4 },
  { x: 4.1, y: 1.8, text: "JWT Token", w: 1.4 },
  { x: 6, y: 1.8, text: "Runtime", w: 1.3 },
  { x: 7.8, y: 1.8, text: "JWKS\nValidation", w: 1.5 }
];
authFlow.forEach((box, idx) => {
  slide7.addShape(pres.shapes.RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: 0.7,
    fill: { color: COLORS.epamBlue }, shadow: makeShadow()
  });
  slide7.addText(box.text, {
    x: box.x, y: box.y + 0.15, w: box.w, h: 0.4,
    fontSize: 11, bold: true, color: COLORS.epamWhite,
    align: "center", valign: "middle", fontFace: "Arial"
  });
  if (idx < authFlow.length - 1) {
    slide7.addText("→", {
      x: box.x + box.w + 0.05, y: box.y + 0.2, w: 0.3, h: 0.3,
      fontSize: 20, color: COLORS.epamDark, align: "center"
    });
  }
});

slide7.addText("Ключові компоненти:", {
  x: 0.5, y: 2.9, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const authComponents = [
  "• discoveryUrl: OIDC metadata для JWT validation",
  "• allowedClients: Whitelist client_id",
  "• JWT claims validation (iss, exp, audience)"
];
authComponents.forEach((comp, idx) => {
  slide7.addText(comp, {
    x: 1, y: 3.4 + (idx * 0.4), w: 8, h: 0.35,
    fontSize: 15, color: COLORS.textDark, fontFace: "Arial"
  });
});
addEPAMFooter(slide7, 7);

// SLIDE 8: Outbound Authentication
let slide8 = pres.addSlide();
slide8.background = { color: COLORS.bgLight };
slide8.addText("AgentCore Identity - Outbound Authentication", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide8.addText("Мета: Агент викликає API від імені користувача (user federation)", {
  x: 0.5, y: 1.1, w: 9, h: 0.4,
  fontSize: 16, italic: true, color: COLORS.textDark, fontFace: "Arial"
});
slide8.addText("OAuth 3LO (Three-Legged OAuth) Flow:", {
  x: 0.5, y: 1.7, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const oauth3LOSteps = [
  "1. Agent calls tool → Gateway detects no consent",
  "2. Returns authorization_url",
  "3. User opens browser, grants consent",
  "4. Callback to AgentCore",
  "5. Agent calls complete_resource_token_auth",
  "6. Token encrypted and stored",
  "7. Next tool call succeeds with user-scoped access"
];
oauth3LOSteps.forEach((step, idx) => {
  slide8.addText(step, {
    x: 1, y: 2.2 + (idx * 0.38), w: 8, h: 0.35,
    fontSize: 14, color: COLORS.textDark, fontFace: "Arial"
  });
});
addEPAMFooter(slide8, 8);

// SLIDE 9: Inbound vs Outbound comparison
let slide9 = pres.addSlide();
slide9.background = { color: COLORS.bgLight };
slide9.addText("Inbound vs Outbound Auth - Порівняння", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
const authComparisonData = [
  [
    { text: "", options: { fill: { color: COLORS.bgLight }, fontSize: 14 } },
    { text: "Inbound", options: { bold: true, fill: { color: COLORS.epamBlue }, color: COLORS.epamWhite, fontSize: 14 } },
    { text: "Outbound", options: { bold: true, fill: { color: COLORS.accentGreen }, color: COLORS.epamWhite, fontSize: 14 } }
  ],
  [
    { text: "Мета", options: { bold: true } },
    "Хто може викликати агента",
    "Агент викликає API від імені user"
  ],
  [
    { text: "Протокол", options: { bold: true } },
    "JWT/OIDC",
    "OAuth 2.0 3LO"
  ],
  [
    { text: "Токен", options: { bold: true } },
    "User access token (Cognito)",
    "Google access token (user-scoped)"
  ],
  [
    { text: "Validation", options: { bold: true } },
    "JWKS signature + claims",
    "Credential provider management"
  ],
  [
    { text: "Security boundary", options: { bold: true } },
    "Identity perimeter",
    "Delegation to external services"
  ]
];
slide9.addTable(authComparisonData, {
  x: 0.5, y: 1.2, w: 9, h: 3.8,
  border: { pt: 1, color: COLORS.epamDark },
  fontSize: 12, color: COLORS.textDark, fontFace: "Arial",
  colW: [2.5, 3.25, 3.25], valign: "middle"
});
addEPAMFooter(slide9, 9);

// SLIDE 10: AgentCore Gateway (MCP)
let slide10 = pres.addSlide();
slide10.background = { color: COLORS.bgLight };
slide10.addText("AgentCore Gateway (MCP)", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide10.addText("Що робить: Exposes external tools/APIs через MCP protocol", {
  x: 0.5, y: 1.1, w: 9, h: 0.4,
  fontSize: 16, italic: true, color: COLORS.textDark, fontFace: "Arial"
});

// MCP methods
slide10.addText("MCP методи:", {
  x: 0.5, y: 1.7, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const mcpMethods = [
  "• tools/list → список доступних інструментів",
  "• tools/call → виклик інструмента з arguments"
];
mcpMethods.forEach((method, idx) => {
  slide10.addText(method, {
    x: 0.8, y: 2.15 + (idx * 0.4), w: 8, h: 0.35,
    fontSize: 14, color: COLORS.textDark, fontFace: "Arial"
  });
});

// Target types
slide10.addText("Типи targets:", {
  x: 0.5, y: 3.1, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const targetTypes = [
  { title: "OpenAPI target", desc: "Direct API calls (Google Docs, Stripe) без Lambda" },
  { title: "Lambda target", desc: "Custom logic з повною гнучкістю" }
];
targetTypes.forEach((type, idx) => {
  slide10.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 3.6 + (idx * 0.8), w: 8.4, h: 0.7,
    fill: { color: COLORS.epamWhite }, shadow: makeShadow()
  });
  slide10.addText(type.title, {
    x: 1, y: 3.7 + (idx * 0.8), w: 8, h: 0.3,
    fontSize: 15, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
  });
  slide10.addText(type.desc, {
    x: 1, y: 4 + (idx * 0.8), w: 8, h: 0.25,
    fontSize: 13, color: COLORS.textDark, fontFace: "Arial"
  });
});
addEPAMFooter(slide10, 10);

// SLIDE 11: Gateway OpenAPI Target Example
let slide11 = pres.addSlide();
slide11.background = { color: COLORS.bgLight };
slide11.addText("Gateway - OpenAPI Target Example", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
slide11.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.2, w: 9, h: 3.5,
  fill: { color: COLORS.epamWhite }, shadow: makeShadow()
});
slide11.addText("OpenAPI Schema:", {
  x: 0.8, y: 1.4, w: 8.4, h: 0.3,
  fontSize: 16, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const openAPIExample = [
  "servers: https://docs.googleapis.com",
  "path: /v1/documents/{documentId}",
  "operationId: getDocument"
];
openAPIExample.forEach((line, idx) => {
  slide11.addText("  • " + line, {
    x: 1.2, y: 1.8 + (idx * 0.35), w: 7.6, h: 0.3,
    fontSize: 14, color: COLORS.textDark, fontFace: "Consolas"
  });
});
slide11.addText("Credential Provider:", {
  x: 0.8, y: 3, w: 8.4, h: 0.3,
  fontSize: 16, bold: true, color: COLORS.epamBlue, fontFace: "Arial"
});
const credProvExample = [
  "type: OAuth 2.0 Authorization Code",
  "scope: documents.readonly"
];
credProvExample.forEach((line, idx) => {
  slide11.addText("  • " + line, {
    x: 1.2, y: 3.4 + (idx * 0.35), w: 7.6, h: 0.3,
    fontSize: 14, color: COLORS.textDark, fontFace: "Consolas"
  });
});
slide11.addText("Gateway tool name: \"google-docs-target___getDocument\"", {
  x: 0.8, y: 4.3, w: 8.4, h: 0.3,
  fontSize: 13, italic: true, color: COLORS.accentGreen, fontFace: "Consolas"
});
addEPAMFooter(slide11, 11);

// SLIDE 12: AgentCore Memory
let slide12 = pres.addSlide();
slide12.background = { color: COLORS.bgLight };
slide12.addText("AgentCore Memory", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: COLORS.epamDark, fontFace: "Arial"
});
const memoryPoints = [
  "• Persistent key-value store для conversation history",
  "• User-scoped queries (actor_id)",
  "• Session continuity across Runtime invocations",
  "",
  "Локальна розробка:",
  "  → InMemorySaver + thread_id",
  "",
  "Production:",
  "  → AgentCore Memory + session_id"
];
memoryPoints.forEach((point, idx) => {
  const isBold = point.includes("Локальна") || point.includes("Production");
  slide12.addText(point, {
    x: 1, y: 1.5 + (idx * 0.38), w: 8, h: 0.35,
    fontSize: isBold ? 16 : 15,
    bold: isBold,
    color: isBold ? COLORS.epamBlue : COLORS.textDark,
    fontFace: "Arial"
  });
});
addEPAMFooter(slide12, 12);

// ====================
// SLIDE 13: Інші сервіси
// ====================
let slide13 = pres.addSlide();
slide13.background = { color: COLORS.bgLight };

slide13.addText("Інші сервіси AgentCore", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Three service cards
const services = [
  {
    title: "Code Interpreter",
    icon: "💻",
    points: [
      "Sandboxed Python/JS execution",
      "Resource limits (CPU, memory, time)",
      "Audit trail for code runs"
    ]
  },
  {
    title: "Browser",
    icon: "🌐",
    points: [
      "Headless browser automation",
      "Web scraping capability",
      "Screenshot capture"
    ]
  },
  {
    title: "Observability",
    icon: "📊",
    points: [
      "CloudWatch logs integration",
      "X-Ray distributed tracing",
      "Custom metrics and alerts"
    ]
  }
];

services.forEach((svc, idx) => {
  const x = 0.5 + (idx * 3.1);
  const y = 1.3;

  // Card
  slide13.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 2.9, h: 3.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide13.addText(svc.icon, {
    x: x + 0.3, y: y + 0.2, w: 2.3, h: 0.5,
    fontSize: 40,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide13.addText(svc.title, {
    x: x + 0.2, y: y + 0.8, w: 2.5, h: 0.4,
    fontSize: 18,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Points
  svc.points.forEach((point, pidx) => {
    slide13.addText("• " + point, {
      x: x + 0.2, y: y + 1.4 + (pidx * 0.5), w: 2.5, h: 0.4,
      fontSize: 12,
      color: COLORS.textDark,
      fontFace: "Arial"
    });
  });
});

addEPAMFooter(slide13, 13);

// ====================
// SLIDE 14: Multi-tenant Architecture
// ====================
let slide14 = pres.addSlide();
slide14.background = { color: COLORS.bgLight };

slide14.addText("Multi-tenant Architecture", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Simplified architecture diagram
const mtBoxes = [
  { x: 0.8, y: 1.3, w: 1.5, h: 0.6, text: "Frontend", color: COLORS.epamBlue },
  { x: 2.8, y: 1.3, w: 1.5, h: 0.6, text: "API", color: COLORS.epamBlue },
  { x: 4.8, y: 1.3, w: 1.5, h: 0.6, text: "Auth", color: COLORS.accentGreen },
  { x: 6.8, y: 1.3, w: 1.5, h: 0.6, text: "Profile", color: COLORS.accentGreen },
  { x: 8.8, y: 1.3, w: 1.0, h: 0.6, text: "Router", color: COLORS.epamDark }
];

mtBoxes.forEach(box => {
  slide14.addShape(pres.shapes.RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fill: { color: box.color },
    shadow: makeShadow()
  });
  slide14.addText(box.text, {
    x: box.x, y: box.y + 0.1, w: box.w, h: 0.4,
    fontSize: 11,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

// Shard Pool
slide14.addText("Shard Pool:", {
  x: 0.8, y: 2.3, w: 8.4, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const shards = ["Runtime Shard A", "Runtime Shard B", "Runtime Shard N"];
shards.forEach((shard, idx) => {
  slide14.addShape(pres.shapes.RECTANGLE, {
    x: 1.5 + (idx * 2.5), y: 2.8, w: 2.2, h: 0.7,
    fill: { color: COLORS.accentGreen },
    shadow: makeShadow()
  });
  slide14.addText(shard, {
    x: 1.5 + (idx * 2.5), y: 2.95, w: 2.2, h: 0.4,
    fontSize: 13,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

// Bottom services
const bottomSvcs = [
  { x: 1.5, text: "Gateway/Tools" },
  { x: 4.5, text: "Memory" },
  { x: 7.0, text: "Observability" }
];
bottomSvcs.forEach(svc => {
  slide14.addShape(pres.shapes.RECTANGLE, {
    x: svc.x, y: 3.8, w: 2.0, h: 0.6,
    fill: { color: COLORS.epamBlue },
    shadow: makeShadow()
  });
  slide14.addText(svc.text, {
    x: svc.x, y: 3.95, w: 2.0, h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

addEPAMFooter(slide14, 14);

// ====================
// SLIDE 15: Session Affinity та Shard Routing
// ====================
let slide15 = pres.addSlide();
slide15.background = { color: COLORS.bgLight };

slide15.addText("Session Affinity та Shard Routing", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Problem box
slide15.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 4.3, h: 0.8,
  fill: { color: COLORS.epamWhite },
  shadow: makeShadow()
});
slide15.addText("⚠️ Проблема", {
  x: 0.7, y: 1.4, w: 3.9, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});
slide15.addText("60k+ одночасних користувачів", {
  x: 0.7, y: 1.75, w: 3.9, h: 0.25,
  fontSize: 14,
  color: COLORS.textDark,
  fontFace: "Arial"
});

// Solution box
slide15.addShape(pres.shapes.RECTANGLE, {
  x: 5.2, y: 1.3, w: 4.3, h: 0.8,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});
slide15.addText("✅ Рішення", {
  x: 5.4, y: 1.4, w: 3.9, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});
slide15.addText("Consistent hashing для routing", {
  x: 5.4, y: 1.75, w: 3.9, h: 0.25,
  fontSize: 14,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

// Benefits
slide15.addText("Переваги:", {
  x: 0.5, y: 2.5, w: 9, h: 0.4,
  fontSize: 20,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const shardBenefits = [
  { icon: "🎯", text: "Session affinity (той самий user → той самий shard)" },
  { icon: "🔥", text: "Hot/Warm shards для різних tenant tiers" },
  { icon: "⚖️", text: "Graceful scale up/down (draining state)" }
];

shardBenefits.forEach((benefit, idx) => {
  slide15.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: 3.0 + (idx * 0.65), w: 8, h: 0.55,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });
  slide15.addText(benefit.icon + "  " + benefit.text, {
    x: 1.3, y: 3.15 + (idx * 0.65), w: 7.4, h: 0.25,
    fontSize: 14,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide15, 15);

// ====================
// SLIDE 16: Scale Up/Down Pattern
// ====================
let slide16 = pres.addSlide();
slide16.background = { color: COLORS.bgLight };

slide16.addText("Scale Up/Down Pattern", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Two columns
const scaleColumns = [
  {
    title: "Scale Up 📈",
    color: COLORS.accentGreen,
    points: [
      "Add shards з state=active",
      "Нові сесії автоматично rehash",
      "Існуючі сесії залишаються на старих shards",
      "Zero downtime"
    ]
  },
  {
    title: "Scale Down 📉",
    color: COLORS.epamDark,
    points: [
      "Mark shards як draining",
      "Старі сесії drain природно",
      "Нові сесії не направляються",
      "Graceful shutdown після drain"
    ]
  }
];

scaleColumns.forEach((col, idx) => {
  const x = 0.5 + (idx * 4.8);

  // Card
  slide16.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.3, w: 4.3, h: 3.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Title bar
  slide16.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.3, w: 4.3, h: 0.6,
    fill: { color: col.color }
  });

  slide16.addText(col.title, {
    x: x + 0.2, y: 1.4, w: 3.9, h: 0.4,
    fontSize: 20,
    bold: true,
    color: COLORS.epamWhite,
    fontFace: "Arial"
  });

  // Points
  col.points.forEach((point, pidx) => {
    slide16.addText("• " + point, {
      x: x + 0.3, y: 2.1 + (pidx * 0.55), w: 3.7, h: 0.5,
      fontSize: 13,
      color: COLORS.textDark,
      fontFace: "Arial"
    });
  });
});

addEPAMFooter(slide16, 16);

// ====================
// SLIDE 17: Agent Profile vs Runtime Artifact
// ====================
let slide17 = pres.addSlide();
slide17.background = { color: COLORS.bgLight };

slide17.addText("Agent Profile vs Runtime Artifact", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Table data
const profileTableData = [
  [
    { text: "Створює новий Runtime", options: { bold: true, fill: { color: COLORS.accentGreen }, color: COLORS.epamWhite, fontSize: 14 } },
    { text: "НЕ створює новий Runtime", options: { bold: true, fill: { color: COLORS.epamBlue }, color: COLORS.epamWhite, fontSize: 14 } }
  ],
  ["Код агента змінений", "Prompt template оновлено"],
  ["Dependencies оновлено", "Skill toggles змінено"],
  ["Network policy змінено", "Model params змінено"],
  ["", "User personalization"]
];

slide17.addTable(profileTableData, {
  x: 0.5, y: 1.3, w: 9, h: 2.8,
  border: { pt: 1, color: COLORS.epamDark },
  fontSize: 13,
  color: COLORS.textDark,
  fontFace: "Arial",
  colW: [4.5, 4.5],
  valign: "middle"
});

// Key benefit
slide17.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 4.3, w: 9, h: 0.7,
  fill: { color: COLORS.accentGreen, transparency: 20 }
});

slide17.addText("💡 Перевага: Персоналізація без redeployment", {
  x: 0.8, y: 4.45, w: 8.4, h: 0.4,
  fontSize: 16,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial",
  valign: "middle"
});

addEPAMFooter(slide17, 17);

console.log("✅ Created slides 13-17");

// ====================
// SLIDE 18: Local vs Cloud - Service Mapping
// ====================
let slide18 = pres.addSlide();
slide18.background = { color: COLORS.bgLight };

slide18.addText("Local vs Cloud - Service Mapping", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const mappingTableData = [
  [
    { text: "Need", options: { bold: true, fill: { color: COLORS.epamDark }, color: COLORS.epamWhite, fontSize: 13 } },
    { text: "Local (LangGraph)", options: { bold: true, fill: { color: COLORS.epamBlue }, color: COLORS.epamWhite, fontSize: 13 } },
    { text: "AgentCore Service", options: { bold: true, fill: { color: COLORS.accentGreen }, color: COLORS.epamWhite, fontSize: 13 } }
  ],
  ["Runtime hosting", "Local Python script", "AgentCore Runtime"],
  ["Persistence", "InMemorySaver + thread_id", "AgentCore Memory + session_id"],
  ["Authentication", ".env credentials", "AgentCore Identity"],
  ["External API/tools", "Mock functions", "AgentCore Gateway"],
  ["Code execution", "Local Python", "Code Interpreter"]
];

slide18.addTable(mappingTableData, {
  x: 0.5, y: 1.2, w: 9, h: 3.5,
  border: { pt: 1, color: COLORS.epamDark },
  fontSize: 12,
  color: COLORS.textDark,
  fontFace: "Arial",
  colW: [2.5, 3.25, 3.25],
  valign: "middle"
});

addEPAMFooter(slide18, 18);

// ====================
// SLIDE 19: Deployment Workflow - 6 Steps
// ====================
let slide19 = pres.addSlide();
slide19.background = { color: COLORS.bgLight };

slide19.addText("Deployment Workflow - 6 Steps", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const deploySteps = [
  { num: "1", title: "Local Development", desc: "Build LangGraph agent з mock tools" },
  { num: "2", title: "Wrap with AgentCore", desc: "Add BedrockAgentCoreApp wrapper" },
  { num: "3", title: "Configure Infrastructure", desc: "Setup Cognito, Gateway, OAuth providers" },
  { num: "4", title: "Deploy Runtime", desc: "agentcore configure + deploy" },
  { num: "5", title: "Invoke from Client", desc: "HTTP + JWT bearer token" },
  { num: "6", title: "Observe", desc: "CloudWatch logs, X-Ray traces" }
];

deploySteps.forEach((step, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const x = 0.5 + (col * 4.8);
  const y = 1.3 + (row * 1.2);

  // Card
  slide19.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.0,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Number badge
  slide19.addShape(pres.shapes.OVAL, {
    x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5,
    fill: { color: COLORS.accentGreen }
  });

  slide19.addText(step.num, {
    x: x + 0.15, y: y + 0.25, w: 0.5, h: 0.3,
    fontSize: 18,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });

  // Title
  slide19.addText(step.title, {
    x: x + 0.8, y: y + 0.2, w: 3.5, h: 0.3,
    fontSize: 14,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  // Description
  slide19.addText(step.desc, {
    x: x + 0.8, y: y + 0.55, w: 3.5, h: 0.3,
    fontSize: 11,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide19, 19);

// ====================
// SLIDE 20: Canonical Runtime Contract
// ====================
let slide20 = pres.addSlide();
slide20.background = { color: COLORS.bgLight };

slide20.addText("Canonical Runtime Contract", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide20.addText("4 обов'язкові елементи:", {
  x: 0.5, y: 1.1, w: 9, h: 0.3,
  fontSize: 18,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

// Code box
slide20.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.5, w: 9, h: 3.2,
  fill: { color: COLORS.epamDark },
  shadow: makeShadow()
});

const contractCode = [
  "# 1. Import",
  "from bedrock_agentcore.runtime import BedrockAgentCoreApp",
  "",
  "# 2. Initialize",
  "app = BedrockAgentCoreApp()",
  "",
  "# 3. Decorate entrypoint",
  "@app.entrypoint",
  "def invoke(payload: dict, context=None):",
  "    thread_id = context.session_id or 'default'",
  "    return graph.invoke(payload,",
  "                       {'configurable': {'thread_id': thread_id}})",
  "",
  "# 4. Run",
  "if __name__ == '__main__':",
  "    app.run()"
];

slide20.addText(contractCode.map((line, idx) => ({
  text: line,
  options: { breakLine: idx < contractCode.length - 1 }
})), {
  x: 0.7, y: 1.7, w: 8.6, h: 2.8,
  fontSize: 11,
  fontFace: "Consolas",
  color: COLORS.textLight
});

addEPAMFooter(slide20, 20);

// ====================
// SLIDE 21: Health Gates Before Deploy
// ====================
let slide21 = pres.addSlide();
slide21.background = { color: COLORS.bgLight };

slide21.addText("Health Gates Before Deploy", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const healthGates = [
  "✅ Gateway MCP version = 2025-11-25 (required for 3LO)",
  "✅ Runtime session ID >= 33 chars",
  "✅ Google Docs tool present in Gateway",
  "✅ OAuth callback URL registered",
  "✅ Local agent runs without errors"
];

healthGates.forEach((gate, idx) => {
  slide21.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: 1.5 + (idx * 0.65), w: 8, h: 0.55,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  slide21.addText(gate, {
    x: 1.3, y: 1.65 + (idx * 0.65), w: 7.4, h: 0.25,
    fontSize: 14,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide21, 21);

// ====================
// SLIDE 22: Common Pitfalls
// ====================
let slide22 = pres.addSlide();
slide22.background = { color: COLORS.bgLight };

slide22.addText("Common Pitfalls", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const pitfalls = [
  {
    icon: "⚠️",
    title: "Stale AWS credentials",
    desc: "Override profile → InvalidClientTokenId"
  },
  {
    icon: "⚠️",
    title: "Gateway version mismatch",
    desc: "3LO fails with ValidationException"
  },
  {
    icon: "⚠️",
    title: "OAuth callback not registered",
    desc: "Redirect URI error"
  },
  {
    icon: "⚠️",
    title: "Concurrent runtime updates",
    desc: "ConflictException"
  }
];

pitfalls.forEach((pitfall, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const x = 0.5 + (col * 4.8);
  const y = 1.4 + (row * 1.4);

  // Card
  slide22.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon and title
  slide22.addText(pitfall.icon + "  " + pitfall.title, {
    x: x + 0.2, y: y + 0.2, w: 4.1, h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.epamDark,
    fontFace: "Arial"
  });

  // Description
  slide22.addText(pitfall.desc, {
    x: x + 0.2, y: y + 0.65, w: 4.1, h: 0.4,
    fontSize: 12,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide22, 22);

// ====================
// SLIDE 23: Workshop Use Case - Google Docs RAG
// ====================
let slide23 = pres.addSlide();
slide23.background = { color: COLORS.bgLight };

slide23.addText("Workshop Use Case - Google Docs RAG", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// User story box
slide23.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.2, w: 9, h: 1.2,
  fill: { color: COLORS.accentGreen, transparency: 20 },
  shadow: makeShadow()
});

slide23.addText("👤 User Story", {
  x: 0.8, y: 1.35, w: 8.4, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide23.addText("\"Як business analyst, я хочу задавати питання про policies у Google Docs. Агент має витягувати документ, шукати релевантні пасажі, та повертати відповіді з джерелами.\"", {
  x: 0.8, y: 1.7, w: 8.4, h: 0.6,
  fontSize: 13,
  italic: true,
  color: COLORS.textDark,
  fontFace: "Arial"
});

// Components
slide23.addText("Компоненти demo:", {
  x: 0.5, y: 2.6, w: 9, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const demoComponents = [
  "✓ LangGraph ReAct agent",
  "✓ Google Docs API через Gateway OpenAPI target",
  "✓ OAuth 3LO для user-scoped access",
  "✓ AgentCore Runtime deployment"
];

demoComponents.forEach((comp, idx) => {
  slide23.addText(comp, {
    x: 1.5, y: 3.1 + (idx * 0.4), w: 7, h: 0.35,
    fontSize: 15,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide23, 23);

// ====================
// SLIDE 24: Notebook Flow - 6 Steps
// ====================
let slide24 = pres.addSlide();
slide24.background = { color: COLORS.bgLight };

slide24.addText("Notebook Flow - 6 Steps", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const notebookSteps = [
  "Step 1: Cognito User Pool (inbound auth)",
  "Step 2: OAuth provider + Gateway + Google Docs target",
  "Step 3: Local ReAct agent з mock tools",
  "Step 4: Deploy runtime via agentcore CLI",
  "Step 5: Runtime invoke + OAuth consent flow",
  "Step 6: Cleanup commands"
];

notebookSteps.forEach((step, idx) => {
  // Badge
  slide24.addShape(pres.shapes.OVAL, {
    x: 1, y: 1.4 + (idx * 0.6), w: 0.5, h: 0.5,
    fill: { color: COLORS.epamBlue }
  });

  slide24.addText(String(idx + 1), {
    x: 1, y: 1.5 + (idx * 0.6), w: 0.5, h: 0.3,
    fontSize: 16,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });

  // Text
  slide24.addText(step, {
    x: 1.7, y: 1.5 + (idx * 0.6), w: 7.8, h: 0.3,
    fontSize: 14,
    color: COLORS.textDark,
    fontFace: "Arial",
    valign: "middle"
  });
});

addEPAMFooter(slide24, 24);

// ====================
// SLIDE 25: Expected Outcomes
// ====================
let slide25 = pres.addSlide();
slide25.background = { color: COLORS.bgLight };

slide25.addText("Expected Outcomes", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide25.addText("Що побачить аудиторія:", {
  x: 0.5, y: 1.1, w: 9, h: 0.4,
  fontSize: 18,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const outcomes = [
  "Local agent runs with mock data",
  "Same code deploys to Runtime",
  "JWT inbound authentication works",
  "OAuth 3LO consent flow completes",
  "Agent retrieves real Google Doc",
  "CloudWatch shows full request trace",
  "Cleanup removes all AWS resources"
];

outcomes.forEach((outcome, idx) => {
  slide25.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: 1.6 + (idx * 0.5), w: 8, h: 0.4,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  slide25.addText("✅ " + outcome, {
    x: 1.3, y: 1.7 + (idx * 0.5), w: 7.4, h: 0.2,
    fontSize: 13,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide25, 25);

// ====================
// SLIDE 26: Ключові переваги (Summary)
// ====================
let slide26 = pres.addSlide();
slide26.background = { color: COLORS.bgLight };

slide26.addText("Ключові переваги AgentCore", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const advantages = [
  {
    title: "Для розробників",
    icon: "👨‍💻",
    points: [
      "Framework-agnostic",
      "Clear separation of concerns",
      "Full local testability"
    ]
  },
  {
    title: "Для операцій",
    icon: "⚙️",
    points: [
      "Managed infrastructure",
      "Centralized security",
      "Multi-tenancy ready"
    ]
  },
  {
    title: "Для бізнесу",
    icon: "💼",
    points: [
      "Production-ready day one",
      "Cost control (pay per invoke)",
      "Compliance built-in"
    ]
  }
];

advantages.forEach((adv, idx) => {
  const x = 0.5 + (idx * 3.1);
  const y = 1.3;

  // Card
  slide26.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 2.9, h: 3.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide26.addText(adv.icon, {
    x: x + 0.3, y: y + 0.2, w: 2.3, h: 0.5,
    fontSize: 40,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide26.addText(adv.title, {
    x: x + 0.2, y: y + 0.8, w: 2.5, h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Points
  adv.points.forEach((point, pidx) => {
    slide26.addText("• " + point, {
      x: x + 0.2, y: y + 1.4 + (pidx * 0.55), w: 2.5, h: 0.5,
      fontSize: 12,
      color: COLORS.textDark,
      fontFace: "Arial"
    });
  });
});

addEPAMFooter(slide26, 26);

// ====================
// SLIDE 27: Q&A та Resources
// ====================
let slide27 = pres.addSlide();
slide27.background = { color: COLORS.epamDark };

slide27.addText("Питання?", {
  x: 0.5, y: 1.5, w: 9, h: 0.8,
  fontSize: 48,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  fontFace: "Arial"
});

slide27.addText("Resources:", {
  x: 0.5, y: 2.8, w: 9, h: 0.4,
  fontSize: 20,
  bold: true,
  color: COLORS.epamBlue,
  align: "center",
  fontFace: "Arial"
});

const resources = [
  "📘 Workshop GitHub Repository",
  "📄 AWS AgentCore Documentation",
  "🎓 Workshop Notebook: workshop_google_docs_rag_e2e.ipynb"
];

resources.forEach((res, idx) => {
  slide27.addText(res, {
    x: 1, y: 3.4 + (idx * 0.4), w: 8, h: 0.35,
    fontSize: 16,
    color: COLORS.textLight,
    align: "center",
    fontFace: "Arial"
  });
});

// EPAM logo at bottom
slide27.addText("EPAM", {
  x: 0.5, y: 5, w: 1.5, h: 0.4,
  fontSize: 24,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

console.log("✅ Created slides 18-27");

// Save final presentation
pres.writeFile({ fileName: "AWS_AgentCore_Workshop.pptx" })
  .then(() => {
    console.log("✅ Full presentation created: AWS_AgentCore_Workshop.pptx (27 slides)");
    console.log("📊 Ready for review!");
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
