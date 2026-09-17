import { NextRequest, NextResponse } from 'next/server';
import { updateLinkedInPostInNotion } from '@/lib/notion/client';
import { PostDetailApiResponse } from '@/types/post';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PostDetailApiResponse>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: 'Post ID is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { fullCopy, status } = body;

    const result = await updateLinkedInPostInNotion(id, { fullCopy, status });

    const responseHeaders = {
      'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (!result.success || result.error) {
      return NextResponse.json(
        {
          error: result.error || {
            code: 'FETCH_ERROR',
            message: 'Failed to update post in Notion Content Hub',
          },
        },
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        post: result.post,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: 'Invalid request body or update failed',
          details: err?.message,
        },
      },
      { status: 400 }
    );
  }
}
