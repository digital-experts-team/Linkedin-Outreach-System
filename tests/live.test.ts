import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { normalizeNotionPage } from '../src/lib/notion/mapper';

describe('Live Notion API Verification', () => {
  it('fetches and normalizes live CRM records properly', async () => {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          process.env[key] = val;
        }
      }
    }

    const token = process.env.NOTION_TOKEN;
    const dataSourceId = process.env.NOTION_DATA_SOURCE_ID || '54c7f6ba-af95-826b-a9d6-870cda35a5dc';

    if (!token) {
      console.log('Skipping live test: No NOTION_TOKEN found.');
      return;
    }

    const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 10 }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    const mappedLeads = data.results.map((p: any) => normalizeNotionPage(p));
    console.log(`Successfully verified ${mappedLeads.length} live leads from Notion!`);

    for (const lead of mappedLeads) {
      expect(lead.id).toBeDefined();
      expect(lead.role).toBeDefined();
      expect(lead.verticalId).toBe('gtm');
      expect(lead.verticalLabel).toBe('GTM & Sales');
    }
  });
});
