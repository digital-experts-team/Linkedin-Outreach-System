export type PostStatus = 'Scheduled' | 'Draft' | 'Published' | 'Idea' | 'Ready to Post' | 'All';

export interface PostMediaItem {
  url: string;
  name?: string;
  type?: 'image' | 'video' | 'file';
  expiryTime?: string;
}

export interface LinkedInPost {
  id: string;
  notionUrl: string;
  name: string;
  fullCopy: string;
  hook?: string | null;
  images: PostMediaItem[];
  status: string;
  scheduledDate?: string | null;
  postedDate?: string | null;
  weekOf?: string | null;
  format?: string | null;
  vertical?: string | null;
  angleType?: string | null;
  ctaKeyword?: string | null;
  trigger?: string | null;
  postUrl?: string | null;
  commentsCount?: number | null;
  dmsSent?: number | null;
  callsBooked?: number | null;

  // Author profile info
  authorName?: string;
  authorHeadline?: string;
  authorAvatarUrl?: string;
  authorIsVerified?: boolean;
  authorRelationship?: string;
}

export interface PostsApiResponse {
  posts: LinkedInPost[];
  hasMore: boolean;
  nextCursor: string | null;
  counts?: {
    all: number;
    scheduled: number;
    drafts: number;
    published: number;
  };
  verticals?: Array<{
    name: string;
    count: number;
  }>;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface PostDetailApiResponse {
  post?: LinkedInPost;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
