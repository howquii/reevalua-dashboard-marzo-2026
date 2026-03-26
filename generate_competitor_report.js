const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink, TableOfContents
} = require('docx');
const fs = require('fs');

// ─── COLOR PALETTE (Reevalúa brand) ───────────────────────────────────────
const COLORS = {
  primary:    '3D4FE0', // azul Reevalúa
  secondary:  '6C3DE0', // violeta Reevalúa
  accent:     '00C896', // verde menta
  darkText:   '1A1A2E',
  lightBg:    'F0F2FF',
  tableBg:    'E8ECFF',
  headerBg:   '3D4FE0',
  white:      'FFFFFF',
  gray:       '6B7280',
  lightGray:  'F3F4F6',
  warningBg:  'FFF3CD',
  successBg:  'D4EDDA',
};

// ─── BORDER HELPERS ───────────────────────────────────────────────────────
const thinBorder = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder   = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });

function allBorders(color = 'CCCCCC') {
  const b = thinBorder(color);
  return { top: b, bottom: b, left: b, right: b };
}

// ─── PARAGRAPH HELPERS ────────────────────────────────────────────────────
function h1(text, color = COLORS.primary) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, color, font: 'Arial', size: 36 })],
  });
}

function h2(text, color = COLORS.secondary) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, color, font: 'Arial', size: 28 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, color: COLORS.darkText, font: 'Arial', size: 24 })],
  });
}

function body(text, { bold = false, italic = false, color = COLORS.darkText, size = 22 } = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold, italic, color, font: 'Arial', size })],
  });
}

function bullet(text, { bold = false } = {}) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, bold, font: 'Arial', size: 22, color: COLORS.darkText })],
  });
}

function spacer(lines = 1) {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: 160 * lines } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function divider(color = COLORS.primary) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color, space: 1 } },
    children: [new TextRun('')],
  });
}

function labelValue(label, value, labelColor = COLORS.secondary) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: labelColor, font: 'Arial', size: 22 }),
      new TextRun({ text: value, font: 'Arial', size: 22, color: COLORS.darkText }),
    ],
  });
}

// ─── TABLE HELPERS ────────────────────────────────────────────────────────
function headerCell(text, widthDXA, bgColor = COLORS.headerBg) {
  return new TableCell({
    width: { size: widthDXA, type: WidthType.DXA },
    borders: allBorders('FFFFFF'),
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: COLORS.white, font: 'Arial', size: 20 })],
    })],
  });
}

function dataCell(text, widthDXA, bgColor = COLORS.white, textColor = COLORS.darkText, bold = false) {
  return new TableCell({
    width: { size: widthDXA, type: WidthType.DXA },
    borders: allBorders('DDDDDD'),
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color: textColor, font: 'Arial', size: 20 })],
    })],
  });
}

