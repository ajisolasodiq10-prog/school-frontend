# School Website (React + plain CSS)

A public website for a Nigerian secondary school. Built with React, React Router and plain CSS only. No Tailwind, no Redux, no backend.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # opens a local server; also reachable from your phone on the same Wi-Fi
npm run build    # creates the production site in /dist
npm run preview  # previews the production build
```

When hosting the built site, set the host to fall back to `index.html` for unknown paths (a "single-page app" rewrite), so links such as `/about` work on refresh.

## What to edit first

| Task | File |
| --- | --- |
| School name, address, phone, email, hours, social links | `src/config/siteConfig.js` |
| Navigation links | `src/config/siteConfig.js` (`navLinks`) |
| Portal links (when the portals exist) | `src/config/siteConfig.js` (`portals`, set `url`) |
| News (empty until you add items), programmes, "Why choose us" text | `src/config/content.js` |
| Colours and fonts | top of `src/styles/base.css` |

Anything in [square brackets] is placeholder text.

**The whole frontend is text-only.** There are no photos, logos, avatars, icons, SVG graphics, favicon or background images. The school name is shown as text, and buttons that used to be icons have text labels.

## Project structure

```
src/
  App.jsx            routes
  main.jsx           app entry
  config/            school details and page content
  components/        Navbar, Footer, Button, Card, Section, PageHeader, forms...
  pages/             Home, About, Academics, Admissions, News, Contact, PortalLogin
  styles/            base.css, components.css, pages.css
```

## Not included yet (by design)

- Dashboard data from the backend: login is real (see "Authentication"), but the dashboards have no data source yet, so they start empty
- Sending contact form messages. The form validates input only and says clearly that nothing is sent. Connect a backend in `handleSubmit` in `src/components/ContactForm.jsx`.
- Payments

## Student Portal

Open it from **Portal Login > Student Portal**, or go to `/student/login`.

**There is no sample data.** Login uses the backend (see "Authentication"); your name and ID come from the signed-in account. Everything else (class, timetable, results, materials, assignments) shows an empty state until `src/student-portal/services/studentService.js` is connected to backend endpoints.
- Result PINs cannot be checked yet (that needs the backend), so no PIN unlocks anything.
- Assignments cannot be submitted, profiles cannot be edited and passwords cannot be changed.

Pages: Login, Forgot password, Overview, My Results (and a result sheet per term), Academic History, Timetable, Learning Materials, Assignments, Announcements, My Profile, Logout.

### Where things live

```
src/student-portal/
  StudentPortalRoutes.jsx   all /student routes (loaded on demand)
  components/               layout, sidebar, cards, forms, states
  pages/                    one file per portal page
  context/                  shares student + locked/unlocked terms
  services/studentService.js   the only place pages get data from
  styles/portal.css         portal styles (classes start with "sp-")
```

### Connecting a backend later

1. Replace the functions in `services/studentService.js` with real requests.
2. Connect result PIN checking to the backend (`unlockTerm` in `context/StudentPortalContext.jsx`). Login and sessions are already real.
3. Remove the `InfoNotice` in `StudentLayout` once real data is flowing.


## Teacher Dashboard

Open it from **Portal Login > Teacher Portal**, or go to `/teacher/login`.

**No sample data. Nothing is sent to the school's records yet.** Your name, ID and email come from the signed-in account; classes, students and results start empty.
- Login uses the backend (see "Authentication").
- Results: teachers can save drafts and "submit for review". Submitting only changes the status shown in this browser. Approval, return and publishing are done by the Admin Dashboard.
- Changes (results, assignments, materials, profile edits) are kept in this browser's local storage so they survive a refresh. 
- Learning materials are links only. No files are uploaded.

Routes: `/teacher/login`, `/teacher/forgot-password`, `/teacher` (overview), `/teacher/classes`, `/teacher/classes/:classId`, `/teacher/students`, `/teacher/results/enter`, `/teacher/results/history`, `/teacher/results/history/:resultId`, `/teacher/assignments`, `/teacher/materials`, `/teacher/announcements`, `/teacher/profile`.

```
src/teacher-dashboard/
  TeacherRoutes.jsx          all /teacher routes (loaded on demand)
  config/scoreConfig.js      CA / exam maximums, grade bands, sessions, terms
  services/teacherService.js read-only data access (replace with real requests)
  context/                   shared state + local storage persistence
  utils/                     score validation, result workflow statuses
  components/, pages/, styles/
