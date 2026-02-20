# Contact Form Template

A modern, beautiful contact form template built with React, TypeScript, and Supabase. Features a premium glassmorphism UI with smooth animations and Airtable sync.

## Features

- 🎨 **Premium UI** – Glassmorphism design with gradient backgrounds and micro-animations
- ✅ **Form Validation** – Client-side validation using Zod schema
- 💾 **Supabase Backend** – Submissions stored in PostgreSQL
- 🔄 **Airtable Sync** – Automatic Edge Function sync to Airtable
- 🌙 **Dark Mode Ready** – Full dark mode support
- 📱 **Responsive** – Works beautifully on all devices

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Validation**: Zod + React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project (for backend features)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Customization

1. **Branding** – Update `index.html` with your own title and meta tags
2. **Colors** – Modify CSS variables in `src/index.css`
3. **Form Fields** – Extend the schema in `src/components/SubmissionForm.tsx`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |

## Deployment

Build the project and deploy the `dist` folder to any static hosting:

```bash
npm run build
```

Compatible with Vercel, Netlify, Cloudflare Pages, and more.

## License

MIT License – feel free to use this template for personal or commercial projects.
