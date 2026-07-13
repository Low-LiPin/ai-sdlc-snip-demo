# Snip — Design Language

Inspired by the visual language of lovable.dev: dark, minimal, warm-gradient hero,
pill-input centerpiece, card surfaces, generous spacing.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#080810` | Page background (near-black, cool-dark) |
| `--surface` | `#0f0f1c` | Card / input backgrounds |
| `--surface-hover` | `#16162a` | Hover state on surface elements |
| `--border` | `rgba(255,255,255,0.08)` | Subtle card borders |
| `--border-focus` | `rgba(255,100,80,0.50)` | Input border on focus |
| `--text` | `#f0f0f5` | Primary body text |
| `--text-muted` | `#7878a0` | Labels, captions, helper text |
| `--text-dim` | `#44446a` | Placeholder text, disabled |
| `--accent-from` | `#ff6b4a` | Gradient start (coral-orange) |
| `--accent-to` | `#ff3d8a` | Gradient end (deep-pink) |
| `--accent-gradient` | `linear-gradient(135deg, #ff6b4a, #ff3d8a)` | Buttons, links, highlights |
| `--accent-glow` | `rgba(255,84,112,0.18)` | Focus ring tint |
| `--error` | `#ff6b6b` | Inline error text |

---

## Accent Gradient (hero glow)

```css
background: radial-gradient(
  ellipse 80% 50% at 50% -5%,
  rgba(255, 95, 70, 0.20) 0%,
  transparent 70%
);
```

Applied as a positioned pseudo-element / `aria-hidden` `<div>` behind the hero headline.

---

## Typography

**Font stack:** `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
**Code stack:** `'ui-monospace', 'SFMono-Regular', 'Fira Mono', monospace`

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero title | `clamp(2.5rem, 8vw, 4rem)` | 700 | Gradient clip, tight letter-spacing −0.04em |
| Hero subtitle | `1rem` | 400 | `--text-muted` |
| Section label | `0.8125rem` | 600 | Uppercase, letter-spacing +0.08em, `--text-muted` |
| Body / input | `0.9375rem` | 400 | |
| Table header | `0.8125rem` | 500 | `--text-dim` |
| Table body | `0.875rem` | 400 | |
| Code links | `0.875rem` | 600 | Monospace, gradient clip |

---

## Spacing

Base unit: `0.25rem`. Preferred values: `0.5 · 0.75 · 1 · 1.25 · 1.5 · 2 · 2.5 · 3 · 4 · 6rem`

Page max-width: `720px`, centered, `1.5rem` side padding.  
Hero top padding: `6rem`. Hero bottom padding: `3rem`.

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-pill` | `9999px` | Input wrapper, CTA button, result label |
| `--radius-card` | `1rem` | Result card, links card, mobile input |
| `--radius-sm` | `0.5rem` | Small badges (if any) |

---

## Borders, Shadows & Glow

```css
/* Card */
border: 1px solid rgba(255,255,255,0.08);
box-shadow: 0 4px 32px rgba(0,0,0,0.45);

/* Input pill — resting */
border: 1px solid rgba(255,255,255,0.10);

/* Input pill — focus */
border-color: rgba(255,100,80,0.50);
box-shadow: 0 0 0 3px rgba(255,84,112,0.18), 0 8px 32px rgba(0,0,0,0.50);
```

---

## Component Mapping

| Snip element | Design pattern | Class |
|---|---|---|
| Page header | Centered hero section, ambient warm glow behind | `.hero` + `.hero-glow` |
| Hero title | Large bold gradient-clipped text | `.hero-title` |
| Hero subtitle | Muted one-liner below title | `.hero-sub` |
| URL form | Pill-shaped input + attached rounded button | `.input-pill` |
| Submit button | Accent-gradient filled, pill, hover scale | `.input-pill button` |
| Inline error | Small `--error` text, centered | `.inline-error` |
| Success result | Rounded surface card: label + gradient link | `.result-card` |
| Links table | Dark card, overflow hidden, subtle row dividers | `.links-card` |
| Short code cell | Monospace, gradient-clipped, hover opacity | `.code-link` |
| Original URL | Truncated with ellipsis, `--text-muted` tint | `.url-cell` |
