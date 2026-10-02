import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
/** Zustand stores live at module level, so every test starts by restoring the initial state. */
const reset = (store: string) => `const store = userExports.${store};\nassert(store && store.getInitialState, "Export your store as ${store}");\nstore.setState(store.getInitialState(), true);`;

export const zustand: CategoryBank = {
  category: "Zustand",
  level: 20,
  type: "STATE",
  prerequisites: ["useState", "Context"],
  problems: [
    {
      slug: "zustand-counter-store",
      title: "Your First Zustand Store",
      difficulty: "EASY",
      tags: ["zustand", "global-state"],
      estimatedMinutes: 12,
      description:
        "Zustand stores are hooks: no provider needed. Export `useCounterStore = create(...)` with state `{ count: 0 }` and actions `increment()`, `decrement()`, `reset()`.\n\nTwo **unconnected** components use it: `CountDisplay` renders `<p>Count: {count}</p>` and `Controls` renders buttons `+`, `-`, `Reset`. `App` (provided) renders them side by side.",
      requirements: ["Store with state and actions", "Separate components share it without props or providers"],
      hints: ["create((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })), ... }))", "const count = useCounterStore((s) => s.count);"],
      starterCode: `import { create } from "zustand";\n\ninterface CounterState {\n  count: number;\n  increment: () => void;\n  decrement: () => void;\n  reset: () => void;\n}\n\n// export const useCounterStore = create<CounterState>()(...)\n\nfunction CountDisplay() {\n  return null;\n}\n\nfunction Controls() {\n  return null;\n}\n\n// Provided\nfunction App() {\n  return (\n    <div>\n      <CountDisplay />\n      <Controls />\n    </div>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { create } from "zustand";\n\ninterface CounterState {\n  count: number;\n  increment: () => void;\n  decrement: () => void;\n  reset: () => void;\n}\n\nexport const useCounterStore = create<CounterState>()((set) => ({\n  count: 0,\n  increment: () => set((s) => ({ count: s.count + 1 })),\n  decrement: () => set((s) => ({ count: s.count - 1 })),\n  reset: () => set({ count: 0 }),\n}));\n\nfunction CountDisplay() {\n  const count = useCounterStore((s) => s.count);\n  return <p>Count: {count}</p>;\n}\n\nfunction Controls() {\n  const increment = useCounterStore((s) => s.increment);\n  const decrement = useCounterStore((s) => s.decrement);\n  const reset = useCounterStore((s) => s.reset);\n  return (\n    <div>\n      <button onClick={increment}>+</button>\n      <button onClick={decrement}>-</button>\n      <button onClick={reset}>Reset</button>\n    </div>\n  );\n}\n\n// Provided\nfunction App() {\n  return (\n    <div>\n      <CountDisplay />\n      <Controls />\n    </div>\n  );\n}\n\nexport default App;\n`,
      explanation: "`set` merges the returned object into state. Any component that selects from the store re-renders when its selected value changes — no Provider, no prop wiring.",
      tests: [
        test("components share the store", `${reset("useCounterStore")}\nrenderComponent();\n${click("+")}\n${click("+")}\n${click("-")}\nexpectText("Count: 1");`),
        hidden("store actions work outside React", `${reset("useCounterStore")}\nstore.getState().increment();\nstore.getState().increment();\nassertEqual(store.getState().count, 2);\nstore.getState().reset();\nassertEqual(store.getState().count, 0);`),
      ],
    },
    {
      slug: "zustand-todo-store",
      title: "Todo Store",
      difficulty: "EASY",
      tags: ["zustand", "arrays"],
      estimatedMinutes: 15,
      description:
        "Export `useTodoStore` with `todos: { id, text, done }[]` (initially empty) and actions `addTodo(text)`, `toggleTodo(id)`, `removeTodo(id)`. Update immutably inside `set`.\n\n`TodoApp` (default) has an input labelled `Todo`, an `Add` button, and each todo as a checkbox labelled with its text plus `Remove {text}`.",
      requirements: ["Store holds todos and actions", "Immutable updates", "UI wired to the store"],
      hints: ["addTodo: (text) => set((s) => ({ todos: [...s.todos, { id: Date.now() + Math.random(), text, done: false }] }))", "Zustand (without middleware) needs new objects/arrays, just like useState."],
      starterCode: `import { useState } from "react";\nimport { create } from "zustand";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\ninterface TodoState {\n  todos: Todo[];\n  addTodo: (text: string) => void;\n  toggleTodo: (id: number) => void;\n  removeTodo: (id: number) => void;\n}\n\n// export const useTodoStore = ...\n\nfunction TodoApp() {\n  return null;\n}\n\nexport default TodoApp;\n`,
      solutionCode: `import { useState } from "react";\nimport { create } from "zustand";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\ninterface TodoState {\n  todos: Todo[];\n  addTodo: (text: string) => void;\n  toggleTodo: (id: number) => void;\n  removeTodo: (id: number) => void;\n}\n\nlet nextId = 1;\n\nexport const useTodoStore = create<TodoState>()((set) => ({\n  todos: [],\n  addTodo: (text) => set((s) => ({ todos: [...s.todos, { id: nextId++, text, done: false }] })),\n  toggleTodo: (id) => set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),\n  removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),\n}));\n\nfunction TodoApp() {\n  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <label>\n        Todo <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button\n        onClick={() => {\n          if (!text.trim()) return;\n          addTodo(text.trim());\n          setText("");\n        }}\n      >\n        Add\n      </button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} /> {t.text}\n            </label>\n            <button onClick={() => removeTodo(t.id)}>Remove {t.text}</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default TodoApp;\n`,
      explanation: "Store actions live next to the data they change, so components just call them. Calling useTodoStore() with no selector subscribes to the whole store — fine here, but see the next problem.",
      tests: [
        test("adds and toggles", `${reset("useTodoStore")}\nrenderComponent();\nawait userEvent.type(screen.getByLabelText("Todo"), "Walk");\n${click("Add")}\nfireEvent.click(screen.getByRole("checkbox", { name: "Walk" }));\nassert(screen.getByRole("checkbox", { name: "Walk" }).checked);`),
        hidden("immutable actions", `${reset("useTodoStore")}\nconst { addTodo, toggleTodo, removeTodo } = store.getState();\naddTodo("a");\naddTodo("b");\nconst before = store.getState().todos;\nconst idA = before[0].id;\ntoggleTodo(idA);\nconst after = store.getState().todos;\nassert(before !== after && before[0] !== after[0], "Create new arrays/objects instead of mutating");\nassertEqual(before[0].done, false, "The previous todo object was mutated");\nremoveTodo(idA);\nassertEqual(store.getState().todos.map((t) => t.text), ["b"]);`),
      ],
      wrongSolutions: [`import { useState } from "react";\nimport { create } from "zustand";\nlet n = 1;\nexport const useTodoStore = create((set, get) => ({\n  todos: [],\n  addTodo: (text) => set((s) => ({ todos: [...s.todos, { id: n++, text, done: false }] })),\n  toggleTodo: (id) => { const t = get().todos.find((x) => x.id === id); t.done = !t.done; set({ todos: [...get().todos] }); },\n  removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),\n}));\nfunction TodoApp() {\n  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();\n  const [text, setText] = useState("");\n  return (<div><label>Todo <input value={text} onChange={(e) => setText(e.target.value)} /></label><button onClick={() => { addTodo(text); setText(""); }}>Add</button><ul>{todos.map((t) => <li key={t.id}><label><input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} /> {t.text}</label><button onClick={() => removeTodo(t.id)}>Remove {t.text}</button></li>)}</ul></div>);\n}\nexport default TodoApp;\n`],
    },
    {
      slug: "zustand-selectors",
      title: "Select Only What You Need",
      difficulty: "MEDIUM",
      tags: ["zustand", "selectors", "performance"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 15,
      description:
        "`useProfileStore` holds `{ name, visits, setName, visit }`. `VisitCounter` destructures the **whole store**, so it re-renders whenever the name changes, even though it only shows visits. The exported `counterRenders` proves it.\n\nFix `VisitCounter` (and only it) so it subscribes to `visits` and `visit` with selectors. Behaviour stays the same.",
      requirements: ["Same behaviour", "VisitCounter doesn't re-render when only the name changes"],
      hints: ["useStore() with no selector subscribes to everything.", "const visits = useProfileStore((s) => s.visits);"],
      starterCode: `import { create } from "zustand";\n\ninterface ProfileState {\n  name: string;\n  visits: number;\n  setName: (name: string) => void;\n  visit: () => void;\n}\n\nexport const useProfileStore = create<ProfileState>()((set) => ({\n  name: "",\n  visits: 0,\n  setName: (name) => set({ name }),\n  visit: () => set((s) => ({ visits: s.visits + 1 })),\n}));\n\nexport let counterRenders = 0;\n\nfunction NameField() {\n  const name = useProfileStore((s) => s.name);\n  const setName = useProfileStore((s) => s.setName);\n  return (\n    <label>\n      Name <input value={name} onChange={(e) => setName(e.target.value)} />\n    </label>\n  );\n}\n\nfunction VisitCounter() {\n  counterRenders++;\n  const { visits, visit } = useProfileStore();\n  return (\n    <div>\n      <p>Visits: {visits}</p>\n      <button onClick={visit}>Visit</button>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div>\n      <NameField />\n      <VisitCounter />\n    </div>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { create } from "zustand";\n\ninterface ProfileState {\n  name: string;\n  visits: number;\n  setName: (name: string) => void;\n  visit: () => void;\n}\n\nexport const useProfileStore = create<ProfileState>()((set) => ({\n  name: "",\n  visits: 0,\n  setName: (name) => set({ name }),\n  visit: () => set((s) => ({ visits: s.visits + 1 })),\n}));\n\nexport let counterRenders = 0;\n\nfunction NameField() {\n  const name = useProfileStore((s) => s.name);\n  const setName = useProfileStore((s) => s.setName);\n  return (\n    <label>\n      Name <input value={name} onChange={(e) => setName(e.target.value)} />\n    </label>\n  );\n}\n\nfunction VisitCounter() {\n  counterRenders++;\n  const visits = useProfileStore((s) => s.visits);\n  const visit = useProfileStore((s) => s.visit);\n  return (\n    <div>\n      <p>Visits: {visits}</p>\n      <button onClick={visit}>Visit</button>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div>\n      <NameField />\n      <VisitCounter />\n    </div>\n  );\n}\n\nexport default App;\n`,
      explanation: "A selector tells Zustand which slice of state a component depends on; it only re-renders when that slice changes. This is Zustand's main performance advantage over a single big Context.",
      tests: [
        test("visits still count", `${reset("useProfileStore")}\nrenderComponent();\n${click("Visit")}\n${click("Visit")}\nexpectText("Visits: 2");`),
        hidden("typing a name doesn't re-render the counter", `${reset("useProfileStore")}\nrenderComponent();\nconst before = userExports.counterRenders;\nawait userEvent.type(screen.getByLabelText("Name"), "Kim");\nassertEqual(userExports.counterRenders - before, 0, "VisitCounter re-rendered while typing a name");`),
      ],
    },
    {
      slug: "zustand-async-actions",
      title: "Async Actions in a Store",
      difficulty: "MEDIUM",
      tags: ["zustand", "api", "async"],
      type: "API",
      estimatedMinutes: 20,
      description:
        "Export `useProductStore` with `{ products: [], status: \"idle\" | \"loading\" | \"success\" | \"error\", fetchProducts() }`. `fetchProducts` sets `loading`, fetches `GET /api/products` (array of `{ id, name }`), then sets `success` with the data, or `error` for non-OK responses.\n\n`ProductList` (default) calls `fetchProducts` on mount and shows `Loading...`, the names, or `<p role=\"alert\">Failed to load</p>`.",
      requirements: ["Async action manages status", "Component triggers it on mount"],
      hints: ["Actions can be async: fetchProducts: async () => { set({ status: \"loading\" }); ... }", "Select fetchProducts with a selector and call it in useEffect."],
      starterCode: `import { useEffect } from "react";\nimport { create } from "zustand";\n\ninterface Product {\n  id: number;\n  name: string;\n}\n\ninterface ProductState {\n  products: Product[];\n  status: "idle" | "loading" | "success" | "error";\n  fetchProducts: () => Promise<void>;\n}\n\n// export const useProductStore = ...\n\nfunction ProductList() {\n  return null;\n}\n\nexport default ProductList;\n`,
      solutionCode: `import { useEffect } from "react";\nimport { create } from "zustand";\n\ninterface Product {\n  id: number;\n  name: string;\n}\n\ninterface ProductState {\n  products: Product[];\n  status: "idle" | "loading" | "success" | "error";\n  fetchProducts: () => Promise<void>;\n}\n\nexport const useProductStore = create<ProductState>()((set) => ({\n  products: [],\n  status: "idle",\n  fetchProducts: async () => {\n    set({ status: "loading" });\n    try {\n      const res = await fetch("/api/products");\n      if (!res.ok) throw new Error();\n      set({ products: await res.json(), status: "success" });\n    } catch {\n      set({ status: "error" });\n    }\n  },\n}));\n\nfunction ProductList() {\n  const products = useProductStore((s) => s.products);\n  const status = useProductStore((s) => s.status);\n  const fetchProducts = useProductStore((s) => s.fetchProducts);\n\n  useEffect(() => {\n    fetchProducts();\n  }, [fetchProducts]);\n\n  if (status === "error") return <p role="alert">Failed to load</p>;\n  if (status !== "success") return <p>Loading...</p>;\n  return (\n    <ul>\n      {products.map((p) => (\n        <li key={p.id}>{p.name}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default ProductList;\n`,
      explanation: "In Zustand, async logic is just an async function that calls `set` when it has results — no thunks or middleware required.",
      mockApi: [{ url: "/api/products", delayMs: 20, response: [{ id: 1, name: "Desk" }, { id: 2, name: "Lamp" }] }],
      tests: [
        test("loads products", `${reset("useProductStore")}\nrenderComponent();\nexpectText("Loading...");\nawait waitFor(() => expectText("Lamp"));`),
        hidden("handles errors", `${reset("useProductStore")}\nmockApi.setRoutes([{ url: "/api/products", status: 500, response: {} }]);\nawait store.getState().fetchProducts();\nassertEqual(store.getState().status, "error");\nrenderComponent();\nawait waitFor(() => screen.getByRole("alert"));`),
      ],
    },
    {
      slug: "zustand-persist",
      title: "Persist a Store to localStorage",
      difficulty: "MEDIUM",
      tags: ["zustand", "middleware", "persistence"],
      estimatedMinutes: 15,
      description:
        "Export `useSettingsStore` with `{ fontSize: 16, increase(), decrease() }` (steps of 2), wrapped in Zustand's `persist` middleware with the storage key `\"settings\"` so the font size survives a reload.\n\n`Settings` (default) shows `<p style={{ fontSize }}>Font size: {fontSize}px</p>` and buttons `A+` and `A-`.",
      requirements: ["Uses persist with the 'settings' key", "Values are written to localStorage"],
      hints: ["import { persist } from \"zustand/middleware\";", "create<State>()(persist((set) => ({ ... }), { name: \"settings\" }))"],
      starterCode: `import { create } from "zustand";\nimport { persist } from "zustand/middleware";\n\ninterface SettingsState {\n  fontSize: number;\n  increase: () => void;\n  decrease: () => void;\n}\n\n// export const useSettingsStore = ...\n\nfunction Settings() {\n  return null;\n}\n\nexport default Settings;\n`,
      solutionCode: `import { create } from "zustand";\nimport { persist } from "zustand/middleware";\n\ninterface SettingsState {\n  fontSize: number;\n  increase: () => void;\n  decrease: () => void;\n}\n\nexport const useSettingsStore = create<SettingsState>()(\n  persist(\n    (set) => ({\n      fontSize: 16,\n      increase: () => set((s) => ({ fontSize: s.fontSize + 2 })),\n      decrease: () => set((s) => ({ fontSize: s.fontSize - 2 })),\n    }),\n    { name: "settings" }\n  )\n);\n\nfunction Settings() {\n  const fontSize = useSettingsStore((s) => s.fontSize);\n  const increase = useSettingsStore((s) => s.increase);\n  const decrease = useSettingsStore((s) => s.decrease);\n  return (\n    <div>\n      <p style={{ fontSize }}>Font size: {fontSize}px</p>\n      <button onClick={increase}>A+</button>\n      <button onClick={decrease}>A-</button>\n    </div>\n  );\n}\n\nexport default Settings;\n`,
      explanation: "Middleware wraps the store's `set` to add behaviour. `persist` serializes state to storage after every change and rehydrates it on startup.",
      tests: [
        test("changes the font size", `${reset("useSettingsStore")}\nrenderComponent();\n${click("A+")}\n${click("A+")}\nexpectText("Font size: 20px");`),
        hidden("persists to localStorage", `${reset("useSettingsStore")}\nstore.getState().decrease();\nconst saved = JSON.parse(localStorage.getItem("settings"));\nassertEqual(saved.state.fontSize, 14);`),
      ],
    },
  ],
};
