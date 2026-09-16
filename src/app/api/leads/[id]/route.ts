import { NextRequest, NextResponse } from 'next/server';
import { fetchLeadByIdFromNotion } from '@/lib/notion/client';
import { LeadDetailApiResponse } from '@/types/lead';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LeadDetailApiResponse>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: 'Lead ID is required',
        },
      },
      { status: 400 }
    );
  }

  const result = await fetchLeadByIdFromNotion(id);

  const responseHeaders = {
    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
  };

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error,
      },
      {
        status: result.error.code === 'NOT_FOUND_OR_FORBIDDEN' ? 404 : 500,
        headers: responseHeaders,
      }
    );
  }

  return NextResponse.json(
    {
      lead: result.lead,
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
