# Intergam Research OS

A polished, frontend-only research prototype: business objective → mock Design Agent → Methodology & Bias Critic → survey builder → publish → respond.

## Run locally

Use Node.js **22.12 or later** and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No accounts, API keys, environment secrets, or backend are needed. Fonts and all runtime assets are bundled locally.

```sh
npm run build       # Type-check and create dist/
npm run preview     # Serve the production build
npm run typecheck
npm test            # Domain, persistence, validation, and fixture tests
npx playwright install chromium
npm run test:e2e    # End-to-end browser tests; starts its own dev server
npm run format:check
npm run format
```

## Try the demo

1. Open **Create Survey** and choose an example research objective.
2. Generate a survey, watch the two simulated agents, and apply a critic fix.
3. Continue to the builder, edit another question, and save the draft.
4. Preview the respondent experience, then publish.
5. Open the published survey in the same browser and submit a response.
6. Find the saved response count in **Surveys**. Refresh to verify persistence.
7. Explore the analytics dashboard. To restore the initial dataset, clear this site's browser storage and refresh.

## Deliberate demo boundaries

- **Mock AI:** agents use deterministic topic templates for EVs, smartphones, brand awareness, or general customer experience. No inference or external requests occur.
- **Fixed analytics:** Overview response metrics and analytics charts are illustrative mock fixtures; survey and published counts reflect the workspace. Local submissions are saved and counted in survey management, but **do not update dashboards**. Completion rates are sample metrics; survey starts and abandonment are not tracked. This intentionally revises the original spec's response-driven analytics requirement.
- **Browser-local storage:** surveys, reviews, and responses use the versioned `intergam-research-os` localStorage key. Clearing browser data removes custom work. Changes synchronize between tabs on the same origin; there is no cross-user synchronization. Storage failures show a warning and permit session-only use. Invalid or unsupported saved data requires an explicit recovery reset.
- **Sharing:** custom survey links only work in the browser where they were created. Preloaded demo links work for all visitors at `/#/survey/demo-ev-satisfaction` and `/#/survey/demo-smartphone-purchasing` (after any hosting subpath).
- **Published studies are immutable:** editing makes a separate draft copy with new question identifiers and no responses. Publishing that copy creates a new link.
- **Preview:** runs the shared respondent renderer against the editor buffer and never stores responses.
- **NPS:** all five question types are supported, including an integer scale from 0 to 10. Analytics show the score (% promoters at 9–10 minus % detractors at 0–6), the three respondent groups, and the full distribution.
- **Completion time:** the runner saves the time of the first Start survey click and the submission timestamp. Analytics show average elapsed completion time from their deterministic fixture responses. Older responses without a start timestamp remain readable and are excluded from time calculations.
- **CSV:** Export CSV downloads one row per response with timestamps, elapsed seconds, and answers in questionnaire order. It exports the same fixed response dataset that powers the selected analytics view, independently of locally submitted responses. Files use UTF-8 with a BOM, quoted fields, JSON arrays for multiselect answers, and spreadsheet-formula protection for text.
- **Critic order suggestions:** generated EV, smartphone, and general studies include an open question early in the draft; the critic can move it to the end. The brand example suggests moving familiarity to the beginning. Apply Fix updates the actual sequence and preserves question IDs. Manual reordering supersedes outstanding flow suggestions.
- **Local response counts:** the original EV and smartphone studies include 48 and 32 example response records. New submissions add to these operational counts, independently of dashboard fixtures.

Question order supports drag and drop with a mouse or touch using the grip beside each question. Keyboard users can focus the grip, press Space to pick up a question, use arrow keys to move it, then press Space to drop it or Escape to cancel. Reordering preserves question IDs and marks outstanding flow suggestions as superseded. Published questionnaires stay locked.

## GitHub Pages

1. Push this source and `package-lock.json` to the repository's `main` branch.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. The included workflow runs formatting, types, unit tests, and the build, then deploys `dist/`. Browser checks remain manual. Pull requests run checks without publishing. You can also run it manually from **Actions**.

Vite derives the base path from `GITHUB_REPOSITORY`, so this repository builds under `/marketing-agents-demo/` without a hard-coded username. Account-level `*.github.io` repositories use `/`. HashRouter handles direct links and refreshes without server rewrites.

For a custom domain or alternate subpath, add a repository Actions variable named `VITE_BASE_PATH` with `/` or `/your-subpath/`. Local builds default to `/`; to verify a subpath locally:

```powershell
$env:VITE_BASE_PATH = '/marketing-agents-demo/'
npm run build
npm run preview
Remove-Item Env:VITE_BASE_PATH
```

Open the printed preview URL **with the configured subpath**, e.g. `http://localhost:4173/marketing-agents-demo/#/survey/demo-ev-satisfaction`. Changing the origin changes the localStorage workspace.

## Structure

- `src/app`: router, navigation, context/reducer, and persistence wiring.
- `src/types`: the shared survey, question, review, response, and storage models.
- `src/lib`: mock agents, editing/publication utilities, and storage validation.
- `src/data`: original studies, example responses, and independent analytics fixtures.
- `src/components`: shadcn-style owned UI primitives using Radix, layout, survey renderer, agent review, and Recharts visualizations.
- `src/pages`: Overview, Surveys, Studio, Builder, Public Survey, and Analytics.

The implementation follows Vite's [static deployment guidance](https://vite.dev/guide/static-deploy), Tailwind's [Vite integration](https://tailwindcss.com/docs/installation/using-vite), and shadcn/ui's [owned component approach](https://ui.shadcn.com/docs).

The interface uses only a left sidebar; on small screens it becomes an icon rail. Settings, the topbar, the reset button, promotional panels, and repeated status labels are intentionally omitted.
