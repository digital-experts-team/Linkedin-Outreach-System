import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
    const validMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!validMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      return NextResponse.json(
        { error: { message: 'Only image files (PNG, JPG, WEBP, GIF, SVG) are allowed.' } },
        { status: 400 }
      );
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: { message: 'Image size exceeds the 10MB limit.' } },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Clean filename
    const ext = path.extname(file.name) || '.png';
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filename = `${baseName}_${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Build URL
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const publicUrl = `${proto}://${host}/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      filename,
      size: file.size,
      type: 'image',
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
