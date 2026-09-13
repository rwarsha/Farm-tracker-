# Batch Tracker

A free, open-source grow-cycle tracker for mushroom/produce growers - rooms,
zones, bays, batches, harvests, costs, and yield forecasting. Single-page
static app (`index.html`), backed by your own free Supabase project. No
shared server, no subscription, no vendor lock-in - you own your data.

## Setup

**No installs, no terminal.** Open [`setup.html`](setup.html) in your
browser and follow the 5 steps - it copies the schema for you, and tests
your Project URL/anon key live before handing you a ready-to-use `config.js`
to download. New to this whole area? Paste [`SETUP-WITH-AI.md`](SETUP-WITH-AI.md)
to Claude or ChatGPT first and it'll walk you through it end to end,
including the GitHub/Supabase dashboard parts `setup.html` can't automate.

Prefer a terminal? `setup.js` does the same schema-push + config-write in
one command (`npm install && npm run setup`) - entirely optional, same end
result either way.

## Analytics

`index.html` and `setup.html` include a small, disclosed, cookie-free visit
counter ([GoatCounter](https://www.goatcounter.com)) so the maintainer can
see roughly how much this template gets used - page views and which setup
steps get reached, nothing about your farm or your Supabase project, which
never leaves your own account. Delete the `<script data-goatcounter...>` tag
near the top of either file if you'd rather run with none at all.

## Support

This is free and gifted with no strings attached - no account of mine, no
subscription, nothing to maintain on your end. If it saves you real time and
you'd like to say thanks, there's a Ko-fi: **[ko-fi.com/farmeradam](https://ko-fi.com/farmeradam)**.
Entirely optional, never required to use or deploy this.

## License

Copyright (C) 2026 Markwood Mushrooms.
[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html), provided as-is with
no warranty - see [`LICENSE`](LICENSE). You're free to use, modify, and even
sell hosting/support around this - the one condition is that if you modify
it and let other users interact with your version over a network (including
just running it for your own farm's staff), you make your modified source
available to them too. That's the copyleft trade: free to build on, not free
to enclose - improvements stay part of the commons instead of disappearing
into someone's private, closed-off fork.

This is a self-hosted template: each grower runs their own copy against
their own Supabase project and is solely responsible for their own data,
backups, security configuration, and any costs on their own accounts. The
original author provides no support, uptime guarantee, or liability for any
individual deployment.
