# ReactCode

A LeetCode-style platform for practicing React.js by writing real, executable React code
that's graded by a server-side test runner — not multiple-choice, not a hardcoded string
match.

## What's built

- The full loop, verified in a real browser: register → log in → browse/filter problems →
  edit code in Monaco → live preview → **Run** (public tests) → **Submit** (public + hidden
  tests) → per-test results → progress, bookmarks, dashboard → "Next problem".
- **A bank of 302 problems across all 25 learning levels**, every one machine-verified (see
  [Problem quality control](#problem-quality-control)).

| Level | Category | # | Level | Category | # |
|---|---|---|---|---|---|
| 1 | JSX | 27 | 14 | Custom Hooks | 8 |
| 2 | Components | 12 | 15 | Debugging | 14 |
| 3 | Props | 20 | 16 | React Router | 9 |
| 4 | Children | 8 | 17 | Context | 7 |
| 5 | Conditional Rendering | 15 | 18 | useReducer | 7 |
| 6 | Lists | 18 | 19 | Redux Toolkit | 8 |
| 7 | Events | 17 | 20 | Zustand | 5 |
| 8 | useState | 25 | 21 | TypeScript | 8 |
| 9 | Forms | 17 | 22 | Testing | 7 |
| 10 | Component Communication | 9 | 23 | Performance | 8 |
| 11 | useEffect | 11 | 24 | Accessibility | 7 |
| 12 | API | 17 | 25 | Real-World Components | 10 |
| 13 | useRef | 8 | | | |

By difficulty: **103 Beginner, 103 Easy, 71 Medium, 25 Hard**. By kind: 267 build, 17 debug
(fix real buggy code), 7 optimize, 4 refactor, 7 test-writing. Collections (Beginner 100,
Components 100, Hooks 100, API 50, Debugging 50) are assigned automatically.

Some problem types grade more than behaviour:

- **TypeScript** problems type-check the learner's file in strict mode *and* append misuse
  snippets (e.g. `<Badge label={1} />`) that must be rejected — so `any` doesn't pass.
- **Testing** problems are graded by mutation testing: the learner writes a React Testing
  Library test, which must pass against a correct component and fail against several subtly
  broken ones.
- **Performance** problems count renders or calls, so the fix has to actually skip the work.

## Architecture

```
reactcode/
  apps/
    web/     React + TS + Vite + Tailwind + React Router + TanStack Query + Zustand + Monaco
    api/     Express + TS + Prisma + JWT-in-httpOnly-cookie auth
      src/problem-bank/   the problem library, one file per level
      src/scripts/verify-problems.ts
  packages/
    shared/          Types shared by web and api
    problem-engine/  CodeExecutionService abstraction + LocalExecutionService + runner.cjs
```

### The execution engine

The frontend and API never decide whether a submission is correct — `packages/problem-engine`
does, through `CodeExecutionService.execute(job)`. `LocalExecutionService` runs each
submission in its **own short-lived Node child process** (`runner.cjs`), separate from the
Express server, with a wall-clock timeout, a heap cap, and a minimal environment. Inside it:

1. The learner's TSX is compiled with esbuild and loaded as a module. It can import `react`,
   `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, and `zustand`.
2. jsdom provides the DOM.
3. `fetch` is replaced by the problem's **mock API** (a list of routes). Every request is
   recorded so tests can check the learner really called the API, and tests can swap in
   different data to defeat hardcoded answers.
4. Author-written tests run with React Testing Library, user-event, Jest's `expect` with
   jest-dom matchers, and a TypeScript `typeCheck()` helper.
5. Errors thrown asynchronously (e.g. a re-render after a fetch) fail the current test with
   a readable message instead of crashing the process.

This is a **dev-grade sandbox**: there's no container or VM boundary, so don't expose it to
hostile traffic as-is. A Docker or remote executor only needs to implement the same interface.

### The browser preview

The preview compiles the code in the page and renders it in a **separate React root**, so it
doesn't inherit the host app's router or other context. It uses the problem's mock API and
the props the problem's first public test renders with (captured by the verifier); callbacks
passed as props are shown in a "Preview log". It never decides correctness.

### Saved drafts

Each problem has a content hash (starter code + tests + mock API). A draft is only loaded if
it was saved against the current hash; otherwise the learner starts from the new starter code
and is offered "Restore my previous draft".

### Database: SQLite now, Postgres later

`apps/api/prisma/schema.prisma` uses `provider = "sqlite"` because this environment had no
Docker/Postgres. The schema is Postgres-compatible: `docker compose up -d db`, change the
provider, update `DATABASE_URL`, run `prisma migrate dev`.

## Running it

```bash
npm install                          # repo root (npm workspaces)
cd apps/api
npx prisma migrate dev               # creates apps/api/prisma/dev.db
npx prisma db seed                   # users + all 302 problems
npm run dev                          # http://localhost:4000

# second terminal
cd apps/web
npm run dev                          # http://localhost:5173 (proxies /api to :4000)
```

Seeded accounts: `demo@reactcode.dev` / `demo12345`, `admin@reactcode.dev` / `admin12345`.

## Adding problems

Problems live in `apps/api/src/problem-bank/NN-category.ts`. Each file exports a
`CategoryBank` (category, level, prerequisites) with a list of `ProblemDef`s:

```ts
{
  slug: "state-change-message",
  title: "Your First State Variable",
  difficulty: "BEGINNER",               // BEGINNER | EASY | MEDIUM | HARD
  tags: ["useState"],
  problemType: "BUILD",                 // BUILD | DEBUG | REFACTOR | OPTIMIZE | TEST
  description: "Markdown...",
  requirements: ["Starts with 'Hello'", "..."],
  hints: ["vague", "...", "specific"], // 2–4
  starterCode: `...`,
  solutionCode: `...`,
  explanation: "Why it works",
  commonMistakes: ["..."],
  alternativeApproach: "optional",
  mockApi: [{ url: "/api/users", response: [...] }],   // optional
  tests: [
    test("starts with Hello", `renderComponent();\nexpectText("Hello");`),
    hidden("changes to Goodbye", `renderComponent(); ...`),
  ],
  wrongSolutions: [`...`],              // verification only; each must FAIL
}
```

A problem's global number comes from its position: levels in order, problems in file order.

Helpers available inside test code: `React`, `Component` (the default export), `userExports`
(all exports), `render`, `renderComponent(props)`, `renderHook`, `act`, `cleanup`, `screen`,
`within`, `fireEvent`, `userEvent`, `waitFor`, `expect` (Jest + jest-dom), `fn` (jest mock),
`mockFn()`, `mockApi` (`calls`, `setRoutes`), `lib(name)` (import a library the learner can
use), `typeCheck(extraCode?)`, `assert`, `assertEqual`, `expectText`, `expectNoText`, `sleep`,
`anyConsoleError(...substrings)`.

Then:

```bash
cd apps/api
npm run problems:verify -- "useState"    # a category name, or a slug substring
npx prisma db seed
```

## Problem quality control

`npm run problems:verify` runs every problem through the real execution engine and fails
unless:

- the official solution **passes** every test, public and hidden
- the starter code **fails cleanly** (wrong answer, not a compile error or crash)
- every listed wrong solution **fails** (hardcoded values, missing cleanup, index keys, the
  naive race-condition version, `any` types, and so on)
- it has 2–4 hints, at least one public and one hidden test, requirements, and an explanation
- slugs and titles are unique

It also writes `preview-props.generated.json`, which the seed uses for the preview. All 302
problems pass (about 2.5 minutes at concurrency 6).

## Not built yet

- The full 550+ target from the expansion spec: this is the first pass at every level, so
  the advanced levels (16–25) have 5–10 problems each and can take many more
- Multi-file problems (file tree, read-only files)
- Admin UI, submission history UI, daily challenge, interview mode, streaks
- Hardened (container) execution
- Automated tests for the platform itself (the problem verifier covers the engine end to end)
