# NANC Language Equity Survey: Web Application Design

**Program:** Nepali Association of Northern California (NANC) community needs assessment, West Contra Costa County
**Funding:** Contra Costa County grant
**Duration:** 11 months
**Source questionnaire:** `NANC_Bilingual_Needs_Assessment_Google_Form_v7` (English + Nepali, 7 sections, ~70 items)

---

## 1. Goals

1. Let anyone complete the survey in **English or Nepali**, on a phone, tablet, or computer, in about 15 minutes.
2. Let **volunteers** fill the survey on behalf of a community member (in person or by phone), including where internet is poor.
3. Store responses securely, **separating identity from answers**, because the survey asks about immigration concerns, discrimination, mental health, and family violence.
4. Give **data reviewers** a login to see a live dashboard and download reports, without seeing names.
5. Support the grant's other activities: **focus group discussions** and **English-to-Nepali translation** work.
6. Produce the numbers the county will ask for in progress and final reports.

## 2. Users and roles

| Role | How they get in | What they can do |
|---|---|---|
| Respondent | Public link or QR code, no login | Choose language, consent, complete survey, save and resume on same device |
| Volunteer (enumerator) | Login (email magic link or Google) | Start "assisted" surveys, see their own submission count, work offline and sync later. Cannot view answers after submitting |
| Data reviewer | Login + 2-step verification | Read-only dashboard, filtered tables, CSV/Excel export of **de-identified** data |
| Program manager | Login + 2-step verification | Everything a reviewer can do, plus focus group and translation modules |
| Admin | Login + 2-step verification | Manage users and roles, survey versions, audit log, and the restricted contact table |

Principle: **least privilege**. Only admins can ever link a name or phone number to a response, and that access is logged.

## 3. Respondent experience

```
Landing page (English | नेपाली toggle)
  -> Information & consent (18+ and agree?)
       No  -> Thank-you page (only an anonymous "declined" counter is stored)
       Yes -> Section 1/7 About You
              Section 2/7 Language & Information Access
              Section 3/7 Services, Navigation & Civic Engagement
              Section 4/7 Health & Health Care Access
              Section 5/7 Housing, Food, Employment, Transportation & Digital Access
              Section 6/7 Mental Health, Social Connection & Safety (all optional)
              Section 7/7 Community Priorities
       -> (optional) Focus group interest + contact info, stored separately
       -> Thank-you page with local resources (211, 988, NANC contact)
```

Design details:

- **One section per page**, progress bar ("Section 3 of 7"), large tap targets, Devanagari font (Noto Sans Devanagari or Mukta) at 18px or larger.
- **Language toggle on every page.** Switching language keeps answers, because every question and option has a stable code (for example `L5` / `doctor_clinic`) shared by both languages.
- **Matrix questions** (L7, N1, CIV1, B1, B3, S1) render as a grid on desktop and as one card per row on phones.
- **Skip logic** reduces burden:
  - H7 (reasons care was delayed) only if H6 = Yes.
  - N2 hidden when every N1 row is "Did not need".
  - Contact block only if P5 = Yes or Maybe.
- **Exclusive options:** "None of these", "I did not experience any difficulty", and "Prefer not to answer" clear the other boxes in the same question.
- **Limit enforcement:** L9 allows at most the configured number of choices.
- **Save and resume** in browser storage, so a dropped connection does not lose work.
- **Crisis note** on Section 6: the survey is not an emergency service, with 988 and local hotline numbers in both languages.

### Volunteer-assisted mode

- Volunteer logs in, taps **"Start assisted survey"**, and picks the mode: in person, phone, or paper entry (for printed forms typed in later).
- Each response records `mode` and `volunteer_id`, so analysis can compare self-completed and assisted answers.
- **Offline support** (Progressive Web App): the form is cached on the device. Completed surveys queue locally and upload when back online. The queue is cleared after a successful upload.
- Consent is read aloud. The volunteer confirms "respondent gave verbal consent" before continuing.

## 4. Capturing responses

### Survey definition as data

Store the questionnaire as one bilingual **JSON survey definition**, versioned (`v7`, `v8`, ...). The form, database views, dashboard labels, and export headers are all generated from it. Changing wording means editing one file, not code.

```json
{
  "name": "L2",
  "type": "radiogroup",
  "title": { "en": "How well do you speak English?", "ne": "तपाईं अंग्रेजी कतिको राम्रो बोल्नुहुन्छ?" },
  "choices": [
    { "value": "very_well",  "text": { "en": "Very well",     "ne": "धेरै राम्रो" } },
    { "value": "well",       "text": { "en": "Well",          "ne": "राम्रो" } },
    { "value": "not_well",   "text": { "en": "Not very well", "ne": "धेरै राम्रो होइन" } },
    { "value": "not_at_all", "text": { "en": "Not at all",    "ne": "बोल्न सक्दिनँ" } }
  ]
}
```

The open-source **SurveyJS Form Library** (MIT licence) reads this format and already supports multilingual text, matrix questions, skip logic, "select up to N", "Other (specify)", and exclusive "none" options. Using it saves weeks of form-building work.

