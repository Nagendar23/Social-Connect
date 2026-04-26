# 🚀 SocialConnect

A modern full-stack social media platform built with Next.js and Supabase, designed with scalable architecture and production-ready patterns.

---

## 📌 Overview

SocialConnect enables users to:

- Create and share posts (with images)
- Like and comment on posts
- Follow other users
- Manage user profiles
- Experience a responsive, authenticated UI

---

## 🧠 Key Features

- Server-side rendering (Next.js App Router)
- Cookie-based authentication (Supabase SSR)
- REST-style API with route handlers
- Modular component architecture
- Real-time-ready backend design

---

## 🏗️ Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Framework    | Next.js 16 |
| Language     | TypeScript |
| Backend      | Supabase (PostgreSQL, Auth, Storage) |
| Styling      | Tailwind CSS |
| UI System    | shadcn/ui |
| Validation   | Zod |
| Utilities    | date-fns |

---

## 📁 Project Structure

socialconnect/  
├── app/  
│   ├── (auth)/                    # Auth route group (unauthenticated)  
│   │   ├── layout.tsx  
│   │   ├── login/      
│   │   └── register/    
│   ├── (main)/                    # Protected route group (authenticated)      
│   │   ├── layout.tsx      
│   │   ├── feed/                  # Main social feed      
│   │   ├── posts/[post_id]/       # Single post detail + comments    
│   │   └── profile/[user_id]/     # User profile page      
│   ├── api/                       # Next.js API Route Handlers      
│   │   ├── auth/      
│   │   ├── feed/    
│   │   ├── logout/    
│   │   ├── posts/      
│   │   │   ├── route.ts           # GET list / POST create    
│   │   │   └── [post_id]/    
│   │   │       ├── route.ts       # GET / PATCH / DELETE single post      
│   │   │       ├── like/          # POST / DELETE like toggle    
│   │   │       └── comments/      # GET / POST comments    
│   │   ├── upload/                # Image upload to Supabase Storage      
│   │   └── users/      
│   │       ├── route.ts           # GET all users    
│   │       ├── me/                # GET current user profile      
│   │       └── [user_id]/      
│   │           ├── route.ts       # GET user profile by ID      
│   │           ├── follow/        # POST / DELETE follow toggle      
│   │           ├── followers/     # GET followers list    
│   │           └── following/     # GET following list      
│   ├── globals.css    
│   ├── layout.tsx      
│   └── page.tsx                   # Root redirect    
├── components/    
│   ├── CreatePostForm.tsx    
│   ├── EditProfileModal.tsx      
│   ├── Navbar.tsx        
│   ├── PostCard.tsx      
│   └── ui/                        # shadcn/ui components (Avatar, Button, etc.)      
├── lib/      
│   ├── supabase/          
│   │   ├── client.ts                  # Browser-side Supabase client        
│   │   └── server.ts              # Server-side Supabase client (cookie-aware)      
│   ├── utils.ts          
│   └── validation.ts              # Zod schemas    
├── types/      
│   └── index.js                   # Shared TypeScript types        
├── middleware.ts                   # Auth guard (redirect logic)      
├── next.config.ts      
├── tailwind.config / postcss.config.mjs        
└── .env.local          



---

## 🔐 Authentication

- Supabase Auth with cookie-based sessions
- Middleware-protected routes
- Redirect logic:
  - Unauthenticated → `/login`
  - Authenticated users blocked from `/login` & `/register`

---

## 🗄️ Database Schema

Core tables:

- `profiles`
- `posts`
- `comments`
- `likes`
- `follows`

Includes:
- Foreign key constraints
- Denormalized counters
- Soft delete for posts

---

## 🔌 API Endpoints

### Posts
- `GET /api/posts`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`

### Engagement
- Like / Unlike posts
- Comments system

### Users
- Get profile
- Follow / Unfollow
- Followers / Following lists

---

## 🎨 UI Components

- `Navbar`
- `PostCard`
- `CreatePostForm`
- `EditProfileModal`
- shadcn/ui primitives

---

## ⚙️ Environment Variables

Create `.env.local`:

NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key


> ⚠️ Never commit `.env.local`

---

## 🖥️ Getting Started

```bash
git clone https://github.com/Nagendar23/Social-Connect.git
cd Social-Connect/socialconnect

npm install
npm run dev
