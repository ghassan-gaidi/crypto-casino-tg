# Design System: Pickr
**Project ID:** Crypto Casino Telegram Mini App @cr00k_bot

## 1. Visual Theme & Atmosphere

Pickr is a sleek, premium crypto casino built for the Telegram Mini App canvas. The identity is aggressive, confident, and unmistakable — deep crimson (`#DC2626`) is the commanding accent, cutting through a near-black (`#08080E`) void like a neon blade. Warm gold (`#FFB800`) provides the emotional counterpoint — wealth, winning, jackpot heat — while deep purple (`#7C3AED`) signals VIP exclusivity.

The atmosphere is **controlled aggression**. Crimson is not a passive color — it's blood, fire, intensity. Every glow has purpose. Every animation earns its place. The pickaxe monogram (a "P" that reads as a mining tool) is the brand anchor — angular, geometric, rendered in crimson. The design language is condensed, tight, architectural: Space Grotesk typography with compressed tracking, crisp 4px borders, flat surfaces with deep color contrast (no glassmorphism), and surgical glow effects reserved for wins, active states, and the brand red itself.

This is not another dark-cyan casino. This is PICKR.

## 2. Color Palette & Roles

### Primary Foundation
| Name | Hex | Role |
|------|-----|------|
| **Void Black** | `#08080E` | Page background — cooler, deeper than pure black |
| **Night Surface** | `#101018` | Card fills, panels, containers |
| **Deep Slate** | `#181825` | Elevated surfaces, hover states |
| **Phantom Border** | `#1E1E30` | Subtle dividers, card borders |
| **Focus Border** | `rgba(220,38,54,0.3)` | Active input/button borders |

### Accent & Interactive
| Name | Hex | Role |
|------|-----|------|
| **Deep Crimson** | `#DC2626` | PRIMARY ACCENT — CTAs, active states, brand elements, active nav |
| **Crimson Glow** | `rgba(220,38,54,0.15)` | Subtle glow wash for active surfaces |
| **Crimson Muted** | `#991B1B` | Secondary accent elements, inactive indicators |

### Wealth & Wins
| Name | Hex | Role |
|------|-----|------|
| **Hot Gold** | `#FFB800` | Balance display, jackpot, win amounts, streaks |
| **Gold Glow** | `rgba(255,184,0,0.2)` | Win glow effect |
| **Gold Muted** | `#B8860B` | Secondary gold elements |

### VIP & Status
| Name | Hex | Role |
|------|-----|------|
| **Royal Purple** | `#7C3AED` | VIP badges, level indicators, premium features |
| **Purple Glow** | `rgba(124,58,237,0.15)` | VIP surface treatment |

### Semantic
| Name | Hex | Role |
|------|-----|------|
| **Profit Green** | `#00FF88` | Wins, positive P&L, success states |
| **Green Glow** | `rgba(0,255,136,0.2)` | Win celebrations |
| **Loss Red** | `#FF3366` | Losses, errors, danger |
| **Red Glow** | `rgba(255,51,102,0.15)` | Loss state wash |

### Text Hierarchy
| Name | Hex | Role |
|------|-----|------|
| **Pure White** | `#FFFFFF` | Headlines, key metrics |
| **Soft Silver** | `#D4D4E0` | Body text, labels |
| **Dim Gray** | `#6B6B80` | Secondary text, captions |
| **Muted Stone** | `#3A3A50` | Disabled, placeholders, metadata |

## 3. Typography Rules

### Font System
- **Display & UI**: `Space Grotesk` — condensed geometric sans. Sharp, technical, confident.
- **Numbers**: `JetBrains Mono` — monospace, tabular figures. All balances, multipliers, amounts, XP.
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Hierarchy
| Role | Font | Size | Weight | Letter-Spacing | Line-Height | Usage |
|------|------|------|--------|---------------|-------------|-------|
| Display | Space Grotesk | 22px | 700 | 4px | 1.2 | Page title (e.g. "PICKR") |
| H1 | Space Grotesk | 16px | 700 | 3px | 1.3 | Section headers |
| H2 | Space Grotesk | 13px | 600 | 2px | 1.4 | Card titles, game names |
| H3 | Space Grotesk | 11px | 600 | 1.5px | 1.4 | Sub-labels |
| Body | Space Grotesk | 13px | 400 | 0.5px | 1.5 | Primary reading text |
| Small | Space Grotesk | 11px | 400 | 0.5px | 1.4 | Captions, metadata |
| Label | Space Grotesk | 9px | 500 | 2.5px | 1.2 | Overlines, tab labels, badges |
| Mono Display | JetBrains Mono | 42px | 800 | -1px | 1 | Win amounts, multipliers |
| Mono Large | JetBrains Mono | 20px | 700 | 0 | 1.2 | Balance display |
| Mono Body | JetBrains Mono | 13px | 500 | 0 | 1.4 | Bet amounts, timestamps, hashes |
| Mono Small | JetBrains Mono | 10px | 400 | 0 | 1.4 | Transaction hashes, IDs |

