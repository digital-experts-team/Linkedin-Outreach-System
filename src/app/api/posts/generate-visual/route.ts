import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt = '',
      title = 'Visual',
      style = 'Editorial',
      directionTitle = '',
      postContent = '',
      version = 1,
    } = body;

    if (!prompt && !postContent) {
      return NextResponse.json(
        { error: { message: 'A prompt or post content is required' } },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const cleanTitle = (directionTitle || title || 'visual')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 24);
    const uniqueId = `${Date.now()}_v${version}_${Math.random().toString(36).slice(2, 7)}`;
    const filename = `ai_${cleanTitle}_${uniqueId}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    const apiKey = process.env.GEMINI_API_KEY;
    let imageGenerated = false;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Enhance prompt with photo quality tags
        const fullPrompt = `${prompt}. Professional photography, commercial grade, award-winning lighting, photorealistic, sharp focus, 8k resolution, clean composition, no watermarks, no distorted faces or hands.`;

        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
        });

        const imageObj = response.generatedImages?.[0]?.image;
        if (imageObj && imageObj.imageBytes) {
          const buffer = Buffer.from(imageObj.imageBytes, 'base64');
          await fs.writeFile(filePath, buffer);
          imageGenerated = true;
        }
      } catch (imagenErr: any) {
        console.warn('Imagen 3 image generation attempt note:', imagenErr?.message);
      }
    }

    // High-craft SVG fallback if Imagen was not available or rate-limited
    if (!imageGenerated) {
      const svgFilename = `ai_${cleanTitle}_${uniqueId}.svg`;
      const svgPath = path.join(uploadsDir, svgFilename);

      // Extract memorable hook
      const displayHeadline = (directionTitle || title || 'EXECUTIVE PERSPECTIVE').toUpperCase();
      const displayStyle = (style || 'STRATEGIC INSIGHT').toUpperCase();
      const excerpt = (postContent || prompt || '').slice(0, 140).replace(/"/g, '&quot;');

      // Choose color palette based on direction style
      let gradStart = '#0f172a';
      let gradEnd = '#1e293b';
      let accent = '#38bdf8';
      let badgeBg = 'rgba(56, 189, 248, 0.15)';

      if (/cinematic|human|moment/i.test(displayStyle)) {
        gradStart = '#18181b';
        gradEnd = '#27272a';
        accent = '#fbbf24';
        badgeBg = 'rgba(251, 191, 36, 0.15)';
      } else if (/3d|object|conceptual/i.test(displayStyle)) {
        gradStart = '#0a0f1d';
        gradEnd = '#1e1b4b';
        accent = '#818cf8';
        badgeBg = 'rgba(129, 140, 248, 0.15)';
      } else if (/editorial|typography|minimalist/i.test(displayStyle)) {
        gradStart = '#111827';
        gradEnd = '#030712';
        accent = '#34d399';
        badgeBg = 'rgba(52, 211, 153, 0.15)';
      }

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="1080" height="1080" fill="url(#bg)" />
  <rect width="1080" height="1080" fill="url(#grid)" />
  <rect width="1080" height="1080" fill="url(#glow)" />

  <!-- Architectural Accents -->
  <circle cx="860" cy="220" r="160" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="2" />
  <circle cx="860" cy="220" r="80" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5" />
  <line x1="80" y1="180" x2="1000" y2="180" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Style Tag Badge -->
  <rect x="80" y="110" width="280" height="42" rx="21" fill="${badgeBg}" stroke="${accent}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="220" y="137" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="2">
    ✦ ${displayStyle}
  </text>

  <!-- Title & Headline -->
  <text x="80" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#ffffff" letter-spacing="-1">
    ${displayHeadline.slice(0, 32)}
  </text>

  <!-- Central Visual Graphic Device -->
  <g transform="translate(80, 420)">
    <rect width="920" height="360" rx="16" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    
    <!-- Quotation / Post Hook Excerpt -->
    <text x="50" y="90" font-family="Georgia, serif" font-size="68" fill="${accent}" opacity="0.4">“</text>
    <foreignObject x="50" y="90" width="820" height="220">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; line-height: 1.5; color: #e2e8f0; font-weight: 400;">
        ${excerpt}${excerpt.length >= 135 ? '...' : ''}
      </div>
    </foreignObject>
  </g>

  <!-- Bottom Brand & Metaphor Bar -->
  <line x1="80" y1="880" x2="1000" y2="880" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  
  <text x="80" y="940" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#94a3b8">
    LINKEDIN EXECUTIVE DISPATCH
  </text>
  
  <text x="1000" y="940" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="${accent}" text-anchor="end">
    DIRECTION: ${displayStyle.slice(0, 20)}
  </text>
</svg>`;

      await fs.writeFile(svgPath, svgContent, 'utf-8');

      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const publicUrl = `${proto}://${host}/uploads/${svgFilename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        name: `${displayHeadline}.svg`,
        style: displayStyle,
        prompt,
      });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const publicUrl = `${proto}://${host}/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: `${cleanTitle}.jpg`,
      style,
      prompt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error?.message || 'Failed to generate visual asset' } },
      { status: 500 }
    );
  }
}
