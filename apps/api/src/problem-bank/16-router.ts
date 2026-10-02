import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string, role = "button") => `fireEvent.click(screen.getByRole(${JSON.stringify(role)}, { name: ${JSON.stringify(name)} }));`;
const heading = (name: string) => `screen.getByRole("heading", { name: ${JSON.stringify(name)} });`;

/** The provided wrapper every router problem shares: in a real app this would be <BrowserRouter>. */
const APP = `// Provided — don't change. Real apps use <BrowserRouter>; MemoryRouter lets the tests pick a starting URL.
export default function App({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRoutes />
    </MemoryRouter>
  );
}
`;

export const routerProblem = (imports: string, body: string) => `${imports}\n\n${body.trim()}\n\n${APP}`;

export const router: CategoryBank = {
  category: "React Router",
  level: 16,
  type: "ARCHITECTURE",
  prerequisites: ["Components", "Props", "useState"],
  problems: [
    {
      slug: "router-basic-routes",
      title: "Create Routes",
      difficulty: "EASY",
      tags: ["router", "routes"],
      estimatedMinutes: 10,
      description:
        "React Router decides what to render based on the URL. Complete `AppRoutes` so that:\n\n- `/` renders `<h1>Home</h1>`\n- `/about` renders `<h1>About</h1>`\n\nThe provided `App` wraps your routes in a router — you only write `<Routes>` and `<Route>`s.",
      requirements: ["/ shows Home", "/about shows About"],
      hints: ["import { Routes, Route } from \"react-router-dom\";", "<Route path=\"/about\" element={<h1>About</h1>} />"],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route } from "react-router-dom";`, `function AppRoutes() {\n  // Write your routes here\n  return null;\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route } from "react-router-dom";`,
        `function AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/" element={<h1>Home</h1>} />\n      <Route path="/about" element={<h1>About</h1>} />\n    </Routes>\n  );\n}`
      ),
      explanation: "<Routes> looks at the current location and renders the element of the best-matching <Route>. Nothing else on the page needs to know which URL is active.",
      tests: [
        test("home route", `renderComponent({ initialPath: "/" });\n${heading("Home")}`),
        hidden("about route", `renderComponent({ initialPath: "/about" });\n${heading("About")}\nexpectNoText("Home");`),
      ],
      wrongSolutions: [routerProblem(`import { MemoryRouter } from "react-router-dom";`, `function AppRoutes() {\n  return <h1>Home</h1>;\n}`)],
    },
    {
      slug: "router-links",
      title: "Navigate With Links",
      difficulty: "EASY",
      tags: ["router", "link", "navigation"],
      estimatedMinutes: 10,
      description:
        "Add a `<nav>` above the routes with links `Home` (`/`), `Pricing` (`/pricing`) and `Contact` (`/contact`). Each route renders an `<h1>` with its name.\n\nUse React Router's `<Link>` — a plain `<a href>` would reload the whole page and throw away all React state.",
      requirements: ["Three links in a nav", "Clicking a link changes the page without a reload"],
      hints: ["import { Link } from \"react-router-dom\";", "<Link to=\"/pricing\">Pricing</Link>"],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route, Link } from "react-router-dom";`, `function AppRoutes() {\n  // Write your nav and routes here\n  return null;\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, Link } from "react-router-dom";`,
        `function AppRoutes() {\n  return (\n    <>\n      <nav>\n        <Link to="/">Home</Link>\n        <Link to="/pricing">Pricing</Link>\n        <Link to="/contact">Contact</Link>\n      </nav>\n      <Routes>\n        <Route path="/" element={<h1>Home</h1>} />\n        <Route path="/pricing" element={<h1>Pricing</h1>} />\n        <Route path="/contact" element={<h1>Contact</h1>} />\n      </Routes>\n    </>\n  );\n}`
      ),
      explanation: "<Link> renders a real <a> (so it's accessible and can open in a new tab) but intercepts the click and updates the URL through the router instead of reloading.",
      tests: [
        test("navigates to pricing", `renderComponent();\n${click("Pricing", "link")}\n${heading("Pricing")}`),
        hidden("navigates between pages", `renderComponent();\n${click("Contact", "link")}\n${heading("Contact")}\n${click("Home", "link")}\n${heading("Home")}\nassertEqual(within(screen.getByRole("navigation")).getAllByRole("link").map((a) => a.getAttribute("href")), ["/", "/pricing", "/contact"]);`),
      ],
      wrongSolutions: [routerProblem(`import { MemoryRouter, Routes, Route } from "react-router-dom";`, `function AppRoutes() {\n  return (<><nav><a href="/">Home</a><a href="/pricing">Pricing</a><a href="/contact">Contact</a></nav><Routes><Route path="/" element={<h1>Home</h1>} /><Route path="/pricing" element={<h1>Pricing</h1>} /><Route path="/contact" element={<h1>Contact</h1>} /></Routes></>);\n}`)],
    },
    {
      slug: "router-route-params",
      title: "Read a Route Parameter",
      difficulty: "EASY",
      tags: ["router", "params"],
      estimatedMinutes: 10,
      description:
        "Add a route `/users/:userId` that renders `UserPage`. `UserPage` reads the id with `useParams()` and renders `<h1>User #{userId}</h1>`. Export `UserPage`.",
      requirements: ["Dynamic segment :userId", "UserPage reads it with useParams"],
      hints: ["<Route path=\"/users/:userId\" element={<UserPage />} />", "const { userId } = useParams();"],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";`, `export function UserPage() {\n  return null;\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/" element={<h1>Users</h1>} />\n      {/* add the user route */}\n    </Routes>\n  );\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";`,
        `export function UserPage() {\n  const { userId } = useParams();\n  return <h1>User #{userId}</h1>;\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/" element={<h1>Users</h1>} />\n      <Route path="/users/:userId" element={<UserPage />} />\n    </Routes>\n  );\n}`
      ),
      explanation: "A `:name` segment matches any value, and useParams returns those values as strings. The same component serves every user.",
      tests: [
        test("shows the user id", `renderComponent({ initialPath: "/users/7" });\n${heading("User #7")}`),
        hidden("works for any id", `renderComponent({ initialPath: "/users/abc-123" });\n${heading("User #abc-123")}`),
      ],
      wrongSolutions: [routerProblem(`import { MemoryRouter, Routes, Route } from "react-router-dom";`, `export function UserPage() { return <h1>User #7</h1>; }\nfunction AppRoutes() { return (<Routes><Route path="/" element={<h1>Users</h1>} /><Route path="/users/:userId" element={<UserPage />} /></Routes>); }`)],
    },
    {
      slug: "router-not-found",
      title: "A 404 Page",
      difficulty: "EASY",
      tags: ["router", "404"],
      estimatedMinutes: 8,
      description: "Keep the `/` route and add a catch-all route that renders `<h1>Page not found</h1>` and a `<Link>` `Go home` back to `/`, for any URL that matches nothing else.",
      requirements: ["Unknown URLs show the 404 page", "Go home navigates to /"],
      hints: ["path=\"*\" matches anything.", "React Router ranks routes by specificity, so order doesn't matter."],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route, Link } from "react-router-dom";`, `function AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/" element={<h1>Home</h1>} />\n    </Routes>\n  );\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, Link } from "react-router-dom";`,
        `function NotFound() {\n  return (\n    <div>\n      <h1>Page not found</h1>\n      <Link to="/">Go home</Link>\n    </div>\n  );\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/" element={<h1>Home</h1>} />\n      <Route path="*" element={<NotFound />} />\n    </Routes>\n  );\n}`
      ),
      explanation: "The `*` route only wins when no more specific route matches, so it's a safe place for a 404 page.",
      tests: [
        test("unknown url shows 404", `renderComponent({ initialPath: "/nope" });\n${heading("Page not found")}`),
        hidden("go home works and home isn't a 404", `renderComponent({ initialPath: "/a/b/c" });\n${click("Go home", "link")}\n${heading("Home")}\nexpectNoText("Page not found");`),
      ],
    },
    {
      slug: "router-navlink-active",
      title: "Highlight the Active Link",
      difficulty: "EASY",
      tags: ["router", "navlink", "accessibility"],
      estimatedMinutes: 12,
      description:
        "Build a docs sidebar with `<NavLink>`s `Overview` (`/docs`), `Guides` (`/docs/guides`) and `API` (`/docs/api`), each route rendering an `<h1>` with its name. NavLink automatically adds `class=\"active\"` and `aria-current=\"page\"` to the link for the current page.\n\nCatch: by default a NavLink is also active on any URL **below** it, so `Overview` would light up on `/docs/guides` too. Make `Overview` active only on `/docs` exactly.",
      requirements: ["Current link has class 'active' and aria-current='page'", "Overview is not active on its child pages"],
      hints: ["import { NavLink } from \"react-router-dom\";", "The `end` prop makes a NavLink match only its exact path: <NavLink to=\"/docs\" end>"],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route, NavLink } from "react-router-dom";`, `function AppRoutes() {\n  // Write your nav and routes here\n  return null;\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, NavLink } from "react-router-dom";`,
        `function AppRoutes() {\n  return (\n    <>\n      <nav>\n        <NavLink to="/docs" end>Overview</NavLink>\n        <NavLink to="/docs/guides">Guides</NavLink>\n        <NavLink to="/docs/api">API</NavLink>\n      </nav>\n      <Routes>\n        <Route path="/docs" element={<h1>Overview</h1>} />\n        <Route path="/docs/guides" element={<h1>Guides</h1>} />\n        <Route path="/docs/api" element={<h1>API</h1>} />\n      </Routes>\n    </>\n  );\n}`
      ),
      explanation: "NavLink knows whether its route matches, and exposes that via class and aria-current — so sighted users and screen-reader users both learn where they are. Parent links stay active on child URLs (useful for top-level sections) unless you add `end`.",
      commonMistakes: ["Forgetting `end` on a section's index link, so it stays highlighted on every page in the section."],
      tests: [
        test("guides is active on /docs/guides", `renderComponent({ initialPath: "/docs/guides" });\nconst guides = screen.getByRole("link", { name: "Guides" });\nassertEqual(guides.getAttribute("aria-current"), "page");\nassert(guides.className.includes("active"));`),
        hidden("overview is only active on /docs", `renderComponent({ initialPath: "/docs/api" });\nassertEqual(screen.getByRole("link", { name: "Overview" }).getAttribute("aria-current"), null, "Overview must not be active on /docs/api — use the end prop");\n${click("Overview", "link")}\nassertEqual(screen.getByRole("link", { name: "Overview" }).getAttribute("aria-current"), "page");`),
      ],
      wrongSolutions: [routerProblem(`import { MemoryRouter, Routes, Route, NavLink } from "react-router-dom";`, `function AppRoutes() {\n  return (<><nav><NavLink to="/docs">Overview</NavLink><NavLink to="/docs/guides">Guides</NavLink><NavLink to="/docs/api">API</NavLink></nav><Routes><Route path="/docs" element={<h1>Overview</h1>} /><Route path="/docs/guides" element={<h1>Guides</h1>} /><Route path="/docs/api" element={<h1>API</h1>} /></Routes></>);\n}`)],
    },
    {
      slug: "router-nested-layout",
      title: "Nested Routes With a Layout",
      difficulty: "MEDIUM",
      tags: ["router", "nested-routes", "outlet", "layout"],
      estimatedMinutes: 15,
      description:
        "Build a dashboard with a shared layout. Export `DashboardLayout`, which renders `<h1>Dashboard</h1>`, a nav with links `Overview` (`/dashboard`) and `Settings` (`/dashboard/settings`), and an `<Outlet />` for the child page.\n\nRoutes:\n\n- `/dashboard` → layout + `<h2>Overview</h2>` (an **index** route)\n- `/dashboard/settings` → layout + `<h2>Settings</h2>`",
      requirements: ["The layout renders on both pages", "Child pages render in the Outlet", "/dashboard uses an index route"],
      hints: ["Nest <Route>s inside a parent <Route path=\"/dashboard\" element={<DashboardLayout />}>", "<Route index element={...} /> renders at the parent's own URL.", "<Outlet /> marks where the child goes."],
      starterCode: routerProblem(`import { MemoryRouter, Routes, Route, Link, Outlet } from "react-router-dom";`, `export function DashboardLayout() {\n  return null;\n}\n\nfunction AppRoutes() {\n  return <Routes>{/* routes */}</Routes>;\n}`),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, Link, Outlet } from "react-router-dom";`,
        `export function DashboardLayout() {\n  return (\n    <div>\n      <h1>Dashboard</h1>\n      <nav>\n        <Link to="/dashboard">Overview</Link>\n        <Link to="/dashboard/settings">Settings</Link>\n      </nav>\n      <Outlet />\n    </div>\n  );\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/dashboard" element={<DashboardLayout />}>\n        <Route index element={<h2>Overview</h2>} />\n        <Route path="settings" element={<h2>Settings</h2>} />\n      </Route>\n    </Routes>\n  );\n}`
      ),
      explanation: "Nested routes mirror nested UI: the parent route's element stays mounted while the <Outlet> swaps between children, so shared chrome (nav, header) isn't re-created on every navigation.",
      tests: [
        test("overview at /dashboard", `renderComponent({ initialPath: "/dashboard" });\nscreen.getByRole("heading", { level: 1, name: "Dashboard" });\nscreen.getByRole("heading", { level: 2, name: "Overview" });`),
        hidden("settings inside the layout", `renderComponent({ initialPath: "/dashboard" });\n${click("Settings", "link")}\nscreen.getByRole("heading", { level: 1, name: "Dashboard" });\nscreen.getByRole("heading", { level: 2, name: "Settings" });\nassert(!screen.queryByRole("heading", { level: 2, name: "Overview" }), "Overview should be replaced in the Outlet");`),
      ],
    },
    {
      slug: "router-programmatic-navigation",
      title: "Navigate After a Form Submit",
      difficulty: "MEDIUM",
      tags: ["router", "useNavigate", "forms"],
      estimatedMinutes: 15,
      description:
        "At `/signup`, render a form with an input labelled `Name` and a submit button `Create account`. On submit, navigate to `/welcome/{name}` with `useNavigate()`. That route renders `<h1>Welcome, {name}!</h1>`.",
      requirements: ["Submitting navigates in code", "The welcome page shows the name from the URL"],
      hints: ["const navigate = useNavigate(); navigate(`/welcome/${name}`);", "Remember event.preventDefault() in the submit handler.", "The welcome route reads the name with useParams."],
      starterCode: routerProblem(`import { useState, type FormEvent } from "react";\nimport { MemoryRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";`, `function AppRoutes() {\n  // Write your solution here\n  return null;\n}`),
      solutionCode: routerProblem(
        `import { useState, type FormEvent } from "react";\nimport { MemoryRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";`,
        `function SignupPage() {\n  const [name, setName] = useState("");\n  const navigate = useNavigate();\n\n  function handleSubmit(event: FormEvent) {\n    event.preventDefault();\n    navigate(\`/welcome/\${encodeURIComponent(name)}\`);\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label>\n        Name <input value={name} onChange={(e) => setName(e.target.value)} />\n      </label>\n      <button type="submit">Create account</button>\n    </form>\n  );\n}\n\nfunction WelcomePage() {\n  const { name } = useParams();\n  return <h1>Welcome, {name}!</h1>;\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/signup" element={<SignupPage />} />\n      <Route path="/welcome/:name" element={<WelcomePage />} />\n    </Routes>\n  );\n}`
      ),
      explanation: "<Link> is for navigation the user clicks; useNavigate is for navigation that happens as a result of logic, like a successful form submit.",
      tests: [
        test("navigates after submit", `renderComponent({ initialPath: "/signup" });\nawait userEvent.type(screen.getByLabelText("Name"), "Mira");\n${click("Create account")}\n${heading("Welcome, Mira!")}`),
        hidden("works for another name", `renderComponent({ initialPath: "/signup" });\nawait userEvent.type(screen.getByLabelText("Name"), "Jo");\n${click("Create account")}\n${heading("Welcome, Jo!")}\nassert(!screen.queryByLabelText("Name"), "The signup form should be gone after navigating");`),
      ],
    },
    {
      slug: "router-query-params",
      title: "Filter With Query Parameters",
      difficulty: "MEDIUM",
      tags: ["router", "useSearchParams", "url-state"],
      estimatedMinutes: 15,
      description:
        "At `/products`, render a `<select>` labelled `Category` (options `all`, `books`, `games`) and a `<ul>` of the `PRODUCTS` (provided) in that category. Store the category **in the URL** as `?category=...` with `useSearchParams`, so filtered views can be bookmarked and shared. No `category` param means `all`.",
      requirements: ["Reads the category from the URL", "Changing the select updates the URL and the list"],
      hints: ["const [searchParams, setSearchParams] = useSearchParams();", "const category = searchParams.get(\"category\") ?? \"all\";", "setSearchParams({ category: value })"],
      starterCode: routerProblem(
        `import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";`,
        `const PRODUCTS = [\n  { id: 1, name: "Dune", category: "books" },\n  { id: 2, name: "Tetris", category: "games" },\n  { id: 3, name: "Emma", category: "books" },\n];\n\nfunction ProductsPage() {\n  // Write your solution here\n  return null;\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/products" element={<ProductsPage />} />\n    </Routes>\n  );\n}`
      ),
      solutionCode: routerProblem(
        `import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";`,
        `const PRODUCTS = [\n  { id: 1, name: "Dune", category: "books" },\n  { id: 2, name: "Tetris", category: "games" },\n  { id: 3, name: "Emma", category: "books" },\n];\n\nfunction ProductsPage() {\n  const [searchParams, setSearchParams] = useSearchParams();\n  const category = searchParams.get("category") ?? "all";\n  const visible = PRODUCTS.filter((p) => category === "all" || p.category === category);\n\n  return (\n    <div>\n      <label>\n        Category\n        <select value={category} onChange={(e) => setSearchParams({ category: e.target.value })}>\n          <option value="all">all</option>\n          <option value="books">books</option>\n          <option value="games">games</option>\n        </select>\n      </label>\n      <ul>\n        {visible.map((p) => (\n          <li key={p.id}>{p.name}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nfunction AppRoutes() {\n  return (\n    <Routes>\n      <Route path="/products" element={<ProductsPage />} />\n    </Routes>\n  );\n}`
      ),
      explanation: "When state belongs in the URL (filters, search, pagination), the URL becomes the single source of truth — no useState needed, and refresh/back/share all just work.",
      tests: [
        test("reads the category from the URL", `renderComponent({ initialPath: "/products?category=books" });\nassertEqual(screen.getAllByRole("listitem").map((li) => li.textContent), ["Dune", "Emma"]);`),
        hidden("defaults to all and updates on change", `renderComponent({ initialPath: "/products" });\nassertEqual(screen.getAllByRole("listitem").length, 3);\nawait userEvent.selectOptions(screen.getByLabelText("Category"), "games");\nassertEqual(screen.getAllByRole("listitem").map((li) => li.textContent), ["Tetris"]);`),
      ],
      wrongSolutions: [routerProblem(
        `import { useState } from "react";\nimport { MemoryRouter, Routes, Route } from "react-router-dom";`,
        `const PRODUCTS = [{ id: 1, name: "Dune", category: "books" }, { id: 2, name: "Tetris", category: "games" }, { id: 3, name: "Emma", category: "books" }];\nfunction ProductsPage() {\n  const [category, setCategory] = useState("all");\n  const visible = PRODUCTS.filter((p) => category === "all" || p.category === category);\n  return (<div><label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">all</option><option value="books">books</option><option value="games">games</option></select></label><ul>{visible.map((p) => <li key={p.id}>{p.name}</li>)}</ul></div>);\n}\nfunction AppRoutes() { return <Routes><Route path="/products" element={<ProductsPage />} /></Routes>; }`
      )],
    },
    {
      slug: "router-protected-route",
      title: "Protected Route With Return URL",
      difficulty: "HARD",
      tags: ["router", "authentication", "redirect"],
      estimatedMinutes: 25,
      description:
        "`AppRoutes` keeps an `isLoggedIn` boolean in state (provided). Build:\n\n- `RequireAuth({ isLoggedIn, children })`: if logged out, redirect to `/login` with `<Navigate>`, remembering where the user was going in the navigation `state` (`{ from: location }`). Otherwise render children.\n- `/account` (protected) → `<h1>Your account</h1>`; `/billing` (protected) → `<h1>Billing</h1>`\n- `/login` → button `Log in` that calls `onLogin()` and then navigates back to the page the user originally wanted (default `/account`), replacing the login entry in history.",
      requirements: ["Logged-out users are redirected to /login", "After logging in, they land on the page they wanted", "Logged-in users see protected pages directly"],
      hints: [
        "const location = useLocation(); <Navigate to=\"/login\" replace state={{ from: location }} />",
        "In the login page: const from = location.state?.from?.pathname ?? \"/account\";",
        "navigate(from, { replace: true }) after onLogin().",
      ],
      starterCode: routerProblem(
        `import { useState, type ReactNode } from "react";\nimport { MemoryRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";`,
        `export function RequireAuth({ isLoggedIn, children }: { isLoggedIn: boolean; children: ReactNode }) {\n  return null;\n}\n\nfunction LoginPage({ onLogin }: { onLogin: () => void }) {\n  return null;\n}\n\nfunction AppRoutes() {\n  const [isLoggedIn, setIsLoggedIn] = useState(false);\n  return <Routes>{/* routes */}</Routes>;\n}`
      ),
      solutionCode: routerProblem(
        `import { useState, type ReactNode } from "react";\nimport { MemoryRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";`,
        `export function RequireAuth({ isLoggedIn, children }: { isLoggedIn: boolean; children: ReactNode }) {\n  const location = useLocation();\n  if (!isLoggedIn) {\n    return <Navigate to="/login" replace state={{ from: location }} />;\n  }\n  return <>{children}</>;\n}\n\nfunction LoginPage({ onLogin }: { onLogin: () => void }) {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const from: string = location.state?.from?.pathname ?? "/account";\n\n  return (\n    <button\n      onClick={() => {\n        onLogin();\n        navigate(from, { replace: true });\n      }}\n    >\n      Log in\n    </button>\n  );\n}\n\nfunction AppRoutes() {\n  const [isLoggedIn, setIsLoggedIn] = useState(false);\n  return (\n    <Routes>\n      <Route path="/login" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />\n      <Route path="/account" element={<RequireAuth isLoggedIn={isLoggedIn}><h1>Your account</h1></RequireAuth>} />\n      <Route path="/billing" element={<RequireAuth isLoggedIn={isLoggedIn}><h1>Billing</h1></RequireAuth>} />\n    </Routes>\n  );\n}`
      ),
      explanation: "Passing the attempted location through navigation state lets the login page send users back where they were going. `replace` keeps the login page out of the back-button history. (Hiding routes is UX only — the server must still enforce access.)",
      tests: [
        test("redirects to login", `renderComponent({ initialPath: "/account" });\nscreen.getByRole("button", { name: "Log in" });\nexpectNoText("Your account");`),
        hidden("returns to the requested page after login", `renderComponent({ initialPath: "/billing" });\n${click("Log in")}\n${heading("Billing")}`),
        hidden("defaults to /account", `renderComponent({ initialPath: "/login" });\n${click("Log in")}\n${heading("Your account")}`),
      ],
      wrongSolutions: [routerProblem(
        `import { useState } from "react";\nimport { MemoryRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";`,
        `export function RequireAuth({ isLoggedIn, children }) { return isLoggedIn ? <>{children}</> : <Navigate to="/login" />; }\nfunction LoginPage({ onLogin }) { const navigate = useNavigate(); return <button onClick={() => { onLogin(); navigate("/account"); }}>Log in</button>; }\nfunction AppRoutes() {\n  const [ok, setOk] = useState(false);\n  return (<Routes><Route path="/login" element={<LoginPage onLogin={() => setOk(true)} />} /><Route path="/account" element={<RequireAuth isLoggedIn={ok}><h1>Your account</h1></RequireAuth>} /><Route path="/billing" element={<RequireAuth isLoggedIn={ok}><h1>Billing</h1></RequireAuth>} /></Routes>);\n}`
      )],
    },
  ],
};
