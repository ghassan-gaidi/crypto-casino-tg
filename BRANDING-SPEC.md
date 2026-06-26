# Pickr — Branding Asset Spec

**Project:** Pickr Telegram Mini App  
**Theme:** "Neon Night" — premium glowing casino with addictive, mesmerizing polish  
**Live URL:** crypto-casino-tg.vercel.app  
**Date:** 2026-06-23

---

## Color Palette

| Token        | Hex       | Use                          |
|-------------|-----------|------------------------------|
| Background  | `#0A0A0F` | Page background              |
| Surface     | `#12121A` | Card/panel fills             |
| Card        | `#1A1A2E` | Elevated surfaces            |
| Primary     | `#00F0FF` | Cyan — main accent, CTAs     |
| Secondary   | `#A855F7` | Purple — gradients           |
| Accent      | `#FF006E` | Pink — highlights, hot streaks|
| Success     | `#00FF88` | Green — wins, profits        |
| Gold        | `#FFB800` | Gold — jackpot, XP, streaks  |
| Danger      | `#FF3366` | Red — losses, warnings       |
| Text        | `#E0E0E0` | Body text                    |
| Text Dim    | `#8B8BA3` | Muted/secondary text         |
| Border      | `#2A2A3E` | Subtle borders               |

---

## Current State

Everything below is currently **placeholder SVGs** generated with code. They need to be replaced with professional designer output. The existing files work functionally (favicon shows in browser tab, PWA installs, OG image shares on Telegram/social) but are visually basic.

---

## Asset List

### 1. LOGO

| Field            | Value                                                  |
|------------------|--------------------------------------------------------|
| **Primary file** | `logo.svg`                                             |
| **Also needed**  | `logo.png` (512×512), `logo-mark.png` (square, no text)|
| **Usage**        | App header, splash screen, about page, Telegram bot avatar |
| **Description**  | Casino chip icon with "CC" monogram. Neon gradient (cyan → purple → pink) on dark background. Should work at small sizes (32px) and large (512px). |
| **Format**       | SVG (vector, infinite scale) + PNG fallback            |
| **Background**   | Transparent or `#0A0A0F`                               |

### 2. FAVICON / APP ICON

