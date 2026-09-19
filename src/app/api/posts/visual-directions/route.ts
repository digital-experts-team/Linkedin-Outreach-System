import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export interface VisualDirection {
  id: string;
  style: string;
  title: string;
  description: string;
  prompt: string;
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

        const prompt = `You are an elite Creative Visual Director for high-impact LinkedIn content creators.
Analyze the following post:

POST TITLE / HOOK:
${title}

POST BODY CONTENT:
${postContent}

VERTICAL / TOPIC:
${vertical || 'B2B Business / Tech'}

POST ANGLE:
${angle || 'Thought Leadership'}

AUDIENCE:
${audience || 'Founders, Executives, Operators & B2B Decision Makers'}

${excludePrevious.length > 0 ? `PREVIOUSLY PROPOSED DIRECTIONS (DO NOT REPEAT THESE, CREATE GENUINELY NEW ANGLES): ${JSON.stringify(excludePrevious)}` : ''}

CRITICAL RULES:
1. Every direction must directly connect to the core thesis, metaphor, or emotional tension of THIS SPECIFIC POST. Never generate generic "AI + Laptop + Coffee" or generic "dashboard metric" clichés.
2. Provide exactly 3 distinctly diverse visual directions with high visual contrast:
   - Direction 1: Cinematic Real-World Photography / Human Moment (grounded, authentic, dramatic lighting, narrative tension related to the post's core message).
   - Direction 2: Premium 3D Conceptual Object / Tactile Metaphor (studio lighting, tactile materials like glass, matte ceramic, chrome, or physical metaphor representing the post's core dilemma or breakthrough).
   - Direction 3: Bold Editorial Minimalist / High-Contrast Graphic Typography (striking poster style, Swiss design inspired, intense contrast, memorable metaphor).
3. For each direction provide:
   - id: unique string (e.g. "dir_1", "dir_2", "dir_3")
   - style: short category label (e.g. "Cinematic Real-World", "Premium 3D Object", "Editorial Minimalist")
   - title: catchy 3-6 word concept headline
   - description: 1-2 sentence vivid description of what the visual depicts and why it stops the scroll
   - prompt: a detailed, high-fidelity prompt for an AI image generator (photorealistic details, lighting, camera angle, textures, mood, 8k resolution, no awkward floating hands or watermark text).

Return strictly JSON matching this structure:
{
  "directions": [
    {
      "id": "dir_1",
      "style": "...",
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

    // Context-aware dynamic fallback tailored directly to the post's topic
    const snippet = postContent.slice(0, 100);
    const hasGtm = /gtm|sales|pipeline|revenue|lead|outreach/i.test(postContent);
    const hasTech = /code|software|ai|engineer|stack|dev/i.test(postContent);
    const hasLeadership = /culture|team|hire|founder|scale|growth/i.test(postContent);

    let directions: VisualDirection[] = [];

    if (hasGtm) {
      directions = [
        {
          id: 'dir_1',
          style: 'Cinematic Real-World',
          title: 'The Stalled Deal Room',
          description: 'A focused founder standing in front of a glass conference room at dusk, watching an illuminated sales pipeline board.',
          prompt: `Cinematic 35mm photograph of a startup founder in an architectural modern office at twilight, standing beside a dimly lit glass whiteboard with strategic pipeline schematics, moody cinematic atmospheric lighting, shot on ARRI Alexa, shallow depth of field.`,
        },
        {
          id: 'dir_2',
          style: 'Premium 3D Object',
          title: 'The Monolithic Valve',
          description: 'A sculpted matte-black physical conduit pipeline with one radiant golden valve controlling fluid flow.',
          prompt: `High-end 3D render of a minimalist industrial pipeline made of frosted matte obsidian, with one glowing golden pressure valve, studio rim lighting, Octane render, luxury product design aesthetic, ultra-clean composition, 8k.`,
        },
        {
          id: 'dir_3',
          style: 'Editorial Minimalist',
          title: 'Speed Over Friction',
          description: 'A high-contrast graphic with bold typography and a lone supersonic jet vapor trail piercing clean slate space.',
          prompt: `Minimalist graphic design poster, high contrast off-white and deep navy, elegant Swiss typography layout, bold abstract geometric velocity streaks, clean negative space, museum exhibition art style.`,
        },
      ];
    } else if (hasTech) {
      directions = [
        {
          id: 'dir_1',
          style: 'Cinematic Real-World',
          title: 'The Midnight Architecture',
          description: 'An engineer looking at a transparent dual-monitor setup reflecting intricate system diagrams into a rain-streaked window.',
          prompt: `Moody cinematic photo of a senior software architect working in a quiet high-rise office at night, soft screen glow illuminating facial contours, blurred city bokeh in background, Kodak Portra color tone.`,
        },
        {
          id: 'dir_2',
          style: 'Premium 3D Conceptual',
          title: 'Modular Glass Engine',
          description: 'An intricate translucent mechanical processor floating in weightless equilibrium.',
          prompt: `Close-up macro render of a floating modular computational processor core made of prism glass and brushed titanium, caustic reflections, photorealistic ray tracing, cinematic soft lighting.`,
        },
        {
          id: 'dir_3',
          style: 'Editorial Graphic',
          title: 'Signal Through Noise',
          description: 'A sharp editorial graphic separating chaotic data waves into a single razor-thin laser line.',
          prompt: `Swiss modernism editorial graphic art, abstract vector waveform decomposing into an ultra-sharp single gold beam, stark black background, timeless typography spacing, gallery poster.`,
        },
      ];
    } else {
      directions = [
        {
          id: 'dir_1',
          style: 'Cinematic Real-World',
          title: 'The Uncomfortable Pivot',
          description: 'A candid conversation between two business partners leaning over a prototype on a sunlit studio table.',
          prompt: `Authentic editorial photography of two executive partners having an intense strategic discussion at a concrete table, natural dramatic morning window light, authentic expressions, Hasselblad medium format look.`,
        },
        {
          id: 'dir_2',
          style: 'Premium 3D Object',
          title: 'The Equilibrium Stone',
          description: 'Three precision-balanced geometric stones made of travertine, glass, and brushed brass.',
          prompt: `Studio still life render of three perfectly balanced sculptural objects: polished travertine stone, translucent amber glass cube, and brushed bronze rod in impossible equilibrium, soft studio shadow, architectural digest style.`,
        },
        {
          id: 'dir_3',
          style: 'Editorial Typography',
          title: 'First Principles',
          description: 'A striking typographic layout spotlighting the post’s core hook in refined editorial fashion.',
          prompt: `High-end editorial book cover design, bold display typography on textured handmade paper, stark contrast, subtle geometric embossing, gallery typography exhibition.`,
        },
      ];
    }

    return NextResponse.json({ directions });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error?.message || 'Failed to generate visual directions' } },
      { status: 500 }
    );
  }
}
