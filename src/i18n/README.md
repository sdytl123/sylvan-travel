# Website languages

Chinese pages retain their original paths. The build creates matching English pages under `/en/` using `scripts/english-pages.mjs`. Header language links switch between the same page; internal English links remain under `/en/`. No visitor-side translation request is needed.

Translations for current site and Google Sheets content are in `en.json`. Add a matching English translation there when adding or changing Chinese copy in Sheets or templates. Structured prices, durations, counts and destination titles are handled by the generator. The build reports the page and missing text and stops rather than publishing a partly translated English site.

Scripts and form values are not translated as HTML text. Localise new interactive messages using `document.documentElement.lang`, as in the asset manager. URLs and image files remain unchanged; visible image labels are translated.

Run `node --test scripts/english-pages.test.mjs`, `npm run build`, then `node scripts/check-english-build.mjs dist`. Use `npm run preview` to test the built English pages; `npm run dev` serves the Chinese source pages only.
