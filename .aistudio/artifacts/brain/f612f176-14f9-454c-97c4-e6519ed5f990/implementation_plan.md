# Netlify Deploy Fix, Real-Time Database Sync & Global Merit Board

Fix the Netlify deployment directory mismatch, implement true real-time Firestore database synchronization on leaderboard refresh (disabling fallback to stale local data when database records are empty), and display all candidates in Global Leaderboard ranked by highest score with Google profile pictures.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed through interactive clarification and define the exact scope:

- **Confirmed Decision 1 (Netlify Output Directory & Configuration)**:
  - In `vite.config.ts`: set `outDir: 'dist'` and `publicDir: 'public'` so Vite builds directly to the standard `dist` folder.
  - Create `netlify.toml` configuring `publish = "dist"` and an SPA redirect rule (`/* -> /index.html 200`) so direct URLs and page refreshes work smoothly.
- **Confirmed Decision 2 (Real-Time Firestore Database Refresh)**:
  - When the user clicks the "Refresh" button in `LeaderboardModal`:
    - Perform a live query to the Firestore `exam_results` collection.
    - If no records exist in the database, **do NOT fall back to stale or previously stored local data**; update the state to reflect zero records from the cloud.
    - If records exist, replace the local state with the exact cloud records.
- **Confirmed Decision 3 (Global Leaderboard & Profile Pictures)**:
  - Global Leaderboard displays all records from Firestore sorted by **highest score first (Merit Ranking)**.
  - Render each candidate's Google profile picture avatar (`photoURL`) next to their verified name, with a fallback initial badge if no picture is set.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Resolves the Netlify build error (`Deploy directory 'dist' does not exist`) by aligning Vite output and Netlify publish paths.
  2. Transforms the Merit Board into a live, authoritative real-time leaderboard directly backed by Firestore `hazera-taju-degree-college` database.
  3. Displays actual candidate avatars and merit rankings based on competitive exam scores.
- **Target Audience**: All medical admission candidates competing on the live portal.
- **Key Value**: Reliable Netlify deployments, authentic database-authoritative score tracking, and visual candidate recognition with Google avatars.

---

## 2. User Experience & Visual Design

### Netlify Deployment Pipeline

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  npm run build  │ ───►  │  Vite Build     │ ───►  │  netlify.toml   │
│  (Vite 8)       │       │  outDir: "dist" │       │  publish: "dist"│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Real-Time Leaderboard Card with Google Profile Avatar

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Attempt #1 (১ম)]  [ 👤 Avatar  Tausif Rahaman (Raiyan)  ✓ ]  [Botany]  │
│ #1020325015 · 05/11/2026 10:45 AM                                      │
├────────────────────────────────────────────────────────────────────────┤
│ সেশন: ২০২৪-২৫  কোষ ও এর গঠন                                            │
│                                           NET SCORE                    │
│                                           95.5 / 100                   │
├────────────────────────────────────────────────────────────────────────┤
│ [ ✅ Correct: 97 ]  [ ❌ Wrong: 6 ]  [ 🎯 Accuracy: 94% ]  [ ✨ 95.5 ]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture & Component Mapping

### File Modifications

1. **`vite.config.ts`**:
   - Change `publicDir: 'public'` and `build: { outDir: 'dist', emptyOutDir: true }`.
2. **`netlify.toml`**:
   - Create root `netlify.toml` with:
     ```toml
     [build]
       command = "npm run build"
       publish = "dist"

     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```
3. **`src/types/exam.ts`**:
   - Add `photoURL?: string;` to `ExamResult` interface.
4. **`src/context/AuthContext.tsx`**:
   - Export `syncDatabaseResults: () => Promise<void>`.
   - In `saveExamResult`: save `photoURL: user.photoURL || ''` along with the result to Firestore.
   - In `syncDatabaseResults`:
     - Query Firestore `collection(db, 'exam_results')`.
     - If empty: set `examHistory = []` and `globalHistory = []` (no local fallback).
     - If not empty: map docs and update `globalHistory` and `examHistory`.
5. **`src/components/LeaderboardModal.tsx`**:
   - Call `syncDatabaseResults()` on initial mount and when "Refresh" is clicked.
   - In Global Leaderboard view, sort results by `score` descending (highest score first).
   - Beside candidate name, display `<img src={res.photoURL} />` if available, or initial avatar.

---

## Verification Plan

1. **Build & Lint Verification**:
   - Run `compile_applet` and `lint_applet` together to verify 0 errors.
   - Run `npm run build` to verify `dist/` is produced with `index.html` and assets.
2. **Netlify Config Verification**:
   - Verify `netlify.toml` points to `dist`.
3. **Live Database Sync Verification**:
   - Test clicking Refresh in LeaderboardModal to verify real-time Firestore query execution.
   - Verify candidate cards show user profile pictures.
   - Verify Global Leaderboard sorts candidates by highest score.
