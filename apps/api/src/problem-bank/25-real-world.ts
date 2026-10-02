import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string, role = "button") => `fireEvent.click(screen.getByRole(${JSON.stringify(role)}, { name: ${JSON.stringify(name)} }));`;
const items = `screen.getAllByRole("listitem").map((el) => el.textContent)`;

export const realWorld: CategoryBank = {
  category: "Real-World Components",
  level: 25,
  type: "ARCHITECTURE",
  prerequisites: ["useState", "useEffect", "Forms", "Accessibility"],
  problems: [
    {
      slug: "rw-star-rating",
      title: "Star Rating",
      difficulty: "MEDIUM",
      tags: ["real-world", "controlled-components", "accessibility"],
      estimatedMinutes: 20,
      description:
        "Build a controlled `StarRating({ value, onChange, max = 5 })`:\n\n- a `role=\"radiogroup\"` with `aria-label=\"Rating\"`\n- one `<button role=\"radio\">` per star with `aria-label` `\"1 star\"`, `\"2 stars\"`, ... and `aria-checked` true only for the star equal to `value`\n- stars up to `value` show `★`, the rest `☆`\n- clicking a star calls `onChange(n)`",
      requirements: ["Shows filled/empty stars for value", "Radio semantics with names", "Clicking reports the new value"],
      hints: ["Array.from({ length: max }, (_, i) => i + 1) gives the star numbers.", "Controlled: StarRating has no state; the parent owns value."],
      starterCode: `function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (value: number) => void; max?: number }) {\n  // Write your solution here\n  return null;\n}\n\nexport default StarRating;\n`,
      solutionCode: `function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (value: number) => void; max?: number }) {\n  const stars = Array.from({ length: max }, (_, i) => i + 1);\n  return (\n    <div role="radiogroup" aria-label="Rating">\n      {stars.map((n) => (\n        <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={n === 1 ? "1 star" : n + " stars"} onClick={() => onChange(n)}>\n          {n <= value ? "★" : "☆"}\n        </button>\n      ))}\n    </div>\n  );\n}\n\nexport default StarRating;\n`,
      explanation: "A rating is a single choice among options, which is exactly what a radio group is — so that's the semantics to expose.",
      tests: [
        test("renders and reports clicks", `const onChange = mockFn();\nrenderComponent({ value: 3, onChange });\nassertEqual(screen.getByRole("radiogroup", { name: "Rating" }).textContent, "★★★☆☆");\n${click("5 stars", "radio")}\nassertEqual(onChange.calls, [[5]]);`),
        hidden("radio semantics and max", `renderComponent({ value: 2, onChange: () => {}, max: 3 });\nassertEqual(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked")), ["false", "true", "false"]);\nscreen.getByRole("radio", { name: "1 star" });\nassertEqual(screen.getByRole("radiogroup").textContent, "★★☆");`),
      ],
    },
    {
      slug: "rw-pagination",
      title: "Pagination Component",
      difficulty: "MEDIUM",
      tags: ["real-world", "pagination", "accessibility"],
      estimatedMinutes: 20,
      description:
        "Build a controlled `Pagination({ totalItems, pageSize, page, onPageChange })`:\n\n- `<nav aria-label=\"Pagination\">` with `Previous`, one button per page (`1`, `2`, ...), and `Next`\n- the current page's button has `aria-current=\"page\"`\n- `Previous` is disabled on page 1, `Next` on the last page\n- clicking calls `onPageChange(n)`\n- render nothing if there's only one page (or none)",
      requirements: ["Correct number of pages", "Current page marked", "Edges disabled", "Hidden for a single page"],
      hints: ["const totalPages = Math.ceil(totalItems / pageSize);", "if (totalPages <= 1) return null;"],
      starterCode: `interface PaginationProps {\n  totalItems: number;\n  pageSize: number;\n  page: number;\n  onPageChange: (page: number) => void;\n}\n\nfunction Pagination(props: PaginationProps) {\n  // Write your solution here\n  return null;\n}\n\nexport default Pagination;\n`,
      solutionCode: `interface PaginationProps {\n  totalItems: number;\n  pageSize: number;\n  page: number;\n  onPageChange: (page: number) => void;\n}\n\nfunction Pagination({ totalItems, pageSize, page, onPageChange }: PaginationProps) {\n  const totalPages = Math.ceil(totalItems / pageSize);\n  if (totalPages <= 1) return null;\n  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);\n\n  return (\n    <nav aria-label="Pagination">\n      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>\n      {pages.map((n) => (\n        <button key={n} aria-current={n === page ? "page" : undefined} onClick={() => onPageChange(n)}>\n          {n}\n        </button>\n      ))}\n      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>\n    </nav>\n  );\n}\n\nexport default Pagination;\n`,
      explanation: "A controlled pagination component only renders and reports intent; the parent owns the page (often in the URL) and fetches data for it.",
      tests: [
        test("renders pages and navigates", `const onPageChange = mockFn();\nrenderComponent({ totalItems: 45, pageSize: 10, page: 2, onPageChange });\nassertEqual(within(screen.getByRole("navigation", { name: "Pagination" })).getAllByRole("button").map((b) => b.textContent), ["Previous", "1", "2", "3", "4", "5", "Next"]);\n${click("Next")}\n${click("4")}\nassertEqual(onPageChange.calls, [[3], [4]]);`),
        hidden("edges, current page, single page", `const { rerender, container } = renderComponent({ totalItems: 30, pageSize: 10, page: 3, onPageChange: () => {} });\nassert(screen.getByRole("button", { name: "Next" }).disabled);\nassert(!screen.getByRole("button", { name: "Previous" }).disabled);\nassertEqual(screen.getByRole("button", { name: "3" }).getAttribute("aria-current"), "page");\nassertEqual(screen.getByRole("button", { name: "1" }).getAttribute("aria-current"), null);\nrerender(<Component totalItems={8} pageSize={10} page={1} onPageChange={() => {}} />);\nassertEqual(container.innerHTML, "");`),
      ],
    },
    {
      slug: "rw-image-carousel",
      title: "Image Carousel",
      difficulty: "MEDIUM",
      tags: ["real-world", "carousel", "useState"],
      estimatedMinutes: 20,
      description:
        "Build `Carousel({ slides })` where slides are `{ id, caption }`:\n\n- show the current slide's caption in a `<figure>` with `<figcaption>`\n- `<p>Slide {n} of {total}</p>`\n- `Previous` / `Next` buttons that **wrap around**\n- one dot button per slide with `aria-label=\"Go to slide N\"`; the active one has `aria-current=\"true\"`",
      requirements: ["Prev/next wrap", "Dots jump to a slide", "Position text and aria-current"],
      hints: ["The whole carousel is one number in state: the current index.", "Wrap with (i + 1) % length and (i - 1 + length) % length."],
      starterCode: `import { useState } from "react";\n\ninterface Slide {\n  id: number;\n  caption: string;\n}\n\nfunction Carousel({ slides }: { slides: Slide[] }) {\n  // Write your solution here\n  return null;\n}\n\nexport default Carousel;\n`,
      solutionCode: `import { useState } from "react";\n\ninterface Slide {\n  id: number;\n  caption: string;\n}\n\nfunction Carousel({ slides }: { slides: Slide[] }) {\n  const [index, setIndex] = useState(0);\n  const count = slides.length;\n\n  return (\n    <div>\n      <figure>\n        <figcaption>{slides[index].caption}</figcaption>\n      </figure>\n      <p>\n        Slide {index + 1} of {count}\n      </p>\n      <button onClick={() => setIndex((i) => (i - 1 + count) % count)}>Previous</button>\n      <button onClick={() => setIndex((i) => (i + 1) % count)}>Next</button>\n      <div>\n        {slides.map((s, i) => (\n          <button key={s.id} aria-label={"Go to slide " + (i + 1)} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)}>\n            •\n          </button>\n        ))}\n      </div>\n    </div>\n  );\n}\n\nexport default Carousel;\n`,
      explanation: "The whole carousel is one index in state; everything else (caption, position text, active dot) derives from it.",
      tests: (() => {
        const SLIDES = `[{ id: 1, caption: "Beach" }, { id: 2, caption: "Forest" }, { id: 3, caption: "City" }]`;
        return [
          test("next and previous wrap", `renderComponent({ slides: ${SLIDES} });\nexpectText("Beach");\n${click("Previous")}\nexpectText("City");\nexpectText("Slide 3 of 3");\n${click("Next")}\nexpectText("Beach");`),
          hidden("dots", `renderComponent({ slides: ${SLIDES} });\n${click("Go to slide 2")}\nexpectText("Forest");\nassertEqual(screen.getByRole("button", { name: "Go to slide 2" }).getAttribute("aria-current"), "true");\nassertEqual(screen.getByRole("button", { name: "Go to slide 1" }).getAttribute("aria-current"), null);`),
        ];
      })(),
    },
    {
      slug: "rw-toast-notifications",
      title: "Toast Notification System",
      difficulty: "MEDIUM",
      tags: ["real-world", "context", "timers"],
      estimatedMinutes: 25,
      description:
        "Build a toast system:\n\n- export `ToastProvider({ children, duration })` that renders its children plus a `<div role=\"region\" aria-label=\"Notifications\">` containing the active toasts\n- export `useToast()` returning `{ show(message) }`\n- each toast is `<div role=\"status\">{message} <button aria-label=\"Dismiss\">×</button></div>`, removed by the button **or** automatically after `duration` ms\n\n`App` (provided) wires a `Save` and an `Undo` button to toasts.",
      requirements: ["Toasts appear in the region", "Several can be visible", "Dismiss button removes one", "Auto-dismiss after duration"],
      hints: [
        "Keep toasts as [{ id, message }] in the provider.",
        "In show(): add the toast and setTimeout(() => remove(id), duration).",
        "Clear pending timers when the provider unmounts (keep them in a ref).",
      ],
      starterCode: `import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";\n\nexport function ToastProvider({ children, duration }: { children: ReactNode; duration: number }) {\n  return <>{children}</>;\n}\n\nexport function useToast(): { show: (message: string) => void } {\n  return { show: () => {} };\n}\n\nfunction Toolbar() {\n  const toast = useToast();\n  return (\n    <div>\n      <button onClick={() => toast.show("Saved!")}>Save</button>\n      <button onClick={() => toast.show("Undone")}>Undo</button>\n    </div>\n  );\n}\n\n// Provided\nexport default function App({ duration = 3000 }: { duration?: number }) {\n  return (\n    <ToastProvider duration={duration}>\n      <Toolbar />\n    </ToastProvider>\n  );\n}\n`,
      solutionCode: `import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";\n\ninterface Toast {\n  id: number;\n  message: string;\n}\n\nconst ToastContext = createContext<{ show: (message: string) => void } | null>(null);\n\nlet nextId = 1;\n\nexport function ToastProvider({ children, duration }: { children: ReactNode; duration: number }) {\n  const [toasts, setToasts] = useState<Toast[]>([]);\n  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);\n\n  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);\n\n  const show = useCallback(\n    (message: string) => {\n      const id = nextId++;\n      setToasts((t) => [...t, { id, message }]);\n      timers.current.push(setTimeout(() => remove(id), duration));\n    },\n    [duration, remove]\n  );\n\n  useEffect(() => () => timers.current.forEach(clearTimeout), []);\n\n  return (\n    <ToastContext.Provider value={{ show }}>\n      {children}\n      <div role="region" aria-label="Notifications">\n        {toasts.map((t) => (\n          <div key={t.id} role="status">\n            {t.message} <button aria-label="Dismiss" onClick={() => remove(t.id)}>×</button>\n          </div>\n        ))}\n      </div>\n    </ToastContext.Provider>\n  );\n}\n\nexport function useToast() {\n  const ctx = useContext(ToastContext);\n  if (!ctx) throw new Error("useToast must be used within ToastProvider");\n  return ctx;\n}\n\nfunction Toolbar() {\n  const toast = useToast();\n  return (\n    <div>\n      <button onClick={() => toast.show("Saved!")}>Save</button>\n      <button onClick={() => toast.show("Undone")}>Undo</button>\n    </div>\n  );\n}\n\n// Provided\nexport default function App({ duration = 3000 }: { duration?: number }) {\n  return (\n    <ToastProvider duration={duration}>\n      <Toolbar />\n    </ToastProvider>\n  );\n}\n`,
      explanation: "A provider + hook gives any component a one-line way to show notifications, while the provider alone owns the list, the timers, and the rendering.",
      tests: [
        test("shows and dismisses", `renderComponent({ duration: 5000 });\n${click("Save")}\n${click("Undo")}\nconst region = screen.getByRole("region", { name: "Notifications" });\nassertEqual(within(region).getAllByRole("status").length, 2);\nfireEvent.click(within(region).getAllByRole("button", { name: "Dismiss" })[0]);\nassertEqual(within(region).getAllByRole("status").map((s) => s.textContent.replace("×", "").trim()), ["Undone"]);`),
        hidden("auto-dismisses", `renderComponent({ duration: 40 });\n${click("Save")}\nscreen.getByRole("status");\nawait waitFor(() => assert(!screen.queryByRole("status"), "Toast should disappear after the duration"), { timeout: 500 });`),
      ],
    },
    {
      slug: "rw-data-table",
      title: "Sortable, Filterable Data Table",
      difficulty: "HARD",
      tags: ["real-world", "tables", "sorting", "filtering"],
      estimatedMinutes: 30,
      description:
        "Build `DataTable({ rows })` for `{ id, name, role, age }[]`:\n\n- an input labelled `Search` that filters rows whose **name or role** contains the text (case-insensitive)\n- column headers `Name`, `Role`, `Age` are buttons; clicking sorts by that column ascending, clicking again descending (numbers sort numerically)\n- `<p>{shown} of {total} rows</p>` above the table\n- with no matches, a single row with one cell `No matching rows`\n\nRows start in their original order (unsorted).",
      requirements: ["Search filters name and role", "Sort toggles per column", "Numeric sort for age", "Row count and empty state"],
      hints: [
        "Derive everything: const visible = sort(filter(rows)) during render.",
        "Sort state: { key, dir } | null.",
        "Compare with typeof a[key] === \"number\" ? a - b : String(a).localeCompare(String(b)).",
      ],
      starterCode: `import { useState } from "react";\n\ninterface Row {\n  id: number;\n  name: string;\n  role: string;\n  age: number;\n}\n\nfunction DataTable({ rows }: { rows: Row[] }) {\n  // Write your solution here\n  return null;\n}\n\nexport default DataTable;\n`,
      solutionCode: `import { useState } from "react";\n\ninterface Row {\n  id: number;\n  name: string;\n  role: string;\n  age: number;\n}\n\ntype Key = "name" | "role" | "age";\nconst COLUMNS: { key: Key; label: string }[] = [\n  { key: "name", label: "Name" },\n  { key: "role", label: "Role" },\n  { key: "age", label: "Age" },\n];\n\nfunction DataTable({ rows }: { rows: Row[] }) {\n  const [query, setQuery] = useState("");\n  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>(null);\n\n  const q = query.toLowerCase();\n  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));\n  const visible = sort\n    ? [...filtered].sort((a, b) => {\n        const x = a[sort.key];\n        const y = b[sort.key];\n        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));\n        return cmp * sort.dir;\n      })\n    : filtered;\n\n  function toggle(key: Key) {\n    setSort((s) => ({ key, dir: s?.key === key && s.dir === 1 ? -1 : 1 }));\n  }\n\n  return (\n    <div>\n      <label>\n        Search <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <p>\n        {visible.length} of {rows.length} rows\n      </p>\n      <table>\n        <thead>\n          <tr>\n            {COLUMNS.map((c) => (\n              <th key={c.key}>\n                <button onClick={() => toggle(c.key)}>{c.label}</button>\n              </th>\n            ))}\n          </tr>\n        </thead>\n        <tbody>\n          {visible.length === 0 ? (\n            <tr>\n              <td colSpan={3}>No matching rows</td>\n            </tr>\n          ) : (\n            visible.map((r) => (\n              <tr key={r.id}>\n                <td>{r.name}</td>\n                <td>{r.role}</td>\n                <td>{r.age}</td>\n              </tr>\n            ))\n          )}\n        </tbody>\n      </table>\n    </div>\n  );\n}\n\nexport default DataTable;\n`,
      explanation: "Filtering and sorting are pure transformations of props + state, computed during render. Only the user's choices (query, sort) are stored.",
      tests: (() => {
        const ROWS = `[{ id: 1, name: "Cara", role: "Engineer", age: 31 }, { id: 2, name: "Abe", role: "Designer", age: 9 }, { id: 3, name: "Bo", role: "Engineer", age: 100 }]`;
        const names = `screen.getAllByRole("row").slice(1).map((r) => r.firstChild.textContent)`;
        return [
          test("filters by name or role", `renderComponent({ rows: ${ROWS} });\nexpectText("3 of 3 rows");\nawait userEvent.type(screen.getByLabelText("Search"), "engin");\nassertEqual(${names}, ["Cara", "Bo"]);\nexpectText("2 of 3 rows");`),
          hidden("sorts and toggles, numerically for age", `renderComponent({ rows: ${ROWS} });\nassertEqual(${names}, ["Cara", "Abe", "Bo"]);\n${click("Age")}\nassertEqual(${names}, ["Abe", "Cara", "Bo"]);\n${click("Age")}\nassertEqual(${names}, ["Bo", "Cara", "Abe"]);\n${click("Name")}\nassertEqual(${names}, ["Abe", "Bo", "Cara"]);`),
          hidden("empty state", `renderComponent({ rows: ${ROWS} });\nawait userEvent.type(screen.getByLabelText("Search"), "zzz");\nexpectText("No matching rows");\nexpectText("0 of 3 rows");`),
        ];
      })(),
    },
    {
      slug: "rw-autocomplete",
      title: "Accessible Autocomplete",
      difficulty: "HARD",
      tags: ["real-world", "combobox", "accessibility", "keyboard"],
      estimatedMinutes: 35,
      description:
        "Build `Autocomplete({ options, onSelect })` following the ARIA combobox pattern:\n\n- an input labelled `Country` with `role=\"combobox\"`, `aria-expanded`, and `aria-controls=\"country-listbox\"`\n- while the input has text, show `<ul role=\"listbox\" id=\"country-listbox\">` with the options that **start with** the text (case-insensitive) as `role=\"option\"` items\n- `ArrowDown`/`ArrowUp` move the active option (clamped at the ends); it gets `aria-selected=\"true\"`, and the input's `aria-activedescendant` points at its id\n- `Enter` (or clicking an option) selects it: fills the input, closes the list, calls `onSelect(option)`\n- `Escape` closes the list",
      requirements: ["Filtering", "Keyboard navigation with aria-activedescendant", "Select by Enter or click", "Escape closes"],
      hints: [
        "State: text, open, activeIndex.",
        "Option ids like \"option-\" + index let aria-activedescendant reference them.",
        "Typing should reopen the list and reset activeIndex to -1.",
      ],
      starterCode: `import { useState, type KeyboardEvent } from "react";\n\nfunction Autocomplete({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default Autocomplete;\n`,
      solutionCode: `import { useState, type KeyboardEvent } from "react";\n\nfunction Autocomplete({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) {\n  const [text, setText] = useState("");\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(-1);\n\n  const matches = text ? options.filter((o) => o.toLowerCase().startsWith(text.toLowerCase())) : [];\n  const expanded = open && matches.length > 0;\n\n  function choose(value: string) {\n    setText(value);\n    setOpen(false);\n    setActive(-1);\n    onSelect(value);\n  }\n\n  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {\n    if (!expanded) return;\n    if (event.key === "ArrowDown") {\n      event.preventDefault();\n      setActive((i) => Math.min(i + 1, matches.length - 1));\n    } else if (event.key === "ArrowUp") {\n      event.preventDefault();\n      setActive((i) => Math.max(i - 1, 0));\n    } else if (event.key === "Enter" && active >= 0) {\n      event.preventDefault();\n      choose(matches[active]);\n    } else if (event.key === "Escape") {\n      setOpen(false);\n    }\n  }\n\n  return (\n    <div>\n      <label htmlFor="country-input">Country</label>\n      <input\n        id="country-input"\n        role="combobox"\n        aria-expanded={expanded}\n        aria-controls="country-listbox"\n        aria-autocomplete="list"\n        aria-activedescendant={expanded && active >= 0 ? "option-" + active : undefined}\n        value={text}\n        onChange={(e) => {\n          setText(e.target.value);\n          setOpen(true);\n          setActive(-1);\n        }}\n        onKeyDown={handleKeyDown}\n      />\n      {expanded && (\n        <ul role="listbox" id="country-listbox">\n          {matches.map((option, i) => (\n            <li key={option} id={"option-" + i} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(option)}>\n              {option}\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n\nexport default Autocomplete;\n`,
      explanation: "With aria-activedescendant, focus stays in the input while screen readers announce the highlighted option. That's what lets users keep typing and navigating without focus jumping around.",
      tests: (() => {
        const OPTS = `["Canada", "Cameroon", "Chile", "Denmark"]`;
        return [
          test("filters and selects by click", `const onSelect = mockFn();\nrenderComponent({ options: ${OPTS}, onSelect });\nawait userEvent.type(screen.getByRole("combobox", { name: "Country" }), "ca");\nassertEqual(screen.getAllByRole("option").map((o) => o.textContent), ["Canada", "Cameroon"]);\nfireEvent.click(screen.getByRole("option", { name: "Cameroon" }));\nassertEqual(onSelect.calls, [["Cameroon"]]);\nassertEqual(screen.getByRole("combobox").value, "Cameroon");\nassert(!screen.queryByRole("listbox"));`),
          hidden("keyboard navigation", `const onSelect = mockFn();\nrenderComponent({ options: ${OPTS}, onSelect });\nconst input = screen.getByRole("combobox");\nawait userEvent.type(input, "c");\nassertEqual(input.getAttribute("aria-expanded"), "true");\nfireEvent.keyDown(input, { key: "ArrowDown" });\nfireEvent.keyDown(input, { key: "ArrowDown" });\nconst active = screen.getByRole("option", { name: "Cameroon" });\nassertEqual(active.getAttribute("aria-selected"), "true");\nassertEqual(input.getAttribute("aria-activedescendant"), active.id);\nfireEvent.keyDown(input, { key: "ArrowDown" });\nfireEvent.keyDown(input, { key: "ArrowDown" });\nfireEvent.keyDown(input, { key: "ArrowUp" });\nfireEvent.keyDown(input, { key: "Enter" });\nassertEqual(onSelect.calls, [["Cameroon"]]);`),
          hidden("Escape closes", `renderComponent({ options: ${OPTS}, onSelect: () => {} });\nconst input = screen.getByRole("combobox");\nawait userEvent.type(input, "d");\nscreen.getByRole("listbox");\nfireEvent.keyDown(input, { key: "Escape" });\nassert(!screen.queryByRole("listbox"));\nassertEqual(input.getAttribute("aria-expanded"), "false");`),
        ];
      })(),
    },
    {
      slug: "rw-shopping-cart",
      title: "Shopping Cart Page",
      difficulty: "HARD",
      tags: ["real-world", "useReducer", "cart"],
      estimatedMinutes: 35,
      description:
        "Build `CartPage` with the provided `PRODUCTS`:\n\n- an `Add {name}` button per product\n- each cart line: `<li>` with `{name}`, buttons `Decrease {name}` / `Increase {name}` (decreasing from 1 removes the line), and `Remove {name}`, plus the quantity\n- `<p>Subtotal: $X.XX</p>`, `<p>Shipping: $5.00</p>` (or `Shipping: Free` when the subtotal is $50 or more), `<p>Total: $X.XX</p>`\n- when empty: `Your cart is empty`, and the `Checkout` button is disabled\n\nA reducer is a good fit for the cart logic.",
      requirements: ["Add/increase/decrease/remove", "Subtotal, shipping rule, total", "Empty state and disabled checkout"],
      hints: ["Reducer actions: added, increased, decreased, removed.", "const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5;"],
      starterCode: `import { useReducer } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Tea", price: 6 },\n  { id: 2, name: "Teapot", price: 40 },\n];\n\nfunction CartPage() {\n  // Write your solution here\n  return null;\n}\n\nexport default CartPage;\n`,
      solutionCode: `import { useReducer } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Tea", price: 6 },\n  { id: 2, name: "Teapot", price: 40 },\n];\n\ntype Product = (typeof PRODUCTS)[number];\ninterface Line extends Product {\n  quantity: number;\n}\ntype Action = { type: "added"; product: Product } | { type: "increased" | "decreased" | "removed"; id: number };\n\nfunction cartReducer(lines: Line[], action: Action): Line[] {\n  switch (action.type) {\n    case "added":\n      return lines.some((l) => l.id === action.product.id)\n        ? lines.map((l) => (l.id === action.product.id ? { ...l, quantity: l.quantity + 1 } : l))\n        : [...lines, { ...action.product, quantity: 1 }];\n    case "increased":\n      return lines.map((l) => (l.id === action.id ? { ...l, quantity: l.quantity + 1 } : l));\n    case "decreased":\n      return lines.flatMap((l) => (l.id !== action.id ? [l] : l.quantity > 1 ? [{ ...l, quantity: l.quantity - 1 }] : []));\n    case "removed":\n      return lines.filter((l) => l.id !== action.id);\n  }\n}\n\nconst money = (n: number) => "$" + n.toFixed(2);\n\nfunction CartPage() {\n  const [lines, dispatch] = useReducer(cartReducer, []);\n  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);\n  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 5;\n\n  return (\n    <div>\n      <section>\n        {PRODUCTS.map((p) => (\n          <button key={p.id} onClick={() => dispatch({ type: "added", product: p })}>\n            Add {p.name}\n          </button>\n        ))}\n      </section>\n      {lines.length === 0 ? (\n        <p>Your cart is empty</p>\n      ) : (\n        <ul>\n          {lines.map((l) => (\n            <li key={l.id}>\n              <span>{l.name}</span>\n              <button onClick={() => dispatch({ type: "decreased", id: l.id })}>Decrease {l.name}</button>\n              <span>{l.quantity}</span>\n              <button onClick={() => dispatch({ type: "increased", id: l.id })}>Increase {l.name}</button>\n              <button onClick={() => dispatch({ type: "removed", id: l.id })}>Remove {l.name}</button>\n            </li>\n          ))}\n        </ul>\n      )}\n      <p>Subtotal: {money(subtotal)}</p>\n      <p>Shipping: {shipping === 0 && subtotal > 0 ? "Free" : money(shipping)}</p>\n      <p>Total: {money(subtotal + shipping)}</p>\n      <button disabled={lines.length === 0}>Checkout</button>\n    </div>\n  );\n}\n\nexport default CartPage;\n`,
      explanation: "The reducer owns every cart transition; totals and the shipping rule are derived, so they're always consistent with the lines.",
      tests: [
        test("adds, totals, shipping", `renderComponent();\nexpectText("Your cart is empty");\nassert(screen.getByRole("button", { name: "Checkout" }).disabled);\n${click("Add Tea")}\n${click("Add Tea")}\nexpectText("Subtotal: $12.00");\nexpectText("Shipping: $5.00");\nexpectText("Total: $17.00");`),
        hidden("free shipping and quantity controls", `renderComponent();\n${click("Add Teapot")}\n${click("Add Tea")}\n${click("Increase Tea")}\nexpectText("Subtotal: $52.00");\nexpectText("Shipping: Free");\nexpectText("Total: $52.00");\n${click("Decrease Tea")}\n${click("Decrease Tea")}\nassertEqual(screen.getAllByRole("listitem").length, 1);\n${click("Remove Teapot")}\nexpectText("Your cart is empty");\nassert(screen.getByRole("button", { name: "Checkout" }).disabled);`),
      ],
    },
    {
      slug: "rw-kanban-board",
      title: "Kanban Board",
      difficulty: "HARD",
      tags: ["real-world", "state-architecture", "lists"],
      estimatedMinutes: 35,
      description:
        "Build `KanbanBoard` with three columns: `Todo`, `Doing`, `Done`. Each column is a `<section aria-label={name}>` with an `<h2>` reading `{name} ({count})` and a `<ul>` of cards.\n\n- the `Todo` column has an input labelled `New card` and an `Add card` button (ignores blank input)\n- each card is an `<li>` with its title and buttons `Move {title} left` / `Move {title} right`, disabled in the first/last column\n\nStore cards as one flat array of `{ id, title, column }`.",
      requirements: ["Add cards to Todo", "Move between columns", "Counts in headings", "Edge buttons disabled"],
      hints: ["const COLUMNS = [\"Todo\", \"Doing\", \"Done\"];", "Moving changes a card's column to COLUMNS[index ± 1].", "Render each column by filtering the flat array."],
      starterCode: `import { useState } from "react";\n\nfunction KanbanBoard() {\n  // Write your solution here\n  return null;\n}\n\nexport default KanbanBoard;\n`,
      solutionCode: `import { useState } from "react";\n\nconst COLUMNS = ["Todo", "Doing", "Done"] as const;\ntype Column = (typeof COLUMNS)[number];\n\ninterface Card {\n  id: number;\n  title: string;\n  column: Column;\n}\n\nlet nextId = 1;\n\nfunction KanbanBoard() {\n  const [cards, setCards] = useState<Card[]>([]);\n  const [title, setTitle] = useState("");\n\n  function add() {\n    if (!title.trim()) return;\n    setCards((c) => [...c, { id: nextId++, title: title.trim(), column: "Todo" }]);\n    setTitle("");\n  }\n\n  function move(id: number, delta: number) {\n    setCards((c) =>\n      c.map((card) => {\n        if (card.id !== id) return card;\n        const index = COLUMNS.indexOf(card.column) + delta;\n        return index < 0 || index >= COLUMNS.length ? card : { ...card, column: COLUMNS[index] };\n      })\n    );\n  }\n\n  return (\n    <div>\n      {COLUMNS.map((column, ci) => {\n        const inColumn = cards.filter((c) => c.column === column);\n        return (\n          <section key={column} aria-label={column}>\n            <h2>\n              {column} ({inColumn.length})\n            </h2>\n            {column === "Todo" && (\n              <div>\n                <label>\n                  New card <input value={title} onChange={(e) => setTitle(e.target.value)} />\n                </label>\n                <button onClick={add}>Add card</button>\n              </div>\n            )}\n            <ul>\n              {inColumn.map((card) => (\n                <li key={card.id}>\n                  <span>{card.title}</span>\n                  <button disabled={ci === 0} onClick={() => move(card.id, -1)}>Move {card.title} left</button>\n                  <button disabled={ci === COLUMNS.length - 1} onClick={() => move(card.id, 1)}>Move {card.title} right</button>\n                </li>\n              ))}\n            </ul>\n          </section>\n        );\n      })}\n    </div>\n  );\n}\n\nexport default KanbanBoard;\n`,
      explanation: "One flat list with a `column` field is simpler than three separate arrays: moving a card is a single field update, and columns are just filtered views.",
      tests: [
        test("adds and moves cards", `renderComponent();\nawait userEvent.type(screen.getByLabelText("New card"), "Design");\n${click("Add card")}\nscreen.getByRole("heading", { name: "Todo (1)" });\n${click("Move Design right")}\nwithin(screen.getByRole("region", { name: "Doing" })).getByText("Design");\nscreen.getByRole("heading", { name: "Doing (1)" });`),
        hidden("edges and blanks", `renderComponent();\n${click("Add card")}\nscreen.getByRole("heading", { name: "Todo (0)" });\nawait userEvent.type(screen.getByLabelText("New card"), "QA");\n${click("Add card")}\nassert(screen.getByRole("button", { name: "Move QA left" }).disabled);\n${click("Move QA right")}\n${click("Move QA right")}\nassert(screen.getByRole("button", { name: "Move QA right" }).disabled);\nscreen.getByRole("heading", { name: "Done (1)" });\n${click("Move QA left")}\nwithin(screen.getByRole("region", { name: "Doing" })).getByText("QA");`),
      ],
    },
    {
      slug: "rw-todo-app",
      title: "Complete Todo App",
      difficulty: "MEDIUM",
      tags: ["real-world", "forms", "filters", "localStorage"],
      estimatedMinutes: 35,
      description:
        "Build a full `TodoApp`:\n\n- a form with an input labelled `What needs to be done?`; submitting adds a todo (ignore blanks)\n- each todo: a checkbox labelled with its text and a `Delete {text}` button\n- filter buttons `All`, `Active`, `Completed` with `aria-pressed` on the current one\n- `<p>{n} items left</p>` counting active todos (`1 item left` when singular)\n- a `Clear completed` button\n- todos persist to `localStorage` under the key `\"todos\"` (JSON) and are restored on load",
      requirements: ["Add/toggle/delete", "Filters with aria-pressed", "Items-left count with plural rule", "Clear completed", "Persistence"],
      hints: ["Lazy initial state: useState(() => JSON.parse(localStorage.getItem(\"todos\") ?? \"[]\"))", "Save in an effect on [todos].", "Keep the filter as state and derive the visible list."],
      starterCode: `import { useEffect, useState, type FormEvent } from "react";\n\nfunction TodoApp() {\n  // Write your solution here\n  return null;\n}\n\nexport default TodoApp;\n`,
      solutionCode: `import { useEffect, useState, type FormEvent } from "react";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\ntype Filter = "All" | "Active" | "Completed";\nconst FILTERS: Filter[] = ["All", "Active", "Completed"];\n\nfunction TodoApp() {\n  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem("todos") ?? "[]"));\n  const [text, setText] = useState("");\n  const [filter, setFilter] = useState<Filter>("All");\n\n  useEffect(() => {\n    localStorage.setItem("todos", JSON.stringify(todos));\n  }, [todos]);\n\n  function add(event: FormEvent) {\n    event.preventDefault();\n    if (!text.trim()) return;\n    setTodos((t) => [...t, { id: Date.now() + Math.random(), text: text.trim(), done: false }]);\n    setText("");\n  }\n\n  const visible = todos.filter((t) => (filter === "All" ? true : filter === "Active" ? !t.done : t.done));\n  const left = todos.filter((t) => !t.done).length;\n\n  return (\n    <div>\n      <form onSubmit={add}>\n        <label>\n          What needs to be done? <input value={text} onChange={(e) => setText(e.target.value)} />\n        </label>\n      </form>\n      <ul>\n        {visible.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => setTodos((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} /> {t.text}\n            </label>\n            <button onClick={() => setTodos((all) => all.filter((x) => x.id !== t.id))}>Delete {t.text}</button>\n          </li>\n        ))}\n      </ul>\n      <p>\n        {left} {left === 1 ? "item" : "items"} left\n      </p>\n      {FILTERS.map((f) => (\n        <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>\n          {f}\n        </button>\n      ))}\n      <button onClick={() => setTodos((all) => all.filter((t) => !t.done))}>Clear completed</button>\n    </div>\n  );\n}\n\nexport default TodoApp;\n`,
      explanation: "This combines most of the fundamentals: controlled forms, array state, derived data, filters, and syncing to storage with an effect.",
      tests: [
        test("add, complete, count", `localStorage.clear();\nrenderComponent();\nconst input = screen.getByLabelText("What needs to be done?");\nawait userEvent.type(input, "Milk{Enter}");\nawait userEvent.type(input, "Eggs{Enter}");\nexpectText("2 items left");\nfireEvent.click(screen.getByRole("checkbox", { name: "Milk" }));\nexpectText("1 item left");`),
        hidden("filters and clear completed", `localStorage.clear();\nrenderComponent();\nconst input = screen.getByLabelText("What needs to be done?");\nawait userEvent.type(input, "A{Enter}");\nawait userEvent.type(input, "B{Enter}");\nfireEvent.click(screen.getByRole("checkbox", { name: "A" }));\n${click("Active")}\nassertEqual(screen.getByRole("button", { name: "Active" }).getAttribute("aria-pressed"), "true");\nassertEqual(screen.getAllByRole("checkbox").map((c) => c.closest("label").textContent.trim()), ["B"]);\n${click("Completed")}\nassertEqual(screen.getAllByRole("checkbox").length, 1);\n${click("Clear completed")}\nassertEqual(screen.queryAllByRole("checkbox").length, 0);\n${click("All")}\nassertEqual(screen.getAllByRole("checkbox").length, 1);`),
        hidden("persists", `localStorage.setItem("todos", JSON.stringify([{ id: 1, text: "Saved one", done: true }]));\nconst { unmount } = renderComponent();\nscreen.getByRole("checkbox", { name: "Saved one" });\nexpectText("0 items left");\nawait userEvent.type(screen.getByLabelText("What needs to be done?"), "New{Enter}");\nunmount();\nassertEqual(JSON.parse(localStorage.getItem("todos")).map((t) => t.text), ["Saved one", "New"]);`),
      ],
    },
    {
      slug: "rw-infinite-scroll",
      title: "Infinite Scroll With IntersectionObserver",
      difficulty: "HARD",
      tags: ["real-world", "api", "intersection-observer", "pagination"],
      type: "API",
      estimatedMinutes: 35,
      description:
        "Build `Feed`, which loads `GET /api/posts?page={n}` (response `{ items: { id, title }[], hasMore }`) starting at page 1 and renders titles as `<li>`s.\n\nBelow the list, render a sentinel `<div data-testid=\"sentinel\" />`. Use an `IntersectionObserver` on it: when it becomes visible and there are more pages (and no request in flight), load the next page and **append** it. When `hasMore` is false, stop observing and show `<p>No more posts</p>`. Disconnect the observer on unmount.",
      requirements: ["Loads page 1", "Loads the next page when the sentinel is visible", "No duplicate requests while loading", "Stops at the end"],
      hints: [
        "Observe the sentinel through a ref in an effect; disconnect in the cleanup.",
        "The observer callback is created once, so read loading/page/hasMore from refs (or re-create the observer when they change).",
        "entries[0].isIntersecting tells you the sentinel is visible.",
      ],
      starterCode: `import { useCallback, useEffect, useRef, useState } from "react";\n\ninterface Post {\n  id: number;\n  title: string;\n}\n\nfunction Feed() {\n  // Write your solution here\n  return null;\n}\n\nexport default Feed;\n`,
      solutionCode: `import { useCallback, useEffect, useRef, useState } from "react";\n\ninterface Post {\n  id: number;\n  title: string;\n}\n\nfunction Feed() {\n  const [posts, setPosts] = useState<Post[]>([]);\n  const [hasMore, setHasMore] = useState(true);\n  const nextPage = useRef(1);\n  const loading = useRef(false);\n  const sentinelRef = useRef<HTMLDivElement>(null);\n\n  const loadMore = useCallback(async () => {\n    if (loading.current) return;\n    loading.current = true;\n    const res = await fetch(\`/api/posts?page=\${nextPage.current}\`);\n    const data: { items: Post[]; hasMore: boolean } = await res.json();\n    nextPage.current += 1;\n    setPosts((p) => [...p, ...data.items]);\n    setHasMore(data.hasMore);\n    loading.current = false;\n  }, []);\n\n  useEffect(() => {\n    loadMore();\n  }, [loadMore]);\n\n  useEffect(() => {\n    if (!hasMore || !sentinelRef.current) return;\n    const observer = new IntersectionObserver((entries) => {\n      if (entries[0].isIntersecting) loadMore();\n    });\n    observer.observe(sentinelRef.current);\n    return () => observer.disconnect();\n  }, [hasMore, loadMore]);\n\n  return (\n    <div>\n      <ul>\n        {posts.map((p) => (\n          <li key={p.id}>{p.title}</li>\n        ))}\n      </ul>\n      {hasMore ? <div data-testid="sentinel" ref={sentinelRef} /> : <p>No more posts</p>}\n    </div>\n  );\n}\n\nexport default Feed;\n`,
      explanation: "IntersectionObserver tells you when an element scrolls into view without listening to every scroll event. A ref-based 'loading' flag prevents firing duplicate requests while one is in flight.",
      mockApi: [
        { url: "/api/posts?page=1", response: { items: [{ id: 1, title: "Post 1" }, { id: 2, title: "Post 2" }], hasMore: true } },
        { url: "/api/posts?page=2", delayMs: 30, response: { items: [{ id: 3, title: "Post 3" }], hasMore: false } },
      ],
      tests: (() => {
        const mockIO = `const observers = [];\nglobalThis.IntersectionObserver = class {\n  constructor(callback) { this.callback = callback; this.targets = []; this.disconnected = false; observers.push(this); }\n  observe(el) { this.targets.push(el); }\n  unobserve() {}\n  disconnect() { this.disconnected = true; }\n};\nconst reveal = () => act(() => { for (const o of observers) if (!o.disconnected && o.targets.length) o.callback([{ isIntersecting: true, target: o.targets[0] }]); });`;
        return [
          test("loads the first page", `${mockIO}\nrenderComponent();\nawait waitFor(() => expectText("Post 2"));\nassert(observers.some((o) => o.targets.length), "Observe the sentinel with an IntersectionObserver");`),
          hidden("loads more when the sentinel is visible, once", `${mockIO}\nrenderComponent();\nawait waitFor(() => expectText("Post 2"));\nreveal();\nreveal();\nawait waitFor(() => expectText("Post 3"));\nawait waitFor(() => expectText("No more posts"));\nassertEqual(${items}, ["Post 1", "Post 2", "Post 3"]);\nassertEqual(mockApi.calls.map((c) => c.url), ["/api/posts?page=1", "/api/posts?page=2"]);`),
          hidden("disconnects on unmount", `${mockIO}\nconst { unmount } = renderComponent();\nawait waitFor(() => expectText("Post 2"));\nunmount();\nassert(observers.every((o) => o.disconnected), "Disconnect the observer when the component unmounts");`),
        ];
      })(),
    },
  ],
};
