import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
/** Asserts an exported counter did not grow while running `body`. */
const noMoreThan = (counter: string, max: number, body: string, message: string) =>
  `{\nconst before = userExports.${counter};\n${body}\nconst grew = userExports.${counter} - before;\nassert(grew <= ${max}, ${JSON.stringify(message)} + " (" + grew + ")");\n}`;

export const performance: CategoryBank = {
  category: "Performance",
  level: 23,
  type: "PERFORMANCE",
  prerequisites: ["useState", "useEffect", "Props"],
  problems: [
    {
      slug: "perf-react-memo",
      title: "Skip Re-renders With React.memo",
      difficulty: "EASY",
      tags: ["performance", "memo"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 10,
      description:
        "`Dashboard` has a clock-like counter (`Tick` button). Every tick re-renders `ExpensiveChart`, even though its `data` prop never changes. The exported `chartRenders` counts its renders.\n\nWrap `ExpensiveChart` in `React.memo` so it only re-renders when its props change. Don't change what's displayed.",
      requirements: ["Same output", "Chart doesn't re-render on ticks"],
      hints: ["const ExpensiveChart = memo(function ExpensiveChart(props) { ... })", "memo skips re-rendering when every prop is === to last time."],
      starterCode: `import { memo, useState } from "react";\n\nexport let chartRenders = 0;\n\nconst DATA = [3, 1, 4, 1, 5];\n\nfunction ExpensiveChart({ data }: { data: number[] }) {\n  chartRenders++;\n  return <p>Chart of {data.length} points</p>;\n}\n\nfunction Dashboard() {\n  const [ticks, setTicks] = useState(0);\n  return (\n    <div>\n      <button onClick={() => setTicks((t) => t + 1)}>Tick</button>\n      <p>Ticks: {ticks}</p>\n      <ExpensiveChart data={DATA} />\n    </div>\n  );\n}\n\nexport default Dashboard;\n`,
      solutionCode: `import { memo, useState } from "react";\n\nexport let chartRenders = 0;\n\nconst DATA = [3, 1, 4, 1, 5];\n\nconst ExpensiveChart = memo(function ExpensiveChart({ data }: { data: number[] }) {\n  chartRenders++;\n  return <p>Chart of {data.length} points</p>;\n});\n\nfunction Dashboard() {\n  const [ticks, setTicks] = useState(0);\n  return (\n    <div>\n      <button onClick={() => setTicks((t) => t + 1)}>Tick</button>\n      <p>Ticks: {ticks}</p>\n      <ExpensiveChart data={DATA} />\n    </div>\n  );\n}\n\nexport default Dashboard;\n`,
      explanation: "By default a parent's re-render re-renders all its children. memo adds a shallow props comparison so a child with unchanged props is skipped. It works here because DATA is a stable module-level array.",
      tests: [
        test("still works", `renderComponent();\n${click("Tick")}\nexpectText("Ticks: 1");\nexpectText("Chart of 5 points");`),
        hidden("chart doesn't re-render on ticks", `renderComponent();\n${noMoreThan("chartRenders", 0, `${click("Tick")}\n${click("Tick")}\n${click("Tick")}`, "ExpensiveChart re-rendered on ticks")}`),
      ],
    },
    {
      slug: "perf-usecallback",
      title: "Stable Callbacks With useCallback",
      difficulty: "MEDIUM",
      tags: ["performance", "useCallback", "memo"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 15,
      description:
        "`TodoItem` is already wrapped in `memo`, yet it still re-renders whenever you type in the search box. The reason: `TodoList` creates a **new** `onToggle` function on every render, so memo sees a changed prop.\n\nUse `useCallback` so `onToggle` keeps the same identity across renders. The exported `itemRenders` counts TodoItem renders.",
      requirements: ["Same behaviour", "Typing in the search box doesn't re-render the items"],
      hints: ["const toggle = useCallback((id: number) => setDone(...), []);", "Use a functional state update inside so the callback doesn't need any dependencies."],
      starterCode: `import { memo, useCallback, useState } from "react";\n\nexport let itemRenders = 0;\n\nconst TodoItem = memo(function TodoItem({ id, text, done, onToggle }: { id: number; text: string; done: boolean; onToggle: (id: number) => void }) {\n  itemRenders++;\n  return (\n    <li>\n      <label>\n        <input type="checkbox" checked={done} onChange={() => onToggle(id)} /> {text}\n      </label>\n    </li>\n  );\n});\n\nconst TODOS = [\n  { id: 1, text: "Read" },\n  { id: 2, text: "Write" },\n];\n\nfunction TodoList() {\n  const [query, setQuery] = useState("");\n  const [done, setDone] = useState<number[]>([]);\n\n  const toggle = (id: number) => {\n    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));\n  };\n\n  return (\n    <div>\n      <label>\n        Search <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <ul>\n        {TODOS.map((t) => (\n          <TodoItem key={t.id} id={t.id} text={t.text} done={done.includes(t.id)} onToggle={toggle} />\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default TodoList;\n`,
      solutionCode: `import { memo, useCallback, useState } from "react";\n\nexport let itemRenders = 0;\n\nconst TodoItem = memo(function TodoItem({ id, text, done, onToggle }: { id: number; text: string; done: boolean; onToggle: (id: number) => void }) {\n  itemRenders++;\n  return (\n    <li>\n      <label>\n        <input type="checkbox" checked={done} onChange={() => onToggle(id)} /> {text}\n      </label>\n    </li>\n  );\n});\n\nconst TODOS = [\n  { id: 1, text: "Read" },\n  { id: 2, text: "Write" },\n];\n\nfunction TodoList() {\n  const [query, setQuery] = useState("");\n  const [done, setDone] = useState<number[]>([]);\n\n  const toggle = useCallback((id: number) => {\n    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));\n  }, []);\n\n  return (\n    <div>\n      <label>\n        Search <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <ul>\n        {TODOS.map((t) => (\n          <TodoItem key={t.id} id={t.id} text={t.text} done={done.includes(t.id)} onToggle={toggle} />\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default TodoList;\n`,
      explanation: "Functions are compared by reference. useCallback returns the same function until its dependencies change, which is what lets memoized children skip renders. On its own (without memo) useCallback buys nothing.",
      commonMistakes: ["Using useCallback without memo on the child — the child re-renders anyway.", "Reading `done` inside the callback, which forces it into the dependency list."],
      tests: [
        test("toggling works", `renderComponent();\nfireEvent.click(screen.getByRole("checkbox", { name: "Read" }));\nassert(screen.getByRole("checkbox", { name: "Read" }).checked);`),
        hidden("typing doesn't re-render items", `renderComponent();\n${noMoreThan("itemRenders", 0, `await userEvent.type(screen.getByLabelText("Search"), "abc");`, "TodoItems re-rendered while typing in search")}\nconst before = userExports.itemRenders;\nfireEvent.click(screen.getByRole("checkbox", { name: "Write" }));\nassertEqual(userExports.itemRenders - before, 1, "Only the toggled item should re-render");`),
      ],
    },
    {
      slug: "perf-usememo-calculation",
      title: "Skip Expensive Work With useMemo",
      difficulty: "MEDIUM",
      tags: ["performance", "useMemo"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 15,
      description:
        "`PrimeFinder` recomputes `findPrimes(limit)` (expensive!) on every render — including when you just toggle the theme. The exported `computeCalls` counts how often it runs.\n\nUse `useMemo` so the primes are only recomputed when `limit` changes.",
      requirements: ["Same output", "Recomputes only when limit changes"],
      hints: ["Which value does the calculation actually depend on?", "const primes = useMemo(() => findPrimes(limit), [limit]);"],
      starterCode: `import { useMemo, useState } from "react";\n\nexport let computeCalls = 0;\n\nfunction findPrimes(limit: number) {\n  computeCalls++;\n  const primes: number[] = [];\n  for (let n = 2; n <= limit; n++) {\n    if (primes.every((p) => n % p !== 0)) primes.push(n);\n  }\n  return primes;\n}\n\nfunction PrimeFinder() {\n  const [limit, setLimit] = useState(100);\n  const [dark, setDark] = useState(false);\n  const primes = findPrimes(limit);\n\n  return (\n    <div className={dark ? "dark" : "light"}>\n      <button onClick={() => setDark((d) => !d)}>Toggle theme</button>\n      <button onClick={() => setLimit((l) => l + 100)}>More</button>\n      <p>{primes.length} primes up to {limit}</p>\n    </div>\n  );\n}\n\nexport default PrimeFinder;\n`,
      solutionCode: `import { useMemo, useState } from "react";\n\nexport let computeCalls = 0;\n\nfunction findPrimes(limit: number) {\n  computeCalls++;\n  const primes: number[] = [];\n  for (let n = 2; n <= limit; n++) {\n    if (primes.every((p) => n % p !== 0)) primes.push(n);\n  }\n  return primes;\n}\n\nfunction PrimeFinder() {\n  const [limit, setLimit] = useState(100);\n  const [dark, setDark] = useState(false);\n  const primes = useMemo(() => findPrimes(limit), [limit]);\n\n  return (\n    <div className={dark ? "dark" : "light"}>\n      <button onClick={() => setDark((d) => !d)}>Toggle theme</button>\n      <button onClick={() => setLimit((l) => l + 100)}>More</button>\n      <p>{primes.length} primes up to {limit}</p>\n    </div>\n  );\n}\n\nexport default PrimeFinder;\n`,
      explanation: "useMemo caches a computed value between renders and only recomputes when a dependency changes. Measure first — most calculations are cheap enough not to need it.",
      tests: [
        test("same output", `renderComponent();\nexpectText("25 primes up to 100");\n${click("More")}\nexpectText("46 primes up to 200");`),
        hidden("no recompute on theme toggles", `renderComponent();\n${noMoreThan("computeCalls", 0, `${click("Toggle theme")}\n${click("Toggle theme")}`, "findPrimes ran again when only the theme changed")}\n${noMoreThan("computeCalls", 1, click("More"), "findPrimes should run once when the limit changes")}`),
      ],
      wrongSolutions: [`import { useMemo, useState } from "react";\nexport let computeCalls = 0;\nfunction findPrimes(limit) { computeCalls++; const p = []; for (let n = 2; n <= limit; n++) if (p.every((x) => n % x !== 0)) p.push(n); return p; }\nfunction PrimeFinder() {\n  const [limit, setLimit] = useState(100);\n  const [dark, setDark] = useState(false);\n  const primes = useMemo(() => findPrimes(limit), [limit, dark]);\n  return (<div className={dark ? "dark" : "light"}><button onClick={() => setDark(!dark)}>Toggle theme</button><button onClick={() => setLimit(limit + 100)}>More</button><p>{primes.length} primes up to {limit}</p></div>);\n}\nexport default PrimeFinder;\n`],
    },
    {
      slug: "perf-stable-object-props",
      title: "Stable Object Props",
      difficulty: "MEDIUM",
      tags: ["performance", "useMemo", "memo", "referential-equality"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 15,
      description:
        "`MapView` is memoized, but `Page` passes it `center={{ lat, lng }}` — a **new object** every render — so memo never helps. Typing in the unrelated `Note` field re-renders the map. The exported `mapRenders` counts its renders.\n\nMake the `center` object stable so the map only re-renders when the coordinates actually change.",
      requirements: ["Same output", "Typing a note doesn't re-render the map", "Changing coordinates still does"],
      hints: ["{} !== {} even with the same contents.", "const center = useMemo(() => ({ lat, lng }), [lat, lng]);"],
      starterCode: `import { memo, useMemo, useState } from "react";\n\nexport let mapRenders = 0;\n\nconst MapView = memo(function MapView({ center }: { center: { lat: number; lng: number } }) {\n  mapRenders++;\n  return (\n    <p>\n      Map at {center.lat}, {center.lng}\n    </p>\n  );\n});\n\nfunction Page() {\n  const [lat, setLat] = useState(51);\n  const [lng] = useState(0);\n  const [note, setNote] = useState("");\n\n  return (\n    <div>\n      <label>\n        Note <input value={note} onChange={(e) => setNote(e.target.value)} />\n      </label>\n      <button onClick={() => setLat((l) => l + 1)}>Move north</button>\n      <MapView center={{ lat, lng }} />\n    </div>\n  );\n}\n\nexport default Page;\n`,
      solutionCode: `import { memo, useMemo, useState } from "react";\n\nexport let mapRenders = 0;\n\nconst MapView = memo(function MapView({ center }: { center: { lat: number; lng: number } }) {\n  mapRenders++;\n  return (\n    <p>\n      Map at {center.lat}, {center.lng}\n    </p>\n  );\n});\n\nfunction Page() {\n  const [lat, setLat] = useState(51);\n  const [lng] = useState(0);\n  const [note, setNote] = useState("");\n  const center = useMemo(() => ({ lat, lng }), [lat, lng]);\n\n  return (\n    <div>\n      <label>\n        Note <input value={note} onChange={(e) => setNote(e.target.value)} />\n      </label>\n      <button onClick={() => setLat((l) => l + 1)}>Move north</button>\n      <MapView center={center} />\n    </div>\n  );\n}\n\nexport default Page;\n`,
      explanation: "Inline objects, arrays, and functions are recreated every render. When they're passed to a memoized child, memoize them too — or pass primitives (lat, lng) instead.",
      alternativeApproach: "Change MapView to take `lat` and `lng` as separate number props; primitives compare by value, so no useMemo is needed.",
      tests: [
        test("same output", `renderComponent();\nexpectText("Map at 51, 0");\n${click("Move north")}\nexpectText("Map at 52, 0");`),
        hidden("note typing doesn't re-render the map", `renderComponent();\n${noMoreThan("mapRenders", 0, `await userEvent.type(screen.getByLabelText("Note"), "hi");`, "MapView re-rendered while typing a note")}\n${noMoreThan("mapRenders", 1, click("Move north"), "MapView should re-render once when the center changes")}`),
      ],
    },
    {
      slug: "perf-state-colocation",
      title: "Move State Down",
      difficulty: "MEDIUM",
      tags: ["performance", "state-colocation", "refactoring"],
      problemType: "REFACTOR",
      estimatedMinutes: 15,
      description:
        "Typing in the newsletter field re-renders the whole `Store` page, including the slow `ProductGrid`, because the email state lives in `Store`. The exported `gridRenders` counts grid renders.\n\nWithout using `memo`, fix it by **moving the email state into its own component** (`NewsletterSignup`), close to where it's used.",
      requirements: ["Same behaviour", "Typing doesn't re-render ProductGrid", "No memo"],
      hints: ["State only re-renders the component that owns it (and its children).", "Extract the label, input, and 'Subscribing as' text into NewsletterSignup with its own useState."],
      starterCode: `import { useState } from "react";\n\nexport let gridRenders = 0;\n\nfunction ProductGrid() {\n  gridRenders++;\n  return <p>48 products</p>;\n}\n\nfunction Store() {\n  const [email, setEmail] = useState("");\n  return (\n    <div>\n      <ProductGrid />\n      <label>\n        Email <input value={email} onChange={(e) => setEmail(e.target.value)} />\n      </label>\n      <p>Subscribing as: {email}</p>\n    </div>\n  );\n}\n\nexport default Store;\n`,
      solutionCode: `import { useState } from "react";\n\nexport let gridRenders = 0;\n\nfunction ProductGrid() {\n  gridRenders++;\n  return <p>48 products</p>;\n}\n\nfunction NewsletterSignup() {\n  const [email, setEmail] = useState("");\n  return (\n    <div>\n      <label>\n        Email <input value={email} onChange={(e) => setEmail(e.target.value)} />\n      </label>\n      <p>Subscribing as: {email}</p>\n    </div>\n  );\n}\n\nfunction Store() {\n  return (\n    <div>\n      <ProductGrid />\n      <NewsletterSignup />\n    </div>\n  );\n}\n\nexport default Store;\n`,
      explanation: "Keeping state as low in the tree as possible is the cheapest optimization there is: fewer components re-render, and no memoization bookkeeping is needed.",
      tests: [
        test("same behaviour", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Email"), "a@b.co");\nexpectText("Subscribing as: a@b.co");\nexpectText("48 products");`),
        hidden("grid doesn't re-render, no memo", `renderComponent();\n${noMoreThan("gridRenders", 0, `await userEvent.type(screen.getByLabelText("Email"), "abc");`, "ProductGrid re-rendered while typing")}`),
      ],
    },
    {
      slug: "perf-children-as-props",
      title: "Pass Slow Content as Children",
      difficulty: "HARD",
      tags: ["performance", "children", "composition"],
      problemType: "REFACTOR",
      estimatedMinutes: 20,
      description:
        "`HoverTracker` keeps the mouse position in state and re-renders on every mouse move — including the slow `Article` it renders inside. The exported `articleRenders` counts those renders.\n\nWithout `memo`, restructure it so `HoverTracker` receives its content as **`children`**, and `App` passes `<Article />` in. Content passed as children was created by the parent, so it isn't re-rendered when HoverTracker's state changes. HoverTracker still shows `<p>Mouse: {x}, {y}</p>`.",
      requirements: ["HoverTracker takes children", "Moving the mouse doesn't re-render Article", "No memo"],
      hints: [
        "function HoverTracker({ children }) { ... return <div onMouseMove={...}><p>...</p>{children}</div>; }",
        "In App: <HoverTracker><Article /></HoverTracker>",
        "The <Article /> element is created during App's render, which doesn't happen again on mouse moves.",
      ],
      starterCode: `import { useState, type ReactNode } from "react";\n\nexport let articleRenders = 0;\n\nfunction Article() {\n  articleRenders++;\n  return <article>Long article text...</article>;\n}\n\nfunction HoverTracker() {\n  const [pos, setPos] = useState({ x: 0, y: 0 });\n  return (\n    <div data-testid="tracker" onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>\n      <p>\n        Mouse: {pos.x}, {pos.y}\n      </p>\n      <Article />\n    </div>\n  );\n}\n\nfunction App() {\n  return <HoverTracker />;\n}\n\nexport default App;\n`,
      solutionCode: `import { useState, type ReactNode } from "react";\n\nexport let articleRenders = 0;\n\nfunction Article() {\n  articleRenders++;\n  return <article>Long article text...</article>;\n}\n\nfunction HoverTracker({ children }: { children: ReactNode }) {\n  const [pos, setPos] = useState({ x: 0, y: 0 });\n  return (\n    <div data-testid="tracker" onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>\n      <p>\n        Mouse: {pos.x}, {pos.y}\n      </p>\n      {children}\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <HoverTracker>\n      <Article />\n    </HoverTracker>\n  );\n}\n\nexport default App;\n`,
      explanation: "When a component re-renders, React reuses the `children` elements it received unchanged — they were created by the parent, which didn't re-render. Composition often removes the need for memo entirely.",
      tests: [
        test("tracks the mouse", `const { container } = renderComponent();\nfireEvent.mouseMove(container.querySelector("[data-testid=tracker]"), { clientX: 10, clientY: 20 });\nexpectText("Mouse: 10, 20");\nscreen.getByRole("article");`),
        hidden("article doesn't re-render", `const { container } = renderComponent();\n${noMoreThan("articleRenders", 0, `for (let i = 1; i <= 5; i++) fireEvent.mouseMove(container.querySelector("[data-testid=tracker]"), { clientX: i, clientY: i });`, "Article re-rendered on mouse moves")}\nexpectText("Mouse: 5, 5");`),
      ],
    },
    {
      slug: "perf-virtualized-list",
      title: "Virtualize a Long List",
      difficulty: "HARD",
      tags: ["performance", "virtualization", "lists"],
      estimatedMinutes: 30,
      description:
        "Rendering thousands of rows creates thousands of DOM nodes. Make `VirtualList({ items, rowHeight = 30, height = 300 })` render **only the rows in view**:\n\n- an outer `<div aria-label=\"Results\">` with fixed `height` and `overflow: auto`\n- an inner `<ul>` with `position: relative` and height `items.length * rowHeight`, so the scrollbar is right\n- only the visible `<li>`s (plus a few extra for smooth scrolling), each `position: absolute` at `top: index * rowHeight`\n\nTrack `scrollTop` from the outer div's `onScroll`. Render at most 30 rows at a time.",
      requirements: ["Only visible rows are in the DOM", "Scrolling shows the right rows", "Full scroll height preserved"],
      hints: [
        "const start = Math.floor(scrollTop / rowHeight);",
        "const end = Math.min(items.length, start + Math.ceil(height / rowHeight) + 5);",
        "items.slice(start, end).map((item, i) => <li style={{ position: \"absolute\", top: (start + i) * rowHeight, height: rowHeight }}>...)",
      ],
      starterCode: `import { useState } from "react";\n\ninterface VirtualListProps {\n  items: string[];\n  rowHeight?: number;\n  height?: number;\n}\n\nfunction VirtualList({ items, rowHeight = 30, height = 300 }: VirtualListProps) {\n  return (\n    <div aria-label="Results" style={{ height, overflow: "auto" }}>\n      <ul>\n        {items.map((item) => (\n          <li key={item} style={{ height: rowHeight }}>\n            {item}\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default VirtualList;\n`,
      solutionCode: `import { useState } from "react";\n\ninterface VirtualListProps {\n  items: string[];\n  rowHeight?: number;\n  height?: number;\n}\n\nconst OVERSCAN = 5;\n\nfunction VirtualList({ items, rowHeight = 30, height = 300 }: VirtualListProps) {\n  const [scrollTop, setScrollTop] = useState(0);\n  const start = Math.floor(scrollTop / rowHeight);\n  const end = Math.min(items.length, start + Math.ceil(height / rowHeight) + OVERSCAN);\n\n  return (\n    <div aria-label="Results" style={{ height, overflow: "auto" }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>\n      <ul style={{ position: "relative", height: items.length * rowHeight, margin: 0, padding: 0 }}>\n        {items.slice(start, end).map((item, i) => (\n          <li key={start + i} style={{ position: "absolute", top: (start + i) * rowHeight, height: rowHeight }}>\n            {item}\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default VirtualList;\n`,
      explanation: "Virtualization ('windowing') keeps DOM size constant regardless of data size. Libraries like react-window and TanStack Virtual implement the same idea with more features.",
      tests: [
        test("renders only a window of rows", `const items = Array.from({ length: 2000 }, (_, i) => "Item " + i);\nrenderComponent({ items });\nconst count = screen.getAllByRole("listitem").length;\nassert(count > 0 && count <= 30, "Rendered " + count + " rows");\nexpectText("Item 0");`),
        hidden("scrolling shows the right rows", `const items = Array.from({ length: 2000 }, (_, i) => "Item " + i);\nconst { container } = renderComponent({ items, rowHeight: 30, height: 300 });\nconst viewport = screen.getByLabelText("Results");\nfireEvent.scroll(viewport, { target: { scrollTop: 3000 } });\nexpectText("Item 100");\nexpectNoText("Item 0");\nassert(screen.getAllByRole("listitem").length <= 30);\nassertEqual(container.querySelector("ul").style.height, "60000px");\nassertEqual(screen.getByText("Item 100").style.top, "3000px");`),
      ],
    },
    {
      slug: "perf-lazy-loading",
      title: "Lazy-Load a Component",
      difficulty: "MEDIUM",
      tags: ["performance", "lazy", "suspense", "code-splitting"],
      estimatedMinutes: 15,
      description:
        "`loadChart()` (provided) simulates a dynamic `import()` of a heavy chart module; the exported `chartLoads` counts how often it's called.\n\nMake `Report` load the chart **only when needed**: create `const LazyChart = lazy(loadChart)` (at module level), and when the user clicks `Show chart`, render it inside `<Suspense fallback={<p>Loading chart...</p>}>`.",
      requirements: ["Chart isn't loaded until requested", "Fallback shows while loading", "The module loads only once"],
      hints: ["import { lazy, Suspense } from \"react\";", "Create the lazy component outside the component — inside, it would be a new component (and a new load) every render."],
      starterCode: `import { lazy, Suspense, useState } from "react";\n\nexport let chartLoads = 0;\n\nfunction Chart() {\n  return <p>Chart: 42 sales</p>;\n}\n\n// Provided: pretend this is import("./Chart")\nfunction loadChart() {\n  chartLoads++;\n  return new Promise<{ default: typeof Chart }>((resolve) => setTimeout(() => resolve({ default: Chart }), 30));\n}\n\nfunction Report() {\n  const [show, setShow] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setShow(true)}>Show chart</button>\n      {show && <Chart />}\n    </div>\n  );\n}\n\nexport default Report;\n`,
      solutionCode: `import { lazy, Suspense, useState } from "react";\n\nexport let chartLoads = 0;\n\nfunction Chart() {\n  return <p>Chart: 42 sales</p>;\n}\n\n// Provided: pretend this is import("./Chart")\nfunction loadChart() {\n  chartLoads++;\n  return new Promise<{ default: typeof Chart }>((resolve) => setTimeout(() => resolve({ default: Chart }), 30));\n}\n\nconst LazyChart = lazy(loadChart);\n\nfunction Report() {\n  const [show, setShow] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setShow(true)}>Show chart</button>\n      {show && (\n        <Suspense fallback={<p>Loading chart...</p>}>\n          <LazyChart />\n        </Suspense>\n      )}\n    </div>\n  );\n}\n\nexport default Report;\n`,
      explanation: "lazy() defers loading a component's code until it first renders; Suspense shows a fallback meanwhile. Code that most users never see shouldn't slow down everyone's first page load.",
      tests: [
        test("loads on demand with a fallback", `assertEqual(userExports.chartLoads, 0, "The chart was loaded before anyone asked for it");\nrenderComponent();\nassertEqual(userExports.chartLoads, 0, "The chart was loaded on render, before clicking");\n${click("Show chart")}\nexpectText("Loading chart...");\nawait waitFor(() => expectText("Chart: 42 sales"));\nassertEqual(userExports.chartLoads, 1);`),
        hidden("module loads only once", `renderComponent();\n${click("Show chart")}\nawait waitFor(() => expectText("Chart: 42 sales"));\nassertEqual(userExports.chartLoads, 1, "loadChart ran " + userExports.chartLoads + " times — create the lazy component once, at module level");`),
      ],
    },
  ],
};
