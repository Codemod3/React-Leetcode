import { hidden, test, type ProblemDef } from "./types.js";
import { clean, mustAccept, mustReject, STRICT_NOTE } from "./21-typescript.js";
import { catchesMutants, NOTE, passesCorrect, testStarter } from "./22-testing.js";

// Batch 3 for levels 21–25: more Medium/Hard practice. index.ts merges these into the
// matching category banks.

const click = (name: string, role = "button") => `fireEvent.click(screen.getByRole(${JSON.stringify(role)}, { name: ${JSON.stringify(name)} }));`;
const items = `screen.queryAllByRole("listitem").map((el) => el.textContent)`;
const focused = (desc: string, query: string) => `assertEqual(document.activeElement, ${query}, ${JSON.stringify(`Focus should be on ${desc}`)});`;
const noMoreThan = (counter: string, max: number, body: string, message: string) =>
  `{\nconst before = userExports.${counter};\n${body}\nconst grew = userExports.${counter} - before;\nassert(grew <= ${max}, ${JSON.stringify(message)} + " (" + grew + ")");\n}`;

export const typescriptMore: ProblemDef[] = [
  {
    slug: "ts-extend-native-props",
    title: "Extend Native Element Props",
    difficulty: "MEDIUM",
    tags: ["typescript", "props", "reusable-components"],
    estimatedMinutes: 15,
    description:
      "Type the reusable `Button` so it accepts **every** native `<button>` prop (`type`, `disabled`, `onClick`, `aria-*`...) plus its own `variant?: \"primary\" | \"ghost\"` (default `primary`). It renders `<button>` with class names `btn btn-{variant}` followed by any `className` passed in, and forwards everything else." + STRICT_NOTE,
    requirements: ["Native button props are accepted and forwarded", "variant is a two-value union", "Props that buttons don't have are rejected"],
    hints: ["import type { ComponentPropsWithoutRef } from \"react\";", "interface ButtonProps extends ComponentPropsWithoutRef<\"button\"> { variant?: ... }"],
    starterCode: `function Button(props: any) {\n  const { variant = "primary", className, ...rest } = props;\n  return <button className={["btn", "btn-" + variant, className].filter(Boolean).join(" ")} {...rest} />;\n}\n\nexport default Button;\n`,
    solutionCode: `import type { ComponentPropsWithoutRef } from "react";\n\ninterface ButtonProps extends ComponentPropsWithoutRef<"button"> {\n  variant?: "primary" | "ghost";\n}\n\nfunction Button({ variant = "primary", className, ...rest }: ButtonProps) {\n  return <button className={["btn", "btn-" + variant, className].filter(Boolean).join(" ")} {...rest} />;\n}\n\nexport default Button;\n`,
    explanation: "Extending `ComponentPropsWithoutRef<\"button\">` gives a wrapper the full, correctly typed API of the element it wraps, so callers never hit a missing prop — and TypeScript still rejects props a button doesn't support.",
    tests: [
      test("renders and forwards props", `renderComponent({ variant: "ghost", className: "wide", type: "submit", disabled: true, children: "Save" });\nconst b = screen.getByRole("button", { name: "Save" });\nassertEqual(b.className, "btn btn-ghost wide");\nassertEqual(b.getAttribute("type"), "submit");\nassert(b.disabled);\n${clean}`),
      hidden("types accept native props and reject others", `${mustAccept("const ok = <Button type=\"submit\" disabled aria-label=\"Save\" onClick={(e) => e.currentTarget.blur()}>x</Button>;")}\n${mustReject(["const a = <Button variant=\"link\">x</Button>;", "const b = <Button href=\"/x\">x</Button>;"])}`),
    ],
    wrongSolutions: [
      `import type { ReactNode } from "react";\ninterface ButtonProps { variant?: "primary" | "ghost"; className?: string; children?: ReactNode }\nfunction Button({ variant = "primary", className, ...rest }: ButtonProps) {\n  return <button className={["btn", "btn-" + variant, className].filter(Boolean).join(" ")} {...rest} />;\n}\nexport default Button;\n`,
    ],
  },
  {
    slug: "ts-generic-select",
    title: "A Type-Safe Generic Select",
    difficulty: "HARD",
    tags: ["typescript", "generics", "forms"],
    estimatedMinutes: 25,
    description:
      "Make `Select<T>` generic so it works with any option type and hands the **original option object** back to `onChange`:\n\n```\n<Select label=\"Owner\" options={users} value={owner} onChange={setOwner}\n        getKey={(u) => String(u.id)} getLabel={(u) => u.name} />\n```\n\nRender `<label>{label} <select>` with one `<option value={getKey(o)}>{getLabel(o)}</option>` per option; on change, find the option whose key matches and pass it to `onChange`." + STRICT_NOTE,
    requirements: ["Generic over the option type", "onChange receives the option object, not a string", "Callbacks are checked against the option type"],
    hints: [
      "interface SelectProps<T> { label: string; options: T[]; value: T; onChange: (value: T) => void; getKey: (o: T) => string; getLabel: (o: T) => string }",
      "function Select<T>(props: SelectProps<T>)",
      "options.find((o) => getKey(o) === event.target.value)",
    ],
    starterCode: `interface SelectProps {\n  label: string;\n  options: any[];\n  value: any;\n  onChange: (value: any) => void;\n  getKey: (option: any) => string;\n  getLabel: (option: any) => string;\n}\n\nfunction Select({ label, options, value, onChange, getKey, getLabel }: SelectProps) {\n  return (\n    <label>\n      {label}{" "}\n      <select value={getKey(value)} onChange={(e) => onChange(e.target.value)}>\n        {options.map((o) => (\n          <option key={getKey(o)} value={getKey(o)}>\n            {getLabel(o)}\n          </option>\n        ))}\n      </select>\n    </label>\n  );\n}\n\nexport default Select;\n`,
    solutionCode: `interface SelectProps<T> {\n  label: string;\n  options: T[];\n  value: T;\n  onChange: (value: T) => void;\n  getKey: (option: T) => string;\n  getLabel: (option: T) => string;\n}\n\nfunction Select<T>({ label, options, value, onChange, getKey, getLabel }: SelectProps<T>) {\n  return (\n    <label>\n      {label}{" "}\n      <select\n        value={getKey(value)}\n        onChange={(e) => {\n          const next = options.find((o) => getKey(o) === e.target.value);\n          if (next !== undefined) onChange(next);\n        }}\n      >\n        {options.map((o) => (\n          <option key={getKey(o)} value={getKey(o)}>\n            {getLabel(o)}\n          </option>\n        ))}\n      </select>\n    </label>\n  );\n}\n\nexport default Select;\n`,
    explanation: "DOM selects only know strings. A generic wrapper maps those strings back to real objects, so callers work with their own types end to end — and TypeScript checks every callback against them.",
    tests: [
      test("hands back the option object", `const users = [{ id: 1, name: "Ada" }, { id: 2, name: "Bo" }];\nconst onChange = mockFn();\nrenderComponent({ label: "Owner", options: users, value: users[0], onChange, getKey: (u) => String(u.id), getLabel: (u) => u.name });\nawait userEvent.selectOptions(screen.getByLabelText("Owner"), "Bo");\nassert(onChange.calls[0][0] === users[1], "onChange should receive the original option object");\n${clean}`),
      hidden("generic types", `${mustReject(["const a = <Select label=\"x\" options={[{ id: 1 }]} value={{ id: 1 }} getKey={(o) => String(o.id)} getLabel={(o) => o.name} onChange={() => {}} />;", "const b = <Select label=\"x\" options={[1, 2]} value={1} getKey={String} getLabel={String} onChange={(v: string) => {}} />;"])}\n${mustAccept("const ok = <Select label=\"x\" options={[1, 2]} value={2} getKey={String} getLabel={(n) => n.toFixed(1)} onChange={(n) => n.toFixed()} />;")}`),
    ],
  },
  {
    slug: "ts-exhaustive-switch",
    title: "Exhaustive Switches With never",
    difficulty: "MEDIUM",
    tags: ["typescript", "unions", "never"],
    estimatedMinutes: 15,
    description:
      "`statusLabel` is missing the `archived` case and silently returns `Unknown`. Make the switch **exhaustive**, so forgetting a case is a compile error:\n\n1. Export `assertNever(value: never): never`, which throws `new Error(\"Unexpected value: \" + value)`.\n2. Handle every `Status` (`active` → `Active`, `paused` → `Paused`, `archived` → `Archived`) and call `assertNever(status)` in the `default` branch." + "\n\nThe tests type-check your file with `strict: true`.",
    requirements: ["All statuses handled", "default branch uses assertNever", "assertNever only accepts never"],
    hints: ["In the default branch, every case has been handled, so TypeScript narrows status to never.", "If a case is missing, status isn't never there, and the call won't compile."],
    starterCode: `type Status = "active" | "paused" | "archived";\n\nexport function statusLabel(status: Status): string {\n  switch (status) {\n    case "active":\n      return "Active";\n    case "paused":\n      return "Paused";\n    default:\n      return "Unknown";\n  }\n}\n\nfunction StatusPill({ status }: { status: Status }) {\n  return <span className={"pill pill-" + status}>{statusLabel(status)}</span>;\n}\n\nexport default StatusPill;\n`,
    solutionCode: `type Status = "active" | "paused" | "archived";\n\nexport function assertNever(value: never): never {\n  throw new Error("Unexpected value: " + value);\n}\n\nexport function statusLabel(status: Status): string {\n  switch (status) {\n    case "active":\n      return "Active";\n    case "paused":\n      return "Paused";\n    case "archived":\n      return "Archived";\n    default:\n      return assertNever(status);\n  }\n}\n\nfunction StatusPill({ status }: { status: Status }) {\n  return <span className={"pill pill-" + status}>{statusLabel(status)}</span>;\n}\n\nexport default StatusPill;\n`,
    explanation: "After all cases of a union are handled, TypeScript narrows the value to `never`. Passing it to a function that only accepts `never` turns 'I forgot a case' into a compile error the moment someone adds a new status.",
    tests: [
      test("labels every status", `const { unmount } = renderComponent({ status: "archived" });\nexpectText("Archived");\nunmount();\nrenderComponent({ status: "paused" });\nexpectText("Paused");\n${clean}`),
      hidden("assertNever enforces exhaustiveness", `assert(typeof userExports.assertNever === "function", "Export assertNever");\nlet threw = false;\ntry { userExports.assertNever("z"); } catch (e) { threw = String(e.message).includes("Unexpected"); }\nassert(threw, "assertNever should throw an 'Unexpected value' error");\n${mustReject(["assertNever(\"x\" as string);", "function bad(s: \"a\" | \"b\"): string { switch (s) { case \"a\": return \"A\"; default: return assertNever(s); } }"])}`),
    ],
  },
];

