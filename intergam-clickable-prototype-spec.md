# Intergam AI Research OS — Clickable Frontend Prototype

## 1. Objective

Build a polished, fully clickable, frontend-only prototype of **Intergam**, an AI-assisted market research platform. The prototype is intended for internal review and client demonstrations, not production use.

It should demonstrate one complete story:

**Define a research objective → Generate a survey with the Design Agent → Review it with the Methodology & Bias Critic Agent → Edit and publish → Take the survey → View results.**

The experience must feel like a credible, premium B2B SaaS product. Prioritize cohesive visual design, realistic data, smooth interaction, and a working end-to-end flow over building a large number of superficial screens.

**Implement the application, not just wireframes or component examples.**

## 2. Technical Requirements

Use:

- **Vite + React + TypeScript** (no Next.js)
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible UI primitives
- **Lucide React** for icons
- **React Router with `HashRouter`** for GitHub Pages-compatible navigation
- **Recharts** for analytics visualizations
- **Motion** for subtle transitions if useful
- **localStorage** for persistence, with React state synchronized to it

Do **not** use:

- Next.js, NestJS, a database, authentication provider, external backend, or server-side runtime
- Gemini, OpenAI, or any other live AI API
- API keys, environment secrets, or external paid services
- Fake HTTP APIs that add complexity without functionality

Use strongly typed models, reusable components, and a small, maintainable project structure. Avoid overengineering.

The project must run with `npm install` and `npm run dev`, produce a successful production build with `npm run build`, and deploy as a static website to GitHub Pages.

## 3. Visual Direction

Create an elegant, contemporary **enterprise research SaaS** interface. References for quality and restraint: Linear, Vercel, Notion, and polished analytics products. Do not simply copy their layouts or branding.

Design principles:

- Light theme first; warm white and very light gray surfaces
- Strong typography, carefully balanced spacing, and clear hierarchy
- Indigo/blue as the primary accent, with subtle violet for AI features
- Restrained shadows, fine borders, rounded cards, and generous whitespace
- Sophisticated charts and subtle status indicators
- Beautiful loading, empty, success, and error states
- Hover, focus, and selected states for all controls
- Tasteful transitions and microinteractions, not excessive animation
- Responsive at desktop, tablet, and mobile widths
- Consistent spacing, typography, color tokens, and component styling

Use **English** for all UI copy. Brand the app as **Intergam Research OS** with a simple, clean text/logo treatment. Use meaningful labels and believable sample content. Avoid excessive gradients, generic placeholder illustrations, and decorative elements that distract from the research workflow.

## 4. Application Structure and Screens

### 4.1. App Shell

Create a persistent admin shell:

- Collapsible left sidebar with: **Overview, Surveys, AI Research Studio, Analytics, Settings**
- Topbar with current section, search or quick navigation, notification icon, and demo user avatar
- Visible active navigation state
- Toast notifications and dialogs for important actions
- Small **Demo Mode** indicator so simulated AI behavior is not mistaken for a live integration

The public survey respondent view should **not** display this admin shell.

### 4.2. Overview Dashboard

Create a compelling landing screen for the logged-in demo researcher:

- Welcome header and prominent **Create Survey** action
- KPI cards: Total Surveys, Active Surveys, Total Responses, Average Completion Rate
- Recent Surveys table or cards with title, status, date, number of responses, and actions
- Response activity chart
- Recent agent activity or a small AI workflow summary

Seed at least three believable example studies:

1. EV Customer Satisfaction
2. Smartphone Purchasing Behavior
3. Brand Awareness Study

Every survey card or row should open its corresponding detail/editor or analytics view. KPI values should be derived from seeded and user-created data rather than unrelated static constants.

### 4.3. AI Research Studio — Primary Demo Screen

This is the centerpiece of the prototype.

Let the user describe a business goal in a large, polished text area, for example:

> Understand the main factors influencing customer satisfaction among electric vehicle owners.

Include several clickable example prompts. The primary action is **Generate Survey**.

When clicked, simulate a two-step agent pipeline with distinct progress states and realistic short delays:

**Step 1 — Design Agent**

- Generate a survey title, short description, and 5–8 meaningful questions
- Include answer choices and appropriate question types
- Make the result vary based on the objective's topic (e.g., EVs, smartphones, brand awareness, or a sensible general template)
- Display the generated survey as a structured, readable preview

**Step 2 — Methodology & Bias Critic Agent**

