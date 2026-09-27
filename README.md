# NANC Language Equity Survey

A bilingual (English / नेपाली) community needs survey for the Nepali Association of Northern California,
funded by Contra Costa County.

- `app/index.html` and the other public pages (`about`, `activities`, `timeline`, `resources`, `get-involved`, `contact`): the bilingual project website. Contact details live at the top of `app/site.js`.
- `app/survey.html`: the public survey. Plain HTML, CSS and JavaScript with no build step, mobile-first, and works offline.
- `app/staff.html`: the staff portal, with sign-in and pages for Data Reviewers, Program Managers and Admins.
- `app/survey-data.js`: the full questionnaire in both languages. Edit wording here.
- `db/schema.sql`: Supabase database: tables, roles and permissions. Safe to run again after changes.
- `docs/DESIGN.md`: architecture, dashboard, hosting and timeline.
- `docs/questionnaire-notes.md`: how the app differs from the v7 PDF, and open questions.

## Try it

Open `app/index.html` in a browser for the website, or `app/survey.html` for the survey. With no server configured it runs in **test mode**:
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

| Page | Volunteer | Data Reviewer | Program Manager | Admin |
|---|:-:|:-:|:-:|:-:|
| My surveys: own count and list, no answers | ✓ | ✓ | ✓ | ✓ |
| Survey dashboard: charts for every question, with filters | | ✓ | ✓ | ✓ |
| Responses list and single-response view | | De-identified | Full | Full |
| Export CSV: responses, codebook, summary tables | | De-identified | Full | Full |
| Focus groups and translations | | Read only | Edit | Edit |
| Program dashboard: progress to target, volunteers, coverage, data quality | | | ✓ | ✓ |
| Exclude or include a response | | | ✓ | ✓ |
| Users & roles, names (restricted), settings, audit log, deleting data | | | | ✓ |

**Volunteers.** Volunteers choose **Request access** on the staff page, and an admin gives them the Volunteer role.
Once signed in on a phone or tablet, the survey start page shows "Volunteer mode" with their name, and they choose
how the survey is being done (in person, by phone, from a paper form, or the respondent typing on their device).
The database stamps each survey with the signed-in volunteer, so it cannot be faked, and managers see "Signed in: Yes"
in the program dashboard. Volunteers sign in once while online; surveys collected offline upload later under their name.
If their login has expired or been removed by then, the survey is still saved, with their name marked "not verified".
Volunteers never see answers, only their own list of submissions.

**Survey timing.** A small timer in the survey header shows the time spent so far. It counts only while the survey
is on screen and in use. It pauses when the tab is hidden or after 5 minutes without a tap or keypress, so a
survey left open or resumed the next day is not inflated. Each response stores the active total (`duration_seconds`)
and the time per section (`section_seconds`). The survey dashboard charts both, and exports include them.
Paper-form entries are left out of timing charts because they measure the volunteer's typing, not the respondent.

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

## Public website

The site home page introduces the project, the problem, the community it serves, the four activities, the timeline,
the sponsor, and a "Take the survey" button in the menu. Every page has an English / नेपाली switch in the header;
the choice is remembered across pages. Link straight to Nepali with `?lang=ne`, for example `index.html?lang=ne`.

**Before sharing the site, fill in the contact details** at the top of `app/site.js`: address, email, phone, office hours,
Facebook, WhatsApp and the main NANC website. Until then the site shows "Coming soon" in their place.

Each page holds its English and Nepali text side by side (`lang="en"` and `lang="ne"` elements), so a translation fix is
a direct edit next to the English. The timeline marks each phase as completed, happening now or coming up
automatically from the dates in `timeline.html`.