> Copy Nepali text from the original Word file, not the PDF. The PDF uses a legacy font encoding, so text copied from it comes out garbled.

### Database design (PostgreSQL)

```
survey_versions   id, code ('v7'), definition JSONB, published_at
responses         id (UUID), survey_version_id, language ('en'|'ne'),
                  mode ('self'|'in_person'|'phone'|'paper'), volunteer_id NULL,
                  status ('in_progress'|'complete'), started_at, submitted_at,
                  answers JSONB,   -- {"D1":"contra_costa","L5":["doctor","dmv"],"N1":{"health_care":"some_help"}}
                  city, age_group, ...   -- a few copied columns for fast dashboard filters
contacts          id, response_id, first_name, phone, email, preferred_language, focus_group_interest
                  -- RESTRICTED: admin-only, encrypted columns, deleted when focus groups end
users             id, email, role, active
audit_log         id, user_id, action, target, at
focus_groups, fg_sessions, fg_notes, fg_themes            (Section 7)
translation_requests, translation_documents, glossary     (Section 7)
```

- **Answers live in one JSONB column**, so a new survey version needs no database migration.
- **SQL views flatten the JSON** into one row per response (for exports) and one row per response and option (for charts).
- **Row-level security** in the database enforces roles, so a bug in a web page cannot expose data the user's role does not allow.
- **Response IDs are random UUIDs**, never sequential.

## 5. Dashboard for reviewers

### Overview page

- Completed responses against target, and responses per week.
- Breakdown by city (D2), survey language, mode (self vs. assisted), and volunteer.
- Completion funnel: started vs. finished, and the section where people drop out.

### Section pages (one per survey section)

| Question type | Chart |
|---|---|
| Single choice (D3, L2, H1, M1...) | Horizontal bar with percent and count |
| Select all that apply (L5, N2, H8...) | Ranked horizontal bar, "% of respondents who chose it" |
| Priorities (L9, P2, CIV2, B5) | Ranked bar with top items highlighted. L9 feeds the translation backlog |
| Matrix / Likert (N1, CIV1, B1, S1) | 100% stacked diverging bar, one row per service |
| Household counts (D6, D7) | Histogram and totals by age band |

### Filters and cross-tabs

Every chart can be filtered by city, age group, gender, years in the US, English ability (L2), and financial hardship (D10). Examples a reviewer can answer in two clicks:

- Among people who speak English "not well" or "not at all", where did language barriers hit hardest? (L2 x L5)
- Do newer arrivals report more unmet service needs? (D5 x N1)
- Which information channel do older adults prefer? (D3 x L8)

### Privacy protections on the dashboard

- **Small-cell suppression:** any group with fewer than 5 respondents shows "fewer than 5". In a small community, a cross-tab like "Hercules, 65-74, Tibetan-speaking" could identify a person.
- Free-text "Other" answers are visible only to program managers and admins, after screening for names.
- Section 6 (mental health, safety, family violence) is shown only in aggregate.
- Exports never include names, contact details, or free text unless the user is an admin.

### Reports

- One-click **grant progress report** (PDF) with overview numbers and top findings.
- **Excel export**, one row per response, with coded values and English label columns.
- Final-report tables formatted for the county.

## 6. Security and data protection

The consent text promises "Your name will not be collected" and "results presented only in summary form". The system must keep that promise.

- HTTPS everywhere, database encrypted at rest, daily backups with point-in-time restore.
- Staff logins require 2-step verification. Volunteers use email magic-link login.
- No third-party analytics or advertising scripts on survey pages.
- Audit log of every login, export, and restricted-table access.
- Data hosted in a US region.
- **Retention:** delete the contacts table when focus groups finish. Keep de-identified data as long as the grant agreement requires, then archive.
- Check the county grant agreement for data ownership, data sharing, and record-retention clauses before launch.
- Volunteer training: one hour on consent, neutral question reading, confidentiality, and what to do if a respondent discloses a crisis.

## 7. Other grant activities (same app, later phases)

### Focus group discussions

- Create sessions (date, location, language, facilitator, topic).
- Invite survey respondents who opted in (P5 = Yes or Maybe) from the contacts table.
- Record attendance counts and aggregate demographics.
- Upload de-identified notes and tag themes (for example "interpreter access", "DMV test"). A summary page shows how often each theme appears across sessions.

### English-to-Nepali translation

- **Request queue:** document, requesting partner, topic, priority, due date.
- **Priority** comes from survey results: L9 ranks which topics to translate first.
- **Workflow:** requested -> translating -> community review -> approved -> published, with translator and reviewer recorded.
- **Glossary** of approved Nepali terms (Medi-Cal, tenant rights, primary care doctor...) so all translators use the same words.
- **Public library** page where the community can download approved Nepali materials.

## 8. Technology stack