```

To change the scoring (for example CA out of 30 and exam out of 70), use **School Settings** in the Admin Dashboard (the Teacher Dashboard picks the change up after a page refresh), or edit the defaults in `src/config/schoolSettings.js`.

The dashboard reuses the Student Portal's shell styles (`student-portal/styles/portal.css`) and a few of its small components (avatar, empty/loading states, page title, auth layout), then adds its own styles on top.


## Admin Dashboard
Open it from **Portal Login > Admin Portal**, or go to `/admin/login`.

**There is no sample data: every list starts empty, and records you add are kept in this browser until the dashboard is connected to the backend. Login and route protection use the backend (see "Authentication").**
- There is **no public administrator registration**: in the live system the first administrator is set up through a controlled invitation or one-time setup code that a platform operator gives privately to an authorised school representative. That is handled by the backend.
- Records are kept in this browser's local storage (`adminData.v1.*`). "Clear saved data" on My Profile removes them. Your name, ID and email come from the signed-in account.
- Results follow Draft, Submitted for Review, then Approved or Returned for Correction, then Published. Drafts never appear for review, only Submitted results can be approved or returned (a reason of 10+ characters is required to return), and only Approved results can be published. Approve and publish ask for confirmation. These rules live in `src/admin-dashboard/utils/workflow.js`.
- Result PINs are issued and checked by the backend, so the PIN page only lists them. No payments are handled.
- Deactivating a teacher revokes access only. The record, allocations and results are kept. Teachers are never deleted.
- Changing the current term never changes results. Only one session and term is current at a time.
- The audit log is read-only; real tamper-resistant logging needs a backend.

Routes: `/admin/login`, `/admin/forgot-password`, `/admin` (overview), `/admin/students`, `/admin/students/:studentId`, `/admin/teachers`, `/admin/teachers/:teacherId`, `/admin/classes`, `/admin/classes/:classId`, `/admin/subjects`, `/admin/sessions`, `/admin/results`, `/admin/results/:resultId`, `/admin/pins`, `/admin/announcements`, `/admin/calendar`, `/admin/accounts`, `/admin/audit`, `/admin/settings`, `/admin/profile`.

Data shared between the dashboards through local storage:
- `teacherData.v1.results`: results the teacher submits, which the admin reviews. Approve, return and publish update them, so the teacher sees the new status.
- `adminData.v1.announcements`: announcements the admin publishes (audience Everyone, All students or All teachers, on or after the publication date) appear in the Student and Teacher announcements pages. Class-specific announcements are stored but not shown in those views.
- `schoolSettings.v2`: score maximums (which must add up to 100) and grade boundaries (validated so they cannot overlap).

```
src/admin-dashboard/
  AdminRoutes.jsx            all /admin routes (loaded on demand)
  config/                    sidebar items, form lists
  context/                   shared state, local storage, audit logging
  utils/                     workflow rules, scoring, ids, dates
  components/, pages/, styles/admin.css   (admin CSS classes start with ad-)
```


## Authentication (two backends)
Sign-in is handled by the **Account Management Backend** (`VITE_ACCOUNT_API_BASE_URL`): `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout`. The **School Backend** (`VITE_API_BASE_URL`) accepts the resulting access token as a Bearer token and answers `GET /api/auth/me` with the school-side user and profile. The dashboards' data is **not** connected yet.

Setup: copy `.env.example` to `.env`. Set `VITE_API_BASE_URL` (for example `http://localhost:5000`) and `VITE_ACCOUNT_API_BASE_URL` (for example `http://localhost:5100`; `/api/v1` is added automatically if missing). Set `VITE_SCHOOL_CODE` to your school's code, or leave it empty for a single-school installation. Each backend must allow this site's origin in CORS.

- **API client:** `src/api/client.js` (native fetch; `get`, `post`, `patch`, `put`, `del`). It adds the Bearer token, turns every failure into an `ApiError` with a safe message (server errors never show details), and tells the auth context when the backend ends the session. Nothing sensitive is logged.
- **Auth state:** `src/auth/AuthContext.jsx` (`useAuth()`: `login`, `logout`, `user`, `role`, `isAuthenticated`, `hasRole`). `ProtectedRoute` guards each dashboard by role; `LoginGate` sends an already signed-in user to their dashboard. The backend is the real security authority; the frontend guard is for navigation only.
- **Roles:** admins see only `/admin`, teachers only `/teacher`, students only `/student`. Parents (and any other role) get an "Access not allowed" page. A correct password on the wrong portal is rejected and the new token is revoked.
- **Token storage:** the token and its expiry time are kept in `sessionStorage` (copied from memory), so a refresh keeps you signed in and closing the tab or browser signs you out. The access token is renewed automatically with the rotating refresh token. Passwords are never stored and nothing goes into `localStorage`. After a refresh the app asks `GET /api/auth/me` who the token belongs to.
- **Logout:** the device is signed out immediately, then the Account Management Backend is asked to end the session (`/auth/logout` with the refresh token). If the network fails you still end up signed out and are told the server session will expire by itself.
- **Expired, revoked or invalid tokens, and deactivated accounts:** the user is signed out and sent to the login page with an explanation.

## No sample data

The site ships with no fictional records. Earlier builds saved sample data in the browser; the app removes it automatically on load (`src/config/legacyData.js`). The only placeholders left are the bracketed school details (name, address, phone) in `src/config/siteConfig.js`, which you must fill in, and the general wording on the public pages in `src/config/content.js`. News and events are empty until you add items to `news` in that file.
