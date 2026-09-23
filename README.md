# Outreach Pilot 🚀

A responsive, Notion-backed CRM & Lead Management application built with Next.js 15, TypeScript, and Tailwind CSS.

---

## Features

- **Live Notion CRM Ingestion**: Real-time integration with Notion databases and data sources with resilient cursor pagination and backoff retry logic.
- **Authoritative Lead Normalization**: Smart mapping of roles, posters, companies, statuses, scores, and draft messages.
- **Lead Detail View**: Full-page inner view (`/leads/[id]`) showing post summaries, job requirements, verification notes, and multi-channel outreach drafts.
- **Interactive Outreach Actions**: 1-click "Copy & Message on LinkedIn" with automatic clipboard copy and LinkedIn profile navigation.
- **Email Outreach Drafts**: Pre-formatted cold email copies with 1-click clipboard copying.
- **Responsive Minimalist Design**: Designed with high data density, Inter typography, sticky category bars, and mobile-friendly bottom navigation.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Integration**: Notion REST API (`@notionhq/client`)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- A Notion Integration Token with access to your CRM database

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd outreach-ui
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Notion credentials in `.env.local`:

```env
# Notion Internal Integration Secret (starts with ntn_ or secret_)
NOTION_TOKEN=ntn_your_notion_integration_token

# Notion Database & Data Source IDs
NOTION_DATABASE_ID=3d67f6ba-af95-80a3-8e5d-d540076d4370
NOTION_DATA_SOURCE_ID=54c7f6ba-af95-826b-a9d6-870cda35a5dc
```

### 3. Share Database with Integration in Notion
1. Open your database in Notion.
2. Click **••• (Top Right) > Connections > Connect to**.
3. Select your integration.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. Push this repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Outreach Pilot"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `NOTION_TOKEN` = `ntn_...`
   - `NOTION_DATABASE_ID` = `3d67f6ba-af95-80a3-8e5d-d540076d4370`
   - `NOTION_DATA_SOURCE_ID` = `54c7f6ba-af95-826b-a9d6-870cda35a5dc`
5. Click **Deploy**.

---

## Scripts

- `npm run dev`: Start development server on port 3000
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run test`: Run automated test suite with Vitest
