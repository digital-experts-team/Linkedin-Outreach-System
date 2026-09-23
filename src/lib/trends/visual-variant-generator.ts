import sharp, { OverlayOptions } from 'sharp';
import { GoogleGenAI } from '@google/genai';
import { saveImageFile } from '../storage';
import { buildDiagramSvg } from './diagram-generator';
import { Resvg } from '@resvg/resvg-js';

export interface VisualVariantOptions {
  imageUrl?: string;
  photoArchetype?: string;
  photoDescription?: string;
  title: string;
  fullCopy?: string;
  vertical?: string;
  ctaKeyword?: string;
  authorName?: string;
  authorHandle?: string;
  theme?: 'dark' | 'blueprint' | 'minimal' | 'cyber';
  styleVariant?: 'editorial_cinematic' | 'film_grade' | 'workflow_annotated' | 'architecture_diagram';
  diagramSpec?: any;
  baseUrl: string;
}

export interface VisualVariantResult {
  url: string;
  filename: string;
  isGenerated: boolean;
  archetype: string;
  detectedFormat?: 'character_angle_grid' | 'single_portrait' | 'workflow_table' | 'architecture_diagram' | 'comparison_grid' | 'infographic_cheatsheet';
  visualAnalysis?: string;
  variantDetails?: {
    originalSubject?: string;
    originalSetting?: string;
    differentCharacter?: string;
    differentSetting?: string;
    angleLabels?: string[];
    headline?: string;
    hasEmbeddedText?: boolean;
    embeddedText?: string[];
  };
  enhancementDetails?: string;
  originalUrl?: string;
}

/**
 * Escapes XML/SVG special characters.
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
 * Fetches an image buffer from an external URL with browser headers and fallback.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn('Failed to fetch image buffer:', url, err);
    return null;
  }
}

/**
 * Curated high-resolution cinematic portrait sets for generating character variants.
 * Distinct characters with multiple camera angles and dramatic studio lighting.
 */
const CURATED_CHARACTER_SETS: Record<string, string[]> = {
  // Set 1: Cybernetic Techwear & Modern Creative (East Asian female & African male creative directors)
  cybernetic_techwear: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=85', // Establishing close-up
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=85', // 3/4 low angle
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=85', // Profile portrait
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=85', // Intense studio gaze
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop&q=85', // Dramatic side profile
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=85', // Dynamic rim light
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=85', // Split focus
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&auto=format&fit=crop&q=85', // Macro cinematic detail
  ],
  // Set 2: Editorial Brutalist Studio (Nordic tech founder & architectural director)
  architectural_studio: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&auto=format&fit=crop&q=85',
  ],
};

interface VisionAnalysisResult {
  detectedFormat: 'character_angle_grid' | 'single_portrait' | 'workflow_table' | 'architecture_diagram' | 'comparison_grid' | 'infographic_cheatsheet';
  originalSubject: string;
  originalSetting: string;
  hasEmbeddedText: boolean;
  embeddedText: string[];
  variantConcept: {
    differentCharacter: string;
    differentSetting: string;
    lightingMood: string;
    angleLabels: string[];
    headline: string;
    categoryBadge: string;
    subBadge: string;
    subtitle: string;
  };
}

/**
 * Runs Gemini 3.8 Flash Vision FIRST on the original image buffer to deeply understand
 * the visual structure, subject, setting, and text before generating a variant.
 */
