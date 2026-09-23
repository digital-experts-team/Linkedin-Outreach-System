import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateVisualVariant } from '@/lib/trends/visual-variant-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = '',
      fullCopy = '',
      hook = '',
      vertical = 'GTM',
      targetVertical,
      imageUrl = '',
      photoArchetype = 'Architecture Diagram',
      photoDescription = '',
      originalAuthor,
      taggedEntities = [],
      ctaKeyword,
      theme = 'dark',
      repurposeAngle = 'framework',
    } = body;

    const chosenVertical = targetVertical || vertical || 'GTM';
    const isAiVideo =
      chosenVertical.toLowerCase().includes('video') ||
      chosenVertical.toLowerCase().includes('creative');

    const defaultCta = ctaKeyword || (isAiVideo ? 'PROMPT' : 'STACK');
    const apiKey = process.env.GEMINI_API_KEY;

    // Build base URL for the generated image URL
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = appUrl || `${proto}://${host}`;

    let repurposedData: any = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are Tibin Jacob, an authority in ${
          isAiVideo
            ? 'AI Video production pipelines, synthetic media ads, and creative automation (using Runway, Midjourney, Kling, Luma)'
            : 'Autonomous B2B GTM systems, AI outbound engines, and revenue growth operations (using Clay, Smartlead, Apollo, Instantly)'
        }.

Task: REPURPOSE this viral LinkedIn post into an ORIGINAL, authentic, and high-converting post for your own brand.

ORIGINAL VIRAL POST:
- Title: "${title}"
- Creator: ${originalAuthor?.name || 'Creator'} (${originalAuthor?.handle || ''})
- Hook: "${hook || fullCopy.slice(0, 120)}"
- Copy: "${fullCopy.slice(0, 800)}"
- Archetype: "${photoArchetype}"
- Photo Description: "${photoDescription || 'Technical diagram/workflow'}"
- Target Angle: ${repurposeAngle}
- Target CTA: "${defaultCta}"

OUTPUT REQUIREMENTS:
1. REPURPOSED TITLE: Clean 4-8 word internal title for Notion.
2. REPURPOSED HOOK: Punchy pattern-interrupt first 2 lines under 140 characters so it fits ABOVE the LinkedIn fold.
3. REPURPOSED COPY: Complete authentic post. Pacing 1-2 lines per paragraph, generous whitespace, bullet points, proof/metrics, natural company mentions (@Runway/@Clay etc.), and a clear CTA telling readers to comment "${defaultCta}".
4. STRATEGIC @TAGS: 2-3 specific software tools or companies to tag with clear reason.
5. DIAGRAM SPEC:
   - diagramTitle: 4-8 words
   - diagramSubtitle: Crisp subtitle
   - steps: 4 sequential phases with title, short description, and tool name
   - comparison: (if comparison archetype) leftTitle, leftItems (3 items), rightTitle, rightItems (3 items)
   - gridItems: (if 3x3 grid) 9 items with title and desc
6. DECISION INSIGHTS: Hook psychology, visual retention impact, and tagging rationale.

RETURN STRICT JSON ONLY:
{
  "name": "Repurposed title",
  "hook": "Under 140 chars hook",
  "fullCopy": "Complete LinkedIn post body...",
  "ctaKeyword": "${defaultCta}",
  "vertical": "${isAiVideo ? 'AI Video' : 'GTM'}",
  "taggedEntities": [
    { "name": "ToolName", "handle": "@ToolHandle", "type": "company", "reason": "Why tagged" }
  ],
  "decisionInsights": {
    "hookPsychology": { "type": "Pattern Interrupt", "whyItWorks": "...", "dwellTimeImpact": "..." },
    "visualStrategy": { "archetype": "${photoArchetype}", "whyThisPhotoWorks": "...", "visualRetentionScore": 98 },
    "taggingStrategy": { "rationale": "...", "amplificationProbability": "High" }
  },
  "photoDirection": "Visual layout instructions",
  "diagramSpec": {
    "title": "Diagram Title",
    "subtitle": "Diagram Subtitle",
    "steps": [
      { "title": "Phase 1", "desc": "Phase 1 Details", "tool": "ToolName" },
      { "title": "Phase 2", "desc": "Phase 2 Details", "tool": "ToolName" },
      { "title": "Phase 3", "desc": "Phase 3 Details", "tool": "ToolName" },
      { "title": "Phase 4", "desc": "Phase 4 Details", "tool": "ToolName" }
    ]
  }
}`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        // 8 second timeout to guarantee fast responsiveness
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini generation timeout')), 8000)
        );

        const aiResponse: any = await Promise.race([geminiPromise, timeoutPromise]);
        const raw = aiResponse.text || '';
        repurposedData = JSON.parse(raw);
      } catch (geminiError) {
        console.warn('Gemini repurposing warning, falling back to smart contextual engine:', geminiError);
      }
    }

    // High-craft fallback if Gemini is offline or failed
    if (!repurposedData) {
      if (isAiVideo) {
        repurposedData = {
          name: `The 3-Tier AI Video Consistency Engine (Repurposed from ${title.slice(0, 30)})`,
          hook: `Most AI-generated video ads look robotic because teams skip render pre-conditioning.\n\nHere is our exact 3-step consistency framework:`,
          fullCopy: `Most AI-generated video ads look robotic because teams skip render pre-conditioning.

