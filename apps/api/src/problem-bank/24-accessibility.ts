import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string, role = "button") => `fireEvent.click(screen.getByRole(${JSON.stringify(role)}, { name: ${JSON.stringify(name)} }));`;
const focused = (desc: string, query: string) => `assertEqual(document.activeElement, ${query}, ${JSON.stringify(`Focus should be on ${desc}`)});`;

export const accessibility: CategoryBank = {
  category: "Accessibility",
  level: 24,
  type: "COMPONENT",
  prerequisites: ["JSX", "Events", "useState", "useRef"],
  problems: [
    {
      slug: "a11y-icon-button",
      title: "Name an Icon-Only Button",
      difficulty: "EASY",
      tags: ["accessibility", "aria-label"],
      estimatedMinutes: 8,
      description:
        "This close button only contains an SVG icon, so screen readers announce it as just \"button\". Give it the accessible name `Close dialog` with `aria-label`, and hide the decorative SVG from assistive technology with `aria-hidden=\"true\"`. Clicking still calls `onClose`.",
      requirements: ["Button's accessible name is 'Close dialog'", "Icon is hidden from assistive tech"],
      hints: ["<button aria-label=\"Close dialog\">", "<svg aria-hidden=\"true\" ...>"],
      starterCode: `function CloseButton({ onClose }: { onClose: () => void }) {\n  return (\n    <button onClick={onClose}>\n      <svg width="16" height="16" viewBox="0 0 16 16">\n        <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" />\n      </svg>\n    </button>\n  );\n}\n\nexport default CloseButton;\n`,
      solutionCode: `function CloseButton({ onClose }: { onClose: () => void }) {\n  return (\n    <button aria-label="Close dialog" onClick={onClose}>\n      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">\n        <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" />\n      </svg>\n    </button>\n  );\n}\n\nexport default CloseButton;\n`,
      explanation: "Every interactive control needs an accessible name. When there's no visible text, aria-label provides one; aria-hidden keeps purely decorative graphics out of the accessibility tree.",
      tests: [
        test("has an accessible name", `const onClose = mockFn();\nrenderComponent({ onClose });\n${click("Close dialog")}\nassertEqual(onClose.calls.length, 1);`),
        hidden("icon is decorative", `const { container } = renderComponent({ onClose: () => {} });\nassertEqual(container.querySelector("svg").getAttribute("aria-hidden"), "true");`),
      ],
    },
    {
      slug: "a11y-live-region",
      title: "Announce Updates With a Live Region",
      difficulty: "EASY",
      tags: ["accessibility", "aria-live", "status"],
      estimatedMinutes: 10,
      description:
        "As the user types in `Filter`, `FruitFilter` shows how many fruits match — but screen-reader users never hear the count change. Put the count in a **live region**: `role=\"status\"` (which implies `aria-live=\"polite\"`), so updates are announced without moving focus. Keep the text `{n} results`.",
      requirements: ["Count is in a role='status' element", "Updates as the user types"],
      hints: ["<p role=\"status\">{matches.length} results</p>", "Live regions should exist on the page before their content changes — render the element always, only its text changes."],
      starterCode: `import { useState } from "react";\n\nconst FRUITS = ["Apple", "Apricot", "Banana", "Cherry"];\n\nfunction FruitFilter() {\n  const [query, setQuery] = useState("");\n  const matches = FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()));\n  return (\n    <div>\n      <label>\n        Filter <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <p>{matches.length} results</p>\n      <ul>\n        {matches.map((f) => (\n          <li key={f}>{f}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default FruitFilter;\n`,
      solutionCode: `import { useState } from "react";\n\nconst FRUITS = ["Apple", "Apricot", "Banana", "Cherry"];\n\nfunction FruitFilter() {\n  const [query, setQuery] = useState("");\n  const matches = FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()));\n  return (\n    <div>\n      <label>\n        Filter <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <p role="status">{matches.length} results</p>\n      <ul>\n        {matches.map((f) => (\n          <li key={f}>{f}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default FruitFilter;\n`,
      explanation: "Visual changes elsewhere on the page are invisible to screen-reader users unless announced. Live regions tell assistive tech to read their content when it changes.",
      tests: [
        test("count updates", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Filter"), "ap");\nexpectText("2 results");`),
        hidden("count is a status region", `renderComponent();\nassertEqual(screen.getByRole("status").textContent, "4 results");\nawait userEvent.type(screen.getByLabelText("Filter"), "ch");\nassertEqual(screen.getByRole("status").textContent, "1 results");`),
      ],
    },
    {
      slug: "a11y-disclosure",
      title: "Accessible Disclosure Widget",
      difficulty: "EASY",
      tags: ["accessibility", "aria-expanded", "aria-controls"],
      estimatedMinutes: 12,
      description:
        "Build `ShippingInfo`: a button `Shipping details` that shows/hides a panel `<div id=\"shipping-panel\">Ships in 2–3 days.</div>`.\n\n- the button has `aria-expanded` (true/false) and `aria-controls=\"shipping-panel\"`\n- when collapsed, the panel stays in the DOM but has the `hidden` attribute",
      requirements: ["aria-expanded reflects the state", "aria-controls points at the panel", "Collapsed panel is hidden"],
      hints: ["<button aria-expanded={open} aria-controls=\"shipping-panel\">", "<div id=\"shipping-panel\" hidden={!open}>"],
      starterCode: `import { useState } from "react";\n\nfunction ShippingInfo() {\n  // Write your solution here\n  return null;\n}\n\nexport default ShippingInfo;\n`,
      solutionCode: `import { useState } from "react";\n\nfunction ShippingInfo() {\n  const [open, setOpen] = useState(false);\n  return (\n    <div>\n      <button aria-expanded={open} aria-controls="shipping-panel" onClick={() => setOpen((o) => !o)}>\n        Shipping details\n      </button>\n      <div id="shipping-panel" hidden={!open}>\n        Ships in 2–3 days.\n      </div>\n    </div>\n  );\n}\n\nexport default ShippingInfo;\n`,
      explanation: "aria-expanded tells screen-reader users whether activating the button will open or close something; aria-controls identifies what it controls. The `hidden` attribute hides content from everyone, including assistive tech.",
      tests: [
        test("toggles", `renderComponent();\nconst button = screen.getByRole("button", { name: "Shipping details" });\nassertEqual(button.getAttribute("aria-expanded"), "false");\nfireEvent.click(button);\nassertEqual(button.getAttribute("aria-expanded"), "true");\nexpectText("Ships in 2–3 days.");`),
        hidden("panel wiring", `const { container } = renderComponent();\nconst panel = container.querySelector("#shipping-panel");\nassert(panel, "Expected #shipping-panel to exist even when collapsed");\nassert(panel.hidden, "Collapsed panel should have the hidden attribute");\nassertEqual(screen.getByRole("button").getAttribute("aria-controls"), "shipping-panel");\n${click("Shipping details")}\nassert(!panel.hidden);`),
      ],
    },
    {
      slug: "a11y-skip-link",
      title: "Add a Skip Link",
      difficulty: "EASY",
      tags: ["accessibility", "keyboard", "focus"],
      estimatedMinutes: 12,
      description:
        "Keyboard users shouldn't have to tab through the whole navigation on every page. Make the **first** focusable element a link `Skip to main content` (`href=\"#main\"`). Clicking it moves focus to `<main id=\"main\" tabIndex={-1}>` (use a ref and `focus()`; also call `preventDefault`). The provided nav has three links.",
      requirements: ["Skip link is the first tab stop", "Activating it focuses <main>"],
      hints: ["tabIndex={-1} makes <main> focusable by script but not by Tab.", "onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}"],
      starterCode: `import { useRef } from "react";\n\nfunction Page() {\n  return (\n    <div>\n      <nav>\n        <a href="/a">Products</a>\n        <a href="/b">Pricing</a>\n        <a href="/c">Docs</a>\n      </nav>\n      <main>\n        <h1>Welcome</h1>\n      </main>\n    </div>\n  );\n}\n\nexport default Page;\n`,
      solutionCode: `import { useRef } from "react";\n\nfunction Page() {\n  const mainRef = useRef<HTMLElement>(null);\n  return (\n    <div>\n      <a\n        href="#main"\n        onClick={(e) => {\n          e.preventDefault();\n          mainRef.current?.focus();\n        }}\n      >\n        Skip to main content\n      </a>\n      <nav>\n        <a href="/a">Products</a>\n        <a href="/b">Pricing</a>\n        <a href="/c">Docs</a>\n      </nav>\n      <main id="main" ref={mainRef} tabIndex={-1}>\n        <h1>Welcome</h1>\n      </main>\n    </div>\n  );\n}\n\nexport default Page;\n`,
      explanation: "A skip link lets keyboard and screen-reader users jump past repeated navigation. It's usually visually hidden until focused (with CSS), but it must be the first thing Tab reaches.",
      tests: [
        test("skip link is first", `renderComponent();\nawait userEvent.tab();\n${focused("the skip link", `screen.getByRole("link", { name: "Skip to main content" })`)}`),
        hidden("skip link moves focus to main", `renderComponent();\n${click("Skip to main content", "link")}\n${focused("<main>", `screen.getByRole("main")`)}\nassertEqual(screen.getByRole("main").getAttribute("tabindex"), "-1");`),
      ],
    },
    {
      slug: "a11y-sortable-table",
      title: "Accessible Sortable Table",
      difficulty: "MEDIUM",
      tags: ["accessibility", "tables", "aria-sort"],
      estimatedMinutes: 20,
      description:
        "Make `ScoreTable({ rows })` (rows are `{ name, score }`) sortable by the `Name` or `Score` column. Each column header `<th>` contains a `<button>` with the column name. Clicking a header sorts by it ascending; clicking the same header again toggles to descending.\n\nThe sorted `<th>` gets `aria-sort=\"ascending\"` or `\"descending\"`; the other gets `aria-sort=\"none\"`. Initially sort by Name ascending.",
      requirements: ["Sort buttons in headers", "Toggle direction on repeat click", "aria-sort on headers"],
      hints: ["State: { key: \"name\" | \"score\", dir: \"ascending\" | \"descending\" }", "Sort a copy: [...rows].sort(...) — reverse the comparison for descending."],
      starterCode: `import { useState } from "react";\n\ninterface Row {\n  name: string;\n  score: number;\n}\n\nfunction ScoreTable({ rows }: { rows: Row[] }) {\n  // Write your solution here\n  return null;\n}\n\nexport default ScoreTable;\n`,
      solutionCode: `import { useState } from "react";\n\ninterface Row {\n  name: string;\n  score: number;\n}\n\ntype Key = "name" | "score";\ntype Dir = "ascending" | "descending";\n\nfunction ScoreTable({ rows }: { rows: Row[] }) {\n  const [sort, setSort] = useState<{ key: Key; dir: Dir }>({ key: "name", dir: "ascending" });\n\n  const sorted = [...rows].sort((a, b) => {\n    const cmp = sort.key === "name" ? a.name.localeCompare(b.name) : a.score - b.score;\n    return sort.dir === "ascending" ? cmp : -cmp;\n  });\n\n  function sortBy(key: Key) {\n    setSort((s) => ({ key, dir: s.key === key && s.dir === "ascending" ? "descending" : "ascending" }));\n  }\n\n  const ariaSort = (key: Key) => (sort.key === key ? sort.dir : "none");\n\n  return (\n    <table>\n      <thead>\n        <tr>\n          <th aria-sort={ariaSort("name")}>\n            <button onClick={() => sortBy("name")}>Name</button>\n          </th>\n          <th aria-sort={ariaSort("score")}>\n            <button onClick={() => sortBy("score")}>Score</button>\n          </th>\n        </tr>\n      </thead>\n      <tbody>\n        {sorted.map((r) => (\n          <tr key={r.name}>\n            <td>{r.name}</td>\n            <td>{r.score}</td>\n          </tr>\n        ))}\n      </tbody>\n    </table>\n  );\n}\n\nexport default ScoreTable;\n`,
      explanation: "Putting a real button in each header makes sorting keyboard-accessible, and aria-sort tells screen-reader users which column is sorted and in which direction.",
      tests: [
        test("sorts by score", `renderComponent({ rows: [{ name: "Cy", score: 5 }, { name: "Ann", score: 9 }, { name: "Bo", score: 1 }] });\n${click("Score")}\nassertEqual(screen.getAllByRole("row").slice(1).map((r) => r.firstChild.textContent), ["Bo", "Cy", "Ann"]);`),
        hidden("toggles direction and sets aria-sort", `renderComponent({ rows: [{ name: "Cy", score: 5 }, { name: "Ann", score: 9 }, { name: "Bo", score: 1 }] });\nconst headers = () => screen.getAllByRole("columnheader").map((h) => h.getAttribute("aria-sort"));\nassertEqual(headers(), ["ascending", "none"]);\n${click("Name")}\nassertEqual(headers(), ["descending", "none"]);\nassertEqual(screen.getAllByRole("row").slice(1).map((r) => r.firstChild.textContent), ["Cy", "Bo", "Ann"]);\n${click("Score")}\nassertEqual(headers(), ["none", "ascending"]);`),
      ],
    },
    {
      slug: "a11y-tabs-keyboard",
      title: "Keyboard-Accessible Tabs",
      difficulty: "HARD",
      tags: ["accessibility", "aria", "keyboard", "tabs"],
      estimatedMinutes: 30,
      description:
        "Build `Tabs({ tabs })` (`{ id, label, content }[]`) following the WAI-ARIA tabs pattern:\n\n- a `role=\"tablist\"` containing a `role=\"tab\"` button per tab, with `aria-selected` and `aria-controls={\"panel-\" + id}`\n- one `role=\"tabpanel\"` with `id={\"panel-\" + id}` showing the selected tab's content, labelled by its tab (`aria-labelledby`, tabs have `id={\"tab-\" + id}`)\n- **roving tabindex**: only the selected tab has `tabIndex={0}`, the others `-1`\n- keyboard: `ArrowRight`/`ArrowLeft` select the next/previous tab (wrapping) and move focus to it; `Home`/`End` go to the first/last tab\n\nThe first tab is selected initially.",
      requirements: ["Correct roles and ARIA attributes", "Roving tabindex", "Arrow/Home/End keys move selection and focus"],
      hints: [
        "Keep the selected index in state and an array of refs to the tab buttons.",
        "On keydown, compute the next index (with modulo for wrapping), select it, and focus tabRefs.current[next].",
        "tabIndex={i === selected ? 0 : -1}",
      ],
      starterCode: `import { useRef, useState, type KeyboardEvent } from "react";\n\ninterface Tab {\n  id: string;\n  label: string;\n  content: string;\n}\n\nfunction Tabs({ tabs }: { tabs: Tab[] }) {\n  // Write your solution here\n  return null;\n}\n\nexport default Tabs;\n`,
      solutionCode: `import { useRef, useState, type KeyboardEvent } from "react";\n\ninterface Tab {\n  id: string;\n  label: string;\n  content: string;\n}\n\nfunction Tabs({ tabs }: { tabs: Tab[] }) {\n  const [selected, setSelected] = useState(0);\n  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);\n\n  function select(index: number) {\n    setSelected(index);\n    tabRefs.current[index]?.focus();\n  }\n\n  function handleKeyDown(event: KeyboardEvent) {\n    const last = tabs.length - 1;\n    const next =\n      event.key === "ArrowRight" ? (selected + 1) % tabs.length :\n      event.key === "ArrowLeft" ? (selected - 1 + tabs.length) % tabs.length :\n      event.key === "Home" ? 0 :\n      event.key === "End" ? last :\n      null;\n    if (next === null) return;\n    event.preventDefault();\n    select(next);\n  }\n\n  const current = tabs[selected];\n\n  return (\n    <div>\n      <div role="tablist" onKeyDown={handleKeyDown}>\n        {tabs.map((tab, i) => (\n          <button\n            key={tab.id}\n            ref={(el) => {\n              tabRefs.current[i] = el;\n            }}\n            role="tab"\n            id={"tab-" + tab.id}\n            aria-selected={i === selected}\n            aria-controls={"panel-" + tab.id}\n            tabIndex={i === selected ? 0 : -1}\n            onClick={() => select(i)}\n          >\n            {tab.label}\n          </button>\n        ))}\n      </div>\n      <div role="tabpanel" id={"panel-" + current.id} aria-labelledby={"tab-" + current.id}>\n        {current.content}\n      </div>\n    </div>\n  );\n}\n\nexport default Tabs;\n`,
      explanation: "With roving tabindex the whole tab list is a single Tab stop; arrow keys move within it. This is the keyboard behaviour screen-reader and keyboard users expect from any tab widget.",
      tests: (() => {
        const TABS = `[{ id: "a", label: "Overview", content: "Overview text" }, { id: "b", label: "Specs", content: "Specs text" }, { id: "c", label: "Reviews", content: "Reviews text" }]`;
        return [
          test("click selects a tab", `renderComponent({ tabs: ${TABS} });\nfireEvent.click(screen.getByRole("tab", { name: "Specs" }));\nassertEqual(screen.getByRole("tabpanel", { name: "Specs" }).textContent, "Specs text");\nassertEqual(screen.getByRole("tab", { name: "Specs" }).getAttribute("aria-selected"), "true");`),
          hidden("roving tabindex and wiring", `renderComponent({ tabs: ${TABS} });\nassertEqual(screen.getAllByRole("tab").map((t) => t.getAttribute("tabindex")), ["0", "-1", "-1"]);\nconst panel = screen.getByRole("tabpanel");\nassertEqual(panel.id, "panel-a");\nassertEqual(screen.getByRole("tab", { name: "Overview" }).getAttribute("aria-controls"), "panel-a");`),
          hidden("arrow keys, Home and End", `renderComponent({ tabs: ${TABS} });\nconst first = screen.getByRole("tab", { name: "Overview" });\nfirst.focus();\nfireEvent.keyDown(first, { key: "ArrowLeft" });\n${focused("the last tab (wrapping)", `screen.getByRole("tab", { name: "Reviews" })`)}\nexpectText("Reviews text");\nfireEvent.keyDown(document.activeElement, { key: "ArrowRight" });\n${focused("the first tab (wrapping)", "first")}\nfireEvent.keyDown(first, { key: "End" });\n${focused("the last tab", `screen.getByRole("tab", { name: "Reviews" })`)}\nfireEvent.keyDown(document.activeElement, { key: "Home" });\n${focused("the first tab", "first")}\nassertEqual(screen.getAllByRole("tab").map((t) => t.getAttribute("tabindex")), ["0", "-1", "-1"]);`),
        ];
      })(),
    },
    {
      slug: "a11y-modal-focus",
      title: "Modal Focus Management",
      difficulty: "HARD",
      tags: ["accessibility", "focus-management", "dialog", "keyboard"],
      estimatedMinutes: 30,
      description:
        "Make `DeleteDialogDemo` render a button `Delete project` that opens a confirmation dialog: `<div role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"dlg-title\">` with `<h2 id=\"dlg-title\">Delete project?</h2>` and buttons `Cancel` and `Delete`.\n\nFocus management:\n\n- when the dialog opens, focus moves to the `Cancel` button (the safe action)\n- `Escape` or `Cancel` closes it\n- when it closes, focus **returns** to the `Delete project` button that opened it\n- `Delete` calls `onDelete()` and closes",
      requirements: ["Focus moves into the dialog", "Escape and Cancel close it", "Focus returns to the trigger", "Delete calls onDelete"],
      hints: [
        "Refs for the trigger and the Cancel button.",
        "useEffect(() => { if (open) cancelRef.current?.focus(); }, [open]);",
        "A close() helper that sets open=false and then calls triggerRef.current?.focus().",
      ],
      starterCode: `import { useEffect, useRef, useState } from "react";\n\nfunction DeleteDialogDemo({ onDelete }: { onDelete: () => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default DeleteDialogDemo;\n`,
      solutionCode: `import { useEffect, useRef, useState } from "react";\n\nfunction DeleteDialogDemo({ onDelete }: { onDelete: () => void }) {\n  const [open, setOpen] = useState(false);\n  const triggerRef = useRef<HTMLButtonElement>(null);\n  const cancelRef = useRef<HTMLButtonElement>(null);\n\n  useEffect(() => {\n    if (open) cancelRef.current?.focus();\n  }, [open]);\n\n  function close() {\n    setOpen(false);\n    triggerRef.current?.focus();\n  }\n\n  return (\n    <div>\n      <button ref={triggerRef} onClick={() => setOpen(true)}>\n        Delete project\n      </button>\n      {open && (\n        <div\n          role="dialog"\n          aria-modal="true"\n          aria-labelledby="dlg-title"\n          onKeyDown={(e) => {\n            if (e.key === "Escape") close();\n          }}\n        >\n          <h2 id="dlg-title">Delete project?</h2>\n          <button ref={cancelRef} onClick={close}>\n            Cancel\n          </button>\n          <button\n            onClick={() => {\n              onDelete();\n              close();\n            }}\n          >\n            Delete\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}\n\nexport default DeleteDialogDemo;\n`,
      explanation: "When a dialog opens, keyboard and screen-reader users need focus inside it; when it closes, they need focus back where they were, or they're dumped at the top of the page. Native <dialog> with showModal() does much of this for you.",
      tests: [
        test("opens with focus on Cancel", `renderComponent({ onDelete: () => {} });\n${click("Delete project")}\nscreen.getByRole("dialog", { name: "Delete project?" });\n${focused("Cancel", `screen.getByRole("button", { name: "Cancel" })`)}`),
        hidden("Escape closes and returns focus", `renderComponent({ onDelete: () => {} });\n${click("Delete project")}\nfireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), { key: "Escape" });\nassert(!screen.queryByRole("dialog"), "Escape should close the dialog");\n${focused("the Delete project button", `screen.getByRole("button", { name: "Delete project" })`)}`),
        hidden("Delete calls onDelete and returns focus", `const onDelete = mockFn();\nrenderComponent({ onDelete });\n${click("Delete project")}\n${click("Delete")}\nassertEqual(onDelete.calls.length, 1);\nassert(!screen.queryByRole("dialog"));\n${focused("the Delete project button", `screen.getByRole("button", { name: "Delete project" })`)}`),
      ],
    },
  ],
};