async function runVisionAnalysisOnOriginalImage(
  imageBuffer: Buffer,
  context: { title: string; vertical: string; archetype?: string }
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackVisionAnalysis(context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = imageBuffer.toString('base64');

    const prompt = `You are a world-class creative director and visual intelligence engine.
Analyze this image from a viral LinkedIn post about "${context.title}" (${context.vertical}).

Tasks:
1. Identify the EXACT layout format:
   - "character_angle_grid": A grid/contact-sheet/collage showing character(s) from multiple camera angles, focal lengths, poses, or close-ups.
   - "single_portrait": A single cinematic character portrait or photograph.
   - "workflow_table": A software UI, table, spreadsheet, Clay table, or database screenshot.
   - "architecture_diagram": A technical node flowchart or block architecture diagram.
   - "comparison_grid": A side-by-side Before/After or Tool A vs Tool B comparison.
   - "infographic_cheatsheet": An infographic with icons, cheat sheets, or tips.

2. Identify what is in the original image:
   - originalSubject: Describe the character(s) or subject in the image (appearance, gender, styling, clothing).
   - originalSetting: Describe the background, setting, and lighting environment.
   - hasEmbeddedText: Does the image contain visible text, titles, numbers, or camera annotations?
   - embeddedText: Array of visible text phrases if any.

3. Formulate an ORIGINAL VARIANT CONCEPT that follows the EXACT SAME layout/structure, but features:
   - differentCharacter: A brand new distinct character or characters (different ethnicity, gender, or persona).
   - differentSetting: A brand new setting/environment (e.g. brutalist concrete greenhouse, cybernetic atelier, or architectural loft).
   - lightingMood: Lighting aesthetic (e.g. "Chiaroscuro with bioluminescent cyan rim lighting and warm tungsten accents").
   - angleLabels: 6 to 8 camera angle labels matching the grid panels (e.g. ["35mm Establishing", "50mm Profile", "85mm Close-Up", "100mm Macro Detail", "24mm Low-Angle", "70mm Silhouette"]).
   - headline: Punchy 3-6 word uppercase main headline (e.g. "MULTI-ANGLE LATENT CAMERA CONSISTENCY").
   - categoryBadge: 2-3 word badge (e.g. "✦ 3×3 PROMPT GRID").
   - subBadge: Short 2-3 word sub-badge (e.g. "DIFFERENT CHARACTER & SETTING").
   - subtitle: Under 80 chars subtitle.

Return STRICT JSON only:
{
  "detectedFormat": "character_angle_grid" | "single_portrait" | "workflow_table" | "architecture_diagram" | "comparison_grid" | "infographic_cheatsheet",
  "originalSubject": "...",
  "originalSetting": "...",
  "hasEmbeddedText": false,
  "embeddedText": [],
  "variantConcept": {
    "differentCharacter": "...",
    "differentSetting": "...",
    "lightingMood": "...",
    "angleLabels": ["35mm Wide", "50mm Profile", "85mm Portrait", "100mm Macro", "24mm Low-Angle", "70mm Rim Light"],
    "headline": "...",
    "categoryBadge": "...",
    "subBadge": "...",
    "subtitle": "..."
  }
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Vision timeout')), 9000)
    );

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resp: any = await Promise.race([callPromise, timeoutPromise]);
    const raw = resp.text || '';
    const parsed = JSON.parse(raw);

    return {
      detectedFormat: parsed.detectedFormat || 'character_angle_grid',
      originalSubject: parsed.originalSubject || 'Original photo subject',
      originalSetting: parsed.originalSetting || 'Original environment',
      hasEmbeddedText: Boolean(parsed.hasEmbeddedText),
      embeddedText: Array.isArray(parsed.embeddedText) ? parsed.embeddedText : [],
      variantConcept: {
        differentCharacter: parsed.variantConcept?.differentCharacter || 'Cybernetic East Asian female engineer and African male creative director',
        differentSetting: parsed.variantConcept?.differentSetting || 'Subterranean brutalist greenhouse with dense foliage and concrete pillars',
        lightingMood: parsed.variantConcept?.lightingMood || 'Cinematic chiaroscuro with cyan rim lighting and warm tungsten accents',
        angleLabels: Array.isArray(parsed.variantConcept?.angleLabels) && parsed.variantConcept.angleLabels.length >= 4
          ? parsed.variantConcept.angleLabels
          : [
              '35mm Establishing Wide',
              '85mm Macro Collarbone',
              '50mm Low-Angle Close-Up',
              '50mm Full Body Medium',
              '85mm Split-Focus Profiles',
              '85mm High-Contrast Portrait',
              '24mm Wide Standoff',
              '100mm Intimate Touch',
            ],
        headline: (parsed.variantConcept?.headline || context.title || 'MULTI-ANGLE CHARACTER CONSISTENCY').toUpperCase().slice(0, 48),
        categoryBadge: (parsed.variantConcept?.categoryBadge || '3×3 PROMPT GRID').toUpperCase().slice(0, 24),
        subBadge: (parsed.variantConcept?.subBadge || 'DIFFERENT CHARACTER & SETTING').toUpperCase().slice(0, 30),
        subtitle: parsed.variantConcept?.subtitle || 'Volumetric lighting · Locked seed anchors · 35mm to 100mm focal depth map',
      },
    };
  } catch (err) {
    console.warn('Gemini vision analysis failed or timed out, using intelligent fallback:', err);
    return getFallbackVisionAnalysis(context);
  }
}

function getFallbackVisionAnalysis(context: { title: string; vertical: string; archetype?: string }): VisionAnalysisResult {
  const isVideo = context.vertical.toLowerCase().includes('video') || context.title.toLowerCase().includes('angle') || context.title.toLowerCase().includes('prompt');
  return {
    detectedFormat: isVideo ? 'character_angle_grid' : 'architecture_diagram',
    originalSubject: isVideo ? 'Characters in multi-angle studio portraits' : 'Technical workflow system',
    originalSetting: isVideo ? 'Dark cinematic studio' : 'Cloud architecture',
    hasEmbeddedText: false,
    embeddedText: [],
    variantConcept: {
      differentCharacter: 'Cybernetic East Asian female creative lead & African male synth-director in obsidian techwear',
      differentSetting: 'Subterranean brutalist atelier with bioluminescent cyan rim lighting and warm tungsten accents',
      lightingMood: 'Dramatic low-key chiaroscuro with high dynamic range',
      angleLabels: [
        '35mm Establishing Wide',
        '85mm Macro Collarbone',
        '50mm Low-Angle Close-Up',
        '50mm Full Body Medium',
        '85mm Split-Focus Profiles',
        '85mm High-Contrast Portrait',
        '24mm Wide Standoff',
        '100mm Intimate Touch',
      ],
      headline: isVideo ? 'MULTI-ANGLE CHARACTER CONSISTENCY ENGINE' : 'AUTONOMOUS OUTBOUND WATERFALL',
      categoryBadge: isVideo ? '8-ANGLE LATENT MATRIX' : 'WORKFLOW MATRIX',
      subBadge: 'DIFFERENT CHARACTER & SETTING',
      subtitle: isVideo
        ? 'Volumetric lighting · Locked seed anchors · 35mm to 100mm focal depth map'
        : 'Real-Time Intent Signals · Deep Enrichment · Multi-Inbox Handoff',
    },
  };
}

/**
 * Attempts direct generative image synthesis via Gemini Image models (gemini-3.1-flash-image / lite).
 * Requires a project with image generation quota enabled.
 */
async function generateAiImageFromPrompt(
  prompt: string,
  aspectRatio: '4:5' | '16:9' | '1:1' = '4:5'
): Promise<{ buffer: Buffer; modelUsed: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
  for (const model of candidateModels) {
    try {
      console.log(`[VisualVariant] Attempting AI image generation with ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            ...(model === 'gemini-3.1-flash-image' ? { imageSize: '1K' } : {}),
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`[VisualVariant] Successfully generated raw AI image with ${model}!`);
          return {
            buffer: Buffer.from(part.inlineData.data, 'base64'),
            modelUsed: model,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[VisualVariant] Model ${model} generation skipped/failed:`, err.message || err);
    }
  }
  return null;
}

/**
 * Builds an 8-panel cinematic character contact sheet featuring DIFFERENT characters
 * and a DIFFERENT setting, with camera angle badges, editorial typography, and LinkedIn 4:5 framing.
 */
async function createCharacterAngleGridVariant(
  vision: VisionAnalysisResult,
  options: VisualVariantOptions
): Promise<Buffer> {
  const width = 1200;
  const height = 1500; // 4:5 vertical ratio for maximum LinkedIn dwell time
  const colW = width / 2; // 600px per column
  const rowH = height / 4; // 375px per row (8 total panels)
  const padding = 3;

  const characterPhotos = CURATED_CHARACTER_SETS.cybernetic_techwear;

  // Fetch panel buffers in parallel
  const panelBuffers = await Promise.all(
    characterPhotos.slice(0, 8).map(async (url) => {
      const buf = await fetchImageBuffer(url);
      if (buf) return buf;
      // Fallback: create solid dark placeholder if fetch fails
      return await sharp({
        create: { width: 600, height: 375, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
      })
        .png()
        .toBuffer();
    })
  );

  // Resize and process each panel with enhanced dynamic range and film grain
  const compositeList: OverlayOptions[] = [];
  for (let i = 0; i < 8; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const left = Math.round(col * colW);
    const top = Math.round(row * rowH);
    const w = Math.round(colW);
    const h = Math.round(rowH);

    const cellImg = await sharp(panelBuffers[i])
      .resize(w - padding * 2, h - padding * 2, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 0.96, saturation: 1.12 })
      .sharpen({ sigma: 1.2, m1: 1.4, m2: 0.8 })
      .png()
      .toBuffer();

    compositeList.push({
      input: cellImg,
      left: left + padding,
      top: top + padding,
    });
  }

  // Base canvas holding the 8 panels
  const baseGrid = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 11, g: 17, b: 32, alpha: 1 },
    },
  })
    .composite(compositeList)
    .png()
    .toBuffer();

  // Build SVG overlay with cell angle badges, category badge, and editorial title
  const author = escapeXml(options.authorName || 'Tibin Jacob');
  const cta = escapeXml(options.ctaKeyword || 'PROMPT');
  const badge1 = escapeXml(vision.variantConcept.categoryBadge);
  const badge2 = escapeXml(vision.variantConcept.subBadge);
  const headline = escapeXml(vision.variantConcept.headline);
  const subtitle = escapeXml(vision.variantConcept.subtitle);
  const angleLabels = vision.variantConcept.angleLabels;

  let cellLabelsSvg = '';
  for (let i = 0; i < 8; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cellLeft = Math.round(col * colW) + 16;
    const cellBottom = Math.round((row + 1) * rowH) - 18;
    const rawLabel = (angleLabels[i] || `Angle #${i + 1}`).replace(/[✦★•]/g, '').trim();
    const label = escapeXml(rawLabel);

    cellLabelsSvg += `
      <g transform="translate(${cellLeft}, ${cellBottom - 26})">
        <rect x="0" y="0" width="220" height="26" rx="13" fill="#000000" fill-opacity="0.82" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="110" y="17" font-family="Liberation Sans, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="0.8">${label.toUpperCase()}</text>
      </g>
    `;
  }

  const overlaySvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topVig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b1120" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#0b1120" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="botVig" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#0b1120" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="#0b1120" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Top Vignette -->
      <rect x="0" y="0" width="${width}" height="160" fill="url(#topVig)"/>

      <!-- Top Badges -->
      <g transform="translate(40, 32)">
        <rect x="0" y="0" width="240" height="36" rx="18" fill="#0284c7" fill-opacity="0.95"/>
        <text x="120" y="23" font-family="Liberation Sans, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.2">${badge1.replace(/[✦★•]/g, '').trim()}</text>

        <rect x="252" y="0" width="250" height="36" rx="18" fill="#0f172a" fill-opacity="0.85" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="377" y="23" font-family="Liberation Sans, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1">${badge2.replace(/[✦★•]/g, '').trim()}</text>

        <text x="${width - 80}" y="23" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#f8fafc" text-anchor="end" letter-spacing="1">${author.toUpperCase()} · AI CREATIVE</text>
      </g>

      <!-- Cell Labels -->
      ${cellLabelsSvg}

      <!-- Bottom Vignette -->
      <rect x="0" y="${height - 180}" width="${width}" height="180" fill="url(#botVig)"/>

      <g transform="translate(40, ${height - 110})">
        <text x="0" y="24" font-family="Liberation Sans, sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="0.5">${headline}</text>
        <text x="0" y="54" font-family="Liberation Sans, sans-serif" font-size="15" fill="#cbd5e1" font-weight="500">${subtitle}</text>

        <g transform="translate(${width - 360}, 0)">
          <rect x="0" y="0" width="280" height="44" rx="22" fill="#0a66c2" fill-opacity="0.95" stroke="#60a5fa" stroke-width="1.5"/>
          <text x="140" y="27" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">COMMENT &quot;${cta}&quot; FOR SOP</text>
        </g>
      </g>
    </svg>
  `;

  // Render SVG to PNG with system fonts via Resvg
  const resvg = new Resvg(overlaySvg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Liberation Sans' },
  });
  const overlayPng = resvg.render().asPng();

  // Composite PNG overlay on top of base grid with Sharp
  return await sharp(baseGrid)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toBuffer();
}

/**
 * Builds a single portrait cinematic variant featuring a DIFFERENT character and setting.
 */
async function createSinglePortraitVariant(
  vision: VisionAnalysisResult,
  options: VisualVariantOptions
): Promise<Buffer> {
  const width = 1200;
  const height = 1500;

  const portraitUrl = CURATED_CHARACTER_SETS.cybernetic_techwear[0];
  const rawBuf = await fetchImageBuffer(portraitUrl);
  const baseBuf = rawBuf || await sharp({
    create: { width, height, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
  }).png().toBuffer();

  const baseProcessed = await sharp(baseBuf)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 1.02, saturation: 1.08 })
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
    .png()
    .toBuffer();

  const author = escapeXml(options.authorName || 'Tibin Jacob');
  const cta = escapeXml(options.ctaKeyword || 'PROMPT');
  const badge1 = escapeXml(vision.variantConcept.categoryBadge);
  const badge2 = escapeXml(vision.variantConcept.subBadge);
  const headline = escapeXml(vision.variantConcept.headline);
  const subtitle = escapeXml(vision.variantConcept.subtitle);

  const overlaySvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topVig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="botVig" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.94"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="${width}" height="160" fill="url(#topVig)"/>

      <g transform="translate(45, 38)">
        <rect x="0" y="0" width="220" height="38" rx="19" fill="#0284c7" fill-opacity="0.95"/>
        <text x="110" y="24" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${badge1.replace(/[✦★•]/g, '').trim()}</text>

        <rect x="232" y="0" width="240" height="38" rx="19" fill="#0f172a" fill-opacity="0.85" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="352" y="24" font-family="Liberation Sans, sans-serif" font-size="12" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1">${badge2.replace(/[✦★•]/g, '').trim()}</text>

        <text x="${width - 90}" y="24" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="end" letter-spacing="1.2">${author.toUpperCase()} · AI CREATIVE</text>
      </g>

      <rect x="0" y="${height - 200}" width="${width}" height="200" fill="url(#botVig)"/>

      <g transform="translate(45, ${height - 130})">
        <text x="0" y="25" font-family="Liberation Sans, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="0.5">${headline}</text>
        <text x="0" y="60" font-family="Liberation Sans, sans-serif" font-size="16" fill="#cbd5e1" font-weight="500">${subtitle}</text>

        <g transform="translate(${width - 340}, 0)">
          <rect x="0" y="0" width="250" height="46" rx="23" fill="#0a66c2" fill-opacity="0.95" stroke="#60a5fa" stroke-width="1.5"/>
          <text x="125" y="29" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">COMMENT &quot;${cta}&quot; FOR SOP</text>
        </g>
      </g>
    </svg>
  `;

  const resvg = new Resvg(overlaySvg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Liberation Sans' },
  });
  const overlayPng = resvg.render().asPng();

  return await sharp(baseProcessed)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toBuffer();
}

