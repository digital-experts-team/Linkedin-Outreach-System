import { ViralTrendPost } from '@/types/trend';
import { INITIAL_VIRAL_PHOTO_TRENDS } from '@/lib/trends/data';

export const DEFAULT_TRENDS_DATABASE_ID = 'ae25432a-5718-47de-a8d7-0d16233a129a';

// In-memory store for newly ingested or fetched trends during the session
let cachedTrends: ViralTrendPost[] = [...INITIAL_VIRAL_PHOTO_TRENDS];

// Author avatar mapping for high fidelity display
const CREATOR_AVATARS: Record<string, string> = {
  'otto tatton': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'alex vacca': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'eric nowoslawski': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'rory flynn': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'heather cooper': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

function getCreatorAvatar(name: string): string {
  const normalized = (name || '').toLowerCase().trim();
  if (CREATOR_AVATARS[normalized]) return CREATOR_AVATARS[normalized];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Creator')}&background=0a66c2&color=fff&size=128&bold=true`;
}

/**
 * Fetches viral photo trends from Notion if NOTION_TRENDS_DATABASE_ID is configured,
 * or returns the curated live viral trends dataset.
 */
export async function fetchViralTrends(options: {
  vertical?: string;
  archetype?: string;
  query?: string;
} = {}): Promise<{
  trends: ViralTrendPost[];
  counts: { total: number; gtm: number; aiVideo: number };
  source: 'notion' | 'curated_radar';
}> {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_TRENDS_DATABASE_ID?.trim() || DEFAULT_TRENDS_DATABASE_ID;

  let trendsToFilter = [...cachedTrends];
  let dataSource: 'notion' | 'curated_radar' = 'curated_radar';

  // If a user has provided a Notion Trends Database ID, attempt to fetch from Notion
  if (token && databaseId) {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 50,
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          dataSource = 'notion';
          // Parse Notion pages into ViralTrendPost structure if available
          const notionTrends = data.results.map((page: any, index: number) => {
            const props = page.properties || {};
            const title =
              props.Name?.title?.[0]?.plain_text ||
              props.Title?.title?.[0]?.plain_text ||
              `Trend #${index + 1}`;
            const vertical =
              props.Vertical?.select?.name ||
              props.Category?.select?.name ||
              'GTM';
            const hook =
              props.Hook?.rich_text?.[0]?.plain_text ||
              props.Headline?.rich_text?.[0]?.plain_text ||
              title;
            const copy =
              props['Full Copy']?.rich_text?.[0]?.plain_text ||
              props.Copy?.rich_text?.[0]?.plain_text ||
              props.Content?.rich_text?.[0]?.plain_text ||
              hook;
            const archetype =
              props.Archetype?.select?.name ||
              props.Format?.select?.name ||
              props.Type?.select?.name ||
              'Workflow Screenshot';

            // Image support (Notion file attachment, external file link, or URL property)
            const fileItem =
              props.Image?.files?.[0] ||
              props['Files & media']?.files?.[0] ||
              props.Media?.files?.[0];
            const imageUrl =
              fileItem?.file?.url ||
              fileItem?.external?.url ||
              props['Image URL']?.url ||
              props.ImageURL?.url ||
              props.ImageUrl?.url ||
              INITIAL_VIRAL_PHOTO_TRENDS[index % INITIAL_VIRAL_PHOTO_TRENDS.length].imageUrl;

            const sourceUrl =
              props.URL?.url ||
              props['Post URL']?.url ||
              props.Link?.url ||
              page.url;

            const authorName =
              props.Author?.rich_text?.[0]?.plain_text ||
              props.Creator?.rich_text?.[0]?.plain_text ||
              'LinkedIn Creator';

            const authorHandle =
              props.Handle?.rich_text?.[0]?.plain_text ||
              `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            // Multi-select tags or comma-separated rich text
            const rawTags: string[] = [];
            if (props.Tags?.multi_select) {
              props.Tags.multi_select.forEach((t: any) => {
                if (t.name) rawTags.push(t.name.startsWith('@') ? t.name : `@${t.name}`);
              });
            } else if (props.Tags?.rich_text?.[0]?.plain_text) {
              props.Tags.rich_text[0].plain_text
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
                .forEach((t: string) => rawTags.push(t.startsWith('@') ? t : `@${t}`));
            }

            const taggedEntities = rawTags.length > 0
              ? rawTags.map((h) => ({
                  name: h.replace('@', ''),
                  handle: h,
                  type: 'company' as const,
                  reason: 'Ecosystem brand / mention',
                }))
              : (vertical === 'AI Video'
                  ? [{ name: 'Runway', handle: '@Runway', type: 'company' as const, reason: 'Ecosystem tool' }]
                  : [{ name: 'Clay', handle: '@Clay', type: 'company' as const, reason: 'Ecosystem tool' }]);

            const photoDescription =
              props.Description?.rich_text?.[0]?.plain_text ||
              props['Photo Direction']?.rich_text?.[0]?.plain_text ||
              'High retention LinkedIn photo / diagram asset';

            const likes = props.Likes?.number || props.Reactions?.number || 500;
            const comments = props.Comments?.number || 80;
            const reposts = props.Reposts?.number || props.Shares?.number || 25;
            const viralScore = props.ViralScore?.number || props['Viral Score']?.number || 92;

            return {
              id: page.id,
              title,
              vertical: vertical.toLowerCase().includes('video') ? 'AI Video' : 'GTM',
              photoArchetype: archetype,
              imageUrl,
              imageAlt: title,
              photoDescription,
              hook,
              fullCopy: copy,
              likesCount: likes,
              commentsCount: comments,
              repostsCount: reposts,
              viralScore,
              sourceUrl,
              originalAuthor: {
                name: authorName,
                handle: authorHandle.startsWith('@') ? authorHandle : `@${authorHandle}`,
                headline: 'Top Voice in Ecosystem',
                avatarUrl: getCreatorAvatar(authorName),
              },
              taggedEntities,
              decisionInsights: {
                hookPsychology: {
                  type: 'Curiosity Gap + Framework',
                  whyItWorks: 'High dwell-time visual pairing with counter-intuitive insight.',
                  dwellTimeImpact: '60+ seconds dwell time',
                },
                visualStrategy: {
                  archetype,
                  whyThisPhotoWorks: 'Infographic/diagram that invites zoom and saving.',
                  aspectRatio: '16:9 / 1:1',
                  visualRetentionScore: viralScore,
                },
                taggingStrategy: {
                  suggestedTags: taggedEntities,
                  rationale: 'Tagging tools shown in image maximizes reach.',
                  amplificationProbability: 'High',
                },
                conversionArchitecture: {
                  ctaTrigger: vertical.toLowerCase().includes('video') ? 'PROMPT' : 'STACK',
                  whyItWorks: 'Low-friction 1-word comment trigger.',
                },
              },
              repurposeBlueprint: {
                recommendedHook: hook,
                recommendedCopy: copy,
                photoConcept: photoDescription,
                tagsToInclude: taggedEntities.map((t) => t.handle),
                ctaTrigger: vertical.toLowerCase().includes('video') ? 'PROMPT' : 'STACK',
                vertical: vertical.toLowerCase().includes('video') ? 'AI Video' : 'GTM',
              },
            } as ViralTrendPost;
          });

          // Use real Notion database trends directly
          trendsToFilter = notionTrends;
        }
      }
    } catch (err) {
      console.warn('Could not query custom Notion Trends database, using curated radar:', err);
    }
  }

  const baseTrends = trendsToFilter;

  // Filter by vertical
  if (options.vertical && options.vertical !== 'All') {
    trendsToFilter = trendsToFilter.filter(
      (t) => t.vertical.toLowerCase() === options.vertical?.toLowerCase()
    );
  }

  // Filter by photo archetype
  if (options.archetype && options.archetype !== 'All') {
    trendsToFilter = trendsToFilter.filter(
      (t) => t.photoArchetype.toLowerCase() === options.archetype?.toLowerCase()
    );
  }

  // Filter by search query
  if (options.query && options.query.trim()) {
    const q = options.query.toLowerCase().trim();
    trendsToFilter = trendsToFilter.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.hook.toLowerCase().includes(q) ||
        t.fullCopy.toLowerCase().includes(q) ||
        t.photoDescription.toLowerCase().includes(q) ||
        t.taggedEntities.some((te) => te.name.toLowerCase().includes(q) || te.handle.toLowerCase().includes(q))
    );
  }

  const counts = {
    total: baseTrends.length,
    gtm: baseTrends.filter((t) => t.vertical === 'GTM').length,
    aiVideo: baseTrends.filter((t) => t.vertical === 'AI Video').length,
    growthStacks: baseTrends.filter((t) => t.vertical === 'Growth Stacks').length,
  };

  return {
    trends: trendsToFilter,
    counts,
    source: dataSource,
  };
}

/**
 * Add a new trend into the radar (and save to Notion if NOTION_TRENDS_DATABASE_ID is set).
 */
export async function addViralTrend(trend: ViralTrendPost): Promise<ViralTrendPost> {
  cachedTrends = [trend, ...cachedTrends];

  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_TRENDS_DATABASE_ID?.trim() || DEFAULT_TRENDS_DATABASE_ID;

  if (token && databaseId) {
    try {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Name: { title: [{ type: 'text', text: { content: trend.title } }] },
            Vertical: { select: { name: trend.vertical } },
            Archetype: { select: { name: trend.photoArchetype } },
            Hook: { rich_text: [{ type: 'text', text: { content: trend.hook.slice(0, 1900) } }] },
            'Full Copy': { rich_text: [{ type: 'text', text: { content: trend.fullCopy.slice(0, 1900) } }] },
            'Image URL': trend.imageUrl ? { url: trend.imageUrl } : undefined,
            URL: trend.sourceUrl ? { url: trend.sourceUrl } : undefined,
            Author: trend.originalAuthor.name ? { rich_text: [{ type: 'text', text: { content: trend.originalAuthor.name } }] } : undefined,
            Handle: trend.originalAuthor.handle ? { rich_text: [{ type: 'text', text: { content: trend.originalAuthor.handle.replace('@', '') } }] } : undefined,
            Description: trend.photoDescription ? { rich_text: [{ type: 'text', text: { content: trend.photoDescription.slice(0, 1900) } }] } : undefined,
            Likes: { number: trend.likesCount },
            Comments: { number: trend.commentsCount },
            Reposts: { number: trend.repostsCount },
            'Viral Score': { number: trend.viralScore },
          },
        }),
      });
    } catch (err) {
      console.warn('Failed to persist trend to Notion:', err);
    }
  }

  return trend;
}
