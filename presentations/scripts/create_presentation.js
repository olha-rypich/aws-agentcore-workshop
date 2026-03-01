#!/usr/bin/env node

const pptxgen = require("pptxgenjs");

// EPAM Brand Colors
const COLORS = {
  epamBlue: "39C2D7",      // EPAM primary blue-green
  epamDark: "3D3D3D",      // Dark gray
  epamWhite: "FFFFFF",     // White
  textDark: "2C2C2C",      // Text dark
  textLight: "F5F5F5",     // Text light
  accentGreen: "00B4A8",   // Accent teal
  bgLight: "F8F9FA",       // Light background
};

// Create presentation
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'EPAM Workshop';
pres.title = 'AWS AgentCore Workshop';

// Helper function to create shadow (fresh object each time to avoid mutation)
const makeShadow = () => ({
  type: "outer",
  blur: 8,
  offset: 3,
  angle: 135,
  color: "000000",
  opacity: 0.15
});

// Helper function to add EPAM footer
function addEPAMFooter(slide, slideNumber) {
  // Footer bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.4, w: 10, h: 0.225,
    fill: { color: COLORS.epamBlue }
  });

  // EPAM text logo (left)
  slide.addText("EPAM", {
    x: 0.3, y: 5.42, w: 1.5, h: 0.18,
    fontSize: 14,
    bold: true,
    color: COLORS.epamWhite,
    fontFace: "Arial",
    margin: 0
  });

  // Slide number (right)
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

slide1.addText("AWS AgentCore", {
  x: 0.5, y: 1.8, w: 9, h: 0.8,
  fontSize: 54,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  fontFace: "Arial"
});

slide1.addText("Production-Ready Platform для AI Агентів", {
  x: 0.5, y: 2.8, w: 9, h: 0.5,
  fontSize: 28,
  color: COLORS.epamBlue,
  align: "center",
  fontFace: "Arial"
});

slide1.addText("Workshop для розробників", {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 20,
  color: COLORS.textLight,
  align: "center",
  fontFace: "Arial"
});