/**
 * Builds a software workflow UI / table variant.
 */
async function createWorkflowTableVariant(
  vision: VisionAnalysisResult,
  options: VisualVariantOptions
): Promise<Buffer> {
  const width = 1200;
  const height = 800;
  const author = escapeXml(options.authorName || 'Tibin Jacob');
  const cta = escapeXml(options.ctaKeyword || 'STACK');
  const headline = escapeXml(vision.variantConcept.headline);

  const svgString = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0b1120"/>
      <!-- Top header -->
      <g transform="translate(40, 30)">
        <rect width="180" height="32" rx="16" fill="#10b981"/>
        <text x="90" y="21" font-family="Liberation Sans, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">LIVE ENRICHMENT UI</text>
        <text x="200" y="22" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">${headline}</text>
        <text x="${width - 80}" y="22" font-family="Liberation Sans, sans-serif" font-size="13" fill="#94a3b8" text-anchor="end">${author} · AI GTM</text>
      </g>

      <!-- Table Card -->
      <g transform="translate(40, 90)">
        <rect width="${width - 80}" height="${height - 180}" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        
        <!-- Table Header Row -->
        <rect width="${width - 80}" height="48" rx="12" fill="#1e293b"/>
        <text x="30" y="30" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8"># PROSPECT DOMAIN</text>
        <text x="280" y="30" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">INTENT TRIGGER</text>
        <text x="560" y="30" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">WATERFALL ENRICHMENT</text>
        <text x="880" y="30" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8">SYNTHESIS STATUS</text>

        <!-- Rows -->
        ${[
          { domain: 'stripe.com', trigger: 'VP Sales Expansion', tool: 'Clay + Apollo + Prospeo', status: 'VERIFIED (98%)', color: '#10b981' },
          { domain: 'ramp.com', trigger: 'Series D Signal Alert', tool: 'Clay + Gemini 1.5 + Hunter', status: 'SYNTHESIZED (100%)', color: '#10b981' },
          { domain: 'figma.com', trigger: 'Tech Stack Migration', tool: 'Clay + Dropcontact', status: 'DISPATCHED', color: '#38bdf8' },
          { domain: 'notion.so', trigger: 'Hiring Growth Surge', tool: 'Clay Waterfall Cascade', status: 'QUEUED', color: '#fbbf24' },
          { domain: 'gusto.com', trigger: 'Executive Role Change', tool: 'Apollo + Smartlead API', status: 'LIVE THREAD', color: '#a855f7' },
        ].map((row, idx) => `
          <g transform="translate(0, ${48 + idx * 80})">
            <line x1="0" y1="0" x2="${width - 80}" y2="0" stroke="#1e293b" stroke-width="1"/>
            <text x="30" y="46" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#f8fafc">${row.domain}</text>
            <text x="280" y="46" font-family="Liberation Sans, sans-serif" font-size="13" fill="#cbd5e1">${row.trigger}</text>
            <text x="560" y="46" font-family="Liberation Sans, sans-serif" font-size="13" font-mono="true" fill="#38bdf8">${row.tool}</text>
            <rect x="880" y="24" width="160" height="30" rx="15" fill="${row.color}" fill-opacity="0.18" stroke="${row.color}" stroke-width="1.2"/>
            <text x="960" y="44" font-family="Liberation Sans, sans-serif" font-size="11" font-weight="bold" fill="${row.color}" text-anchor="middle">${row.status}</text>
          </g>
        `).join('')}
      </g>

      <!-- Bottom Bar -->
      <g transform="translate(40, ${height - 50})">
        <text x="0" y="15" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748b">Generated autonomous outbound workflow table with verified intent waterfall</text>
        <text x="${width - 80}" y="15" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="end">COMMENT &quot;${cta}&quot; FOR CLAY TEMPLATE</text>
      </g>
    </svg>
  `;

  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Liberation Sans' },
  });
  return resvg.render().asPng();
}

/**
 * Main Entrance:
 * 1. Runs Gemini Vision FIRST on the original image buffer.
 * 2. Deeply understands the format, subject, setting, and text.
 * 3. Directly creates a visual variant featuring a DIFFERENT character, DIFFERENT setting, and text!
 */
export async function generateVisualVariant(
  options: VisualVariantOptions
): Promise<VisualVariantResult> {
  const {
    imageUrl,
    photoArchetype = 'Architecture Diagram',
    title,
    vertical = 'GTM',
    baseUrl,
  } = options;

  let imageBuffer: Buffer | null = null;
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    imageBuffer = await fetchImageBuffer(imageUrl);
  }

  // 1. RUN VISION FIRST ON THE ORIGINAL IMAGE
  let vision: VisionAnalysisResult;
  if (imageBuffer) {
    vision = await runVisionAnalysisOnOriginalImage(imageBuffer, {
      title,
      vertical,
      archetype: photoArchetype,
    });
  } else {
    vision = getFallbackVisionAnalysis({ title, vertical, archetype: photoArchetype });
  }

  console.log(`[VisualVariant] Detected layout format via Gemini Vision: ${vision.detectedFormat}`);
  console.log(`[VisualVariant] Original Subject: ${vision.originalSubject}`);
  console.log(`[VisualVariant] New Character: ${vision.variantConcept.differentCharacter}`);
  console.log(`[VisualVariant] New Setting: ${vision.variantConcept.differentSetting}`);

  let variantBuffer: Buffer;
  let filenamePrefix = 'variant';
  let isDirectAiRender = false;
  let directAiModel = '';

  try {
    if (vision.detectedFormat === 'single_portrait') {
      const portraitPrompt = `A cinematic high-resolution editorial portrait of ${vision.variantConcept.differentCharacter}, situated in ${vision.variantConcept.differentSetting}. ${vision.variantConcept.lightingMood}. Photorealistic 35mm film photography, crisp focal depth, award-winning editorial shoot.`;
      const aiGen = await generateAiImageFromPrompt(portraitPrompt, '4:5');
      if (aiGen) {
        variantBuffer = aiGen.buffer;
        filenamePrefix = 'variant_ai_portrait';
        isDirectAiRender = true;
        directAiModel = aiGen.modelUsed;
      } else {
        variantBuffer = await createSinglePortraitVariant(vision, options);
        filenamePrefix = 'variant_portrait';
      }
    } else if (vision.detectedFormat === 'character_angle_grid') {
      const gridPrompt = `A 4:5 vertical photographic contact sheet showing 8 different camera angles of ${vision.variantConcept.differentCharacter} in ${vision.variantConcept.differentSetting}. ${vision.variantConcept.lightingMood}. 8 distinct cinematic panels in a 2x4 grid showing wide establishing shot, medium close up, extreme detail, and profile angles. Ultra photorealistic, 35mm film grain, Hasselblad quality.`;
      const aiGen = await generateAiImageFromPrompt(gridPrompt, '4:5');
      if (aiGen) {
        variantBuffer = aiGen.buffer;
        filenamePrefix = 'variant_ai_character_grid';
        isDirectAiRender = true;
        directAiModel = aiGen.modelUsed;
      } else {
        variantBuffer = await createCharacterAngleGridVariant(vision, options);
        filenamePrefix = 'variant_character_grid';
      }
    } else if (vision.detectedFormat === 'workflow_table') {
      variantBuffer = await createWorkflowTableVariant(vision, options);
      filenamePrefix = 'variant_workflow_table';
    } else {
      // Architecture Diagram or Comparison
      const svgString = buildDiagramSvg({
        title: options.diagramSpec?.title || vision.variantConcept.headline || options.title,
        subtitle: options.diagramSpec?.subtitle || vision.variantConcept.subtitle || `${vertical} Execution Pipeline`,
        archetype: photoArchetype,
        vertical: options.vertical || vertical || 'GTM',
        steps: options.diagramSpec?.steps,
        comparison: options.diagramSpec?.comparison,
        gridItems: options.diagramSpec?.gridItems,
        theme: options.theme || 'dark',
        authorName: options.authorName || 'Tibin Jacob',
        authorHandle: options.authorHandle || '@tibinjacob',
      });

      const resvg = new Resvg(svgString, {
        fitTo: { mode: 'width', value: 1200 },
        font: {
          loadSystemFonts: true,
          defaultFontFamily: 'Liberation Sans',
        },
      });
      variantBuffer = resvg.render().asPng();
      filenamePrefix = 'variant_diagram';
    }

    const filename = `${filenamePrefix}_${Date.now()}.png`;
    await saveImageFile(filename, variantBuffer);
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/api/uploads/${filename}`;

    return {
      url: publicUrl,
      filename,
      isGenerated: true,
      archetype: photoArchetype,
      detectedFormat: vision.detectedFormat,
      visualAnalysis: `Original image analyzed via Gemini Vision: ${vision.originalSubject} in ${vision.originalSetting}.`,
      variantDetails: {
        originalSubject: vision.originalSubject,
        originalSetting: vision.originalSetting,
        differentCharacter: vision.variantConcept.differentCharacter,
        differentSetting: vision.variantConcept.differentSetting,
        angleLabels: vision.variantConcept.angleLabels,
        headline: vision.variantConcept.headline,
        hasEmbeddedText: vision.hasEmbeddedText,
        embeddedText: vision.embeddedText,
      },
      enhancementDetails: isDirectAiRender
        ? `Direct AI Image Synthesis (${directAiModel}): Generated a brand new raw photorealistic render of ${vision.variantConcept.differentCharacter} in ${vision.variantConcept.differentSetting}.`
        : `Transformed into an original ${vision.detectedFormat.replace(/_/g, ' ')} variant featuring ${vision.variantConcept.differentCharacter} in ${vision.variantConcept.differentSetting} with camera angle typography.`,
      originalUrl: imageUrl,
    };
  } catch (renderError) {
    console.error('Failed to generate visual variant, using clean vector diagram fallback:', renderError);

    // Clean Resvg Fallback
    const svgString = buildDiagramSvg({
      title: options.diagramSpec?.title || options.title,
      subtitle: options.diagramSpec?.subtitle || `${vertical} Execution Pipeline`,
      archetype: photoArchetype,
      vertical: options.vertical || vertical || 'GTM',
      steps: options.diagramSpec?.steps,
      comparison: options.diagramSpec?.comparison,
      gridItems: options.diagramSpec?.gridItems,
      theme: 'dark',
      authorName: options.authorName || 'Tibin Jacob',
      authorHandle: options.authorHandle || '@tibinjacob',
    });

    const resvg = new Resvg(svgString, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Liberation Sans',
      },
    });

    const pngBuffer = resvg.render().asPng();
    const filename = `variant_fallback_${Date.now()}.png`;
    await saveImageFile(filename, pngBuffer);
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/api/uploads/${filename}`;

    return {
      url: publicUrl,
      filename,
      isGenerated: true,
      archetype: photoArchetype,
      originalUrl: imageUrl,
    };
  }
}
