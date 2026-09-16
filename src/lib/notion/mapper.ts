import { Lead, ScoreInfo, ScoreTier } from '@/types/lead';

/**
 * Extracts plain text from Notion rich text array, flattening all fragments
 * in order while preserving newlines, punctuation, and Unicode characters.
 */
export function flattenRichText(richTextArray: any[] | undefined | null): string {
  if (!richTextArray || !Array.isArray(richTextArray) || richTextArray.length === 0) {
    return '';
  }
  return richTextArray.map((fragment) => fragment.plain_text || '').join('');
}

/**
 * Extracts title plain text from Notion title property array.
 */
export function flattenTitle(titleArray: any[] | undefined | null): string {
  if (!titleArray || !Array.isArray(titleArray) || titleArray.length === 0) {
    return '';
  }
  return titleArray.map((fragment) => fragment.plain_text || '').join('');
}

/**
 * Extracts select value string safely.
 */
export function extractSelect(selectProp: any): string | null {
  return selectProp?.select?.name?.trim() || null;
}

/**
 * Extracts date start value string safely.
 */
export function extractDate(dateProp: any): string | null {
  if (dateProp?.date?.start) {
    return dateProp.date.start;
  }
  if (dateProp?.type === 'rich_text') {
    return flattenRichText(dateProp.rich_text)?.trim() || null;
  }
  return null;
}

/**
 * Extracts multi-select value strings array.
 */
export function extractMultiSelect(multiSelectProp: any): string[] {
  if (multiSelectProp?.multi_select && Array.isArray(multiSelectProp.multi_select)) {
    return multiSelectProp.multi_select.map((item: any) => item.name).filter(Boolean);
  }
  if (multiSelectProp?.type === 'rich_text') {
    const text = flattenRichText(multiSelectProp.rich_text)?.trim();
    return text ? [text] : [];
  }
  return [];
}

/**
 * Validates LinkedIn profile URL:
 * - Must be valid HTTPS URL
 * - Hostname must be strictly 'linkedin.com' or a valid subdomain like '*.linkedin.com'
 * - Rejects lookalikes, non-HTTPS, and executable schemes (javascript:, data:)
 */
export function validateLinkedInUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isLinkedInHost =
      hostname === 'linkedin.com' ||
      /^[a-zA-Z0-9-]+\.linkedin\.com$/.test(hostname) ||
      /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.linkedin\.com$/.test(hostname);

    if (!isLinkedInHost) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Parses Score select property according to authoritative rules:
 * - Empty/null: returns null (badge omitted)
 * - 'Hold': returns neutral Hold badge
 * - Finite number: formats to 1 decimal place (e.g. 8 -> 8.0, 7.5 -> 7.5)
 * - Numeric color tiers: >= 8.0 green, 6.0 to < 8.0 amber, < 6.0 red
 * - Other non-numeric: returns neutral label
 */
export function parseScore(scoreSelect: { name?: string } | undefined | null): ScoreInfo | null {
  if (!scoreSelect || !scoreSelect.name) {
    return null;
  }
  const raw = scoreSelect.name.trim();
  if (!raw) {
    return null;
  }

  if (raw.toLowerCase() === 'hold') {
    return {
      raw,
      formatted: 'Hold',
      isNumeric: false,
      isHold: true,
      tier: 'neutral',
    };
  }

  const num = Number(raw);
  if (!isNaN(num) && isFinite(num) && raw !== '') {
    let tier: ScoreTier = 'neutral';
    if (num >= 8.0) {
      tier = 'green';
    } else if (num >= 6.0) {
      tier = 'amber';
    } else {
      tier = 'red';
    }

    return {
      raw,
      formatted: num.toFixed(1),
      isNumeric: true,
      isHold: false,
      tier,
    };
  }

  return {
    raw,
    formatted: raw,
    isNumeric: false,
    isHold: false,
    tier: 'neutral',
  };
}

/**
 * Normalizes an AI Video Notion page object into a typed Lead model.
 * Outer page: Details (heading) + LinkedIn DM.
 * Inner page: Why Signal Apt, Posted date, and all necessary details.
 */
