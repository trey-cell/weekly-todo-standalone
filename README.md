# Weekly Todo - Standalone iOS App

A full-featured task management app with Eisenhower Matrix, Goals, Projects (Gantt), and Calendar. Powered by Supabase + Vercel + Capacitor.

---

## 🚀 Quick Setup (One-Time)

### Step 1: Create Your Supabase Database

1. Go to **[supabase.com](https://supabase.com)** → Create a free account
2. Click **"New Project"** → Name it `weekly-todo`
3. Choose a strong database password → **Save it somewhere**
4. Wait ~2 minutes for project to spin up
5. Go to **SQL Editor** (left sidebar)
6. Paste the entire contents of `supabase/schema.sql` and click **Run**

7. Get your credentials:
   - Go to **Settings → API**
   - Copy **Project URL** (looks like `https://abc123.supabase.co`)
   - Copy **anon/public** key

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Locally (Test First)

```bash
npm run dev
```

Open `http://localhost:5173` — create an account and verify everything works!

---

## 🌐 Deploy to Vercel (Free Hosting)

1. Push this folder to a **GitHub repo** (github.com → New repository)
2. Go to **[vercel.com](https://vercel.com)** → Create account → "Add New Project"
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy** — Vercel gives you a URL like `weekly-todo-abc.vercel.app`

---

## 📱 Build the iPhone App (Capacitor)

### Prerequisites
- **Mac with Xcode** installed (free from App Store)
- **Apple Developer Account** ($99/year at developer.apple.com)
- Node.js installed

### Option A: WebView Mode (Simplest)

Point the app at your Vercel URL:

1. Edit `capacitor.config.ts` and uncomment the `server` line:
   ```typescript
   server: { url: 'https://your-app.vercel.app', cleartext: false },
   ```

2. Build and sync:
   ```bash
   npm run build
   npx cap add ios
   npm run cap:sync
   ```

3. Open in Xcode:
   ```bash
   npm run cap:open
   ```

4. In Xcode:
   - Sign in with your Apple ID: **Xcode → Settings → Accounts**
   - Select your project in the Navigator
   - Go to **Signing & Capabilities** tab
   - Set your Team and Bundle Identifier (e.g., `com.yourname.weeklytodo`)
   - Plug in your iPhone → Select it in the device dropdown
   - Press ▶ **Run** to install on your phone!

### Option B: Fully Bundled (App Store Ready)

1. Leave `capacitor.config.ts` as-is (no server URL)
2. The app bundles everything locally (faster, works offline)
3. ```bash
   npm run build
   npm run cap:sync
   npm run cap:open
   ```
4. In Xcode: **Product → Archive → Distribute App → App Store Connect**

---

## 📋 App Store Submission

1. In **App Store Connect** (appstoreconnect.apple.com):
   - Create a new App
   - Fill in name, description, screenshots (required)
   - Set category: **Productivity**
   - Set pricing: Free

2. Upload from Xcode: **Product → Archive → Distribute App**

3. Submit for review — Apple typically reviews within 1-3 days

---

## 🔧 Phase 2 Roadmap

These features are stubs in Phase 1 and will be implemented in Phase 2:

- [ ] **Google Calendar** — OAuth login → view/create events in the Calendar tab
- [ ] **Google Tasks sync** — Two-way sync with Google Tasks
- [ ] **AI Scheduling** — Connect to AI agent for smart scheduling assistance
- [ ] **Brain Dump** — Todoist integration for voice-to-task capture

---

## 👥 Sharing with Friends

Each friend gets their own account:
1. They create an account on your app (or you share the Vercel URL)
2. Supabase stores each user's data separately
3. No data mixing between users

For a multi-user production launch:
1. Enable Supabase **Row Level Security (RLS)** on all tables
2. Add `user_id UUID` columns linked to `auth.users`
3. Contact us for Phase 2 setup help!
