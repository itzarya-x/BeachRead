# Guest Experience - Quick Reference

## Phase 5 Implementation Summary

### ✅ What's Implemented

**1. Empty Vault for Guests**

- When not authenticated, app shows empty arrays
- No IndexedDB fallback (enforced)
- Load effect detects guest mode immediately

**2. Guest UI Components**

- `GuestExperience`: Shows "Your vault is empty. Sign in..."
- `StorageModeIndicator`: Shows "☁️ Cloud" or "👤 Guest"
- `LoginRequiredDialog`: Prompt when guests try mutations

**3. CRUD Blocking**

- `addEntry()`: Throws error if guest
- `updateEntry()`: Throws error if guest
- `deleteEntry()`: Throws error if guest

**4. Auto-Refresh**

- DataContext re-runs on auth change
- Data loads/clears automatically

---

### 🎯 Key Changes

| File                                | Change                                        | Impact                       |
| ----------------------------------- | --------------------------------------------- | ---------------------------- |
| `src/context/DataContext.tsx`       | Load effect detects guest mode, returns empty | Shows empty vault for guests |
| `src/context/DataContext.tsx`       | CRUD ops throw if `storageMode === "local"`   | Prevents mutations           |
| `src/components/guest-experience/*` | 3 new components                              | UI for guest experience      |

---

### 📝 Usage Examples

**Show empty vault (in page component)**:

```tsx
import { GuestExperience } from "@/components/guest-experience";

if (!authUser) return <GuestExperience />;
```

**Add login prompt to button**:

```tsx
import { useLoginRequired } from "@/components/guest-experience";

const [loginDialog, handleMissingAuth] = useLoginRequired();

const handleClick = () => {
    if (!authUser) {
        handleMissingAuth("perform this action");
        return;
    }
    // proceed...
};

return <>{loginDialog}</>;
```

**Show storage mode (in header)**:

```tsx
import { StorageModeIndicator } from "@/components/guest-experience";

<StorageModeIndicator variant="badge" />;
```

---

### 🧪 Quick Test

1. **Open logged out**: ✅ Should show empty vault UI
2. **Navigate pages**: ✅ All show empty states
3. **Try to add entry**: ✅ Should see login prompt
4. **Sign in**: ✅ Data should load from Supabase
5. **Sign out**: ✅ Should reset to empty vault

---

### 🔍 Dev Console Logs

**Guest mode**:

```
✨ Guest experience: showing empty vault
📊 Guest Mode 👤
💾 Storage Mode: local (guest access)
```

**Cloud mode (after login)**:

```
📊 Cloud Mode ☁️
💾 Storage Mode: cloud (authenticated)
```

---

### 📦 Export Paths

```typescript
// All components from one place
import {
    GuestExperience,
    StorageModeIndicator,
    LoginRequiredDialog,
    useLoginRequired,
} from "@/components/guest-experience";
```

---

### ⚡ Build Status

✅ **0 TypeScript errors**
✅ **Builds successfully**
✅ **All imports working**

---

**Phase 5 Complete** 🎉
