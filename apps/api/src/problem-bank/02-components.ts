import { hidden, test, type CategoryBank } from "./types.js";

const exported = (name: string) =>
  `assert(typeof userExports.${name} === "function", "Export your ${name} component: export function ${name}() { ... }");`;

export const components: CategoryBank = {
  category: "Components",
  level: 2,
  type: "COMPONENT",
  prerequisites: ["JSX"],
  problems: [
    {
      slug: "comp-first-component",
      title: "Create Your First Component",
      difficulty: "BEGINNER",
      tags: ["components"],
      estimatedMinutes: 5,
      description:
        "Components let you split UI into reusable pieces.\n\n1. Create a component `Welcome` that returns `<h2>Welcome!</h2>`, and **export** it with `export function Welcome() { ... }`.\n2. Make `App` render `<Welcome />`.",
      requirements: ["A named export `Welcome` renders <h2>Welcome!</h2>", "App renders the Welcome component"],
      hints: [
        "Component names must start with a capital letter.",
        "Use a component like an HTML tag: <Welcome />",
      ],
      starterCode: `// Create and export the Welcome component here\n\nfunction App() {\n  // Render <Welcome /> here\n  return null;\n}\n\nexport default App;\n`,
      solutionCode: `export function Welcome() {\n  return <h2>Welcome!</h2>;\n}\n\nfunction App() {\n  return <Welcome />;\n}\n\nexport default App;\n`,
      explanation: "`<Welcome />` tells React to call your Welcome function and put whatever it returns in that spot.",
      commonMistakes: ["Naming the component `welcome` — lowercase tags are treated as HTML elements, not components."],
      tests: [
        test("App renders the welcome heading", `renderComponent();\nscreen.getByRole("heading", { level: 2, name: "Welcome!" });`),
        hidden("Welcome is its own exported component", `${exported("Welcome")}\nrender(<userExports.Welcome />);\nscreen.getByRole("heading", { level: 2, name: "Welcome!" });`),
      ],
      wrongSolutions: [`function App() {\n  return <h2>Welcome!</h2>;\n}\n\nexport default App;\n`],
    },
    {
      slug: "comp-reuse-component",
      title: "Reuse a Component",
      difficulty: "BEGINNER",
      tags: ["components", "reuse"],
      estimatedMinutes: 5,
      description:
        "Create and export a `Star` component that renders `<span>★</span>`. Then make `App` render **three** stars by using `<Star />` three times.",
      requirements: ["Star renders a single ★", "App renders three Star components"],
      hints: ["Write the component once and use it as many times as you like.", "<div><Star /><Star /><Star /></div>"],
      starterCode: `// Create and export Star here\n\nfunction App() {\n  // Render three stars\n  return null;\n}\n\nexport default App;\n`,
      solutionCode: `export function Star() {\n  return <span>★</span>;\n}\n\nfunction App() {\n  return (\n    <div>\n      <Star />\n      <Star />\n      <Star />\n    </div>\n  );\n}\n\nexport default App;\n`,
      explanation: "Every `<Star />` is a separate instance of the same component. Change Star once and all three update.",
      tests: [
        test("App renders three stars", `renderComponent();\nassertEqual(screen.getAllByText("★").length, 3);`),
        hidden("Star renders exactly one star", `${exported("Star")}\nconst { container } = render(<userExports.Star />);\nassertEqual(container.textContent, "★");`),
      ],
      wrongSolutions: [`export function Star() {\n  return <span>★★★</span>;\n}\n\nfunction App() {\n  return <Star />;\n}\n\nexport default App;\n`],
    },
    {
      slug: "comp-compose-page",
      title: "Compose a Page From Components",
      difficulty: "BEGINNER",
      tags: ["components", "composition", "semantic-html"],
      estimatedMinutes: 10,
      description:
        "Create and export three components:\n\n- `PageHeader` → `<header><h1>My Blog</h1></header>`\n- `PageContent` → `<main><p>First post coming soon.</p></main>`\n- `PageFooter` → `<footer><p>Thanks for reading</p></footer>`\n\nThen make `App` render them in that order.",
      requirements: ["Three exported components, each rendering its landmark", "App renders header, main and footer in order"],
      hints: ["Each component returns one landmark element.", "App returns a fragment or div containing all three."],
      starterCode: `// Create and export PageHeader, PageContent and PageFooter\n\nfunction App() {\n  return null;\n}\n\nexport default App;\n`,
      solutionCode: `export function PageHeader() {\n  return (\n    <header>\n      <h1>My Blog</h1>\n    </header>\n  );\n}\n\nexport function PageContent() {\n  return (\n    <main>\n      <p>First post coming soon.</p>\n    </main>\n  );\n}\n\nexport function PageFooter() {\n  return (\n    <footer>\n      <p>Thanks for reading</p>\n    </footer>\n  );\n}\n\nfunction App() {\n  return (\n    <>\n      <PageHeader />\n      <PageContent />\n      <PageFooter />\n    </>\n  );\n}\n\nexport default App;\n`,
      explanation: "Real apps are trees of components. Each one owns a slice of the UI, which makes them easier to read, test, and change.",
      tests: [
        test("App renders all three sections", `renderComponent();\nscreen.getByRole("banner");\nscreen.getByRole("main");\nscreen.getByRole("contentinfo");\nexpectText("My Blog");`),
        hidden(
          "each section is its own component",
          `${exported("PageHeader")}\n${exported("PageContent")}\n${exported("PageFooter")}\nrender(<userExports.PageContent />);\nscreen.getByRole("main");\nexpectText("First post coming soon.");`
        ),
        hidden(
          "sections appear in order",
          `const { container } = renderComponent();\nconst tags = Array.from(container.querySelectorAll("header, main, footer")).map((el) => el.tagName);\nassertEqual(tags, ["HEADER", "MAIN", "FOOTER"]);`
        ),
      ],
    },
    {
      slug: "comp-nested-components",
      title: "Nest Components Inside Components",
      difficulty: "BEGINNER",
      tags: ["components", "composition"],
      estimatedMinutes: 8,
      description:
        "Build a card from two smaller components:\n\n- `CardHeader` → `<h3>Monthly Report</h3>`\n- `CardBody` → `<p>Revenue is up 12% this month.</p>`\n\nThen make `Card` (the default export) render an `<article>` containing `CardHeader` followed by `CardBody`. Export all three.",
      requirements: ["CardHeader and CardBody are exported components", "Card renders both inside an <article>"],
      hints: ["Components can render other components, which can render other components...", "Card returns <article><CardHeader /><CardBody /></article>"],
      starterCode: `// Create CardHeader and CardBody\n\nfunction Card() {\n  return null;\n}\n\nexport default Card;\n`,
      solutionCode: `export function CardHeader() {\n  return <h3>Monthly Report</h3>;\n}\n\nexport function CardBody() {\n  return <p>Revenue is up 12% this month.</p>;\n}\n\nfunction Card() {\n  return (\n    <article>\n      <CardHeader />\n      <CardBody />\n    </article>\n  );\n}\n\nexport default Card;\n`,
      explanation: "Nesting components builds a tree. The parent decides the layout; the children decide their own content.",
      tests: [
        test("Card renders title and body", `renderComponent();\nconst article = screen.getByRole("article");\nwithin(article).getByRole("heading", { name: "Monthly Report" });\nwithin(article).getByText("Revenue is up 12% this month.");`),
        hidden("CardHeader and CardBody work on their own", `${exported("CardHeader")}\n${exported("CardBody")}\nrender(<><userExports.CardHeader /><userExports.CardBody /></>);\nscreen.getByRole("heading", { level: 3, name: "Monthly Report" });`),
      ],
    },
    {
      slug: "comp-arrow-function",
      title: "Write an Arrow Function Component",
      difficulty: "BEGINNER",
      tags: ["components", "javascript"],
      estimatedMinutes: 3,
      description:
        "Components don't have to use the `function` keyword. Define `Badge` as an **arrow function** that returns `<span>New</span>`:\n\n```\nconst Badge = () => ...\n```",
      requirements: ["Badge is an arrow function", "It renders <span>New</span>"],
      hints: [
        "An arrow function is written `(params) => result`.",
        "With a single expression you can drop the braces and `return`: () => <span>New</span>",
      ],
      starterCode: `const Badge = () => {\n  // Write your solution here\n  return null;\n};\n\nexport default Badge;\n`,
      solutionCode: `const Badge = () => <span>New</span>;\n\nexport default Badge;\n`,
      explanation: "Function declarations and arrow functions both work as components. Teams usually pick one style and use it consistently.",
      tests: [
        test("renders the badge", `renderComponent();\nassertEqual(expectText("New").tagName, "SPAN");`),
        hidden("Badge is an arrow function", `assert(Component.prototype === undefined, "Define Badge with arrow syntax: const Badge = () => ...");`),
      ],
      wrongSolutions: [`function Badge() {\n  return <span>New</span>;\n}\n\nexport default Badge;\n`],
    },
    {
      slug: "comp-capitalize-names",
      title: "Fix: Component Names Must Be Capitalized",
      difficulty: "BEGINNER",
      tags: ["components", "debugging"],
      problemType: "DEBUG",
      estimatedMinutes: 5,
      description:
        "This code is supposed to show `Welcome back!`, but the page is blank. React treats lowercase tags (like `<div>`) as HTML elements and capitalized tags as components.\n\nFix the bug so the message appears.",
      requirements: ["The message 'Welcome back!' is rendered", "React logs no 'unrecognized tag' warning"],
      hints: ["Look at how the component is named and used.", "Rename `welcomeMessage` to `WelcomeMessage` everywhere."],
      starterCode: `function welcomeMessage() {\n  return <p>Welcome back!</p>;\n}\n\nfunction App() {\n  return (\n    <div>\n      <welcomeMessage />\n    </div>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `function WelcomeMessage() {\n  return <p>Welcome back!</p>;\n}\n\nfunction App() {\n  return (\n    <div>\n      <WelcomeMessage />\n    </div>\n  );\n}\n\nexport default App;\n`,
      explanation: "JSX compiles `<welcomeMessage />` to the string tag 'welcomeMessage' (an unknown HTML element), while `<WelcomeMessage />` refers to your function. Capitalization is how JSX tells them apart.",
      tests: [
        test("shows the welcome message", `renderComponent();\nexpectText("Welcome back!");`),
        hidden("no unrecognized-tag warning", `renderComponent();\nassert(!anyConsoleError("is unrecognized", "incorrect casing"), "React rendered an unknown lowercase element");`),
      ],
    },
    {
      slug: "comp-loading-component",
      title: "Create a Loading Component",
      difficulty: "BEGINNER",
      tags: ["components", "accessibility", "aria"],
      estimatedMinutes: 5,
      description:
        "Create a reusable `Loading` component: a `<div>` with `role=\"status\"` containing the text `Loading...`.\n\n`role=\"status\"` tells screen readers to politely announce the text when it changes.",
      requirements: ["Renders 'Loading...'", "Has role='status'"],
      hints: ["role is a regular attribute.", "<div role=\"status\">Loading...</div>"],
      starterCode: `function Loading() {\n  // Write your solution here\n  return null;\n}\n\nexport default Loading;\n`,
      solutionCode: `function Loading() {\n  return <div role="status">Loading...</div>;\n}\n\nexport default Loading;\n`,
      explanation: "Small 'state' components like Loading, EmptyState, and ErrorMessage get reused across a whole app, so it's worth making them accessible once.",
      tests: [
        test("renders the loading text", `renderComponent();\nexpectText("Loading...");`),
        hidden("uses role=status", `renderComponent();\nassertEqual(screen.getByRole("status").textContent, "Loading...");`),
      ],
      wrongSolutions: [`function Loading() {\n  return <div>Loading...</div>;\n}\n\nexport default Loading;\n`],
    },
    {
      slug: "comp-empty-state",
      title: "Create an EmptyState Component",
      difficulty: "BEGINNER",
      tags: ["components"],
      estimatedMinutes: 5,
      description:
        "Create `EmptyState`, which renders:\n\n- `<h3>No projects yet</h3>`\n- `<p>Create your first project to get started.</p>`\n- a button `New Project`",
      requirements: ["Heading, description and button are all rendered"],
      hints: ["A component returns one root element.", "Wrap the heading, paragraph and button in a <div>."],
      starterCode: `function EmptyState() {\n  // Write your solution here\n  return null;\n}\n\nexport default EmptyState;\n`,
      solutionCode: `function EmptyState() {\n  return (\n    <div>\n      <h3>No projects yet</h3>\n      <p>Create your first project to get started.</p>\n      <button>New Project</button>\n    </div>\n  );\n}\n\nexport default EmptyState;\n`,
      explanation: "Empty states tell users what to do next instead of leaving them with a blank screen.",
      tests: [
        test("renders the heading", `renderComponent();\nscreen.getByRole("heading", { level: 3, name: "No projects yet" });`),
        hidden("renders description and action", `renderComponent();\nexpectText("Create your first project to get started.");\nscreen.getByRole("button", { name: "New Project" });`),
      ],
    },
    {
      slug: "comp-sidebar",
      title: "Create a Sidebar Component",
      difficulty: "BEGINNER",
      tags: ["components", "semantic-html"],
      estimatedMinutes: 8,
      description:
        "Create a `Sidebar` that renders an `<aside>` containing:\n\n- `<h2>Menu</h2>`\n- a `<nav>` with links `Dashboard` (`/dashboard`) and `Settings` (`/settings`)",
      requirements: ["Uses <aside>", "Has a 'Menu' heading", "Navigation with the two links"],
      hints: ["<aside> is for content beside the main content.", "Put a <nav> inside the <aside>."],
      starterCode: `function Sidebar() {\n  // Write your solution here\n  return null;\n}\n\nexport default Sidebar;\n`,
      solutionCode: `function Sidebar() {\n  return (\n    <aside>\n      <h2>Menu</h2>\n      <nav>\n        <a href="/dashboard">Dashboard</a>\n        <a href="/settings">Settings</a>\n      </nav>\n    </aside>\n  );\n}\n\nexport default Sidebar;\n`,
      explanation: "An <aside> becomes a 'complementary' landmark, so screen-reader users can skip past or jump to it.",
      tests: [
        test("renders the menu links", `renderComponent();\nscreen.getByRole("heading", { name: "Menu" });\nscreen.getByRole("link", { name: "Dashboard" });\nscreen.getByRole("link", { name: "Settings" });`),
        hidden(
          "uses aside and nav with correct hrefs",
          `renderComponent();\nconst aside = screen.getByRole("complementary");\nconst nav = within(aside).getByRole("navigation");\nassertEqual(within(nav).getAllByRole("link").map((a) => a.getAttribute("href")), ["/dashboard", "/settings"]);`
        ),
      ],
      wrongSolutions: [`function Sidebar() {\n  return (\n    <div>\n      <h2>Menu</h2>\n      <a href="/dashboard">Dashboard</a>\n      <a href="/settings">Settings</a>\n    </div>\n  );\n}\n\nexport default Sidebar;\n`],
    },
    {
      slug: "comp-searchbar",
      title: "Create a SearchBar Component",
      difficulty: "BEGINNER",
      tags: ["components", "forms", "accessibility"],
      estimatedMinutes: 8,
      description:
        "Create `SearchBar`: a `<form role=\"search\">` containing a search input (`type=\"search\"`, `aria-label=\"Search\"`, `placeholder=\"Search...\"`) and a button `Go`.",
      requirements: ["form has role='search'", "Search input with accessible name 'Search'", "Button 'Go'"],
      hints: ["aria-label gives an input a name when there's no visible <label>.", "type=\"search\" gives the input the 'searchbox' role."],
      starterCode: `function SearchBar() {\n  // Write your solution here\n  return null;\n}\n\nexport default SearchBar;\n`,
      solutionCode: `function SearchBar() {\n  return (\n    <form role="search">\n      <input type="search" aria-label="Search" placeholder="Search..." />\n      <button type="submit">Go</button>\n    </form>\n  );\n}\n\nexport default SearchBar;\n`,
      explanation: "role='search' marks a search landmark; aria-label provides the accessible name that a visible label would otherwise give.",
      tests: [
        test("renders the input and button", `renderComponent();\nscreen.getByPlaceholderText("Search...");\nscreen.getByRole("button", { name: "Go" });`),
        hidden("is an accessible search form", `renderComponent();\nconst form = screen.getByRole("search");\nwithin(form).getByRole("searchbox", { name: "Search" });`),
      ],
      wrongSolutions: [`function SearchBar() {\n  return (\n    <form>\n      <input placeholder="Search..." />\n      <button>Go</button>\n    </form>\n  );\n}\n\nexport default SearchBar;\n`],
    },
    {
      slug: "comp-comment",
      title: "Create a Comment Component",
      difficulty: "BEGINNER",
      tags: ["components", "semantic-html"],
      estimatedMinutes: 8,
      description:
        "Create a `Comment` component that renders an `<article>` with:\n\n- the author in `<strong>Sam</strong>`\n- a `<time dateTime=\"2025-01-15\">Jan 15</time>`\n- a paragraph `Great explanation, thanks!`",
      requirements: ["Article with author, time and text", "<time> has dateTime='2025-01-15'"],
      hints: ["The JSX attribute is camelCase: dateTime.", "<time> gives dates a machine-readable value."],
      starterCode: `function Comment() {\n  // Write your solution here\n  return null;\n}\n\nexport default Comment;\n`,
      solutionCode: `function Comment() {\n  return (\n    <article>\n      <strong>Sam</strong>\n      <time dateTime="2025-01-15">Jan 15</time>\n      <p>Great explanation, thanks!</p>\n    </article>\n  );\n}\n\nexport default Comment;\n`,
      explanation: "The <time> element's dateTime attribute is machine-readable, while its text stays human-friendly.",
      tests: [
        test("renders the comment", `renderComponent();\nconst article = screen.getByRole("article");\nwithin(article).getByText("Sam");\nwithin(article).getByText("Great explanation, thanks!");`),
        hidden("uses a time element", `const { container } = renderComponent();\nconst time = container.querySelector("time");\nassert(time, "Expected a <time> element");\nassertEqual(time.getAttribute("datetime"), "2025-01-15");\nassertEqual(time.textContent, "Jan 15");`),
      ],
    },
    {
      slug: "comp-build-landing-page",
      title: "Build a Landing Page From Components",
      difficulty: "EASY",
      tags: ["components", "composition", "reuse"],
      estimatedMinutes: 15,
      description:
        "Build a landing page from small components. Export each one:\n\n- `FastFeature`, `SimpleFeature`, `FlexibleFeature` → `<li>Fast</li>`, `<li>Simple</li>`, `<li>Flexible</li>`\n- `FeatureList` → a `<ul>` rendering the three features in that order.\n- `App` (default) → `<h1>Why ReactCode?</h1>` followed by `<FeatureList />`.\n\n(Notice the repetition — the next level, Props, fixes exactly this.)",
      requirements: ["Three feature components and a FeatureList, all exported", "App renders the heading and the list"],
      hints: ["FeatureList returns <ul> containing the three feature components.", "App returns a fragment with the <h1> and <FeatureList />."],
      starterCode: `// Create the feature components and FeatureList here\n\nfunction App() {\n  return null;\n}\n\nexport default App;\n`,
      solutionCode: `export function FastFeature() {\n  return <li>Fast</li>;\n}\n\nexport function SimpleFeature() {\n  return <li>Simple</li>;\n}\n\nexport function FlexibleFeature() {\n  return <li>Flexible</li>;\n}\n\nexport function FeatureList() {\n  return (\n    <ul>\n      <FastFeature />\n      <SimpleFeature />\n      <FlexibleFeature />\n    </ul>\n  );\n}\n\nfunction App() {\n  return (\n    <>\n      <h1>Why ReactCode?</h1>\n      <FeatureList />\n    </>\n  );\n}\n\nexport default App;\n`,
      explanation: "Three nearly identical components is a sign you need a parameter. That parameter is a prop, and props are the next level.",
      tests: [
        test("renders heading and features", `renderComponent();\nscreen.getByRole("heading", { level: 1, name: "Why ReactCode?" });\nassertEqual(screen.getAllByRole("listitem").map((li) => li.textContent), ["Fast", "Simple", "Flexible"]);`),
        hidden("FeatureList is its own component", `${exported("FeatureList")}\nrender(<userExports.FeatureList />);\nassertEqual(screen.getAllByRole("listitem").length, 3);`),
      ],
    },
  ],
};
