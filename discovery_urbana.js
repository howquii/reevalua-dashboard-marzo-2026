const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaRocket, FaChartLine, FaExclamationTriangle, FaBullseye,
  FaGoogle, FaTiktok, FaFacebookF, FaCheckCircle, FaClock,
  FaEye, FaBrain, FaCogs, FaLightbulb, FaArrowRight,
  FaHandshake, FaChartBar, FaUsers, FaDollarSign, FaRobot,
  FaFileAlt, FaSyncAlt, FaSearchDollar, FaMobileAlt, FaDatabase
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Helper to create fresh shadow objects (PptxGenJS mutates them)
const cardShadow = () => ({ type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 });
const softShadow = () => ({ type: "outer", blur: 12, offset: 3, angle: 135, color: "000000", opacity: 0.10 });

// Color Palette - Premium dark Apple-like
const C = {
  black: "0A0A0A",
  dark: "1A1A2E",
  darkBlue: "16213E",
  midDark: "0F3460",
  accent: "00B4D8",    // bright cyan
  accentLight: "90E0EF",
  white: "FFFFFF",
  offWhite: "F8F9FA",
  lightGray: "E9ECEF",
  gray: "6C757D",
  darkGray: "343A40",
  green: "00C9A7",
  red: "FF6B6B",
  orange: "FFA62B",
  purple: "845EC2",
  teal: "00B4D8",
};

