# Questionnaire transcription notes (v7)

The app's questionnaire lives in `app/survey-data.js`. It was transcribed from
`NANC_Bilingual_Needs_Assessment_Google_Form_v7.pdf`: English from pages 1 to 17, Nepali from pages 18 to 37.

The Nepali text in the PDF cannot be copied, because the PDF uses a legacy font encoding.
The Nepali in the app was therefore typed from the rendered pages.
**A native Nepali speaker should proofread every screen before launch.**

## Where the app differs from the PDF

English is treated as the master version. Where the two versions disagreed, the app follows English and adds the missing Nepali.

| Item | PDF | App |
|---|---|---|
| Consent | Nepali adds C3 "Street address" and renumbers consent to C4 | No street address. Consent is C3 in both languages |
| C1, C2 names | Asked, although the intro says names are not collected | Kept optional. Stored in a separate admin-only table, never with answers |
| D1 | Nepali lacks San Francisco and "Don't know", and has "Prefer not to answer" | English options in both languages |
| D7 | English lists "0–5 years" twice. Nepali shows ६६–६५ and "over 65" | One 0–5 band. Nepali corrected to ६६–७५ and ७५ वर्षभन्दा माथि |
| L4 | Nepali lacks "I usually need help" | Added: मलाई प्रायः सहयोग चाहिन्छ |
| L5 | Nepali "County" | काउन्टी सेवा, to match "County services" |
| H7 | Always shown | Shown only when H6 is "Yes" or "Not sure" |
| B4 | Nepali asks "गाह्रो भयो वा गाह्रो पर्‍यो" | Shortened to गाह्रो भयो, with answers भयो / भएन |
| Section 3 title | सहभागित (typo) | सहभागिता |
| Consent paragraph 1 | "यस सर्वेक्षण सर्वेक्षणबाट" (repeated word) | यस सर्वेक्षणबाट |
| D9 | अशकालीन (typo) | अंशकालीन |

## Still open, needs a NANC decision

- L9 allows up to 15 of 21 choices, which will not reveal priorities. Consider 5. Change `max: 15` in `survey-data.js`.
- L9 and N1 contain overlapping food options, and L9 has two overlapping disability options.
- N4 and S2 both ask about unfair treatment in the past year.
- Whether to keep names (C1, C2) at all, given the consent wording.
