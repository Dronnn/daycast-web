# Log: Edit History Popover — Right-click & Long-press

## Step 1: Add EditHistoryPopover state management
- Added `editPopover` state to hold edits array + position (or null for centered)
- Added `longPressTimer`, `longPressItem` refs and `longPressActive` state for touch handling
- Removed old `expandedEdits` state (no longer needed — inline expand replaced by popover)
- Imported `InputItemEdit` type

## Step 2: Add right-click handler (onContextMenu)
- Added `handleItemContextMenu(e, item)` — checks if item has edits, prevents default browser menu, opens popover at cursor position
- Attached `onContextMenu` to feed item `<motion.div>`
- Items without edits pass through to normal browser context menu

## Step 3: Add long-press handler (touch events)
- Added `handleTouchStart(item)` — starts 500ms timer, sets `longPressActive` for visual feedback
- Added `handleTouchEnd()` — clears timer and visual state
- Added `handleTouchMove()` — cancels long-press if finger moves
- Long-press opens popover with `position: null` (centered on screen for mobile)
- Added `item-longpress` CSS class for subtle scale-down feedback during press

## Step 4: Wire "Edited (N)" badge to popover
- Replaced old inline expand toggle with `openEditPopover()` call
- Badge click opens popover positioned below the badge element
- Removed old `<AnimatePresence>` inline edit list

## Step 5: Add dismiss behavior
- Backdrop overlay (`edit-popover-backdrop`) with `onClick={closeEditPopover}`
- `useEffect` adding `keydown` listener for Escape key when popover is open
- Cleanup removes listener when popover closes

## Step 6: Add CSS styles
- **Backdrop**: fixed overlay, semi-transparent dark, blur(4px), z-index 100
- **Popover**: glassmorphism (`backdrop-filter: saturate(180%) blur(24px)`), 20px border-radius, subtle glow shadow, z-index 101
- **Header**: "Edit History" title + count badge, separated by bottom border
- **List**: scrollable, each entry shows old content (truncated to 4 lines via `-webkit-line-clamp`) + timestamp
- **Separators**: 0.5px lines between entries
- **Dark mode**: darker glass background, adjusted border/shadow colors
- **Mobile responsive**: at <=768px, popover is forced to center of screen, width adapts to viewport
- **Long-press feedback**: `item-longpress` class applies `scale(0.97)` with smooth transition

### Files changed
- `src/pages/Feed.tsx` — all logic changes
- `src/pages/Feed.css` — all style changes