const KEYBOARD_REF = `function Dropdown() {\n  const [open, setOpen] = useState(false);\n  // ArrowDown on the button opens the menu and focuses the first item;\n  // Escape closes it and returns focus to the button.\n  ...\n}`;

export const testingMore: ProblemDef[] = [
  {
    slug: "testing-custom-hook",
    title: "Test a Custom Hook",
    difficulty: "MEDIUM",
    tags: ["testing", "custom-hooks", "renderHook"],
    problemType: "TEST",
    type: "CUSTOM_HOOK",
    estimatedMinutes: 15,
    description:
      "Write a test for `useToggle(initial = false)`, which returns `[value, toggle]`. Here `Component` is the **hook**: test it with `renderHook` and wrap state changes in `act` (both are in the kit). Check the default, toggling back and forth, and the initial value argument." + NOTE,
    requirements: ["Uses renderHook", "Checks toggling both ways", "Checks the initial value"],
    hints: ["const { result } = renderHook(() => Component());", "act(() => result.current[1]()); then read result.current again."],
    starterCode: testStarter(`function useToggle(initial = false) {\n  const [value, setValue] = useState(initial);\n  return [value, () => setValue((v) => !v)];\n}`, "testUseToggle({ Component, renderHook, act, expect })"),
    solutionCode: `export default async function testUseToggle({ Component: useToggle, renderHook, act, expect }) {\n  const { result } = renderHook(() => useToggle());\n  expect(result.current[0]).toBe(false);\n  act(() => result.current[1]());\n  expect(result.current[0]).toBe(true);\n  act(() => result.current[1]());\n  expect(result.current[0]).toBe(false);\n\n  const { result: startsOn } = renderHook(() => useToggle(true));\n  expect(startsOn.current[0]).toBe(true);\n}\n`,
    explanation: "renderHook runs a hook inside a tiny test component, and `result.current` always holds its latest return value. Updates must be wrapped in act so React finishes re-rendering before you assert.",
    tests: (() => {
      const impls = `const Correct = (initial = false) => { const [v, setV] = React.useState(initial); return [v, () => setV((x) => !x)]; };\nconst StartsOn = (initial = true) => { const [v, setV] = React.useState(initial); return [v, () => setV((x) => !x)]; };\nconst OneWay = (initial = false) => { const [v, setV] = React.useState(initial); return [v, () => setV(true)]; };\nconst IgnoresInitial = () => { const [v, setV] = React.useState(false); return [v, () => setV((x) => !x)]; };`;
      return [
        test("passes against the correct hook", passesCorrect(impls)),
        hidden("catches broken versions", catchesMutants(impls, [["StartsOn", "starts as true"], ["OneWay", "can't toggle back off"], ["IgnoresInitial", "ignores the initial value"]])),
      ];
    })(),
  },
  {
    slug: "testing-keyboard",
    title: "Test Keyboard Interactions",
    difficulty: "MEDIUM",
    tags: ["testing", "keyboard", "accessibility"],
    problemType: "TEST",
    estimatedMinutes: 20,
    description:
      "Write a test for an accessible `Dropdown`: a button `Options`; pressing **ArrowDown** on it opens a `role=\"menu\"` and focuses its first item (`Rename`); pressing **Escape** closes the menu and returns focus to the button.\n\nUse `userEvent.keyboard(\"{ArrowDown}\")`, which types into whatever has focus, and the jest-dom `toHaveFocus()` matcher." + NOTE,
    requirements: ["Opens with the keyboard", "Checks focus moves into the menu", "Checks Escape closes and returns focus"],
    hints: ["Focus the button first: screen.getByRole(\"button\", { name: \"Options\" }).focus();", "expect(screen.getByRole(\"menuitem\", { name: \"Rename\" })).toHaveFocus();"],
    starterCode: testStarter(KEYBOARD_REF, "testDropdown({ Component, render, screen, userEvent, expect })"),
    solutionCode: `export default async function testDropdown({ Component, render, screen, userEvent, expect }) {\n  render(<Component />);\n  const button = screen.getByRole("button", { name: "Options" });\n  button.focus();\n  await userEvent.keyboard("{ArrowDown}");\n  expect(screen.getByRole("menu")).toBeInTheDocument();\n  expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();\n  await userEvent.keyboard("{Escape}");\n  expect(screen.queryByRole("menu")).not.toBeInTheDocument();\n  expect(button).toHaveFocus();\n}\n`,
    explanation: "Keyboard support is behaviour, so it deserves tests like any other behaviour. Asserting where focus goes catches the regressions that make widgets unusable without a mouse.",
    tests: (() => {
      const impls = `const make = ({ escapeCloses = true, returnFocus = true, arrowOpens = true } = {}) => function Dropdown() {\n  const [open, setOpen] = React.useState(false);\n  const button = React.useRef(null);\n  const first = React.useRef(null);\n  React.useEffect(() => { if (open) first.current?.focus(); }, [open]);\n  const close = () => { setOpen(false); if (returnFocus) button.current?.focus(); };\n  return (\n    <div onKeyDown={(e) => { if (e.key === "Escape" && escapeCloses) close(); }}>\n      <button ref={button} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} onKeyDown={(e) => { if (e.key === "ArrowDown" && arrowOpens) { e.preventDefault(); setOpen(true); } }}>Options</button>\n      {open && <ul role="menu"><li role="menuitem" tabIndex={-1} ref={first}>Rename</li><li role="menuitem" tabIndex={-1}>Delete</li></ul>}\n    </div>\n  );\n};\nconst Correct = make();\nconst NoEscape = make({ escapeCloses: false });\nconst NoFocusReturn = make({ returnFocus: false });\nconst NoArrow = make({ arrowOpens: false });`;
      return [
        test("passes against the correct component", passesCorrect(impls)),
        hidden("catches broken versions", catchesMutants(impls, [["NoEscape", "Escape doesn't close"], ["NoFocusReturn", "focus isn't returned"], ["NoArrow", "ArrowDown doesn't open"]])),
      ];
    })(),
  },
  {
    slug: "testing-api-error-path",
    title: "Test the Error Path of a Request",
    difficulty: "MEDIUM",
    tags: ["testing", "api", "error-handling"],
    problemType: "TEST",
    type: "API",
    estimatedMinutes: 20,
    description:
      "Write a test for `Profile`, which fetches `GET /api/profile` and shows `Hello, {name}`, or `<p role=\"alert\">Could not load profile</p>` when the request fails.\n\nThe mock API returns `{ name: \"Ada\" }` by default. To test the failure, switch the route **inside your test** with `mockApi.setRoutes([{ url: \"/api/profile\", status: 500, response: {} }])` (it's in the kit). Test both paths, and that the error never shows on success." + NOTE,
    requirements: ["Tests the success path", "Tests the failure path with a 500", "Checks the alert doesn't appear on success"],
    hints: ["const first = render(<Component />); ... first.unmount(); before rendering again.", "expect(await screen.findByRole(\"alert\")).toHaveTextContent(\"Could not load profile\");"],
    starterCode: testStarter(`function Profile() {\n  // fetches /api/profile, shows "Hello, {name}" or an alert on failure\n  ...\n}`, "testProfile({ Component, render, screen, expect, mockApi })"),
    solutionCode: `export default async function testProfile({ Component, render, screen, expect, mockApi }) {\n  const first = render(<Component />);\n  expect(await screen.findByText("Hello, Ada")).toBeInTheDocument();\n  expect(screen.queryByRole("alert")).not.toBeInTheDocument();\n  first.unmount();\n\n  mockApi.setRoutes([{ url: "/api/profile", status: 500, response: {} }]);\n  render(<Component />);\n  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load profile");\n  expect(screen.queryByText(/Hello/)).not.toBeInTheDocument();\n}\n`,
    explanation: "Error paths are where bugs hide, because they rarely happen during development. Controlling the API response from the test is what makes them testable.",
    mockApi: [{ url: "/api/profile", delayMs: 10, response: { name: "Ada" } }],
    tests: (() => {
      const impls = `const useProfile = () => { const [s, setS] = React.useState({ status: "loading" }); React.useEffect(() => { fetch("/api/profile").then(async (r) => { if (!r.ok) throw new Error(); setS({ status: "ok", data: await r.json() }); }).catch(() => setS({ status: "error" })); }, []); return s; };\nconst Correct = () => { const s = useProfile(); if (s.status === "loading") return <p>Loading...</p>; if (s.status === "error") return <p role="alert">Could not load profile</p>; return <p>Hello, {s.data.name}</p>; };\nconst IgnoresErrors = () => { const [d, setD] = React.useState(null); React.useEffect(() => { fetch("/api/profile").then((r) => r.json()).then(setD); }, []); return d ? <p>Hello, {d.name}</p> : <p>Loading...</p>; };\nconst AlwaysAlert = () => { const s = useProfile(); return (<div>{s.status === "ok" && <p>Hello, {s.data.name}</p>}{s.status !== "loading" && <p role="alert">Could not load profile</p>}</div>); };\nconst StuckOnError = () => { const s = useProfile(); if (s.status !== "ok") return <p>Loading...</p>; return <p>Hello, {s.data.name}</p>; };`;
      return [
        test("passes against the correct component", passesCorrect(impls)),
        hidden("catches broken versions", catchesMutants(impls, [["IgnoresErrors", "never shows an error"], ["AlwaysAlert", "shows the alert even on success"], ["StuckOnError", "stays loading after a failure"]])),
      ];
    })(),
  },
];

