import { describe, it, expect } from 'vitest';
import { normalizeNotionPostPage, extractFiles } from '../src/lib/notion/mapper';

describe('Notion Post Mapper Unit Tests', () => {
  it('extractFiles parses S3 and external images correctly', () => {
    const fileProp = {
      type: 'files',
      files: [
        {
          name: 'pipeline_architecture.png',
          type: 'file',
          file: {
            url: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/test.png',
            expiry_time: '2026-09-17T17:00:00.000Z',
          },
        },
      ],
    };

    const extracted = extractFiles(fileProp);
    expect(extracted).toHaveLength(1);
    expect(extracted[0].name).toBe('pipeline_architecture.png');
    expect(extracted[0].url).toContain('https://prod-files-secure.s3.us-west-2.amazonaws.com');
    expect(extracted[0].type).toBe('image');
  });

  it('normalizes full Notion post page object correctly', () => {
    const mockPostPage = {
      id: 'post_123',
      url: 'https://www.notion.so/post_123',
      properties: {
        Name: {
          type: 'title',
          title: [{ plain_text: 'M2 Hiring mgrs — AI Video Hire Breakdown' }],
        },
        'Full Copy': {
          type: 'rich_text',
          rich_text: [
            {
              plain_text:
                'If you are hiring an “AI video person” in 2026, the title is lying to you.\n\n#outreach #b2bsaas #growth',
            },
          ],
        },
        Hook: {
          type: 'rich_text',
          rich_text: [{ plain_text: 'If you are hiring an “AI video person” in 2026...' }],
        },
        Status: {
          type: 'select',
          select: { name: 'Scheduled' },
        },
        'Scheduled Date': {
          type: 'date',
          date: { start: '2026-09-18' },
        },
        Format: {
          type: 'select',
          select: { name: 'Media' },
        },
        Vertical: {
          type: 'select',
          select: { name: 'General AI Video' },
        },
        'CTA Keyword': {
          type: 'rich_text',
          rich_text: [{ plain_text: 'STACK' }],
        },
        Image: {
          type: 'files',
          files: [
            {
              name: 'flowchart.png',
              type: 'file',
              file: { url: 'https://notion.so/images/flowchart.png' },
            },
          ],
        },
      },
    };

    const post = normalizeNotionPostPage(mockPostPage);
    expect(post.id).toBe('post_123');
    expect(post.name).toBe('M2 Hiring mgrs — AI Video Hire Breakdown');
    expect(post.fullCopy).toContain('If you are hiring an “AI video person” in 2026');
    expect(post.status).toBe('Scheduled');
    expect(post.scheduledDate).toBe('2026-09-18');
    expect(post.format).toBe('Media');
    expect(post.vertical).toBe('General AI Video');
    expect(post.ctaKeyword).toBe('STACK');
    expect(post.images).toHaveLength(1);
    expect(post.images[0].url).toBe('https://notion.so/images/flowchart.png');
    expect(post.authorName).toBe('Alex Vance');
  });
});
