import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic = '',
      vertical = 'GTM',
      fileName = '',
      mediaType = '',
      format = 'breakdown',
      ctaKeyword = '',
      hookStyle = '',
    } = body;

    const trimmedTopic = (topic || '').trim();
    if (!trimmedTopic && !fileName) {
      return NextResponse.json(
        { error: { message: 'Please provide a topic, video description, or clip details.' } },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const vLower = (vertical || '').toLowerCase();
    const isAiVideoVertical = vLower.includes('video') || vLower.includes('creative');
    const isGrowthStacksVertical = vLower.includes('growth stacks') || vLower.includes('company') || vLower.includes('growth_stacks');

    // Persona context
    const persona = isGrowthStacksVertical
      ? 'Growth Stacks (official company page). Voice of an elite B2B AI growth engineering and infrastructure firm. Institutional authority, systems thinking, engineering rigor, client case metrics, and architectural playbooks.'
      : isAiVideoVertical
      ? 'Tibin Jacob, Senior AI Creative Strategist. Expert in performance ads, AI video generation pipelines, creative automation, Midjourney/Runway/Kling/Luma workflows, and viral hook craft.'
      : 'Tibin Jacob, AI Growth Engineer. Expert in B2B GTM automations, AI outbound engines, Clay + Apollo workflows, revenue operations, and scaling outbound pipeline.';

    const defaultKeyword = isGrowthStacksVertical ? 'GROWTH' : (isAiVideoVertical ? 'PROMPT' : 'STACK');

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are ${persona}.
Write an authentic, viral, high-converting LinkedIn post based on this context.

CONTEXT & INPUT:
- Topic / Clip Description: ${trimmedTopic || 'Breakdown of our latest production workflow'}
- Attached Media: ${fileName ? `${mediaType === 'video' ? 'Video Clip' : 'Image'}: ${fileName}` : 'None'}
- Target Vertical: ${isGrowthStacksVertical ? 'Growth Stacks (Company Page - AI GTM Architecture)' : isAiVideoVertical ? 'AI Video & Creative Strategy' : 'GTM Automations & Revenue Growth'}
- Desired CTA Keyword: ${ctaKeyword || defaultKeyword}
- Hook Style Preference: ${hookStyle || 'High curiosity with crisp metric or counter-intuitive claim'}

LINKEDIN COPYWRITING RULES:
1. THE HOOK (First 2 lines): Must be punchy and under 140 characters so it fits ABOVE the LinkedIn "see more" cutoff. No generic pleasantries, no "In today's fast-paced world".
2. PACING & FORMATTING: Short, punchy lines (1-2 sentences max per paragraph). Generous whitespace. Use clean bullet points (• or →). Never use markdown bolding in a way that looks like raw code; write clean readable text.
3. VALUE DENSITY: Give actionable steps, numbers, framework, or behind-the-scenes insights.
4. CALL TO ACTION: Clear, friction-free CTA telling readers to comment the keyword "${ctaKeyword || defaultKeyword}" to get the complete workflow / asset / SOP in their DMs.
5. HASHTAGS: Exactly 3 relevant hashtags at the bottom.

RETURN STRICT JSON ONLY:
{
  "suggestedTitle": "Short 4-8 word internal title for Notion",
  "hooks": [
    "Hook option 1: Contrarian / Pattern-interrupt hook",
    "Hook option 2: Metric / Proof-driven hook",
    "Hook option 3: Behind-the-scenes / Story hook"
  ],
  "selectedHook": "The best hook from above",
  "fullCopy": "The complete LinkedIn post copy including hook, body, bullets, CTA and hashtags",
  "ctaKeyword": "${ctaKeyword || defaultKeyword}",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text || '';
        try {
          const parsed = JSON.parse(rawText);
          return NextResponse.json({
            success: true,
            data: parsed,
          });
        } catch (jsonErr) {
          // Fallback if parsing fails
          const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          return NextResponse.json({
            success: true,
            data: parsed,
          });
        }
      } catch (geminiError: any) {
        console.error('Gemini generateContent error:', geminiError);
      }
    }

    // High quality offline fallback if GEMINI_API_KEY is not configured or fails
    const fallbackTitle = isAiVideoVertical
      ? `${trimmedTopic.slice(0, 35) || 'AI Video Production'} Workflow`
      : `${trimmedTopic.slice(0, 35) || 'AI Outbound Engine'} Playbook`;

    const keyword = ctaKeyword || (isAiVideoVertical ? 'PROMPT' : 'STACK');

    const fallbackHooks = isAiVideoVertical
      ? [
          `Most AI videos look robotic and fake. Here is how we fixed lighting and character consistency in 3 steps:`,
          `We spent 40 hours stress-testing the new AI video models. The results completely surprised our creative team:`,
          `Traditional video ads take 3 weeks. We just produced 14 photorealistic variations in 45 minutes:`,
        ]
      : [
          `95% of outbound emails land in spam or get ignored. We changed 2 variables and doubled reply rates:`,
          `How we built an AI growth engine that books 18+ qualified calls a week on autopilot:`,
          `Cold outreach isn't dead. Generic template scraping is. Here is the modern AI GTM workflow:`,
        ];

    const fallbackCopy = isAiVideoVertical
      ? `${fallbackHooks[0]}

When scaling video creative with AI, 80% of teams fail because they skip render pre-conditioning.

Here is the exact framework we use:

1. Base Generation
Lock the lighting and camera lens focal length before running motion passes.

2. Consistency Check
Feed seed frames back through our negative-prompt buffer to eliminate jitter.

3. Motion Smoothing & Upscaling
Run through our final optical flow pass for seamless 60fps playback.

The result? Studio-grade ads in a fraction of traditional production time.

Want the full workflow breakdown and our exact prompt library?

Comment "${keyword}" below and I'll DM you the Notion SOP.

#AIVideo #CreativeStrategy #VideoProduction`
      : `${fallbackHooks[0]}

Instead of blasting 5,000 generic emails, we switched to hyper-targeted signal-based enrichment.

Here is our 3-tier GTM engine:

1. Signal Detection
Monitor hiring surges, tech stack updates, and executive LinkedIn activity.

2. AI Enrichment Layer
Use Clay + Gemini to synthesize each prospect's biggest current bottleneck.

3. Micro-Personalized Outbound
Dynamic icebreakers that reference their actual public roadmap.

Result: 18+ high-intent discovery calls booked last week alone.

Want the step-by-step blueprint and email templates?

Comment "${keyword}" below and I'll send over the complete playbook.

#GTM #Outbound #SalesAutomation`;

    return NextResponse.json({
      success: true,
      data: {
        suggestedTitle: fallbackTitle,
        hooks: fallbackHooks,
        selectedHook: fallbackHooks[0],
        fullCopy: fallbackCopy,
        ctaKeyword: keyword,
        hashtags: isAiVideoVertical
          ? ['#AIVideo', '#CreativeStrategy', '#VideoProduction']
          : ['#GTM', '#Outbound', '#SalesAutomation'],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          message: error?.message || 'Failed to generate post copy',
        },
      },
      { status: 500 }
    );
  }
}