- Review the generated survey and display a quality score
- Show 2–4 plausible, question-specific observations when appropriate
- Classify findings by type/severity: leading wording, ambiguity, duplication, bias, flow, or clarity
- Provide a concrete suggested improvement for each finding
- Allow the user to **Apply Fix** or **Dismiss** individual suggestions
- Applying a fix must visibly update the underlying survey question and review state

Present the two agents as a coherent workflow: **Design completed → Methodology review completed → Ready to edit**. Do not claim that actual AI inference is happening. Show **Mock AI / Demo** context unobtrusively.

Provide a clear **Continue to Survey Builder** action.

### 4.4. Survey Builder / Admin

Build a functional editor for both generated surveys and existing drafts.

Required actions:

- Edit survey title and description
- Add, edit, delete, and reorder questions
- Edit answer options
- Change question type
- Set or unset **Required**
- Save draft
- Preview the respondent experience
- Publish the survey
- View and copy its demo link
- See any outstanding Critic Agent suggestions and apply/dismiss them

Support four question types:

| Type | Expected input |
| --- | --- |
| `single_choice` | Radio selection |
| `multiple_choice` | Checkbox selection |
| `text` | Short/long text answer |
| `rating` | 1–5 rating scale |

Suggested layout: a question list on the left and selected-question editor on the right, with an accessible mobile alternative. Provide clear selected, hover, empty, and validation states.

The editor and respondent runner must use the **same typed survey schema**. Avoid building separate hard-coded forms per survey.

### 4.5. Public Survey Runner

The **Publish** action creates a local demo survey entry and a shareable-looking URL. Use GitHub Pages-safe hash routes, for example:

`/#/survey/demo-ev-satisfaction`

The public runner should have a separate mobile-first design:

- Survey title and introduction
- One question at a time or small clearly organized steps
- Progress bar
- Next / Back controls
- Required-field validation
- Clear selection states for multiple/single choice
- Submit confirmation and polished thank-you screen

On submit, save a response in `localStorage` and update all relevant dashboards in that browser.

**Important limitation:** Newly created surveys and responses exist only in the current browser. Other visitors cannot open a custom survey created in someone else's browser. Preloaded demo surveys must be available to every new visitor, so externally shared links to those demo surveys work. Do not misleadingly present local-only links as a real multiuser survey distribution system.

### 4.6. Analytics Dashboard

Create a detailed but straightforward analytics view for each survey:

- Total responses
- Started/completed counts and completion rate if both events are actually tracked
- Responses over time
- Distributions for single-choice and multiple-choice questions
- Average rating and rating distribution
- List or cards for open text responses
- Survey selector and date/status context

Use attractive charts with appropriate labels, axes, tooltips, and empty states. Seed realistic responses for the example studies.

After taking a survey in the same browser, its new response must affect the relevant results. Do not simulate actual cross-user real-time synchronization. If start/abandon events are not implemented, do not invent completion metrics; show a simpler honest metric instead.

### 4.7. Surveys and Settings

**Surveys** page:

- Search and filter surveys by status
- View draft/published badges
- Open, edit, preview, publish, or inspect analytics
- Create a new survey

**Settings** page:

- Demo profile details
- Demo Mode explanation
- **Reset Demo Data** button with confirmation
- Optional lightweight appearance preferences if time permits

Do not build nonfunctional settings controls merely to fill the page.

## 5. Mock Logic and Data

Define typed models such as:

- `Survey`: id, slug, title, description, objective, status, questions, createdAt, updatedAt, publishedAt
- `Question`: id, type, title, description, required, options, order, and rating bounds where relevant
- `SurveyResponse`: id, surveyId, answers, startedAt (if tracked), submittedAt
- `ReviewIssue`: id, questionId, type, severity, explanation, suggestion, replacement wording, status
- `AIReview`: surveyId, score, issues, reviewedAt

Implement deterministic or template-based **mock agent services**:

- `generateSurvey(objective)` returns a relevant typed survey draft
- `reviewSurvey(survey)` returns concrete issues tied to question IDs
- `applyReviewSuggestion(survey, issue)` updates the intended question

Include a few intentionally improvable question wordings in demo generation so the Critic Agent has meaningful work to show. However, the edits must be logically consistent with what the issue describes.

Persist surveys, responses, and reviews in `localStorage`. Provide safe initialization and schema/version handling so a clean first visit loads seeded data. Use a state layer or custom hooks so updates propagate through the UI without reloads.

