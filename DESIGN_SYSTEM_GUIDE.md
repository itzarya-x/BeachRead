# 🎨 YURA DESIGN SYSTEM - DEVELOPER GUIDE

## Quick Start

Import the design system in your components:

```typescript
import ds from "@/styles/design-system";
```

---

## 🎨 Colors

### Signature Accent (Use Sparingly!)
```typescript
// Primary accent - professional blue
ds.accent.primary          // hsl(199, 89%, 58%)
ds.accent.primaryHover     // Hover state (52% lightness)
ds.accent.primaryMuted     // 10% opacity background
ds.accent.primaryBorder    // 20% opacity border
```

**Use for:**
- Active navigation items
- Selected tier badges
- Progress bars
- Primary CTAs
- Important highlights

**Don't use for:**
- Every button
- All text
- Backgrounds everywhere

### Surfaces
```typescript
ds.surface.base       // Background (7%)
ds.surface.elevated1  // Cards (10%)
ds.surface.elevated2  // Modals (13%)
ds.surface.elevated3  // Popovers (16%)
```

---

## 📐 Shape Language

### Border Radius
```typescript
ds.radius.sm    // 8px - badges, small elements
ds.radius.md    // 12px - cards, buttons (DEFAULT)
ds.radius.lg    // 16px - panels, modals
ds.radius.xl    // 24px - hero sections
ds.radius.full  // 9999px - pills, avatars
```

### Shadows
```typescript
ds.shadow.sm    // Subtle elevation
ds.shadow.md    // Card elevation
ds.shadow.lg    // Modal elevation
ds.shadow.xl    // Maximum elevation
ds.shadow.glow  // Accent glow effect
```

**Example:**
```tsx
<div style={{ 
  borderRadius: ds.radius.md,
  boxShadow: ds.shadow.md 
}}>
  Card content
</div>
```

---

## ✍️ Typography

### Hierarchy
```typescript
ds.typography.display  // 56px, weight 800 - Hero titles
ds.typography.h1       // 40px, weight 700 - Page titles
ds.typography.h2       // 30px, weight 600 - Section headers
ds.typography.h3       // 20px, weight 600 - Card titles
ds.typography.body     // 16px, weight 400 - Body text
ds.typography.meta     // 14px, weight 500 - Metadata
ds.typography.micro    // 12px, weight 500 - Tiny text
```

### Usage
```tsx
// Page title
<h1 style={{ 
  fontSize: ds.typography.h1.size,
  fontWeight: ds.typography.h1.weight,
  lineHeight: ds.typography.h1.lineHeight 
}}>
  Welcome to Yura
</h1>

// Or use Tailwind classes
<h1 className="text-4xl font-bold">Welcome to Yura</h1>
```

---

## 🎬 Motion

### Durations
```typescript
ds.motion.duration.instant  // 100ms - Immediate feedback
ds.motion.duration.fast     // 150ms - Quick interactions
ds.motion.duration.normal   // 200ms - Standard transitions
ds.motion.duration.slow     // 300ms - Panel changes
ds.motion.duration.page     // 400ms - Page transitions
```

### Easing
```typescript
ds.motion.easing.default  // Smooth in-out
ds.motion.easing.enter    // Ease out (entering)
ds.motion.easing.exit     // Ease in (exiting)
```

### Scale & Translate
```typescript
ds.motion.scale.hover     // 1.02 - Subtle lift
ds.motion.scale.active    // 0.98 - Press feedback
ds.motion.translate.hover // -2px - Lift distance
ds.motion.translate.enter // 20px - Entry distance
```

### Framer Motion Presets
```typescript
// Card entry animation
<motion.div {...ds.animations.cardEntry}>
  Card content
</motion.div>

// Hover effect
<motion.div whileHover={ds.animations.hover}>
  Hoverable content
</motion.div>

// Page transition
<motion.div {...ds.animations.pageTransition}>
  Page content
</motion.div>

// Pulse effect (for state changes)
<motion.div animate={ds.animations.pulse}>
  Updated content
</motion.div>
```

---

## 📏 Spacing

### Vertical Rhythm
```typescript
ds.spacing.section   // 4rem - Between major sections
ds.spacing.block     // 2rem - Between content blocks
ds.spacing.group     // 1rem - Between related items
ds.spacing.inline    // 0.5rem - Between inline elements
```

**Example:**
```tsx
<div className="space-y-16">  {/* section spacing */}
  <div className="space-y-8">  {/* block spacing */}
    <div className="space-y-4">  {/* group spacing */}
      <div className="flex gap-2">  {/* inline spacing */}
        <button>Action 1</button>
        <button>Action 2</button>
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 Status Colors

```typescript
ds.status.success   // Green - Success states
ds.status.error     // Red - Error states
ds.status.warning   // Orange - Warning states
ds.status.info      // Blue - Info states
ds.status.syncing   // Primary - Syncing state
ds.status.offline   // Gray - Offline state
```

---

## 🧩 Component Usage

### Buttons
```tsx
import { Button, IconButton } from "@/components/ui/YuraButton";
import { Plus, Save } from "lucide-react";

