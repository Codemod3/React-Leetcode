import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
export const clean = `const errors = typeCheck();\nassert(errors.length === 0, "TypeScript errors:\\n" + errors.join("\\n"));`;
/** Each snippet is appended to the learner's file on its own; it must produce a type error. */
export const mustReject = (snippets: string[]) =>
  snippets
    .map(
      (s) =>
        `assert(typeCheck(${JSON.stringify(s)}).length > 0, ${JSON.stringify(`Your types should reject: ${s}`)});`
    )
    .join("\n");
export const mustAccept = (snippet: string) =>
  `{ const e = typeCheck(${JSON.stringify(snippet)}); assert(e.length === 0, ${JSON.stringify(`Your types should accept: ${snippet}`)} + "\\n" + e.join("\\n")); }`;

export const STRICT_NOTE = "\n\nThe tests type-check your file with `strict: true` and also check that misuse is **rejected**, so `any` won't pass.";

export const typescript: CategoryBank = {
  category: "TypeScript",
  level: 21,
  type: "COMPONENT",
  prerequisites: ["Props", "useState", "Events"],
  problems: [
    {
      slug: "ts-type-props",
      title: "Type Component Props",
      difficulty: "EASY",
      tags: ["typescript", "props", "interfaces"],
      estimatedMinutes: 10,
      description:
        "Give `Badge` a props interface:\n\n- `label`: string (required)\n- `tone`: `\"info\"` or `\"warning\"` (required)\n- `count`: number (optional)\n\nRender `<span className={\"badge-\" + tone}>{label}{count !== undefined && \" (\" + count + \")\"}</span>`." + STRICT_NOTE,
      requirements: ["Typed props interface", "tone is a union of two literals", "count is optional"],
      hints: ["interface BadgeProps { label: string; tone: \"info\" | \"warning\"; count?: number }", "function Badge({ label, tone, count }: BadgeProps)"],
      starterCode: `function Badge(props) {\n  const { label, tone, count } = props;\n  return (\n    <span className={"badge-" + tone}>\n      {label}\n      {count !== undefined && " (" + count + ")"}\n    </span>\n  );\n}\n\nexport default Badge;\n`,
      solutionCode: `interface BadgeProps {\n  label: string;\n  tone: "info" | "warning";\n  count?: number;\n}\n\nfunction Badge({ label, tone, count }: BadgeProps) {\n  return (\n    <span className={"badge-" + tone}>\n      {label}\n      {count !== undefined && " (" + count + ")"}\n    </span>\n  );\n}\n\nexport default Badge;\n`,
      explanation: "Typed props catch mistakes at the call site: a wrong type, a misspelled prop, or a value outside the allowed union is flagged before the code ever runs.",
      tests: [
        test("renders and type-checks", `renderComponent({ label: "Inbox", tone: "info", count: 3 });\nassertEqual(screen.getByText("Inbox", { exact: false }).className, "badge-info");\n${clean}`),
        hidden("rejects misuse, accepts valid use", `${mustReject(["const a = <Badge label={1} tone=\"info\" />;", "const b = <Badge label=\"x\" tone=\"pink\" />;", "const c = <Badge tone=\"info\" />;"])}\n${mustAccept("const ok = <Badge label=\"x\" tone=\"warning\" />;")}`),
      ],
      wrongSolutions: [`function Badge({ label, tone, count }: any) {\n  return <span className={"badge-" + tone}>{label}{count !== undefined && " (" + count + ")"}</span>;\n}\n\nexport default Badge;\n`],
    },
    {
      slug: "ts-event-types",
      title: "Type Event Handlers",
      difficulty: "EASY",
      tags: ["typescript", "events", "forms"],
      estimatedMinutes: 10,
      description:
        "`SearchForm` works, but its handlers have untyped parameters, which strict TypeScript rejects. Type them:\n\n- `handleChange` receives a change event from an `<input>`\n- `handleSubmit` receives a submit event from a `<form>`\n\nBehaviour: typing updates the query; submitting calls `onSearch(query)`." + "\n\nThe tests type-check your file with `strict: true`.",
      requirements: ["No implicit any", "Correct React event types"],
      hints: ["import type { ChangeEvent, FormEvent } from \"react\";", "ChangeEvent<HTMLInputElement>, FormEvent<HTMLFormElement>"],
      starterCode: `import { useState } from "react";\n\nfunction SearchForm({ onSearch }: { onSearch: (query: string) => void }) {\n  const [query, setQuery] = useState("");\n\n  function handleChange(event) {\n    setQuery(event.target.value);\n  }\n\n  function handleSubmit(event) {\n    event.preventDefault();\n    onSearch(query);\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label>\n        Search <input value={query} onChange={handleChange} />\n      </label>\n      <button type="submit">Go</button>\n    </form>\n  );\n}\n\nexport default SearchForm;\n`,
      solutionCode: `import { useState, type ChangeEvent, type FormEvent } from "react";\n\nfunction SearchForm({ onSearch }: { onSearch: (query: string) => void }) {\n  const [query, setQuery] = useState("");\n\n  function handleChange(event: ChangeEvent<HTMLInputElement>) {\n    setQuery(event.target.value);\n  }\n\n  function handleSubmit(event: FormEvent<HTMLFormElement>) {\n    event.preventDefault();\n    onSearch(query);\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label>\n        Search <input value={query} onChange={handleChange} />\n      </label>\n      <button type="submit">Go</button>\n    </form>\n  );\n}\n\nexport default SearchForm;\n`,
      explanation: "React's event types are generic over the element, so event.target has the right properties (value on inputs, checked on checkboxes...). When a handler is written inline, TypeScript infers the type for you.",
      tests: [
        test("works", `const onSearch = mockFn();\nrenderComponent({ onSearch });\nawait userEvent.type(screen.getByLabelText("Search"), "hooks");\n${click("Go")}\nassertEqual(onSearch.calls, [["hooks"]]);`),
        hidden("type-checks in strict mode", clean),
      ],
    },
    {
      slug: "ts-usestate-types",
      title: "Type useState",
      difficulty: "EASY",
      tags: ["typescript", "useState", "generics"],
      estimatedMinutes: 10,
      description:
        "`UserLoader` doesn't type-check: `useState(null)` makes TypeScript think the state can **only ever** be `null`, and `useState([])` infers `never[]`.\n\nFix the two `useState` calls with explicit type arguments. Behaviour: `Load` sets the user to `{ name: \"Ada\", roles: [\"admin\"] }` and shows `Ada (admin)`; before that it shows `No user`." + "\n\nThe tests type-check your file with `strict: true`.",
      requirements: ["useState<User | null>", "useState<string[]>", "Same behaviour"],
      hints: ["useState<User | null>(null)", "useState<string[]>([])"],
      starterCode: `import { useState } from "react";\n\ninterface User {\n  name: string;\n  roles: string[];\n}\n\nfunction UserLoader() {\n  const [user, setUser] = useState(null);\n  const [log, setLog] = useState([]);\n\n  function load() {\n    setUser({ name: "Ada", roles: ["admin"] });\n    setLog((l) => [...l, "loaded"]);\n  }\n\n  return (\n    <div>\n      <button onClick={load}>Load</button>\n      <p>{user ? \`\${user.name} (\${user.roles.join(", ")})\` : "No user"}</p>\n      <p>{log.length} events</p>\n    </div>\n  );\n}\n\nexport default UserLoader;\n`,
      solutionCode: `import { useState } from "react";\n\ninterface User {\n  name: string;\n  roles: string[];\n}\n\nfunction UserLoader() {\n  const [user, setUser] = useState<User | null>(null);\n  const [log, setLog] = useState<string[]>([]);\n\n  function load() {\n    setUser({ name: "Ada", roles: ["admin"] });\n    setLog((l) => [...l, "loaded"]);\n  }\n\n  return (\n    <div>\n      <button onClick={load}>Load</button>\n      <p>{user ? \`\${user.name} (\${user.roles.join(", ")})\` : "No user"}</p>\n      <p>{log.length} events</p>\n    </div>\n  );\n}\n\nexport default UserLoader;\n`,
      explanation: "useState infers its type from the initial value. When the initial value is narrower than what you'll store later (null, an empty array), pass the type explicitly.",
      tests: [
        test("works", `renderComponent();\nexpectText("No user");\n${click("Load")}\nexpectText("Ada (admin)");\nexpectText("1 events");`),
        hidden("type-checks", clean),
      ],
    },
    {
      slug: "ts-discriminated-union",
      title: "Discriminated Union Props",
      difficulty: "MEDIUM",
      tags: ["typescript", "unions", "props"],
      estimatedMinutes: 15,
      description:
        "`Notice` comes in two kinds, and the props depend on the kind:\n\n- `{ kind: \"info\"; message: string }`\n- `{ kind: \"error\"; message: string; onRetry: () => void }`\n\nType the props as a **discriminated union** so an error notice must have `onRetry` and an info notice can't. Render `<p role=\"status\">{message}</p>` for info, and `<p role=\"alert\">{message}</p>` plus a `Retry` button for errors." + STRICT_NOTE,
      requirements: ["Union of two prop shapes", "kind narrows the type", "Misuse is rejected"],
      hints: ["type NoticeProps = { kind: \"info\"; message: string } | { kind: \"error\"; message: string; onRetry: () => void };", "Inside the component, `if (props.kind === \"error\")` narrows props so props.onRetry is available."],
      starterCode: `interface NoticeProps {\n  kind: string;\n  message: string;\n  onRetry?: () => void;\n}\n\nfunction Notice(props: NoticeProps) {\n  if (props.kind === "error") {\n    return (\n      <div>\n        <p role="alert">{props.message}</p>\n        <button onClick={props.onRetry}>Retry</button>\n      </div>\n    );\n  }\n  return <p role="status">{props.message}</p>;\n}\n\nexport default Notice;\n`,
      solutionCode: `type NoticeProps = { kind: "info"; message: string } | { kind: "error"; message: string; onRetry: () => void };\n\nfunction Notice(props: NoticeProps) {\n  if (props.kind === "error") {\n    return (\n      <div>\n        <p role="alert">{props.message}</p>\n        <button onClick={props.onRetry}>Retry</button>\n      </div>\n    );\n  }\n  return <p role="status">{props.message}</p>;\n}\n\nexport default Notice;\n`,
      explanation: "A shared literal field (`kind`) lets TypeScript pick the right member of the union, both at call sites (required props) and inside the component (narrowing).",
      tests: [
        test("renders both kinds", `const onRetry = mockFn();\nconst { unmount } = renderComponent({ kind: "error", message: "Failed", onRetry });\n${click("Retry")}\nassertEqual(onRetry.calls.length, 1);\nunmount();\nrenderComponent({ kind: "info", message: "Saved" });\nassertEqual(screen.getByRole("status").textContent, "Saved");\n${clean}`),
        hidden("union is enforced", `${mustReject(["const a = <Notice kind=\"error\" message=\"x\" />;", "const b = <Notice kind=\"warning\" message=\"x\" />;", "const c = <Notice kind=\"info\" message=\"x\" onRetry={() => {}} />;"])}\n${mustAccept("const ok = <><Notice kind=\"info\" message=\"x\" /><Notice kind=\"error\" message=\"y\" onRetry={() => {}} /></>;")}`),
      ],
    },
    {
      slug: "ts-generic-list",
      title: "A Generic List Component",
      difficulty: "MEDIUM",
      tags: ["typescript", "generics", "reusable-components"],
      estimatedMinutes: 20,
      description:
        "Make `List` generic so it works for any item type **and** keeps that type:\n\n```\n<List items={users} getKey={(u) => u.id} renderItem={(u) => u.name} />\n```\n\nHere TypeScript should know `u` is a user, so a typo like `u.nmae` is an error. Props: `items: T[]`, `getKey: (item: T) => string | number`, `renderItem: (item: T) => ReactNode`. Render a `<ul>` with one `<li>` per item." + STRICT_NOTE,
      requirements: ["Generic type parameter T", "Item type flows into the callbacks", "Renders the list"],
      hints: ["function List<T>({ items, getKey, renderItem }: ListProps<T>)", "interface ListProps<T> { items: T[]; ... }"],
      starterCode: `import type { ReactNode } from "react";\n\ninterface ListProps {\n  items: any[];\n  getKey: (item: any) => string | number;\n  renderItem: (item: any) => ReactNode;\n}\n\nfunction List({ items, getKey, renderItem }: ListProps) {\n  return (\n    <ul>\n      {items.map((item) => (\n        <li key={getKey(item)}>{renderItem(item)}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default List;\n`,
      solutionCode: `import type { ReactNode } from "react";\n\ninterface ListProps<T> {\n  items: T[];\n  getKey: (item: T) => string | number;\n  renderItem: (item: T) => ReactNode;\n}\n\nfunction List<T>({ items, getKey, renderItem }: ListProps<T>) {\n  return (\n    <ul>\n      {items.map((item) => (\n        <li key={getKey(item)}>{renderItem(item)}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default List;\n`,
      explanation: "Generic components are reusable without giving up type safety: T is inferred from `items`, then checked in every callback.",
      tests: [
        test("renders items", `renderComponent({ items: [{ id: 1, name: "Ana" }, { id: 2, name: "Bo" }], getKey: (u) => u.id, renderItem: (u) => u.name });\nassertEqual(screen.getAllByRole("listitem").map((l) => l.textContent), ["Ana", "Bo"]);\n${clean}`),
        hidden("item type flows into callbacks", `${mustReject(["const a = <List items={[{ id: 1, name: \"a\" }]} getKey={(u) => u.id} renderItem={(u) => u.nmae} />;", "const b = <List items={[1, 2]} getKey={(n) => n} renderItem={(n) => n.toUpperCase()} />;"])}\n${mustAccept("const ok = <List items={[\"a\", \"b\"]} getKey={(s) => s} renderItem={(s) => s.toUpperCase()} />;")}`),
      ],
    },
    {
      slug: "ts-typed-context",
      title: "A Typed Context With a Safe Hook",
      difficulty: "MEDIUM",
      tags: ["typescript", "context", "custom-hooks"],
      estimatedMinutes: 15,
      description:
        "`createContext(null)` gives a context whose value type is just `null`, so `CartBadge` can't read `count`. Fix the types:\n\n- type the context as `CartValue | null`\n- export `useCart()` that throws `useCart must be used within CartProvider` when there's no provider, and otherwise returns a non-null `CartValue`\n- make `CartBadge` use `useCart()`\n\nBehaviour: `Add to cart` increments the badge `Cart (n)`." + "\n\nThe tests type-check your file with `strict: true`.",
      requirements: ["Context typed as CartValue | null", "useCart narrows away null", "Same behaviour"],
      hints: ["createContext<CartValue | null>(null)", "const ctx = useContext(CartContext); if (!ctx) throw new Error(...); return ctx;"],
      starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface CartValue {\n  count: number;\n  add: () => void;\n}\n\nconst CartContext = createContext(null);\n\nfunction CartProvider({ children }: { children: ReactNode }) {\n  const [count, setCount] = useState(0);\n  return <CartContext.Provider value={{ count, add: () => setCount((c) => c + 1) }}>{children}</CartContext.Provider>;\n}\n\nexport function useCart() {\n  return useContext(CartContext);\n}\n\nfunction CartBadge() {\n  const cart = useCart();\n  return <p>Cart ({cart.count})</p>;\n}\n\nfunction AddButton() {\n  const cart = useCart();\n  return <button onClick={cart.add}>Add to cart</button>;\n}\n\nfunction App() {\n  return (\n    <CartProvider>\n      <CartBadge />\n      <AddButton />\n    </CartProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface CartValue {\n  count: number;\n  add: () => void;\n}\n\nconst CartContext = createContext<CartValue | null>(null);\n\nfunction CartProvider({ children }: { children: ReactNode }) {\n  const [count, setCount] = useState(0);\n  return <CartContext.Provider value={{ count, add: () => setCount((c) => c + 1) }}>{children}</CartContext.Provider>;\n}\n\nexport function useCart(): CartValue {\n  const ctx = useContext(CartContext);\n  if (!ctx) throw new Error("useCart must be used within CartProvider");\n  return ctx;\n}\n\nfunction CartBadge() {\n  const cart = useCart();\n  return <p>Cart ({cart.count})</p>;\n}\n\nfunction AddButton() {\n  const cart = useCart();\n  return <button onClick={cart.add}>Add to cart</button>;\n}\n\nfunction App() {\n  return (\n    <CartProvider>\n      <CartBadge />\n      <AddButton />\n    </CartProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "Typing the context as `T | null` is honest (there may be no provider); the hook does the null check once, so every consumer gets a non-null `T`.",
      tests: [
        test("works", `renderComponent();\n${click("Add to cart")}\n${click("Add to cart")}\nexpectText("Cart (2)");`),
        hidden("types and guard", `${clean}\nlet message = null;\ntry { renderHook(() => userExports.useCart()); } catch (e) { message = e.message; }\nassertEqual(message, "useCart must be used within CartProvider");\n${mustAccept("function Probe() { const n: number = useCart().count; return <p>{n}</p>; }")}`),
      ],
    },
    {
      slug: "ts-typed-reducer",
      title: "Type a Reducer's Actions",
      difficulty: "HARD",
      tags: ["typescript", "useReducer", "unions"],
      estimatedMinutes: 20,
      description:
        "Export the type `Action` and the function `todoReducer(state: Todo[], action: Action): Todo[]` with fully typed actions:\n\n- `{ type: \"added\"; text: string }` (id = state length + 1)\n- `{ type: \"toggled\"; id: number }`\n- `{ type: \"cleared\" }` (removes done todos)\n\nThe compiler must reject a missing payload (`{ type: \"added\" }`), a wrong payload type, or an unknown type. The default export `Todos` uses `useReducer(todoReducer, [])` with an input labelled `Todo`, an `Add` button, checkboxes, and a `Clear done` button." + STRICT_NOTE,
      requirements: ["Action is a discriminated union", "Reducer handles every case", "Misuse is a type error"],
      hints: [
        "export type Action = { type: \"added\"; text: string } | { type: \"toggled\"; id: number } | { type: \"cleared\" };",
        "Inside `case \"added\":`, TypeScript knows action.text exists.",
      ],
      starterCode: `import { useReducer, useState } from "react";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\nexport type Action = any;\n\nexport function todoReducer(state: Todo[], action: Action): Todo[] {\n  switch (action.type) {\n    case "added":\n      return [...state, { id: state.length + 1, text: action.text, done: false }];\n    case "toggled":\n      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));\n    case "cleared":\n      return state.filter((t) => !t.done);\n    default:\n      return state;\n  }\n}\n\nfunction Todos() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <label>\n        Todo <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button onClick={() => { dispatch({ type: "added", text }); setText(""); }}>Add</button>\n      <button onClick={() => dispatch({ type: "cleared" })}>Clear done</button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: "toggled", id: t.id })} /> {t.text}\n            </label>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default Todos;\n`,
      solutionCode: `import { useReducer, useState } from "react";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\nexport type Action = { type: "added"; text: string } | { type: "toggled"; id: number } | { type: "cleared" };\n\nexport function todoReducer(state: Todo[], action: Action): Todo[] {\n  switch (action.type) {\n    case "added":\n      return [...state, { id: state.length + 1, text: action.text, done: false }];\n    case "toggled":\n      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));\n    case "cleared":\n      return state.filter((t) => !t.done);\n  }\n}\n\nfunction Todos() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <label>\n        Todo <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button onClick={() => { dispatch({ type: "added", text }); setText(""); }}>Add</button>\n      <button onClick={() => dispatch({ type: "cleared" })}>Clear done</button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: "toggled", id: t.id })} /> {t.text}\n            </label>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default Todos;\n`,
      explanation: "With a discriminated union, `dispatch` only accepts real actions, and each `case` knows exactly which payload is available. Because every case returns, TypeScript also proves the switch is exhaustive.",
      tests: [
        test("works", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Todo"), "Pay rent");\n${click("Add")}\nfireEvent.click(screen.getByRole("checkbox", { name: "Pay rent" }));\n${click("Clear done")}\nassertEqual(screen.queryAllByRole("listitem").length, 0);\n${clean}`),
        hidden("actions are typed", `${mustReject(["todoReducer([], { type: \"added\" });", "todoReducer([], { type: \"toggled\", id: \"1\" });", "todoReducer([], { type: \"renamed\", id: 1 });"])}\n${mustAccept("const s = todoReducer([], { type: \"added\", text: \"x\" });")}`),
      ],
    },
    {
      slug: "ts-type-guard-api",
      title: "Validate API Data With a Type Guard",
      difficulty: "MEDIUM",
      tags: ["typescript", "type-guards", "api"],
      type: "API",
      estimatedMinutes: 20,
      description:
        "API responses are `unknown` until you check them. `GET /api/users` returns some **malformed** entries.\n\n1. Export `isUser(value: unknown): value is User`, true only for objects with a number `id` and a string `name`.\n2. `UserList` fetches the users, keeps only those passing `isUser`, and renders their names as `<li>`s." + STRICT_NOTE,
      requirements: ["isUser is a type predicate", "Malformed entries are dropped", "No `any`"],
      hints: [
        "typeof value === \"object\" && value !== null && \"id\" in value && typeof value.id === \"number\" && ...",
        "The `value is User` return type is what lets TypeScript narrow after the check.",
        "const data: unknown = await res.json(); const users = Array.isArray(data) ? data.filter(isUser) : [];",
      ],
      starterCode: `import { useEffect, useState } from "react";\n\ninterface User {\n  id: number;\n  name: string;\n}\n\nexport function isUser(value: unknown): boolean {\n  return true;\n}\n\nfunction UserList() {\n  const [users, setUsers] = useState<User[]>([]);\n\n  useEffect(() => {\n    fetch("/api/users")\n      .then((r) => r.json())\n      .then((data) => setUsers(data));\n  }, []);\n\n  return (\n    <ul>\n      {users.map((u) => (\n        <li key={u.id}>{u.name}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default UserList;\n`,
      solutionCode: `import { useEffect, useState } from "react";\n\ninterface User {\n  id: number;\n  name: string;\n}\n\nexport function isUser(value: unknown): value is User {\n  return (\n    typeof value === "object" &&\n    value !== null &&\n    "id" in value &&\n    typeof value.id === "number" &&\n    "name" in value &&\n    typeof value.name === "string"\n  );\n}\n\nfunction UserList() {\n  const [users, setUsers] = useState<User[]>([]);\n\n  useEffect(() => {\n    fetch("/api/users")\n      .then((r) => r.json())\n      .then((data: unknown) => setUsers(Array.isArray(data) ? data.filter(isUser) : []));\n  }, []);\n\n  return (\n    <ul>\n      {users.map((u) => (\n        <li key={u.id}>{u.name}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default UserList;\n`,
      explanation: "TypeScript types disappear at runtime, so data from outside your program must be checked. A type guard does the runtime check and tells the compiler what it proved.",
      alternativeApproach: "Schema libraries like Zod generate both the runtime validator and the static type from one definition.",
      mockApi: [{ url: "/api/users", response: [{ id: 1, name: "Ana" }, { id: "2", name: "Bad id" }, { name: "No id" }, null, { id: 3, name: "Cy" }] }],
      tests: [
        test("drops malformed entries", `renderComponent();\nawait waitFor(() => expectText("Cy"));\nassertEqual(screen.getAllByRole("listitem").map((l) => l.textContent), ["Ana", "Cy"]);`),
        hidden("isUser is a real type guard", `const { isUser } = userExports;\nassertEqual([isUser({ id: 1, name: "a" }), isUser({ id: "1", name: "a" }), isUser(null), isUser("x"), isUser({ id: 1 })], [true, false, false, false, false]);\n${clean}\n${mustAccept("function probe(v: unknown) { if (isUser(v)) { const n: string = v.name; return n; } return null; }")}`),
      ],
    },
  ],
};