export const performanceMore: ProblemDef[] = [
  {
    slug: "perf-memo-list-rows",
    title: "Re-render Only the Row That Changed",
    difficulty: "MEDIUM",
    tags: ["performance", "memo", "useCallback", "lists"],
    problemType: "OPTIMIZE",
    estimatedMinutes: 20,
    description:
      "`List` renders 50 `Row`s. Renaming one row re-renders **all 50**. The exported `rowRenders` counts row renders.\n\nMake renaming a row re-render only that row: memoize `Row`, and give it a stable `onRename` callback (one that doesn't change when the items change). Behaviour stays the same: `Rename {id}` appends `!` to that row's name.",
    requirements: ["Same behaviour", "Renaming re-renders exactly one row"],
    hints: ["memo(Row) alone isn't enough: `rename` is a new function every render.", "useCallback with a functional state update needs no dependencies: useCallback((id, name) => setItems((list) => ...), [])"],
    starterCode: `import { memo, useCallback, useState } from "react";\n\nexport let rowRenders = 0;\n\ninterface Item {\n  id: number;\n  name: string;\n}\n\nfunction Row({ item, onRename }: { item: Item; onRename: (id: number, name: string) => void }) {\n  rowRenders++;\n  return (\n    <li>\n      <span>{item.name}</span>\n      <button onClick={() => onRename(item.id, item.name + "!")}>Rename {item.id}</button>\n    </li>\n  );\n}\n\nfunction List() {\n  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: "Item " + (i + 1) })));\n  const rename = (id: number, name: string) => setItems((list) => list.map((it) => (it.id === id ? { ...it, name } : it)));\n  return (\n    <ul>\n      {items.map((item) => (\n        <Row key={item.id} item={item} onRename={rename} />\n      ))}\n    </ul>\n  );\n}\n\nexport default List;\n`,
    solutionCode: `import { memo, useCallback, useState } from "react";\n\nexport let rowRenders = 0;\n\ninterface Item {\n  id: number;\n  name: string;\n}\n\nconst Row = memo(function Row({ item, onRename }: { item: Item; onRename: (id: number, name: string) => void }) {\n  rowRenders++;\n  return (\n    <li>\n      <span>{item.name}</span>\n      <button onClick={() => onRename(item.id, item.name + "!")}>Rename {item.id}</button>\n    </li>\n  );\n});\n\nfunction List() {\n  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: "Item " + (i + 1) })));\n  const rename = useCallback(\n    (id: number, name: string) => setItems((list) => list.map((it) => (it.id === id ? { ...it, name } : it))),\n    []\n  );\n  return (\n    <ul>\n      {items.map((item) => (\n        <Row key={item.id} item={item} onRename={rename} />\n      ))}\n    </ul>\n  );\n}\n\nexport default List;\n`,
    explanation: "Immutable updates keep unchanged items as the same objects, memo skips rows whose props are unchanged, and a stable callback stops the function prop from defeating memo. The three work together.",
    tests: [
      test("renaming works", `renderComponent();\n${click("Rename 3")}\nexpectText("Item 3!");\nassertEqual(screen.getAllByRole("listitem").length, 50);`),
      hidden("only the renamed row re-renders", `renderComponent();\n${noMoreThan("rowRenders", 1, `${click("Rename 7")}`, "More than one row re-rendered after renaming one")}\nexpectText("Item 7!");`),
    ],
    wrongSolutions: [
      `import { memo, useState } from "react";\nexport let rowRenders = 0;\nconst Row = memo(function Row({ item, onRename }) { rowRenders++; return (<li><span>{item.name}</span><button onClick={() => onRename(item.id, item.name + "!")}>Rename {item.id}</button></li>); });\nfunction List() {\n  const [items, setItems] = useState(() => Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: "Item " + (i + 1) })));\n  const rename = (id, name) => setItems((list) => list.map((it) => (it.id === id ? { ...it, name } : it)));\n  return <ul>{items.map((item) => <Row key={item.id} item={item} onRename={rename} />)}</ul>;\n}\nexport default List;\n`,
    ],
  },
  {
    slug: "perf-reset-with-key",
    title: "Reset State With a Key, Not an Effect",
    difficulty: "MEDIUM",
    tags: ["performance", "keys", "useEffect", "refactoring"],
    problemType: "REFACTOR",
    estimatedMinutes: 15,
    description:
      "`NoteEditor` clears its draft when `noteId` changes using an effect. That renders the **old draft for the new note** first, then renders again after the effect clears it. The exported `editorRenders` shows the extra render.\n\nRemove the effect and reset the editor by giving it `key={noteId}` in `App` instead. Behaviour: switching notes starts with an empty draft.",
    requirements: ["Switching notes clears the draft", "Exactly one render on switch", "No resetting effect"],
    hints: ["A different key makes React unmount the old editor and mount a fresh one with fresh state.", "<NoteEditor key={noteId} noteId={noteId} />"],
    starterCode: `import { useEffect, useState } from "react";\n\nexport let editorRenders = 0;\n\nfunction NoteEditor({ noteId }: { noteId: number }) {\n  editorRenders++;\n  const [draft, setDraft] = useState("");\n\n  useEffect(() => {\n    setDraft("");\n  }, [noteId]);\n\n  return (\n    <label>\n      Draft for note {noteId} <input value={draft} onChange={(e) => setDraft(e.target.value)} />\n    </label>\n  );\n}\n\nexport default function App({ noteId }: { noteId: number }) {\n  return <NoteEditor noteId={noteId} />;\n}\n`,
    solutionCode: `import { useState } from "react";\n\nexport let editorRenders = 0;\n\nfunction NoteEditor({ noteId }: { noteId: number }) {\n  editorRenders++;\n  const [draft, setDraft] = useState("");\n\n  return (\n    <label>\n      Draft for note {noteId} <input value={draft} onChange={(e) => setDraft(e.target.value)} />\n    </label>\n  );\n}\n\nexport default function App({ noteId }: { noteId: number }) {\n  return <NoteEditor key={noteId} noteId={noteId} />;\n}\n`,
    explanation: "Resetting state in an effect always paints the stale state first. A key tells React it's a different editor, so the new one simply starts with fresh state — one render, no flash of old content.",
    tests: [
      test("switching clears the draft", `const { rerender } = renderComponent({ noteId: 1 });\nawait userEvent.type(screen.getByRole("textbox"), "hello");\nrerender(<Component noteId={2} />);\nassertEqual(screen.getByLabelText("Draft for note 2").value, "");`),
      hidden("one render per switch", `const { rerender } = renderComponent({ noteId: 1 });\nawait userEvent.type(screen.getByRole("textbox"), "hi");\n${noMoreThan("editorRenders", 1, "rerender(<Component noteId={2} />);", "Switching notes rendered the editor more than once — reset with a key instead of an effect")}`),
    ],
  },
  {
    slug: "perf-stable-context-value",
    title: "Memoize a Context Value",
    difficulty: "MEDIUM",
    tags: ["performance", "context", "useMemo"],
    problemType: "OPTIMIZE",
    estimatedMinutes: 15,
    description:
      "`UserProvider` passes `value={{ name, logout }}` — a **new object** on every render. So whenever its parent re-renders (the `Refresh` button), every consumer re-renders too, even the memoized `UserBadge`. The exported `badgeRenders` shows it.\n\nMake the context value stable so `UserBadge` only re-renders when the user actually changes.",
    requirements: ["Refreshing doesn't re-render the badge", "Logging out still updates it"],
    hints: ["const logout = useCallback(() => setName(\"Guest\"), []);", "const value = useMemo(() => ({ name, logout }), [name, logout]);"],
    starterCode: `import { createContext, memo, useCallback, useContext, useMemo, useState, type ReactNode } from "react";\n\nexport let badgeRenders = 0;\n\nconst UserContext = createContext({ name: "", logout: () => {} });\n\nfunction UserProvider({ children }: { children: ReactNode }) {\n  const [name, setName] = useState("Ada");\n  const logout = () => setName("Guest");\n  return <UserContext.Provider value={{ name, logout }}>{children}</UserContext.Provider>;\n}\n\nconst UserBadge = memo(function UserBadge() {\n  badgeRenders++;\n  const { name, logout } = useContext(UserContext);\n  return (\n    <div>\n      <span>Signed in as {name}</span>\n      <button onClick={logout}>Log out</button>\n    </div>\n  );\n});\n\nexport default function Shell() {\n  const [ticks, setTicks] = useState(0);\n  return (\n    <UserProvider>\n      <button onClick={() => setTicks((t) => t + 1)}>Refresh ({ticks})</button>\n      <UserBadge />\n    </UserProvider>\n  );\n}\n`,
    solutionCode: `import { createContext, memo, useCallback, useContext, useMemo, useState, type ReactNode } from "react";\n\nexport let badgeRenders = 0;\n\nconst UserContext = createContext({ name: "", logout: () => {} });\n\nfunction UserProvider({ children }: { children: ReactNode }) {\n  const [name, setName] = useState("Ada");\n  const logout = useCallback(() => setName("Guest"), []);\n  const value = useMemo(() => ({ name, logout }), [name, logout]);\n  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;\n}\n\nconst UserBadge = memo(function UserBadge() {\n  badgeRenders++;\n  const { name, logout } = useContext(UserContext);\n  return (\n    <div>\n      <span>Signed in as {name}</span>\n      <button onClick={logout}>Log out</button>\n    </div>\n  );\n});\n\nexport default function Shell() {\n  const [ticks, setTicks] = useState(0);\n  return (\n    <UserProvider>\n      <button onClick={() => setTicks((t) => t + 1)}>Refresh ({ticks})</button>\n      <UserBadge />\n    </UserProvider>\n  );\n}\n`,
    explanation: "Context compares values by reference. Memoizing the value object (and the functions inside it) means consumers re-render only when the data they read actually changes.",
    tests: [
      test("log out still works", `renderComponent();\n${click("Log out")}\nexpectText("Signed in as Guest");`),
      hidden("refreshing doesn't re-render the badge", `renderComponent();\n${noMoreThan("badgeRenders", 0, `${click("Refresh (0)")}\n${click("Refresh (1)")}\n${click("Refresh (2)")}`, "UserBadge re-rendered when nothing it reads changed")}\n${noMoreThan("badgeRenders", 1, click("Log out"), "UserBadge should re-render once after logging out")}`),
    ],
  },
];