### Typography Principles
- **ALL CAPS by default** for labels, headers, buttons, nav — the brand voice is commanding
- **Tight tracking on large text** (4px at 22pt display) — compressed power
- **Monospace for everything numeric** — prices, balances, multipliers, amounts, XP, timestamps
- **No body text below 11px** — Telegram Mini App readability constraint
- **Button text**: uppercase, weight 600, letter-spacing 2px

## 4. Component Stylings

### Buttons
**Primary Crimson**
- Background: `#DC2626`
- Text: `#08080E` (Void Black)
- Border: none
- Radius: 4px (sharp, squared — brand signature)
- Padding: 12px 20px
- Font: Space Grotesk 12px, 600, 2px letter-spacing, uppercase
- Hover: brighter glow — `box-shadow: 0 0 24px rgba(220,38,54,0.3)`
- Active: `scale(0.97)` — tactile push

**Green (Win/Action)**
- Background: `#00FF88`
- Text: `#08080E`
- Hover: `box-shadow: 0 0 24px rgba(0,255,136,0.3)`

**Gold (Jackpot/Claim)**
- Background: `#FFB800`
- Text: `#08080E`
- Glow: `box-shadow: 0 0 24px rgba(255,184,0,0.25)`

**Ghost (Secondary)**
- Background: transparent
- Text: `#6B6B80`
- Border: `1px solid #1E1E30`
- Hover: `border-color: #DC2626; color: #DC2626; background: rgba(220,38,54,0.04)`

**Danger (Loss/Cash Out)**
- Background: transparent
- Text: `#FF3366`
- Border: `1px solid rgba(255,51,102,0.3)`
- Hover: `border-color: #FF3366; background: rgba(255,51,102,0.06)`

**Disabled**
- Opacity: 0.35
- Cursor: not-allowed
- No glow, no hover effect

### Cards & Containers
- Background: `#101018` (Night Surface)
- Border: `1px solid #1E1E30`
- Radius: **4px** — the brand corner signature
- Internal padding: 16px
- Hover: `border-color: rgba(220,38,54,0.25); background: rgba(220,38,54,0.02)`

### Game Cards (Home Page)
- Same card base + icon area (44×44px) with cyan border accent
- Title condensed, uppercase
- Max win badge: gold pill with `#FFB800` text on `rgba(255,184,0,0.1)` background
- Stagger entrance animation: 50ms delay cascade, translateY(8px) → translateY(0)

### Inputs
- Background: `#101018`
- Border: `1px solid #1E1E30`
- Text: `#FFFFFF`, JetBrains Mono
- Radius: 4px
- Focus: `border-color: #00E5FF; box-shadow: 0 0 16px rgba(0,229,255,0.12)`
- Placeholder: `#3A3A50`
- Disabled: opacity 0.35

### Navigation (Bottom Tab Bar)
- Background: `#08080E` (matches page bg — seamless)
- Top border: `1px solid #1E1E30`
- Height: 56px (safe area respected, +24px bottom padding on modern iOS)
- Active tab: cyan icon + white label
- Inactive tab: `#3A3A50` icon + `#3A3A50` label
- Tab padding: 6px 0

### Header
- Border-bottom: `1px solid #1E1E30`
- Title: "PICKR" in cyan, Space Grotesk 16px 700, 3px tracking
- Balance: gold monospace with glow

### Stats / Terminal Box
- Same card style but with a thin cyan top border (`2px solid rgba(0,229,255,0.15)`)
- Header row: condensed label in cyan
- Content: monospace values

