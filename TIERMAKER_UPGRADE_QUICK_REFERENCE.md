# TierMaker Upgrade — Quick Reference

## ✅ What Changed

### Part 1: Editable Tiers

Each tier row now has a **header toolbar** with these buttons:

```
[Color] [Tier Name] (count)  [↑] [↓] [✏️] [🗑️]
```

- **[Color]** — Click to open color picker
- **[Tier Name]** — Click to rename inline
- **[↑] [↓]** — Move tier up/down
- **[✏️]** — Start rename mode
- **[🗑️]** — Delete tier (items → pool)

### Part 2: Item Ordering

Each item card now shows move buttons on hover:

```
[Card Image]
   [←] [→]   (on hover, below card)
```

- **[←]** — Move item left (one position)
- **[→]** — Move item right (one position)
- Still works with drag-to-reorder

---

## 🎨 Color Picker

Click the color square to open a popup:

```
┌─────────────────────┐
│ [C1] [C2] [C3] ... │  (12 presets)
│ [Custom Color]      │  (any hex)
└─────────────────────┘
```

Presets include: Red, Teal, Blue, Orange, Green, Gray, Yellow, Purple, Light Blue, Salmon, Emerald, Orange

---

## ♻️ Rename Tier

1. Click tier name or click **[✏️]** icon
2. Input field appears with keyboard focus
3. Type new name
4. **Enter** = Save & close
5. **Escape** = Cancel
6. Click away = Save & close

Changes saved immediately to database.

---

## ⬆️⬇️ Reorder Tiers

Click **[↑]** to move tier up, **[↓]** to move tier down.

- Updates `tier.order` values
- UI re-sorts automatically
- First tier has **[↑]** disabled
- Last tier has **[↓]** disabled

---

## 📍 Drop an Item

**OLD**: Dropped items always went to end
**NEW**: Dropped items go to exact position

When you drag an item:

- **Drop on tier header** → Goes to end of tier
- **Drop on another item** → Inserts BEFORE that item
- **Drop on empty space** → Goes to end of tier
- **Drop on pool** → Goes to pool

---

## ⬅️➡️ Move Item Within Tier

**Method 1: Drag**

- Drag card left/right within tier
- Drop at new position

**Method 2: Click Buttons**

1. Hover over card
2. Move buttons appear below card
3. Click **[←]** to move left
4. Click **[→]** to move right

Both methods save immediately.

---

## 🗑️ Delete Tier

1. Click **[🗑️]** button on tier header
2. Confirmation dialog appears: "Delete tier 'X'? Items will move to unassigned."
3. **OK** → Tier deleted, items in pool
4. **Cancel** → Nothing happens

All items are preserved (never lost).

---

## 💾 When Does Data Save?

✅ **Instant**: All changes save immediately

- Rename tier
- Change color
- Move tier up/down
- Delete tier
- Reorder items (drag or click)
- Drop items

No "Save" button needed — everything is auto-saved.

---

## ⌨️ Keyboard Shortcuts

- **Enter** — Confirm rename
- **Escape** — Cancel rename
- **Tab** — Navigate between buttons

---

## 🎯 Position System

Each item has a `position` field (0, 1, 2, ...):

- Position 0 = first item in tier
- Position 1 = second item in tier
- Position 2 = third item in tier
- etc.

When you reorder:

1. All items get new positions
2. Position = index within tier
3. Saved to database

**Result**: Perfect, consistent ordering across sessions.

---

## 🔄 UI Flow Example

```
1. Drag "Attack on Titan" to S tier
   ✅ Saved as position 0 in S tier

2. Drag "Death Note" to position before AOT
   ✅ AOT → position 1
   ✅ Death Note → position 0

3. Hover AOT, click [→]
   ✅ AOT → position 1 again
   ✅ Death Note → position 0

4. Rename S tier to "GOATED"
   ✅ Color picker appears if you click color

5. Move S tier up (if not first)
   ✅ S tier swaps position with tier above

6. Click [🗑️] on S tier
   ✅ AOT & Death Note move to Unassigned pool
   ✅ Can drag them to another tier
```

---

## 🧪 Testing

Try these scenarios:

1. **Rename & Color**: Create tier, name it, pick color
2. **Reorder Tiers**: Move tier up/down multiple times
3. **Position Items**: Drop item between two items
4. **Move Items**: Use click buttons to shuffle order
5. **Delete Tier**: Delete tier and confirm items are in pool
6. **Refresh Page**: All data persists

---

## 🐛 Troubleshooting

**Q: Why doesn't drop work?**

- A: Make sure you're dropping inside the tier's drop zone

**Q: Can I undo?**

- A: Refresh page to see last saved state (instant save)

**Q: Where did my items go?**

- A: If tier deleted, they're in Unassigned pool at bottom

**Q: How do I sort items?**

- A: Drag them or hover & click [←] [→] buttons

---

## 📚 File Changes

Only file modified: `src/pages/TierMaker.tsx`

Key functions:

- `handleDragEnd()` — New drop position logic
- `TierRow` component — Complete rewrite with edit UI
- `SortableMediaCard` — Added position-based move buttons
- `UnassignedPool` — Added reorder support

No changes to database layer (it already supported this!).

---

## ✨ What's New

| Feature           | Before         | After                |
| ----------------- | -------------- | -------------------- |
| Edit tier name    | ❌             | ✅ Inline edit       |
| Change tier color | ❌             | ✅ Picker + presets  |
| Reorder tiers     | ❌             | ✅ Up/down buttons   |
| Delete tier       | ❌             | ✅ With confirmation |
| Position items    | ❌ Append only | ✅ Insert anywhere   |
| Move items        | ❌ Drag only   | ✅ Drag + buttons    |
| Data persistence  | ✅             | ✅ Enhanced          |

---

Enjoy your fully featured tier ranking system! 🎉
