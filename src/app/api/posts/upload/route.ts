import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { saveImageFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate mime type
    const validImageMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    const validVideoMimes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-m4v',
      'video/ogg',
    ];

    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const isVideo =
      validVideoMimes.includes(fileType) ||
      /\.(mp4|webm|mov|m4v|ogg)$/i.test(fileName);
    const isImage =
      validImageMimes.includes(fileType) ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: { message: 'Only image files (PNG, JPG, WEBP, GIF, SVG) and video files (MP4, MOV, WEBM) are allowed.' } },
        { status: 400 }
      );
    }

    // Limit to 100MB for video, 20MB for image
    const maxLimit = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxLimit) {
      return NextResponse.json(
        { error: { message: `${isVideo ? 'Video' : 'Image'} size exceeds the ${isVideo ? '100MB' : '20MB'} limit.` } },
        { status: 400 }
      );
    }

    // Clean filename
    const ext = path.extname(file.name) || (isVideo ? '.mp4' : '.png');
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filename = `${baseName}_${uniqueSuffix}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await saveImageFile(filename, buffer);

    // Build URL
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = appUrl || `${proto}://${host}`;
    const publicUrl = `${baseUrl}/api/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      filename,
      size: file.size,
      type: isVideo ? 'video' : 'image',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          message: error?.message || 'Failed to upload image file',
        },
      },
      { status: 500 }
    );
  }
}
