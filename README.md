# Smart Lead CRM

A responsive browser-based CRM demo built with plain HTML, CSS and JavaScript. No React, Node.js, Express or database server is required.

## Features
- Register, login, logout and demo password reset
- Lead create, edit, delete, search, filters and sorting
- Duplicate email checks and CSV import/export
- Sales pipeline board with drag-and-drop and status selector
- Follow-up list with overdue/today/upcoming indicators
- Rule-based lead scoring and lead-health monitor
- Dashboard metrics, sales analytics and CSV report export
- Dark mode and responsive mobile navigation
- Browser-local storage, separated by logged-in demo account

## Run in VS Code
1. Extract the ZIP file.
2. Open the `Smart-Lead-CRM` folder in VS Code.
3. Install/enable the **Live Server** extension if you do not have one.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Register an account, then sign in. A set of sample leads is created for a new account.
6. Explore Leads, Sales Pipeline, Follow-ups and Analytics from the sidebar.

Opening `index.html` directly may work in many browsers, but Live Server is recommended for consistent behaviour.

## CSV import format
Use a header row with columns such as:

`name,email,phone,company,source,status,priority,value,followup,notes`

Required fields: `name`, `email`. Valid statuses are New, Contacted, Qualified, Proposal, Negotiation, Won and Lost. Valid priorities are Hot, Warm and Cold. Dates should use `YYYY-MM-DD`.

## Important security limitations
This is a frontend-only educational/demo project. Browser `localStorage` is not a secure database. Users can inspect or modify local data, and it does not sync across devices or browsers. The demo password reset is not verified by email. Client-side password hashing does not provide production-grade authentication. Do not store real customer or sensitive data here. A production application needs a backend, server-side password hashing, secure sessions, authorization, and a proper password-recovery flow.

## Project structure
- `index.html`, `register.html`, `forgot-password.html`: authentication pages
- `dashboard.html`: dashboard overview
- `leads.html`: lead CRUD and CSV import/export
- `pipeline.html`: sales pipeline board
- `followups.html`: follow-up tracking
- `analytics.html`: analytics and CSV report
- `css/style.css`: shared responsive design
- `js/storage.js`: browser storage and sample data
- `js/auth.js`: demo authentication
- `js/common.js`: shared UI helpers and rules
- `js/dashboard.js`, `js/leads.js`, `js/pipeline.js`, `js/followups.js`, `js/analytics.js`: page logic
