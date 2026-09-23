import { Resvg } from '@resvg/resvg-js';
import { saveImageFile } from '../storage';

export interface DiagramOptions {
  title: string;
  subtitle?: string;
  archetype: string;
  vertical: string;
  steps?: Array<{ title: string; desc: string; tool?: string; tag?: string }>;
  comparison?: {
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  gridItems?: Array<{ title: string; desc: string; iconText?: string }>;
  theme?: 'dark' | 'blueprint' | 'minimal' | 'cyber';
  authorName?: string;
  authorHandle?: string;
}

/**
 * Escapes XML/SVG special characters to prevent rendering syntax errors.
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an SVG string based on the archetype and options.
 */
export function buildDiagramSvg(options: DiagramOptions): string {
  const width = 1200;
  const height = 800;
  const theme = options.theme || 'dark';

  const isDark = theme === 'dark' || theme === 'cyber';
  const bgColor = theme === 'cyber' ? '#090d16' : theme === 'blueprint' ? '#081e3a' : isDark ? '#0b1120' : '#f8fafc';
  const cardBg = theme === 'cyber' ? '#111827' : theme === 'blueprint' ? '#0f2b54' : isDark ? '#1e293b' : '#ffffff';
  const cardBorder = theme === 'cyber' ? '#374151' : theme === 'blueprint' ? '#1d4ed8' : isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark || theme === 'blueprint' ? '#ffffff' : '#0f172a';
  const textSecondary = isDark || theme === 'blueprint' ? '#94a3b8' : '#64748b';
  const accentColor = theme === 'cyber' ? '#8b5cf6' : theme === 'blueprint' ? '#38bdf8' : '#0a66c2';
  const accentLight = theme === 'cyber' ? '#c084fc' : theme === 'blueprint' ? '#7dd3fc' : '#60a5fa';

  const author = escapeXml(options.authorName || 'Tibin Jacob');
  const handle = escapeXml(options.authorHandle || '@tibinjacob');
  const safeTitle = escapeXml(options.title || 'AI Production Architecture');
  const safeSubtitle = escapeXml(options.subtitle || '2026 High-Performance Execution System');

  let contentSvg = '';

  if (options.comparison && options.archetype.toLowerCase().includes('comparison')) {
    // 2-Column Comparison Matrix
    const { leftTitle, leftItems, rightTitle, rightItems } = options.comparison;
    contentSvg = `
      <!-- Comparison Container -->
      <g transform="translate(80, 180)">
        <!-- Left: Traditional / Old Way -->
        <rect x="0" y="0" width="490" height="490" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="2"/>
        <rect x="0" y="0" width="490" height="60" rx="16" fill="${isDark ? '#37181d' : '#ffe4e6'}"/>
        <text x="245" y="38" fill="${isDark ? '#f87171' : '#b91c1c'}" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">❌ ${escapeXml(leftTitle)}</text>
        ${leftItems
          .map(
            (item, idx) => `
          <g transform="translate(30, ${100 + idx * 75})">
            <circle cx="15" cy="15" r="14" fill="${isDark ? '#451a1a' : '#fecdd3'}"/>
            <text x="15" y="21" fill="${isDark ? '#f87171' : '#e11d48'}" font-size="16" font-weight="bold" font-family="sans-serif" text-anchor="middle">✕</text>
            <text x="45" y="21" fill="${textPrimary}" font-size="16" font-family="sans-serif">${escapeXml(item)}</text>
          </g>
        `
          )
          .join('')}

        <!-- Right: Modern 2026 AI Engine -->
        <rect x="550" y="0" width="490" height="490" rx="16" fill="${cardBg}" stroke="${accentColor}" stroke-width="2.5"/>
        <rect x="550" y="0" width="490" height="60" rx="16" fill="${accentColor}"/>
        <text x="795" y="38" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">⚡ ${escapeXml(rightTitle)}</text>
        ${rightItems
          .map(
            (item, idx) => `
          <g transform="translate(580, ${100 + idx * 75})">
            <circle cx="15" cy="15" r="14" fill="${isDark ? '#064e3b' : '#d1fae5'}"/>
            <text x="15" y="21" fill="${isDark ? '#34d399' : '#059669'}" font-size="16" font-weight="bold" font-family="sans-serif" text-anchor="middle">✓</text>
            <text x="45" y="21" fill="${textPrimary}" font-size="16" font-weight="600" font-family="sans-serif">${escapeXml(item)}</text>
          </g>
        `
          )
          .join('')}
      </g>
    `;
  } else if (options.gridItems && options.gridItems.length >= 6) {
    // 3x3 Grid Layout
    const items = options.gridItems.slice(0, 9);
    contentSvg = `
      <g transform="translate(80, 180)">
        ${items
          .map((item, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const x = col * 360;
            const y = row * 160;
            return `
            <g transform="translate(${x}, ${y})">
              <rect width="330" height="135" rx="12" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5"/>
              <rect x="0" y="0" width="330" height="6" rx="3" fill="${accentColor}"/>
              <rect x="18" y="22" width="28" height="28" rx="6" fill="${accentColor}" opacity="0.15"/>
              <text x="32" y="41" fill="${accentLight}" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle">${idx + 1}</text>
              <text x="56" y="42" fill="${textPrimary}" font-size="16" font-weight="bold" font-family="sans-serif">${escapeXml(item.title)}</text>
              <text x="18" y="76" fill="${textSecondary}" font-size="13.5" font-family="sans-serif">${escapeXml(item.desc.slice(0, 42))}</text>
              <text x="18" y="98" fill="${textSecondary}" font-size="13.5" font-family="sans-serif">${escapeXml(item.desc.slice(42, 85))}</text>
            </g>
          `;
          })
          .join('')}
      </g>
    `;
  } else {
    // Default: 4-Stage Architecture / Workflow Pipeline Flow
    const steps =
      options.steps && options.steps.length > 0
        ? options.steps
        : [
            { title: '1. Ingestion & Trigger', desc: 'Signal monitor on hiring & tech stack changes', tool: 'Apollo / Clay' },
            { title: '2. Multi-Model AI Layer', desc: 'Contextual synthesis & persona reasoning', tool: 'Gemini / Claude' },
            { title: '3. Execution & Validation', desc: 'Dynamic icebreaker generation & deliverability check', tool: 'Smartlead' },
            { title: '4. Pipeline Conversion', desc: 'Qualified discovery calls auto-booked on calendar', tool: 'CRM Sync' },
          ];

    contentSvg = `
      <g transform="translate(80, 200)">
        ${steps
          .map((step, idx) => {
            const x = idx * 265;
            const isLast = idx === steps.length - 1;
            return `
            <!-- Step ${idx + 1} Box -->
            <g transform="translate(${x}, 0)">
              <rect width="240" height="420" rx="16" fill="${cardBg}" stroke="${isLast ? accentColor : cardBorder}" stroke-width="${isLast ? '2.5' : '1.5'}"/>
              
              <!-- Step Header Pill -->
              <rect x="20" y="24" width="70" height="26" rx="8" fill="${accentColor}" opacity="0.2"/>
              <text x="55" y="42" fill="${accentLight}" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">PHASE 0${idx + 1}</text>
              
              <!-- Step Title -->
              <text x="20" y="85" fill="${textPrimary}" font-size="17" font-weight="bold" font-family="sans-serif">${escapeXml(step.title.slice(0, 20))}</text>
              ${step.title.length > 20 ? `<text x="20" y="108" fill="${textPrimary}" font-size="16" font-weight="bold" font-family="sans-serif">${escapeXml(step.title.slice(20, 42))}</text>` : ''}
              
              <!-- Divider -->
              <line x1="20" y1="130" x2="220" y2="130" stroke="${cardBorder}" stroke-width="1"/>
              
              <!-- Description Text -->
              <text x="20" y="160" fill="${textSecondary}" font-size="14" font-family="sans-serif">${escapeXml(step.desc.slice(0, 26))}</text>
              <text x="20" y="185" fill="${textSecondary}" font-size="14" font-family="sans-serif">${escapeXml(step.desc.slice(26, 52))}</text>
              <text x="20" y="210" fill="${textSecondary}" font-size="14" font-family="sans-serif">${escapeXml(step.desc.slice(52, 78))}</text>
              
              <!-- Tool / Entity Badge -->
              ${
                step.tool
                  ? `
                <g transform="translate(20, 340)">
                  <rect width="200" height="42" rx="10" fill="${isDark ? '#0f172a' : '#f1f5f9'}" stroke="${cardBorder}" stroke-width="1"/>
                  <text x="100" y="26" fill="${accentLight}" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="middle">⚙️ ${escapeXml(step.tool)}</text>
                </g>
              `
                  : ''
              }
            </g>

            <!-- Connector Arrow -->
            ${
              !isLast
                ? `
              <g transform="translate(${x + 242}, 210)">
                <line x1="0" y1="0" x2="18" y2="0" stroke="${accentColor}" stroke-width="3" stroke-dasharray="4,3"/>
                <polygon points="18,-6 24,0 18,6" fill="${accentColor}"/>
              </g>
            `
                : ''
            }
          `;
          })
          .join('')}
      </g>
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Canvas -->
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      
      <!-- Subtle Tech Grid Lines -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${isDark ? '#1e293b' : '#e2e8f0'}" stroke-width="0.75" opacity="0.6"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grid)" />

      <!-- Top Header Bar -->
      <g transform="translate(80, 60)">
        <!-- Archetype Badge -->
        <rect x="0" y="0" width="220" height="32" rx="8" fill="${accentColor}"/>
        <text x="110" y="21" fill="#ffffff" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">⚡ ${escapeXml(options.archetype.toUpperCase())}</text>

        <!-- Main Headline -->
        <text x="0" y="70" fill="${textPrimary}" font-size="32" font-weight="bold" font-family="sans-serif">${safeTitle}</text>
        <text x="0" y="100" fill="${textSecondary}" font-size="18" font-family="sans-serif">${safeSubtitle}</text>
      </g>

      <!-- Creator Watermark (Top Right) -->
      <g transform="translate(900, 65)">
        <circle cx="20" cy="20" r="18" fill="${accentColor}" opacity="0.2"/>
        <text x="20" y="26" fill="${accentLight}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${author.slice(0, 2).toUpperCase()}</text>
        <text x="48" y="18" fill="${textPrimary}" font-size="15" font-weight="bold" font-family="sans-serif">${author}</text>
        <text x="48" y="36" fill="${textSecondary}" font-size="13" font-family="sans-serif">${handle}</text>
      </g>

      <!-- Main Diagram Visual Content -->
      ${contentSvg}

      <!-- Bottom Metric & Attribution Bar -->
      <g transform="translate(80, 740)">
        <line x1="0" y1="0" x2="1040" y2="0" stroke="${cardBorder}" stroke-width="1.5"/>
        <text x="0" y="32" fill="${textSecondary}" font-size="13" font-family="sans-serif">LinkedIn Visual Architecture Engine • Retention Optimization Score: 98/100</text>
        <text x="1040" y="32" fill="${accentLight}" font-size="13" font-weight="bold" font-family="sans-serif" text-anchor="end">Pinch to Zoom 🔍</text>
      </g>
    </svg>
  `;
}

/**
 * Renders an SVG diagram into a PNG Buffer and saves it using saveImageFile.
 * Returns the public image URL.
 */
export async function renderAndSaveDiagram(
  options: DiagramOptions,
  baseUrl: string
): Promise<{ url: string; filename: string }> {
  const svgString = buildDiagramSvg(options);
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Liberation Sans',
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const cleanArchetype = options.archetype.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `repurposed_${cleanArchetype}_${Date.now()}.png`;

  await saveImageFile(filename, pngBuffer);
  const publicUrl = `${baseUrl.replace(/\/$/, '')}/api/uploads/${filename}`;

  return {
    url: publicUrl,
    filename,
  };
}
