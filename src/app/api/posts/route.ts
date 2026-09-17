import { NextRequest, NextResponse } from 'next/server';
import { fetchLinkedInPosts } from '@/lib/notion/client';
import { PostsApiResponse } from '@/types/post';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<PostsApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const pageSizeParam = searchParams.get('pageSize');
    const statusParam = searchParams.get('status') || undefined;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : undefined;

    const result = await fetchLinkedInPosts({
      cursor,
      pageSize,
      status: statusParam,
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
