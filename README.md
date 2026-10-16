# BreakTym 🌙

> **"Pause the World. Live the Moment."**

BreakTym is a modern, responsive, web-based Gen-Z social application designed to help people make spontaneous plans with the people who matter most through one-tap invitations.

Built on the **Midnight Neomorphism** design system, BreakTym prioritizes intimacy, privacy, and speed — strictly eliminating usernames, public directories, and unwanted algorithms.

---

## 🎨 Brand Identity & Design System: Midnight Neomorphism

BreakTym employs a restrained, premium dark aesthetic combining deep charcoal surfaces, radiant purple highlights, and glassmorphic touches.

### Core Brand Palette

| Token | Hex Value | Usage |
|---|---|---|
| **Primary Background** | `#17171C` | Screen base foundation & outer canvas |
| **Secondary Background** | `#1C1C23` | Container wells, tab holders & elevated panels |
| **Raised Card Surface** | `#202027` | Beveled neomorphic cards with dual highlights |
| **Dark Shadow** | `#101014` | Bottom-right elevation drop shadows |
| **Light Highlight** | `#30303A` | Top-left specular rim bevels & subtle borders |
| **Primary Purple** | `#B45CFF` | Radiant neon glow, active links, logos & focus |
| **Secondary Purple** | `#8B5CF6` | Gradient origin tone & secondary accents |
| **Primary Text** | `#F5F3FA` | High-contrast headers, input values & titles |
| **Muted Text** | `#A5A0B5` | Subtitles, helper text & placeholders |
| **Online Status** | `#86EFAC` | Real-time presence & positive feedback |
| **Error** | `#FF6B81` | Validation alerts & destructive actions |

---

## 🧱 Architecture & Project Structure

The repository follows a clean, decoupled monorepo structure where the modern web application lives in `apps/web/`, while the native Android application is preserved in `app/`.

```text
BreakTime/
├── apps/
│   └── web/                         # Modern React + Vite + TypeScript web app
│       ├── public/                  # PWA manifest, SVG icons
│       ├── src/
│       │   ├── components/          # Reusable UI & Layout components
│       │   │   ├── layout/          # Header, FloatingNavBar
│       │   │   └── ui/              # NeomorphicCard, NeomorphicButton, NeomorphicInput, Avatar, Logo
│       │   ├── features/            # Feature views
│       │   │   ├── auth/            # Phone OTP, Email/Password, Profile Setup, Demo Mode
│       │   │   ├── home/            # Home dashboard, search, filter chips, contact cards
│       │   │   ├── friends/         # Circles, Contact matching, pending requests, QR share
│       │   │   ├── invitation/      # Circular glass activity selector, custom editor
│       │   │   ├── profile/         # Profile details, status/vibe editing, credentials
│       │   │   └── settings/        # Backend connectivity diagnostics, privacy rules
│       │   ├── lib/                 # Supabase client, Contact Picker API, utility helpers
│       │   ├── services/            # Auth, Friends, Activity, and Invitation services
│       │   ├── types/               # Strict TypeScript domain interfaces
│       │   ├── styles/
│       │   ├── App.tsx              # Root coordinator & state manager
│       │   ├── main.tsx             # DOM root mount
│       │   ├── index.css            # Tailwind + Neomorphic CSS utilities
│       │   └── vite-env.d.ts        # Vite environment types
│       ├── .env.example             # Environment template
│       ├── package.json             # Web package configuration
│       ├── tailwind.config.js       # Design token mappings
│       ├── tsconfig.json            # Strict TypeScript configuration
│       └── vite.config.ts           # Bundler & alias configuration
├── app/                             # Preserved Android native application (Kotlin / Jetpack Compose)
├── supabase/
│   └── migrations/                  # PostgreSQL schemas & RPC functions
│       ├── 20261016_contact_friends_system.sql
│       └── 20261016_activity_invitations.sql
├── package.json                     # Monorepo workspaces & root execution scripts
├── .gitignore                       # Clean repository hygiene
└── README.md                        # Documentation
```

---

## ✨ Features Implemented

### 1. Landing & Authentication
- **Phone OTP Verification**: Built for Supabase Auth SMS delivery with 6-digit cell inputs and automatic resend cooldown.
- **Email & Password**: Alternative registration and authentication with email confirmation handling.
- **Demo Mode**: Instant one-click sandboxed exploration mode allowing full evaluation without pre-configured SMS gateways.
- **Profile Onboarding**: Display name and optional status/vibe setup.

### 2. Home Dashboard
- **Greeting**: *"What's your tym today?"*
- **Filter Tags**: Real-time counters for All, Online, Offline, and Pinned circle members.
- **Contact Cards**: Relationship badges (`LOVER`, `BESTFRIENDS`, `FRIENDS`, `BHAI`, `SISTER`, `FAMILY`, `COLLEGE`, `CRUSH`), online indicators, pin-to-top toggles, and instant break invites.
- **Quick Activities**: Top plan shortcut pills (Chai, Night Ride, Food, Shopping).

