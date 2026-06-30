# PICKR — Brand Asset Spec

**Project:** PICKR — Telegram Mini App Casino
**Theme:** "Dark Premium" — electric cyan on void black, condensed power
**Bot:** @cr00k_bot (rebranding to PICKR)
**Design System:** `.stitch/DESIGN.md`

---

## Color Palette

| Token          | Hex       | Use                          |
|----------------|-----------|------------------------------|
| Void Black     | `#08080E` | Page background              |
| Night Surface  | `#101018` | Card/panel fills             |
| Deep Slate     | `#181825` | Elevated surfaces            |
| Electric Cyan  | `#DC2626` | PRIMARY — CTAs, brand, nav, active (DEEP CRIMSON) |
| Cyan Dim       | `#991B1B` | Secondary crimson elements      |
| Hot Gold       | `#FFB800` | Wins, jackpot, balance       |
| Royal Purple   | `#7C3AED` | VIP, levels, special         |
| Profit Green   | `#00FF88` | Wins, success states         |
| Loss Red       | `#FF3366` | Losses, errors, danger       |
| Phantom Border | `#1E1E30` | Dividers, card borders       |
| Soft Silver    | `#D4D4E0` | Body text                    |
| Dim Gray       | `#6B6B80` | Secondary text               |
| Muted Stone    | `#3A3A50` | Disabled, placeholders       |

---

## Logo

### Primary: "P" Pickaxe Monogram
- A bold "P" letterform where the vertical stroke doubles as a pickaxe handle
- The top flares into two angled points (the pickaxe head)
- Electric cyan (#00E5FF) stroke on dark background
- Octagonal chip outline with subtle cyan glow
- Angular, geometric — 4px radius brand signature

### Files
- `logo.svg` — Full logo (512×512, P monogram + "PICKR" wordmark)
- `favicon.svg` — Simplified icon (64×64, octagonal chip + P)
- `tg/bot-avatar.svg` — 512×512, P monogram only, centered for circular crop

### Usage
- App header, splash screen, about page, Telegram bot avatar
- Works at 32px (favicon) to 512px (full logo)
- Transparent or `#08080E` background

---

## Typography

| Role        | Font              | Weight | Letter-Spacing | Style      |
|-------------|-------------------|--------|----------------|------------|
| Display     | Space Grotesk     | 700    | 4px            | Uppercase  |
| H1          | Space Grotesk     | 700    | 3px            | Uppercase  |
| H2          | Space Grotesk     | 600    | 2px            | Uppercase  |
| Labels      | Space Grotesk     | 500    | 2.5px          | Uppercase  |
| Body        | Space Grotesk     | 400    | 0.5px          | Mixed case |
| Numbers     | JetBrains Mono    | 500-800| 0px            | Tabular    |

---

## Design Principles

1. **Sharp corners** — 4px radius is the brand signature. No pill buttons, no heavy rounding.
2. **Surgical glow** — Cyan glow on CTAs and active states only. Never decorative.
3. **Flat depth** — No glassmorphism. Depth comes from color contrast (Void Black vs Night Surface).
4. **Condensed power** — Tight letter-spacing, uppercase labels, Space Grotesk geometry.
5. **Everyone uses SVG** — No emoji as icons. Every game, nav item, and sound toggle is SVG.
6. **ALL CAPS labels** — Buttons, nav, headers, labels are uppercase by default.
7. **Monospace numbers** — All balances, multipliers, amounts, XP, and hashes in JetBrains Mono.

---

## Asset Inventory

### Game Icons (SVG, 64×64)
`icons/icon-dice.svg`, `icon-coinflip.svg`, `icon-crash.svg`, `icon-mines.svg`, `icon-plinko.svg`, `icon-slots.svg`, `icon-roulette.svg`, `icon-limbo.svg`, `icon-jackpot.svg`

### Nav Icons (SVG, 24×24)
`nav-home.svg`, `nav-home-active.svg`, `nav-wallet.svg`, `nav-wallet-active.svg`, `nav-history.svg`, `nav-history-active.svg`, `nav-rank.svg`, `nav-rank-active.svg`

### Social
`og-image.svg` — 1200×630, P monogram on left + "PICKR" + tagline

---

## What's Needed (Next)

1. PNG raster exports from SVGs at every size in the manifest
2. Bot avatar uploaded to Telegram (@BotFather)
3. Cr00k.com landing page redesign to match PICKR