async function createPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Reevalua";
  pres.title = "Discovery Call - Urbana Perú";

  // Pre-render all icons
  const icons = {
    rocket: await iconToBase64Png(FaRocket, "#00B4D8", 256),
    chart: await iconToBase64Png(FaChartLine, "#00B4D8", 256),
    warning: await iconToBase64Png(FaExclamationTriangle, "#FF6B6B", 256),
    bullseye: await iconToBase64Png(FaBullseye, "#00C9A7", 256),
    google: await iconToBase64Png(FaGoogle, "#FFFFFF", 256),
    tiktok: await iconToBase64Png(FaTiktok, "#FFFFFF", 256),
    facebook: await iconToBase64Png(FaFacebookF, "#FFFFFF", 256),
    check: await iconToBase64Png(FaCheckCircle, "#00C9A7", 256),
    clock: await iconToBase64Png(FaClock, "#FF6B6B", 256),
    eye: await iconToBase64Png(FaEye, "#00B4D8", 256),
    brain: await iconToBase64Png(FaBrain, "#845EC2", 256),
    cogs: await iconToBase64Png(FaCogs, "#00B4D8", 256),
    lightbulb: await iconToBase64Png(FaLightbulb, "#FFA62B", 256),
    arrow: await iconToBase64Png(FaArrowRight, "#00B4D8", 256),
    handshake: await iconToBase64Png(FaHandshake, "#00B4D8", 256),
    chartBar: await iconToBase64Png(FaChartBar, "#00C9A7", 256),
    users: await iconToBase64Png(FaUsers, "#00B4D8", 256),
    dollar: await iconToBase64Png(FaDollarSign, "#FF6B6B", 256),
    robot: await iconToBase64Png(FaRobot, "#00B4D8", 256),
    file: await iconToBase64Png(FaFileAlt, "#845EC2", 256),
    sync: await iconToBase64Png(FaSyncAlt, "#00C9A7", 256),
    search: await iconToBase64Png(FaSearchDollar, "#FFA62B", 256),
    mobile: await iconToBase64Png(FaMobileAlt, "#00B4D8", 256),
    database: await iconToBase64Png(FaDatabase, "#845EC2", 256),
    rocketWhite: await iconToBase64Png(FaRocket, "#FFFFFF", 256),
    checkWhite: await iconToBase64Png(FaCheckCircle, "#FFFFFF", 256),
    arrowWhite: await iconToBase64Png(FaArrowRight, "#FFFFFF", 256),
    brainWhite: await iconToBase64Png(FaBrain, "#FFFFFF", 256),
    cogsWhite: await iconToBase64Png(FaCogs, "#FFFFFF", 256),
    warningOrange: await iconToBase64Png(FaExclamationTriangle, "#FFA62B", 256),
    googleColor: await iconToBase64Png(FaGoogle, "#4285F4", 256),
    clockGray: await iconToBase64Png(FaClock, "#6C757D", 256),
    dollarGray: await iconToBase64Png(FaDollarSign, "#6C757D", 256),
  };

  // ============================================================
  // SLIDE 1: COVER / AUTORIDAD + CONEXIÓN
  // ============================================================
  let s1 = pres.addSlide();
  s1.background = { color: C.dark };

  // Subtle gradient-like overlay at top
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06,
    fill: { color: C.accent }
  });

  // Tagline top
  s1.addText("DISCOVERY CALL", {
    x: 0.8, y: 0.8, w: 8.4, h: 0.4,
    fontSize: 12, fontFace: "Arial",
    color: C.accent, charSpacing: 6, bold: true, margin: 0
  });

  // Main title
  s1.addText([
    { text: "El futuro del marketing\ninmobiliario es ", options: { color: C.white, bold: false } },
    { text: "inteligente.", options: { color: C.accent, bold: true } }
  ], {
    x: 0.8, y: 1.6, w: 6.5, h: 2.0,
    fontSize: 38, fontFace: "Arial", margin: 0, lineSpacingMultiple: 1.1
  });

  // Subtitle
  s1.addText("De la pauta tradicional a la adquisición\npotenciada por Inteligencia Artificial.", {
    x: 0.8, y: 3.7, w: 5.5, h: 0.9,
    fontSize: 16, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // Rocket icon
  s1.addImage({ data: icons.rocket, x: 7.8, y: 1.8, w: 1.5, h: 1.5 });

  // Bottom bar
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 4.9, w: 10, h: 0.725,
    fill: { color: C.darkBlue }
  });

  s1.addText("Preparado para Urbana Perú  ·  Marzo 2026", {
    x: 0.8, y: 4.95, w: 8.4, h: 0.6,
    fontSize: 13, fontFace: "Calibri", color: C.accentLight, margin: 0
  });


  // ============================================================
  // SLIDE 2: SITUACIÓN ACTUAL
  // ============================================================
  let s2 = pres.addSlide();
  s2.background = { color: C.offWhite };

  // Top accent bar
  s2.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent }
  });

  s2.addText("01", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: C.accent, bold: true, margin: 0
  });

  s2.addText("Situación Actual", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.dark, bold: true, margin: 0
  });

  s2.addText("Cómo operan hoy las inmobiliarias en Perú con agencias tradicionales", {
    x: 0.8, y: 1.45, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // 3 cards row
  const cards2 = [
    { icon: icons.dollar, title: "Alto costo mensual", desc: "Agencias medianas/grandes cobran fees elevados con contratos largos y poca flexibilidad.", color: C.red },
    { icon: icons.clockGray, title: "Reportes manuales", desc: "Informes semanales o mensuales en PDF que llegan tarde y sin contexto accionable.", color: C.orange },
    { icon: icons.users, title: "Poca visibilidad", desc: "No hay acceso en tiempo real a métricas de adquisición ni al rendimiento de cada canal.", color: C.purple },
  ];

  cards2.forEach((card, i) => {
    const cx = 0.8 + i * 2.95;
    s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: 2.15, w: 2.65, h: 2.8,
      fill: { color: C.white }, rectRadius: 0.12, shadow: cardShadow()
    });
    // Colored top strip
    s2.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 2.15, w: 2.65, h: 0.06,
      fill: { color: card.color }
    });
    s2.addImage({ data: card.icon, x: cx + 0.35, y: 2.55, w: 0.45, h: 0.45 });
    s2.addText(card.title, {
      x: cx + 0.25, y: 3.15, w: 2.15, h: 0.45,
      fontSize: 14, fontFace: "Arial", color: C.dark, bold: true, margin: 0
    });
    s2.addText(card.desc, {
      x: cx + 0.25, y: 3.55, w: 2.15, h: 1.2,
      fontSize: 11, fontFace: "Calibri", color: C.gray, margin: 0
    });
  });

  // Bottom note
  s2.addText("La mayoría de inmobiliarias en Perú no tiene dashboards en tiempo real de sus campañas.", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.35,
    fontSize: 10, fontFace: "Calibri", color: C.gray, italic: true, margin: 0
  });


  // ============================================================
  // SLIDE 3: PROBLEMA — GOOGLE ADS
  // ============================================================
  let s3 = pres.addSlide();
  s3.background = { color: C.dark };

  s3.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: "4285F4" }
  });

  s3.addText("02", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: "4285F4", bold: true, margin: 0
  });

  s3.addText("El Problema con Google Ads", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.white, bold: true, margin: 0
  });

  // Google icon circle
  s3.addShape(pres.shapes.OVAL, {
    x: 8.3, y: 0.45, w: 0.8, h: 0.8, fill: { color: "4285F4" }
  });
  s3.addImage({ data: icons.google, x: 8.48, y: 0.63, w: 0.45, h: 0.45 });

  // Problem items - left column
  const gProblems = [
    { title: "Campañas sin optimización diaria", desc: "Las agencias revisan las campañas de Search y Performance Max 2-3 veces por semana, dejando presupuesto desperdiciado." },
    { title: "Keywords negativas desactualizadas", desc: "Sin revisión constante de términos de búsqueda, el presupuesto se gasta en clics irrelevantes como 'alquiler' cuando vendes departamentos." },
    { title: "Sin seguimiento de conversiones real", desc: "Muchas agencias no configuran correctamente el tracking de llamadas, formularios y WhatsApp, impidiendo medir el verdadero ROI." },
  ];

  gProblems.forEach((p, i) => {
    const py = 1.75 + i * 1.2;
    s3.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: py, w: 8.4, h: 1.0,
      fill: { color: C.darkBlue }, rectRadius: 0.08
    });
    s3.addImage({ data: icons.warningOrange, x: 1.1, y: py + 0.25, w: 0.4, h: 0.4 });
    s3.addText(p.title, {
      x: 1.75, y: py + 0.08, w: 7.1, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: C.white, bold: true, margin: 0
    });
    s3.addText(p.desc, {
      x: 1.75, y: py + 0.48, w: 7.1, h: 0.45,
      fontSize: 11, fontFace: "Calibri", color: C.accentLight, margin: 0
    });
  });

  s3.addText("Resultado: CPL alto y leads de baja calidad que no convierten en visitas al proyecto.", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.red, bold: true, margin: 0
  });


  // ============================================================
  // SLIDE 4: PROBLEMA — META ADS
  // ============================================================
  let s4 = pres.addSlide();
  s4.background = { color: C.dark };

  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: "1877F2" }
  });

  s4.addText("03", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: "1877F2", bold: true, margin: 0
  });

  s4.addText("El Problema con Meta Ads", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.white, bold: true, margin: 0
  });

  s4.addShape(pres.shapes.OVAL, {
    x: 8.3, y: 0.45, w: 0.8, h: 0.8, fill: { color: "1877F2" }
  });
  s4.addImage({ data: icons.facebook, x: 8.48, y: 0.63, w: 0.45, h: 0.45 });

  const mProblems = [
    { title: "Audiencias genéricas y saturadas", desc: "Las agencias usan los mismos intereses amplios para todos sus clientes inmobiliarios, compitiendo entre ellos mismos por la misma audiencia." },
    { title: "Creativos que no se testean", desc: "Sin A/B testing estructurado de copies, imágenes y formatos. Se mantienen los mismos anuncios por meses sin iterar según datos." },
    { title: "Lead forms sin calificación", desc: "Formularios de Meta que capturan datos incompletos. Sin integración automática al CRM, los leads se pierden o se contactan tarde." },
  ];

  mProblems.forEach((p, i) => {
    const py = 1.75 + i * 1.2;
    s4.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: py, w: 8.4, h: 1.0,
      fill: { color: C.darkBlue }, rectRadius: 0.08
    });
    s4.addImage({ data: icons.warningOrange, x: 1.1, y: py + 0.25, w: 0.4, h: 0.4 });
    s4.addText(p.title, {
      x: 1.75, y: py + 0.08, w: 7.1, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: C.white, bold: true, margin: 0
    });
    s4.addText(p.desc, {
      x: 1.75, y: py + 0.48, w: 7.1, h: 0.45,
      fontSize: 11, fontFace: "Calibri", color: C.accentLight, margin: 0
    });
  });

  s4.addText("Resultado: Volumen alto de leads basura que saturan al equipo comercial sin generar ventas.", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.red, bold: true, margin: 0
  });


  // ============================================================
  // SLIDE 5: PROBLEMA — TIKTOK ADS
  // ============================================================
  let s5 = pres.addSlide();
  s5.background = { color: C.dark };

  s5.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: "00F2EA" }
  });

  s5.addText("04", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: "00F2EA", bold: true, margin: 0
  });

  s5.addText("El Problema con TikTok Ads", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.white, bold: true, margin: 0
  });

  s5.addShape(pres.shapes.OVAL, {
    x: 8.3, y: 0.45, w: 0.8, h: 0.8, fill: { color: C.black }
  });
  s5.addImage({ data: icons.tiktok, x: 8.48, y: 0.63, w: 0.45, h: 0.45 });

  const tProblems = [
    { title: "Las agencias no saben usar TikTok para inmobiliario", desc: "Replican el mismo enfoque de Meta sin entender que TikTok requiere contenido nativo, vertical y con storytelling auténtico." },
    { title: "Sin estrategia de Spark Ads ni UGC", desc: "No aprovechan el contenido orgánico ni los Spark Ads para escalar lo que ya funciona. Crean anuncios 'corporativos' que el algoritmo penaliza." },
    { title: "Métricas mal interpretadas", desc: "Confunden views con intención de compra. Sin píxel configurado correctamente, no miden las conversiones reales del funnel inmobiliario." },
  ];

  tProblems.forEach((p, i) => {
    const py = 1.75 + i * 1.2;
    s5.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: py, w: 8.4, h: 1.0,
      fill: { color: C.darkBlue }, rectRadius: 0.08
    });
    s5.addImage({ data: icons.warningOrange, x: 1.1, y: py + 0.25, w: 0.4, h: 0.4 });
    s5.addText(p.title, {
      x: 1.75, y: py + 0.08, w: 7.1, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: C.white, bold: true, margin: 0
    });
    s5.addText(p.desc, {
      x: 1.75, y: py + 0.48, w: 7.1, h: 0.45,
      fontSize: 11, fontFace: "Calibri", color: C.accentLight, margin: 0
    });
  });

  s5.addText("Resultado: Canal desaprovechado con alto potencial para captar compradores jóvenes de NSE A/B.", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.red, bold: true, margin: 0
  });


  // ============================================================
  // SLIDE 6: SITUACIÓN IDEAL
  // ============================================================
  let s6 = pres.addSlide();
  s6.background = { color: C.offWhite };

  s6.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.green }
  });

  s6.addText("05", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: C.green, bold: true, margin: 0
  });

  s6.addText("La Situación Ideal", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.dark, bold: true, margin: 0
  });

  s6.addText("Imagina tener control total de tus campañas con inteligencia artificial trabajando 24/7", {
    x: 0.8, y: 1.45, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // 2x2 grid of benefit cards
  const benefits = [
    { icon: icons.sync, title: "Dashboards en tiempo real", desc: "Accede a tus métricas de Google, Meta y TikTok en un solo lugar, actualizado cada hora.", x: 0.8, y: 2.1 },
    { icon: icons.robot, title: "Optimización con IA", desc: "Algoritmos que ajustan pujas, audiencias y presupuestos automáticamente según rendimiento.", x: 5.15, y: 2.1 },
    { icon: icons.chartBar, title: "Reportes automáticos", desc: "Informes generados por IA con insights accionables, sin esperar al ejecutivo de cuenta.", x: 0.8, y: 3.7 },
    { icon: icons.search, title: "Menor costo, mejor resultado", desc: "Más económico que una agencia tradicional mediana, con la potencia de la automatización.", x: 5.15, y: 3.7 },
  ];

  benefits.forEach((b) => {
    s6.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: b.x, y: b.y, w: 4.05, h: 1.35,
      fill: { color: C.white }, rectRadius: 0.1, shadow: cardShadow()
    });
    s6.addImage({ data: b.icon, x: b.x + 0.25, y: b.y + 0.2, w: 0.45, h: 0.45 });
    s6.addText(b.title, {
      x: b.x + 0.9, y: b.y + 0.15, w: 2.9, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: C.dark, bold: true, margin: 0
    });
    s6.addText(b.desc, {
      x: b.x + 0.9, y: b.y + 0.55, w: 2.9, h: 0.65,
      fontSize: 11, fontFace: "Calibri", color: C.gray, margin: 0
    });
  });


  // ============================================================
  // SLIDE 7: CALIFICACIÓN
  // ============================================================
  let s7 = pres.addSlide();
  s7.background = { color: C.dark };

  s7.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent }
  });

  s7.addText("06", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: C.accent, bold: true, margin: 0
  });

  s7.addText("Preguntas Clave", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.white, bold: true, margin: 0
  });

  s7.addText("Para entender si este modelo es el adecuado para Urbana Perú", {
    x: 0.8, y: 1.45, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.gray, margin: 0
  });

  const questions = [
    "¿Cuánto invierten mensualmente en pauta digital entre todos los canales?",
    "¿Tienen visibilidad en tiempo real de sus métricas de adquisición?",
    "¿Cuánto tiempo tarda su agencia actual en entregar un reporte accionable?",
    "¿Pueden identificar hoy cuál canal les genera los leads más calificados?",
    "¿Cuántos leads se pierden por falta de seguimiento inmediato?",
  ];

  questions.forEach((q, i) => {
    const qy = 2.05 + i * 0.65;
    s7.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: qy, w: 8.4, h: 0.5,
      fill: { color: C.darkBlue }, rectRadius: 0.06
    });
    s7.addText(`${i + 1}`, {
      x: 1.05, y: qy + 0.05, w: 0.4, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, margin: 0, align: "center"
    });
    s7.addText(q, {
      x: 1.55, y: qy + 0.05, w: 7.4, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: C.white, margin: 0
    });
  });

  s7.addText("Estas respuestas nos ayudan a diseñar una propuesta personalizada.", {
    x: 0.8, y: 5.15, w: 8.4, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: C.gray, italic: true, margin: 0
  });


  // ============================================================
  // SLIDE 8: INSIGHT
  // ============================================================
  let s8 = pres.addSlide();
  s8.background = { color: C.offWhite };

  s8.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.orange }
  });

  s8.addText("07", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: C.orange, bold: true, margin: 0
  });

  s8.addText("El Insight", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.dark, bold: true, margin: 0
  });

  // Big insight card
  s8.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.7, w: 8.4, h: 1.6,
    fill: { color: C.dark }, rectRadius: 0.12, shadow: softShadow()
  });

  s8.addImage({ data: icons.lightbulb, x: 1.2, y: 2.05, w: 0.6, h: 0.6 });

  s8.addText("Las agencias tradicionales venden horas-hombre.\nLa IA vende resultados automatizados.", {
    x: 2.1, y: 1.95, w: 6.8, h: 1.0,
    fontSize: 18, fontFace: "Arial", color: C.white, bold: true, margin: 0
  });

  // Comparison: Before vs After
  // LEFT: Traditional
  s8.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 3.6, w: 4.0, h: 1.7,
    fill: { color: C.white }, rectRadius: 0.1, shadow: cardShadow()
  });
  s8.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 3.6, w: 4.0, h: 0.06, fill: { color: C.red }
  });
  s8.addText("Agencia Tradicional", {
    x: 1.05, y: 3.75, w: 3.5, h: 0.35,
    fontSize: 14, fontFace: "Arial", color: C.red, bold: true, margin: 0
  });
  s8.addText([
    { text: "Reportes cada 15-30 días", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Optimización manual y reactiva", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Sin dashboards en tiempo real", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Fees basados en % de inversión", options: { bullet: true, color: C.darkGray } },
  ], {
    x: 1.05, y: 4.15, w: 3.5, h: 1.0,
    fontSize: 11, fontFace: "Calibri", margin: 0
  });

  // Arrow between
  s8.addImage({ data: icons.arrow, x: 4.75, y: 4.1, w: 0.5, h: 0.5 });

  // RIGHT: AI Agency
  s8.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.2, y: 3.6, w: 4.0, h: 1.7,
    fill: { color: C.white }, rectRadius: 0.1, shadow: cardShadow()
  });
  s8.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 3.6, w: 4.0, h: 0.06, fill: { color: C.green }
  });
  s8.addText("Agencia IA", {
    x: 5.45, y: 3.75, w: 3.5, h: 0.35,
    fontSize: 14, fontFace: "Arial", color: C.green, bold: true, margin: 0
  });
  s8.addText([
    { text: "Dashboards actualizados 24/7", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Optimización automática continua", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Alertas inteligentes por canal", options: { bullet: true, breakLine: true, color: C.darkGray } },
    { text: "Más económico y escalable", options: { bullet: true, color: C.darkGray } },
  ], {
    x: 5.45, y: 4.15, w: 3.5, h: 1.0,
    fontSize: 11, fontFace: "Calibri", margin: 0
  });


  // ============================================================
  // SLIDE 9: MÉTODO + SOLUCIÓN
  // ============================================================
  let s9 = pres.addSlide();
  s9.background = { color: C.offWhite };

  s9.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent }
  });

  s9.addText("08", {
    x: 0.8, y: 0.4, w: 1, h: 0.5,
    fontSize: 32, fontFace: "Arial", color: C.accent, bold: true, margin: 0
  });

  s9.addText("Nuestro Método", {
    x: 0.8, y: 0.9, w: 8, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: C.dark, bold: true, margin: 0
  });

  s9.addText("Tres pilares que transforman tu adquisición digital", {
    x: 0.8, y: 1.45, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // 3 pillars - vertical flow
  const pillars = [
    {
      num: "01", icon: icons.database, title: "Conexión de Datos",
      desc: "Integramos Google Ads, Meta Ads y TikTok Ads en un solo ecosistema con dashboards unificados y actualizados en tiempo real.",
      color: C.accent
    },
    {
      num: "02", icon: icons.brain, title: "Inteligencia Artificial",
      desc: "Algoritmos de IA analizan el rendimiento de cada campaña, audiencia y creativo para optimizar automáticamente la inversión.",
      color: C.purple
    },
    {
      num: "03", icon: icons.chartBar, title: "Reportes Accionables",
      desc: "Informes automáticos con recomendaciones claras. Cada insight viene con la acción sugerida y el impacto estimado.",
      color: C.green
    },
  ];

  pillars.forEach((p, i) => {
    const py = 2.05 + i * 1.15;
    s9.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: py, w: 8.4, h: 0.95,
      fill: { color: C.white }, rectRadius: 0.1, shadow: cardShadow()
    });
    // Left accent
    s9.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: py, w: 0.07, h: 0.95,
      fill: { color: p.color }
    });
    // Number
    s9.addText(p.num, {
      x: 1.15, y: py + 0.1, w: 0.5, h: 0.35,
      fontSize: 20, fontFace: "Arial", color: p.color, bold: true, margin: 0
    });
    s9.addImage({ data: p.icon, x: 1.7, y: py + 0.22, w: 0.4, h: 0.4 });
    s9.addText(p.title, {
      x: 2.3, y: py + 0.08, w: 6.6, h: 0.35,
      fontSize: 15, fontFace: "Arial", color: C.dark, bold: true, margin: 0
    });
    s9.addText(p.desc, {
      x: 2.3, y: py + 0.45, w: 6.6, h: 0.4,
      fontSize: 11, fontFace: "Calibri", color: C.gray, margin: 0
    });

    // Arrow between items
    if (i < 2) {
      s9.addImage({ data: icons.arrow, x: 4.8, y: py + 0.92, w: 0.3, h: 0.3 });
    }
  });


  // ============================================================
  // SLIDE 10: CIERRE / DISCUSIÓN
  // ============================================================
  let s10 = pres.addSlide();
  s10.background = { color: C.dark };

  s10.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent }
  });

  // Main CTA
  s10.addText("¿Listos para transformar\nsu marketing digital?", {
    x: 0.8, y: 0.8, w: 8.4, h: 1.6,
    fontSize: 36, fontFace: "Arial", color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.1
  });

  s10.addText("El siguiente paso es simple.", {
    x: 0.8, y: 2.4, w: 8.4, h: 0.5,
    fontSize: 16, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // Next steps cards
  const steps = [
    { icon: icons.checkWhite, title: "1. Diagnóstico gratuito", desc: "Analizamos sus campañas actuales en Google, Meta y TikTok con IA." },
    { icon: icons.cogsWhite, title: "2. Propuesta personalizada", desc: "Diseñamos un plan a medida con dashboards y automatizaciones." },
    { icon: icons.rocketWhite, title: "3. Implementación rápida", desc: "En 7 días tienen sus dashboards funcionando 24/7." },
  ];

  steps.forEach((s, i) => {
    const sx = 0.8 + i * 2.95;
    s10.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: sx, y: 3.1, w: 2.65, h: 1.8,
      fill: { color: C.darkBlue }, rectRadius: 0.1
    });
    s10.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: 3.1, w: 2.65, h: 0.06, fill: { color: C.accent }
    });
    s10.addImage({ data: s.icon, x: sx + 0.3, y: 3.4, w: 0.4, h: 0.4 });
    s10.addText(s.title, {
      x: sx + 0.2, y: 3.9, w: 2.25, h: 0.4,
      fontSize: 13, fontFace: "Arial", color: C.white, bold: true, margin: 0
    });
    s10.addText(s.desc, {
      x: sx + 0.2, y: 4.3, w: 2.25, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: C.accentLight, margin: 0
    });
  });

  // Bottom
  s10.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.1, w: 10, h: 0.525,
    fill: { color: C.black }
  });
  s10.addText("Reevalua  ·  Agencia IA para el sector inmobiliario  ·  reevalua.com", {
    x: 0.8, y: 5.15, w: 8.4, h: 0.4,
    fontSize: 12, fontFace: "Calibri", color: C.gray, margin: 0, align: "center"
  });


  // Save
  await pres.writeFile({ fileName: "C:/Users/juaga/Documents/CLAUDE/Discovery_Urbana_Peru.pptx" });
  console.log("Presentation saved: Discovery_Urbana_Peru.pptx");
}

createPresentation().catch(console.error);