### 3. Contact-Based Circles & Friends
- **Zero Username Directory**: You cannot search by random username; BreakTym operates solely on people already in your phone contacts.
- **Progressive Enhancement Contact Discovery**:
  - Uses the native browser **Contact Picker API** (`navigator.contacts.select`) on compatible mobile browsers (Android Chrome).
  - Falls back gracefully on desktop browsers with manual phone matching and personal invite links.
  - Matches contacts server-side via Supabase `match_phone_contacts` RPC without storing or leaking your address book.
- **Relationship Requests**: Send, accept, decline, and cancel friend requests with immediate state feedback.
- **QR Code & Shareable Link**: One-tap share modal for inviting friends to join your circle.

### 4. Activity Invitations
- **Circular Glass Activity Selector**: Large tactile visual focal disc featuring swipe/button navigation, carousel dot indicator, and arrow-key support.
- **Consensual Activity System**:
  - Evening Chai (☕)
  - Night Ride (🏍️)
  - Shopping (🛍️)
  - Walking (🚶)
  - Food (🍜)
  - Movie Night (🎬)
  - Gaming (🎮)
  - Smoking Break (🚬)
  - Drinking (🥂)
  - Kiss (💋 - strictly requires mutual `LOVER` relationship)
  - Cuddle (🫂 - strictly requires mutual `LOVER` relationship)
  - Custom Activity (✨ - user-defined)
- **Explicit Send Action**: Selecting or swiping never sends an invite; dispatch requires pressing **Send Invitation**.
- **Custom Activity Editor**: Add, edit, and delete user-defined spontaneous activities stored locally and synchronized with the backend.

### 5. Profile & Settings
- **Profile View**: Display name, vibe/status, connected phone/email, and circle statistics.
- **Settings & Architecture Diagnostics**: Live Supabase connection test, environment URL display, design palette tokens, and sign-out.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/your-username/BreakTym.git
cd BreakTime
npm install
```

### 2. Configure Environment Variables
Inside `apps/web/`:
```bash
cp apps/web/.env.example apps/web/.env
```

Open `apps/web/.env` and insert your Supabase credentials:
```properties
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```
*(Note: Never place database passwords or service-role keys in frontend environment files).*

### 3. Run Development Server
From the repository root:
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 4. Production Build
From the repository root:
```bash
npm run build
```
Build artifacts will be emitted to `apps/web/dist/`.

To preview the production build locally:
```bash
npm run preview
```

---

## 🔐 Supabase Database Configuration

BreakTym utilizes Supabase for authentication, profiles, friend requests, friendships, and activity invitations.

To deploy the schema to your Supabase project:
1. Open the [Supabase SQL Editor](https://app.supabase.com/project/_/sql).
2. Execute the contents of:
   - `supabase/migrations/20261016_contact_friends_system.sql`
   - `supabase/migrations/20261016_activity_invitations.sql`
3. In **Authentication -> URL Configuration**, add your web domain (e.g., `http://localhost:3000` for development, or your production URL) to **Site URL** and **Redirect URLs**.
4. (Optional) In **Authentication -> Providers -> Phone**, configure your SMS provider (Twilio, MessageBird, or Supabase test phone numbers).

---

## 📱 Progressive Web App (PWA)

BreakTym is equipped with a modern web app manifest (`apps/web/public/manifest.json`) and responsive meta tags:
- **Standalone Display**: Installs cleanly on Android, iOS, and desktop operating systems as a native-feeling app.
- **Maskable SVG Icons**: Sharp, high-resolution rendering on all display densities.
- **Theme Color Synchronization**: Smooth status bar and chrome integration with `#17171C`.

---

## 🌐 Deployment Instructions

BreakTym can be deployed to any static or edge hosting provider.

### Vercel
1. Set **Root Directory** to `apps/web`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Netlify
1. Base directory: `apps/web`.
2. Build command: `npm run build`.
3. Publish directory: `apps/web/dist`.
4. Configure environment variables in Netlify site settings.

---

## 🛡️ Privacy & Security Principles

- **No Public Directories**: User records cannot be listed or scraped by arbitrary queries.
- **Security Definer Function**: Phone contact matching is performed strictly through `public.match_phone_contacts(phone_numbers TEXT[])`, returning matches only for numbers in the caller's query.
- **Intimate Consent Enforcement**: Sensitive activity types are filtered out unless the mutual relationship type is confirmed as `LOVER`.
- **Private Nicknames**: Custom names assigned to contacts are visible solely to the user who created them.

---

## 📄 License

Proprietary © BreakTym Team. All rights reserved.