Use realistic initial data, not lorem ipsum. Show useful empty states when the user removes or resets their own content.

## 6. Routing and Static Hosting

**The app must work on GitHub Pages without a backend.**

Use `HashRouter` and routes such as:

- `/#/` — Overview
- `/#/surveys` — Survey list
- `/#/studio` — AI Research Studio
- `/#/builder/:id` — Survey editor
- `/#/survey/:slug` — Public runner
- `/#/analytics/:id` — Analytics
- `/#/settings` — Settings

Hash-based routing is intentional so direct navigation and refresh do not depend on server-side rewrites.

Configure Vite's `base` for deployment to a repository subpath such as `https://username.github.io/intergam-prototype/`. Make the repository name configurable rather than hard-coding a personal username.

Provide a GitHub Actions workflow that installs dependencies, builds the app, and publishes the generated `dist` directory to GitHub Pages. Include clear README steps for enabling GitHub Pages in repository settings.

No server functions, API routes, API keys, or backend hosting should be required.

## 7. End-to-End Acceptance Scenario

The following must work in a fresh browser session:

1. Open the application and see populated Overview metrics and recent studies.
2. Click **Create Survey** and navigate to AI Research Studio.
3. Select an example prompt or enter a custom objective.
4. Click **Generate Survey** and see the Design Agent simulation.
5. See the Critic Agent review, quality score, and issue cards.
6. Apply at least one suggested fix and see the question update.
7. Open the Survey Builder and edit an additional question manually.
8. Save the draft, preview it, and publish it.
9. Open the newly published survey in the same browser and submit a response.
10. Return to Analytics and see the new response included in charts/counts.
11. Refresh the page and confirm the data remains saved.
12. Open a seeded demo survey link in a fresh browser and verify that the seeded survey renders.
13. Reset demo data and confirm the initial demo dataset is restored.

All prominent navigation and action controls should work. Avoid dead-end buttons, broken links, placeholder pages, or modals with no useful actions.

## 8. Quality and Accessibility

- Responsive design, including a usable mobile survey runner
- Proper form labels, button semantics, keyboard interactions, and visible focus states
- Validation for required survey questions and editor fields
- Confirmation before destructive actions
- Loading, error, empty, and success feedback
- No console errors in the normal happy path
- No external services needed at runtime
- Clean TypeScript types and reusable components
- At least a small automated test set for mock generation, question editing, response storage, or core utilities if practical

## 9. Suggested Project Organization

```text
src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
    ui/
    surveys/
    agents/
    charts/
  pages/
    OverviewPage.tsx
    SurveysPage.tsx
    StudioPage.tsx
    BuilderPage.tsx
    PublicSurveyPage.tsx
    AnalyticsPage.tsx
    SettingsPage.tsx
  data/
    seed.ts
  lib/
    mock-agents.ts
    survey-utils.ts
    storage.ts
  types/
    research.ts
```

Adjust folder names as needed. Keep the architecture simple and the features cohesive.

## 10. Implementation Priorities

**P0 — Must deliver:**

- Premium visual system and responsive app shell
- Overview and Surveys pages
- Mock Design Agent and Critic Agent with actionable issues
- Functional Survey Builder
- Functional public survey runner
- Local response persistence
- Analytics derived from responses
- Complete end-to-end workflow
- GitHub Pages-compatible static build

**P1 — Only after P0 works:**

- Extra chart types or richer animations
- Drag-and-drop question reordering (simple up/down controls are acceptable for P0)
- Additional example research topics
- Optional dark theme

Do not sacrifice the working core workflow or design polish to implement P1 features.

## 11. Deliverables and Definition of Done

Deliver the complete source code, not just a design description. Include:

1. A running Vite + React application
2. Seeded demo surveys and response data
3. All screens and functional interactions listed above
4. A static production build
5. GitHub Pages deployment workflow
6. A concise README with local run, build, deployment, and demo limitations

Before declaring completion:

- Run the production build and resolve errors.
- Walk through the acceptance scenario and fix any broken steps.
- Check desktop and mobile layouts.
- Confirm the generated GitHub Pages assets use the correct base path.
- Clearly identify any incomplete optional P1 items.

**Final instruction:** Build a visually impressive, coherent, interactive product demo that a sales or engineering lead can click through during a client presentation. Mock the AI honestly, keep everything frontend-only, and optimize for clarity, speed, and design quality.
