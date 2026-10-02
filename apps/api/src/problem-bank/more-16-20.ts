import { hidden, test, type ProblemDef } from "./types.js";
import { routerProblem } from "./16-router.js";
import { REDUX_IMPORTS, reduxApp } from "./19-redux.js";

// Batch 3 for levels 16–20: more Medium/Hard practice. index.ts merges these into the
// matching category banks.

const click = (name: string, role = "button") => `fireEvent.click(screen.getByRole(${JSON.stringify(role)}, { name: ${JSON.stringify(name)} }));`;
const items = `screen.queryAllByRole("listitem").map((el) => el.textContent)`;
const FREEZE = `const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };`;
const reset = (store: string) => `const store = userExports.${store};\nassert(store && store.getInitialState, "Export your store as ${store}");\nstore.setState(store.getInitialState(), true);`;

const ROUTER_IMPORTS = `import { useState } from "react";\nimport { MemoryRouter, Routes, Route, Link, NavLink, Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";`;

export const routerMore: ProblemDef[] = [
  {
    slug: "router-breadcrumbs-from-url",
    title: "Breadcrumbs From the Current URL",
    difficulty: "MEDIUM",
    tags: ["router", "useLocation", "accessibility"],
    estimatedMinutes: 20,
    description:
      "Build an exported `Breadcrumbs` component that derives its trail from `useLocation().pathname`:\n\n- `<nav aria-label=\"Breadcrumb\">` with an `<ol>`\n- the first item is always `Home` (linking to `/`)\n- one item per path segment, labelled with the segment's hyphens turned into spaces and its first letter capitalised (`running-shoes` → `Running shoes`), linking to the path up to that segment\n- the **last** item is plain text with `aria-current=\"page\"` instead of a link (on `/`, that's Home)\n\n`AppRoutes` (provided) renders `<Breadcrumbs />` above the page.",
    requirements: ["Trail derived from the URL", "Cumulative link targets", "Last item is the current page"],
    hints: [
      "const segments = pathname.split(\"/\").filter(Boolean);",
      "The link for segment i is \"/\" + segments.slice(0, i + 1).join(\"/\").",
      "Build one array of { label, to } starting with Home, then treat the last entry specially.",
    ],
    starterCode: routerProblem(
      ROUTER_IMPORTS,
      `export function Breadcrumbs() {\n  // Write your solution here\n  return null;\n}\n\n// Provided\nfunction AppRoutes() {\n  return (\n    <>\n      <Breadcrumbs />\n      <Routes>\n        <Route path="*" element={<p>Page content</p>} />\n      </Routes>\n    </>\n  );\n}`
    ),
    solutionCode: routerProblem(
      ROUTER_IMPORTS,
      `const label = (segment: string) => {\n  const words = segment.replace(/-/g, " ");\n  return words.charAt(0).toUpperCase() + words.slice(1);\n};\n\nexport function Breadcrumbs() {\n  const { pathname } = useLocation();\n  const segments = pathname.split("/").filter(Boolean);\n  const crumbs = [\n    { label: "Home", to: "/" },\n    ...segments.map((s, i) => ({ label: label(s), to: "/" + segments.slice(0, i + 1).join("/") })),\n  ];\n\n  return (\n    <nav aria-label="Breadcrumb">\n      <ol>\n        {crumbs.map((c, i) => (\n          <li key={c.to}>\n            {i === crumbs.length - 1 ? <span aria-current="page">{c.label}</span> : <Link to={c.to}>{c.label}</Link>}\n          </li>\n        ))}\n      </ol>\n    </nav>\n  );\n}\n\n// Provided\nfunction AppRoutes() {\n  return (\n    <>\n      <Breadcrumbs />\n      <Routes>\n        <Route path="*" element={<p>Page content</p>} />\n      </Routes>\n    </>\n  );\n}`
    ),
    explanation: "The URL already encodes where the user is, so the breadcrumb trail can be derived from it instead of being maintained separately — and it updates automatically on every navigation.",
    tests: [
      test(
        "builds the trail",
        `renderComponent({ initialPath: "/shop/shoes/running-shoes" });\nconst nav = screen.getByRole("navigation", { name: "Breadcrumb" });\nassertEqual(within(nav).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]), [["Home", "/"], ["Shop", "/shop"], ["Shoes", "/shop/shoes"]]);\nassertEqual(nav.querySelector("[aria-current=page]").textContent, "Running shoes");`
      ),
      hidden(
        "home page and navigation",
        `renderComponent({ initialPath: "/" });\nconst nav = screen.getByRole("navigation", { name: "Breadcrumb" });\nassertEqual(within(nav).queryAllByRole("link").length, 0);\nassertEqual(nav.querySelector("[aria-current=page]").textContent, "Home");`
      ),
      hidden(
        "updates when navigating",
        `renderComponent({ initialPath: "/docs/getting-started" });\n${click("Docs", "link")}\nconst nav = screen.getByRole("navigation", { name: "Breadcrumb" });\nassertEqual(nav.querySelector("[aria-current=page]").textContent, "Docs");\nassertEqual(within(nav).getAllByRole("link").map((a) => a.textContent), ["Home"]);`
      ),
    ],
  },
  {
    slug: "router-index-redirect",
    title: "Redirect an Index Route",
    difficulty: "MEDIUM",
    tags: ["router", "nested-routes", "navigate"],
    estimatedMinutes: 15,
    description:
      "Build a settings area with tabs:\n\n- `/settings` renders a layout with `<h1>Settings</h1>`, `NavLink`s `Profile` (`profile`) and `Security` (`security`), and an `<Outlet />`\n- `/settings/profile` → `<h2>Profile settings</h2>`; `/settings/security` → `<h2>Security settings</h2>`\n- visiting `/settings` itself must **redirect** to `/settings/profile` (so the Profile tab is active and the URL is shareable), replacing the history entry",
    requirements: ["Nested tab routes", "/settings redirects to /settings/profile", "Active tab is marked"],
    hints: ["An index route renders at the parent's own path: <Route index element={...} />", "<Navigate to=\"profile\" replace /> redirects relative to the parent route."],
    starterCode: routerProblem(ROUTER_IMPORTS, `function AppRoutes() {\n  // Write your routes here\n  return null;\n}`),
    solutionCode: routerProblem(
      ROUTER_IMPORTS,
      `function SettingsLayout() {\n  return (\n    <div>\n      <h1>Settings</h1>\n      <nav>\n        <NavLink to="profile">Profile</NavLink>\n        <NavLink to="security">Security</NavLink>\n      </nav>\n      <Outlet />\n    </div>\n  );\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/settings" element={<SettingsLayout />}>\n        <Route index element={<Navigate to="profile" replace />} />\n        <Route path="profile" element={<h2>Profile settings</h2>} />\n        <Route path="security" element={<h2>Security settings</h2>} />\n      </Route>\n    </Routes>\n  );\n}`
    ),
    explanation: "Redirecting the index route (instead of rendering the profile page at /settings) keeps one canonical URL per tab, so the active-tab styling, bookmarks, and the back button all agree.",
    tests: [
      test("redirects to the profile tab", `renderComponent({ initialPath: "/settings" });\nscreen.getByRole("heading", { level: 2, name: "Profile settings" });\nassertEqual(screen.getByRole("link", { name: "Profile" }).getAttribute("aria-current"), "page");`),
      hidden("switches tabs and supports direct links", `renderComponent({ initialPath: "/settings" });\n${click("Security", "link")}\nscreen.getByRole("heading", { level: 2, name: "Security settings" });\nscreen.getByRole("heading", { level: 1, name: "Settings" });\nassertEqual(screen.getByRole("link", { name: "Profile" }).getAttribute("aria-current"), null);`),
    ],
    wrongSolutions: [
      routerProblem(
        ROUTER_IMPORTS,
        `function SettingsLayout() { return (<div><h1>Settings</h1><nav><NavLink to="profile">Profile</NavLink><NavLink to="security">Security</NavLink></nav><Outlet /></div>); }\nfunction AppRoutes() { return (<Routes><Route path="/settings" element={<SettingsLayout />}><Route index element={<h2>Profile settings</h2>} /><Route path="profile" element={<h2>Profile settings</h2>} /><Route path="security" element={<h2>Security settings</h2>} /></Route></Routes>); }`
      ),
    ],
  },
  {
    slug: "router-search-url-sync",
    title: "Keep a Search Box in Sync With the URL",
    difficulty: "HARD",
    tags: ["router", "useSearchParams", "url-state", "forms"],
    estimatedMinutes: 25,
    description:
      "At `/search`, `SearchPage` shows an input labelled `Search` and a `<ul>` of the provided `BOOKS` whose title contains the query (case-insensitive). The query lives **only** in the URL as `?q=...`:\n\n- on load, the input shows the `q` parameter\n- typing updates `q`, using `{ replace: true }` so each keystroke doesn't add a history entry\n- clearing the input removes the `q` parameter entirely\n\nThe provided `LocationDisplay` shows the current query string so you can see it change.",
    requirements: ["Input initialised from ?q", "Typing updates ?q without new history entries", "Empty query removes the param"],
    hints: [
      "const [searchParams, setSearchParams] = useSearchParams(); const q = searchParams.get(\"q\") ?? \"\";",
      "Controlled input: value={q}, onChange sets the param.",
      "setSearchParams(value ? { q: value } : {}, { replace: true })",
    ],
    starterCode: routerProblem(
      ROUTER_IMPORTS,
      `const BOOKS = ["Dune", "Emma", "Dracula", "Middlemarch"];\n\nfunction LocationDisplay() {\n  return <p data-testid="location">{useLocation().search}</p>;\n}\n\nfunction SearchPage() {\n  // Write your solution here\n  return null;\n}\n\nfunction AppRoutes() {\n  return (\n    <>\n      <Routes>\n        <Route path="/search" element={<SearchPage />} />\n      </Routes>\n      <LocationDisplay />\n    </>\n  );\n}`
    ),
    solutionCode: routerProblem(
      ROUTER_IMPORTS,
      `const BOOKS = ["Dune", "Emma", "Dracula", "Middlemarch"];\n\nfunction LocationDisplay() {\n  return <p data-testid="location">{useLocation().search}</p>;\n}\n\nfunction SearchPage() {\n  const [searchParams, setSearchParams] = useSearchParams();\n  const q = searchParams.get("q") ?? "";\n  const results = BOOKS.filter((b) => b.toLowerCase().includes(q.toLowerCase()));\n\n  return (\n    <div>\n      <label>\n        Search{" "}\n        <input value={q} onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} />\n      </label>\n      <ul>\n        {results.map((b) => (\n          <li key={b}>{b}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nfunction AppRoutes() {\n  return (\n    <>\n      <Routes>\n        <Route path="/search" element={<SearchPage />} />\n      </Routes>\n      <LocationDisplay />\n    </>\n  );\n}`
    ),
    explanation: "Using the URL as the only source of truth means search results can be shared and survive a refresh. `replace: true` keeps the back button useful: it goes to the previous page, not the previous keystroke.",
    tests: [
      test("reads the query from the URL", `renderComponent({ initialPath: "/search?q=dr" });\nassertEqual(screen.getByLabelText("Search").value, "dr");\nassertEqual(${items}, ["Dracula"]);`),
      hidden(
        "typing updates the URL, clearing removes it",
        `renderComponent({ initialPath: "/search" });\nassertEqual(${items}.length, 4);\nawait userEvent.type(screen.getByLabelText("Search"), "UN");\nassertEqual(screen.getByTestId("location").textContent, "?q=UN");\nassertEqual(${items}, ["Dune"]);\nawait userEvent.clear(screen.getByLabelText("Search"));\nassertEqual(screen.getByTestId("location").textContent, "");`
      ),
    ],
    wrongSolutions: [
      routerProblem(
        ROUTER_IMPORTS,
        `const BOOKS = ["Dune", "Emma", "Dracula", "Middlemarch"];\nfunction LocationDisplay() { return <p data-testid="location">{useLocation().search}</p>; }\nfunction SearchPage() {\n  const [params] = useSearchParams();\n  const [q, setQ] = useState(params.get("q") ?? "");\n  const results = BOOKS.filter((b) => b.toLowerCase().includes(q.toLowerCase()));\n  return (<div><label>Search <input value={q} onChange={(e) => setQ(e.target.value)} /></label><ul>{results.map((b) => <li key={b}>{b}</li>)}</ul></div>);\n}\nfunction AppRoutes() { return (<><Routes><Route path="/search" element={<SearchPage />} /></Routes><LocationDisplay /></>); }`
      ),
    ],
  },
];

