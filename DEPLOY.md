# Deploy THE 90-DAY CUT (Netlify + Supabase, free)

This guide takes the app from local-only to a private site you can open on your
phone and laptop with the same data. Everything here fits the free plans.

- **Netlify** hosts the Next.js app.
- **Supabase** stores one private JSON snapshot per user.
- **This browser** keeps the instant, offline copy in `localStorage`.

The site URL can be public. The data cannot be read or written without a magic-link
login for the owner account, because every row is protected by Row Level Security.

---

## 1. Create the Supabase project

1. Sign in at <https://supabase.com/dashboard>.
2. **New project** → pick an organization, name it (for example `the-90-day-cut`),
   generate a strong database password, and choose the region closest to you.
3. Wait for the project to finish provisioning.

## 2. Create the table and policies

1. Open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. It should finish with “Success. No rows returned.”

This creates `public.challenge_state`, enables Row Level Security, removes the
anonymous grants, and adds owner-only select/insert/update/delete policies.

## 3. Create the owner account

The app intentionally does **not** allow sign-ups. The account must exist first.

1. Open **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the email address you want to use.
4. Set any password (it is not used by the app), and enable **Auto Confirm User**
   if the option is shown.
5. Click **Create user**.

> Use the same email on every device. The magic link is sent to this address.

## 4. Close sign-ups

1. Open **Authentication** → **Sign In / Providers** (or **Providers**) → **Email**.
2. Turn **Allow new users to sign up** off.
3. Save.

Now a visitor cannot create an account even though the public anon key is visible
in the browser. Only the user you created can request a login link.

## 5. Copy the public credentials

1. Open **Project Settings** → **API** (or **Data API / API Keys**).
2. Copy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key (or the newer **publishable** key)
3. Never copy the **service_role** / **secret** key into this app. It bypasses RLS.

## 6. Configure auth redirect URLs

Open **Authentication** → **URL Configuration**.

Set **Site URL** to your final site origin, for example:

```text
https://your-site-name.netlify.app
```

Add these under **Redirect URLs** (keep localhost while developing):

```text
http://localhost:3000
http://localhost:3000/**
https://your-site-name.netlify.app
https://your-site-name.netlify.app/**
```

If you deploy under a custom domain later, add that origin too.

> **Magic-link tip:** the app uses the secure PKCE flow. Request the link on the
> device you are signing in, and open it in the same browser. Each device signs in
> once; the session is then remembered.

## 7. Run it locally with cloud sync

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in the two values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Then:

```bash
npm run dev
```

Open <http://localhost:3000>, enter the owner email, and open the emailed link on
the same device. The first sign-in uploads the data currently in that browser (or
loads the cloud copy if the browser is empty).

To return to local-only mode, remove both variables and restart. The app never
requires cloud configuration to run.

## 8. Deploy to Netlify

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Netlify: **Add new site** → **Import an existing project**.
3. Connect the repository. Netlify reads [`netlify.toml`](netlify.toml), which sets
   the build command (`npm run build`), publish directory (`.next`), and Node 22.
4. Before the first deploy, open **Site configuration** → **Environment variables**
   and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.
6. Copy the production URL, for example `https://your-site-name.netlify.app`.
7. Go back to Supabase **Authentication** → **URL Configuration** and replace the
   placeholder site URL/redirect entries with the real Netlify URL.

`NEXT_PUBLIC_*` values are baked in at build time. If you add or change them after
a deploy, trigger a new production deploy.

## 9. Test the two-device flow

On the laptop:

1. Open the Netlify URL.
2. Sign in with the owner email.
3. Add or edit a day, wait for **Cloud saved** in the header.

On the phone:

1. Open the same URL and sign in with the same email **from the phone**.
2. If the phone has no meaningful local data, it loads the cloud snapshot
   automatically.
3. Edit a different day and wait for **Cloud saved**.

Back on the laptop, refresh or press the cloud pill to sync. Both devices should
show the same data.

### First-sync conflict

If both the browser and the cloud already contain data, the app shows a one-time
**“Which backup should win?”** dialog:

- **Use cloud backup** replaces this browser’s data with the cloud snapshot.
- **Keep this browser** uploads this browser’s data to the cloud.

Export a JSON backup first if you are unsure. The dialog has a shortcut for that.

---

## Security model

- **RLS on every operation.** The `anon` role has no table privileges. Authenticated
  users can only touch rows whose `user_id` matches `auth.uid()`.
- **No service-role key in the browser.** Only the public anon/publishable key ships.
- **Sign-ups disabled.** The owner account is created manually in Supabase.
- **Magic links** are one-time, expiring, and sent only to the owner address.
- **Headers** from `netlify.toml` add CSP, HSTS, frame denial, MIME sniffing
  protection, a restrictive permissions policy, and `X-Robots-Tag: noindex`.
- **No HTML injection.** React escapes user text; imported JSON is validated before
  it reaches state, and the cloud payload is validated again on read.
- **Local-first.** If the network or Supabase is down, the app keeps working and
  keeps saving to `localStorage`.

The public URL still exposes the sign-in screen. That is expected. It does not
expose your data.

---

## Free-plan limits and backup routine

Supabase Free:

- 500 MB database — this app uses a single small JSON row, so space is not a concern.
- **No automatic backups.** Export a JSON backup from Settings regularly and keep it
  somewhere safe (iCloud Drive, Google Drive, etc.).
- **Projects pause after 7 days without activity.** Data is retained. Open the
  Supabase dashboard and restore the project, then press the cloud pill to sync.
  Opening the app and syncing at least once a week keeps it active.
- Magic-link emails use Supabase’s shared email service, which is rate-limited.
  For frequent sign-ins, configure custom SMTP under **Authentication** → **Emails**.

Netlify Free:

- 300 credits per month. A production deploy costs 15 credits, so avoid unnecessary
  deploys (each push to the production branch triggers one).
- Netlify’s free tier includes the Next.js runtime; no extra adapter is needed.

---

## Troubleshooting

**“Signups not allowed for otp” / no email arrives**
The owner account does not exist, or the email is different. Create it in
**Authentication → Users**, then request a new link. Check spam too.

**Link expired or already used**
Magic links are one-time. Return to the site and request a fresh one.

**The link opened but I am still signed out**
Open the link in the same browser where you requested it. PKCE stores a verifier
locally; opening the email on a different device invalidates the exchange. Request
the link on the device you want to sign in.

**“Cloud sync needs attention” banner**
Your local data is safe. Check the Supabase project is not paused, then press
**Retry**. If the project was paused, restore it in the dashboard first.

**A deploy succeeds but the app stays local-only**
The environment variables were missing at build time. Add them in Netlify and
trigger a new production deploy.

**Browser console shows a CSP error**
Check the blocked URL in the console. The current policy allows Supabase REST/auth
over `https://*.supabase.co`. If you add another service, update the
`connect-src` directive in `netlify.toml`.

**Netlify build uses the wrong Node version**
`netlify.toml` pins Node 22. If the site has a conflicting `NODE_VERSION` variable,
remove it or set it to `22`.

---

## Useful commands

```bash
npm run dev        # local development
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npm run build      # production build
```

## What to keep out of git

`.env.local` is ignored. `.env.example` is committed with placeholders only.
Never commit the Supabase `service_role` key.
