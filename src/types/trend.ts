export type PhotoArchetype =
  | 'Architecture Diagram'
  | 'Workflow Screenshot'
  | 'Comparison Grid'
  | 'Cheat Sheet Infographic'
  | 'Multi-Photo Carousel';

export interface TaggedEntity {
  name: string;
  handle: string;
  type: 'company' | 'person';
  reason: string;
  followersOrReach?: string;
  isVerified?: boolean;
}

export interface DecisionInsights {
  hookPsychology: {
    type: string;
    whyItWorks: string;
    dwellTimeImpact: string;
  };
  visualStrategy: {
    archetype: PhotoArchetype;
    whyThisPhotoWorks: string;
    aspectRatio: string;
    visualRetentionScore: number; // e.g. 94/100
  };
  taggingStrategy: {
    suggestedTags: TaggedEntity[];
    rationale: string;
    amplificationProbability: 'Very High' | 'High' | 'Medium';
  };
  conversionArchitecture: {
    ctaTrigger: string;
    whyItWorks: string;
  };
}

export interface RepurposeBlueprint {
  recommendedHook: string;
  recommendedCopy: string;
  photoConcept: string;
  tagsToInclude: string[];
  ctaTrigger: string;
  vertical: 'GTM' | 'AI Video' | 'Growth Stacks';
}

export interface ViralTrendPost {
  id: string;
  title: string;
  vertical: 'GTM' | 'AI Video' | 'Growth Stacks';
  photoArchetype: PhotoArchetype;
  imageUrl: string;
  imageAlt: string;
  photoDescription: string;
  hook: string;
  fullCopy: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viralScore: number; // e.g. 96
  sourceUrl?: string;
  originalAuthor: {
    name: string;
    handle: string;
    headline: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  taggedEntities: TaggedEntity[];
  decisionInsights: DecisionInsights;
  repurposeBlueprint: RepurposeBlueprint;
}

export interface TrendsApiResponse {
  trends: ViralTrendPost[];
  counts: {
    total: number;
    gtm: number;
    aiVideo: number;
  };
  source: 'notion' | 'curated_radar';
  error?: {
    code: string;
    message: string;
  };
}
