import { NextRequest, NextResponse } from 'next/server';
import { fetchViralTrends, addViralTrend } from '@/lib/notion/trends';
import { GoogleGenAI } from '@google/genai';
import { ViralTrendPost } from '@/types/trend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical') || 'All';
    const archetype = searchParams.get('archetype') || 'All';
    const query = searchParams.get('query') || '';

    const data = await fetchViralTrends({
      vertical,
      archetype,
      query,
    });

    const responseHeaders = {
      'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
      Pragma: 'no-cache',
    };

    return NextResponse.json(
      {
        success: true,
        trends: data.trends,
        counts: data.counts,
        source: data.source,
      },
      {
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: error?.message || 'Failed to load viral trends',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trends: Automated AI trend discovery or manual URL/text ingestion.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url = '', rawText = '', vertical = 'GTM', action = 'ingest' } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const isAiVideo = vertical.toLowerCase().includes('video') || vertical.toLowerCase().includes('creative');

    // If action is "auto_discover", use Gemini to generate a freshly discovered trending photo post archetype
    if (action === 'auto_discover' && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a viral LinkedIn content intelligence engine tracking top-performing visual photo posts.
Generate a high-performing trending LinkedIn post WITH A PHOTO / DIAGRAM / CHEATSHEET for the "${isAiVideo ? 'AI Video & Creative Strategy' : 'GTM Automations & Outbound Growth'}" vertical.

Format requirements:
- Must revolve around an attached photo (e.g. Architecture Diagram, Workflow Screenshot, Side-by-Side Comparison Grid, or Cheatsheet Infographic).
- Must include strategic company @tags (e.g. @Clay, @Apollo.io, @Runway, @Midjourney, @Instantly.ai, @Smartlead).
- Explainable Decision Insights: Why this hook works, why this photo format works, tagging strategy rationale, and dwell-time score.
- Repurpose blueprint tailored for Tibin Jacob.

Return STRICT JSON matching this schema:
{
  "title": "Short title describing the visual asset",
  "vertical": "${isAiVideo ? 'AI Video' : 'GTM'}",
  "photoArchetype": "Architecture Diagram" | "Workflow Screenshot" | "Comparison Grid" | "Cheat Sheet Infographic",
  "photoDescription": "Detailed breakdown of what is shown in the image",
  "hook": "Punchy first 2 lines under 140 characters",
  "fullCopy": "Full viral post copy with bullet points and clear CTA",
  "likesCount": 1850,
  "commentsCount": 420,
  "repostsCount": 130,
  "viralScore": 98,
  "originalAuthor": {
    "name": "Creator Name",
    "handle": "@creator_handle",
    "headline": "Role & Company",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  "taggedEntities": [
    { "name": "ToolName", "handle": "@ToolHandle", "type": "company", "reason": "Why tagged" }
  ],
  "decisionInsights": {
    "hookPsychology": { "type": "Loss Aversion", "whyItWorks": "...", "dwellTimeImpact": "..." },
    "visualStrategy": { "archetype": "Workflow Screenshot", "whyThisPhotoWorks": "...", "aspectRatio": "16:9", "visualRetentionScore": 96 },
    "taggingStrategy": { "suggestedTags": [], "rationale": "...", "amplificationProbability": "Very High" },
    "conversionArchitecture": { "ctaTrigger": "RESOURCE", "whyItWorks": "..." }
  },
  "repurposeBlueprint": {
    "recommendedHook": "...",
    "recommendedCopy": "...",
    "photoConcept": "...",
    "tagsToInclude": ["@Tool"],
    "ctaTrigger": "RESOURCE",
    "vertical": "${isAiVideo ? 'AI Video' : 'GTM'}"
  }
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const raw = aiResponse.text || '';
        const parsed = JSON.parse(raw);

        const newTrend: ViralTrendPost = {
          id: `trend-ai-${Date.now()}`,
          title: parsed.title,
          vertical: parsed.vertical || (isAiVideo ? 'AI Video' : 'GTM'),
          photoArchetype: parsed.photoArchetype || 'Workflow Screenshot',
          imageUrl: isAiVideo
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80',
          imageAlt: parsed.title,
          photoDescription: parsed.photoDescription,
          hook: parsed.hook,
          fullCopy: parsed.fullCopy,
          likesCount: parsed.likesCount || 1600,
          commentsCount: parsed.commentsCount || 340,
          repostsCount: parsed.repostsCount || 95,
          viralScore: parsed.viralScore || 97,
          sourceUrl: url || 'https://linkedin.com',
          originalAuthor: parsed.originalAuthor || {
            name: 'Industry Lead',
            handle: '@industry_lead',
            headline: isAiVideo ? 'AI Creative Technologist' : 'Head of Growth Engineering',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
          taggedEntities: parsed.taggedEntities || [],
          decisionInsights: parsed.decisionInsights,
          repurposeBlueprint: parsed.repurposeBlueprint,
        };

        await addViralTrend(newTrend);
        return NextResponse.json({ success: true, trend: newTrend });
      } catch (geminiErr) {
        console.error('Gemini trend discovery failed:', geminiErr);
      }
    }

    // Manual URL or Text Ingest
    const newTrend: ViralTrendPost = {
      id: `trend-manual-${Date.now()}`,
      title: rawText ? rawText.slice(0, 45) + '...' : `Discovered Trend from ${url || 'LinkedIn'}`,
      vertical: isAiVideo ? 'AI Video' : 'GTM',
      photoArchetype: 'Workflow Screenshot',
      imageUrl: isAiVideo
        ? 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1000&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&auto=format&fit=crop&q=80',
      imageAlt: 'Viral LinkedIn photo asset',
      photoDescription: 'Annotated visual workflow diagram and dataset breakdown.',
      hook: rawText ? rawText.split('\n')[0] : 'Viral post breakdown with high dwell-time photo asset.',
      fullCopy: rawText || `Breakdown of viral post from ${url}.\n\nHigh-performing visual photo format with verified audience retention.`,
      likesCount: 1450,
      commentsCount: 320,
      repostsCount: 88,
      viralScore: 95,
      sourceUrl: url || 'https://linkedin.com',
      originalAuthor: {
        name: 'LinkedIn Trendsetter',
        handle: '@trendsetter',
        headline: isAiVideo ? 'Creative Producer' : 'Growth Architect',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      taggedEntities: isAiVideo
        ? [{ name: 'Runway', handle: '@Runway', type: 'company', reason: 'Video production tech' }]
        : [{ name: 'Clay', handle: '@Clay', type: 'company', reason: 'Orchestration tech' }],
      decisionInsights: {
        hookPsychology: {
          type: 'Curiosity Gap + Proof',
          whyItWorks: 'Direct contrast with quantified metrics creates instant engagement.',
          dwellTimeImpact: 'Visual photo creates >50s mobile dwell time.',
        },
        visualStrategy: {
          archetype: 'Workflow Screenshot',
          whyThisPhotoWorks: 'Real-world visual proof dramatically increases saves and reposts.',
          aspectRatio: '16:9',
          visualRetentionScore: 95,
        },
        taggingStrategy: {
          suggestedTags: isAiVideo
            ? [{ name: 'Runway', handle: '@Runway', type: 'company', reason: 'Brand amplification' }]
            : [{ name: 'Clay', handle: '@Clay', type: 'company', reason: 'Brand amplification' }],
          rationale: 'Tagging tools at natural points maximizes organic reshares.',
          amplificationProbability: 'High',
        },
        conversionArchitecture: {
          ctaTrigger: isAiVideo ? 'PROMPT' : 'STACK',
          whyItWorks: 'Frictionless comment word drives velocity.',
        },
      },
      repurposeBlueprint: {
        recommendedHook: rawText ? rawText.split('\n')[0] : 'Here is the exact visual workflow we deploy for clients:',
        recommendedCopy: rawText || 'Full repurposed copy tailored to your goals...',
        photoConcept: 'High-contrast annotated visual diagram.',
        tagsToInclude: isAiVideo ? ['@Runway'] : ['@Clay'],
        ctaTrigger: isAiVideo ? 'PROMPT' : 'STACK',
        vertical: isAiVideo ? 'AI Video' : 'GTM',
      },
    };

    await addViralTrend(newTrend);
    return NextResponse.json({ success: true, trend: newTrend }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INGEST_ERROR',
          message: error?.message || 'Failed to ingest trend',
        },
      },
      { status: 500 }
    );
  }
}
