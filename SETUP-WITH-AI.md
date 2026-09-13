# Setting up Batch Tracker - a prompt for your AI assistant

You've been given a copy of **Batch Tracker**, a free, open-source grow-cycle
tracker built for mushroom/produce growers. It's a static web app that talks
to a database (Supabase) that YOU own - nobody else can see or touch your
data, and it costs nothing on Supabase's and GitHub's free tiers for a
farm-sized amount of data.

**If you're not very technical, that's fine.** Copy this entire file and
paste it to Claude or ChatGPT, along with a note like "help me set this up
following these instructions." Your AI can do almost all of this *with* you -
you'll mostly be clicking buttons in a couple of dashboards and pasting
things back to it.

---

## Instructions for the AI assistant

You are helping a grower (who may have no coding background) self-host their
own copy of "Batch Tracker," a single-page web app (`index.html`) backed by
Supabase (hosted Postgres + auth + REST API). The repo includes `setup.html`
- a self-contained setup wizard the grower opens directly in their browser
(double-click the file, or open it once they've deployed), with its own 5
steps covering everything Step 3 below does. It copies the schema SQL for
them with one click and live-tests their Project URL/anon key before
generating `config.js` for download - **tell them to open it and use that
as the default path**. It
can't do the GitHub/Supabase account and dashboard parts (those need
interactive sign-in), which is where you come in - walk them through those,
and through `setup.html`'s own steps as they go. If they'd rather not open a
local HTML file for some reason, Step 3 below has copy/paste and terminal
alternatives that do the same thing.

Go step by step. Don't skip ahead. Confirm each step actually worked (look at
real output/screenshots the grower pastes back) before moving to the next -
if something fails, use the troubleshooting section near the bottom instead
of guessing.

### Step 1 - Create a free Supabase account and project

