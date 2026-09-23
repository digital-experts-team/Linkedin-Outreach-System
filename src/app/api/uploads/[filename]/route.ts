import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getImageFile, saveImageFile } from '@/lib/storage';
import { Resvg } from '@resvg/resvg-js';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    let fileBuffer = await getImageFile(filename);

    // Dynamic recovery for AI visuals on serverless instances if ephemeral storage was purged
    if (!fileBuffer && filename.startsWith('ai_') && filename.endsWith('.png')) {
      try {
        const parts = filename.replace(/^ai_/, '').replace(/\.png$/, '').split('_');
        const titleWords = parts.filter((p) => !/^\d+$/.test(p) && !/^v\d+$/.test(p));
        const rawTitle = titleWords.join(' ');
        const displayTitle = (rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)).slice(0, 40) || 'LinkedIn Visual';

        const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 627" width="1200" height="627">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#f8fafc"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="627" fill="url(#bg)"/>
          <rect x="24" y="24" width="1152" height="579" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
          <g transform="translate(100, 100)">
            <rect width="180" height="32" rx="16" fill="#f1f5f9"/>
            <text x="90" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0a66c2" text-anchor="middle" letter-spacing="1">LINKEDIN INSIGHT</text>
            <text x="0" y="140" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#0f172a" letter-spacing="-1">
              ${displayTitle.toUpperCase()}
            </text>
            <text x="0" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#64748b">
              Core Strategic Framework &amp; Key Principles
            </text>
          </g>
          <text x="1080" y="560" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0a66c2" text-anchor="end">
            LINKEDIN CONTENT SYSTEM
          </text>
        </svg>`;

        const resvg = new Resvg(svgFallback, { fitTo: { mode: 'width', value: 1200 } });
        fileBuffer = resvg.render().asPng();
        await saveImageFile(filename, fileBuffer);
      } catch (genErr) {
        console.error('Failed to regenerate fallback visual:', genErr);
      }
    }

    if (!fileBuffer) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.mov') contentType = 'video/quicktime';
    else if (ext === '.m4v') contentType = 'video/x-m4v';
    else if (ext === '.ogg' || ext === '.ogv') contentType = 'video/ogg';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
