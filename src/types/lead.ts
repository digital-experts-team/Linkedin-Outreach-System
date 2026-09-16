export type ScoreTier = 'green' | 'amber' | 'red' | 'neutral';

export interface ScoreInfo {
  raw: string;
  formatted: string;
  isNumeric: boolean;
  isHold: boolean;
  tier: ScoreTier;
}

export type KnownLinkedInStatus =
  | 'Not started'
  | 'Draft'
  | 'Draft Ready'
  | 'Done'
  | 'LinkedIn Send'
  | 'Follow Up';

export interface Lead {
  id: string;
  notionUrl: string;
  role: string;
  postedBy: string | null;
  company: string | null;
  linkedInStatus: string;
  linkedInDm: string;
  primaryContactLinkedIn: string | null;
  primaryContactEmail: string | null;
  phone: string | null;
  score: ScoreInfo | null;
  verticalId: 'gtm';
  verticalLabel: 'GTM & Sales';

  // Extended Details Fields
  location?: string | null;
  engagementType?: string | null;
  postSummary?: string | null;
  requirement?: string | null;
  notes?: string | null;
  signalDate?: string | null;
  sendDate?: string | null;
  commentDate?: string | null;
  sourceType?: string | null;
  sourceLink?: string | null;
  linkedInPostUrl?: string | null;
  skills?: string[];
  stage?: string | null;
  commentDraft?: string | null;
  commentStatus?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  emailStatus?: string | null;
  emailPipeline?: string | null;
}

export interface LeadsApiResponse {
  leads: Lead[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount?: number;
  error?: {
    code: 'CONFIG_REQUIRED' | 'UNAUTHORIZED' | 'NOT_FOUND_OR_FORBIDDEN' | 'RATE_LIMITED' | 'FETCH_ERROR';
    message: string;
    details?: string;
  };
}

export interface LeadDetailApiResponse {
  lead?: Lead;
  error?: {
    code: 'CONFIG_REQUIRED' | 'UNAUTHORIZED' | 'NOT_FOUND_OR_FORBIDDEN' | 'RATE_LIMITED' | 'FETCH_ERROR';
    message: string;
    details?: string;
  };
}