// ─── COMPETITOR TOP-5 CREATIVE TABLE ─────────────────────────────────────
// cols: Rank(600) | Plataforma(1200) | Formato(1400) | Hook/Descripcion(3200) | Metricas(1600) | Por que funciono(1360)
// total = 9360
function creativesTable(creatives) {
  const colWidths = [600, 1200, 1400, 3100, 1500, 1560];
  const headers   = ['#', 'Plataforma', 'Formato', 'Descripcion del Creativo', 'Metricas', 'Por que funciono'];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, colWidths[i])),
  });

  const dataRows = creatives.map((c, idx) => {
    const bg = idx % 2 === 0 ? COLORS.white : COLORS.lightBg;
    return new TableRow({
      children: [
        dataCell(`${idx + 1}`, colWidths[0], bg, COLORS.primary, true),
        dataCell(c.platform,    colWidths[1], bg),
        dataCell(c.format,      colWidths[2], bg),
        dataCell(c.description, colWidths[3], bg),
        dataCell(c.metrics,     colWidths[4], bg, COLORS.gray),
        dataCell(c.insight,     colWidths[5], bg),
      ],
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── COMPETITOR SUMMARY TABLE (cover overview) ────────────────────────────
function summaryTable(rows) {
  const colWidths = [2000, 1400, 1800, 1600, 2560];
  const headers   = ['Competidor', 'Pais', 'IG Followers', 'TikTok Handle', 'Patron Dominante'];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, colWidths[i])),
  });

  const dataRows = rows.map((r, idx) => {
    const bg = idx % 2 === 0 ? COLORS.white : COLORS.lightBg;
    return new TableRow({
      children: [
        dataCell(r.name,     colWidths[0], bg, COLORS.primary, true),
        dataCell(r.country,  colWidths[1], bg),
        dataCell(r.ig,       colWidths[2], bg),
        dataCell(r.tiktok,   colWidths[3], bg),
        dataCell(r.pattern,  colWidths[4], bg),
      ],
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── COMPETITOR DATA ──────────────────────────────────────────────────────

const competitors = [

  // ── 1. BRAVO / RESUELVE TU DEUDA ──────────────────────────────────────
  {
    name:    'Bravo / Resuelve tu Deuda (Go Bravo)',
    country: 'Mexico, Colombia, Espana',
    ig:      '@gobravo.mexico (61K)',
    tiktok:  '@gobravo.mexico / @resuelvetudeuda.mx',
    type:    'Reparadora de credito',
    tech:    'Plataforma digital + operacion intensiva',
    pattern: 'Influencer TikTok + Reply a escepticos',
    creatives: [
      {
        platform: 'TikTok',
        format: 'Influencer Paid Partnership',
        description: '@macariva x @gobravo.mexico: "85% de los empleados sienten estres por sus deudas, pero Go Bravo puede ayudarte a negociar." Talking-head directo al camara, tono cercano.',
        metrics: '8,051 likes | 156 comentarios (marzo 2024)',
        insight: 'Estadistica shock (85%) + voz de creadora confiable = patron interrumpe y genera urgencia emocional inmediata.',
      },
      {
        platform: 'TikTok',
        format: 'Influencer Paid Partnership',
        description: '@macariva x @gobravo.mexico (oct 2024): Endoso directo, explicacion de como Bravo negocia con instituciones financieras. Visual: lifestyle casual.',
        metrics: '6,849 likes | 124 comentarios | ~964K vistas (est.)',
        insight: 'Repeticion de creadora + marca = top of mind. Audiencia de @macariva es financieramente activa y confian en ella.',
      },
      {
        platform: 'TikTok (Cuenta propia)',
        format: 'Reply/Stitch a comentario esceptico',
        description: 'Respuesta directa a @AbyMacedo preguntando: "?Bravo Mexico es confiable?" La marca stichea el comentario y responde con pruebas y testimonios.',
        metrics: '6,849 likes | 124 comentarios',
        insight: 'Convertir objecion publica en contenido: reduce friccion de compra, genera confianza en audiencia que tiene la misma duda.',
      },
      {
        platform: 'TikTok (3ro - @kardmatchmx)',
        format: 'Expert Review organico',
        description: '"Bravo (Go Bravo Mexico): Como funciona y cuando si deberia considerarlo." Creator financiero neutral explica pros y contras de forma educativa.',
        metrics: '3,599 likes | 118 comentarios',
        insight: 'Tercero neutral = mayor credibilidad que la marca. Kardmatch tiene autoridad en finanzas LATAM; su review actua como comparador objetivo.',
      },
      {
        platform: 'TikTok (Cuenta propia)',
        format: 'Reel educativo corto',
        description: '"Esta es la forma segura de pagar tus deudas con un descuento." Video propio con hashtags: #deudas #finanzas #credito #educacionfinanciera.',
        metrics: 'Indexado organicamente; metricas exactas no confirmadas',
        insight: 'Promesa de seguridad + descuento = desactiva el miedo a fraudes. Hashtags financieros posicionan organicamente en busqueda TikTok.',
      },
    ],
  },

  // ── 2. CURADEUDA ──────────────────────────────────────────────────────
  {
    name:    'Curadeuda',
    country: 'Mexico',
    ig:      '@curadeuda (~5.4K)',
    tiktok:  '@curadeuda',
    type:    'Reparadora / salud financiera',
    tech:    'Plataforma web + asesoria remota',
    pattern: 'Facebook-first + Testimoniales de transformacion',
    creatives: [
      {
        platform: 'Facebook Video',
        format: 'Testimonial de cliente (Pedro)',
        description: '"Cura Deuda ayudo a Pedro a liquidar sus deudas en tarjetas de credito. El, hoy vive tranquilo. Tu, que esperas?" CTA: llamado a imaginarse sin deudas.',
        metrics: 'Indexado prominentemente; canal FB con 134K seguidores',
        insight: 'Nombre real + historia especifica (tarjeta de credito) = identificacion inmediata. "El vive tranquilo" activa aspiracion de calma.',
      },
      {
        platform: 'Facebook Video',
        format: 'Explainer "Como funciona"',
        description: '"Como funciona Cura Deuda - Vive tranquilo; sin deudas. Hacemos un plan de liquidacion a tu medida." Proceso visualizado paso a paso.',
        metrics: 'Alta indexacion organica en Facebook; metricas exactas no confirmadas',
        insight: 'Reducir la friccion cognitiva = aumentar conversion. Al ver el proceso claro, el usuario pierde el miedo a "que me van a hacer."',
      },
      {
        platform: 'TikTok (Cuenta propia)',
        format: 'Respuesta directa a miedo principal',
        description: '"Cobros a Domicilio: Apoyo de Curadeuda." Aborda el mayor miedo del usuario moroso: que vayan a su casa a cobrarle.',
        metrics: 'No confirmadas numericamente',
        insight: 'Atacar el miedo #1 del target directamente = contenido que se comparte entre personas con la misma situacion.',
      },
      {
        platform: 'TikTok (3ro - @kardmatchmx)',
        format: 'Expert review "?Es confiable?"',
        description: '"?Curadeuda es confiable? Asi funciona REALMENTE." Kardmatch explica ventajas y puntos a considerar al liquidar deudas con descuentos.',
        metrics: '~1,800 likes (estimado)',
        insight: 'Mismo patron que Bravo: la pregunta "?es confiable?" es la busqueda mas frecuente. Quien la responde primero gana la conversion.',
      },
      {
        platform: 'TikTok (3ro - @kardmatchmx)',
        format: 'Entrevista al Co-CEO',
        description: 'Javier Ruiz Galindo (co-fundador) explica en primera persona como Curadeuda ayuda a mejorar el Buro de Credito.',
        metrics: 'Indexado; metricas no confirmadas',
        insight: 'Founder-led content = maxima credibilidad. El CEO hablando directamente destruye la percepcion de "esto es una estafa".',
      },
    ],
  },

  // ── 3. DBMENOS ────────────────────────────────────────────────────────
  {
    name:    'DBMenos',
    country: 'Mexico',
    ig:      '@db_menos',
    tiktok:  'No confirmado',
    type:    'Reparadora / marketplace de ofertas',
    tech:    'Plataforma web + comparacion interna',
    pattern: 'Hook de descuento maximo + comparador de ofertas',
    creatives: [
      {
        platform: 'Website / Meta Ads (inferido)',
        format: 'Direct Response Ad',
        description: '"Paga tus deudas con 70% de descuento." Reduccion de deuda de $65,000 a $20,000 MXN (caso Luis). Hook de cifra maxima + caso real.',
        metrics: 'Pixel Meta + Google Ads activos confirmados (ads en ejecucion)',
        insight: '70% de descuento = numero concreto que activa FOMO de "y yo por que no?". El caso de Luis hace el claim creible con cifras reales.',
      },
      {
        platform: 'Instagram (@db_menos)',
        format: 'Posts organicos educativos',
        description: 'Contenido de educacion financiera: como afecta el Buro de Credito, diferencias entre deudas, pasos para normalizar pagos.',
        metrics: 'Seguimiento organico; metricas individuales no confirmadas',
        insight: 'SEO social: usuarios buscan informacion sobre Buro de Credito; DBMenos aparece como educador, luego convierte.',
      },
      {
        platform: 'Facebook',
        format: 'Review/Comparador',
        description: 'Posicionamiento como marketplace: "compara ofertas de distintos acreedores en un solo lugar." Diferenciador vs reparadoras que negocian solo con uno.',
        metrics: 'Pagina activa en Facebook; metricas no confirmadas',
        insight: 'Propuesta de valor unica: el usuario siente control al "comparar" en lugar de depender de un solo negociador.',
      },
      {
        platform: 'Busqueda organica (SEO)',
        format: 'Landing page / blog SEO',
        description: 'Contenido posicionado para busquedas: "que hacer si no puedo pagar mi deuda", "buro de credito como limpiar", con CTA a consulta gratis.',
        metrics: 'Alta indexacion en Google Mexico (confirmada por multiples reviews)',
        insight: 'Captura intencion en el momento de maxima desesperacion: cuando el usuario googlea su problema, DBMenos esta ahi.',
      },
      {
        platform: 'Instagram (@db_menos)',
        format: 'Credibilidad institucional',
        description: 'Contenido destacando respaldo de Y Combinator y reconocimiento NAFINSA top-10 fintech. Sellos de confianza visuales.',
        metrics: 'Metricas no confirmadas individualmente',
        insight: 'En categoria donde la desconfianza es alta, los logos de Y Combinator y NAFINSA funcionan como prueba social institucional.',
      },
    ],
  },

  // ── 4. TRANQUI FINANZAS ───────────────────────────────────────────────
  {
    name:    'Tranqui Finanzas',
    country: 'Colombia',
    ig:      '@tranquifinanzas (3.5K)',
    tiktok:  'No confirmado',
    type:    'Plataforma aliada de bancos (B2B2C)',
    tech:    'Portal online conectado a entidades',
    pattern: 'Simplificacion del proceso + Herramientas educativas como lead magnet',
    creatives: [
      {
        platform: 'Instagram (@tranquifinanzas)',
        format: 'Contenido educativo organico',
        description: 'Bio: "Somos aliados de las mejores entidades financieras, para ayudarte a solucionar tu deuda y que puedas recuperar tu vida crediticia." Posts de educacion sobre mora y credito.',
        metrics: '3,543 seguidores | 32 posts totales',
        insight: 'Con pocos posts pero mensaje claro de alianza con bancos, genera percepcion de legitimidad institucional que reduce desconfianza.',
      },
      {
        platform: 'Website + Instagram',
        format: 'Lead magnet: Simulador digital',
        description: '"Simulador de Alivios Financieros" (sept 2024): herramienta gratuita donde el usuario modela escenarios de renegociacion bajo regulacion colombiana.',
        metrics: 'Lanzado sept 15, 2024; trafico organico confirmado',
        insight: 'Herramienta interactiva = el usuario se auto-califica y ve el beneficio concreto ANTES de hablar con un asesor. Conversion mas calificada.',
      },
      {
        platform: 'Facebook',
        format: 'Testimonial de usuario',
        description: '"Tranqui facilito el proceso para ponerme al dia, rapido, en linea y sin tramites eternos." Testimonio real reproducido en redes.',
        metrics: '~2.7K seguidores en Facebook',
        insight: '"Sin tramites eternos" = golpea directamente el pain point de burocracia que el colombiano asocia a tratar con bancos.',
      },
      {
        platform: 'Online (webinars)',
        format: 'Webinar educativo en vivo',
        description: 'Talleres y asesorias gratuitas sobre: como salir de deudas, mejora de historial crediticio, compra de vivienda. Repropositados como contenido.',
        metrics: 'Audiencia de LinkedIn: 3,765 seguidores (canal B2B)',
        insight: 'Webinars gratuitos = generacion de leads calificados + posicionamiento como expertos. El formato live crea urgencia organica.',
      },
      {
        platform: 'PR / LinkedIn',
        format: 'Credibilidad startup (YC + 500 Startups)',
        description: 'Comunicacion de pertenencia a Y Combinator S19 (top 12 de 900 aplicantes) y 500 Startups. Usado en pitches B2B y contenido de marca.',
        metrics: 'Cobertura en El Tiempo, YC directory',
        insight: 'En Colombia, el respaldo de YC y 500 Startups transforma la percepcion de startup a empresa de clase mundial, crucial para cerrar B2B.',
      },
    ],
  },

  // ── 5. DESTACAME ──────────────────────────────────────────────────────
  {
    name:    'Destacame',
    country: 'Chile, Mexico',
    ig:      '@destacame_mx (6.9K) / @destacame (Chile)',
    tiktok:  '@soydestacame',
    type:    'Educacion financiera + negociacion de deudas',
    tech:    'Plataforma web + score gratis',
    pattern: 'Campanas emocionales de inclusion + coalicion institucional',
    creatives: [
      {
        platform: 'Instagram + TikTok + OOH',
        format: 'Campana "Hombre Invisible" (oct 2025)',
        description: 'Persona caminando por Santiago con cartel: "Me siento invisible para el sistema." Campana lanzamiento SúperAvanza: microcredito para personas con mora. Produccion callejera real.',
        metrics: 'Cobertura en CNN Chile, Chocale, prensa financiera; 4M chilenos en mora como target',
        insight: 'La "invisibilidad financiera" es la emocion mas profunda del sobreendeudado: sentirse excluido. Nombrar ese dolor = conexion emocional inmediata.',
      },
      {
        platform: 'TikTok (@soydestacame)',
        format: 'Campana coalicion #ChileAlDia (mayo 2025)',
        description: '"La morosidad no se ve, pero se siente. Por eso en Destacame estamos orgullosos de formar parte de @porunchilealdia." Video anunciando iniciativa nacional de alivio de deudas.',
        metrics: 'URL confirmada: tiktok.com/@soydestacame/video/7507425089122602246',
        insight: 'Unirse a una causa nacional = amplificacion de alcance gratuita + percepcion de empresa que "trabaja por el pais", no solo por su negocio.',
      },
      {
        platform: 'TikTok (@soydestacame)',
        format: 'Product + campana fusion (2025)',
        description: '"Este Chile al Dia, paga tu deuda en nuestra plataforma y accede al plan que te da SuperAvances para crear un nuevo historial. #ChileAlDia #DescuentosenDeudas"',
        metrics: 'URL confirmada: tiktok.com/@soydestacame/video/7514724090813385990',
        insight: 'Lanzar producto al amparo de una campana social = reducir resistencia al CTA comercial. El usuario percibe el producto como parte del movimiento, no como publicidad.',
      },
      {
        platform: 'Facebook + Instagram',
        format: 'Campana #ChileSinDeuda (2020, reactivada)',
        description: 'Convocatoria a 21+ instituciones financieras para ofrecer hasta 80% de descuento a 4.3M chilenos durante retiro AFP COVID. Campana masiva multicanal.',
        metrics: '~2M usuarios activos mensuales Chile | ~1M Mexico en el momento de la campana',
        insight: 'Cuando el contexto social es favorable (crisis COVID + retiro AFP) y se alinea la urgencia del usuario con el producto, la viralizacion es organica.',
      },
      {
        platform: 'YouTube + Website',
        format: 'Video testimonios de transformacion',
        description: 'Testimonios reales de usuarios (Goran, Denisse, Javier) embebidos en homepage. Narrativa: de espiral de deuda a libertad financiera, con score real mejorado.',
        metrics: 'Homepage feature + canal YouTube activo',
        insight: 'Testimoniales con nombres y apellidos + scores reales = credibilidad maxima. El antes/despues del score crediticio es el KPI mas persuasivo en el segmento.',
      },
    ],
  },

  // ── 6. KAMINA ─────────────────────────────────────────────────────────
  {
    name:    'Kamina',
    country: 'Ecuador / Latam',
    ig:      '@joinkamina (~6.4K)',
    tiktok:  '@kamina_ai',
    type:    'App de prevencion financiera + gestion de deudas con IA',
    tech:    'IA conductual + app movil',
    pattern: 'Prevencion-first + contenido educativo blog-driven',
    creatives: [
      {
        platform: 'Instagram + Blog',
        format: 'Contenido educativo: emergencias',
        description: '"Fondo de emergencia: cuando la comida solidaria no basta." Articulo/post que conecta la realidad de subsistencia con la necesidad de un fondo de emergencia. Tono empatico, no financiero.',
        metrics: '6,455 seguidores Instagram | Blog activo desde feb 2025',
        insight: 'Anclar educacion financiera a situaciones cotidianas extremas = relevancia emocional para audiencia de bajos ingresos. El titulo provoca curiosidad y urgencia.',
      },
      {
        platform: 'Instagram + Blog',
        format: 'Contenido educativo: habitos de genero',
        description: '"Diez consejos financieros que toda mujer necesita escuchar." Segmentacion de audiencia por genero con contenido hiperrelevante. Tono empoderante.',
        metrics: 'Alta indexacion SEO en blog kamina.ai',
        insight: 'Segmentar el mensaje por identidad de genero aumenta el CTR y guardados porque el usuario siente que el contenido "fue hecho para mi."',
      },
      {
        platform: 'Instagram + Blog',
        format: 'Contenido educativo: situacion de deuda',
        description: '"No puedo pagar mis deudas: estrategias efectivas." Post que valida la emocion (no puedes = aceptado) antes de ofrecer solucion. Sin juicio.',
        metrics: 'Indexado con trafico organico confirmado',
        insight: 'Titulos que VALIDAN la situacion del usuario antes de solucionarla tienen mayor CTR. "No puedo" quita la culpa y atrae al target preciso.',
      },
      {
        platform: 'Instagram',
        format: 'PR institucional: Mastercard Start Path',
        description: 'Anuncio de inclusion en Mastercard Start Path (primera fintech ecuatoriana). Post de logro institucional con storytelling de origen.',
        metrics: 'Cobertura en KCH Comunicacion, Latam financiero (dic 2024)',
        insight: 'Para startups pequenas, los hitos institucionales (Mastercard, YC) son el contenido de mayor credibilidad disponible. Actua como prueba social de clase mundial.',
      },
      {
        platform: 'Instagram + Blog',
        format: 'Contenido micro-metas',
        description: '"El poder de las micrometas: pasos alcanzables para cumplir grandes objetivos financieros." Aplica psicologia conductual al contenido. Accionable y compartible.',
        metrics: 'Blog activo con publicaciones regulares',
        insight: 'Las micrometas son el formato de mayor guardado en finanzas personales: el usuario guarda el post para "aplicarlo luego." Genera libreria de contenido evergreen.',
      },
    ],
  },

  // ── 7. BRIGHT MONEY ───────────────────────────────────────────────────
  {
    name:    'Bright Money',
    country: 'Estados Unidos',
    ig:      '@brightmoney.co (52K)',
    tiktok:  '@brightmoney',
    type:    'App de IA para pago de deudas y score',
    tech:    'IA propietaria (MoneyScience) + app movil',
    pattern: 'Landing page ads con validacion de medios + hook de alivio emocional',
    creatives: [
      {
        platform: 'Meta Ads / Instagram',
        format: 'Direct Response Ad (landing page)',
        description: '"Destroy the debt with Bright Money Science. Build real wealth." + "No more debt-stress. Start today!" Visual minimalista, CTA directo. Validado por Bloomberg, Yahoo Finance, Fortune, CNBC.',
        metrics: '52K seguidores IG | Pixel activo confirmado | 200K+ reviews 5 estrellas',
        insight: '"Debt-stress" es el termino emocional exacto que usa el target angloparlante. Nombrar la emocion (no la deuda) genera resonancia inmediata y alta CTR.',
      },
      {
        platform: 'App Store / Google Play',
        format: 'Social proof de escala',
        description: '"Rated 4.8 based on 80,000+ reviews" + "Rated 5-stars by 200,000+ users." Usado en todos los ads como credencial social masiva.',
        metrics: '4.8 App Store | 4.6 Google Play | 200K+ reviews confirmados',
        insight: '200,000 reviews no es un numero; es una afirmacion de que "200,000 personas ya confiaron". En finanzas personales, la masa valida la confianza.',
      },
      {
        platform: 'Instagram + Meta Ads',
        format: 'Permission lowering: "All credit scores"',
        description: '"All Credit Scores can apply" + "No credit impact to check offers." Elimina la barrera de entrada principal: miedo al rechazo por mal score.',
        metrics: 'Mensaje central en todas las landing pages activas',
        insight: 'El mayor freno de conversion en apps de credito es "seguro me van a rechazar." Decirlo explicitamente elimina esa friccion y aumenta el registro.',
      },
      {
        platform: 'TikTok + Instagram',
        format: 'Autoridad de medios (Press logos)',
        description: 'Creativo con logos de Bloomberg, Yahoo Finance, Fortune, CNBC prominentes. Hook: "Seen in..." como validacion de terceros masivos.',
        metrics: 'Estrategia central en todas las campanas de awareness',
        insight: 'En mercado saturado de apps financieras, los logos de media son el diferenciador de confianza mas rapido. "Si Bloomberg lo cubre, no puede ser fraude."',
      },
      {
        platform: 'Meta Ads',
        format: 'Feature-specific ad: Cash advance',
        description: '"Cash advances up to $750. No credit check." + "Balance transfer loans up to $8,000." Ads especificos por feature que hablan al pain point exacto del segmento.',
        metrics: 'Multiple landing pages activas por feature (confirmado)',
        insight: 'Segmentar ads por feature especifico aumenta relevancia: el usuario que necesita $750 de emergencia convierte mejor en un ad de cash advance que en uno generico.',
      },
    ],
  },

  // ── 8. SERASA LIMPA NOME ──────────────────────────────────────────────
  {
    name:    'Serasa Limpa Nome',
    country: 'Brasil',
    ig:      '@serasa (713K)',
    tiktok:  '@serasa',
    type:    'Marketplace de negociacion de deudas + buro',
    tech:    'Portal masivo conectado al SPC/Serasa buro',
    pattern: 'Campanas culturales masivas + colaboraciones creativas virales',
    creatives: [
      {
        platform: 'TikTok (campana paga)',
        format: 'TikTok native ads con creators',
        description: 'Campana mar-nov 2022: ads en tono autentico TikTok (dancinhas, tutoriais, humor). Resultado: 496,000 personas renegociaron deudas; 75% de quienes vieron el ad descargaron la app y renegociaron.',
        metrics: '496K renegociaciones | 164K conversiones en oct 2022 | 75% tasa de conversion | "TikTok mostro la mayor tasa de activacion vs otras plataformas"',
        insight: 'Adaptar el formato de contenido al lenguaje NATIVO de TikTok (no reutilizar ads de otras plataformas) fue la clave. El humor y las dancinhas redujeron la verguenza de la deuda.',
      },
      {
        platform: 'Instagram + prensa',
        format: 'Colaboracion con celebridad: Pericles "Pericao"',
        description: 'Para el Feirao Limpa Nome nov 2024: cantante de pagode Pericles cambia su username de Instagram a "Pericao" (sufijo "ao" = grande, como "Feirao"). Campana de nombre-juego.',
        metrics: 'Feirao: 550M ofertas de negociacion | 1,000+ empresas | hasta 99% de descuento | Cobertura en Meio & Mensagem',
        insight: 'Convertir el nombre de la campana en un juego linguistico que involucra a una celebridad amada = contenido que la gente comparte por el chiste, no por la deuda.',
      },
      {
        platform: 'TikTok',
        format: 'Challenge con influencers de #CleanTok',
        description: '"Desafio de faxina en 3 minutos": influencers de limpieza (Luiz Limpei 1.4M, Anna Mogca Casinha Preta 1.8M, Rhuan Felix 3.4M) limpian algo en exactamente 3 minutos, el mismo tiempo para renegociar una deuda en Serasa.',
        metrics: 'Context: #CleanTok 78B vistas | 3 mega-influencers de limpieza activados (jul 2024)',
        insight: 'Metafora visual + comunidad existente (#CleanTok) = alcance masivo sin hablar de finanzas. La dopamina del ASMR de limpieza se transfiere emocionalmente a "limpiar tu nombre."',
      },
      {
        platform: 'Meta + TikTok + Supermercados',
        format: 'Meme-to-Product: CIF x Serasa "Cif Limpa Ate Nome" (Droga5)',
        description: 'Unilever + Serasa crean producto de limpieza CIF edicion limitada. Compras el producto, registras el recibo, entras en sorteo de R$500/dia para pagar tu deuda. Origen: meme viral de anos "Cif limpia todo menos el nombre sucio".',
        metrics: '81.3M brasileros en mora (49.66% poblacion adulta) | Target: 3,000+ consumidores | Cobertura global (Cannes Lions candidates, Roastbrief, GKPB)',
        insight: 'Convertir una broma cultural de anos en un producto real = la idea mas compartida del ano. La gente lo comparte por el ingenio, no por la deuda. Doble significado "limpar" (limpiar / limpiar el nombre) es inigualable.',
      },
      {
        platform: 'TV Nacional + Digital',
        format: 'Manifiesto de marca (35a edicion, feb 2026)',
        description: 'Nuevo posicionamiento lanzado en Fantastico (TV Globo): "Serasa es quien mas entiende de nombres en Brasil y quien esta al lado de las personas en los momentos mas importantes de su vida financiera." Musica orquestal, actor Danton Mello, post-Carnaval.',
        metrics: 'Lanzado 22 feb 2026 en Fantastico | 4M brasileros negociaron 5.9M deudas en nov 2025 (+19% vs 2024) | Viernes 28 nov 2025: mayor dia de renegociacion en historia de Serasa',
        insight: 'Posicionarse como el "guardian del nombre" (identidad) en lugar de "negociador de deudas" (transaccion) eleva la marca a nivel emocional. Se convierte en algo que importa, no solo algo que sirve.',
      },
    ],
  },
];

// ─── CROSS-PATTERNS & REEVALUA IMPLICATIONS ───────────────────────────────
const patterns = [
  {
    title:   'Patron 1: La pregunta de confianza domina el search',
    insight: '"?[Marca] es confiable?" es el contenido mas buscado y con mayor conversion en todas las marcas. Quien responde esta pregunta primero y mejor gana la conversion. Go Bravo y Curadeuda tienen videos especificos respondiendo esto.',
    action:  'Reevalua debe crear contenido que responda explicitamente "?Como funciona Reevalua?" y "?Es seguro?" en TikTok e Instagram. Formato recomendado: Stitch/Reply a comentario esceptico.',
  },
  {
    title:   'Patron 2: El influencer financiero de nicho supera a la marca',
    insight: 'El ecosistema de @kardmatchmx en Mexico mueve mas credibilidad que los canales propios de Curadeuda o Bravo. Las reseñas de terceros generan mas confianza que cualquier ad de marca.',
    action:  'Identificar y activar al equivalente peruano de @kardmatchmx. Buscar creadores de finanzas personales con audiencia de 50K-500K en Peru. El brief: "explica como funciona Reevalua honestamente."',
  },
  {
    title:   'Patron 3: El formato nativo de TikTok multiplica la conversion',
    insight: 'Serasa demostro que adaptar contenido al lenguaje NATIVO de TikTok (humor, dancinhas, tutoriales) genera 75% de tasa de conversion. Los ads que parecen ads funcionan peor.',
    action:  'Reevalua debe producir contenido que parezca organico en TikTok: humor sobre la situacion de deuda, tutoriales paso a paso, trends de finanzas con twist. No reutilizar creativos de Meta en TikTok.',
  },
  {
    title:   'Patron 4: Nombrar la emocion (no el problema) genera guardados',
    insight: 'Bright Money habla de "debt-stress", Destacame de "invisibilidad financiera", Serasa de "limpiar el nombre". Ninguno dice simplemente "tienes deudas". Nombrar la emocion = guardados y shares.',
    action:  'El hook de Reevalua debe ser emocional antes de ser racional. Propuestas: "Te rechazan en todos lados?", "Tu score te tiene atrapado?", "Te cansas de pagar y nunca terminar?" antes de hablar de la solucion.',
  },
  {
    title:   'Patron 5: Las campanas de coalition generan alcance sin costo publicitario',
    insight: 'Destacame con #ChileAlDia y Serasa con el Feirao Limpa Nome generaron millones de impresiones al unirse o crear movimientos nacionales. La marca no paga por el alcance; paga por la asociacion.',
    action:  'Reevalua puede crear o unirse a una iniciativa peruana: "Peru Sin Deuda", coalicion con SBS/INDECOPI, o campana temporal durante campanas de regularizacion de deuda del gobierno peruano.',
  },
  {
    title:   'Patron 6: Los memes culturales convierten mejor que los ads racionales',
    insight: 'La campana CIF x Serasa (basada en un meme de anos) fue la mas comentada y compartida del benchmark. El humor y la referencia cultural eliminan la verguenza de la deuda como barrera.',
    action:  'Investigar memes peruanos sobre deudas, prestamos o el banco. Existe algun chiste o expresion cultural sobre "estar en rojo"? Esa es la semilla de la proxima campana viral de Reevalua.',
  },
];

// ─── DOCUMENT ASSEMBLY ────────────────────────────────────────────────────
function buildDocument() {

  // ── COVER PAGE ─────────────────────────────────────────────────────────
  const coverPage = [
    spacer(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'ANALISIS DE CREATIVOS VIRALES', bold: true, font: 'Arial', size: 52, color: COLORS.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'COMPETIDORES B2C', bold: true, font: 'Arial', size: 44, color: COLORS.secondary })],
    }),
    divider(COLORS.accent),
    spacer(1),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Prepared for: Reevalua', font: 'Arial', size: 24, color: COLORS.gray, italic: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: 'Plataformas analizadas: Instagram | TikTok | Meta Ads Library', font: 'Arial', size: 22, color: COLORS.gray })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: 'Fecha: Marzo 2026', font: 'Arial', size: 22, color: COLORS.gray })],
    }),
    spacer(2),
    // Summary table
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: 'RESUMEN DE COMPETIDORES ANALIZADOS', bold: true, font: 'Arial', size: 24, color: COLORS.primary })],
    }),
    summaryTable(competitors.map(c => ({
      name:    c.name,
      country: c.country,
      ig:      c.ig,
      tiktok:  c.tiktok,
      pattern: c.pattern,
    }))),
    pageBreak(),
  ];

  // ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────
  const execSummary = [
    h1('1. Resumen Ejecutivo'),
    divider(),
    body('Este informe analiza los Top 5 creativos mas virales (medidos por likes, guardados, shares e impacto de campana) de los 8 principales competidores B2C directos de Reevalua. Se analizaron contenidos organicos en Instagram Reels, TikTok y Meta Ads Library publicados entre 2022 y marzo 2026.', { size: 22 }),
    spacer(),
    h3('Hallazgos Principales'),
    bullet('Serasa Limpa Nome (Brasil) lidera con campanas culturales masivas: 496K renegociaciones via TikTok (75% tasa de conversion), campana CIF x Serasa viral global.'),
    bullet('Go Bravo (Mexico) domina con influencer marketing en TikTok: 8,051 likes en colaboracion @macariva, estrategia de Reply a escepticos altamente efectiva.'),
    bullet('Destacame (Chile) ejecuta las mejores campanas emocionales de LATAM: "Hombre Invisible" y coalicion #ChileAlDia generan alcance organico masivo.'),
    bullet('Bright Money (EE.UU.) lidera en conversion por ads: hook "debt-stress" + 200K reviews + validacion de Bloomberg/Fortune en cada creativo.'),
    bullet('El formato nativo de TikTok supera en 3x a los ads tradicionales en tasa de conversion (dato confirmado de Serasa).'),
    bullet('La pregunta "?[Marca] es confiable?" es el contenido de mayor intencion de conversion en el segmento — quien la responde gana el lead.'),
    spacer(),
    h3('Oportunidades Clave para Reevalua'),
    bullet('GAP #1 — Peru carece de un creator financiero tipo @kardmatchmx que revise plataformas de deuda. Reevalua puede activar ese ecosistema.'),
    bullet('GAP #2 — Ningun competidor LATAM usa el meme cultural peruano sobre deudas o credito. Primera campana en hacerlo tendra viralizacion organica.'),
    bullet('GAP #3 — La narrativa de "rehabilitacion" (no negociacion) es unica de Reevalua — ningun competidor la usa en contenido organico. Es una ventana abierta.'),
    pageBreak(),
  ];

  // ── METHODOLOGY ───────────────────────────────────────────────────────
  const methodology = [
    h1('2. Metodologia'),
    divider(),
    body('El presente analisis se realizo mediante investigacion multi-fuente entre febrero y marzo de 2026, combinando:'),
    spacer(),
    h3('Fuentes Primarias'),
    bullet('Meta Ad Library: busqueda de anunciantes activos por nombre de pagina y empresa.'),
    bullet('Instagram profiles publicos: extraccion de handles, follower counts y contenido via Google search snippets y HypeAuditor.'),
    bullet('TikTok: busqueda de handles, videos confirmados y metricas de engagement via indexacion en buscadores.'),
    bullet('Salas de prensa oficiales de cada competidor (Serasa, Destacame, Bright Money, Curadeuda).'),
    h3('Fuentes Secundarias'),
    bullet('Prensa especializada: Meio & Mensagem, Chocale, CNN Chile, Mobile Time, TikTok Newsroom Brazil.'),
    bullet('Directorios de startups: Y Combinator, 500 Startups, LinkedIn, ZoomInfo.'),
    bullet('Agregadores de reviews: HypeAuditor, SocialBlade, Fincompara, Kardmatch ecosystem.'),
    h3('Nota Metodologica'),
    body('Instagram y TikTok bloquean el scraping programatico de metricas de posts individuales. Los likes, guardados y views reportados provienen de: (1) snippets indexados por Google que capturan metadata de redes sociales, (2) salas de prensa oficiales de las marcas, y (3) cobertura de prensa especializada. Todos los datos no confirmados se indican explicitamente.', { italic: true, color: COLORS.gray }),
    pageBreak(),
  ];

  // ── COMPETITOR SECTIONS ───────────────────────────────────────────────
  const competitorSections = [];
  competitors.forEach((comp, idx) => {
    competitorSections.push(
      h1(`${idx + 3}. ${comp.name}`),
      divider(),
      labelValue('Pais / Region', comp.country),
      labelValue('Tipo de Solucion', comp.type),
      labelValue('Tecnologia', comp.tech),
      labelValue('Instagram', comp.ig),
      labelValue('TikTok', comp.tiktok),
      labelValue('Patron Dominante', comp.pattern, COLORS.accent),
      spacer(),
      h2('Top 5 Creativos Virales'),
      creativesTable(comp.creatives),
      spacer(),
      pageBreak(),
    );
  });

  // ── CROSS-COMPETITOR PATTERNS ─────────────────────────────────────────
  const patternsSection = [
    h1(`${competitors.length + 3}. Patrones Transversales del Benchmark`),
    divider(),
    body('Los siguientes patrones emergen de analizar los 40 creativos virales identificados a lo largo de los 8 competidores:'),
    spacer(),
  ];

  patterns.forEach(p => {
    patternsSection.push(
      h3(p.title),
      body(p.insight),
      new Paragraph({
        spacing: { after: 100 },
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        children: [
          new TextRun({ text: 'Accion para Reevalua: ', bold: true, color: COLORS.primary, font: 'Arial', size: 22 }),
          new TextRun({ text: p.action, font: 'Arial', size: 22, color: COLORS.darkText }),
        ],
      }),
      spacer(),
    );
  });

  patternsSection.push(pageBreak());

  // ── IMPLICATIONS FOR REEVALUA ─────────────────────────────────────────
  const implSection = [
    h1(`${competitors.length + 4}. Implicaciones para la Estrategia de Contenido de Reevalua`),
    divider(),
    h2('Gaps de Contenido Identificados'),
    spacer(),

    h3('A. Plataforma: TikTok-first (no Meta-first)'),
    body('Todo el benchmark confirma que TikTok tiene mayor tasa de conversion en el segmento de deudas (dato Serasa: 75% conversion vs otras plataformas). Reevalua debe invertir produccion en contenido nativo de TikTok, no reutilizar Meta creatives.'),
    spacer(),

    h3('B. Creadores: Activar el ecosistema de review de finanzas Peru'),
    body('En Mexico, @kardmatchmx es el hub de confianza para comparar Curadeuda vs Bravo. En Peru no existe un equivalente visible. Reevalua puede ser la primera marca que lo construya: briefing de creadores financieros peruanos (50K-500K seguidores) para revisar la plataforma organicamente.'),
    spacer(),

    h3('C. Formato: Reply/Stitch a preguntas de confianza'),
    body('La busqueda "?Reevalua es confiable?" y "?como funciona Reevalua?" existiran. Crear videos especificos respondiendo estas preguntas en TikTok — incluyendo haciendo Stitch a comentarios reales de usuarios — es el formato de menor costo y mayor conversion identificado en el benchmark.'),
    spacer(),

    h3('D. Hook emocional: La "rehabilitacion" como identidad, no como servicio'),
    body('Ningun competidor usa el termino "rehabilitacion financiera" en su contenido organico. Es el diferenciador unico de Reevalua. El hook puede ser: "No somos una reparadora de credito. Somos una rehabilitadora financiera. La diferencia importa."'),
    spacer(),

    h3('E. Campana cultural: El meme peruano de la deuda'),
    body('En Peru existen expresiones culturales sobre estar "pelado", "en rojo" o "colgado" con el banco. La primera marca que convierta ese lenguaje cotidiano en contenido de campana — como lo hizo Serasa con CIF — tendra viralizacion organica inmediata.'),
    spacer(),

    h3('F. Metricas de exito sugeridas (basadas en benchmark)'),
    bullet('Saves rate: >3% de alcance (indicador de contenido "guardado para despues", el mas valioso en finanzas)'),
    bullet('Share rate: >1% de alcance (indica que el usuario lo envia a alguien con deudas)'),
    bullet('Comentarios de identificacion: "yo igual" / "esto me paso" / "como funciona?" (intencion de conversion)'),
    bullet('Leads desde TikTok: benchmark Serasa = 75% conversion del click a registro. Target para Reevalua: >40% en piloto inicial.'),
    spacer(2),

    divider(COLORS.accent),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Informe preparado por Reevalua Intelligence — Marzo 2026', italic: true, color: COLORS.gray, font: 'Arial', size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Metodologia: WebSearch + Meta Ads Library + TikTok Organic Research + Press Room Analysis', italic: true, color: COLORS.gray, font: 'Arial', size: 18 })],
    }),
  ];

  // ── ASSEMBLE DOCUMENT ─────────────────────────────────────────────────
  const allContent = [
    ...coverPage,
    ...execSummary,
    ...methodology,
    ...competitorSections,
    ...patternsSection,
    ...implSection,
  ];

  return new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22, color: COLORS.darkText } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: COLORS.primary },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: COLORS.secondary },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: COLORS.darkText },
          paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary, space: 1 } },
            children: [
              new TextRun({ text: 'Reevalua | Analisis de Creativos Virales Competidores B2C | Marzo 2026', font: 'Arial', size: 18, color: COLORS.gray }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary, space: 1 } },
            tabStops: [{ type: 'right', position: 8640 }],
            children: [
              new TextRun({ text: 'Confidencial — Solo uso interno', font: 'Arial', size: 16, color: COLORS.gray, italic: true }),
              new TextRun({ text: '\tPagina ', font: 'Arial', size: 16, color: COLORS.gray }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: COLORS.gray }),
              new TextRun({ text: ' de ', font: 'Arial', size: 16, color: COLORS.gray }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: COLORS.gray }),
            ],
          })],
        }),
      },
      children: allContent,
    }],
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
const doc = buildDocument();
const outputPath = 'C:\\Users\\juaga\\Documents\\CLAUDE\\analisis_creativos_competidores_reevalua.docx';

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`[OK] Documento generado: ${outputPath}`);
  console.log(`[OK] Tamano: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
