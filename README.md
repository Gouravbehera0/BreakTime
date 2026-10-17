# BreakTym 🌙

> **"Pause the World. Live the Moment."**

BreakTym is a modern, responsive, web-based Gen-Z social application designed to help people make spontaneous plans with their inner circle through one-tap invitations, personal QR discovery, unique handles, and contact-based matching.

Built on the **Midnight Neomorphism** design system, BreakTym balances intimate nightlife aesthetics with strict privacy, zero algorithmic feeds, and rigorous database-level security.

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
│       ├── public/                  # PWA manifest, official SVG & PNG logos
│       ├── src/
│       │   ├── components/          # Reusable UI & Layout components
│       │   │   ├── layout/          # Header, FloatingNavBar
│       │   │   └── ui/              # NeomorphicCard, NeomorphicButton, NeomorphicInput, Avatar, BreakTymLogo
│       │   ├── features/            # Feature views
│       │   │   ├── auth/            # AuthScreen, Email/Password, Phone Auth, ProfileSetupModal, Demo Mode
│       │   │   ├── home/            # Home dashboard, search, filter chips, contact cards
│       │   │   ├── friends/         # 3-way Discovery Hub, MyQRCodeModal, QRScannerModal, TargetProfileModal
│       │   │   ├── invitation/      # Circular glass activity selector, custom editor
│       │   │   ├── profile/         # Profile details, username claim, QR code access, phone linking
│       │   │   └── settings/        # Backend connectivity diagnostics, privacy rules
│       │   ├── lib/                 # Supabase client, Contact Picker API, QR code encoder/decoder
│       │   ├── services/            # authService, profileService, friendService, invitationService
│       │   ├── types/               # TypeScript domain interfaces & database.ts schema types
│       │   ├── styles/
│       │   ├── App.tsx              # Root coordinator & state manager
│       │   ├── main.tsx             # DOM root mount
│       │   ├── index.css            # Tailwind + Neomorphic CSS utilities
│       │   └── vite-env.d.ts        # Vite environment types
│       ├── .env.example             # Environment template
│       ├── .gitignore               # Web environment exclusion rules
│       ├── package.json             # Web package configuration
│       ├── tailwind.config.js       # Design token mappings
│       ├── tsconfig.json            # Strict TypeScript configuration
│       └── vite.config.ts           # Bundler & alias configuration
├── app/                             # Preserved Android native application (Kotlin / Jetpack Compose)
├── supabase/
│   └── migrations/                  # Timestamped PostgreSQL migrations & RPC functions
│       ├── 20261016_contact_friends_system.sql
│       ├── 20261016_activity_invitations.sql
│       ├── 20261017_flexible_friend_discovery.sql
│       └── 20261017_auth_profile_automation.sql
├── package.json                     # Monorepo workspaces & root execution scripts
├── .gitignore                       # Repository-wide hygiene
└── README.md                        # Documentation
```

---

## 🔐 Supabase Integration & Backend Architecture

BreakTym is backed by Supabase for user authentication, database persistence, relationship integrity, and Row Level Security (RLS).

### 1. Database Schema

#### `public.profiles`
Stores user profile information tied directly to authenticated accounts.
- `id` (UUID, Primary Key, references `auth.users(id)` ON DELETE CASCADE)
- `display_name` (TEXT, NOT NULL)
- `username` (TEXT NULL, normalized lowercase, unique index `idx_profiles_username_lower`)
- `phone_number` (TEXT NULL, unique)
- `avatar_url` (TEXT NULL)
- `bio` (TEXT NULL)
- `qr_token` (TEXT, unique index `idx_profiles_qr_token`, 32-character opaque hex token)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

#### `public.friend_requests`
Manages unidirectional friendship invitations requiring explicit confirmation.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `requester_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `recipient_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `status` (TEXT, CHECK `status IN ('pending', 'accepted', 'declined', 'cancelled')`)
- `created_at` / `updated_at` (TIMESTAMPTZ)
- Constraints: `no_self_friend_request` (`requester_id <> recipient_id`), `unique_active_request`

#### `public.friendships`
Stores confirmed mutual relationships using canonical ID ordering (`user_id1 < user_id2`) to prevent duplicate pairs.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id1` (UUID, references `auth.users(id)`)
- `user_id2` (UUID, references `auth.users(id)`)
- `created_at` (TIMESTAMPTZ)
- Trigger: `trg_friend_request_accepted` automatically creates a friendship row when a request is accepted.

