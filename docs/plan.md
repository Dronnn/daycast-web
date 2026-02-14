# Plan: Design V2 — Complete Visual Overhaul

## Goal
Implement the Design V2 overhaul for daycast-web: Apple Premium + Futuristic + Warm aesthetic with framer-motion animations, glassmorphism, gradient mesh backgrounds, and polished dark/light modes. No functionality changes.

## Steps

- [x] 1. Install framer-motion dependency
- [x] 2. Update index.html — remove Plus Jakarta Sans font import
- [x] 3. Update index.css — complete CSS variables overhaul (colors, typography, border-radius, gradient mesh keyframes, glow effects)
- [x] 4. Update Layout.tsx + Layout.css — glassmorphism navbar, framer-motion page transitions, scroll shrink
- [x] 5. Update Login.tsx + Login.css — centered card, gradient mesh bg, glowing inputs, gradient button
- [x] 6. Update Feed.tsx + Feed.css — large cards with hover glow/scale, animated drag-drop, spring animations
- [x] 7. Update Generate.tsx + Generate.css — full-width result cards, animated generate button, spring settings panel
- [x] 8. Update Channels.tsx + Channels.css — colored accents, spring toggles, auto-save feedback
- [x] 9. Update History.tsx + History.css — scroll-triggered reveal, timeline feel
- [x] 10. Update HistoryDetail.tsx + HistoryDetail.css — scroll reveal, large typography

---

# Plan: Fix responsive/mobile scaling issues

## Goal
Fix mobile responsiveness across all pages in daycast-web so the site scales well on iPhone (320-428px width).

## Steps

- [x] 1. Fix `index.css` — add mobile-friendly base styles
- [x] 2. Fix `Layout.css` — improve navbar for small phones (375px)
- [x] 3. Fix `Channels.css` — PRIORITY: make settings accessible on mobile, stack controls vertically
- [x] 4. Fix `Feed.css` — improve composer and items for mobile
- [x] 5. Fix `Generate.css` — scale hero, cards grid, buttons for mobile
- [x] 6. Fix `History.css` — improve rows and search for mobile
- [x] 7. Fix `HistoryDetail.css` — improve items and generations for mobile
- [x] 8. Fix `Login.css` — improve card for small phones

---

# Plan: Edit History Popover — Right-click & Long-press

## Goal
Add edit history viewing via right-click context menu (desktop) and long-press (mobile) on feed items. Show a glassmorphism popover with Apple-style design and framer-motion animations.

## Steps

- [x] 1. Add EditHistoryPopover component to Feed.tsx — state management, popover rendering with framer-motion
- [x] 2. Add right-click handler (onContextMenu) on feed items with edits — prevent default, show popover at cursor
- [x] 3. Add long-press handler (touch events with 500ms timer) on feed items with edits — show centered popover
- [x] 4. Wire the existing "Edited (N)" badge to also open the popover (replace inline expand)
- [x] 5. Add dismiss behavior — click outside, Escape key, backdrop overlay
- [x] 6. Add CSS styles for the popover — glassmorphism, responsive layout, dark mode support