export const accessibilityMore: ProblemDef[] = [
  {
    slug: "a11y-error-summary",
    title: "Accessible Error Summary",
    difficulty: "MEDIUM",
    tags: ["accessibility", "forms", "focus-management"],
    estimatedMinutes: 25,
    description:
      "Build `SignupForm({ onSubmit })` with inputs labelled `Email` (`id=\"email\"`) and `Password` (`id=\"password\"`) and a `Sign up` button. On submit, validate:\n\n- empty email → `Enter your email`\n- password shorter than 8 characters → `Password must be at least 8 characters`\n\nIf there are errors, render an **error summary** above the form and **move focus to it**: a `<div tabIndex={-1}>` containing `<h2>There is 1 problem</h2>` / `There are N problems`, and a list of links (`href=\"#email\"` ...) whose text is the error. Clicking a link focuses that field. Invalid fields get `aria-invalid=\"true\"`. With no errors, call `onSubmit({ email, password })`.",
    requirements: ["Focus moves to the summary on failed submit", "Links focus their field", "aria-invalid on invalid fields", "Valid submit calls onSubmit"],
    hints: [
      "Keep errors as an object; render the summary when it has entries.",
      "Focus the summary in an effect after the failed submit (a counter in state makes it run on every attempt).",
      "Link onClick: e.preventDefault(); document.getElementById(id)?.focus();",
    ],
    starterCode: `import { useEffect, useRef, useState, type FormEvent } from "react";\n\nfunction SignupForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default SignupForm;\n`,
    solutionCode: `import { useEffect, useRef, useState, type FormEvent } from "react";\n\ntype Field = "email" | "password";\n\nfunction SignupForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) {\n  const [email, setEmail] = useState("");\n  const [password, setPassword] = useState("");\n  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});\n  const [attempt, setAttempt] = useState(0);\n  const summaryRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (attempt > 0) summaryRef.current?.focus();\n  }, [attempt]);\n\n  function handleSubmit(event: FormEvent) {\n    event.preventDefault();\n    const next: Partial<Record<Field, string>> = {};\n    if (!email.trim()) next.email = "Enter your email";\n    if (password.length < 8) next.password = "Password must be at least 8 characters";\n    setErrors(next);\n    if (Object.keys(next).length > 0) setAttempt((a) => a + 1);\n    else onSubmit({ email, password });\n  }\n\n  const entries = Object.entries(errors) as [Field, string][];\n\n  return (\n    <div>\n      {entries.length > 0 && (\n        <div ref={summaryRef} tabIndex={-1} aria-labelledby="error-summary-title">\n          <h2 id="error-summary-title">{entries.length === 1 ? "There is 1 problem" : \`There are \${entries.length} problems\`}</h2>\n          <ul>\n            {entries.map(([field, message]) => (\n              <li key={field}>\n                <a\n                  href={"#" + field}\n                  onClick={(e) => {\n                    e.preventDefault();\n                    document.getElementById(field)?.focus();\n                  }}\n                >\n                  {message}\n                </a>\n              </li>\n            ))}\n          </ul>\n        </div>\n      )}\n      <form onSubmit={handleSubmit} noValidate>\n        <label htmlFor="email">Email</label>\n        <input id="email" type="email" value={email} aria-invalid={errors.email ? true : undefined} onChange={(e) => setEmail(e.target.value)} />\n        <label htmlFor="password">Password</label>\n        <input id="password" type="password" value={password} aria-invalid={errors.password ? true : undefined} onChange={(e) => setPassword(e.target.value)} />\n        <button type="submit">Sign up</button>\n      </form>\n    </div>\n  );\n}\n\nexport default SignupForm;\n`,
    explanation: "An error summary that receives focus tells screen-reader and keyboard users immediately that the submit failed and why, and its links take them straight to each field. It's the pattern used by GOV.UK and other accessibility-first design systems.",
    tests: [
      test("focuses the summary and links to fields", `renderComponent({ onSubmit: () => {} });\n${click("Sign up")}\nassert(document.activeElement.textContent.includes("There are 2 problems"), "Focus should move to the error summary");\n${click("Enter your email", "link")}\n${focused("the Email input", `screen.getByLabelText("Email")`)}\nassertEqual(screen.getByLabelText("Email").getAttribute("aria-invalid"), "true");`),
      hidden("singular summary and valid submit", `const onSubmit = mockFn();\nrenderComponent({ onSubmit });\nawait userEvent.type(screen.getByLabelText("Email"), "a@b.co");\n${click("Sign up")}\nexpectText("There is 1 problem");\nassert(!screen.getByLabelText("Email").hasAttribute("aria-invalid"));\nawait userEvent.type(screen.getByLabelText("Password"), "longenough");\n${click("Sign up")}\nassertEqual(onSubmit.calls, [[{ email: "a@b.co", password: "longenough" }]]);`),
    ],
  },
  {
    slug: "a11y-menu-button",
    title: "Accessible Menu Button",
    difficulty: "HARD",
    tags: ["accessibility", "aria", "keyboard", "focus-management"],
    estimatedMinutes: 35,
    description:
      "Build `ActionsMenu({ onSelect })` following the WAI-ARIA menu button pattern. Items: `Duplicate`, `Archive`, `Delete`.\n\n- a button `Actions` with `aria-haspopup=\"menu\"` and `aria-expanded`\n- clicking it, or pressing `ArrowDown` on it, opens a `role=\"menu\"` of `role=\"menuitem\"` elements (`tabIndex={-1}`) and focuses the **first** item\n- in the menu, `ArrowDown`/`ArrowUp` move focus (wrapping), `Home`/`End` jump to the ends\n- `Enter` (or clicking) on an item calls `onSelect(label)`, closes the menu and returns focus to the button\n- `Escape` closes the menu and returns focus to the button",
    requirements: ["ARIA attributes", "Opening moves focus into the menu", "Arrow/Home/End navigation with wrapping", "Escape and selection return focus"],
    hints: [
      "Keep `open` and the active index in state, and refs to the button and items.",
      "When the active index changes while open, focus itemRefs.current[active] in an effect.",
      "One onKeyDown on the <ul role=\"menu\"> handles all in-menu keys.",
    ],
    starterCode: `import { useEffect, useRef, useState, type KeyboardEvent } from "react";\n\nconst ITEMS = ["Duplicate", "Archive", "Delete"];\n\nfunction ActionsMenu({ onSelect }: { onSelect: (item: string) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default ActionsMenu;\n`,
    solutionCode: `import { useEffect, useRef, useState, type KeyboardEvent } from "react";\n\nconst ITEMS = ["Duplicate", "Archive", "Delete"];\n\nfunction ActionsMenu({ onSelect }: { onSelect: (item: string) => void }) {\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(0);\n  const buttonRef = useRef<HTMLButtonElement>(null);\n  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);\n\n  useEffect(() => {\n    if (open) itemRefs.current[active]?.focus();\n  }, [open, active]);\n\n  function openMenu() {\n    setActive(0);\n    setOpen(true);\n  }\n\n  function close() {\n    setOpen(false);\n    buttonRef.current?.focus();\n  }\n\n  function choose(item: string) {\n    onSelect(item);\n    close();\n  }\n\n  function handleMenuKeyDown(event: KeyboardEvent) {\n    const last = ITEMS.length - 1;\n    if (event.key === "ArrowDown") setActive((i) => (i + 1) % ITEMS.length);\n    else if (event.key === "ArrowUp") setActive((i) => (i - 1 + ITEMS.length) % ITEMS.length);\n    else if (event.key === "Home") setActive(0);\n    else if (event.key === "End") setActive(last);\n    else if (event.key === "Enter") choose(ITEMS[active]);\n    else if (event.key === "Escape") close();\n    else return;\n    event.preventDefault();\n  }\n\n  return (\n    <div>\n      <button\n        ref={buttonRef}\n        aria-haspopup="menu"\n        aria-expanded={open}\n        aria-controls="actions-menu"\n        onClick={() => (open ? close() : openMenu())}\n        onKeyDown={(e) => {\n          if (e.key === "ArrowDown") {\n            e.preventDefault();\n            openMenu();\n          }\n        }}\n      >\n        Actions\n      </button>\n      {open && (\n        <ul role="menu" id="actions-menu" aria-label="Actions" onKeyDown={handleMenuKeyDown}>\n          {ITEMS.map((item, i) => (\n            <li\n              key={item}\n              role="menuitem"\n              tabIndex={-1}\n              ref={(el) => {\n                itemRefs.current[i] = el;\n              }}\n              onClick={() => choose(item)}\n            >\n              {item}\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n\nexport default ActionsMenu;\n`,
    explanation: "Menus are a single Tab stop: arrow keys move inside them, Escape leaves, and focus always ends up somewhere sensible. Getting this right is what makes a dropdown usable with a keyboard or screen reader.",
    tests: [
      test("open, navigate, select", `const onSelect = mockFn();\nrenderComponent({ onSelect });\n${click("Actions")}\nassertEqual(screen.getByRole("button", { name: "Actions" }).getAttribute("aria-expanded"), "true");\n${focused("the first item", `screen.getByRole("menuitem", { name: "Duplicate" })`)}\nfireEvent.keyDown(document.activeElement, { key: "ArrowDown" });\n${focused("Archive", `screen.getByRole("menuitem", { name: "Archive" })`)}\nfireEvent.keyDown(document.activeElement, { key: "Enter" });\nassertEqual(onSelect.calls, [["Archive"]]);\nassert(!screen.queryByRole("menu"));\n${focused("the Actions button", `screen.getByRole("button", { name: "Actions" })`)}`),
      hidden("wrapping, Home/End, Escape and ArrowDown to open", `renderComponent({ onSelect: () => {} });\nconst button = screen.getByRole("button", { name: "Actions" });\nbutton.focus();\nfireEvent.keyDown(button, { key: "ArrowDown" });\n${focused("the first item", `screen.getByRole("menuitem", { name: "Duplicate" })`)}\nfireEvent.keyDown(document.activeElement, { key: "ArrowUp" });\n${focused("the last item (wrapping)", `screen.getByRole("menuitem", { name: "Delete" })`)}\nfireEvent.keyDown(document.activeElement, { key: "Home" });\n${focused("the first item", `screen.getByRole("menuitem", { name: "Duplicate" })`)}\nfireEvent.keyDown(document.activeElement, { key: "End" });\n${focused("the last item", `screen.getByRole("menuitem", { name: "Delete" })`)}\nfireEvent.keyDown(document.activeElement, { key: "Escape" });\nassert(!screen.queryByRole("menu"));\n${focused("the Actions button", "button")}\nassertEqual(button.getAttribute("aria-haspopup"), "menu");`),
    ],
  },
  {
    slug: "a11y-radio-group-keyboard",
    title: "Keyboard Radio Group",
    difficulty: "MEDIUM",
    tags: ["accessibility", "aria", "keyboard", "roving-tabindex"],
    estimatedMinutes: 20,
    description:
      "Build a custom `ViewSwitcher({ value, onChange })` for the views `List`, `Grid`, `Table` (values `list`, `grid`, `table`):\n\n- a `role=\"radiogroup\"` with `aria-label=\"View\"`, containing a `<div role=\"radio\">` per option with `aria-checked`\n- roving tabindex: only the checked option has `tabIndex={0}`\n- clicking an option, or pressing `ArrowRight`/`ArrowDown` (next) and `ArrowLeft`/`ArrowUp` (previous) — wrapping — calls `onChange` with the new value **and moves focus** to it\n\nThe component is controlled: `value` comes from the parent.",
    requirements: ["Radio semantics with aria-checked", "Roving tabindex", "Arrow keys change and focus the selection"],
    hints: ["Keep refs to the options; after computing the next index, call onChange(OPTIONS[next].value) and focus refs.current[next].", "tabIndex={option.value === value ? 0 : -1}"],
    starterCode: `import { useRef, type KeyboardEvent } from "react";\n\nconst OPTIONS = [\n  { value: "list", label: "List" },\n  { value: "grid", label: "Grid" },\n  { value: "table", label: "Table" },\n];\n\nfunction ViewSwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default ViewSwitcher;\n`,
    solutionCode: `import { useRef, type KeyboardEvent } from "react";\n\nconst OPTIONS = [\n  { value: "list", label: "List" },\n  { value: "grid", label: "Grid" },\n  { value: "table", label: "Table" },\n];\n\nfunction ViewSwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {\n  const refs = useRef<(HTMLDivElement | null)[]>([]);\n  const current = Math.max(0, OPTIONS.findIndex((o) => o.value === value));\n\n  function select(index: number) {\n    onChange(OPTIONS[index].value);\n    refs.current[index]?.focus();\n  }\n\n  function handleKeyDown(event: KeyboardEvent) {\n    const n = OPTIONS.length;\n    if (event.key === "ArrowRight" || event.key === "ArrowDown") select((current + 1) % n);\n    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") select((current - 1 + n) % n);\n    else return;\n    event.preventDefault();\n  }\n\n  return (\n    <div role="radiogroup" aria-label="View" onKeyDown={handleKeyDown}>\n      {OPTIONS.map((o, i) => (\n        <div\n          key={o.value}\n          ref={(el) => {\n            refs.current[i] = el;\n          }}\n          role="radio"\n          aria-checked={o.value === value}\n          tabIndex={o.value === value ? 0 : -1}\n          onClick={() => select(i)}\n        >\n          {o.label}\n        </div>\n      ))}\n    </div>\n  );\n}\n\nexport default ViewSwitcher;\n`,
    explanation: "A radio group is one Tab stop; arrow keys both move and select. Native `<input type=\"radio\">` does this for free — custom-styled ones must re-implement it.",
    tests: [
      test("click selects", `const onChange = mockFn();\nrenderComponent({ value: "list", onChange });\nfireEvent.click(screen.getByRole("radio", { name: "Table" }));\nassertEqual(onChange.calls, [["table"]]);\nassertEqual(screen.getByRole("radio", { name: "List" }).getAttribute("aria-checked"), "true");`),
      hidden("arrow keys with roving focus", `const onChange = mockFn();\nconst { rerender } = renderComponent({ value: "list", onChange });\nassertEqual(screen.getAllByRole("radio").map((r) => r.getAttribute("tabindex")), ["0", "-1", "-1"]);\nconst list = screen.getByRole("radio", { name: "List" });\nlist.focus();\nfireEvent.keyDown(list, { key: "ArrowLeft" });\nassertEqual(onChange.calls, [["table"]]);\n${focused("Table", `screen.getByRole("radio", { name: "Table" })`)}\nrerender(<Component value="table" onChange={onChange} />);\nfireEvent.keyDown(document.activeElement, { key: "ArrowDown" });\nassertEqual(onChange.calls[1], ["list"]);\nassertEqual(screen.getAllByRole("radio").map((r) => r.getAttribute("tabindex")), ["-1", "-1", "0"]);`),
    ],
  },
];