#### `public.activity_invitations`
Stores consensual activity invitations dispatched to circle members.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `sender_id` (UUID, references `auth.users(id)`)
- `recipient_id` (UUID, references `auth.users(id)`)
- `activity_id` (TEXT, e.g. `'act_chai'`, `'act_ride'`)
- `activity_title` (TEXT, e.g. `'Evening Chai'`)
- `custom_note` (TEXT NULL)
- `status` (TEXT, CHECK `status IN ('sent', 'accepted', 'declined', 'expired')`)
- `created_at` / `updated_at` (TIMESTAMPTZ)

---

### 2. Row Level Security (RLS) Policies

All tables have RLS enabled by default:

* **Profiles**:
  - `SELECT`: Users can view their own profile, profiles of confirmed friends, or profiles with active friend requests. Public discovery (QR codes and username searches) is routed through `SECURITY DEFINER` functions that project only public fields.
  - `INSERT` / `UPDATE`: Strictly restricted to `auth.uid() = id`. Users cannot alter profile IDs or write privileged fields.
* **Friend Requests**:
  - `SELECT`: Permitted only if `auth.uid() = requester_id OR auth.uid() = recipient_id`.
  - `INSERT`: Requester must match `auth.uid()` and cannot send to themselves or existing friends.
  - `UPDATE`: Recipient can accept or decline; requester can cancel.
* **Friendships**:
  - `SELECT`: Only users participating in the friendship (`auth.uid() = user_id1 OR auth.uid() = user_id2`).
  - `DELETE`: Either friend can unfriend / remove the relationship.
* **Activity Invitations**:
  - `SELECT`: Only sender or recipient.
  - `INSERT`: Sender must match `auth.uid()`.
  - `UPDATE`: Only the recipient can accept or decline.

---

### 3. Remote Procedure Call (RPC) Functions

* `match_phone_contacts(phone_numbers TEXT[])`: Matches caller's address book against registered users without revealing the general user base.
* `check_username_available(requested_username TEXT)`: Case-insensitive handle availability check.
* `search_profiles_by_username(search_query TEXT, max_results INT)`: Prefix search returning only public profile details and friendship status.
* `resolve_profile_by_qr_token(token_input TEXT)`: Safely resolves an opaque QR token without leaking private credentials or phone numbers.
* `regenerate_qr_token()`: Allows users to revoke their existing QR code and issue a brand-new token.

---

### 4. Database Migrations Execution Guide

To apply database migrations to your Supabase project:

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Open the **SQL Editor**.
3. Sequentially copy and execute the migrations in `supabase/migrations/`:
   1. `20261016_contact_friends_system.sql`
   2. `20261016_activity_invitations.sql`
   3. `20261017_flexible_friend_discovery.sql`
   4. `20261017_auth_profile_automation.sql`
4. In **Project Settings -> API**, copy your **Project URL** and **anon/publishable key**.

---

## 🚀 Local Development Setup

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
Copy `.env.example` in `apps/web/`:
```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:
```properties
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

> **Security Warning**: `VITE_` variables are bundled into client-side code. Never put Supabase service-role keys, database passwords, or SMS provider secrets in `.env`.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` or `http://localhost:3001` in your browser.

### 4. Build & Verify
```bash
npm run build
```
Executes `tsc` type checking and `vite build`. Production assets are output to `apps/web/dist/`.

---

## 📱 Features & Discovery Channels

1. **Personal QR Code**:
   - Every user receives a unique QR code styled in BreakTym midnight neomorphism.
   - Live camera scanning, local canvas image decoding, and safe URL resolution (`/?add=<token>`).
   - One-tap QR revocation and token regeneration.
2. **Optional Unique Username**:
   - 3-20 characters, lowercase letters, numbers, and underscores.
   - Case-insensitive uniqueness enforcement with live suggestions if taken.
   - Zero phone numbers or emails revealed in username search.
3. **Contact-Based Matching**:
   - Native browser Contact Picker API integration on mobile.
   - Manual phone lookup fallback.
4. **Activity Invitations**:
   - Tactile circular activity disc (Chai, Night Ride, Food, Movie, Gaming, etc.).
   - Explicit confirmation required; swiping activities never dispatches invitations.
5. **Resilient Local-First Demo Mode**:
   - One-click sandbox mode allows testing all UI flows, friend requests, and QR scanning even before database credentials are configured.

---

## 🛡️ Security & Privacy Guarantees

* **No Auto-Friending**: Scanning a QR code or discovering a handle only allows sending a friend request. All friendships strictly require mutual consent.
* **Attribute Hiding**: Phone numbers and email addresses are never returned in public searches or QR resolutions.
* **RLS Protection**: All queries are validated by PostgreSQL Row Level Security; client-side code cannot bypass permissions.
* **Safe Redirects**: Scanned URLs strictly extract the opaque token; arbitrary external redirect parameters are rejected.

---

## 📄 License

Proprietary © BreakTym Team. All rights reserved.
