#!/usr/bin/env node
"use strict";

// Batch Tracker - one-time setup script.
//
// Run this ONCE after creating your own free Supabase project, before
// deploying. It will:
//   1. Push the full schema (tables, indexes, RLS) into YOUR project.
//   2. Verify every expected table actually landed.
//   3. Ask for your project URL + anon key and write config.js.
//   4. Verify config.js actually works against your project.
//   5. Check your git remote isn't still pointed at the original template.
//
// Every step fails loudly and stops the script on error - nothing here
// silently continues after a problem. If a step fails, fix what the
// error message says and re-run `npm run setup`; it's safe to re-run.

const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const { execSync } = require("child_process");

const ROOT = __dirname;

function fail(step, message) {
  console.error(`\n❌  Setup failed at: ${step}\n`);
  console.error(message);
  console.error("\nNothing after this step was run. Fix the issue above and re-run: npm run setup\n");
  process.exit(1);
}

function ok(message) {
  console.log(`✅  ${message}`);
}

async function prompt(rl, question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function main() {
  console.log("=== Batch Tracker setup ===\n");
  console.log("This talks ONLY to the Supabase project you point it at - never to");
  console.log("the original Markwood project. Have these two things open from your");
  console.log("own Supabase dashboard before you start:\n");
  console.log("  1. Click the gear (Settings) icon in the left sidebar -> Database -> Connection string (URI)");
  console.log("  2. Same gear icon -> API Keys (sometimes just called API) -> Project URL + Publishable/anon key\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });

  // ---------- Step 1: connection string ----------
  let connStr = await prompt(
    rl,
    "Paste your Supabase Postgres connection string (starts with postgres:// or postgresql://): "
  );
  if (!/^postgres(ql)?:\/\//.test(connStr)) {
    rl.close();
    fail(
      "reading connection string",
      `That doesn't look like a Postgres connection string (got: "${connStr.slice(0, 40)}...").\n` +
        "In your Supabase dashboard: Settings (gear icon in the left sidebar) -> Database -> Connection string -> URI.\n" +
        "It should start with postgres:// or postgresql:// and include your database password."
    );
  }
  if (connStr.includes("[YOUR-PASSWORD]") || connStr.includes("[YOUR_PASSWORD]")) {
    rl.close();
    fail(
      "reading connection string",
      "That connection string still has a [YOUR-PASSWORD] placeholder in it.\n" +
        "Replace it with your actual database password (set when you created the project,\n" +
        "or resettable under Settings (gear icon) -> Database -> Reset database password)."
    );
  }

  // ---------- Step 2: push schema.sql ----------
  const { Client } = requireOrFail("pg", rl);
  const schemaPath = path.join(ROOT, "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    rl.close();
    fail("locating schema.sql", `Expected to find schema.sql next to setup.js at:\n  ${schemaPath}\nbut it's missing.`);
  }
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  console.log("\nConnecting to your database...");
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  } catch (e) {
    rl.close();
    fail(
      "connecting to your database",
      `Could not connect using that connection string:\n  ${e.message}\n\n` +
        "Common causes: wrong password, or you copied the connection string before\n" +
        "replacing [YOUR-PASSWORD], or your project is still spinning up (new Supabase\n" +
        "projects can take ~1-2 minutes to become reachable after creation)."
    );
  }
  ok("Connected to your database.");

  console.log("Pushing schema (tables, indexes, RLS policies)...");
  try {
    await client.query(schemaSql);
  } catch (e) {
    await client.end();
    rl.close();
    fail(
      "pushing schema.sql",
      `Postgres rejected the schema:\n  ${e.message}\n\n` +
        "schema.sql is safe to re-run (every statement is idempotent), so once you've\n" +
        "resolved the issue above, just run `npm run setup` again."
    );
  }
  ok("Schema pushed.");

  console.log("Verifying tables landed...");
  const expectedTables = [
    "mn_rooms", "mn_zones", "mn_bays", "mn_batches", "mn_batch_notes",
    "mn_harvests", "mn_movements", "mn_placements", "mn_costs",
    "mn_settings", "mn_yield_defaults",
  ];
  let foundTables;
  try {
    const res = await client.query(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)",
      [expectedTables]
    );
    foundTables = res.rows.map((r) => r.table_name);
  } catch (e) {
    await client.end();
    rl.close();
    fail("verifying tables", `Could not query information_schema to verify the schema:\n  ${e.message}`);
  }
  const missing = expectedTables.filter((t) => !foundTables.includes(t));
  if (missing.length) {
    await client.end();
    rl.close();
    fail(
      "verifying tables",
      `Schema push reported success, but these tables are missing afterward:\n  ${missing.join(", ")}\n` +
        "This shouldn't happen - please re-run `npm run setup`, and if it persists, paste\n" +
        "the full contents of schema.sql into the Supabase SQL Editor manually and check\n" +
        "for an error there."
    );
  }
  ok(`All ${expectedTables.length} tables verified present.`);
  await client.end();

  // ---------- Step 3: project URL + anon key -> config.js ----------
  console.log("\nNow the app-side connection. In your dashboard: click the gear (Settings)");
  console.log("icon in the left sidebar, then 'API Keys' (some projects just call it 'API').");
  let projectUrl = await prompt(rl, "Project URL (e.g. https://abcdefgh.supabase.co, near the top of that page): ");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(projectUrl)) {
    rl.close();
    fail(
      "reading project URL",
      `That doesn't look like a Supabase project URL (got: "${projectUrl}").\n` +
        "It should look like: https://abcdefghijklmnop.supabase.co\n" +
        "Find it under Settings (gear icon) -> API Keys -> Project URL."
    );
  }
  projectUrl = projectUrl.replace(/\/$/, "");

  let anonKey = await prompt(rl, "Publishable / anon key (labeled 'Publishable key' or 'anon'/'public'): ");
  const looksLikeServiceRoleJwt = isJwt(anonKey) && jwtRole(anonKey) === "service_role";
  if (anonKey.startsWith("sb_secret_") || looksLikeServiceRoleJwt) {
    rl.close();
    fail(
      "reading anon key",
      "That looks like a SECRET / service_role key, not the publishable/anon one.\n" +
        "The secret key bypasses Row Level Security entirely and must never be put\n" +
        "in client-side code (config.js ships to every visitor's browser).\n" +
        "Go back to Settings (gear icon) -> API Keys and copy the one labeled\n" +
        "'Publishable key' (starts 'sb_publishable_...') or 'anon'/'public' (starts\n" +
        "'eyJ...' on older projects) - not 'Secret key' / 'service_role'."
    );
  }
  if (!isJwt(anonKey) && !anonKey.startsWith("sb_publishable_")) {
    rl.close();
    fail(
      "reading anon key",
      "That doesn't look like a valid Supabase publishable/anon key.\n" +
        "It should either be a long JWT starting with 'eyJ...' (older projects, labeled\n" +
        "'anon'/'public') or start with 'sb_publishable_' (newer projects, labeled\n" +
        "'Publishable key'). Copy it again from Settings (gear icon) -> API Keys."
    );
  }

  console.log("\nVerifying the app can reach your project with this URL/key...");
  let verifyRes;
  try {
    verifyRes = await fetch(`${projectUrl}/rest/v1/mn_rooms?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
  } catch (e) {
    rl.close();
    fail("verifying project URL/key", `Could not reach ${projectUrl}:\n  ${e.message}\nDouble-check the Project URL.`);
  }
  if (verifyRes.status === 401 || verifyRes.status === 403) {
    rl.close();
    fail(
      "verifying project URL/key",
      `Supabase rejected the anon key (HTTP ${verifyRes.status}).\n` +
        "Double-check you copied the 'anon' / 'public' key (not service_role), with no\n" +
        "extra whitespace, from the SAME project as the connection string above."
    );
  }
  if (!verifyRes.ok) {
    const body = await verifyRes.text().catch(() => "");
    rl.close();
    fail("verifying project URL/key", `Unexpected response (HTTP ${verifyRes.status}) from your project:\n  ${body.slice(0, 300)}`);
  }
  ok("Project URL and anon key verified working.");

  const configPath = path.join(ROOT, "config.js");
  const configContents =
    `// Generated by setup.js on ${new Date().toISOString()}\n` +
    `// This file is gitignored - it holds YOUR project's key. Do not commit it.\n` +
    `window.SUPABASE_URL = ${JSON.stringify(projectUrl)};\n` +
    `window.SUPABASE_KEY = ${JSON.stringify(anonKey)};\n`;
  try {
    fs.writeFileSync(configPath, configContents);
  } catch (e) {
    rl.close();
    fail("writing config.js", `Could not write ${configPath}:\n  ${e.message}`);
  }
  ok(`config.js written (${configPath}).`);

  // ---------- Step 4: git remote sanity check ----------
  console.log("\nChecking your git remote...");
  let remoteUrl = "";
  try {
    remoteUrl = execSync("git remote get-url origin", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (e) {
    console.log("⚠️  No git remote 'origin' configured yet - skipping this check for now.");
    console.log("   Once you fork the repo on GitHub, run: git remote add origin <your-fork-url>");
  }
  if (remoteUrl && /FarmerAdam\/batch-tracker/i.test(remoteUrl)) {
    console.log(`\n⚠️  Your git remote still points at the ORIGINAL template repo:\n     ${remoteUrl}\n`);
    console.log("If you push like this, nothing bad happens to Adam's project (this repo has");
    console.log("no write access for you), but your push will just fail - you need your OWN fork.");
    const answer = await prompt(
      rl,
      "\nHave you already forked this repo on GitHub and want to point origin at YOUR fork now? (y/N): "
    );
    if (/^y/i.test(answer)) {
      const forkUrl = await prompt(rl, "Paste your fork's git URL (e.g. git@github.com:you/batch-tracker.git): ");
      try {
        execSync(`git remote set-url origin ${JSON.stringify(forkUrl)}`, { cwd: ROOT });
        ok(`git remote 'origin' updated to ${forkUrl}`);
      } catch (e) {
        rl.close();
        fail("updating git remote", `Could not update the git remote:\n  ${e.message}`);
      }
    } else {
      console.log("Skipping for now - remember to fork on GitHub and run:");
      console.log("  git remote set-url origin git@github.com:YOUR-USERNAME/batch-tracker.git");
      console.log("before you push, or your changes will have nowhere of yours to go.");
    }
  } else if (remoteUrl) {
    ok(`git remote 'origin' already points at your own repo (${remoteUrl}).`);
  }

  rl.close();

  console.log("\n=== Setup complete ===\n");
  console.log("Next steps:");
  console.log("  1. Open index.html locally (or `python3 -m http.server`) and confirm you can");
  console.log("     see a login screen. Create your first user under Authentication -> Users");
  console.log("     in the Supabase dashboard, then sign in.");
  console.log("  2. config.js is gitignored on purpose - a plain `git add -A` will silently skip");
  console.log("     it, which would leave your deployed site stuck on 'Setup incomplete' with no");
  console.log("     error telling you why. To actually get it onto your deployed site, either:");
  console.log("       a) git add -f config.js && git add -A && git commit -m 'Configure my Supabase project' && git push");
  console.log("          (this puts your anon key in your repo's history - fine, it's meant to be");
  console.log("          public/client-visible, see README's Analytics/License notes), or");
  console.log("       b) leave it out of git and upload config.js separately through GitHub's web");
  console.log("          UI (Add file -> Upload files) after pushing everything else.");
  console.log("  3. In your GitHub fork: Settings -> Pages -> Deploy from branch -> main.");
  console.log("  4. Once Pages finishes building, reload your live site - the 'Setup incomplete'");
  console.log("     banner should be gone.\n");
}

function isJwt(s) {
  return typeof s === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s);
}

function jwtRole(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    return payload.role;
  } catch (e) {
    return null;
  }
}

function requireOrFail(mod, rl) {
  try {
    return require(mod);
  } catch (e) {
    rl.close();
    fail(
      `loading the "${mod}" package`,
      `The "${mod}" package isn't installed.\nRun: npm install\nthen re-run: npm run setup`
    );
  }
}

main().catch((e) => {
  console.error("\n❌  Unexpected error - setup did not complete:\n");
  console.error(e);
  process.exit(1);
});