export const realWorldMore: ProblemDef[] = [
  {
    slug: "rw-tag-input",
    title: "Tag Input",
    difficulty: "HARD",
    tags: ["real-world", "forms", "keyboard"],
    estimatedMinutes: 30,
    description:
      "Build `TagInput({ max = 5 })`:\n\n- an input labelled `Tags`; pressing **Enter** or typing a **comma** adds the trimmed, lower-cased text as a tag and clears the input (empty text and duplicates are ignored)\n- tags render as `<li>{tag} <button aria-label=\"Remove {tag}\">×</button></li>`\n- **Backspace** in an empty input removes the last tag\n- once there are `max` tags, the input is disabled and `<p>Maximum of {max} tags</p>` is shown",
    requirements: ["Enter and comma add tags", "No empty or duplicate tags", "Backspace removes the last tag", "Remove buttons", "Limit enforced"],
    hints: [
      "Handle onKeyDown: for Enter or \",\" call preventDefault (so the comma isn't typed) and add the tag.",
      "Normalize before checking duplicates: text.trim().toLowerCase().",
      "Backspace: only when the input value is empty.",
    ],
    starterCode: `import { useState, type KeyboardEvent } from "react";\n\nfunction TagInput({ max = 5 }: { max?: number }) {\n  // Write your solution here\n  return null;\n}\n\nexport default TagInput;\n`,
    solutionCode: `import { useState, type KeyboardEvent } from "react";\n\nfunction TagInput({ max = 5 }: { max?: number }) {\n  const [tags, setTags] = useState<string[]>([]);\n  const [text, setText] = useState("");\n  const full = tags.length >= max;\n\n  function add() {\n    const tag = text.trim().toLowerCase();\n    setText("");\n    if (!tag || tags.includes(tag) || full) return;\n    setTags((t) => [...t, tag]);\n  }\n\n  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {\n    if (event.key === "Enter" || event.key === ",") {\n      event.preventDefault();\n      add();\n    } else if (event.key === "Backspace" && text === "") {\n      setTags((t) => t.slice(0, -1));\n    }\n  }\n\n  return (\n    <div>\n      <ul>\n        {tags.map((tag) => (\n          <li key={tag}>\n            {tag} <button aria-label={"Remove " + tag} onClick={() => setTags((t) => t.filter((x) => x !== tag))}>×</button>\n          </li>\n        ))}\n      </ul>\n      <label>\n        Tags <input value={text} disabled={full} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} />\n      </label>\n      {full && <p>Maximum of {max} tags</p>}\n    </div>\n  );\n}\n\nexport default TagInput;\n`,
    explanation: "Small inputs like this are mostly keyboard handling plus normalization. Deciding exactly which keys do what (and preventing the default where needed) is the core of the component.",
    tests: [
      test("Enter and comma add tags", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Tags"), "React{Enter} hooks ,");\nassertEqual(${items}.map((t) => t.replace("×", "").trim()), ["react", "hooks"]);\nassertEqual(screen.getByLabelText("Tags").value, "");`),
      hidden("duplicates, backspace, remove, limit", `renderComponent({ max: 3 });\nconst input = screen.getByLabelText("Tags");\nawait userEvent.type(input, "a{Enter}A{Enter}{Enter}b{Enter}");\nassertEqual(${items}.length, 2);\nawait userEvent.type(input, "{Backspace}");\nassertEqual(${items}.length, 1);\nawait userEvent.type(input, "c{Enter}d{Enter}");\nassert(screen.getByLabelText("Tags").disabled, "Input should be disabled at the limit");\nexpectText("Maximum of 3 tags");\n${click("Remove c")}\nassert(!screen.getByLabelText("Tags").disabled);\nassertEqual(${items}.map((t) => t.replace("×", "").trim()), ["a", "d"]);`),
    ],
  },
  {
    slug: "rw-otp-input",
    title: "One-Time Code Input",
    difficulty: "MEDIUM",
    tags: ["real-world", "forms", "focus-management", "refs"],
    estimatedMinutes: 30,
    description:
      "Build `OtpInput({ length = 6, onComplete })`: `length` single-character inputs labelled `Digit 1`, `Digit 2`, ...\n\n- typing a digit fills the box and moves focus to the next one; non-digits are ignored\n- **Backspace** in an empty box moves to the previous box and clears it\n- **pasting** a code into any box fills the boxes from there\n- when every box is filled, call `onComplete(code)`",
    requirements: ["Auto-advance on digit", "Non-digits ignored", "Backspace moves back", "Paste fills", "onComplete when full"],
    hints: [
      "Store the digits as an array of strings; keep refs to the inputs.",
      "onChange: take the last character typed, check /^\\d$/, update, focus the next ref.",
      "Call onComplete in the same handlers when the new array has no empty entries.",
    ],
    starterCode: `import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";\n\nfunction OtpInput({ length = 6, onComplete }: { length?: number; onComplete: (code: string) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default OtpInput;\n`,
    solutionCode: `import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";\n\nfunction OtpInput({ length = 6, onComplete }: { length?: number; onComplete: (code: string) => void }) {\n  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));\n  const refs = useRef<(HTMLInputElement | null)[]>([]);\n\n  function update(next: string[], focusIndex: number) {\n    setDigits(next);\n    refs.current[Math.min(focusIndex, length - 1)]?.focus();\n    if (next.every((d) => d !== "")) onComplete(next.join(""));\n  }\n\n  function handleChange(index: number, value: string) {\n    const char = value.slice(-1);\n    if (!/^\\d$/.test(char)) return;\n    const next = [...digits];\n    next[index] = char;\n    update(next, index + 1);\n  }\n\n  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {\n    if (event.key === "Backspace" && digits[index] === "" && index > 0) {\n      event.preventDefault();\n      const next = [...digits];\n      next[index - 1] = "";\n      setDigits(next);\n      refs.current[index - 1]?.focus();\n    }\n  }\n\n  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {\n    event.preventDefault();\n    const pasted = event.clipboardData.getData("text").replace(/\\D/g, "").slice(0, length - index);\n    if (!pasted) return;\n    const next = [...digits];\n    pasted.split("").forEach((d, i) => (next[index + i] = d));\n    update(next, index + pasted.length);\n  }\n\n  return (\n    <div>\n      {digits.map((d, i) => (\n        <input\n          key={i}\n          ref={(el) => {\n            refs.current[i] = el;\n          }}\n          aria-label={"Digit " + (i + 1)}\n          inputMode="numeric"\n          value={d}\n          onChange={(e) => handleChange(i, e.target.value)}\n          onKeyDown={(e) => handleKeyDown(i, e)}\n          onPaste={(e) => handlePaste(i, e)}\n        />\n      ))}\n    </div>\n  );\n}\n\nexport default OtpInput;\n`,
    explanation: "Each box is a controlled input, but the component manages focus between them with refs — the same coordination you'd need for any multi-part input (dates, card numbers).",
    tests: [
      test("typing fills and completes", `const onComplete = mockFn();\nrenderComponent({ onComplete });\nawait userEvent.type(screen.getByLabelText("Digit 1"), "12a3456");\nassertEqual(onComplete.calls, [["123456"]]);\nassertEqual(screen.getByLabelText("Digit 3").value, "3");`),
      hidden("backspace and paste", `const onComplete = mockFn();\nrenderComponent({ length: 4, onComplete });\nawait userEvent.type(screen.getByLabelText("Digit 1"), "12");\nawait userEvent.keyboard("{Backspace}");\n${focused("Digit 2", `screen.getByLabelText("Digit 2")`)}\nassertEqual(screen.getByLabelText("Digit 2").value, "");\nfireEvent.paste(screen.getByLabelText("Digit 2"), { clipboardData: { getData: () => "9-8-7" } });\nassertEqual(["Digit 1", "Digit 2", "Digit 3", "Digit 4"].map((l) => screen.getByLabelText(l).value), ["1", "9", "8", "7"]);\nassertEqual(onComplete.calls, [["1987"]]);`),
    ],
  },
  {
    slug: "rw-file-upload",
    title: "Image Upload With Validation",
    difficulty: "MEDIUM",
    tags: ["real-world", "forms", "files", "validation"],
    estimatedMinutes: 25,
    description:
      "Build `ImageUploader({ maxBytes = 1024 * 1024 })` with `<input type=\"file\" multiple accept=\"image/*\" aria-label=\"Upload images\">`. For each chosen file:\n\n- non-images (type not starting with `image/`) → error `{name} is not an image`\n- larger than `maxBytes` → error `{name} is too large`\n- otherwise add it to a list: `<li>{name} ({size})</li>` with a `Remove {name}` button, where size is formatted as `N B`, `X.X KB` or `X.X MB` (1 KB = 1024 B)\n\nShow errors in a `<ul role=\"alert\">`. Each new selection replaces the previous errors but adds to the accepted list.",
    requirements: ["Type and size validation", "Size formatting", "Accepted files accumulate", "Remove buttons"],
    hints: ["Array.from(event.target.files ?? []) gives you File objects with name, size and type.", "formatSize: < 1024 → bytes; < 1024² → (n / 1024).toFixed(1) + \" KB\"; else MB."],
    starterCode: `import { useState, type ChangeEvent } from "react";\n\nexport function formatSize(bytes: number): string {\n  return "";\n}\n\nfunction ImageUploader({ maxBytes = 1024 * 1024 }: { maxBytes?: number }) {\n  // Write your solution here\n  return null;\n}\n\nexport default ImageUploader;\n`,
    solutionCode: `import { useState, type ChangeEvent } from "react";\n\nexport function formatSize(bytes: number): string {\n  if (bytes < 1024) return bytes + " B";\n  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";\n  return (bytes / (1024 * 1024)).toFixed(1) + " MB";\n}\n\nfunction ImageUploader({ maxBytes = 1024 * 1024 }: { maxBytes?: number }) {\n  const [files, setFiles] = useState<File[]>([]);\n  const [errors, setErrors] = useState<string[]>([]);\n\n  function handleChange(event: ChangeEvent<HTMLInputElement>) {\n    const chosen = Array.from(event.target.files ?? []);\n    const nextErrors: string[] = [];\n    const accepted: File[] = [];\n    for (const file of chosen) {\n      if (!file.type.startsWith("image/")) nextErrors.push(file.name + " is not an image");\n      else if (file.size > maxBytes) nextErrors.push(file.name + " is too large");\n      else accepted.push(file);\n    }\n    setErrors(nextErrors);\n    setFiles((prev) => [...prev, ...accepted]);\n  }\n\n  return (\n    <div>\n      <input type="file" multiple accept="image/*" aria-label="Upload images" onChange={handleChange} />\n      {errors.length > 0 && (\n        <ul role="alert">\n          {errors.map((e) => (\n            <li key={e}>{e}</li>\n          ))}\n        </ul>\n      )}\n      <ul aria-label="Selected images">\n        {files.map((f) => (\n          <li key={f.name}>\n            {f.name} ({formatSize(f.size)}) <button onClick={() => setFiles((all) => all.filter((x) => x !== f))}>Remove {f.name}</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default ImageUploader;\n`,
    explanation: "The accept attribute only filters the file picker; users can still drop or select other files, so validation must happen in code. Always validate on the server too.",
    tests: [
      test("accepts images and formats sizes", `renderComponent();\nconst input = screen.getByLabelText("Upload images");\nfireEvent.change(input, { target: { files: [new File(["x".repeat(1536)], "cat.png", { type: "image/png" })] } });\nwithin(screen.getByRole("list", { name: "Selected images" })).getByText("cat.png (1.5 KB)", { exact: false });`),
      hidden("rejects bad files, accumulates, removes", `renderComponent({ maxBytes: 2048 });\nconst input = screen.getByLabelText("Upload images");\nfireEvent.change(input, { target: { files: [new File(["a"], "notes.txt", { type: "text/plain" }), new File(["x".repeat(4096)], "big.jpg", { type: "image/jpeg" }), new File(["x".repeat(10)], "tiny.gif", { type: "image/gif" })] } });\nassertEqual(within(screen.getByRole("alert")).getAllByRole("listitem").map((li) => li.textContent), ["notes.txt is not an image", "big.jpg is too large"]);\nfireEvent.change(input, { target: { files: [new File(["x".repeat(100)], "dog.png", { type: "image/png" })] } });\nassert(!screen.queryByRole("alert"), "A clean selection should clear old errors");\nconst list = screen.getByRole("list", { name: "Selected images" });\nassertEqual(within(list).getAllByRole("listitem").length, 2);\n${click("Remove tiny.gif")}\nassertEqual(within(list).getAllByRole("listitem").length, 1);\nassertEqual(userExports.formatSize(3 * 1024 * 1024), "3.0 MB");\nassertEqual(userExports.formatSize(12), "12 B");`),
    ],
  },
];