| Field            | Value                                                    |
|------------------|----------------------------------------------------------|
| **Primary file** | `favicon.svg`                                            |
| **Also needed**  | `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |
| **Usage**        | Browser tab, Telegram homescreen, phone home screen, PWA install |
| **Description**  | Simplified version of the logo mark — must be legible at 16×16 px. Single icon, no text at small sizes. |
| **Sizes needed** | 16×16, 32×32, 48×48, 180×180 (Apple), 192×192 (Android), 512×512 (splash) |
| **Format**       | SVG + all PNG sizes above                               |

### 3. OPEN GRAPH / SOCIAL SHARE IMAGE

| Field            | Value                                                     |
|------------------|-----------------------------------------------------------|
| **Primary file** | `og-image.png`                                            |
| **Also needed**  | `og-image.svg` (source vector)                            |
| **Usage**        | Shared on Telegram, Twitter/X, Discord, WhatsApp, Slack — any link preview |
| **Dimensions**   | **1200 × 630 px** (required by OG/Twitter spec)           |
| **Description**  | Landscape banner. Logo mark on left, "PICKR" text on right, tagline "9 Provably Fair Games · ETH / SOL / TON", neon gradient bar at bottom. Dark background. |
| **Format**       | PNG (max 1MB for social platforms) + SVG source           |

### 4. GAME ICONS (9 games)

Each game needs a custom icon to replace the current text emojis (◆ ◑ ↗ ⛏ ▼ ≡ ◎ ↑ ★).

| Game       | Current Emoji | Icon Concept                        | Filename               |
|------------|---------------|-------------------------------------|------------------------|
| Dice       | ◆             | Neon die / dice cube                | `icon-dice.png`        |
| Coinflip   | ◑             | Glowing coin (heads/tails)          | `icon-coinflip.png`    |
| Crash      | ↗             | Rocket / line graph going up        | `icon-crash.png`       |
| Mines      | ⛏             | Gem / diamond (not bomb)            | `icon-mines.png`       |
| Plinko     | ▼             | Plinko board with ball              | `icon-plinko.png`      |
| Slots      | ≡             | Slot machine reels / 777            | `icon-slots.png`       |
| Roulette   | ◎             | Roulette wheel                      | `icon-roulette.png`    |
| Limbo      | ↑             | Upward arrow / rocket               | `icon-limbo.png`       |
| Jackpot    | ★             | Jackpot slot / trophy / coins       | `icon-jackpot.png`     |

| Spec           | Value                              |
|----------------|------------------------------------|
| **Size**       | 64×64 px (renders in 40×40 cards) |
| **Format**     | PNG (transparent bg) + SVG source  |
| **Style**      | Neon outline or filled, matching the cyan/purple/pink palette |
| **Consistency**| All 9 icons should feel like a set — same line weight, same glow style |

### 5. BOTTOM NAV ICONS (4 tabs)

| Tab      | Current | Icon Concept             | Filename                |
|----------|---------|--------------------------|-------------------------|
| Home     | ⌂       | House / grid             | `nav-home.png`          |
| Wallet   | ◆       | Wallet / purse / coins   | `nav-wallet.png`        |
| History  | ◇       | Clock / history list     | `nav-history.png`       |
| Rank     | ▲       | Trophy / leaderboard     | `nav-rank.png`          |

| Spec           | Value                              |
|----------------|------------------------------------|
| **Size**       | 24×24 px (renders at 18px font)   |
| **Format**     | PNG (transparent bg) + SVG source  |
| **States**     | 2 versions each: default (dim) + active (cyan glow) |
| **Style**      | Thin outline, matching game icons  |

### 6. SPLASH SCREEN ASSETS

| Field            | Value                                                     |
|------------------|-----------------------------------------------------------|
| **Files**        | `splash-logo.png` (96×96), splash currently uses inline SVG |
| **Usage**        | Shown while app loads (0.5–2 seconds)                     |
| **Description**  | Same logo mark, optimized for fast load. Animated pulse effect is CSS — static asset just needs the chip icon. |
| **Format**       | PNG (fast decode) or inline SVG (current approach works)  |

### 7. TELEGRAM BOT ASSETS

| Field            | Value                                                     |
|------------------|-----------------------------------------------------------|
| **Bot avatar**   | `bot-avatar.png` — **512×512 px**                         |
| **Usage**        | Telegram bot profile picture                              |
| **Description**  | Logo mark centered, works as circular crop (Telegram auto-crops to circle) |
| **Format**       | PNG, square, logo centered with padding                   |

### 8. EMPTY STATE / DECORATIVE

| Field            | Value                                                     |
|------------------|-----------------------------------------------------------|
| **Files**        | `empty-state.png` (optional), `logo-watermark.png`        |
| **Usage**        | Shown when user has no bets/history, background watermark |
| **Description**  | Ghost/wireframe version of the chip logo at low opacity   |
| **Format**       | PNG (transparent bg), ~200×200                            |

---

## File Naming Convention

```
app/public/
├── favicon.svg                 ← PRIMARY favicon (vector)
├── favicon-16.png              ← Browser tiny icon
├── favicon-32.png              ← Browser standard
├── favicon-48.png              ← Windows tile
├── apple-touch-icon.png        ← iOS home screen (180×180)
├── icon-192.png                ← Android homescreen (192×192)
├── icon-512.png                ← PWA splash (512×512)
├── logo.svg                    ← FULL LOGO (vector source)
├── logo.png                    ← FULL LOGO (512×512 raster)
├── logo-mark.png               ← SQUARE MARK only (no text)
├── og-image.svg                ← Social share (vector source)
├── og-image.png                ← Social share (1200×630)
├── manifest.json               ← PWA manifest (already done)
│
├── icons/                      ← GAME + NAV icons
│   ├── icon-dice.png
│   ├── icon-coinflip.png
│   ├── icon-crash.png
│   ├── icon-mines.png
│   ├── icon-plinko.png
│   ├── icon-slots.png
│   ├── icon-roulette.png
│   ├── icon-limbo.png
│   ├── icon-jackpot.png
│   ├── nav-home.png
│   ├── nav-home-active.png
│   ├── nav-wallet.png
│   ├── nav-wallet-active.png
│   ├── nav-history.png
│   ├── nav-history-active.png
│   ├── nav-rank.png
│   └── nav-rank-active.png
│
├── tg/
│   └── bot-avatar.png          ← Telegram bot photo (512×512)
│
├── splash-logo.png             ← Splash screen (96×96)
├── empty-state.png             ← Optional: empty state illustration
└── logo-watermark.png          ← Optional: ghost logo for backgrounds
```

---

## Style Guidelines

1. **Neon glow aesthetic** — Every icon should feel luminous, not flat. Use subtle outer glow (`box-shadow` / SVG filter) or bright edges against dark backgrounds.
2. **Consistent stroke weight** — All outline icons at the same px thickness (2px at 64px = ~3% of size).
3. **Gradient use** — Primary gradient is `#00F0FF` → `#A855F7` → `#FF006E` (cyan → purple → pink). Apply to logo and accent elements, NOT to every icon.
4. **Dark backgrounds** — All PNGs with backgrounds should use `#0A0A0F`. Transparent backgrounds preferred where possible.
5. **No rounded corners on the logo** — The chip shape uses angular octagonal cut corners. This is the brand signature.
6. **Monospace typography** — Any text in images should use `JetBrains Mono`, `Fira Code`, or similar monospace. ALL CAPS with wide letter-spacing.

---

## What I Need Back

When the designer delivers, I need:

1. **SVG source files** for logo, OG image, and all icons (vector = infinitely scalable)
2. **PNG exports** at every size listed above
3. **Transparent backgrounds** where applicable (icons, nav)
4. **Dark-background versions** for OG image, bot avatar, splash
5. A single folder I can drop into `app/public/` and `app/public/icons/`

I'll handle the code integration (swapping placeholder SVGs for real assets, updating `index.html` meta tags, updating game component imports).