export const contextMore: ProblemDef[] = [
  {
    slug: "context-notifications-center",
    title: "Notifications Context",
    difficulty: "MEDIUM",
    tags: ["context", "custom-hooks", "lists"],
    estimatedMinutes: 20,
    description:
      "Export `NotificationsProvider` and `useNotifications()`, which returns `{ items, notify(text), dismiss(id), clearAll() }` (items are `{ id, text }`).\n\nThe provided components use it from different branches: `Composer` sends pings, `Bell` shows the count, and `Inbox` lists the notifications with `Dismiss` buttons and a `Clear all` button.",
    requirements: ["Provider owns the list", "notify/dismiss/clearAll work", "All consumers stay in sync"],
    hints: ["Keep items in useState inside the provider; generate ids with a counter.", "dismiss filters by id; clearAll sets []."],
    starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface Notification {\n  id: number;\n  text: string;\n}\n\ninterface NotificationsValue {\n  items: Notification[];\n  notify: (text: string) => void;\n  dismiss: (id: number) => void;\n  clearAll: () => void;\n}\n\nexport function NotificationsProvider({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n\nexport function useNotifications(): NotificationsValue {\n  return { items: [], notify: () => {}, dismiss: () => {}, clearAll: () => {} };\n}\n\n// Provided\nfunction Composer() {\n  const { notify } = useNotifications();\n  const [n, setN] = useState(1);\n  return <button onClick={() => { notify("Ping #" + n); setN(n + 1); }}>Send ping</button>;\n}\n\nfunction Bell() {\n  const { items } = useNotifications();\n  return <button aria-label={"Notifications: " + items.length}>🔔 {items.length}</button>;\n}\n\nfunction Inbox() {\n  const { items, dismiss, clearAll } = useNotifications();\n  return (\n    <section>\n      <ul>\n        {items.map((i) => (\n          <li key={i.id}>\n            {i.text} <button onClick={() => dismiss(i.id)}>Dismiss {i.text}</button>\n          </li>\n        ))}\n      </ul>\n      <button onClick={clearAll}>Clear all</button>\n    </section>\n  );\n}\n\nexport default function App() {\n  return (\n    <NotificationsProvider>\n      <header><Bell /></header>\n      <main><Composer /><Inbox /></main>\n    </NotificationsProvider>\n  );\n}\n`,
    solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface Notification {\n  id: number;\n  text: string;\n}\n\ninterface NotificationsValue {\n  items: Notification[];\n  notify: (text: string) => void;\n  dismiss: (id: number) => void;\n  clearAll: () => void;\n}\n\nconst NotificationsContext = createContext<NotificationsValue | null>(null);\nlet nextId = 1;\n\nexport function NotificationsProvider({ children }: { children: ReactNode }) {\n  const [items, setItems] = useState<Notification[]>([]);\n  const value: NotificationsValue = {\n    items,\n    notify: (text) => setItems((list) => [...list, { id: nextId++, text }]),\n    dismiss: (id) => setItems((list) => list.filter((i) => i.id !== id)),\n    clearAll: () => setItems([]),\n  };\n  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;\n}\n\nexport function useNotifications(): NotificationsValue {\n  const ctx = useContext(NotificationsContext);\n  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");\n  return ctx;\n}\n\n// Provided\nfunction Composer() {\n  const { notify } = useNotifications();\n  const [n, setN] = useState(1);\n  return <button onClick={() => { notify("Ping #" + n); setN(n + 1); }}>Send ping</button>;\n}\n\nfunction Bell() {\n  const { items } = useNotifications();\n  return <button aria-label={"Notifications: " + items.length}>🔔 {items.length}</button>;\n}\n\nfunction Inbox() {\n  const { items, dismiss, clearAll } = useNotifications();\n  return (\n    <section>\n      <ul>\n        {items.map((i) => (\n          <li key={i.id}>\n            {i.text} <button onClick={() => dismiss(i.id)}>Dismiss {i.text}</button>\n          </li>\n        ))}\n      </ul>\n      <button onClick={clearAll}>Clear all</button>\n    </section>\n  );\n}\n\nexport default function App() {\n  return (\n    <NotificationsProvider>\n      <header><Bell /></header>\n      <main><Composer /><Inbox /></main>\n    </NotificationsProvider>\n  );\n}\n`,
    explanation: "One provider owns the notification list; the bell, the composer and the inbox each read just what they need through the hook, with no props connecting them.",
    tests: [
      test("sends and counts", `renderComponent();\n${click("Send ping")}\n${click("Send ping")}\n${click("Send ping")}\nscreen.getByRole("button", { name: "Notifications: 3" });\nassertEqual(screen.getAllByRole("listitem").length, 3);`),
      hidden("dismiss and clear all", `renderComponent();\n${click("Send ping")}\n${click("Send ping")}\n${click("Dismiss Ping #1")}\nscreen.getByRole("button", { name: "Notifications: 1" });\nassertEqual(screen.getAllByRole("listitem").length, 1);\n${click("Clear all")}\nscreen.getByRole("button", { name: "Notifications: 0" });`),
    ],
  },
  {
    slug: "context-feature-flags",
    title: "Feature Flags With Context",
    difficulty: "MEDIUM",
    tags: ["context", "custom-hooks", "conditional-rendering"],
    estimatedMinutes: 20,
    description:
      "Build a tiny feature-flag system:\n\n- export `FlagsProvider({ flags, children })` where `flags` is `Record<string, boolean>`\n- export `useFlag(name)`: `true` only if the flag is set to `true` (missing flags are off, and it works without a provider)\n- export `Feature({ name, children, fallback = null })`: renders `children` when the flag is on, otherwise `fallback`\n\nThe provided `App({ flags })` uses `<Feature name=\"newCheckout\" fallback={<p>Classic checkout</p>}><p>New checkout</p></Feature>`.",
    requirements: ["Flags from context", "Missing flags are off", "Feature renders children or fallback"],
    hints: ["createContext<Record<string, boolean>>({}) gives a safe default.", "useFlag: return useContext(FlagsContext)[name] === true;"],
    starterCode: `import { createContext, useContext, type ReactNode } from "react";\n\nexport function FlagsProvider({ flags, children }: { flags: Record<string, boolean>; children: ReactNode }) {\n  return <>{children}</>;\n}\n\nexport function useFlag(name: string): boolean {\n  return false;\n}\n\nexport function Feature({ name, children, fallback = null }: { name: string; children: ReactNode; fallback?: ReactNode }) {\n  return null;\n}\n\n// Provided\nexport default function App({ flags }: { flags: Record<string, boolean> }) {\n  return (\n    <FlagsProvider flags={flags}>\n      <Feature name="newCheckout" fallback={<p>Classic checkout</p>}>\n        <p>New checkout</p>\n      </Feature>\n    </FlagsProvider>\n  );\n}\n`,
    solutionCode: `import { createContext, useContext, type ReactNode } from "react";\n\nconst FlagsContext = createContext<Record<string, boolean>>({});\n\nexport function FlagsProvider({ flags, children }: { flags: Record<string, boolean>; children: ReactNode }) {\n  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;\n}\n\nexport function useFlag(name: string): boolean {\n  return useContext(FlagsContext)[name] === true;\n}\n\nexport function Feature({ name, children, fallback = null }: { name: string; children: ReactNode; fallback?: ReactNode }) {\n  return <>{useFlag(name) ? children : fallback}</>;\n}\n\n// Provided\nexport default function App({ flags }: { flags: Record<string, boolean> }) {\n  return (\n    <FlagsProvider flags={flags}>\n      <Feature name="newCheckout" fallback={<p>Classic checkout</p>}>\n        <p>New checkout</p>\n      </Feature>\n    </FlagsProvider>\n  );\n}\n`,
    explanation: "Feature flags let you ship code switched off and turn it on per user or environment. A hook for logic and a component for markup cover both ways of using them.",
    tests: [
      test("flag on shows the new feature", `renderComponent({ flags: { newCheckout: true } });\nexpectText("New checkout");\nexpectNoText("Classic checkout");`),
      hidden("flag off or missing shows the fallback", `const { rerender } = renderComponent({ flags: { newCheckout: false } });\nexpectText("Classic checkout");\nrerender(<Component flags={{}} />);\nexpectText("Classic checkout");`),
      hidden("useFlag works with and without a provider", `const { useFlag, FlagsProvider } = userExports;\nassertEqual(renderHook(() => useFlag("x")).result.current, false);\nconst wrapper = ({ children }) => <FlagsProvider flags={{ x: true, y: false }}>{children}</FlagsProvider>;\nassertEqual(renderHook(() => [useFlag("x"), useFlag("y"), useFlag("z")], { wrapper }).result.current, [true, false, false]);`),
    ],
  },
  {
    slug: "context-permissions",
    title: "Role-Based Permissions With Context",
    difficulty: "HARD",
    tags: ["context", "authorization", "custom-hooks"],
    estimatedMinutes: 25,
    description:
      "Build a permissions layer:\n\n- the provided `PERMISSIONS` maps each role to its allowed actions\n- export `PermissionsProvider({ role, children })`\n- export `useCan(action)`: whether the current role may perform `action` (unknown actions are not allowed)\n- export `Can({ action, children })`: renders children only if allowed\n\nThe provided `App` keeps the role in state (starts as `viewer`), offers `View as admin/editor/viewer` buttons, and wraps `Edit`, `Publish` and `Delete` buttons in `<Can>`.",
    requirements: ["Permissions derived from the role in context", "Can hides disallowed UI", "Changing role updates everything"],
    hints: ["Provide the role (or the allowed actions) through context.", "useCan: PERMISSIONS[role]?.includes(action) ?? false"],
    starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ntype Role = "admin" | "editor" | "viewer";\n\nconst PERMISSIONS: Record<Role, string[]> = {\n  admin: ["edit", "publish", "delete"],\n  editor: ["edit", "publish"],\n  viewer: [],\n};\n\nexport function PermissionsProvider({ role, children }: { role: Role; children: ReactNode }) {\n  return <>{children}</>;\n}\n\nexport function useCan(action: string): boolean {\n  return false;\n}\n\nexport function Can({ action, children }: { action: string; children: ReactNode }) {\n  return null;\n}\n\n// Provided\nexport default function App() {\n  const [role, setRole] = useState<Role>("viewer");\n  return (\n    <PermissionsProvider role={role}>\n      <p>Role: {role}</p>\n      {(["admin", "editor", "viewer"] as Role[]).map((r) => (\n        <button key={r} onClick={() => setRole(r)}>View as {r}</button>\n      ))}\n      <div aria-label="Actions" role="group">\n        <Can action="edit"><button>Edit</button></Can>\n        <Can action="publish"><button>Publish</button></Can>\n        <Can action="delete"><button>Delete</button></Can>\n      </div>\n    </PermissionsProvider>\n  );\n}\n`,
    solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ntype Role = "admin" | "editor" | "viewer";\n\nconst PERMISSIONS: Record<Role, string[]> = {\n  admin: ["edit", "publish", "delete"],\n  editor: ["edit", "publish"],\n  viewer: [],\n};\n\nconst RoleContext = createContext<Role>("viewer");\n\nexport function PermissionsProvider({ role, children }: { role: Role; children: ReactNode }) {\n  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;\n}\n\nexport function useCan(action: string): boolean {\n  const role = useContext(RoleContext);\n  return PERMISSIONS[role]?.includes(action) ?? false;\n}\n\nexport function Can({ action, children }: { action: string; children: ReactNode }) {\n  return useCan(action) ? <>{children}</> : null;\n}\n\n// Provided\nexport default function App() {\n  const [role, setRole] = useState<Role>("viewer");\n  return (\n    <PermissionsProvider role={role}>\n      <p>Role: {role}</p>\n      {(["admin", "editor", "viewer"] as Role[]).map((r) => (\n        <button key={r} onClick={() => setRole(r)}>View as {r}</button>\n      ))}\n      <div aria-label="Actions" role="group">\n        <Can action="edit"><button>Edit</button></Can>\n        <Can action="publish"><button>Publish</button></Can>\n        <Can action="delete"><button>Delete</button></Can>\n      </div>\n    </PermissionsProvider>\n  );\n}\n`,
    explanation: "Centralizing 'who can do what' in one map and one hook keeps permission checks consistent across the app. As always, hiding UI is only UX — the server must enforce the same rules.",
    tests: [
      test("viewer sees no actions; editor sees two", `renderComponent();\nconst actions = () => within(screen.getByRole("group", { name: "Actions" })).queryAllByRole("button").map((b) => b.textContent);\nassertEqual(actions(), []);\n${click("View as editor")}\nassertEqual(actions(), ["Edit", "Publish"]);`),
      hidden("admin sees everything; useCan rejects unknown actions", `renderComponent();\n${click("View as admin")}\nassertEqual(within(screen.getByRole("group", { name: "Actions" })).getAllByRole("button").map((b) => b.textContent), ["Edit", "Publish", "Delete"]);\nconst { PermissionsProvider, useCan } = userExports;\nconst wrapper = ({ children }) => <PermissionsProvider role="admin">{children}</PermissionsProvider>;\nassertEqual(renderHook(() => [useCan("delete"), useCan("launch-rockets")], { wrapper }).result.current, [true, false]);`),
    ],
  },
];

export const useReducerMore: ProblemDef[] = [
  {
    slug: "reducer-validating-wizard",
    title: "A Wizard Reducer That Validates",
    difficulty: "MEDIUM",
    tags: ["useReducer", "forms", "validation"],
    estimatedMinutes: 25,
    description:
      "Export `wizardReducer` for state `{ step: 1 | 2 | 3, name, email, error }` with actions:\n\n- `{ type: \"changed\", field: \"name\" | \"email\", value }` — update the field and clear the error\n- `{ type: \"next\" }` — on step 1 require a non-blank name (error `Name is required`), on step 2 require an email containing `@` (error `Enter a valid email`); otherwise advance\n- `{ type: \"back\" }` — go back a step (not below 1)\n- `{ type: \"reset\" }` — start over\n\n`Wizard` (default) shows `<p>Step {n} of 3</p>`, the field for the step (labelled `Name` / `Email`), the error as `role=\"alert\"`, `Back`/`Next` buttons, and on step 3 `<p>{name} &lt;{email}&gt;</p>` with a `Start over` button.",
    requirements: ["Validation lives in the reducer", "Errors block advancing", "Back and reset"],
    hints: ["Keep validation in the 'next' case so the UI just dispatches.", "Return { ...state, error: \"...\" } instead of advancing when invalid."],
    starterCode: `import { useReducer } from "react";\n\ninterface State {\n  step: 1 | 2 | 3;\n  name: string;\n  email: string;\n  error: string | null;\n}\ntype Action = { type: "changed"; field: "name" | "email"; value: string } | { type: "next" } | { type: "back" } | { type: "reset" };\n\nconst initial: State = { step: 1, name: "", email: "", error: null };\n\nexport function wizardReducer(state: State, action: Action): State {\n  return state;\n}\n\nfunction Wizard() {\n  return null;\n}\n\nexport default Wizard;\n`,
    solutionCode: `import { useReducer } from "react";\n\ninterface State {\n  step: 1 | 2 | 3;\n  name: string;\n  email: string;\n  error: string | null;\n}\ntype Action = { type: "changed"; field: "name" | "email"; value: string } | { type: "next" } | { type: "back" } | { type: "reset" };\n\nconst initial: State = { step: 1, name: "", email: "", error: null };\n\nexport function wizardReducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "changed":\n      return { ...state, [action.field]: action.value, error: null };\n    case "next":\n      if (state.step === 1 && !state.name.trim()) return { ...state, error: "Name is required" };\n      if (state.step === 2 && !state.email.includes("@")) return { ...state, error: "Enter a valid email" };\n      return { ...state, step: Math.min(3, state.step + 1) as State["step"], error: null };\n    case "back":\n      return { ...state, step: Math.max(1, state.step - 1) as State["step"], error: null };\n    case "reset":\n      return initial;\n  }\n}\n\nfunction Wizard() {\n  const [state, dispatch] = useReducer(wizardReducer, initial);\n  const field = state.step === 1 ? "name" : "email";\n\n  return (\n    <div>\n      <p>Step {state.step} of 3</p>\n      {state.step < 3 ? (\n        <>\n          <label>\n            {field === "name" ? "Name" : "Email"}{" "}\n            <input value={state[field]} onChange={(e) => dispatch({ type: "changed", field, value: e.target.value })} />\n          </label>\n          {state.error && <p role="alert">{state.error}</p>}\n          <button disabled={state.step === 1} onClick={() => dispatch({ type: "back" })}>Back</button>\n          <button onClick={() => dispatch({ type: "next" })}>Next</button>\n        </>\n      ) : (\n        <>\n          <p>\n            {state.name} &lt;{state.email}&gt;\n          </p>\n          <button onClick={() => dispatch({ type: "back" })}>Back</button>\n          <button onClick={() => dispatch({ type: "reset" })}>Start over</button>\n        </>\n      )}\n    </div>\n  );\n}\n\nexport default Wizard;\n`,
    explanation: "Putting validation in the reducer makes the rules testable without rendering anything, and keeps the component a thin layer that just dispatches intent.",
    tests: [
      test("walks through with validation", `renderComponent();\n${click("Next")}\nexpectText("Name is required");\nawait userEvent.type(screen.getByLabelText("Name"), "Ana");\nassert(!screen.queryByRole("alert"), "Typing should clear the error");\n${click("Next")}\nawait userEvent.type(screen.getByLabelText("Email"), "ana");\n${click("Next")}\nexpectText("Enter a valid email");\nawait userEvent.type(screen.getByLabelText("Email"), "@x.io");\n${click("Next")}\nexpectText("Ana <ana@x.io>");`),
      hidden("reducer rules", `${FREEZE}\nconst { wizardReducer } = userExports;\nconst s = deepFreeze({ step: 2, name: "A", email: "bad", error: null });\nassertEqual(wizardReducer(s, { type: "next" }), { step: 2, name: "A", email: "bad", error: "Enter a valid email" });\nassertEqual(wizardReducer(s, { type: "back" }).step, 1);\nassertEqual(wizardReducer(deepFreeze({ step: 1, name: "", email: "", error: null }), { type: "back" }).step, 1);\nassertEqual(wizardReducer(s, { type: "reset" }), { step: 1, name: "", email: "", error: null });`),
    ],
  },
  {
    slug: "reducer-catalog-filters",
    title: "Catalog Filters Reducer",
    difficulty: "MEDIUM",
    tags: ["useReducer", "filters", "derived-state"],
    estimatedMinutes: 25,
    description:
      "Export `filtersReducer` for state `{ categories: string[], maxPrice: number | null, inStockOnly: boolean }` with actions `categoryToggled` (`category`), `maxPriceSet` (`value: number | null`), `inStockToggled`, and `cleared`.\n\n`Catalog` (default) renders a checkbox per category (`Books`, `Games`, `Toys`), a number input labelled `Max price` (empty = no limit), a checkbox `In stock only`, a `Clear filters` button, and the matching `PRODUCTS` names as `<li>`s. No selected categories means all categories.",
    requirements: ["All filters combine", "Empty category selection means all", "Clear resets everything"],
    hints: ["categoryToggled: add if missing, remove if present.", "Filter during render: product passes if every active filter accepts it."],
    starterCode: `import { useReducer } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Dune", category: "Books", price: 12, inStock: true },\n  { id: 2, name: "Chess", category: "Games", price: 30, inStock: false },\n  { id: 3, name: "Kite", category: "Toys", price: 18, inStock: true },\n  { id: 4, name: "Atlas", category: "Books", price: 45, inStock: true },\n];\n\ninterface Filters {\n  categories: string[];\n  maxPrice: number | null;\n  inStockOnly: boolean;\n}\ntype Action = { type: "categoryToggled"; category: string } | { type: "maxPriceSet"; value: number | null } | { type: "inStockToggled" } | { type: "cleared" };\n\nexport const initialFilters: Filters = { categories: [], maxPrice: null, inStockOnly: false };\n\nexport function filtersReducer(state: Filters, action: Action): Filters {\n  return state;\n}\n\nfunction Catalog() {\n  return null;\n}\n\nexport default Catalog;\n`,
    solutionCode: `import { useReducer } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Dune", category: "Books", price: 12, inStock: true },\n  { id: 2, name: "Chess", category: "Games", price: 30, inStock: false },\n  { id: 3, name: "Kite", category: "Toys", price: 18, inStock: true },\n  { id: 4, name: "Atlas", category: "Books", price: 45, inStock: true },\n];\nconst CATEGORIES = ["Books", "Games", "Toys"];\n\ninterface Filters {\n  categories: string[];\n  maxPrice: number | null;\n  inStockOnly: boolean;\n}\ntype Action = { type: "categoryToggled"; category: string } | { type: "maxPriceSet"; value: number | null } | { type: "inStockToggled" } | { type: "cleared" };\n\nexport const initialFilters: Filters = { categories: [], maxPrice: null, inStockOnly: false };\n\nexport function filtersReducer(state: Filters, action: Action): Filters {\n  switch (action.type) {\n    case "categoryToggled":\n      return {\n        ...state,\n        categories: state.categories.includes(action.category)\n          ? state.categories.filter((c) => c !== action.category)\n          : [...state.categories, action.category],\n      };\n    case "maxPriceSet":\n      return { ...state, maxPrice: action.value };\n    case "inStockToggled":\n      return { ...state, inStockOnly: !state.inStockOnly };\n    case "cleared":\n      return initialFilters;\n  }\n}\n\nfunction Catalog() {\n  const [filters, dispatch] = useReducer(filtersReducer, initialFilters);\n  const visible = PRODUCTS.filter(\n    (p) =>\n      (filters.categories.length === 0 || filters.categories.includes(p.category)) &&\n      (filters.maxPrice === null || p.price <= filters.maxPrice) &&\n      (!filters.inStockOnly || p.inStock)\n  );\n\n  return (\n    <div>\n      {CATEGORIES.map((c) => (\n        <label key={c}>\n          <input type="checkbox" checked={filters.categories.includes(c)} onChange={() => dispatch({ type: "categoryToggled", category: c })} /> {c}\n        </label>\n      ))}\n      <label>\n        Max price{" "}\n        <input\n          type="number"\n          value={filters.maxPrice ?? ""}\n          onChange={(e) => dispatch({ type: "maxPriceSet", value: e.target.value === "" ? null : Number(e.target.value) })}\n        />\n      </label>\n      <label>\n        <input type="checkbox" checked={filters.inStockOnly} onChange={() => dispatch({ type: "inStockToggled" })} /> In stock only\n      </label>\n      <button onClick={() => dispatch({ type: "cleared" })}>Clear filters</button>\n      <ul>\n        {visible.map((p) => (\n          <li key={p.id}>{p.name}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default Catalog;\n`,
    explanation: "The reducer stores only the user's choices; the visible list is derived from them on every render, so the filters and the list can never disagree.",
    tests: [
      test("filters combine", `renderComponent();\nfireEvent.click(screen.getByRole("checkbox", { name: "Books" }));\nassertEqual(${items}, ["Dune", "Atlas"]);\nfireEvent.change(screen.getByLabelText("Max price"), { target: { value: "20" } });\nassertEqual(${items}, ["Dune"]);`),
      hidden("in-stock, clearing, and the reducer", `renderComponent();\nfireEvent.click(screen.getByRole("checkbox", { name: "In stock only" }));\nassertEqual(${items}, ["Dune", "Kite", "Atlas"]);\nfireEvent.click(screen.getByRole("checkbox", { name: "Games" }));\nassertEqual(${items}, []);\n${click("Clear filters")}\nassertEqual(${items}.length, 4);\n${FREEZE}\nconst { filtersReducer } = userExports;\nconst s = deepFreeze({ categories: ["Books"], maxPrice: 10, inStockOnly: false });\nassertEqual(filtersReducer(s, { type: "categoryToggled", category: "Books" }).categories, []);\nassertEqual(filtersReducer(s, { type: "categoryToggled", category: "Toys" }).categories, ["Books", "Toys"]);`),
    ],
  },
  {
    slug: "reducer-auto-retry",
    title: "Automatic Retries With a Reducer",
    difficulty: "HARD",
    tags: ["useReducer", "api", "retry", "useEffect"],
    type: "API",
    estimatedMinutes: 30,
    description:
      "`StatusWidget({ retryDelayMs = 500 })` loads `GET /api/status` (returns `{ message }`). If a request fails (non-OK), it **retries automatically** after `retryDelayMs`, up to **3 attempts in total**. After the third failure it shows `<p role=\"alert\">Gave up after 3 attempts</p>` and a `Try again` button that starts a fresh round of 3 attempts.\n\nWhile loading show `<p>Loading (attempt {n})...</p>`; on success show `<p>{message}</p>`.\n\nModel it with a reducer: state `{ status: \"loading\" | \"success\" | \"failed\", attempt, message }` and actions like `succeeded`, `attemptFailed`, `restarted`. An effect keyed on the attempt number performs each request.",
    requirements: ["Up to 3 attempts with a delay between them", "Success at any attempt shows the message", "Try again restarts the cycle"],
    hints: [
      "attemptFailed: if attempt < 3, increment attempt (still loading); otherwise status = failed.",
      "useEffect on [state.attempt, state.status]: when loading, wait (except on attempt 1) then fetch; ignore results after cleanup.",
      "restarted resets to { status: \"loading\", attempt: 1 } — but if attempt was already 1, the effect won't re-run unless something it depends on changes. A `round` counter in state solves that.",
    ],
    starterCode: `import { useEffect, useReducer } from "react";\n\nfunction StatusWidget({ retryDelayMs = 500 }: { retryDelayMs?: number }) {\n  // Write your solution here\n  return null;\n}\n\nexport default StatusWidget;\n`,
    solutionCode: `import { useEffect, useReducer } from "react";\n\nconst MAX_ATTEMPTS = 3;\n\ninterface State {\n  status: "loading" | "success" | "failed";\n  attempt: number;\n  round: number;\n  message: string | null;\n}\ntype Action = { type: "succeeded"; message: string } | { type: "attemptFailed" } | { type: "restarted" };\n\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "succeeded":\n      return { ...state, status: "success", message: action.message };\n    case "attemptFailed":\n      return state.attempt < MAX_ATTEMPTS ? { ...state, attempt: state.attempt + 1 } : { ...state, status: "failed" };\n    case "restarted":\n      return { status: "loading", attempt: 1, round: state.round + 1, message: null };\n  }\n}\n\nfunction StatusWidget({ retryDelayMs = 500 }: { retryDelayMs?: number }) {\n  const [state, dispatch] = useReducer(reducer, { status: "loading", attempt: 1, round: 0, message: null });\n\n  useEffect(() => {\n    if (state.status !== "loading") return;\n    let ignore = false;\n    const timer = setTimeout(\n      async () => {\n        try {\n          const res = await fetch("/api/status");\n          if (!res.ok) throw new Error();\n          const data: { message: string } = await res.json();\n          if (!ignore) dispatch({ type: "succeeded", message: data.message });\n        } catch {\n          if (!ignore) dispatch({ type: "attemptFailed" });\n        }\n      },\n      state.attempt === 1 ? 0 : retryDelayMs\n    );\n    return () => {\n      ignore = true;\n      clearTimeout(timer);\n    };\n  }, [state.attempt, state.round, state.status, retryDelayMs]);\n\n  if (state.status === "success") return <p>{state.message}</p>;\n  if (state.status === "failed") {\n    return (\n      <div>\n        <p role="alert">Gave up after {MAX_ATTEMPTS} attempts</p>\n        <button onClick={() => dispatch({ type: "restarted" })}>Try again</button>\n      </div>\n    );\n  }\n  return <p>Loading (attempt {state.attempt})...</p>;\n}\n\nexport default StatusWidget;\n`,
    explanation: "The reducer decides *whether* to retry; the effect only knows how to perform one attempt. Keying the effect on the attempt number (plus a round counter) makes each retry a fresh, cancellable request.",
    mockApi: [{ url: "/api/status", status: 503, response: { error: "busy" } }],
    tests: [
      test("gives up after 3 attempts", `renderComponent({ retryDelayMs: 20 });\nawait waitFor(() => screen.getByRole("alert"), { timeout: 2000 });\nexpectText("Gave up after 3 attempts");\nassertEqual(mockApi.calls.length, 3);`),
      hidden("succeeds on a retry", `renderComponent({ retryDelayMs: 60 });\nawait waitFor(() => assertEqual(mockApi.calls.length, 1));\nmockApi.setRoutes([{ url: "/api/status", response: { message: "All systems go" } }]);\nawait waitFor(() => expectText("All systems go"), { timeout: 2000 });\nassertEqual(mockApi.calls.length, 2);`),
      hidden("try again starts a new round", `renderComponent({ retryDelayMs: 20 });\nawait waitFor(() => screen.getByRole("alert"), { timeout: 2000 });\nmockApi.setRoutes([{ url: "/api/status", response: { message: "Back up" } }]);\n${click("Try again")}\nawait waitFor(() => expectText("Back up"), { timeout: 2000 });\nassertEqual(mockApi.calls.length, 4);`),
    ],
  },
];

export const reduxMore: ProblemDef[] = [
  {
    slug: "redux-post-thunk",
    title: "Save Data With an Async Thunk",
    difficulty: "HARD",
    tags: ["redux", "createAsyncThunk", "api", "post"],
    type: "API",
    estimatedMinutes: 30,
    description:
      "Export `addTodo = createAsyncThunk(\"todos/add\", ...)` that sends `POST /api/todos` with JSON body `{ title }` and resolves with the created todo `{ id, title }` (reject on non-OK).\n\nExport `todosSlice` (`name: \"todos\"`, state `{ items: [], status: \"idle\" | \"saving\" | \"failed\" }`) handling the thunk's pending/fulfilled/rejected.\n\n`Todos` has an input labelled `New todo` and an `Add` button that shows `Saving...` and is disabled while saving; it appends the server's todo, clears the input on success, and shows `<p role=\"alert\">Could not save</p>` on failure.",
    requirements: ["Thunk posts JSON", "Status tracked in the slice", "UI reflects saving/failed/success"],
    hints: [
      "createAsyncThunk(\"todos/add\", async (title: string) => { const res = await fetch(..., { method: \"POST\", headers: {...}, body: JSON.stringify({ title }) }); ... })",
      "await dispatch(addTodo(title)).unwrap() throws on rejection — handy for clearing the input only on success.",
    ],
    starterCode: `${REDUX_IMPORTS}\nimport { createAsyncThunk } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: number;\n  title: string;\n}\n\nexport const addTodo = createAsyncThunk("todos/add", async (title: string): Promise<Todo> => {\n  throw new Error("not implemented");\n});\n\nexport const todosSlice = createSlice({\n  name: "todos",\n  initialState: { items: [] as Todo[], status: "idle" as "idle" | "saving" | "failed" },\n  reducers: {},\n});\n\nexport function Todos() {\n  return null;\n}\n\n${reduxApp("Todos", "{ todos: todosSlice.reducer }")}`,
    solutionCode: `${REDUX_IMPORTS}\nimport { createAsyncThunk } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: number;\n  title: string;\n}\n\nexport const addTodo = createAsyncThunk("todos/add", async (title: string): Promise<Todo> => {\n  const res = await fetch("/api/todos", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ title }),\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n});\n\nexport const todosSlice = createSlice({\n  name: "todos",\n  initialState: { items: [] as Todo[], status: "idle" as "idle" | "saving" | "failed" },\n  reducers: {},\n  extraReducers: (builder) => {\n    builder\n      .addCase(addTodo.pending, (state) => {\n        state.status = "saving";\n      })\n      .addCase(addTodo.fulfilled, (state, action) => {\n        state.status = "idle";\n        state.items.push(action.payload);\n      })\n      .addCase(addTodo.rejected, (state) => {\n        state.status = "failed";\n      });\n  },\n});\n\ntype AppDispatch = ReturnType<typeof makeStore>["dispatch"];\n\nexport function Todos() {\n  const dispatch = useDispatch<AppDispatch>();\n  const { items, status } = useSelector((state: RootState) => state.todos);\n  const [title, setTitle] = useState("");\n\n  async function add() {\n    if (!title.trim()) return;\n    try {\n      await dispatch(addTodo(title.trim())).unwrap();\n      setTitle("");\n    } catch {\n      // status is "failed"; the alert explains\n    }\n  }\n\n  return (\n    <div>\n      <label>\n        New todo <input value={title} onChange={(e) => setTitle(e.target.value)} />\n      </label>\n      <button disabled={status === "saving"} onClick={add}>\n        {status === "saving" ? "Saving..." : "Add"}\n      </button>\n      {status === "failed" && <p role="alert">Could not save</p>}\n      <ul>\n        {items.map((t) => (\n          <li key={t.id}>{t.title}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\n${reduxApp("Todos", "{ todos: todosSlice.reducer }")}`,
    explanation: "Writes follow the same pending/fulfilled/rejected lifecycle as reads. `unwrap()` lets a component react to the outcome locally (clearing its input) while the slice tracks the shared status.",
    mockApi: [{ method: "POST", url: "/api/todos", delayMs: 30, status: 201, response: { id: 42, title: "Server todo" } }],
    tests: [
      test("saves through the API", `renderComponent();\nawait userEvent.type(screen.getByLabelText("New todo"), "Write tests");\n${click("Add")}\nassert(screen.getByRole("button", { name: "Saving..." }).disabled);\nawait waitFor(() => expectText("Server todo"));\nassertEqual(screen.getByLabelText("New todo").value, "");\nassertEqual(mockApi.calls[0].body, { title: "Write tests" });`),
      hidden("failure keeps the input and shows an error", `mockApi.setRoutes([{ method: "POST", url: "/api/todos", status: 500, response: {} }]);\nrenderComponent();\nawait userEvent.type(screen.getByLabelText("New todo"), "Oops");\n${click("Add")}\nawait waitFor(() => screen.getByRole("alert"));\nassertEqual(screen.getByLabelText("New todo").value, "Oops");\nassertEqual(screen.queryAllByRole("listitem").length, 0);`),
    ],
  },
  {
    slug: "redux-parameterized-selectors",
    title: "Selectors With Arguments",
    difficulty: "MEDIUM",
    tags: ["redux", "selectors", "createSelector"],
    estimatedMinutes: 20,
    description:
      "The provided `postsSlice` holds posts `{ id, title, tags }`. Export:\n\n- `selectPostById(state, id)` → the post or `undefined`\n- `selectPostsByTag(state, tag)` → posts with that tag, built with `createSelector` so the same state and tag return the **same array**\n\n`TagBrowser` (default) shows buttons `react`, `redux`, `css` and the titles of the posts for the selected tag (`react` initially) as `<li>`s.",
    requirements: ["Selectors take extra arguments", "Memoized per state and tag", "UI uses the selector"],
    hints: ["createSelector([selectPosts, (_state, tag: string) => tag], (posts, tag) => ...)", "useSelector((state) => selectPostsByTag(state, tag))"],
    starterCode: `${REDUX_IMPORTS}\nimport { createSelector } from "@reduxjs/toolkit";\n\ninterface Post {\n  id: number;\n  title: string;\n  tags: string[];\n}\n\nconst postsSlice = createSlice({\n  name: "posts",\n  initialState: [\n    { id: 1, title: "Hooks in depth", tags: ["react"] },\n    { id: 2, title: "Slices explained", tags: ["redux", "react"] },\n    { id: 3, title: "Grid layouts", tags: ["css"] },\n  ] as Post[],\n  reducers: {},\n});\n\nexport const selectPostById = (state: RootState, id: number): Post | undefined => undefined;\nexport const selectPostsByTag = (state: RootState, tag: string): Post[] => [];\n\nexport function TagBrowser() {\n  return null;\n}\n\n${reduxApp("TagBrowser", "{ posts: postsSlice.reducer }")}`,
    solutionCode: `${REDUX_IMPORTS}\nimport { createSelector } from "@reduxjs/toolkit";\n\ninterface Post {\n  id: number;\n  title: string;\n  tags: string[];\n}\n\nconst postsSlice = createSlice({\n  name: "posts",\n  initialState: [\n    { id: 1, title: "Hooks in depth", tags: ["react"] },\n    { id: 2, title: "Slices explained", tags: ["redux", "react"] },\n    { id: 3, title: "Grid layouts", tags: ["css"] },\n  ] as Post[],\n  reducers: {},\n});\n\nconst selectPosts = (state: RootState) => state.posts;\n\nexport const selectPostById = (state: RootState, id: number): Post | undefined => selectPosts(state).find((p) => p.id === id);\n\nexport const selectPostsByTag = createSelector([selectPosts, (_state: RootState, tag: string) => tag], (posts, tag) =>\n  posts.filter((p) => p.tags.includes(tag))\n);\n\nconst TAGS = ["react", "redux", "css"];\n\nexport function TagBrowser() {\n  const [tag, setTag] = useState("react");\n  const posts = useSelector((state: RootState) => selectPostsByTag(state, tag));\n  return (\n    <div>\n      {TAGS.map((t) => (\n        <button key={t} aria-pressed={t === tag} onClick={() => setTag(t)}>\n          {t}\n        </button>\n      ))}\n      <ul>\n        {posts.map((p) => (\n          <li key={p.id}>{p.title}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\n${reduxApp("TagBrowser", "{ posts: postsSlice.reducer }")}`,
    explanation: "Extra selector arguments become additional input selectors. createSelector then memoizes on the state slice *and* the argument, so components re-render only when their result really changes.",
    tests: [
      test("filters by tag", `renderComponent();\nassertEqual(${items}, ["Hooks in depth", "Slices explained"]);\n${click("css")}\nassertEqual(${items}, ["Grid layouts"]);`),
      hidden("selectors", `const store = userExports.makeStore();\nconst state = store.getState();\nassertEqual(userExports.selectPostById(state, 3)?.title, "Grid layouts");\nassertEqual(userExports.selectPostById(state, 99), undefined);\nconst a = userExports.selectPostsByTag(state, "redux");\nassert(a === userExports.selectPostsByTag(state, "redux"), "selectPostsByTag should return the same array for the same state and tag");\nassertEqual(a.map((p) => p.id), [2]);`),
    ],
  },
  {
    slug: "redux-custom-middleware",
    title: "Write a Redux Middleware",
    difficulty: "HARD",
    tags: ["redux", "middleware", "architecture"],
    estimatedMinutes: 25,
    description:
      "Middleware sits between `dispatch` and the reducers. Export `analyticsMiddleware` that records the `type` of every action whose type starts with `cart/` into the exported `trackedEvents` array — and still passes **every** action on to the next middleware (returning its result).\n\nThen add it to the store in the provided `makeStore` with `middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(analyticsMiddleware)`.\n\nThe provided `Cart` has `Add item` and `Toggle theme` buttons.",
    requirements: ["Only cart/ actions are tracked", "Every action still reaches the reducers", "Middleware registered in the store"],
    hints: ["Middleware shape: (storeApi) => (next) => (action) => { ...; return next(action); }", "Check typeof action.type === \"string\" before startsWith."],
    starterCode: `${REDUX_IMPORTS}\nimport type { Middleware } from "@reduxjs/toolkit";\n\nexport const trackedEvents: string[] = [];\n\nexport const analyticsMiddleware: Middleware = () => (next) => (action) => {\n  // record cart/ actions, then pass the action on\n};\n\nexport const cartSlice = createSlice({\n  name: "cart",\n  initialState: { count: 0 },\n  reducers: { itemAdded: (state) => { state.count += 1; } },\n});\n\nexport const themeSlice = createSlice({\n  name: "theme",\n  initialState: "light" as "light" | "dark",\n  reducers: { toggled: (state) => (state === "light" ? "dark" : "light") },\n});\n\nexport function makeStore() {\n  return configureStore({ reducer: { cart: cartSlice.reducer, theme: themeSlice.reducer } });\n}\ntype RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;\n\nfunction Cart() {\n  const dispatch = useDispatch();\n  const count = useSelector((s: RootState) => s.cart.count);\n  const theme = useSelector((s: RootState) => s.theme);\n  return (\n    <div>\n      <p>Items: {count} · Theme: {theme}</p>\n      <button onClick={() => dispatch(cartSlice.actions.itemAdded())}>Add item</button>\n      <button onClick={() => dispatch(themeSlice.actions.toggled())}>Toggle theme</button>\n    </div>\n  );\n}\n\nexport default function App() {\n  const [store] = useState(makeStore);\n  return (\n    <Provider store={store}>\n      <Cart />\n    </Provider>\n  );\n}\n`,
    solutionCode: `${REDUX_IMPORTS}\nimport type { Middleware } from "@reduxjs/toolkit";\n\nexport const trackedEvents: string[] = [];\n\nexport const analyticsMiddleware: Middleware = () => (next) => (action) => {\n  const type = (action as { type?: unknown }).type;\n  if (typeof type === "string" && type.startsWith("cart/")) trackedEvents.push(type);\n  return next(action);\n};\n\nexport const cartSlice = createSlice({\n  name: "cart",\n  initialState: { count: 0 },\n  reducers: { itemAdded: (state) => { state.count += 1; } },\n});\n\nexport const themeSlice = createSlice({\n  name: "theme",\n  initialState: "light" as "light" | "dark",\n  reducers: { toggled: (state) => (state === "light" ? "dark" : "light") },\n});\n\nexport function makeStore() {\n  return configureStore({\n    reducer: { cart: cartSlice.reducer, theme: themeSlice.reducer },\n    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(analyticsMiddleware),\n  });\n}\ntype RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;\n\nfunction Cart() {\n  const dispatch = useDispatch();\n  const count = useSelector((s: RootState) => s.cart.count);\n  const theme = useSelector((s: RootState) => s.theme);\n  return (\n    <div>\n      <p>Items: {count} · Theme: {theme}</p>\n      <button onClick={() => dispatch(cartSlice.actions.itemAdded())}>Add item</button>\n      <button onClick={() => dispatch(themeSlice.actions.toggled())}>Toggle theme</button>\n    </div>\n  );\n}\n\nexport default function App() {\n  const [store] = useState(makeStore);\n  return (\n    <Provider store={store}>\n      <Cart />\n    </Provider>\n  );\n}\n`,
    explanation: "Middleware intercepts every dispatched action, which makes it the right place for cross-cutting concerns like analytics, logging, or crash reporting. Forgetting `return next(action)` silently stops actions from ever reaching the reducers.",
    tests: [
      test("tracks cart actions and still updates state", `const before = userExports.trackedEvents.length;\nrenderComponent();\n${click("Add item")}\n${click("Toggle theme")}\n${click("Add item")}\nexpectText("Items: 2 · Theme: dark");\nassertEqual(userExports.trackedEvents.slice(before), ["cart/itemAdded", "cart/itemAdded"]);`),
      hidden("passes actions through and returns the result", `const store = userExports.makeStore();\nconst before = userExports.trackedEvents.length;\nconst result = store.dispatch(userExports.themeSlice.actions.toggled());\nassertEqual(result.type, "theme/toggled", "dispatch should return the action (return next(action))");\nassertEqual(store.getState().theme, "dark");\nassertEqual(userExports.trackedEvents.length, before);`),
    ],
    wrongSolutions: [
      `${REDUX_IMPORTS}\nexport const trackedEvents = [];\nexport const analyticsMiddleware = () => (next) => (action) => { trackedEvents.push(action.type); return next(action); };\nexport const cartSlice = createSlice({ name: "cart", initialState: { count: 0 }, reducers: { itemAdded: (s) => { s.count += 1; } } });\nexport const themeSlice = createSlice({ name: "theme", initialState: "light", reducers: { toggled: (s) => (s === "light" ? "dark" : "light") } });\nexport function makeStore() { return configureStore({ reducer: { cart: cartSlice.reducer, theme: themeSlice.reducer }, middleware: (g) => g().concat(analyticsMiddleware) }); }\nfunction Cart() { const d = useDispatch(); const c = useSelector((s) => s.cart.count); const t = useSelector((s) => s.theme); return (<div><p>Items: {c} · Theme: {t}</p><button onClick={() => d(cartSlice.actions.itemAdded())}>Add item</button><button onClick={() => d(themeSlice.actions.toggled())}>Toggle theme</button></div>); }\nexport default function App() { const [store] = useState(makeStore); return <Provider store={store}><Cart /></Provider>; }\n`,
    ],
  },
];

export const zustandMore: ProblemDef[] = [
  {
    slug: "zustand-slices-pattern",
    title: "Split a Store Into Slices",
    difficulty: "MEDIUM",
    tags: ["zustand", "architecture", "slices"],
    estimatedMinutes: 20,
    description:
      "Large stores are easier to manage as slices. Export two slice creators and combine them:\n\n- `createFishSlice(set, get)` → `{ fishes: 10, addFish() }`\n- `createBearSlice(set, get)` → `{ bears: 0, addBear(), feedBears() }` where `feedBears` gives one fish to each bear: it subtracts `bears` from `fishes` (never below 0) — reading the other slice with `get()`\n- `useZooStore = create((...a) => ({ ...createFishSlice(...a), ...createBearSlice(...a) }))`\n\n`Zoo` (default) shows `<p>Bears: {b} · Fishes: {f}</p>` and buttons `Add bear`, `Add fish`, `Feed bears`.",
    requirements: ["Two slice creators combined into one store", "Slices can read each other via get()"],
    hints: ["A slice creator is just (set, get) => ({ ...state, ...actions }).", "feedBears: set((s) => ({ fishes: Math.max(0, s.fishes - s.bears) }))"],
    starterCode: `import { create, type StateCreator } from "zustand";\n\ninterface FishSlice {\n  fishes: number;\n  addFish: () => void;\n}\ninterface BearSlice {\n  bears: number;\n  addBear: () => void;\n  feedBears: () => void;\n}\ntype ZooState = FishSlice & BearSlice;\n\n// export const createFishSlice: StateCreator<ZooState, [], [], FishSlice> = ...\n// export const createBearSlice: StateCreator<ZooState, [], [], BearSlice> = ...\n// export const useZooStore = create<ZooState>()(...)\n\nfunction Zoo() {\n  return null;\n}\n\nexport default Zoo;\n`,
    solutionCode: `import { create, type StateCreator } from "zustand";\n\ninterface FishSlice {\n  fishes: number;\n  addFish: () => void;\n}\ninterface BearSlice {\n  bears: number;\n  addBear: () => void;\n  feedBears: () => void;\n}\ntype ZooState = FishSlice & BearSlice;\n\nexport const createFishSlice: StateCreator<ZooState, [], [], FishSlice> = (set) => ({\n  fishes: 10,\n  addFish: () => set((s) => ({ fishes: s.fishes + 1 })),\n});\n\nexport const createBearSlice: StateCreator<ZooState, [], [], BearSlice> = (set) => ({\n  bears: 0,\n  addBear: () => set((s) => ({ bears: s.bears + 1 })),\n  feedBears: () => set((s) => ({ fishes: Math.max(0, s.fishes - s.bears) })),\n});\n\nexport const useZooStore = create<ZooState>()((...a) => ({\n  ...createFishSlice(...a),\n  ...createBearSlice(...a),\n}));\n\nfunction Zoo() {\n  const bears = useZooStore((s) => s.bears);\n  const fishes = useZooStore((s) => s.fishes);\n  const addBear = useZooStore((s) => s.addBear);\n  const addFish = useZooStore((s) => s.addFish);\n  const feedBears = useZooStore((s) => s.feedBears);\n  return (\n    <div>\n      <p>Bears: {bears} · Fishes: {fishes}</p>\n      <button onClick={addBear}>Add bear</button>\n      <button onClick={addFish}>Add fish</button>\n      <button onClick={feedBears}>Feed bears</button>\n    </div>\n  );\n}\n\nexport default Zoo;\n`,
    explanation: "Each slice creator receives the same set/get for the whole store, so slices can live in separate files yet still read and update each other's state.",
    tests: [
      test("adds and feeds", `${reset("useZooStore")}\nrenderComponent();\n${click("Add bear")}\n${click("Add bear")}\n${click("Feed bears")}\nexpectText("Bears: 2 · Fishes: 8");`),
      hidden("slices are exported and fishes never go negative", `${reset("useZooStore")}\nassert(typeof userExports.createFishSlice === "function" && typeof userExports.createBearSlice === "function", "Export both slice creators");\nconst s = store.getState();\nfor (let i = 0; i < 6; i++) s.addBear();\nstore.getState().feedBears();\nstore.getState().feedBears();\nassertEqual(store.getState().fishes, 0);`),
    ],
  },
  {
    slug: "zustand-derived-selectors",
    title: "Derived Values With Selectors",
    difficulty: "MEDIUM",
    tags: ["zustand", "selectors", "derived-state"],
    estimatedMinutes: 20,
    description:
      "Export `useBasketStore` with `items: { id, name, price, qty }[]`, `addItem(product)` (increments `qty` if present) and `removeItem(id)`.\n\nDon't store totals. Instead export pure selectors `selectItemCount(state)` (sum of quantities) and `selectTotal(state)` (sum of price × qty), and use them in `Basket` (default), which shows `<p>Items: {n}</p>`, `<p>Total: ${total}</p>` (two decimals), and buttons `Add apple` ($0.50) and `Add bread` ($2.25).",
    requirements: ["Totals are derived, not stored", "Selectors are exported pure functions", "addItem increments existing lines"],
    hints: ["export const selectTotal = (s: BasketState) => s.items.reduce(...)", "useBasketStore(selectTotal) — a number is compared by value, so no extra re-renders."],
    starterCode: `import { create } from "zustand";\n\ninterface Item {\n  id: string;\n  name: string;\n  price: number;\n  qty: number;\n}\ninterface BasketState {\n  items: Item[];\n  addItem: (p: Omit<Item, "qty">) => void;\n  removeItem: (id: string) => void;\n}\n\n// export const useBasketStore = ...\n// export const selectItemCount = ...\n// export const selectTotal = ...\n\nfunction Basket() {\n  return null;\n}\n\nexport default Basket;\n`,
    solutionCode: `import { create } from "zustand";\n\ninterface Item {\n  id: string;\n  name: string;\n  price: number;\n  qty: number;\n}\ninterface BasketState {\n  items: Item[];\n  addItem: (p: Omit<Item, "qty">) => void;\n  removeItem: (id: string) => void;\n}\n\nexport const useBasketStore = create<BasketState>()((set) => ({\n  items: [],\n  addItem: (p) =>\n    set((s) =>\n      s.items.some((i) => i.id === p.id)\n        ? { items: s.items.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)) }\n        : { items: [...s.items, { ...p, qty: 1 }] }\n    ),\n  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),\n}));\n\nexport const selectItemCount = (s: BasketState) => s.items.reduce((n, i) => n + i.qty, 0);\nexport const selectTotal = (s: BasketState) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0);\n\nfunction Basket() {\n  const count = useBasketStore(selectItemCount);\n  const total = useBasketStore(selectTotal);\n  const addItem = useBasketStore((s) => s.addItem);\n  return (\n    <div>\n      <p>Items: {count}</p>\n      <p>Total: \${total.toFixed(2)}</p>\n      <button onClick={() => addItem({ id: "apple", name: "Apple", price: 0.5 })}>Add apple</button>\n      <button onClick={() => addItem({ id: "bread", name: "Bread", price: 2.25 })}>Add bread</button>\n    </div>\n  );\n}\n\nexport default Basket;\n`,
    explanation: "Selectors that compute primitives (counts, totals) keep the store minimal and only re-render components when the computed value actually changes.",
    tests: [
      test("totals", `${reset("useBasketStore")}\nrenderComponent();\n${click("Add apple")}\n${click("Add apple")}\n${click("Add bread")}\nexpectText("Items: 3");\nexpectText("Total: $3.25");`),
      hidden("selectors are pure and nothing derived is stored", `${reset("useBasketStore")}\nconst { selectTotal, selectItemCount } = userExports;\nconst state = { items: [{ id: "a", name: "A", price: 2, qty: 3 }, { id: "b", name: "B", price: 1.5, qty: 2 }] };\nassertEqual([selectItemCount(state), selectTotal(state)], [5, 9]);\nstore.getState().addItem({ id: "x", name: "X", price: 1 });\nstore.getState().removeItem("x");\nassertEqual(Object.keys(store.getState()).sort(), ["addItem", "items", "removeItem"]);`),
    ],
  },
  {
    slug: "zustand-undo-history",
    title: "Undo and Redo in a Store",
    difficulty: "HARD",
    tags: ["zustand", "history", "undo"],
    estimatedMinutes: 25,
    description:
      "Export `useDrawingStore` for a list of shapes (strings) with history:\n\n- state `{ shapes: string[], past: string[][], future: string[][] }`\n- `addShape(shape)` — pushes the current `shapes` onto `past`, appends the shape, and **clears `future`**\n- `undo()` / `redo()` — move between snapshots (no-ops at the ends)\n\n`Drawing` (default) has buttons `Add circle`, `Add square`, `Undo` (disabled when nothing to undo), `Redo` (disabled when nothing to redo), and lists the shapes as `<li>`s.",
    requirements: ["Snapshots on every change", "Undo/redo move between them", "A new change clears redo", "Buttons disabled at the ends"],
    hints: ["undo: set((s) => s.past.length ? { shapes: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.shapes, ...s.future] } : s)", "redo is the mirror image of undo."],
    starterCode: `import { create } from "zustand";\n\ninterface DrawingState {\n  shapes: string[];\n  past: string[][];\n  future: string[][];\n  addShape: (shape: string) => void;\n  undo: () => void;\n  redo: () => void;\n}\n\n// export const useDrawingStore = ...\n\nfunction Drawing() {\n  return null;\n}\n\nexport default Drawing;\n`,
    solutionCode: `import { create } from "zustand";\n\ninterface DrawingState {\n  shapes: string[];\n  past: string[][];\n  future: string[][];\n  addShape: (shape: string) => void;\n  undo: () => void;\n  redo: () => void;\n}\n\nexport const useDrawingStore = create<DrawingState>()((set) => ({\n  shapes: [],\n  past: [],\n  future: [],\n  addShape: (shape) => set((s) => ({ past: [...s.past, s.shapes], shapes: [...s.shapes, shape], future: [] })),\n  undo: () =>\n    set((s) =>\n      s.past.length === 0 ? s : { shapes: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.shapes, ...s.future] }\n    ),\n  redo: () =>\n    set((s) => (s.future.length === 0 ? s : { shapes: s.future[0], past: [...s.past, s.shapes], future: s.future.slice(1) })),\n}));\n\nfunction Drawing() {\n  const shapes = useDrawingStore((s) => s.shapes);\n  const canUndo = useDrawingStore((s) => s.past.length > 0);\n  const canRedo = useDrawingStore((s) => s.future.length > 0);\n  const { addShape, undo, redo } = useDrawingStore.getState();\n  return (\n    <div>\n      <button onClick={() => addShape("circle")}>Add circle</button>\n      <button onClick={() => addShape("square")}>Add square</button>\n      <button disabled={!canUndo} onClick={undo}>Undo</button>\n      <button disabled={!canRedo} onClick={redo}>Redo</button>\n      <ul>\n        {shapes.map((s, i) => (\n          <li key={i}>{s}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default Drawing;\n`,
    explanation: "Snapshots work well with immutable updates: each state is a new array, so storing references to old ones is cheap and safe.",
    tests: [
      test("undo and redo", `${reset("useDrawingStore")}\nrenderComponent();\n${click("Add circle")}\n${click("Add square")}\n${click("Undo")}\nassertEqual(${items}, ["circle"]);\n${click("Redo")}\nassertEqual(${items}, ["circle", "square"]);`),
      hidden("new change clears redo; buttons disabled at the ends", `${reset("useDrawingStore")}\nrenderComponent();\nassert(screen.getByRole("button", { name: "Undo" }).disabled && screen.getByRole("button", { name: "Redo" }).disabled);\n${click("Add circle")}\n${click("Undo")}\n${click("Add square")}\nassert(screen.getByRole("button", { name: "Redo" }).disabled, "Adding a shape should clear the redo history");\nassertEqual(${items}, ["square"]);\n${click("Undo")}\nassertEqual(${items}, []);\nassert(screen.getByRole("button", { name: "Undo" }).disabled);`),
    ],
  },
];
