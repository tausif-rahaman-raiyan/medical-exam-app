# Integrated Chapter Box Configuration & Leaderboard Metric Cleanup

Integrate the auto-detected exam title, 100/50 MCQ toggle, and auto-calculated duration directly inside the chapter selection card header in Custom MCQ Creator, and remove score calculation suffixes (`+1` and `-0.25 Neg`) from Merit Board.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed through interactive clarification and define the exact scope:

- **Confirmed Decision 1 (Integrated Chapter Header)**: Remove the separate floating configuration box. Integrate the auto-detected exam title (`স্বয়ংক্রিয় পরীক্ষার নাম`) directly into the header of the "১১৪ টি এক্সাম থেকে চ্যাপ্টার নির্বাচন করুন" box.
- **Confirmed Decision 2 (Segmented 100 vs 50 MCQ Toggle)**: Add a 2-button segmented toggle:
  - **100 MCQs (50 Mins)**: Duration auto-calculated to 50 minutes (30s per MCQ).
  - **50 MCQs (25 Mins)**: Duration auto-calculated to 25 minutes (30s per MCQ).
- **Confirmed Decision 3 (Leaderboard Clean Labels)**:
  - Change `Correct (+1)` to **`Correct`**.
  - Change `Wrong (-0.25 Neg)` to **`Wrong`**.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Consolidates exam configuration controls into a single unified card in `CustomMcqCreator`, removing redundant boxes and vertical sprawl.
  2. Offers candidates a flexible choice between a full 100-question model test (50 mins) and a rapid 50-question mock test (25 mins).
  3. Streamlines Merit Board metrics into clean, professional labels without repetitive formula annotations.
- **Target Audience**: Students taking customized medical practice exams with clear, distraction-free UI.

---

## 2. User Experience & Visual Design

### Unified Chapter Selection Box Header

```
┌────────────────────────────────────────────────────────────────────────┐
│  ১১৪ টি এক্সাম থেকে চ্যাপ্টার নির্বাচন করুন                                     │
│  🏷️ স্বয়ংক্রিয় পরীক্ষার নাম: উদ্ভিদবিজ্ঞান + রসায়ন ১ম পত্র Blend Test         │
│                                                                        │
│  [ 100 MCQs (50 Min) ]  [ 50 MCQs (25 Min) ]    [ Select All 114 ]     │
│  ⏱️ 30s per MCQ Rule                             [ 12 Sets Selected ]  │
├────────────────────────────────────────────────────────────────────────┤
│  ▼ Botany (উদ্ভিদবিজ্ঞান) - 14 Chapters Available                       │
│  ▼ Zoology (প্রাণিবিজ্ঞান) - 12 Chapters Available                      │
│  ...                                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Merit Board Metric Clean Labels

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ✅ Correct       │ │ ❌ Wrong        │ │ 🎯 Accuracy Rate│ │ ✨ Final Marks  │
│ 72              │ │ 8               │ │ 90%             │ │ 70 / 100        │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 3. Technical Architecture & Component Mapping

### File Modifications

1. **`src/components/CustomMcqCreator.tsx`**:
   - State: `const [qCount, setQCount] = useState<100 | 50>(100);`
   - Duration computation: `const duration = qCount === 100 ? 50 : 25;`
   - Remove the separate `Main Configurations Box: Auto Title & 100 MCQs Target` div.
   - Inside `{activeMode === 'blend'}`:
     - Expand the header to show:
       1. Section title & auto-detected exam title banner.
       2. Segmented toggle button group (`100 MCQs (50 Min)` / `50 MCQs (25 Min)`).
       3. Auto-calculated timing chip (`30s per MCQ`).
       4. `Select All 114` button & selected sets counter.
   - In `handleLaunchExam`: pass selected `qCount` and `duration` (50 or 25) to `customExam`.

2. **`src/components/LeaderboardModal.tsx`**:
   - Replace `<CheckCircle2 /> Correct (+1)` with `<CheckCircle2 /> Correct`.
   - Replace `<XCircle /> Wrong (-0.25 Neg)` with `<XCircle /> Wrong`.

---

## Verification Plan

1. **Compilation & Type Check**: Run `compile_applet` and `lint_applet` together to verify 0 errors.
2. **Custom MCQ Creator Verification**:
   - Confirm there is NO separate configuration box above the chapter selector.
   - In the chapter box header, toggle between `100 MCQs (50 Min)` and `50 MCQs (25 Min)`.
   - Verify selecting chapters updates the auto-detected title live.
   - Start an exam with 50 MCQs and verify the timer starts at 25:00.
   - Start an exam with 100 MCQs and verify the timer starts at 50:00.
3. **Leaderboard Modal Verification**:
   - Open Merit Board and verify the cards display `Correct` and `Wrong` without formula text.
