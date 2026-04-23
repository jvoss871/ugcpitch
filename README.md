# UGC Pitch

Stop blending in. Get targeted.

A lightweight web app for UGC creators to generate opportunity-specific pitch pages and outreach messages from job descriptions.

## What It Does

1. **Profile** - Create your creator profile with bio, niches, and positioning
2. **Content Library** - Add images with tags so the system can match them to opportunities
3. **Create Pitch** - Paste a job description, select Note or Message format
4. **Generated Pitch** - Get a tailored intro + outreach message + shareable pitch page
5. **Edit & Share** - Reorder content, edit text, copy message, share the link with brands
6. **Basic Analytics** - See how many times your pitch page was opened

## Features

✅ Profile management  
✅ Image content library with tagging  
✅ AI-powered pitch generation (Groq)  
✅ Editable pitches (intro, outreach, content reordering)  
✅ Shareable pitch pages  
✅ Page open tracking  
✅ Mock authentication (localStorage)  
✅ Clean, teal-focused design  
✅ No CRM, no scheduling, no email sending  

## Setup

### 1. Clone and install

```bash
cd ugc-pitch
npm install
```

### 2. Get a Groq API key

1. Go to https://console.groq.com
2. Sign up or log in
3. Create an API key
4. Copy it

### 3. Create .env.local

```bash
cp .env.local.example .env.local
# Edit .env.local and paste your Groq API key
```

### 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## How to Use

1. **Enter a username** to "sign in" (stored in browser localStorage)
2. **Go to Profile** - Add your bio, niches, positioning statement
3. **Go to Content** - Add images (paste URLs from Imgur, Cloudinary, etc.)
4. **Go to Create Pitch** - Paste a job description, select Note or Message, generate
5. **Edit the pitch** - Reorder/remove content, edit intro and outreach text
6. **Copy the message** - Copy your outreach text and paste into your response
7. **Share the page** - Share the pitch page link with the brand if you want them to see your content

## Data Storage

Everything is stored in your browser's localStorage:
- Profile info
- Content library
- Pitches
- Open/view counts

**Note:** Data will be deleted if you clear browser storage. This is MVP behavior. For production, add a real database (Supabase, Firebase, etc.).

## Tech Stack

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Groq API** - AI pitch generation
- **localStorage** - Data persistence

## What's NOT Included

- 🚫 CRM features
- 🚫 Scheduling
- 🚫 Email sending
- 🚫 Video support (images only for MVP)
- 🚫 Custom domains for free accounts
- 🚫 Real authentication
- 🚫 Complex design builder

## Next Steps for Production

1. Add real authentication (Clerk, Auth0, etc.)
2. Switch to a real database (Supabase PostgreSQL, Firebase, etc.)
3. Add image upload service (Cloudinary, AWS S3, Vercel Blob)
4. Implement email notifications
5. Add detailed analytics dashboard
6. Paid plans with custom domains

## Environment Variables

```
GROQ_API_KEY - Your Groq API key for pitch generation
```

## License

MIT - Use this however you want.

---

Built with ❤️ for UGC creators who deserve better pitches.
