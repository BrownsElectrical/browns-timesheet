# Browns Electrical Timesheet — Setup Guide

Follow these steps in order. Takes about 45 mins.

---

## STEP 1 — GitHub (store your code)

1. Go to https://github.com and click **Sign up**
2. Create your account (use your email, pick a username)
3. Once logged in, click the **+** icon top right → **New repository**
4. Name it: `browns-timesheet`
5. Set it to **Private**
6. Click **Create repository**
7. You'll see a page with some code — leave this open

Now upload your files:
- Click **uploading an existing file** (link on that page)
- Drag and drop the entire `browns-timesheet` folder contents
- Click **Commit changes**

---

## STEP 2 — Supabase (your database)

1. Go to https://supabase.com and click **Start your project**
2. Sign up with GitHub (easiest — uses the account you just made)
3. Click **New project**
4. Name it: `browns-timesheet`
5. Set a database password (save this somewhere safe)
6. Choose region: **West EU (Ireland)**
7. Click **Create new project** — takes about 2 minutes to set up

Once ready:
8. Click **SQL Editor** in the left sidebar
9. Click **New query**
10. Open the file `supabase_schema.sql` from your project folder
11. Copy and paste ALL of it into the SQL editor
12. Click **Run** — you should see "Success"

Get your keys:
13. Click **Project Settings** (cog icon, bottom left)
14. Click **API**
15. Copy the **Project URL** — paste it somewhere (Notepad is fine)
16. Copy the **anon public** key — paste it somewhere too

---

## STEP 3 — Vercel (host the app)

1. Go to https://vercel.com and click **Sign up**
2. Sign up with GitHub
3. Click **Add New Project**
4. Find `browns-timesheet` in your repositories and click **Import**
5. Before clicking Deploy, click **Environment Variables** and add these three:

   | Name | Value |
   |------|-------|
   | REACT_APP_SUPABASE_URL | (the URL you copied from Supabase) |
   | REACT_APP_SUPABASE_ANON_KEY | (the anon key you copied from Supabase) |
   | REACT_APP_PIN | (pick a 4-digit PIN for your team, e.g. 1234) |

6. Click **Deploy**
7. Wait about 2 minutes
8. Vercel gives you a URL like `browns-timesheet.vercel.app` — that's your app!

---

## STEP 4 — Share with the lads

Send them the Vercel URL and the PIN.

On iPhone:
1. Open the URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

It now sits on their home screen like an app.

---

## Changing the PIN later

1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Edit `REACT_APP_PIN`
3. Click **Save** then **Redeploy**

---

## Need help?

Message Jack — or bring this guide up and follow it step by step.
