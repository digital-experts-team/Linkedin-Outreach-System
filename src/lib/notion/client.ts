import { normalizeNotionPage, normalizeAiVideoNotionPage } from './mapper';
import { Lead, VerticalId } from '@/types/lead';

export interface FetchLeadsOptions {
  cursor?: string | null;
  pageSize?: number;
  vertical?: 'all' | VerticalId;
}

export interface FetchLeadsResult {
  leads: Lead[];
  hasMore: boolean;
  nextCursor: string | null;
  error?: {
    code: 'CONFIG_REQUIRED' | 'UNAUTHORIZED' | 'NOT_FOUND_OR_FORBIDDEN' | 'RATE_LIMITED' | 'FETCH_ERROR';
    message: string;
    details?: string;
  };
}

export interface FetchLeadResult {
  lead?: Lead;
  error?: {
    code: 'CONFIG_REQUIRED' | 'UNAUTHORIZED' | 'NOT_FOUND_OR_FORBIDDEN' | 'RATE_LIMITED' | 'FETCH_ERROR';
    message: string;
    details?: string;
  };
}

const DEFAULT_GTM_DATABASE_ID = '3d67f6ba-af95-80a3-8e5d-d540076d4370';
const DEFAULT_GTM_DATA_SOURCE_ID = '54c7f6ba-af95-826b-a9d6-870cda35a5dc';
const DEFAULT_AI_VIDEO_DATABASE_ID = 'e19006b9-a8ef-4be3-b487-c376633217ae';

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a Notion query request with bounded retry and error classification.
 */
async function queryNotionWithRetry(
  url: string,
  token: string,
  body: Record<string, any>,
  notionVersion: string = '2025-09-03',
  maxRetries: number = 3
): Promise<Response> {
  let attempt = 0;
  let delay = 500;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': notionVersion,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });

      if (response.status === 429 || (response.status >= 502 && response.status <= 504)) {
        attempt++;
        if (attempt >= maxRetries) {
          return response;
        }
        const retryAfterHeader = response.headers.get('Retry-After');
        const waitTime = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : delay;
        await wait(waitTime);
        delay *= 2;
        continue;
      }

      return response;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      await wait(delay);
      delay *= 2;
    }
  }

  throw new Error('Maximum retries exceeded');
}

/**
 * Fetches leads from the AI Video database.
 */
export async function fetchAiVideoLeads(options: FetchLeadsOptions = {}): Promise<FetchLeadsResult> {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_AI_VIDEO_DATABASE_ID?.trim() || DEFAULT_AI_VIDEO_DATABASE_ID;

  if (!token) {
    return {
      leads: [],
      hasMore: false,
      nextCursor: null,
      error: {
        code: 'CONFIG_REQUIRED',
        message: 'Notion integration token is not configured.',
      },
    };
  }

  const requestBody: Record<string, any> = {
    page_size: options.pageSize || 100,
  };
  if (options.cursor) {
    requestBody.start_cursor = options.cursor;
  }

  try {
    const databaseUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
    const response = await queryNotionWithRetry(databaseUrl, token, requestBody, '2022-06-28');

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      return {
        leads: [],
        hasMore: false,
        nextCursor: null,
        error: {
          code: response.status === 401 ? 'UNAUTHORIZED' : 'FETCH_ERROR',
          message: errorJson.message || `Notion API returned HTTP ${response.status}`,
        },
      };
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const leads = results.map((page: any) => normalizeAiVideoNotionPage(page));

    return {
      leads,
      hasMore: Boolean(data.has_more),
      nextCursor: data.next_cursor || null,
    };
  } catch (error: any) {
    return {
      leads: [],
      hasMore: false,
      nextCursor: null,
      error: {
        code: 'FETCH_ERROR',
        message: error?.message || 'Failed to fetch AI Video leads',
      },
    };
  }
}

/**
 * Fetches leads from the GTM database.
 */
export async function fetchGtmLeads(options: FetchLeadsOptions = {}): Promise<FetchLeadsResult> {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim() || DEFAULT_GTM_DATABASE_ID;
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim() || DEFAULT_GTM_DATA_SOURCE_ID;

  if (!token) {
    return {
      leads: [],
      hasMore: false,
      nextCursor: null,
      error: {
        code: 'CONFIG_REQUIRED',
        message: 'Notion integration token is not configured.',
      },
    };
  }

  const requestBody: Record<string, any> = {
    page_size: options.pageSize || 100,
  };
  if (options.cursor) {
    requestBody.start_cursor = options.cursor;
  }

  try {
    const dataSourceUrl = `https://api.notion.com/v1/data_sources/${dataSourceId}/query`;
    let response = await queryNotionWithRetry(dataSourceUrl, token, requestBody, '2025-09-03');

    if (response.status === 404) {
      const databaseUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
      response = await queryNotionWithRetry(databaseUrl, token, requestBody, '2022-06-28');
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      return {
        leads: [],
        hasMore: false,
        nextCursor: null,
        error: {
          code: response.status === 401 ? 'UNAUTHORIZED' : 'FETCH_ERROR',
          message: errorJson.message || `Notion API returned HTTP ${response.status}`,
        },
      };
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const leads = results.map((page: any) => normalizeNotionPage(page));

    return {
      leads,
      hasMore: Boolean(data.has_more),
      nextCursor: data.next_cursor || null,
    };
  } catch (error: any) {
    return {
      leads: [],
      hasMore: false,
      nextCursor: null,
      error: {
        code: 'FETCH_ERROR',
        message: error?.message || 'Failed to fetch GTM leads',
      },
    };
  }
}

/**
 * Server-side client function to fetch leads from Notion based on selected vertical.
 */
export async function fetchLeadsFromNotion(options: FetchLeadsOptions = {}): Promise<FetchLeadsResult> {
  const vertical = options.vertical || 'all';

  if (vertical === 'ai_video') {
    return fetchAiVideoLeads(options);
  }

  if (vertical === 'gtm') {
    return fetchGtmLeads(options);
  }

  // If 'all': fetch from both verticals concurrently
  const [gtmRes, aiVideoRes] = await Promise.all([
    fetchGtmLeads(options),
    fetchAiVideoLeads(options),
  ]);

  if (gtmRes.error && aiVideoRes.error) {
    return gtmRes;
  }

  const combinedLeads = [...(gtmRes.leads || []), ...(aiVideoRes.leads || [])];
  return {
    leads: combinedLeads,
    hasMore: gtmRes.hasMore || aiVideoRes.hasMore,
    nextCursor: gtmRes.nextCursor || aiVideoRes.nextCursor,
  };
}

/**
 * Fetches a single lead by its Notion page ID.
 */
export async function fetchLeadByIdFromNotion(pageId: string): Promise<FetchLeadResult> {
  const token = process.env.NOTION_TOKEN?.trim();

  if (!token) {
    return {
      error: {
        code: 'CONFIG_REQUIRED',
        message: 'Notion integration token is not configured.',
        details: 'Add NOTION_TOKEN to your .env.local file.',
      },
    };
  }

  try {
    const formattedId = pageId.replace(/-/g, '');
    const pageUrl = `https://api.notion.com/v1/pages/${formattedId}`;
    const response = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      return {
        error: {
          code: response.status === 404 ? 'NOT_FOUND_OR_FORBIDDEN' : 'FETCH_ERROR',
          message: errorJson.message || `Notion API returned HTTP ${response.status}`,
        },
      };
    }

    const page = await response.json();
    const lead = normalizeNotionPage(page);

    return {
      lead,
    };
  } catch (error: any) {
    return {
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to load lead details from Notion.',
        details: error?.message || String(error),
      },
    };
  }
}
