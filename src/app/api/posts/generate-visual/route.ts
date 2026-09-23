import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Resvg } from '@resvg/resvg-js';
import { saveImageFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function wrapSvgText(text: string, maxCharsPerLine: number = 34): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt = '',
      title = 'Visual',
      style = '',
      directionTitle = '',
      postContent = '',
      stylePreset: explicitPreset = '',
      version = 1,
    } = body;

    if (!prompt && !postContent) {
      return NextResponse.json(
        { error: { message: 'A prompt or post content is required' } },
        { status: 400 }
      );
    }

    // Determine the style category
    const combinedContext = `${explicitPreset} ${style} ${directionTitle} ${prompt} ${postContent}`.toLowerCase();
    let styleCategory: '3d-arrow' | '3d-checklist' | '3d-chart' | 'bold-data' | 'strategy-metaphor' | 'workspace' | 'white-editorial' = 'white-editorial';

    if (explicitPreset && ['3d-arrow', '3d-checklist', '3d-chart', 'bold-data', 'strategy-metaphor', 'workspace', 'white-editorial'].includes(explicitPreset)) {
      styleCategory = explicitPreset as any;
    } else if (/arrow|growth.*curve|trajectory|upward/i.test(combinedContext)) {
      styleCategory = '3d-arrow';
    } else if (/check|playbook|task|achievement|action|framework/i.test(combinedContext)) {
      styleCategory = '3d-checklist';
    } else if (/chart|pillar|metric.*pillar|results|bar\s*graph/i.test(combinedContext)) {
      styleCategory = '3d-chart';
    } else if (/data|highlight|number|percent|stat|127|conversion/i.test(combinedContext)) {
      styleCategory = 'bold-data';
    } else if (/chess|crossroad|strategy|metaphor|equilibrium/i.test(combinedContext)) {
      styleCategory = 'strategy-metaphor';
    } else if (/workspace|behind.*scene|desk|notebook|morning/i.test(combinedContext)) {
      styleCategory = 'workspace';
    } else {
      styleCategory = 'white-editorial';
    }

    const cleanTitle = (directionTitle || title || styleCategory)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 24);
    const uniqueId = `${Date.now()}_v${version}_${Math.random().toString(36).slice(2, 7)}`;
    const finalPngFilename = `ai_${cleanTitle}_${uniqueId}.png`;

    // AI Semantic Extraction (extracts punchy stats, headlines, bullets tailored to the post)
    const apiKey = process.env.GEMINI_API_KEY;
    let extractedData = {
      metric: '127%',
      metricLabel: 'More conversion on genuine intent signals',
      headline: (directionTitle || title || 'STRATEGIC MOMENTUM').toUpperCase().slice(0, 36),
      subtitle: 'When quality compounding replaces brute-force volume.',
      takeaway: 'Focus on high-intent conversion rather than vanity volume.',
      checklistItems: [
        'Prioritize high-intent signals over lead volume',
        'Filter stale deals early to preserve focus',
        'Build compounding trust with genuine buyers',
      ],
    };

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const analysisPrompt = `Given this LinkedIn post content:
"${postContent.slice(0, 1200)}"
Title/Hook: "${title}"
Direction: "${directionTitle}"
Target Style: "${styleCategory}"

Extract a JSON object with:
- "metric": A punchy percentage or multiplier from the post (e.g., "127%", "3.4x", "82%", "10x", "$2.4M"). If none in post, provide a realistic viral metric like "127%" or "3.4x".
- "metricLabel": A 3-6 word sleek description for the metric.
- "headline": A bold 2-5 word headline in ALL CAPS.
- "subtitle": One 6-12 word crisp context sentence.
- "takeaway": One 10-18 word sharp contrarian takeaway sentence.
- "checklistItems": Exactly 3 punchy actionable points (each 5-9 words).

Return strictly JSON.`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: analysisPrompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(res.text || '{}');
        if (parsed.headline) extractedData.headline = parsed.headline.toUpperCase();
        if (parsed.metric) extractedData.metric = parsed.metric;
        if (parsed.metricLabel) extractedData.metricLabel = parsed.metricLabel;
        if (parsed.subtitle) extractedData.subtitle = parsed.subtitle;
        if (parsed.takeaway) extractedData.takeaway = parsed.takeaway;
        if (Array.isArray(parsed.checklistItems) && parsed.checklistItems.length >= 3) {
          extractedData.checklistItems = parsed.checklistItems.slice(0, 3);
        }
      } catch (err: any) {
        console.warn('Gemini extraction fallback:', err?.message);
      }
    }

    // Render the specific visual template
    let svgMarkup = '';
    let canvasWidth = 1080;
    let canvasHeight = 1080;

    const hTitle = escapeXml(extractedData.headline);
    const hSub = escapeXml(extractedData.subtitle);
    const hMetric = escapeXml(extractedData.metric);
    const hMetricLabel = escapeXml(extractedData.metricLabel);
    const hTakeaway = escapeXml(extractedData.takeaway);
    const check1 = escapeXml(extractedData.checklistItems[0]);
    const check2 = escapeXml(extractedData.checklistItems[1]);
    const check3 = escapeXml(extractedData.checklistItems[2]);

    if (styleCategory === 'bold-data') {
      // 1. Bold Data Point Highlight (1200x627 Landscape)
      canvasWidth = 1200;
      canvasHeight = 627;
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 627" width="1200" height="627">
  <defs>
    <radialGradient id="navyGlow" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#0e1b3d"/>
      <stop offset="60%" stop-color="#080f24"/>
      <stop offset="100%" stop-color="#040813"/>
    </radialGradient>
    <filter id="coralGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#ff5733" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1200" height="627" fill="url(#navyGlow)"/>

  <!-- Top Pill -->
  <g transform="translate(480, 64)">
    <rect width="240" height="34" rx="17" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
    <text x="120" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="2">DATA POINT HIGHLIGHT</text>
  </g>

  <!-- Massive Bold Number in vibrant coral-orange -->
  <text x="600" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="168" font-weight="900" fill="#ff5733" text-anchor="middle" letter-spacing="-4" filter="url(#coralGlow)">
    ${hMetric}
  </text>

  <!-- Sleek, small white sans-serif font below -->
  <text x="600" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">
    ${hMetricLabel}
  </text>

  <!-- Divider & Context Footer -->
  <line x1="220" y1="510" x2="980" y2="510" stroke="rgba(255, 255, 255, 0.09)" stroke-width="1"/>
  <text x="600" y="548" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle" letter-spacing="2">
    ${hTitle} · HIGH CONTRAST REPORT
  </text>
</svg>`;
    } else if (styleCategory === '3d-arrow') {
      // 2. 3D Arrow Concept (Growth/Direction) - White Natural 3D Style (1080x1080)
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="offWhiteBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <filter id="studioFloorShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="36" stdDeviation="30" flood-color="#0f172a" flood-opacity="0.12"/>
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <linearGradient id="arrowFacetA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="arrowFacetB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#offWhiteBg)"/>

  <!-- Top Badge -->
  <g transform="translate(90, 80)">
    <rect width="230" height="34" rx="17" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="115" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0a66c2" text-anchor="middle" letter-spacing="2">3D GROWTH ARROW</text>
  </g>

  <!-- Typography at Top -->
  <text x="90" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#0f172a" letter-spacing="-0.5">
    ${hTitle}
  </text>
  <text x="90" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#64748b">
    ${hSub}
  </text>

  <!-- Subtle Studio Floor Horizon Line -->
  <line x1="90" y1="880" x2="990" y2="880" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6 6"/>

  <!-- Giant 3D Matte White Arrow with Soft Studio Shadows -->
  <g filter="url(#studioFloorShadow)">
    <!-- Base curve shaft facet 1 (illuminated upper edge) -->
    <path d="M 210 840 C 370 840 540 760 670 520 L 730 550 C 580 800 400 880 210 880 Z" fill="url(#arrowFacetA)"/>
    <!-- Base curve shaft facet 2 (shadow edge) -->
    <path d="M 210 880 C 400 880 580 800 730 550 L 700 590 C 560 820 370 900 210 900 Z" fill="url(#arrowFacetB)"/>
    <!-- Arrow Head 3D polygon -->
    <polygon points="630,540 850,340 790,620 740,570 630,540" fill="url(#arrowFacetA)" stroke="#e2e8f0" stroke-width="2"/>
    <polygon points="790,620 850,340 870,390 810,640" fill="url(#arrowFacetB)"/>
  </g>

  <!-- Lower Takeaway Overlay Card -->
  <g transform="translate(90, 930)">
    <text x="0" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0f172a">
      KEY PRINCIPLE:
    </text>
    <text x="140" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500" fill="#475569">
      ${hTakeaway}
    </text>
  </g>
</svg>`;
    } else if (styleCategory === '3d-checklist') {
      // 3. 3D Checklist Concept (Achievement/Action) - 1200x627 Landscape
      canvasWidth = 1200;
      canvasHeight = 627;
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 627" width="1200" height="627">
  <defs>
    <linearGradient id="checkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="boxDepthShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.10"/>
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.05"/>
    </filter>
    <linearGradient id="boxGloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="url(#checkBg)"/>

  <!-- Giant 3D White Checkbox on Left with Soft Dimensional Shadows -->
  <g transform="translate(130, 145)" filter="url(#boxDepthShadow)">
    <rect width="280" height="280" rx="52" fill="url(#boxGloss)" stroke="#e2e8f0" stroke-width="3"/>
    <!-- Inset Chamber with soft inner shadow -->
    <rect x="26" y="26" width="228" height="228" rx="38" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <!-- Giant Emerald 3D Checkmark -->
    <path d="M 72 144 L 118 190 L 210 96" fill="none" stroke="#10b981" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- High-end Tech Startup Playbook Typography on Right -->
  <g transform="translate(480, 155)">
    <rect width="200" height="32" rx="16" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
    <text x="100" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#0f172a" text-anchor="middle" letter-spacing="2">3D EXECUTION PLAYBOOK</text>

    <text x="0" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="800" fill="#0f172a" letter-spacing="-0.5">
      ${hTitle}
    </text>

    <!-- Checklist Framework Steps -->
    <g transform="translate(0, 130)">
      <circle cx="12" cy="12" r="11" fill="#10b981" fill-opacity="0.15"/>
      <path d="M 7 12 L 11 16 L 17 8" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <text x="38" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#334155">${check1}</text>
    </g>
    <g transform="translate(0, 185)">
      <circle cx="12" cy="12" r="11" fill="#10b981" fill-opacity="0.15"/>
      <path d="M 7 12 L 11 16 L 17 8" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <text x="38" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#334155">${check2}</text>
    </g>
    <g transform="translate(0, 240)">
      <circle cx="12" cy="12" r="11" fill="#10b981" fill-opacity="0.15"/>
      <path d="M 7 12 L 11 16 L 17 8" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <text x="38" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#334155">${check3}</text>
    </g>
  </g>
</svg>`;
    } else if (styleCategory === '3d-chart') {
      // 4. 3D Chart Concept (Metrics/Results) - Smooth Matte White Pillars (1080x1080)
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="chartBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="pillarSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="28" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
    <filter id="tallPillarGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="32" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.12"/>
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#0a66c2" flood-opacity="0.25"/>
    </filter>
    <linearGradient id="matteWhitePillar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="pillarCap" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#chartBg)"/>

  <!-- Top Badge & Title -->
  <g transform="translate(100, 80)">
    <rect width="200" height="34" rx="17" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
    <text x="100" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a" text-anchor="middle" letter-spacing="2">3D METRIC PILLARS</text>
  </g>

  <text x="100" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#0f172a">
    ${hTitle}
  </text>
  <text x="100" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#64748b">
    ${hSub}
  </text>

  <!-- 3D Bar Graph Pillars on White Floor -->
  <g transform="translate(160, 420)">
    <!-- Pillar 1 -->
    <g transform="translate(0, 240)" filter="url(#pillarSoftShadow)">
      <rect x="0" y="20" width="135" height="200" rx="12" fill="url(#matteWhitePillar)" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="67" cy="20" rx="67" ry="18" fill="url(#pillarCap)" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="67" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#94a3b8" text-anchor="middle">STATUS QUO</text>
    </g>

    <!-- Pillar 2 -->
    <g transform="translate(190, 160)" filter="url(#pillarSoftShadow)">
      <rect x="0" y="20" width="135" height="280" rx="12" fill="url(#matteWhitePillar)" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="67" cy="20" rx="67" ry="18" fill="url(#pillarCap)" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="67" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#94a3b8" text-anchor="middle">VOLUME</text>
    </g>

    <!-- Pillar 3 -->
    <g transform="translate(380, 90)" filter="url(#pillarSoftShadow)">
      <rect x="0" y="20" width="135" height="350" rx="12" fill="url(#matteWhitePillar)" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="67" cy="20" rx="67" ry="18" fill="url(#pillarCap)" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="67" y="410" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#94a3b8" text-anchor="middle">OPTIMIZED</text>
    </g>

    <!-- Pillar 4 (The Tallest Hero Pillar with subtle elegant lighting) -->
    <g transform="translate(570, 0)" filter="url(#tallPillarGlow)">
      <rect x="0" y="20" width="145" height="440" rx="14" fill="#ffffff" stroke="#0a66c2" stroke-width="2"/>
      <ellipse cx="72" cy="20" rx="72" ry="20" fill="#0a66c2" stroke="#084d93" stroke-width="1.5"/>
      <!-- Glowing Highlight badge above tallest pillar -->
      <g transform="translate(18, -60)">
        <rect width="110" height="40" rx="20" fill="#0f172a"/>
        <text x="55" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#38bdf8" text-anchor="middle">
          ${hMetric}
        </text>
      </g>
      <text x="72" y="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0a66c2" text-anchor="middle">INTENT-DRIVEN</text>
    </g>
  </g>
</svg>`;
    } else if (styleCategory === 'strategy-metaphor') {
      // 5. Strategy & Growth Metaphor (1080x1080)
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <radialGradient id="goldenHourWash" cx="15%" cy="25%" r="85%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="45%" stop-color="#fef3c7" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#f4f4f5"/>
    </radialGradient>
    <filter id="goldenCastShadow" x="-50%" y="-20%" width="220%" height="160%">
      <feDropShadow dx="54" dy="36" stdDeviation="30" flood-color="#78350f" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1080" height="1080" fill="url(#goldenHourWash)"/>

  <!-- Minimalist Concrete Table Perspective Crossroads -->
  <g stroke="#e4e4e7" stroke-width="2" stroke-dasharray="8 8">
    <line x1="540" y1="340" x2="540" y2="880"/>
    <line x1="180" y1="610" x2="900" y2="610"/>
    <circle cx="540" cy="610" r="140" fill="none" stroke="#d4d4d8" stroke-width="1.5" stroke-dasharray="4 4"/>
  </g>

  <!-- Editorial Top Badge -->
  <g transform="translate(100, 90)">
    <rect width="230" height="34" rx="17" fill="#ffffff" stroke="#e4e4e7" stroke-width="1.5"/>
    <text x="115" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle" letter-spacing="2">STRATEGY &amp; GROWTH</text>
  </g>

  <!-- Single Chess Piece at Crossroads with Warm Side Lighting -->
  <g transform="translate(480, 460)" filter="url(#goldenCastShadow)">
    <rect x="-25" y="240" width="170" height="30" rx="8" fill="#18181b"/>
    <ellipse cx="60" cy="240" rx="80" ry="18" fill="#27272a"/>
    <path d="M 0 240 C 20 180 20 140 -10 100 C 30 100 60 70 80 20 C 110 50 120 100 100 150 C 120 180 120 220 120 240 Z" fill="#18181b"/>
    <!-- Golden side highlight -->
    <path d="M -10 100 C 30 100 60 70 80 20 C 85 45 80 80 60 110 Z" fill="#f59e0b" fill-opacity="0.85"/>
  </g>

  <!-- Editorial Headline & Perspective -->
  <g transform="translate(100, 840)">
    <text x="0" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#0f172a" letter-spacing="-0.5">
      ${hTitle}
    </text>
    <text x="0" y="95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#71717a">
      ${hTakeaway}
    </text>
  </g>
</svg>`;
    } else if (styleCategory === 'workspace') {
      // 6. Behind-the-Scenes / Workspace (1080x1080)
      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="morningLightWash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="50%" stop-color="#f9f6f0"/>
      <stop offset="100%" stop-color="#f3ede2"/>
    </linearGradient>
    <filter id="workspaceSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#451a03" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="1080" height="1080" fill="url(#morningLightWash)"/>

  <!-- Top Badge -->
  <g transform="translate(100, 80)">
    <rect width="230" height="34" rx="17" fill="#ffffff" stroke="#e7e5e4" stroke-width="1"/>
    <text x="115" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#78350f" text-anchor="middle" letter-spacing="2">BEHIND THE SCENES</text>
  </g>

  <!-- Typography at Top -->
  <text x="100" y="175" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#1c1917">
    ${hTitle}
  </text>
  <text x="100" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#78716c">
    ${hSub}
  </text>

  <!-- Workspace Illustration Composition -->
  <g transform="translate(140, 360)">
    <!-- Modern Laptop with Data Chart -->
    <g transform="translate(340, 60)" filter="url(#workspaceSoftShadow)">
      <rect x="-40" y="320" width="520" height="18" rx="9" fill="#d6d3d1"/>
      <rect x="180" y="320" width="80" height="6" rx="3" fill="#a8a29e"/>
      <rect x="0" y="0" width="440" height="320" rx="14" fill="#1c1917"/>
      <rect x="16" y="16" width="408" height="288" rx="8" fill="#0f172a"/>
      <polyline points="40,240 120,200 200,210 280,120 360,80" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="360" cy="80" r="8" fill="#38bdf8"/>
    </g>

    <!-- Open Notebook with Action Takeaways -->
    <g transform="translate(0, 180)" filter="url(#workspaceSoftShadow)">
      <rect width="280" height="360" rx="12" fill="#ffffff" stroke="#e7e5e4" stroke-width="2"/>
      <line x1="30" y1="40" x2="250" y2="40" stroke="#0a66c2" stroke-width="2"/>
      <line x1="30" y1="90" x2="250" y2="90" stroke="#e7e5e4" stroke-width="1.5"/>
      <line x1="30" y1="140" x2="250" y2="140" stroke="#e7e5e4" stroke-width="1.5"/>
      <line x1="30" y1="190" x2="250" y2="190" stroke="#e7e5e4" stroke-width="1.5"/>
      <line x1="30" y1="240" x2="250" y2="240" stroke="#e7e5e4" stroke-width="1.5"/>
      <text x="30" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">PRINCIPLE 01</text>
      <text x="30" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#57534e">${check1}</text>
      <text x="30" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#57534e">${check2}</text>
      <text x="30" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#57534e">${check3}</text>
    </g>

    <!-- Steaming Ceramic Coffee Mug -->
    <g transform="translate(680, 280)" filter="url(#workspaceSoftShadow)">
      <rect x="0" y="40" width="100" height="120" rx="16" fill="#ffffff" stroke="#e7e5e4" stroke-width="2"/>
      <path d="M 100 65 C 130 65 130 135 100 135" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
      <path d="M 100 65 C 130 65 130 135 100 135" fill="none" stroke="#e7e5e4" stroke-width="2" stroke-linecap="round"/>
      <path d="M 35 25 C 30 15 45 5 40 -10" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/>
      <path d="M 65 25 C 60 15 75 5 70 -10" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/>
    </g>
  </g>
</svg>`;
    } else {
      // 7. White Natural LinkedIn Editorial (Feed-First Native) (1080x1080)
      const cleanExcerpt = escapeXml((postContent || prompt || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180));
      const excerptLines = wrapSvgText(cleanExcerpt, 38).slice(0, 4);
      const quoteSpans = excerptLines
        .map(
          (line, idx) =>
            `<tspan x="110" dy="${idx === 0 ? 0 : 54}" font-size="30" font-weight="500" fill="#1e293b">${line}</tspan>`
        )
        .join('\n');

      svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="whiteEditorialBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="cleanCardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="1080" height="1080" fill="url(#whiteEditorialBg)"/>

  <!-- Top Badge -->
  <g transform="translate(90, 90)">
    <rect width="210" height="36" rx="18" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="105" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a" text-anchor="middle" letter-spacing="2">LINKEDIN EDITORIAL</text>
  </g>

  <!-- Main Headline in High Contrast Dark Slate -->
  <text x="90" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#0f172a" letter-spacing="-1">
    ${hTitle}
  </text>
  <text x="90" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#64748b">
    ${hSub}
  </text>

  <!-- Central Clean White Card with Subtle Shadow -->
  <g transform="translate(90, 360)" filter="url(#cleanCardShadow)">
    <rect width="900" height="420" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <line x1="0" y1="0" x2="900" y2="0" stroke="#0a66c2" stroke-width="4"/>

    <!-- Quotation Mark -->
    <text x="50" y="90" font-family="Georgia, serif" font-size="76" font-weight="bold" fill="#0a66c2" fill-opacity="0.3">“</text>

    <!-- Excerpt Body -->
    <text x="110" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
      ${quoteSpans}
    </text>

    <!-- Card Footer -->
    <line x1="50" y1="330" x2="850" y2="330" stroke="#f1f5f9" stroke-width="1.5"/>
    <text x="50" y="370" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#0a66c2" letter-spacing="1">
      EXECUTIVE PERSPECTIVE
    </text>
    <text x="850" y="370" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#94a3b8" text-anchor="end">
      AUTHENTIC THOUGHT LEADERSHIP
    </text>
  </g>

  <!-- Bottom Attribution Footer -->
  <line x1="90" y1="910" x2="990" y2="910" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="90" y="960" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#0f172a">
    ALEX VANCE
  </text>
  <text x="210" y="960" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500" fill="#64748b">
    • FOUNDER &amp; CEO
  </text>
  <text x="990" y="960" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0a66c2" text-anchor="end">
    LINKEDIN CONTENT SYSTEM
  </text>
</svg>`;
    }

    const resvg = new Resvg(svgMarkup, {
      fitTo: { mode: 'width', value: canvasWidth },
    });
    const pngBuffer = resvg.render().asPng();
    await saveImageFile(finalPngFilename, pngBuffer);

    // Build public URL safely using APP_URL or forward proxy headers
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = appUrl || `${proto}://${host}`;
    const publicUrl = `${baseUrl}/api/uploads/${finalPngFilename}`;

    const styleDisplayNames: Record<string, string> = {
      '3d-arrow': '3D White Arrow',
      '3d-checklist': '3D White Checklist',
      '3d-chart': '3D White Metrics Chart',
      'bold-data': 'Bold Data Point Highlight',
      'strategy-metaphor': 'Strategy & Growth Metaphor',
      'workspace': 'Behind-the-Scenes Workspace',
      'white-editorial': 'White Natural LinkedIn Editorial',
    };

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: `${(directionTitle || title || styleCategory).toUpperCase()}.png`,
      style: styleDisplayNames[styleCategory] || style || 'LinkedIn Visual',
      stylePreset: styleCategory,
      prompt,
    });
  } catch (error: any) {
    console.error('Error generating visual:', error);
    return NextResponse.json(
      { error: { message: error?.message || 'Failed to generate visual asset' } },
      { status: 500 }
    );
  }
}
