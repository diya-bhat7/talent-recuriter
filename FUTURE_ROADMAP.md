# Straatix — Future Implementation Roadmap
> Last updated: Feb 17, 2026

## ✅ Completed (Sprint 1)
- [x] **Pass/Reject on Hiring Dashboard** — `HiringManagerDashboard.tsx` now updates candidate status
- [x] **Real-Time Notifications** — Wired across candidate status, interviews, team management + real-time bell
- [x] **Route Protection** — `ProtectedRoute` on all 11 auth routes
- [x] **Auth Race Condition** — Fixed `useAuth` loading state
- [x] **Dead Code Cleanup** — Removed unused edge functions, scripts, console.logs
- [x] **RLS Verified** — All tables confirmed protected

---

## 🔴 High Priority — Next Up

### 3. Email Integration (Resend)
Send credentials to new team members, interview confirmations, status notifications.
- **Effort:** ~1 hr per email type | **Impact:** High
- **Prereqs:** Sign up at [resend.com](https://resend.com), add `RESEND_API_KEY` to Supabase Secrets
- **Plan:** See `supabase/passwordpla.txt`

### 4. Analytics / Reporting Dashboard
Add `/analytics` page with:
- Pipeline funnel (new → screening → interview → offer → hired)
- Time-to-hire (avg days from application to offer)
- Source tracking
- Hiring velocity (offers/month trend)
- **Tech:** `recharts` or `chart.js`
- **Effort:** ~4 hrs | **Impact:** Very high

### 5. Candidate Kanban Board
Drag-and-drop board view (Trello-style). Columns = pipeline stages.
- **Tech:** `@dnd-kit/core`
- **Effort:** ~3 hrs | **Impact:** High

---

## 🟡 Medium Priority

### 6. Email Templates Editor
WYSIWYG editor for admins to customize email templates (invite, confirmation, rejection). Store in Supabase.
- **Effort:** ~4 hrs | **Impact:** Medium

### 7. Bulk Actions on Candidates
Select multiple → bulk status change, reject, email, export.
- **Effort:** ~2 hrs | **Impact:** Medium

### 8. Interview Scheduling with Calendar Integration
- Google Calendar / Outlook API integration
- Auto-create events, send `.ics` calendar invites
- **Effort:** ~6 hrs | **Impact:** High

### 10. Candidate Search & Filters
Global search (name, email, skills, position). Advanced filters: status, date range, score range.
- **Effort:** ~2 hrs | **Impact:** Medium

---

## 🟢 Lower Priority — Polish & UX

### 9. Dark Mode Toggle
`useTheme.tsx` hook exists. Wire toggle in header/sidebar.
- **Effort:** ~1 hr | **Impact:** Low

### 11. Onboarding Tour
First-time walkthrough using `react-joyride`.
- **Effort:** ~2 hrs | **Impact:** Medium

### 12. Candidate Portal (Public)
Public page for candidates: check status, upload docs, confirm interview times.
- **Effort:** ~6 hrs | **Impact:** Medium

### 13. API Rate Limiting & Error Retry
Exponential backoff for Supabase calls, rate-limit edge functions.
- **Effort:** ~1 hr | **Impact:** Low

---

## 📊 Suggested Sprint Plan

| Sprint | Features | Effort |
|---|---|---|
| **Sprint 2** | #4 Analytics, #5 Kanban Board | ~7 hrs |
| **Sprint 3** | #3 Email, #7 Bulk Actions, #10 Search | ~5 hrs |
| **Sprint 4** | #8 Calendar, #6 Email Templates | ~10 hrs |
| **Sprint 5** | #9 Dark Mode, #11 Onboarding, #12 Portal | ~9 hrs |
