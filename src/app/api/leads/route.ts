import { NextRequest, NextResponse } from 'next/server';
import { fetchLeadsFromNotion, fetchAllLeadsFromNotion } from '@/lib/notion/client';
import { LeadsApiResponse } from '@/types/lead';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<LeadsApiResponse>> {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const fetchAll = searchParams.get('all') === 'true';

  let result;
  if (fetchAll) {
    result = await fetchAllLeadsFromNotion();
  } else {
    result = await fetchLeadsFromNotion({ cursor: cursor || undefined });
  }

  const responseHeaders = {
    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
  };

  if (result.error) {
    return NextResponse.json(
      {
        leads: [],
        hasMore: false,
        nextCursor: null,
        error: result.error,
      },
      {
        status: result.error.code === 'CONFIG_REQUIRED' ? 200 : 500,
        headers: responseHeaders,
      }
    );
  }

  return NextResponse.json(
    {
      leads: result.leads,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      totalCount: result.leads.length,
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
