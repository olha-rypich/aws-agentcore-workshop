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

// Create presentation
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'EPAM Workshop';
pres.title = 'Amazon Bedrock AgentCore Overview';

// Helper function for shadow
const makeShadow = () => ({
  type: "outer",
  blur: 8,
  offset: 3,
  angle: 135,
  color: "000000",
  opacity: 0.15
});

// Helper function for EPAM footer
function addEPAMFooter(slide, slideNumber) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.4, w: 10, h: 0.225,
    fill: { color: COLORS.epamBlue }
  });

  slide.addText("EPAM", {
    x: 0.3, y: 5.42, w: 1.5, h: 0.18,
    fontSize: 14,
    bold: true,
    color: COLORS.epamWhite,
    fontFace: "Arial",
    margin: 0
  });

  if (slideNumber) {
    slide.addText(String(slideNumber), {
      x: 9.2, y: 5.42, w: 0.5, h: 0.18,
      fontSize: 11,
      color: COLORS.epamWhite,
      align: "right",
      fontFace: "Arial",
      margin: 0
    });
  }
}

// ====================
// SLIDE 1: Title Slide
// ====================
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.epamDark };

slide1.addText("Amazon Bedrock AgentCore", {
  x: 0.5, y: 1.8, w: 9, h: 0.8,
  fontSize: 54,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  fontFace: "Arial"
});

slide1.addText("Модульна платформа для AI агентів", {
  x: 0.5, y: 2.8, w: 9, h: 0.5,
  fontSize: 28,
  color: COLORS.epamBlue,
  align: "center",
  fontFace: "Arial"
});

