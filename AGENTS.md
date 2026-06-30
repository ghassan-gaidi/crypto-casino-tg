# AGENTS.md — PICKR

> Telegram casino bot (@cr00k_bot → rebranding to PICKR). grammY webhook on Vercel.
> Brand: Electric cyan (#00E5FF) on dark (#08080E). Space Grotesk + JetBrains Mono.
> Logo: Pickaxe "P" monogram.

## Tech
- TypeScript, grammY, Vercel serverless
- Supabase: fqaqbonrdmaziafssimz
- Admin ID: 8194112877

## Key Files
- `src/bot.ts` — main bot entry
- `src/handlers/` — command handlers
- `app/src/design.css` — design system
- `app/src/App.tsx` — main UI
- `app/public/` — brand assets (SVG logos, icons)
- `.stitch/DESIGN.md` — full design system spec

## Commands
```bash
cd app && npm run dev     # Local dev with webhook emulation
vercel deploy              # Deploy
```

## Brand Assets
- Logo: `app/public/logo.svg` — P pickaxe monogram + "PICKR" wordmark
- Favicon: `app/public/favicon.svg` — simplified octagonal pickaxe
- OG image: `app/public/og-image.svg` — 1200x630 social share
- Game icons: `app/public/icons/` — 9 SVG game icons
- Nav icons: `app/public/icons/nav-*.svg` — 4 tabs × 2 states
- Bot avatar: `app/public/tg/bot-avatar.svg` — 512×512

## Related
- Crypto Empire dashboard
- Cr00k.com landing page