### Recommended: custom web app on managed services

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React) + TypeScript**, Tailwind CSS | Widely known, easy to hand over to other volunteers, works as a Progressive Web App |
| Survey form | Custom lightweight renderer in `app/` (no dependencies) | Built. Full control over a simple, large-text mobile design. SurveyJS remains an option if needs grow |
| Charts | **Apache ECharts** or **Recharts** | Free, handles stacked and diverging bars |
| Database, auth, files | **Supabase** (managed PostgreSQL) | Login, roles, row-level security, backups, and storage in one service |
| Offline sync | Service worker + IndexedDB queue | Volunteers in low-signal areas |
| Reports | Server-rendered PDF, `exceljs` for Excel | Grant reports and data hand-off |
| Email | Supabase built-in email or Resend | Volunteer login links |
| Source code | GitHub (free for nonprofits) | History and hand-over |

### Low-code alternative: KoboToolbox + Looker Studio

**KoboToolbox** is free for nonprofits. It handles bilingual forms built from a spreadsheet, offline collection on Android (KoboCollect), skip logic, and per-user permissions for reviewers. Pair it with **Google Looker Studio** or **Power BI** for the dashboard.

Trade-offs: launch in 1 to 2 weeks, but less control over look and feel, no focus-group or translation modules, and weaker small-cell privacy controls on dashboards.

**Recommendation:** build the custom stack if one developer can commit about 6 to 8 weeks up front and a few hours a week afterwards. Otherwise launch on KoboToolbox and track focus groups and translations in a shared spreadsheet.

### Why not stay on Google Forms?

Google Forms cannot switch languages within one form, has limited matrix and skip logic, cannot cleanly enforce "select up to N", has no offline mode, and gives anyone with sheet access every row, including names. It is fine for a pilot, not for the full program.

## 9. Hosting for a nonprofit

| Option | Monthly | 11 months | Notes |
|---|---|---|---|
| **Vercel Pro + Supabase Pro** (recommended) | ~$45 | ~$500 | Daily backups, no project pausing. Vercel's free Hobby plan is for personal non-commercial use, so use Pro for an organisation |
| Netlify free + Supabase Pro | ~$25 | ~$275 | Netlify's free tier permits organisational sites |
| **Microsoft for Nonprofits** Azure grant | $0 within credit | $0 | Up to $2,000/year Azure credit. Azure Static Web Apps + Azure Database for PostgreSQL. More setup |
| Google for Nonprofits / Google Cloud credits | $0 within credit | $0 | Cloud Run + Cloud SQL. Also free Workspace email for staff |
| AWS nonprofit credits (via TechSoup) | $0 within credit | $0 | Amount and approval vary |
| KoboToolbox | $0 | $0 | Hosted by Kobo |

Supabase's free tier pauses inactive projects and has no daily backups, so use Pro for real data. Budget about $15/year for a domain, or use a subdomain such as `survey.<nanc-domain>`.

Register with **TechSoup** first. It verifies nonprofit status once and unlocks the Microsoft, Google, and AWS programs. Verify current prices and credit amounts at sign-up; they change.

Plan the **end of the 11 months** now: export all data, generate the final report, delete the contacts table, close or downgrade paid services, and archive code and data per the grant agreement.

## 10. Timeline (11 months)

| Month | Work |
|---|---|
| 1 | Finalise questionnaire v8 (Section 11). Build form, consent flow, database, roles |
| 2 | Volunteer mode, offline sync, dashboard overview. Pilot with 15 to 20 people in both languages. Fix wording |
| 3 | Launch. Train volunteers. Dashboard section pages and exports |
| 4 to 8 | Data collection. Monthly progress report to the county. Build focus-group module |
| 5 to 10 | Focus groups. Translation module, prioritised by L9 and P2 results |
| 9 | Close survey. Clean data and code "Other" answers |
| 10 to 11 | Final analysis and report, community presentation, data retention and service shutdown |

## 11. Questionnaire issues to fix before launch

Found by comparing the English and Nepali versions of v7.

1. **Consent vs. name collection.** The introduction says "Your name will not be collected", but C1 and C2 ask for first and last name, and the Nepali version adds C3 **street address**. Remove them, or move contact details to the optional focus-group step with clear wording.
2. **Numbering differs.** Nepali has C1 to C4 (with address), English has C1 to C3. Codes must match for answers to merge.
3. **D1 options differ.** Nepali omits San Francisco and "Don't know", and has "Prefer not to answer" instead.
4. **D7 age bands.** English lists "0-5 years" twice. Nepali shows "६६-६५" and "६५ वर्षभन्दा माथि" where it should read 66-75 and over 75.
5. **L9 "select up to 15"** out of 21 options is nearly everything, so it will not reveal priorities. Suggest "select up to 5".
6. **Duplicate options.** L9 and N1 list both "Food and nutrition assistance" and "Information about food assistance programs". L9 also has both "Services for older adults and people with disabilities" and "Disability services". These split the vote.
7. **H7 needs a skip rule.** Show it only when H6 = Yes, and drop "Care was not delayed or missed".
8. **N4 and S2 overlap.** Both ask about unfair treatment in the past year. Keep one, or make S2 explicitly about harassment and threats.
9. **Leftover authoring text.** B2 still contains Google Forms notes ("Multiple choice · Include 'Other' · Optional"). N5 lacks "Select all that apply".
10. **H5 wording.** "Community health center (county health center)" merges two different things. Consider separate options.
