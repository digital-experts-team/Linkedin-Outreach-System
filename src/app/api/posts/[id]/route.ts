import { NextRequest, NextResponse } from 'next/server';
import { fetchLinkedInPostByIdFromNotion, updateLinkedInPostInNotion } from '@/lib/notion/client';
import { PostDetailApiResponse } from '@/types/post';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
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
    const result = await fetchLinkedInPostByIdFromNotion(id);

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
        post: result.post,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to load post details',
          details: error?.message || String(error),
        },
      },
      { status: 500 }
    );
  }
}

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
    const { fullCopy, status, scheduledDate, name, vertical } = body;

    const result = await updateLinkedInPostInNotion(id, {
      fullCopy,
      status,
      scheduledDate,
      name,
      vertical,
    });

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
