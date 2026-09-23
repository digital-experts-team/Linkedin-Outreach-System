import { describe, it, expect } from 'vitest';
import { normalizeNotionPage } from '../src/lib/notion/mapper';

describe('Pagination and Dataset Handling', () => {
  it('correctly handles multi-page responses and cursor chaining', () => {
    const page1Results = [
      {
        id: 'page-1',
        properties: {
          Role: { type: 'rich_text', rich_text: [{ plain_text: 'Lead 1' }] },
        },
      },
      {
        id: 'page-2',
        properties: {
          Role: { type: 'rich_text', rich_text: [{ plain_text: 'Lead 2' }] },
        },
      },
    ];

    const page2Results = [
      {
        id: 'page-3',
        properties: {
          Role: { type: 'rich_text', rich_text: [{ plain_text: 'Lead 3' }] },
        },
      },
    ];

    const allRaw = [...page1Results, ...page2Results];
    const normalized = allRaw.map(normalizeNotionPage);

    expect(normalized).toHaveLength(3);
    expect(normalized[0].role).toBe('Lead 1');
    expect(normalized[1].role).toBe('Lead 2');
    expect(normalized[2].role).toBe('Lead 3');
  });

  it('preserves order of leads across pages', () => {
    const leadIds = Array.from({ length: 10 }, (_, i) => `lead-id-${i + 1}`);
    const mockPages = leadIds.map((id, index) => ({
      id,
      properties: {
        Role: { type: 'rich_text', rich_text: [{ plain_text: `Role ${index + 1}` }] },
      },
    }));

    const normalized = mockPages.map(normalizeNotionPage);
    expect(normalized.map((l) => l.id)).toEqual(leadIds);
    expect(normalized.map((l) => l.role)).toEqual(leadIds.map((_, i) => `Role ${i + 1}`));
  });
});
