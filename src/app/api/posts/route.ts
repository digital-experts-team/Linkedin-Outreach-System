import { NextRequest, NextResponse } from 'next/server';
import { fetchLinkedInPosts, createLinkedInPostInNotion } from '@/lib/notion/client';
import { PostsApiResponse } from '@/types/post';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<PostsApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const pageSizeParam = searchParams.get('pageSize');
    const statusParam = searchParams.get('status') || undefined;
    const verticalParam = searchParams.get('vertical') || undefined;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : undefined;

    const result = await fetchLinkedInPosts({
      cursor,
      pageSize,
      status: statusParam,
      vertical: verticalParam,
    });

    const responseHeaders = {
      'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (result.error) {
      const statusCode =
        result.error.code === 'CONFIG_REQUIRED'
          ? 500
          : result.error.code === 'UNAUTHORIZED'
          ? 401
          : result.error.code === 'NOT_FOUND_OR_FORBIDDEN'
          ? 404
          : result.error.code === 'RATE_LIMITED'
          ? 429
          : 500;

      return NextResponse.json(
        {
          posts: [],
          hasMore: false,
          nextCursor: null,
          error: result.error,
        },
        {
          status: statusCode,
          headers: responseHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        posts: result.posts,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        counts: result.counts,
        verticals: result.verticals,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        posts: [],
        hasMore: false,
        nextCursor: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'An unexpected internal server error occurred while retrieving LinkedIn posts.',
          details: error?.message || String(error),
        },
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      name,
      fullCopy,
      hook,
      vertical,
      status,
      scheduledDate,
      ctaKeyword,
      format,
      images,
    } = body;

    if (!fullCopy && !name && !hook) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Post title, hook, or copy is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await createLinkedInPostInNotion({
      name,
      fullCopy: fullCopy || '',
      hook,
      vertical: vertical || 'GTM',
      status: status || 'Draft',
      scheduledDate: scheduledDate || null,
      ctaKeyword,
      format,
      images,
    });

    const responseHeaders = {
      'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (!result.success || result.error) {
      return NextResponse.json(
        {
          error: result.error || {
            code: 'CREATE_ERROR',
            message: 'Failed to create post in Notion Content Hub',
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
        success: true,
        post: result.post,
      },
      {
        status: 201,
        headers: responseHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'CREATE_ERROR',
          message: error?.message || 'Failed to create post',
        },
      },
      { status: 500 }
    );
  }
}