Here is our exact 3-step consistency framework:

1. Base Generation Lock
Anchor character seed tokens and lens focal length in @Midjourney before any motion interpolation.

2. Optical Latent Alignment
Run the keyframe through @Runway Gen-3 with fixed depth maps to kill temporal warping.

3. Motion Smoothing Pass
Process final render buffers through our optical flow buffer for seamless 60fps clarity.

The visual diagram attached breaks down the exact node-by-node architecture.

Want the raw workflow JSON and our prompt cheat sheet?

Comment "${defaultCta}" below and I'll DM you the complete Notion SOP.

#AIVideo #CreativeStrategy #VideoProduction`,
          ctaKeyword: defaultCta,
          vertical: 'AI Video',
          taggedEntities: [
            { name: 'Runway', handle: '@Runway', type: 'company', reason: 'Tagging video foundation model creator drives executive resharing.' },
            { name: 'Midjourney', handle: '@Midjourney', type: 'company', reason: 'Referencing generative image model attracts creative directors.' },
          ],
          decisionInsights: {
            hookPsychology: {
              type: 'Problem Identification + Immediate Solution',
              whyItWorks: 'Directly addresses the #1 objection to AI video (inconsistency) with an engineering solution.',
              dwellTimeImpact: 'Users stop scrolling to inspect node connections in the diagram.',
            },
            visualStrategy: {
              archetype: photoArchetype || 'Architecture Diagram',
              whyThisPhotoWorks: 'A node-based architecture graphic provides undeniable technical proof.',
              visualRetentionScore: 98,
            },
            taggingStrategy: {
              rationale: 'Tagging @Runway and @Midjourney directly in the body triggers platform notification algorithms.',
              amplificationProbability: 'Very High',
            },
          },
          photoDirection: 'High-contrast dark-mode technical architecture diagram showing 3-stage generative pipeline.',
          diagramSpec: {
            title: 'AI Video Consistency Architecture',
            subtitle: 'Multi-Model Latent Conditioning Pipeline',
            steps: [
              { title: '1. Seed Anchoring', desc: 'Lock character seed & lighting parameters', tool: 'Midjourney v7' },
              { title: '2. Latent Interpolation', desc: 'Depth-conditioned temporal motion synthesis', tool: 'Runway Gen-3' },
              { title: '3. Optical Flow Polish', desc: 'Sub-pixel motion smoothing & upscaling', tool: 'Topaz AI' },
              { title: '4. Master Delivery', desc: 'Export multi-aspect ad creatives for paid distribution', tool: 'Ad Pipeline' },
            ],
          },
        };
      } else {
        repurposedData = {
          name: `The Autonomous Outbound Signal Engine (Repurposed from ${title.slice(0, 30)})`,
          hook: `Blasting 5,000 cold emails is dead.\n\nWe replaced generic scraping with an autonomous signal engine. Here is the architecture:`,
          fullCopy: `Blasting 5,000 cold emails is dead.

We replaced generic scraping with an autonomous signal engine. Here is the architecture:

1. Real-Time Signal Monitoring
Track hiring surges, funding alerts, and executive role transitions via @Apollo.io.

2. Deep Contextual Synthesis
Route company filings through @Clay with Gemini to pinpoint the prospect's exact growth bottleneck.

3. Trigger-Based Dynamic Icebreakers
Generate bespoke 1-to-1 pain-point references that sound like an internal peer, not an SDR.

4. Multi-Inbox Deliverability
Rotate secondary domains via @Smartlead with automated inbox warmups.

The attached diagram shows the complete data flow.

Want our exact Clay table templates and prompt sequence?

Comment "${defaultCta}" below and I'll send over the complete playbook.

#GTM #Outbound #SalesAutomation`,
          ctaKeyword: defaultCta,
          vertical: 'GTM',
          taggedEntities: [
            { name: 'Clay', handle: '@Clay', type: 'company', reason: 'High algorithmic affinity in B2B growth circles.' },
            { name: 'Smartlead', handle: '@Smartlead', type: 'company', reason: 'Cold email community reposts deliverability benchmarks.' },
          ],
          decisionInsights: {
            hookPsychology: {
              type: 'Polarizing Truth + High Contrast',
              whyItWorks: 'Claims "blasting emails is dead" while immediately showing the modern winning alternative.',
              dwellTimeImpact: 'Technical flowchart prompts pinch-to-zoom on mobile devices.',
            },
            visualStrategy: {
              archetype: photoArchetype || 'Architecture Diagram',
              whyThisPhotoWorks: 'A clean workflow map proves system sophistication and earns bookmark saves.',
              visualRetentionScore: 97,
            },
            taggingStrategy: {
              rationale: 'Tagging @Clay and @Smartlead triggers reach into outbound founder communities.',
              amplificationProbability: 'Very High',
            },
          },
          photoDirection: 'Sleek dark-mode 4-stage data pipeline with tool badges and clear connector lines.',
          diagramSpec: {
            title: 'Autonomous Outbound Growth Engine',
            subtitle: 'Signal-Driven B2B Pipeline Architecture',
            steps: [
              { title: '1. Signal Detection', desc: 'Hiring surges & tech stack changes tracked daily', tool: 'Apollo.io' },
              { title: '2. Deep AI Enrichment', desc: 'Gemini synthesizes annual reports & pain points', tool: 'Clay' },
              { title: '3. Bespoke Outbound', desc: '1-to-1 tailored value propositions deployed', tool: 'Smartlead' },
              { title: '4. Pipeline Conversion', desc: '18+ high-intent discovery calls booked weekly', tool: 'HubSpot / Notion' },
            ],
          },
        };
      }
    }

    // Generate an intelligent visual variant that respects and elevates the core concept
    let variantResult;
    try {
      variantResult = await generateVisualVariant({
        imageUrl: imageUrl || undefined,
        photoArchetype,
        photoDescription: photoDescription || repurposedData.photoDirection,
        title: repurposedData.name || title,
        fullCopy: repurposedData.fullCopy || fullCopy,
        vertical: chosenVertical,
        ctaKeyword: repurposedData.ctaKeyword || defaultCta,
        authorName: 'Tibin Jacob',
        authorHandle: isAiVideo ? '@tibinjacob • AI Creative' : '@tibinjacob • GTM Lead',
        theme,
        diagramSpec: repurposedData.diagramSpec,
        baseUrl,
      });
    } catch (renderError) {
      console.error('Failed to generate visual variant:', renderError);
      // Fallback
      variantResult = {
        url: imageUrl || (isAiVideo
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'),
        filename: 'fallback_visual.jpg',
        isGenerated: false,
        archetype: photoArchetype,
      };
    }

    // Media list: [0] Enhanced Variant, [1] Original Viral Asset (if available)
    const mediaList: any[] = [
      {
        url: variantResult.url,
        name: variantResult.filename,
        type: 'image',
        isGenerated: variantResult.isGenerated,
        detectedFormat: variantResult.detectedFormat,
      },
    ];

    if (imageUrl && imageUrl.trim().length > 0 && imageUrl !== variantResult.url) {
      mediaList.push({
        url: imageUrl,
        name: `${photoArchetype.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_original.jpg`,
        type: 'image',
        isOriginal: true,
      });
    }

    return NextResponse.json({
      success: true,
      repurposed: {
        name: repurposedData.name,
        hook: repurposedData.hook,
        fullCopy: repurposedData.fullCopy,
        ctaKeyword: repurposedData.ctaKeyword || defaultCta,
        vertical: chosenVertical,
        taggedEntities: repurposedData.taggedEntities || [],
        decisionInsights: repurposedData.decisionInsights,
        photoDirection: repurposedData.photoDirection,
        media: mediaList,
        originalMedia: imageUrl
          ? {
              url: imageUrl,
              title,
              archetype: photoArchetype,
            }
          : undefined,
        visualInsights: {
          analysis: variantResult.visualAnalysis,
          enhancementDetails: variantResult.enhancementDetails,
          detectedFormat: variantResult.detectedFormat,
          variantDetails: variantResult.variantDetails,
        },
        diagramSpec: repurposedData.diagramSpec,
      },
    });
  } catch (error: any) {
    console.error('Repurpose route error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'REPURPOSE_ERROR',
          message: error?.message || 'Failed to repurpose viral post',
        },
      },
      { status: 500 }
    );
  }
}