// EPAM logo
slide1.addText("EPAM", {
  x: 0.5, y: 5, w: 1.5, h: 0.4,
  fontSize: 24,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

console.log("✅ Created slide 1: Title");

// ====================
// SLIDE 2: Що таке AgentCore?
// ====================
let slide2 = pres.addSlide();
slide2.background = { color: COLORS.bgLight };

slide2.addText("Що таке AgentCore?", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Definition box
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 4.2, h: 1.4,
  fill: { color: COLORS.epamWhite },
  shadow: makeShadow()
});

slide2.addText("Модульна agentic платформа для:", {
  x: 0.7, y: 1.3, w: 3.8, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const defPoints = [
  "• Побудови AI агентів",
  "• Розгортання в production",
  "• Управління та governance"
];

defPoints.forEach((point, idx) => {
  slide2.addText(point, {
    x: 0.7, y: 1.7 + (idx * 0.35), w: 3.8, h: 0.3,
    fontSize: 13,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

// Key characteristics
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 5.0, y: 1.1, w: 4.5, h: 1.4,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});

slide2.addText("Ключові характеристики:", {
  x: 5.2, y: 1.3, w: 4.1, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

const keyChars = [
  "✓ Enterprise-grade безпека",
  "✓ Framework-agnostic",
  "✓ Model-agnostic"
];

keyChars.forEach((char, idx) => {
  slide2.addText(char, {
    x: 5.2, y: 1.7 + (idx * 0.35), w: 4.1, h: 0.3,
    fontSize: 13,
    color: COLORS.epamWhite,
    fontFace: "Arial"
  });
});

// Main diagram - amazon_bedrock_agentcore_overview.png
slide2.addImage({
  path: "misc/amazon_bedrock_agentcore_overview.png",
  x: 0.5,
  y: 2.7,
  w: 9,
  h: 2.5
});

addEPAMFooter(slide2, 2);
console.log("✅ Created slide 2: What is AgentCore");

// ====================
// SLIDE 3: 9 модульних сервісів
// ====================
let slide3 = pres.addSlide();
slide3.background = { color: COLORS.bgLight };

slide3.addText("9 модульних сервісів", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const services = [
  { icon: "🏃", name: "Runtime", desc: "Serverless середовище" },
  { icon: "🧠", name: "Memory", desc: "Пам'ять агента" },
  { icon: "🌐", name: "Gateway", desc: "APIs → MCP tools" },
  { icon: "🔐", name: "Identity", desc: "Авторизація" },
  { icon: "💻", name: "Code Interpreter", desc: "Виконання коду" },
  { icon: "🌍", name: "Browser", desc: "Веб-взаємодія" },
  { icon: "📊", name: "Observability", desc: "Моніторинг" },
  { icon: "📈", name: "Evaluations", desc: "Оцінка якості" },
  { icon: "📋", name: "Policy", desc: "Контроль доступу" }
];

services.forEach((svc, idx) => {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  const x = 0.5 + (col * 3.15);
  const y = 1.3 + (row * 1.2);

  // Card
  slide3.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 3.0, h: 1.0,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide3.addText(svc.icon, {
    x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.5,
    fontSize: 32,
    fontFace: "Arial"
  });

  // Name
  slide3.addText(svc.name, {
    x: x + 0.8, y: y + 0.2, w: 2.0, h: 0.3,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  // Description
  slide3.addText(svc.desc, {
    x: x + 0.8, y: y + 0.55, w: 2.0, h: 0.3,
    fontSize: 12,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide3, 3);
console.log("✅ Created slide 3: 9 Modular Services");

// ====================
// SLIDE 4: Use Cases
// ====================
let slide4 = pres.addSlide();
slide4.background = { color: COLORS.bgLight };

slide4.addText("Use Cases", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const useCases = [
  {
    title: "Автономні агенти",
    icon: "🤖",
    examples: [
      "Customer support",
      "Workflow automation",
      "Research assistants"
    ]
  },
  {
    title: "MCP сервери",
    icon: "🔧",
    examples: [
      "Перетворення APIs в tools",
      "Unified tool interface",
      "Protocol standardization"
    ]
  },
  {
    title: "Agent платформи",
    icon: "🏢",
    examples: [
      "Централізований governance",
      "Multi-tenant deployment",
      "Enterprise security"
    ]
  }
];

useCases.forEach((useCase, idx) => {
  const x = 0.5 + (idx * 3.15);
  const y = 1.3;

  // Card
  slide4.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 3.0, h: 3.5,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide4.addText(useCase.icon, {
    x: x + 0.3, y: y + 0.2, w: 2.4, h: 0.5,
    fontSize: 40,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide4.addText(useCase.title, {
    x: x + 0.2, y: y + 0.8, w: 2.6, h: 0.4,
    fontSize: 18,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Examples
  useCase.examples.forEach((example, eidx) => {
    slide4.addText("• " + example, {
      x: x + 0.3, y: y + 1.4 + (eidx * 0.5), w: 2.4, h: 0.4,
      fontSize: 12,
      color: COLORS.textDark,
      fontFace: "Arial"
    });
  });
});

addEPAMFooter(slide4, 4);
console.log("✅ Created slide 4: Use Cases");

// ====================
// SLIDE 5: Runtime Overview
// ====================
let slide5 = pres.addSlide();
slide5.background = { color: COLORS.bgLight };

slide5.addText("AgentCore Runtime", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Overview box
slide5.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 9, h: 0.9,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});

slide5.addText("Secure, serverless середовище для AI агентів", {
  x: 0.8, y: 1.3, w: 8.4, h: 0.5,
  fontSize: 20,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  valign: "middle",
  fontFace: "Arial"
});

slide5.addText("Локальний код → Production deployment за кілька рядків", {
  x: 0.8, y: 1.65, w: 8.4, h: 0.25,
  fontSize: 14,
  italic: true,
  color: COLORS.epamWhite,
  align: "center",
  fontFace: "Arial"
});

// Runtime diagram
slide5.addImage({
  path: "misc/runtime.png",
  x: 0.5,
  y: 2.2,
  w: 9,
  h: 2.9
});

addEPAMFooter(slide5, 5);
console.log("✅ Created slide 5: Runtime Overview");

// ====================
// SLIDE 6: Runtime Features (1/2)
// ====================
let slide6 = pres.addSlide();
slide6.background = { color: COLORS.bgLight };

slide6.addText("Runtime - Ключові можливості (1/2)", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const runtimeFeatures1 = [
  { icon: "🔄", title: "Framework Agnostic", desc: "LangGraph, CrewAI, Strands, Custom" },
  { icon: "🤖", title: "Model Flexibility", desc: "Claude, Gemini, GPT, Bedrock models" },
  { icon: "📡", title: "Protocol Support", desc: "MCP та Agent-to-Agent (A2A)" },
  { icon: "🔒", title: "Session Isolation", desc: "Кожна сесія в окремій microVM" },
  { icon: "⏱️", title: "Extended Execution", desc: "До 8 годин для async workloads" },
  { icon: "💰", title: "Consumption Pricing", desc: "Платите тільки за використання" }
];

runtimeFeatures1.forEach((feature, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const x = 0.5 + (col * 4.8);
  const y = 1.3 + (row * 1.2);

  // Card
  slide6.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.0,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide6.addText(feature.icon, {
    x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.6,
    fontSize: 32,
    fontFace: "Arial"
  });

  // Title
  slide6.addText(feature.title, {
    x: x + 0.9, y: y + 0.2, w: 3.4, h: 0.3,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  // Description
  slide6.addText(feature.desc, {
    x: x + 0.9, y: y + 0.55, w: 3.4, h: 0.3,
    fontSize: 12,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide6, 6);
console.log("✅ Created slide 6: Runtime Features 1/2");

// ====================
// SLIDE 7: Runtime Features (2/2)
// ====================
let slide7 = pres.addSlide();
slide7.background = { color: COLORS.bgLight };

slide7.addText("Runtime - Ключові можливості (2/2)", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const runtimeFeatures2 = [
  { icon: "🔐", title: "Built-in Auth", desc: "Інтеграція з Cognito, Okta, Entra ID" },
  { icon: "👁️", title: "Agent Observability", desc: "Трейсинг reasoning та tool calls" },
  { icon: "📦", title: "100MB Payloads", desc: "Підтримка multimodal content" },
  { icon: "⚡", title: "Bidirectional Streaming", desc: "WebSocket для real-time взаємодії" }
];

runtimeFeatures2.forEach((feature, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const x = 0.5 + (col * 4.8);
  const y = 1.5 + (row * 1.4);

  // Card
  slide7.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide7.addText(feature.icon, {
    x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.7,
    fontSize: 36,
    fontFace: "Arial"
  });

  // Title
  slide7.addText(feature.title, {
    x: x + 0.9, y: y + 0.25, w: 3.4, h: 0.35,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  // Description
  slide7.addText(feature.desc, {
    x: x + 0.9, y: y + 0.65, w: 3.4, h: 0.4,
    fontSize: 12,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide7, 7);
console.log("✅ Created slide 7: Runtime Features 2/2");

// ====================
// SLIDE 8: Runtime Simple Integration (optional code slide)
// ====================
let slide8 = pres.addSlide();
slide8.background = { color: COLORS.bgLight };

slide8.addText("Runtime - Simple Integration", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide8.addText("3 рядки коду для production deployment:", {
  x: 0.5, y: 1.1, w: 9, h: 0.3,
  fontSize: 18,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

// Code box
slide8.addShape(pres.shapes.RECTANGLE, {
  x: 1.5, y: 1.6, w: 7, h: 2.8,
  fill: { color: COLORS.epamDark },
  shadow: makeShadow()
});

const simpleCode = [
  "from bedrock_agentcore import BedrockAgentCoreApp",
  "app = BedrockAgentCoreApp()",
  "",
  "@app.entrypoint",
  "def invoke(payload, context):",
  "    return your_agent_logic(payload)",
  "",
  "app.run()"
];

slide8.addText(simpleCode.map((line, idx) => ({
  text: line,
  options: { breakLine: idx < simpleCode.length - 1 }
})), {
  x: 1.7, y: 1.8, w: 6.6, h: 2.4,
  fontSize: 14,
  fontFace: "Consolas",
  color: COLORS.textLight
});

addEPAMFooter(slide8, 8);
console.log("✅ Created slide 8: Runtime Simple Integration");

// ====================
// IDENTITY SECTION (Slides 9-13)
// ====================

// SLIDE 9: Identity Overview
let slide9 = pres.addSlide();
slide9.background = { color: COLORS.bgLight };

slide9.addText("AgentCore Identity", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Problem/Solution boxes
slide9.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 4.2, h: 0.9,
  fill: { color: COLORS.epamWhite },
  shadow: makeShadow()
});

slide9.addText("Що вирішує:", {
  x: 0.7, y: 1.25, w: 3.8, h: 0.25,
  fontSize: 14,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide9.addText("Безпечний доступ агентів до user-specific даних", {
  x: 0.7, y: 1.55, w: 3.8, h: 0.35,
  fontSize: 13,
  color: COLORS.textDark,
  fontFace: "Arial"
});

slide9.addShape(pres.shapes.RECTANGLE, {
  x: 5.0, y: 1.1, w: 4.5, h: 0.9,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});

slide9.addText("Ключовий принцип:", {
  x: 5.2, y: 1.25, w: 4.1, h: 0.25,
  fontSize: 14,
  bold: true,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

slide9.addText("Delegation, not Impersonation", {
  x: 5.2, y: 1.55, w: 4.1, h: 0.35,
  fontSize: 13,
  italic: true,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

// Identity diagram
slide9.addImage({
  path: "misc/inbound_outbound_auth.png",
  x: 0.5,
  y: 2.2,
  w: 9,
  h: 2.9
});

addEPAMFooter(slide9, 9);
console.log("✅ Created slide 9: Identity Overview");

// SLIDE 10: Inbound Authentication
let slide10 = pres.addSlide();
slide10.background = { color: COLORS.bgLight };

slide10.addText("Inbound Authentication", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Questions box
slide10.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 9, h: 0.7,
  fill: { color: COLORS.accentGreen, transparency: 20 },
  shadow: makeShadow()
});

const inboundQuestions = [
  '"Who is this user?"',
  '"Is user allowed to call this agent?"'
];

inboundQuestions.forEach((q, idx) => {
  slide10.addText(q, {
    x: 1 + (idx * 4.5), y: 1.3, w: 4, h: 0.3,
    fontSize: 16,
    bold: true,
    italic: true,
    color: COLORS.epamDark,
    align: "center",
    fontFace: "Arial"
  });
});

// Inbound flow diagram
slide10.addImage({
  path: "misc/example_inbound_authorization_flow.png",
  x: 0.5,
  y: 2.0,
  w: 9,
  h: 3.0
});

addEPAMFooter(slide10, 10);
console.log("✅ Created slide 10: Inbound Authentication");

// SLIDE 11: Outbound Authentication
let slide11 = pres.addSlide();
slide11.background = { color: COLORS.bgLight };

slide11.addText("Outbound Authentication", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Question box
slide11.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 9, h: 0.6,
  fill: { color: COLORS.epamBlue, transparency: 20 },
  shadow: makeShadow()
});

slide11.addText('"Is agent allowed to access this resource on behalf of user?"', {
  x: 0.8, y: 1.25, w: 8.4, h: 0.3,
  fontSize: 16,
  bold: true,
  italic: true,
  color: COLORS.epamDark,
  align: "center",
  fontFace: "Arial"
});

// Types
const outboundTypes = [
  { title: "AWS Resources", desc: "IAM execution roles" },
  { title: "External Services", desc: "OAuth 2-legged / 3-legged" }
];

outboundTypes.forEach((type, idx) => {
  const x = 0.5 + (idx * 4.8);

  slide11.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 2.0, w: 4.5, h: 0.9,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  slide11.addText(type.title, {
    x: x + 0.3, y: 2.2, w: 3.9, h: 0.3,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  slide11.addText(type.desc, {
    x: x + 0.3, y: 2.55, w: 3.9, h: 0.25,
    fontSize: 13,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

// Use case
slide11.addShape(pres.shapes.RECTANGLE, {
  x: 1.5, y: 3.2, w: 7, h: 0.6,
  fill: { color: COLORS.accentGreen, transparency: 30 }
});

slide11.addText("💡 Use case: Агент читає Google Docs користувача", {
  x: 1.8, y: 3.35, w: 6.4, h: 0.3,
  fontSize: 14,
  italic: true,
  color: COLORS.epamDark,
  fontFace: "Arial",
  valign: "middle"
});

addEPAMFooter(slide11, 11);
console.log("✅ Created slide 11: Outbound Authentication");

// SLIDE 12: Inbound vs Outbound Comparison
let slide12 = pres.addSlide();
slide12.background = { color: COLORS.bgLight };

slide12.addText("Inbound vs Outbound", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Two comparison boxes
const comparisonData = [
  {
    title: "Inbound",
    color: COLORS.accentGreen,
    desc: "User → Agent",
    detail: "Validate user access to agent"
  },
  {
    title: "Outbound",
    color: COLORS.epamBlue,
    desc: "Agent → External API",
    detail: "Delegate user permissions to resources"
  }
];

comparisonData.forEach((comp, idx) => {
  const x = 0.5 + (idx * 4.8);

  slide12.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.3, w: 4.5, h: 3.5,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Title bar
  slide12.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.3, w: 4.5, h: 0.7,
    fill: { color: comp.color }
  });

  slide12.addText(comp.title, {
    x: x + 0.2, y: 1.45, w: 4.1, h: 0.4,
    fontSize: 22,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    fontFace: "Arial"
  });

  // Description
  slide12.addText(comp.desc, {
    x: x + 0.3, y: 2.2, w: 3.9, h: 0.4,
    fontSize: 16,
    bold: true,
    color: comp.color,
    align: "center",
    fontFace: "Arial"
  });

  // Detail
  slide12.addText(comp.detail, {
    x: x + 0.3, y: 2.7, w: 3.9, h: 0.8,
    fontSize: 14,
    color: COLORS.textDark,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

addEPAMFooter(slide12, 12);
console.log("✅ Created slide 12: Inbound vs Outbound");

// SLIDE 13: Identity Benefits
let slide13 = pres.addSlide();
slide13.background = { color: COLORS.bgLight };

slide13.addText("Identity Benefits", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const identityBenefits = [
  { icon: "🔒", title: "Zero Trust Security", desc: "Principle of least privilege" },
  { icon: "🌍", title: "Cross-Platform", desc: "AWS + інші clouds + on-premise" },
  { icon: "📋", title: "Audit Trails", desc: "Compliance та security monitoring" }
];

identityBenefits.forEach((benefit, idx) => {
  const x = 0.5 + (idx * 3.15);

  slide13.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.5, w: 3.0, h: 3.0,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide13.addText(benefit.icon, {
    x: x + 0.3, y: 1.7, w: 2.4, h: 0.7,
    fontSize: 48,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide13.addText(benefit.title, {
    x: x + 0.2, y: 2.6, w: 2.6, h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Description
  slide13.addText(benefit.desc, {
    x: x + 0.2, y: 3.1, w: 2.6, h: 0.8,
    fontSize: 13,
    color: COLORS.textDark,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

addEPAMFooter(slide13, 13);
console.log("✅ Created slide 13: Identity Benefits");

// ====================
// MEMORY SECTION (Slides 14-16)
// ====================

// SLIDE 14: Memory Overview
let slide14 = pres.addSlide();
slide14.background = { color: COLORS.bgLight };

slide14.addText("AgentCore Memory", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Problem/Solution boxes
const memoryBoxes = [
  { title: "Проблема", text: "AI агенти stateless за замовчуванням", color: COLORS.epamWhite },
  { title: "Рішення", text: "Fully managed сервіс для context", color: COLORS.accentGreen }
];

memoryBoxes.forEach((box, idx) => {
  const x = 0.5 + (idx * 4.8);
  const titleColor = idx === 0 ? COLORS.epamDark : COLORS.epamWhite;
  const textColor = idx === 0 ? COLORS.textDark : COLORS.epamWhite;

  slide14.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.1, w: 4.5, h: 0.9,
    fill: { color: box.color },
    shadow: makeShadow()
  });

  slide14.addText(box.title, {
    x: x + 0.3, y: 1.25, w: 3.9, h: 0.3,
    fontSize: 16,
    bold: true,
    color: titleColor,
    fontFace: "Arial"
  });

  slide14.addText(box.text, {
    x: x + 0.3, y: 1.6, w: 3.9, h: 0.3,
    fontSize: 14,
    color: textColor,
    fontFace: "Arial"
  });
});

// Memory types
slide14.addText("Два типи пам'яті:", {
  x: 0.5, y: 2.2, w: 9, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const memoryTypes = [
  { icon: "⚡", title: "Short-term", desc: "Turn-by-turn в межах сесії" },
  { icon: "💾", title: "Long-term", desc: "User preferences між сесіями" }
];

memoryTypes.forEach((type, idx) => {
  const x = 0.5 + (idx * 4.8);

  slide14.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 2.8, w: 4.5, h: 1.5,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  slide14.addText(type.icon, {
    x: x + 0.3, y: 2.95, w: 1, h: 0.6,
    fontSize: 40,
    fontFace: "Arial"
  });

  slide14.addText(type.title, {
    x: x + 1.5, y: 3.1, w: 2.7, h: 0.3,
    fontSize: 18,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  slide14.addText(type.desc, {
    x: x + 1.5, y: 3.5, w: 2.7, h: 0.5,
    fontSize: 13,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide14, 14);
console.log("✅ Created slide 14: Memory Overview");

// SLIDE 15: Without vs With Memory
let slide15 = pres.addSlide();
slide15.background = { color: COLORS.bgLight };

slide15.addText("Without vs With Memory", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Without Memory
slide15.addText("Without Memory:", {
  x: 0.5, y: 1.1, w: 4.5, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide15.addImage({
  path: "misc/without_memory.png",
  x: 0.5,
  y: 1.5,
  w: 4.0,
  h: 3.3
});

// With Memory
slide15.addText("With Memory:", {
  x: 5.0, y: 1.1, w: 4.5, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.accentGreen,
  fontFace: "Arial"
});

slide15.addImage({
  path: "misc/with_memory.png",
  x: 5.0,
  y: 1.5,
  w: 4.0,
  h: 3.3
});

addEPAMFooter(slide15, 15);
console.log("✅ Created slide 15: Without vs With Memory");

// SLIDE 16: Memory Use Cases
let slide16 = pres.addSlide();
slide16.background = { color: COLORS.bgLight };

slide16.addText("Memory Use Cases", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const memoryUseCases = [
  { icon: "💬", title: "Conversational agents", desc: "Customer support з historical context" },
  { icon: "📋", title: "Task-oriented agents", desc: "Workflow tracking (invoice approval)" },
  { icon: "🤝", title: "Multi-agent systems", desc: "Shared memory для coordination" },
  { icon: "🤖", title: "Autonomous agents", desc: "Learning from past experiences" }
];

memoryUseCases.forEach((useCase, idx) => {
  const row = Math.floor(idx / 2);
  const col = idx % 2;
  const x = 0.5 + (col * 4.8);
  const y = 1.4 + (row * 1.6);

  slide16.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.5, h: 1.4,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  slide16.addText(useCase.icon, {
    x: x + 0.3, y: y + 0.2, w: 0.8, h: 0.6,
    fontSize: 36,
    fontFace: "Arial"
  });

  slide16.addText(useCase.title, {
    x: x + 1.2, y: y + 0.3, w: 3.0, h: 0.4,
    fontSize: 15,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  slide16.addText(useCase.desc, {
    x: x + 1.2, y: y + 0.75, w: 3.0, h: 0.5,
    fontSize: 12,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide16, 16);
console.log("✅ Created slide 16: Memory Use Cases");

// ====================
// GATEWAY SECTION (Slides 17-21)
// ====================

// SLIDE 17: Gateway Overview
let slide17 = pres.addSlide();
slide17.background = { color: COLORS.bgLight };

slide17.addText("AgentCore Gateway", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// What it does
slide17.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 9, h: 0.7,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});

slide17.addText("Перетворює APIs та Lambda в MCP servers", {
  x: 0.8, y: 1.25, w: 8.4, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  valign: "middle",
  fontFace: "Arial"
});

// Gateway diagram
slide17.addImage({
  path: "misc/gateway.png",
  x: 0.5,
  y: 2.0,
  w: 9,
  h: 3.0
});

addEPAMFooter(slide17, 17);
console.log("✅ Created slide 17: Gateway Overview");

// SLIDE 18: Gateway - Як працює
let slide18 = pres.addSlide();
slide18.background = { color: COLORS.bgLight };

slide18.addText("Gateway - Як працює", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Gateway Target types
slide18.addText("Gateway Target - 3 типи:", {
  x: 0.5, y: 1.1, w: 9, h: 0.3,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const gatewayTargets = [
  { num: "1", title: "Lambda ARNs", desc: "AWS Lambda functions" },
  { num: "2", title: "API specifications", desc: "OpenAPI, Smithy" },
  { num: "3", title: "MCP Transport", desc: "Streamable HTTP" }
];

gatewayTargets.forEach((target, idx) => {
  const x = 0.5 + (idx * 3.15);

  slide18.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.6, w: 3.0, h: 1.2,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Number badge
  slide18.addShape(pres.shapes.OVAL, {
    x: x + 0.2, y: 1.75, w: 0.5, h: 0.5,
    fill: { color: COLORS.accentGreen }
  });

  slide18.addText(target.num, {
    x: x + 0.2, y: 1.85, w: 0.5, h: 0.3,
    fontSize: 18,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });

  // Title
  slide18.addText(target.title, {
    x: x + 0.2, y: 2.35, w: 2.6, h: 0.3,
    fontSize: 14,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Description
  slide18.addText(target.desc, {
    x: x + 0.2, y: 2.65, w: 2.6, h: 0.3,
    fontSize: 12,
    color: COLORS.textDark,
    align: "center",
    fontFace: "Arial"
  });
});

// MCP operations
slide18.addText("MCP операції:", {
  x: 0.5, y: 3.0, w: 9, h: 0.3,
  fontSize: 16,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const mcpOps = [
  { name: "listTools", desc: "Список доступних інструментів" },
  { name: "invokeTool", desc: "Виклик інструмента з arguments" }
];

mcpOps.forEach((op, idx) => {
  const x = 0.5 + (idx * 4.8);

  slide18.addText("• " + op.name + " → " + op.desc, {
    x: x, y: 3.4, w: 4.5, h: 0.3,
    fontSize: 13,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

// Gateway flow diagram
slide18.addImage({
  path: "misc/gateway_how_it_works.png",
  x: 1.0,
  y: 3.9,
  w: 8.0,
  h: 1.1
});

addEPAMFooter(slide18, 18);
console.log("✅ Created slide 18: Gateway How It Works");

// SLIDE 19: Gateway - Авторизація
let slide19 = pres.addSlide();
slide19.background = { color: COLORS.bgLight };

slide19.addText("Gateway - Авторизація", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Inbound/Outbound boxes
const gatewayAuthTypes = [
  {
    title: "Inbound",
    subtitle: "User → Agent → Gateway",
    desc: "OAuth token validation",
    color: COLORS.accentGreen
  },
  {
    title: "Outbound",
    subtitle: "Gateway → External",
    desc: "API keys, IAM, OAuth",
    color: COLORS.epamBlue
  }
];

gatewayAuthTypes.forEach((auth, idx) => {
  const x = 0.5 + (idx * 4.8);

  slide19.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.2, w: 4.5, h: 1.4,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Title bar
  slide19.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.2, w: 4.5, h: 0.5,
    fill: { color: auth.color }
  });

  slide19.addText(auth.title, {
    x: x + 0.2, y: 1.3, w: 4.1, h: 0.3,
    fontSize: 18,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    fontFace: "Arial"
  });

  // Subtitle
  slide19.addText(auth.subtitle, {
    x: x + 0.3, y: 1.85, w: 3.9, h: 0.3,
    fontSize: 14,
    bold: true,
    color: auth.color,
    align: "center",
    fontFace: "Arial"
  });

  // Description
  slide19.addText(auth.desc, {
    x: x + 0.3, y: 2.2, w: 3.9, h: 0.3,
    fontSize: 13,
    color: COLORS.textDark,
    align: "center",
    fontFace: "Arial"
  });
});

// Authorization flow diagram
slide19.addImage({
  path: "misc/gateway_inbound_outbound.png",
  x: 0.5,
  y: 2.8,
  w: 9,
  h: 2.3
});

addEPAMFooter(slide19, 19);
console.log("✅ Created slide 19: Gateway Authorization");

// SLIDE 20: Gateway - Tool Discovery
let slide20 = pres.addSlide();
slide20.background = { color: COLORS.bgLight };

slide20.addText("Gateway - Tool Discovery", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Problem box
slide20.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.1, w: 4.2, h: 0.8,
  fill: { color: COLORS.epamWhite },
  shadow: makeShadow()
});

slide20.addText("⚠️ Проблема:", {
  x: 0.7, y: 1.25, w: 3.8, h: 0.25,
  fontSize: 14,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

slide20.addText("Сотні tools (360 з 3 targets)", {
  x: 0.7, y: 1.55, w: 3.8, h: 0.25,
  fontSize: 13,
  color: COLORS.textDark,
  fontFace: "Arial"
});

// Solution box
slide20.addShape(pres.shapes.RECTANGLE, {
  x: 5.0, y: 1.1, w: 4.5, h: 0.8,
  fill: { color: COLORS.accentGreen },
  shadow: makeShadow()
});

slide20.addText("✅ Рішення:", {
  x: 5.2, y: 1.25, w: 4.1, h: 0.25,
  fontSize: 14,
  bold: true,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

slide20.addText("Semantic search з vector embeddings", {
  x: 5.2, y: 1.55, w: 4.1, h: 0.25,
  fontSize: 13,
  color: COLORS.epamWhite,
  fontFace: "Arial"
});

// Tool discovery diagram
slide20.addImage({
  path: "misc/gateway_searching_for_tools.png",
  x: 0.5,
  y: 2.1,
  w: 9,
  h: 2.4
});

// Example
slide20.addShape(pres.shapes.RECTANGLE, {
  x: 1.5, y: 4.6, w: 7, h: 0.5,
  fill: { color: COLORS.accentGreen, transparency: 30 }
});

slide20.addText('💡 "draft a new advertisement" → 4 релевантних tools замість 360', {
  x: 1.8, y: 4.7, w: 6.4, h: 0.3,
  fontSize: 13,
  italic: true,
  color: COLORS.epamDark,
  fontFace: "Arial",
  valign: "middle"
});

addEPAMFooter(slide20, 20);
console.log("✅ Created slide 20: Gateway Tool Discovery");

// SLIDE 21: Gateway Benefits
let slide21 = pres.addSlide();
slide21.background = { color: COLORS.bgLight };

slide21.addText("Gateway Benefits", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const gatewayBenefits = [
  { icon: "🚀", title: "No Infrastructure", desc: "Fully managed" },
  { icon: "🔄", title: "Unified Interface", desc: "MCP protocol" },
  { icon: "🔐", title: "Built-in Auth", desc: "OAuth lifecycle" },
  { icon: "📈", title: "Auto Scaling", desc: "No capacity planning" },
  { icon: "🛡️", title: "Enterprise Security", desc: "Encryption + audit" }
];

gatewayBenefits.forEach((benefit, idx) => {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  const x = 0.5 + (col * 3.15);
  const y = 1.5 + (row * 1.8);

  slide21.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 3.0, h: 1.5,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide21.addText(benefit.icon, {
    x: x + 0.3, y: y + 0.2, w: 2.4, h: 0.5,
    fontSize: 36,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide21.addText(benefit.title, {
    x: x + 0.2, y: y + 0.8, w: 2.6, h: 0.3,
    fontSize: 14,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Description
  slide21.addText(benefit.desc, {
    x: x + 0.2, y: y + 1.1, w: 2.6, h: 0.3,
    fontSize: 12,
    color: COLORS.textDark,
    align: "center",
    fontFace: "Arial"
  });
});

addEPAMFooter(slide21, 21);
console.log("✅ Created slide 21: Gateway Benefits");

// ====================
// FINAL SECTION (Slides 22-23)
// ====================

// SLIDE 22: Ключові переваги AgentCore
let slide22 = pres.addSlide();
slide22.background = { color: COLORS.bgLight };

slide22.addText("Ключові переваги AgentCore", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const stakeholders = [
  {
    title: "Розробники",
    icon: "👨‍💻",
    benefits: [
      "Framework-agnostic",
      "Minimal code",
      "Local → Cloud seamless"
    ]
  },
  {
    title: "Операції",
    icon: "⚙️",
    benefits: [
      "Fully managed",
      "Security built-in",
      "Auto-scaling"
    ]
  },
  {
    title: "Бізнес",
    icon: "💼",
    benefits: [
      "Production-ready",
      "Pay per use",
      "Compliance"
    ]
  }
];

stakeholders.forEach((stakeholder, idx) => {
  const x = 0.5 + (idx * 3.15);

  slide22.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.3, w: 3.0, h: 3.5,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Icon
  slide22.addText(stakeholder.icon, {
    x: x + 0.3, y: 1.5, w: 2.4, h: 0.6,
    fontSize: 44,
    align: "center",
    fontFace: "Arial"
  });

  // Title
  slide22.addText(stakeholder.title, {
    x: x + 0.2, y: 2.2, w: 2.6, h: 0.4,
    fontSize: 18,
    bold: true,
    color: COLORS.epamBlue,
    align: "center",
    fontFace: "Arial"
  });

  // Benefits
  stakeholder.benefits.forEach((benefit, bidx) => {
    slide22.addText("✓ " + benefit, {
      x: x + 0.3, y: 2.8 + (bidx * 0.5), w: 2.4, h: 0.4,
      fontSize: 13,
      color: COLORS.textDark,
      fontFace: "Arial"
    });
  });
});

addEPAMFooter(slide22, 22);
console.log("✅ Created slide 22: Key Benefits");

// SLIDE 23: Наступний воркшоп
let slide23 = pres.addSlide();
slide23.background = { color: COLORS.epamDark };

slide23.addText("Наступний воркшоп", {
  x: 0.5, y: 1.0, w: 9, h: 0.7,
  fontSize: 48,
  bold: true,
  color: COLORS.epamBlue,
  align: "center",
  fontFace: "Arial"
});

slide23.addText("Hands-on практика з AgentCore", {
  x: 0.5, y: 1.8, w: 9, h: 0.5,
  fontSize: 28,
  color: COLORS.epamWhite,
  align: "center",
  fontFace: "Arial"
});

// What we'll build
slide23.addShape(pres.shapes.RECTANGLE, {
  x: 1.5, y: 2.5, w: 7, h: 2.0,
  fill: { color: COLORS.epamWhite, transparency: 10 },
  shadow: makeShadow()
});

const workshopTopics = [
  "🚀 Локальний ReAct агент → Cloud deployment",
  "🔐 OAuth 3-legged авторизація з Google",
  "📄 Інтеграція з Google Docs через Gateway",
  "🧠 Persistence та session management"
];

workshopTopics.forEach((topic, idx) => {
  slide23.addText(topic, {
    x: 1.8, y: 2.7 + (idx * 0.45), w: 6.4, h: 0.4,
    fontSize: 16,
    color: COLORS.epamWhite,
    fontFace: "Arial"
  });
});

// EPAM logo
slide23.addText("EPAM", {
  x: 0.5, y: 5, w: 1.5, h: 0.4,
  fontSize: 24,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

console.log("✅ Created slide 23: Next Workshop");

// Save complete presentation
pres.writeFile({ fileName: "Bedrock_AgentCore_Overview.pptx" })
  .then(() => {
    console.log("\n🎉 ===================================");
    console.log("✅ COMPLETE PRESENTATION CREATED!");
    console.log("📊 File: Bedrock_AgentCore_Overview.pptx");
    console.log("📝 Total slides: 23");
    console.log("🎯 Sections:");
    console.log("   - Overview (1-4)");
    console.log("   - Runtime (5-8)");
    console.log("   - Identity (9-13)");
    console.log("   - Memory (14-16)");
    console.log("   - Gateway (17-21)");
    console.log("   - Final (22-23)");
    console.log("🎉 ===================================\n");
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