export function normalizeAiVideoNotionPage(page: any): Lead {
  const properties = page.properties || {};

  // Outer Page: Heading is Details (title property)
  const detailsHeading = flattenTitle(properties['Details']?.title)?.trim();
  const roleHeading = detailsHeading || flattenRichText(properties['Role']?.rich_text)?.trim() || 'Untitled lead';

  // Contact / Poster display name
  const primaryContactName = flattenRichText(properties['Primary Contact Name']?.rich_text)?.trim();
  const postedByRaw = primaryContactName || flattenRichText(properties['Posted by']?.rich_text)?.trim() || null;
  const companyRaw = flattenRichText(properties['Company']?.rich_text)?.trim() || null;

  // Status & Score
  const linkedInStatusSelect = properties['LinkedIn Status']?.select;
  const linkedInStatus = linkedInStatusSelect?.name?.trim() || 'No status';
  const score = parseScore(properties['Score']?.select);

  // Outer Page & Outreach: LinkedIn DM
  const linkedInDm = flattenRichText(properties['LinkedIn DM']?.rich_text);

  // Contacts
  const primaryContactLinkedIn = validateLinkedInUrl(properties['Primary Contact LinkedIn']?.url);
  const emailRaw = properties['Primary Contact Email']?.email;
  const primaryContactEmail = typeof emailRaw === 'string' && emailRaw.trim() ? emailRaw.trim() : null;
  const phoneRaw = properties['Phone']?.phone_number;
  const phone = typeof phoneRaw === 'string' && phoneRaw.trim() ? phoneRaw.trim() : null;

  // Inner Page: Why Signal Apt & Posted date
  const whySignalApt =
    flattenRichText(properties['Why Signal Apt']?.rich_text) ||
    flattenRichText(properties['Why Signal apt']?.rich_text) ||
    null;

  const posted = extractDate(properties['Posted']) || extractDate(properties['Signal Date']);
  const signalSnippet = flattenRichText(properties['Signal Snippet']?.rich_text)?.trim() || null;
  const signalType = extractSelect(properties['Signal Type']);
  const painPoints = extractMultiSelect(properties['Pain Points']);
  const enrichmentNotes = flattenRichText(properties['Enrichment Notes']?.rich_text)?.trim() || null;
  const notes = flattenRichText(properties['Notes']?.rich_text)?.trim() || null;
  const sourceLink = properties['Source Link']?.url?.trim() || properties['Signal Link']?.url?.trim() || null;
  const linkedInPostUrl = properties['LinkedIn Post URL']?.url?.trim() || null;
  const location = flattenRichText(properties['Location']?.rich_text)?.trim() || null;
  const sourceType = extractSelect(properties['Source Type']) || 'LinkedIn';
  const stage = extractSelect(properties['Stage']);

  return {
    id: page.id,
    notionUrl: page.url || `https://www.notion.so/${page.id.replace(/-/g, '')}`,
    role: roleHeading,
    postedBy: postedByRaw,
    company: companyRaw,
    linkedInStatus,
    linkedInDm,
    primaryContactLinkedIn,
    primaryContactEmail,
    phone,
    score,
    verticalId: 'ai_video',
    verticalLabel: 'AI Video & Hiring',

    whySignalApt,
    posted,
    signalSnippet,
    signalType,
    painPoints,
    enrichmentNotes,
    notes,
    sourceLink,
    linkedInPostUrl,
    location,
    sourceType,
    stage,
  };
}

/**
 * Normalizes a raw Notion page object into a typed Lead model
 * using authoritative field mapping rules. Automatically detects AI Video vs GTM pages.
 */
