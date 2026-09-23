export const mockNotionPageFull = {
  id: '3d67f6ba-af95-80a3-8e5d-d540076d4370',
  url: 'https://www.notion.so/3d67f6baaf9580a38e5dd540076d4370',
  properties: {
    Role: {
      id: 'role_prop',
      type: 'rich_text',
      rich_text: [
        { plain_text: 'Director of ' },
        { plain_text: 'Operations' },
      ],
    },
    'Posted by': {
      id: 'posted_by_prop',
      type: 'rich_text',
      rich_text: [{ plain_text: 'Alex Thompson' }],
    },
    Company: {
      id: 'company_prop',
      type: 'rich_text',
      rich_text: [{ plain_text: 'VelocityScale' }],
    },
    'LinkedIn Status': {
      id: 'status_prop',
      type: 'select',
      select: { name: 'Draft Ready', color: 'blue' },
    },
    'LinkedIn DM': {
      id: 'dm_prop',
      type: 'rich_text',
      rich_text: [
        { plain_text: 'Interested in scaling their sales team using AI video personalization.\n' },
        { plain_text: 'Currently vetting 3 vendors for Q4 implementation.' },
      ],
    },
    'Primary Contact LinkedIn': {
      id: 'linkedin_prop',
      type: 'url',
      url: 'https://www.linkedin.com/in/alex-thompson-crm',
    },
    'Primary Contact Email': {
      id: 'email_prop',
      type: 'email',
      email: 'alex@velocityscale.io',
    },
    Phone: {
      id: 'phone_prop',
      type: 'phone_number',
      phone_number: '+1-555-0199',
    },
    Score: {
      id: 'score_prop',
      type: 'select',
      select: { name: '8.4', color: 'green' },
    },
  },
};

export const mockNotionPageFallbackDetails = {
  id: 'page_fallback_1',
  url: 'https://www.notion.so/page_fallback_1',
  properties: {
    Details: {
      id: 'details_prop',
      type: 'title',
      title: [{ plain_text: 'VP of Growth & Strategy' }],
    },
    'Posted by': {
      id: 'posted_by_prop',
      type: 'rich_text',
      rich_text: [{ plain_text: 'Sarah Jenkins' }],
    },
    Score: {
      id: 'score_prop',
      type: 'select',
      select: { name: 'Hold' },
    },
    'LinkedIn Status': {
      id: 'status_prop',
      type: 'select',
      select: { name: 'Follow Up' },
    },
  },
};

export const mockNotionPageEmpty = {
  id: 'page_empty_1',
  url: 'https://www.notion.so/page_empty_1',
  properties: {},
};

export const mockNotionPageIntegerScore = {
  id: 'page_int_score',
  url: 'https://www.notion.so/page_int_score',
  properties: {
    Role: {
      type: 'rich_text',
      rich_text: [{ plain_text: 'Head of Engineering' }],
    },
    Score: {
      type: 'select',
      select: { name: '8' },
    },
  },
};

export const mockNotionPageLowScore = {
  id: 'page_low_score',
  url: 'https://www.notion.so/page_low_score',
  properties: {
    Role: {
      type: 'rich_text',
      rich_text: [{ plain_text: 'Sales Rep' }],
    },
    Score: {
      type: 'select',
      select: { name: '5.5' },
    },
  },
};

export const mockNotionPageMidScore = {
  id: 'page_mid_score',
  url: 'https://www.notion.so/page_mid_score',
  properties: {
    Role: {
      type: 'rich_text',
      rich_text: [{ plain_text: 'Account Executive' }],
    },
    Score: {
      type: 'select',
      select: { name: '6.7' },
    },
  },
};
