# NANC Language Equity Survey

A bilingual (English / नेपाली) community needs survey for the Nepali Association of Northern California,
funded by Contra Costa County.

- `app/index.html`: the public survey. Plain HTML, CSS and JavaScript with no build step, mobile-first, and works offline.
- `app/staff.html`: the staff portal, with sign-in and pages for Data Reviewers, Program Managers and Admins.
- `app/survey-data.js`: the full questionnaire in both languages. Edit wording here.
- `db/schema.sql`: Supabase database: tables, roles and permissions. Safe to run again after changes.
- `docs/DESIGN.md`: architecture, dashboard, hosting and timeline.
- `docs/questionnaire-notes.md`: how the app differs from the v7 PDF, and open questions.

## Try it

Open `app/index.html` in a browser. With no server configured it runs in **test mode**:
responses are saved in that browser and can be downloaded from the start page.

To test offline mode and phone layout from another device, serve the folder:

```
cd app
python -m http.server 8080
```

Then open `http://<your-computer-ip>:8080` on a phone on the same Wi-Fi.

## Go live

1. Create a Supabase project in a US region and run `db/schema.sql` in its SQL editor.
2. Put the project URL and anon key in `app/config.js`.
3. Deploy the `app/` folder. GitHub Pages is set up already: in the repo go to Settings > Pages and set Source to "GitHub Actions". Every push to `main` that changes `app/` then publishes it to `https://<user>.github.io/language-equity-survey/`. Any static host (Netlify, Vercel, Azure Static Web Apps) also works.
4. Add reviewers in Supabase Auth, then insert a row into `staff` with their role.

## Staff portal

Open `staff.html` on the same site, for example `https://<user>.github.io/language-equity-survey/staff.html`.
There is also a "Staff sign in" link at the bottom of the survey start page.

| Page | Data Reviewer | Program Manager | Admin |
|---|:-:|:-:|:-:|
| Survey dashboard: charts for every question, with filters | ✓ | ✓ | ✓ |
| Responses list and single-response view | De-identified | Full | Full |
| Export CSV: responses, codebook, summary tables | De-identified | Full | Full |
| Focus groups and translations | Read only | Edit | Edit |
| Program dashboard: progress to target, volunteers, coverage, data quality | | ✓ | ✓ |
| Exclude or include a response | | ✓ | ✓ |
| Users & roles, names (restricted), settings, audit log, deleting data | | | ✓ |

"De-identified" means free-text "Other" answers and volunteer names are removed by the database itself,
and the mental health and safety section appears only as totals.
When a dashboard filter narrows results to fewer than 5 people, results are hidden.

### One-time setup

1. Run `db/schema.sql` again in the Supabase SQL Editor. It upgrades the existing tables and keeps existing responses.
2. In Supabase, go to **Authentication > URL Configuration**. Set **Site URL** to the staff page address,
   and add the same address under **Redirect URLs**. Sign-in links and password resets return there.
3. Open `staff.html`, choose **Request access**, and confirm your email.
4. Make yourself the first admin in the SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.org';
   ```

5. From then on, other staff choose **Request access**, and an admin approves them on **Users & roles**.
