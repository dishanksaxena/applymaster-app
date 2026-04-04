# Phase 2 Setup Instructions

## Step 1: Update Supabase Database Schema

### Add Position Column for Kanban Drag-and-Drop

**Important**: Run this migration in your Supabase database before deploying Phase 2.

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your ApplyMaster project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/add_position_to_applications.sql`
6. Click **Run**

**What this does:**
- Adds `position INTEGER DEFAULT 0` column to applications table
- Creates index for efficient querying: `(user_id, status, position)`
- Sets initial positions based on creation date (auto-ordering)

**Expected output:**
```
total_applications: X
applications_with_position: X
```

Both should be equal (all applications now have a position).

---

## Phase 2 Features

### 1. Cover Letter Editor ✏️
**Location**: `/src/app/(dashboard)/cover-letters/page.tsx`
- Split-screen editor + live preview
- Real-time regeneration with different tones
- Server-side PDF export
- Auto-save drafts

**API Endpoints**:
- POST `/api/generate-cover-letter` - Existing (unchanged)
- POST `/api/cover-letters/export-pdf` - NEW (server-side PDF)

---

### 2. Kanban Drag-and-Drop 🎯
**Location**: `/src/app/(dashboard)/applications/page.tsx`
- Drag cards between status columns
- Drag cards within column to reorder
- Position tracking in database
- Smooth animations with confirmation dialogs

**Database Changes**:
- New column: `applications.position`
- New API calls: `updateStatus()`, `updatePosition()`

---

### 3. Auto-Apply Dashboard 📊
**Location**: `/src/app/(dashboard)/auto-apply/page.tsx`
- Analytics cards: Today | This Week | This Month
- 3 custom SVG charts (bar, line, donut)
- Real-time activity feed (Supabase subscription)
- Performance recommendations

**New Components**:
- `ApplicationSourceChart.tsx`
- `TrendLineChart.tsx`
- `SuccessDonutChart.tsx`
- `ActivityFeed.tsx`

---

## Deployment Checklist

- [ ] Run database migration in Supabase
- [ ] Build Cover Letter Editor components
- [ ] Build Kanban drag-drop logic
- [ ] Build Auto-Apply Dashboard + charts
- [ ] Test all features end-to-end
- [ ] Deploy to Vercel: `git push origin master`

---

## Verification Commands

```bash
# Test locally
npm run dev

# Check for TypeScript errors
npm run type-check

# Build for production
npm run build
```

**Test in browser:**
1. Cover Letters: Edit, preview, regenerate, export PDF
2. Applications: Drag between columns and within columns
3. Auto-Apply Dashboard: Check charts and real-time activity
