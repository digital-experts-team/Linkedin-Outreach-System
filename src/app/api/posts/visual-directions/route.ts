import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export interface VisualDirection {
  id: string;
  style: string;
  title: string;
  description: string;
  prompt: string;
  stylePreset?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = '',
      fullCopy = '',
      vertical = '',
      angle = '',
      audience = '',
      excludePrevious = [],
    } = body;

    const postContent = (fullCopy || title || '').trim();
    if (!postContent) {
      return NextResponse.json(
        { error: { message: 'Post content or title is required to derive visual directions' } },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are a world-class Visual Creative Director specializing in viral, high-converting LinkedIn visuals.
LinkedIn readers crave clean, professional, high-contrast, uncluttered, and feed-native aesthetics (especially white/natural backgrounds and tactile 3D renders).

Analyze this post:
POST TITLE / HOOK: ${title}
POST BODY CONTENT: ${postContent}
VERTICAL / TOPIC: ${vertical || 'B2B / Tech / Executive'}
AUDIENCE: ${audience || 'Founders, Executives, Operators'}
${excludePrevious.length > 0 ? `PREVIOUSLY PROPOSED TITLES (DO NOT REPEAT): ${JSON.stringify(excludePrevious)}` : ''}

Generate exactly 3 DISTINCT, HIGH-IMPACT visual directions chosen from these top-performing styles:
1. "3D Arrow Concept (Growth/Direction)" [stylePreset: "3d-arrow"]:
   Minimalist 3D render of a massive, bold, matte white arrow curving dynamically upward. Clean subtle off-white/white background with soft, realistic studio shadows. Ultra-modern, professional corporate aesthetic.
2. "3D Checklist Concept (Action/Playbook)" [stylePreset: "3d-checklist"]:
   Clean 3D graphic featuring a single giant glossy white checkbox with a bold checkmark inside. Monochromatic all-white aesthetic with deep, soft shadows to create depth and dimension. High-end tech startup style.
3. "3D Chart Concept (Metrics/Results)" [stylePreset: "3d-chart"]:
   Bold 3D bar graph made of smooth, matte white pillars on an all-white background. The tallest pillar stands out distinctly with subtle, elegant lighting. Minimalist, premium, no text clutter.
4. "Bold Data Point Highlight" [stylePreset: "bold-data"]:
   Minimalist graphic with a clean dark navy or crisp white background. In the center, a massive bold stat (e.g., "127%" or metric from the post) in vibrant coral-orange, with sleek, small sans-serif explanation below. High contrast, corporate aesthetic, zero clutter.
5. "Strategy & Growth Metaphor" [stylePreset: "strategy-metaphor"]:
   Clean editorial photo/visual of a single chess piece standing at a crossroads on a minimalist concrete table. Warm golden hour window lighting from the side, soft focus background, authentic candid editorial style.
6. "Behind-the-Scenes / Workspace" [stylePreset: "workspace"]:
   Clean, eye-level candid shot of a wooden desk with an open notebook, modern laptop showing abstract data charts, steaming ceramic mug, soft natural morning light, shallow depth of field.
7. "White Natural LinkedIn Editorial" [stylePreset: "white-editorial"]:
   Clean feed-native all-white background, high-contrast crisp dark typography, ample negative space, executive contrarian takeaway.

Select the 3 most complementary yet visually distinct directions that best match the post's core hook and thesis.
Return strictly JSON matching:
{
  "directions": [
    {
      "id": "dir_1",
      "style": "...",
      "stylePreset": "3d-arrow" | "3d-checklist" | "3d-chart" | "bold-data" | "strategy-metaphor" | "workspace" | "white-editorial",
      "title": "...",
      "description": "...",
      "prompt": "..."
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed.directions && Array.isArray(parsed.directions) && parsed.directions.length > 0) {
          return NextResponse.json({ directions: parsed.directions.slice(0, 3) });
        }
      } catch (geminiError: any) {
        console.warn('Gemini visual directions error, using tailored fallback:', geminiError?.message);
      }
    }

    // Context-aware dynamic fallback tailored with diverse LinkedIn-first white and 3D styles
    const hasNumbers = /\d+%|\$[\d.]+[kmb]?|\d+x/i.test(postContent);
    const hasExecution = /playbook|checklist|step|how to|system|process|action/i.test(postContent);

    const directions: VisualDirection[] = [
      {
        id: 'dir_1',
        style: hasNumbers ? 'Bold Data Point Highlight' : '3D Arrow (Growth/Direction)',
        stylePreset: hasNumbers ? 'bold-data' : '3d-arrow',
        title: hasNumbers ? 'The 127% Velocity Stat' : 'The Compounding Curve',
        description: hasNumbers
          ? 'Minimalist high-contrast layout centering a bold coral-orange metric with sleek explanatory copy.'
          : 'A minimalist 3D render of a bold matte white arrow curving dynamically upward with soft studio shadows.',
        prompt: hasNumbers
          ? 'Create a minimalist graphic with a clean dark navy background. In the center, display a massive bold number in vibrant coral-orange with a sleek small white sans-serif description below. Modern corporate aesthetic, high contrast.'
          : 'A minimalist, high-impact 3D render of a massive, bold, matte white arrow curving dynamically upward. A clean, subtle off-white background with soft, realistic studio shadows. High contrast, ultra-modern.',
      },
      {
        id: 'dir_2',
        style: hasExecution ? '3D Checklist (Action)' : '3D Chart (Metrics/Results)',
        stylePreset: hasExecution ? '3d-checklist' : '3d-chart',
        title: hasExecution ? 'The Single Non-Negotiable' : 'The Exponential Pillar',
        description: hasExecution
          ? 'Monochromatic all-white aesthetic with deep soft shadows and a giant glossy white 3D checkbox.'
          : 'Smooth matte white 3D pillars on an all-white background with the tallest pillar subtly illuminated.',
        prompt: hasExecution
          ? 'A clean 3D graphic featuring a single, giant, glossy white checkbox with a bold, distinct checkmark inside it. Monochromatic all-white aesthetic with deep, soft shadows to create depth and dimension. High-end tech startup style.'
          : 'A bold 3D bar graph made of smooth, matte white pillars on an all-white background. The tallest pillar stands out distinctly with subtle, elegant lighting. Minimalist, premium, no text clutter.',
      },
      {
        id: 'dir_3',
        style: 'Strategy & Growth Metaphor',
        stylePreset: 'strategy-metaphor',
        title: 'The Crossroads Move',
        description: 'Warm golden hour window lighting on a minimalist concrete table with a single strategic crossroads metaphor.',
        prompt: 'A high-resolution square photo of a single chess piece standing at a crossroads on a minimalist concrete table. Warm golden hour window lighting coming from the side, soft focus background of a modern creative office. Professional, authentic feel, candid editorial style.',
      },
    ];

    return NextResponse.json({ directions });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error?.message || 'Failed to generate visual directions' } },
      { status: 500 }
    );
  }
}
