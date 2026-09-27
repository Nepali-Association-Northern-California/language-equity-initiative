# NANC Language Equity Survey

A bilingual (English / नेपाली) community needs survey for the Nepali Association of Northern California,
funded by Contra Costa County.

- `app/`: the survey web app. Plain HTML, CSS and JavaScript with no build step, mobile-first, and works offline.
- `app/survey-data.js`: the full questionnaire in both languages. Edit wording here.
- `db/schema.sql`: Supabase database with insert-only public access and reviewer roles.
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