### Results (Win/Loss Display)
**Win**
- Border: `1px solid rgba(0,255,136,0.3)`
- Background: `rgba(0,255,136,0.03)`
- Amount: JetBrains Mono 42px, 800, green glow
- Animation: scale-pop from 0.8 → 1.0, then green pulse glow 1.5s
- Label: uppercase, green, letter-spacing 3px ("YOU WON")

**Loss**
- Border: `1px solid rgba(255,51,102,0.2)`
- Amount: muted dim text
- Animation: subtle shake (if bet was significant), quick fade
- Label: red, small

### Progress / Multiplier Bar
- Track: `#1E1E30`, 4px height
- Fill: cyan-to-gold gradient
- Glow: matches fill color

### Quick Bet Chips
- Same as ghost buttons
- Active: cyan border, cyan text, subtle cyan background

### Empty States
- "No bets yet" — monospace dim text with 4px letter-spacing
- Optional: ghost pickaxe icon at low opacity as watermark

## 5. Layout Principles

### Grid & Structure
- **Max-width**: 440px (Telegram Mini App standard), centered
- **Inner padding**: 16px horizontal on all pages
- **Single column** — no multi-column layout on mobile
- **Bottom nav**: 4 fixed tabs (Home, Wallet, History, Rank)
- **Page content**: scrollable between header and bottom nav

### Whitespace Strategy
- **Base spacing unit**: 8px (8, 12, 16, 20, 24, 32, 48)
- **Card spacing**: 6px gap between game cards (tight for density)
- **Section spacing**: 20px between major sections
- **Edge padding**: 16px consistent on all sides

### Responsive Behavior
- Designed for 375px–440px width (TG Mini App range)
- No horizontal scroll — critical failure if it occurs
- All touch targets ≥44px
- Bottom nav collapses and stays fixed
- Font sizes use `clamp()` for fluid scaling between 320px–440px

### Safe Areas
- Top safe area: 12px above header
- Bottom safe area: 24px below nav (Telegram iOS gesture bar)
- Content has `padding-bottom: 80px` to avoid bottom nav overlap

## 6. Motion & Interaction

### Spring Physics
- Default: `stiffness: 100, damping: 20` — premium, weighty feel
- Wins: `stiffness: 200, damping: 15` — bouncy celebration
- Card entrance: `stiffness: 80, damping: 16` — smooth stagger

### Micro-Interactions
- **Button press**: scale(0.97), 80ms duration
- **Card hover**: border-color shift + subtle glow, 200ms
- **Page transition**: opacity 0 → 1 + translateY(6px), 120ms
- **Win result**: scale-pop 300ms with overshoot (cubic-bezier 0.18, 0.89, 0.32, 1.28)
- **Loss result**: quick fade-in, 200ms, no celebration
- **Toast notifications**: slide-in from top, 250ms

### Win Celebrations
- **Scale pop**: 0.6 → 1.0 with overshoot
- **Green glow pulse**: alternating between normal and intense glow over 1.5s
- **Confetti**: particle burst (existing implementation, keep)
- **Haptic**: Telegram `impactOccurred(.heavy)` on significant wins

### Constraints
- Animate only `transform` and `opacity` — never `width`, `height`, `top`, `left`
- Respect `prefers-reduced-motion` — disable all animations
- No decorative-only animation loops
- Exit animations faster than enter (60% of duration)

## 7. Anti-Patterns (Banned)

- **No emoji** as icons — every game gets a proper SVG icon, nav gets SVGs
- **No emoji** in UI — no 🔥, 💎, 🚀 as decorative elements
- **No emoji** for sound toggle — SVG speaker icons instead
- **No `Inter` font** — Space Grotesk is the typeface
- **No pure black** (`#000000`) — use Void Black (`#08080E`)
- **No outer glow shadows** on everything — glow is surgical, for wins and CTAs only
- **No glassmorphism** — flat surfaces, depth through color contrast
- **No 3-column equal grids** — single column or asymmetric
- **No fake metrics** — never invent "50,000 players online" or fake stats
- **No gradient text on large headers** — single-color cyan for brand text
- **No AI copywriting clichés** ("Elevate", "Seamless", "Next-Gen", "Unleash")
- **No "Scroll to explore"** or bouncing chevrons
- **No decorative-only animation** — every motion serves a purpose
- **No emojis for sound/mute** — SVG icon instead
- **No rounded corners above 4px** — sharp corners are the brand signature
- **No pill-shaped buttons** — 4px radius, squared