// Primary button
<Button variant="primary" size="md" icon={Plus}>
  Create New
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>

// Icon button
<IconButton icon={Save} variant="ghost" label="Save" />
```

### Empty States
```tsx
import { EmptyTierList, EmptyAnimeList } from "@/components/ui/EmptyState";

// Preset empty state
<EmptyTierList onCreate={handleCreate} />

// Custom empty state
<EmptyState
  icon={Search}
  title="No Results"
  description="Try adjusting your filters"
  action={{
    label: "Clear Filters",
    onClick: handleClear
  }}
/>
```

### Skeletons
```tsx
import { 
  MediaCardSkeleton, 
  GridSkeleton,
  TableSkeleton 
} from "@/components/ui/Skeleton";

// Single skeleton
<MediaCardSkeleton />

// Grid of skeletons
<GridSkeleton count={12} type="card" />

// Table skeleton
<TableSkeleton rows={5} />
```

### Status Indicators
```tsx
import { 
  StatusIndicator, 
  ConnectionStatus,
  ProgressIndicator 
} from "@/components/ui/StatusIndicator";

// System status
<StatusIndicator status="saving" message="Saving changes..." />

// Connection badge
<ConnectionStatus isOnline={true} isSynced={false} />

// Progress bar
<ProgressIndicator progress={75} label="Uploading..." />
```

### Toasts
```tsx
import { useToast } from "@/components/ui/ToastNotification";

function MyComponent() {
  const { showToast } = useToast();
  
  const handleSave = () => {
    // ... save logic
    showToast("Saved successfully!", "success");
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

---

## 🎨 Tailwind Utilities

### Custom Classes
```css
/* Typography */
.text-display      /* Display text (56px, bold) */
.text-heading      /* Heading text (30px, bold) */
.text-subheading   /* Subheading (20px, semibold) */
.text-body         /* Body text (16px, normal) */
.text-caption      /* Caption (12px, medium) */

/* Spacing */
.space-section     /* Section spacing (y-8 md:y-12) */
.space-subsection  /* Subsection spacing (y-4 md:y-6) */
.space-item        /* Item spacing (y-2 md:y-3) */

/* Padding */
.p-section         /* Section padding (p-4 md:p-6 lg:p-8) */
.p-card            /* Card padding (p-4 md:p-5) */

/* Effects */
.glass             /* Glass morphism */
.glass-strong      /* Strong glass effect */
.glow-primary      /* Primary glow */
.media-card        /* Media card with hover */
```

---

## ✅ Best Practices

### DO ✅
- Use the signature accent **sparingly** (5-10% of UI)
- Apply typography hierarchy **consistently**
- Use skeleton loaders for **all loading states**
- Provide empty states with **clear CTAs**
- Keep animations **fast and confident** (150-300ms)
- Use **minimal borders** (30-40% opacity)
- Follow **vertical rhythm** for spacing
- Use **YuraButton** for all buttons

### DON'T ❌
- Don't use accent color everywhere
- Don't mix font families randomly
- Don't use spinners instead of skeletons
- Don't leave empty states blank
- Don't use bounce or elastic animations
- Don't use heavy borders
- Don't use random spacing values
- Don't create custom button styles

---

## 🎯 Quick Reference

### Common Patterns

**Card Component:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4, scale: 1.02 }}
  className="bg-card rounded-xl p-6 ring-1 ring-border/10 hover:ring-primary/50 transition-shadow"
>
  Card content
</motion.div>
```

**Section Header:**
```tsx
<div className="space-y-2 mb-8">
  <h2 className="text-2xl font-bold">Section Title</h2>
  <p className="text-muted-foreground">Section description</p>
</div>
```

**Loading State:**
```tsx
{loading ? (
  <GridSkeleton count={12} type="card" />
) : items.length === 0 ? (
  <EmptyAnimeList onImport={handleImport} />
) : (
  <div className="grid grid-cols-6 gap-4">
    {items.map(item => <MediaCard key={item.id} media={item} />)}
  </div>
)}
```

---

## 📚 Resources

- **Design System**: `src/styles/design-system.ts`
- **Components**: `src/components/ui/`
- **Examples**: See `src/pages/Index.tsx`, `src/pages/TierList.tsx`
- **Documentation**: `TRANSFORMATION_SUMMARY.md`

---

**Questions?** Check the design system file or existing component implementations for examples.