Tell the grower to:
1. Go to https://supabase.com and sign up (free tier, no credit card required).
2. Click "New project." Pick any name (e.g. their farm's name), a strong
   database password (**tell them to save this password somewhere** - it's
   needed once for setup and isn't shown again), and the region closest to
   them.
3. Wait for the project to finish provisioning (~1-2 minutes, shown as a
   progress spinner on the dashboard).

### Step 2 - Get your own copy of the repo on GitHub

1. If the grower doesn't have a GitHub account, they create one for free at
   https://github.com.
2. On the Batch Tracker repo page: if there's a green **"Use this template"**
   button, click it - this creates a brand new, independent repo under the
   grower's own account with no link back to the original (cleanest option,
   nothing to ever accidentally push to someone else's repo). If that button
   isn't there, click **"Fork"** instead - functionally fine too, just keeps
   a "forked from" label on GitHub.
3. Turn on GitHub Pages now, before anything else is configured: **Settings
   -> Pages** -> Source = "Deploy from a branch", Branch = `main` / `(root)`
   -> Save. Takes 1-2 minutes. The live site will show a friendly "Setup
   incomplete" message until Step 3 is done below - that's expected, not an
   error. Doing this now means `setup.html` gets a real `https://` address
   to run from in Step 3, instead of being opened as a local file (which
   some browsers restrict).

### Step 3 - Push the schema and connect your project

**Default: open `setup.html`** at
`https://THEIR-USERNAME.github.io/THEIR-REPO-NAME/setup.html` (the repo name
is whatever they picked in Step 2.2 - "batch-tracker" if they kept the
default, something else if they renamed it) - or by double-clicking the
local file if they skipped Step 2.3. It
walks through pushing the schema and connecting the project itself, with a
live "Test connection" check before it lets them download `config.js` - talk
them through its on-page steps as they go, using the details below only if
they hit something `setup.html`'s own messaging doesn't explain, or if
they'd rather not use it at all. There are two manual fallbacks: **Option A
needs no installs at all**; Option B is a script that automates the same two
things for anyone comfortable running one terminal command.

#### Option A - copy/paste (fallback, no installs)

1. In the Supabase dashboard: left sidebar -> **SQL Editor** -> **New
   query**.
2. Open `schema.sql` from the repo (view it on GitHub, or open the file
   they downloaded), select all, copy it.
3. Paste the whole thing into the SQL Editor and click **Run**. It should
   finish in a second or two with a "Success" message. This creates every
   table, index, and security rule the app needs, in one go. It's safe to
   run more than once if they're not sure it worked the first time.
4. In the Supabase dashboard, get to the API keys page: click the **⚙
   Settings** icon near the bottom of the left sidebar, then **API Keys**
   (some projects just call it **API** - same page). Near the top is the
   **Project URL** (looks like `https://xxxxxxxx.supabase.co`). Below that
   is a list of keys - they want the one labeled **"Publishable key"**
   (`sb_publishable_...`) or, on older projects, **"anon" / "public"** (a
   long string starting `eyJ...`). There's also a **"Secret key"**
   (`sb_secret_...`) or **"service_role"** key on the same page - **do not
   use that one**, see troubleshooting below.
5. Create `config.js` with those two values filled in. Two ways to do this,
   pick whichever fits how the grower is working:
   - **Entirely in the browser (no local files at all)**: on their new
     GitHub repo's page, click **Add file -> Create new file**, name it
     exactly `config.js` (same folder as `index.html`, so just type
     `config.js` with nothing before it), paste in:
     ```js
     window.SUPABASE_URL = "https://xxxxxxxx.supabase.co";
     window.SUPABASE_KEY = "their-anon-key-here";
     ```
     with their real values in the quotes, then **Commit directly to the
     main branch**.
   - **Working with local files**: copy `config.example.js` to `config.js`
     in the same folder as `index.html`, open it in any plain text editor,
     and fill in the same two values, keeping the quote marks.
6. Either way: no build step, no compiling - `index.html` picks this up
   automatically next time it's loaded.

#### Option B - the setup script (fallback, for terminal users)

Does exactly what Option A does, plus double-checks every step and catches
common mistakes (like accidentally pasting the service_role key) before
they cause confusion later.

1. Make sure Node.js is installed (`node --version` - if that fails, have
   them install Node from https://nodejs.org, LTS version).
2. In the repo folder, run:
   ```
   npm install
   npm run setup
   ```
3. It asks for the same Project URL / anon key as Option A, plus a database
   connection string (Settings (gear icon) -> Database -> Connection string ->
   URI) so it can run the schema push itself instead of the grower pasting
   into the SQL Editor - remind them to swap in their real password where it
   says `[YOUR-PASSWORD]`.
4. It checks its own work at every step and stops with a clear red ❌ error
   if anything fails, rather than continuing silently - read the error back
   to your AI, it explains exactly what went wrong and how to fix it.
5. On success it writes `config.js` for you and prints next steps.

### Step 4 - Create the grower's own login

Batch Tracker has no public sign-up page (by design - it's a private,
internal tool for the farm's own staff). Create the first user manually:

1. In Supabase: Authentication -> Users -> Add user -> Create new user.
2. Enter the grower's email and a password. Untick "Auto confirm" only if
   they want an email confirmation step; for a single-farm private tool,
   ticking "Auto confirm user" is simpler and fine.
3. That's the login they'll use on the Batch Tracker site itself.

### Step 5 - Add config.js to the deployed site

If they turned on GitHub Pages back in Step 2.3, it's already live, just
showing the "Setup incomplete" page. Get their downloaded `config.js` from
Step 3 into the repo, next to `index.html` - easiest via **Add file ->
Upload files** on their repo's GitHub page (drag the file in, commit). Wait
~1 minute for Pages to rebuild, then reload the site - the setup-incomplete
message should be gone, replaced by a real login screen.

If they haven't turned on Pages yet, do it now: **Settings -> Pages** ->
Source = "Deploy from a branch," Branch = `main` / `(root)` -> Save, then
add `config.js` the same way once it's built.

Note on privacy: `config.js` holds their Supabase anon key, and uploading it
through the GitHub web UI commits it into their (by default, public) repo.
This is fine and standard - the anon key is *meant* to be public/client-
visible, that's what the Row Level Security rules `schema.sql` already set
up are for: the key alone grants nothing without a logged-in session. If the
grower would still rather not have it visible in a public repo, they can
make the repo private under Settings -> General -> Danger Zone -> Change
visibility (note this may restrict who can view the live Pages site too,
depending on their GitHub plan) - explain the tradeoff and let them choose,
don't decide for them.

If they're working locally instead of through the browser: `config.js` is
gitignored on purpose (so a local `git push` never leaks it) - to get it
onto the live site, either commit it anyway via `git add -f config.js` (same
public-repo tradeoff as above) or add it through the GitHub web UI as
described here.

### Step 6 - Confirm it's live

Visit `https://THEIR-USERNAME.github.io/THEIR-REPO-NAME/` (same repo name as
Step 3 above). They should see a
login screen with a generic "Batch Tracker" title (not "Markwood"). Sign in
with the user from Step 4. That's it - fully self-hosted, on their own
accounts, at no cost. If they get a blank page or a "Setup incomplete"
banner, see troubleshooting below.

---

## Troubleshooting

**`setup.html`'s "Test connection" fails with a network error**
If they opened the file by double-clicking it (a `file://` URL), some
browsers block outgoing requests from local files entirely. Have them run
`python3 -m http.server` in the repo folder and open
`http://localhost:8000/setup.html` instead - or just fall back to Option A
below, which doesn't need a live browser request at that step.

**"config.js is missing" error banner on the page**
`config.js` doesn't exist yet, or wasn't committed to the live repo. Redo
Step 3's "Create config.js" item (Option A) - create/commit it via GitHub's
web UI, or run `npm run setup` again if using Option B.

**"That's a Secret key / service_role key" error, or the site loads but
nothing ever seems protected by login**
The grower pasted the "Secret key" (`sb_secret_...`) or legacy
`service_role` key instead of the publishable/anon one into `config.js`.
These look similar but are NOT interchangeable: the secret one bypasses all
security rules and must never appear in a browser-facing file like
`config.js`, which anyone visiting the site can read. Go back to ⚙ Settings
→ API Keys and copy the one labeled "Publishable key" (or "anon" / "public"
on older projects), and replace it in `config.js`.

**Can't find "API Keys" in Settings, or the page looks totally different**
Supabase renamed and reorganized this page over time - if "API Keys" isn't
there, look for a plain "API" entry instead; it's the same page either way.
The exact key labels ("Publishable key" vs "anon") can differ by project
age too - both work fine here, `setup.html`'s validation accepts either
format.

**Login works but every page is blank / "permission denied" style errors
after signing in**
This usually means Row Level Security policies didn't get created. Re-run
`npm run setup` (it's safe to run more than once), or open the Supabase SQL
Editor and paste the contents of `schema.sql` directly, then check the
Editor's own output for the actual Postgres error.

**Setup script (Option B) fails to connect to the database**
Almost always the connection string still has the literal text
`[YOUR-PASSWORD]` in it, or the password is wrong. Get a fresh connection
string from Settings (gear icon) -> Database, and if unsure of the password,
reset it from that same page (Reset database password) and try again with
the new one - this doesn't lose any data since the schema hasn't been
touched by an unrelated app yet.

**GitHub Pages build failing / showing a 404**
Check Settings -> Pages shows a green "site is live" state, not a red build
error. A red error there is almost always: wrong branch selected, or the
repo has no `index.html` at the root (it should - this repo's `index.html`
lives at the top level, not in a subfolder). If Pages shows green but the
site 404s, wait a couple more minutes - propagation can lag the dashboard.

**Anything else**
Read the exact error message back to your AI assistant along with which
step you were on - `setup.js` is written to give specific, actionable error
text rather than a generic failure, so the message itself is usually the
fastest way to diagnose it.