// EPAM logo at bottom
slide1.addText("EPAM", {
  x: 0.5, y: 5, w: 1.5, h: 0.4,
  fontSize: 24,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

// ====================
// SLIDE 2: Що таке AI Agent?
// ====================
let slide2 = pres.addSlide();
slide2.background = { color: COLORS.bgLight };

slide2.addText("Що таке AI Agent?", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Definition box
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.2, w: 9, h: 1.2,
  fill: { color: COLORS.epamWhite },
  shadow: makeShadow()
});

slide2.addText("Автономна система, яка приймає рішення та виконує дії", {
  x: 0.8, y: 1.5, w: 8.4, h: 0.6,
  fontSize: 20,
  color: COLORS.textDark,
  align: "center",
  valign: "middle",
  fontFace: "Arial"
});

// Components
slide2.addText("Ключові компоненти:", {
  x: 0.5, y: 2.6, w: 9, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

const components = [
  { icon: "🤖", text: "LLM (Large Language Model)" },
  { icon: "🔧", text: "Tools (інструменти для дій)" },
  { icon: "💾", text: "Memory (пам'ять контексту)" },
  { icon: "🎯", text: "Planning (планування кроків)" }
];

components.forEach((comp, idx) => {
  const y = 3.2 + (idx * 0.45);

  slide2.addText(comp.icon + "  " + comp.text, {
    x: 1.5, y: y, w: 7, h: 0.4,
    fontSize: 16,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

// Use case example
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 5, w: 9, h: 0.4,
  fill: { color: COLORS.epamBlue, transparency: 20 }
});

slide2.addText("💡 Приклад use case: RAG agent з Google Docs", {
  x: 0.8, y: 5.05, w: 8.4, h: 0.3,
  fontSize: 14,
  italic: true,
  color: COLORS.epamDark,
  fontFace: "Arial",
  valign: "middle"
});

addEPAMFooter(slide2, 2);

// ====================
// SLIDE 3: Проблеми при деплої
// ====================
let slide3 = pres.addSlide();
slide3.background = { color: COLORS.bgLight };

slide3.addText("Проблеми при деплої агентів у production", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Table data
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
  fontSize: 13,
  color: COLORS.textDark,
  fontFace: "Arial",
  colW: [4.5, 4.5],
  valign: "middle"
});

addEPAMFooter(slide3, 3);

// ====================
// SLIDE 4: Що таке AWS AgentCore?
// ====================
let slide4 = pres.addSlide();
slide4.background = { color: COLORS.bgLight };

slide4.addText("Що таке AWS AgentCore?", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Main definition
slide4.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 9, h: 0.9,
  fill: { color: COLORS.epamBlue },
  shadow: makeShadow()
});

slide4.addText("Managed platform для деплою AI агентів", {
  x: 0.8, y: 1.5, w: 8.4, h: 0.5,
  fontSize: 24,
  bold: true,
  color: COLORS.epamWhite,
  align: "center",
  valign: "middle",
  fontFace: "Arial"
});

// Key points
const keyPoints = [
  {
    title: "Розділення відповідальностей",
    desc: "LangGraph → Business Logic | AgentCore → Infrastructure"
  },
  {
    title: "Ключова перевага",
    desc: "Focus on business logic, not infrastructure"
  }
];

keyPoints.forEach((point, idx) => {
  const y = 2.5 + (idx * 1.2);

  // Card
  slide4.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: y, w: 8, h: 1,
    fill: { color: COLORS.epamWhite },
    shadow: makeShadow()
  });

  // Title
  slide4.addText(point.title, {
    x: 1.3, y: y + 0.15, w: 7.4, h: 0.35,
    fontSize: 18,
    bold: true,
    color: COLORS.epamBlue,
    fontFace: "Arial"
  });

  // Description
  slide4.addText(point.desc, {
    x: 1.3, y: y + 0.55, w: 7.4, h: 0.3,
    fontSize: 14,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide4, 4);

// ====================
// SLIDE 5: High-level архітектура
// ====================
let slide5 = pres.addSlide();
slide5.background = { color: COLORS.bgLight };

slide5.addText("High-level Архітектура", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// Architecture flow boxes
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
    fill: { color: box.color },
    shadow: makeShadow()
  });

  slide5.addText(box.text, {
    x: box.x, y: box.y + 0.15, w: 1.8, h: 0.5,
    fontSize: 12,
    bold: true,
    color: COLORS.epamWhite,
    align: "center",
    valign: "middle",
    fontFace: "Arial"
  });
});

// Arrows (simplified as lines)
const arrows = [
  { x1: 1.7, y1: 1.9, x2: 3.2, y2: 1.9 },
  { x1: 4.1, y1: 1.9, x2: 5.6, y2: 1.9 },
  { x1: 6.5, y1: 2.3, x2: 6.5, y2: 3.2 },
  { x1: 6.5, y1: 2.3, x2: 8.4, y2: 2.8 }
];

arrows.forEach(arrow => {
  slide5.addShape(pres.shapes.LINE, {
    x: arrow.x1, y: arrow.y1,
    w: Math.abs(arrow.x2 - arrow.x1),
    h: Math.abs(arrow.y2 - arrow.y1),
    line: { color: COLORS.epamDark, width: 2 }
  });
});

addEPAMFooter(slide5, 5);

console.log("✅ Created slides 1-5");

// ====================
// SLIDE 6: AgentCore Runtime
// ====================
let slide6 = pres.addSlide();
slide6.background = { color: COLORS.bgLight };

slide6.addText("AgentCore Runtime", {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 36,
  bold: true,
  color: COLORS.epamDark,
  fontFace: "Arial"
});

// What it does
slide6.addText("Що робить:", {
  x: 0.5, y: 1.2, w: 4, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const runtimeFeatures = [
  "Manages agent lifecycle",
  "Session tracking",
  "Deployment orchestration"
];

runtimeFeatures.forEach((feature, idx) => {
  slide6.addText([
    { text: "•  " + feature, options: {} }
  ], {
    x: 0.8, y: 1.7 + (idx * 0.35), w: 3.7, h: 0.3,
    fontSize: 15,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

// Code example box
slide6.addShape(pres.shapes.RECTANGLE, {
  x: 5, y: 1.2, w: 4.5, h: 2.8,
  fill: { color: COLORS.epamDark },
  shadow: makeShadow()
});

slide6.addText("Canonical Contract:", {
  x: 5.2, y: 1.35, w: 4.1, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Consolas"
});

const codeLines = [
  "from bedrock_agentcore import \\",
  "    BedrockAgentCoreApp",
  "",
  "app = BedrockAgentCoreApp()",
  "",
  "@app.entrypoint",
  "def invoke(payload, context):",
  "    return graph.invoke(payload)",
  "",
  "app.run()"
];

slide6.addText(codeLines.map((line, idx) => ({
  text: line,
  options: { breakLine: idx < codeLines.length - 1 }
})), {
  x: 5.2, y: 1.75, w: 4.1, h: 2,
  fontSize: 11,
  fontFace: "Consolas",
  color: COLORS.textLight
});

// Benefits
slide6.addText("Переваги:", {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 18,
  bold: true,
  color: COLORS.epamBlue,
  fontFace: "Arial"
});

const benefits = [
  "⚡ Serverless scaling",
  "🔄 Session continuity",
  "🚀 No Lambda/container management"
];

benefits.forEach((benefit, idx) => {
  slide6.addText(benefit, {
    x: 1, y: 4 + (idx * 0.4), w: 8, h: 0.35,
    fontSize: 15,
    color: COLORS.textDark,
    fontFace: "Arial"
  });
});

addEPAMFooter(slide6, 6);

// Save presentation
pres.writeFile({ fileName: "AWS_AgentCore_Workshop.pptx" })
  .then(() => {
    console.log("✅ Presentation created successfully: AWS_AgentCore_Workshop.pptx");
  })
  .catch(err => {
    console.error("❌ Error creating presentation:", err);
    process.exit(1);
  });