export function normalizeNotionPage(page: any): Lead {
  const properties = page.properties || {};

  // If page has "Why Signal Apt", "Signal Snippet", or "Signal Type", it is an AI Video page
  if (properties['Why Signal Apt'] || properties['Why Signal apt'] || properties['Signal Type'] || properties['Primary Contact Name']) {
    return normalizeAiVideoNotionPage(page);
  }

  // 1. Job Role extraction with smart fallback (GTM)
  const roleRaw = flattenRichText(properties['Role']?.rich_text)?.trim();
  const detailsRaw = flattenTitle(properties['Details']?.title)?.trim();
  let companyRaw = flattenRichText(properties['Company']?.rich_text)?.trim() || null;
  const postedByRaw = flattenRichText(properties['Posted by']?.rich_text)?.trim() || null;

  let role = roleRaw || null;

  // If Role property is empty, extract from Details
  if (!role && detailsRaw) {
    if (detailsRaw.includes('—') || detailsRaw.includes('–') || detailsRaw.includes(' - ')) {
      const parts = detailsRaw.split(/\s*[—–]\s*|\s+-\s+/);
      if (parts.length >= 2) {
        if (!companyRaw && parts[0].trim()) {
          companyRaw = parts[0].trim();
        }
        if (parts[1].trim()) {
          role = parts[1].trim();
        }
      }
    } else {
      const match = detailsRaw.match(
        /(?:hiring|recruiting|seeking|looking for)(?:\s+(?:for\s+)?(?:a|an|the))?\s+([^,.]+?)(?:\s+(?:role|position|for|with|in|to|\.|$))/i
      );
      if (match && match[1] && match[1].length < 60) {
        role = match[1].trim();
      } else {
        role = detailsRaw;
      }
    }
  }

  // If company is still empty, check if Details has "Company — ..."
  if (!companyRaw && detailsRaw && (detailsRaw.includes('—') || detailsRaw.includes('–') || detailsRaw.includes(' - '))) {
    const parts = detailsRaw.split(/\s*[—–]\s*|\s+-\s+/);
    if (parts.length >= 2 && parts[0].trim()) {
      companyRaw = parts[0].trim();
    }
  }

  // If company is still empty, check if Posted by has "Name — Role, Company"
  if (!companyRaw && postedByRaw && postedByRaw.includes(',')) {
    const afterComma = postedByRaw.split(',')[1]?.trim();
    if (afterComma && afterComma.length < 50) {
      companyRaw = afterComma;
    }
  }

  const heading = role || 'Untitled lead';
  const postedBy = postedByRaw || null;
  const company = companyRaw || null;

  // Primary status: LinkedIn Status (select)
  const linkedInStatusSelect = properties['LinkedIn Status']?.select;
  const linkedInStatus = linkedInStatusSelect?.name?.trim() || 'No status';

  // Message / Clipboard text: LinkedIn DM (rich_text)
  const linkedInDm = flattenRichText(properties['LinkedIn DM']?.rich_text);

  // LinkedIn profile destination: Primary Contact LinkedIn (url)
  const primaryContactLinkedIn = validateLinkedInUrl(properties['Primary Contact LinkedIn']?.url);

  // Email: Primary Contact Email (email)
  const emailRaw = properties['Primary Contact Email']?.email;
  const primaryContactEmail = typeof emailRaw === 'string' && emailRaw.trim() ? emailRaw.trim() : null;

  // Phone: Phone (phone_number)
  const phoneRaw = properties['Phone']?.phone_number;
  const phone = typeof phoneRaw === 'string' && phoneRaw.trim() ? phoneRaw.trim() : null;

  // Score badge: Score (select)
  const score = parseScore(properties['Score']?.select);

  // Extended Details Fields
  const location = flattenRichText(properties['Location']?.rich_text)?.trim() || null;
  const engagementType = extractSelect(properties['Engagement Type']);
  const postSummary = flattenRichText(properties['Post Summary']?.rich_text)?.trim() || null;
  const requirement = flattenRichText(properties['Requirement']?.rich_text)?.trim() || null;
  const notes = flattenRichText(properties['Notes']?.rich_text)?.trim() || null;
  const signalDate = extractDate(properties['Signal Date']);
  const sendDate = extractDate(properties['Send Date']);
  const commentDate = extractDate(properties['Comment Date']);
  const sourceType = extractSelect(properties['Source Type']);
  const sourceLink = properties['Source Link']?.url?.trim() || null;
  const linkedInPostUrl = properties['LinkedIn Post URL']?.url?.trim() || null;
  const skills = extractMultiSelect(properties['Skills']);
  const stage = extractSelect(properties['Stage']);
  const commentDraft = flattenRichText(properties['Comment Draft']?.rich_text)?.trim() || null;
  const commentStatus = extractSelect(properties['Comment Status']);
  const emailSubject = flattenRichText(properties['Email Subject']?.rich_text)?.trim() || null;
  const emailBody = flattenRichText(properties['Email Body']?.rich_text)?.trim() || null;
  const emailStatus = extractSelect(properties['Email Status']);
  const emailPipeline = extractSelect(properties['Email Pipeline']);

  return {
    id: page.id,
    notionUrl: page.url || `https://www.notion.so/${page.id.replace(/-/g, '')}`,
    role: heading,
    postedBy,
    company,
    linkedInStatus,
    linkedInDm,
    primaryContactLinkedIn,
    primaryContactEmail,
    phone,
    score,
    verticalId: 'gtm',
    verticalLabel: 'GTM & Sales',

    location,
    engagementType,
    postSummary,
    requirement,
    notes,
    signalDate,
    sendDate,
    commentDate,
    sourceType,
    sourceLink,
    linkedInPostUrl,
    skills,
    stage,
    commentDraft,
    commentStatus,
    emailSubject,
    emailBody,
    emailStatus,
    emailPipeline,
  };
}
