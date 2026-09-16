import { describe, it, expect } from 'vitest';
import {
  flattenRichText,
  flattenTitle,
  validateLinkedInUrl,
  parseScore,
  normalizeNotionPage,
} from '../src/lib/notion/mapper';
import {
  mockNotionPageFull,
  mockNotionPageFallbackDetails,
  mockNotionPageEmpty,
  mockNotionPageIntegerScore,
  mockNotionPageLowScore,
  mockNotionPageMidScore,
} from './fixtures/notionResponses';

describe('Notion Mapper Unit Tests', () => {
  describe('flattenRichText & flattenTitle', () => {
    it('flattens multiple rich text fragments in order without losing text', () => {
      const fragments = [
        { plain_text: 'Hello ' },
        { plain_text: 'World! ' },
        { plain_text: '🚀 Special punctuation: (testing—123).' },
      ];
      expect(flattenRichText(fragments)).toBe('Hello World! 🚀 Special punctuation: (testing—123).');
    });

    it('preserves line breaks across fragments', () => {
      const fragments = [
        { plain_text: 'Paragraph 1\n\n' },
        { plain_text: 'Paragraph 2 with "quotes"' },
      ];
      expect(flattenRichText(fragments)).toBe('Paragraph 1\n\nParagraph 2 with "quotes"');
    });

    it('returns empty string for null, undefined, or empty arrays', () => {
      expect(flattenRichText(null)).toBe('');
      expect(flattenRichText(undefined)).toBe('');
      expect(flattenRichText([])).toBe('');
      expect(flattenTitle([])).toBe('');
    });
  });

  describe('validateLinkedInUrl', () => {
    it('accepts valid HTTPS LinkedIn profile URLs', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/in/john-doe')).toBe(
        'https://www.linkedin.com/in/john-doe'
      );
      expect(validateLinkedInUrl('https://linkedin.com/in/jane-doe/')).toBe(
        'https://linkedin.com/in/jane-doe/'
      );
      expect(validateLinkedInUrl('https://uk.linkedin.com/in/someone')).toBe(
        'https://uk.linkedin.com/in/someone'
      );
    });

    it('rejects HTTP (non-HTTPS) URLs', () => {
      expect(validateLinkedInUrl('http://www.linkedin.com/in/john-doe')).toBeNull();
    });

    it('rejects lookalike or malicious domains', () => {
      expect(validateLinkedInUrl('https://linkedin.com.attacker.com/in/user')).toBeNull();
      expect(validateLinkedInUrl('https://notlinkedin.com/in/user')).toBeNull();
      expect(validateLinkedInUrl('https://fakelinkedin.com')).toBeNull();
      expect(validateLinkedInUrl('javascript:alert(1)')).toBeNull();
      expect(validateLinkedInUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects empty or malformed strings', () => {
      expect(validateLinkedInUrl('')).toBeNull();
      expect(validateLinkedInUrl('   ')).toBeNull();
      expect(validateLinkedInUrl('invalid-url')).toBeNull();
      expect(validateLinkedInUrl(undefined)).toBeNull();
      expect(validateLinkedInUrl(null)).toBeNull();
    });
  });

  describe('parseScore', () => {
    it('formats integer scores to one decimal place', () => {
      const score = parseScore({ name: '8' });
      expect(score).toEqual({
        raw: '8',
        formatted: '8.0',
        isNumeric: true,
        isHold: false,
        tier: 'green',
      });
    });

    it('preserves existing decimal scores and assigns correct tier', () => {
      const scoreHigh = parseScore({ name: '8.5' });
      expect(scoreHigh).toEqual({
        raw: '8.5',
        formatted: '8.5',
        isNumeric: true,
        isHold: false,
        tier: 'green',
      });

      const scoreMid = parseScore({ name: '6.7' });
      expect(scoreMid).toEqual({
        raw: '6.7',
        formatted: '6.7',
        isNumeric: true,
        isHold: false,
        tier: 'amber',
      });

      const scoreLow = parseScore({ name: '5.2' });
      expect(scoreLow).toEqual({
        raw: '5.2',
        formatted: '5.2',
        isNumeric: true,
        isHold: false,
        tier: 'red',
      });
    });

    it('handles Hold option as neutral badge without converting to zero or NaN', () => {
      const score = parseScore({ name: 'Hold' });
      expect(score).toEqual({
        raw: 'Hold',
        formatted: 'Hold',
        isNumeric: false,
        isHold: true,
        tier: 'neutral',
      });
    });

    it('returns null for empty or missing score', () => {
      expect(parseScore(null)).toBeNull();
      expect(parseScore(undefined)).toBeNull();
      expect(parseScore({ name: '' })).toBeNull();
    });

    it('handles future non-numeric labels neutrally', () => {
      const score = parseScore({ name: 'Under Review' });
      expect(score).toEqual({
        raw: 'Under Review',
        formatted: 'Under Review',
        isNumeric: false,
        isHold: false,
        tier: 'neutral',
      });
    });
  });

  describe('normalizeNotionPage', () => {
    it('correctly maps full Notion page to Lead model', () => {
      const lead = normalizeNotionPage(mockNotionPageFull);
      expect(lead.id).toBe('3d67f6ba-af95-80a3-8e5d-d540076d4370');
      expect(lead.role).toBe('Director of Operations');
      expect(lead.postedBy).toBe('Alex Thompson');
      expect(lead.company).toBe('VelocityScale');
      expect(lead.linkedInStatus).toBe('Draft Ready');
      expect(lead.linkedInDm).toBe(
        'Interested in scaling their sales team using AI video personalization.\nCurrently vetting 3 vendors for Q4 implementation.'
      );
      expect(lead.primaryContactLinkedIn).toBe('https://www.linkedin.com/in/alex-thompson-crm');
      expect(lead.primaryContactEmail).toBe('alex@velocityscale.io');
      expect(lead.phone).toBe('+1-555-0199');
      expect(lead.score).toEqual({
        raw: '8.4',
        formatted: '8.4',
        isNumeric: true,
        isHold: false,
        tier: 'green',
      });
      expect(lead.verticalId).toBe('gtm');
      expect(lead.verticalLabel).toBe('GTM & Sales');
    });

    it('falls back to Details when Role is missing', () => {
      const lead = normalizeNotionPage(mockNotionPageFallbackDetails);
      expect(lead.role).toBe('VP of Growth & Strategy');
      expect(lead.postedBy).toBe('Sarah Jenkins');
      expect(lead.company).toBeNull();
      expect(lead.score?.formatted).toBe('Hold');
      expect(lead.linkedInStatus).toBe('Follow Up');
    });

    it('falls back to "Untitled lead" when both Role and Details are missing', () => {
      const lead = normalizeNotionPage(mockNotionPageEmpty);
      expect(lead.role).toBe('Untitled lead');
      expect(lead.postedBy).toBeNull();
      expect(lead.company).toBeNull();
      expect(lead.linkedInStatus).toBe('No status');
      expect(lead.linkedInDm).toBe('');
      expect(lead.primaryContactLinkedIn).toBeNull();
      expect(lead.score).toBeNull();
    });

    it('handles integer score formatting in full lead mapping', () => {
      const lead = normalizeNotionPage(mockNotionPageIntegerScore);
      expect(lead.score?.formatted).toBe('8.0');
      expect(lead.score?.tier).toBe('green');
    });

    it('handles mid and low score tier colors', () => {
      const leadMid = normalizeNotionPage(mockNotionPageMidScore);
      expect(leadMid.score?.tier).toBe('amber');

      const leadLow = normalizeNotionPage(mockNotionPageLowScore);
      expect(leadLow.score?.tier).toBe('red');
    });
  });
});
