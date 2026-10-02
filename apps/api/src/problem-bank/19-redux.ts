import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;

const IMPORTS = `import { useState } from "react";\nimport { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";`;

/** Provided store + Provider wiring, so learners focus on the slice and the component. */
const app = (component: string, reducer: string) => `// Provided — the store and Provider are set up for you.
export function makeStore() {
  return configureStore({ reducer: ${reducer} });
}
type RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;

export default function App() {
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <${component} />
    </Provider>
  );
}
`;

export const redux: CategoryBank = {
  category: "Redux Toolkit",
  level: 19,
  type: "REDUX",
  prerequisites: ["useReducer", "Context"],
  problems: [
    {
      slug: "redux-counter-slice",
      title: "Create a Counter Slice",
      difficulty: "EASY",
      tags: ["redux", "redux-toolkit", "createSlice"],
      estimatedMinutes: 15,
      description:
        "Redux Toolkit's `createSlice` generates a reducer **and** action creators from one definition.\n\n1. Create and export `counterSlice` named `\"counter\"` with initial state `{ value: 0 }` and reducers `increment`, `decrement`, `reset`.\n2. Make `Counter` read `state.counter.value` with `useSelector` and dispatch the slice's actions from buttons `+`, `-`, `Reset`. Show `<p>Count: {value}</p>`.\n\nThe store and `<Provider>` are already wired up below.",
      requirements: ["Slice with three reducers", "Counter reads with useSelector", "Buttons dispatch the slice's actions"],
      hints: [
        "Inside createSlice reducers you can 'mutate' state — Immer turns it into an immutable update: increment: (state) => { state.value += 1; }",
        "const value = useSelector((state: RootState) => state.counter.value);",
        "dispatch(counterSlice.actions.increment())",
      ],
      starterCode: `${IMPORTS}\n\nexport const counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    // increment, decrement, reset\n  },\n});\n\nexport function Counter() {\n  return null;\n}\n\n${app("Counter", "{ counter: counterSlice.reducer }")}`,
      solutionCode: `${IMPORTS}\n\nexport const counterSlice = createSlice({\n  name: "counter",\n  initialState: { value: 0 },\n  reducers: {\n    increment: (state) => {\n      state.value += 1;\n    },\n    decrement: (state) => {\n      state.value -= 1;\n    },\n    reset: (state) => {\n      state.value = 0;\n    },\n  },\n});\n\nexport function Counter() {\n  const value = useSelector((state: RootState) => state.counter.value);\n  const dispatch = useDispatch();\n  const { increment, decrement, reset } = counterSlice.actions;\n  return (\n    <div>\n      <p>Count: {value}</p>\n      <button onClick={() => dispatch(increment())}>+</button>\n      <button onClick={() => dispatch(decrement())}>-</button>\n      <button onClick={() => dispatch(reset())}>Reset</button>\n    </div>\n  );\n}\n\n${app("Counter", "{ counter: counterSlice.reducer }")}`,
      explanation: "A slice bundles the state shape, the reducer, and matching action creators. Immer lets the reducer code look like mutation while producing a new immutable state.",
      tests: [
        test("counts", `renderComponent();\n${click("+")}\n${click("+")}\n${click("-")}\nexpectText("Count: 1");\n${click("Reset")}\nexpectText("Count: 0");`),
        hidden("slice reducer and actions", `const { counterSlice } = userExports;\nconst { increment, decrement } = counterSlice.actions;\nassertEqual(increment().type, "counter/increment");\nassertEqual(counterSlice.reducer({ value: 3 }, decrement()), { value: 2 });\nassertEqual(counterSlice.reducer(undefined, { type: "@@init" }), { value: 0 });`),
      ],
    },
    {
      slug: "redux-payload-action",
      title: "Payload Actions",
      difficulty: "EASY",
      tags: ["redux", "redux-toolkit", "payload"],
      estimatedMinutes: 15,
      description:
        "Export `walletSlice` (`name: \"wallet\"`, initial `{ balance: 0 }`) with reducers:\n\n- `deposit(amount)` → add the payload\n- `withdraw(amount)` → subtract it, but never go below 0 (ignore withdrawals that are too large)\n\n`Wallet` shows `<p>Balance: ${balance}</p>`, a number input labelled `Amount`, and buttons `Deposit` and `Withdraw` that dispatch with the input's number.",
      requirements: ["Actions carry the amount as payload", "Withdrawals can't overdraw"],
      hints: ["deposit: (state, action: PayloadAction<number>) => { state.balance += action.payload; }", "dispatch(walletSlice.actions.deposit(Number(amount)))"],
      starterCode: `${IMPORTS}\n\nexport const walletSlice = createSlice({\n  name: "wallet",\n  initialState: { balance: 0 },\n  reducers: {},\n});\n\nexport function Wallet() {\n  return null;\n}\n\n${app("Wallet", "{ wallet: walletSlice.reducer }")}`,
      solutionCode: `${IMPORTS}\n\nexport const walletSlice = createSlice({\n  name: "wallet",\n  initialState: { balance: 0 },\n  reducers: {\n    deposit: (state, action: PayloadAction<number>) => {\n      state.balance += action.payload;\n    },\n    withdraw: (state, action: PayloadAction<number>) => {\n      if (action.payload <= state.balance) state.balance -= action.payload;\n    },\n  },\n});\n\nexport function Wallet() {\n  const balance = useSelector((state: RootState) => state.wallet.balance);\n  const dispatch = useDispatch();\n  const [amount, setAmount] = useState("");\n  const { deposit, withdraw } = walletSlice.actions;\n\n  return (\n    <div>\n      <p>Balance: \${balance}</p>\n      <label>\n        Amount <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />\n      </label>\n      <button onClick={() => dispatch(deposit(Number(amount)))}>Deposit</button>\n      <button onClick={() => dispatch(withdraw(Number(amount)))}>Withdraw</button>\n    </div>\n  );\n}\n\n${app("Wallet", "{ wallet: walletSlice.reducer }")}`,
      explanation: "Action creators generated by createSlice put their argument in action.payload. Business rules (no overdraft) belong in the reducer, so every caller gets them for free.",
      tests: [
        test("deposits and withdraws", `renderComponent();\nfireEvent.change(screen.getByLabelText("Amount"), { target: { value: "50" } });\n${click("Deposit")}\nfireEvent.change(screen.getByLabelText("Amount"), { target: { value: "20" } });\n${click("Withdraw")}\nexpectText("Balance: $30");`),
        hidden("cannot overdraw", `const { walletSlice } = userExports;\nconst { withdraw, deposit } = walletSlice.actions;\nassertEqual(walletSlice.reducer({ balance: 10 }, withdraw(25)), { balance: 10 });\nassertEqual(deposit(7).payload, 7);`),
      ],
    },
    {
      slug: "redux-todo-slice",
      title: "Todo Slice With Prepared Actions",
      difficulty: "MEDIUM",
      tags: ["redux", "redux-toolkit", "prepare", "arrays"],
      estimatedMinutes: 20,
      description:
        "Export `todosSlice` (`name: \"todos\"`, initial `[]`) with:\n\n- `todoAdded(text)` — use a **prepare callback** to build the payload `{ id: nanoid(), text, done: false }`, so ids aren't generated inside the reducer\n- `todoToggled(id)`\n- `todoRemoved(id)`\n\n`TodoList` renders an input labelled `New todo`, an `Add` button, and each todo as a checkbox labelled with its text plus a `Remove {text}` button.",
      requirements: ["prepare callback generates the id", "Toggle and remove by id", "UI wired to the store"],
      hints: [
        "todoAdded: { reducer(state, action: PayloadAction<Todo>) { state.push(action.payload); }, prepare(text: string) { return { payload: { id: nanoid(), text, done: false } }; } }",
        "import { nanoid } from \"@reduxjs/toolkit\";",
        "Reducers must be pure — randomness belongs in prepare, not in the reducer.",
      ],
      starterCode: `${IMPORTS}\nimport { nanoid } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: string;\n  text: string;\n  done: boolean;\n}\n\nexport const todosSlice = createSlice({\n  name: "todos",\n  initialState: [] as Todo[],\n  reducers: {},\n});\n\nexport function TodoList() {\n  return null;\n}\n\n${app("TodoList", "{ todos: todosSlice.reducer }")}`,
      solutionCode: `${IMPORTS}\nimport { nanoid } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: string;\n  text: string;\n  done: boolean;\n}\n\nexport const todosSlice = createSlice({\n  name: "todos",\n  initialState: [] as Todo[],\n  reducers: {\n    todoAdded: {\n      reducer(state, action: PayloadAction<Todo>) {\n        state.push(action.payload);\n      },\n      prepare(text: string) {\n        return { payload: { id: nanoid(), text, done: false } };\n      },\n    },\n    todoToggled(state, action: PayloadAction<string>) {\n      const todo = state.find((t) => t.id === action.payload);\n      if (todo) todo.done = !todo.done;\n    },\n    todoRemoved(state, action: PayloadAction<string>) {\n      return state.filter((t) => t.id !== action.payload);\n    },\n  },\n});\n\nexport function TodoList() {\n  const todos = useSelector((state: RootState) => state.todos);\n  const dispatch = useDispatch();\n  const [text, setText] = useState("");\n  const { todoAdded, todoToggled, todoRemoved } = todosSlice.actions;\n\n  return (\n    <div>\n      <label>\n        New todo <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button\n        onClick={() => {\n          if (!text.trim()) return;\n          dispatch(todoAdded(text.trim()));\n          setText("");\n        }}\n      >\n        Add\n      </button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => dispatch(todoToggled(t.id))} /> {t.text}\n            </label>\n            <button onClick={() => dispatch(todoRemoved(t.id))}>Remove {t.text}</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\n${app("TodoList", "{ todos: todosSlice.reducer }")}`,
      explanation: "Prepare callbacks keep reducers deterministic: the id is generated once when the action is created, so replaying the same action (e.g. in Redux DevTools) gives the same state.",
      tests: [
        test("adds, toggles, removes", `renderComponent();\nawait userEvent.type(screen.getByLabelText("New todo"), "Read");\n${click("Add")}\nawait userEvent.type(screen.getByLabelText("New todo"), "Write");\n${click("Add")}\nfireEvent.click(screen.getByRole("checkbox", { name: "Read" }));\nassert(screen.getByRole("checkbox", { name: "Read" }).checked);\n${click("Remove Write")}\nassertEqual(screen.getAllByRole("listitem").length, 1);`),
        hidden("prepare builds the payload", `const { todosSlice } = userExports;\nconst action = todosSlice.actions.todoAdded("Ship");\nassertEqual(action.payload.text, "Ship");\nassertEqual(action.payload.done, false);\nassert(typeof action.payload.id === "string" && action.payload.id.length > 0, "The prepare callback should generate an id");\nconst state = todosSlice.reducer([], action);\nassertEqual(state, [action.payload]);\nassertEqual(todosSlice.reducer(state, todosSlice.actions.todoRemoved(action.payload.id)), []);`),
      ],
    },
    {
      slug: "redux-memoized-selectors",
      title: "Memoized Selectors",
      difficulty: "MEDIUM",
      tags: ["redux", "selectors", "createSelector", "performance"],
      estimatedMinutes: 20,
      description:
        "The store has `todos` and a `filter` (`\"all\" | \"active\" | \"done\"`) — both slices are provided.\n\nExport `selectVisibleTodos` built with `createSelector`, which returns the todos matching the filter. Because it's memoized, calling it twice with the same state must return **the same array** (otherwise components using it would re-render every time).\n\n`TodoFilter` (provided UI shell) needs the three filter buttons wired up and the visible todos rendered as `<li>`s.",
      requirements: ["Selector filters correctly", "Same input → same array reference", "Filter buttons change the list"],
      hints: [
        "import { createSelector } from \"@reduxjs/toolkit\";",
        "createSelector([selectTodos, selectFilter], (todos, filter) => todos.filter(...))",
        "Input selectors just pick state: (state: RootState) => state.todos",
      ],
      starterCode: `${IMPORTS}\nimport { createSelector } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\nconst todosSlice = createSlice({\n  name: "todos",\n  initialState: [\n    { id: 1, text: "Learn Redux", done: true },\n    { id: 2, text: "Learn selectors", done: false },\n    { id: 3, text: "Ship it", done: false },\n  ] as Todo[],\n  reducers: {},\n});\n\nexport const filterSlice = createSlice({\n  name: "filter",\n  initialState: "all" as "all" | "active" | "done",\n  reducers: {\n    filterChanged: (_state, action: PayloadAction<"all" | "active" | "done">) => action.payload,\n  },\n});\n\nexport const selectVisibleTodos = (state: RootState): Todo[] => [];\n\nexport function TodoFilter() {\n  const dispatch = useDispatch();\n  return (\n    <div>\n      <button>all</button>\n      <button>active</button>\n      <button>done</button>\n      <ul></ul>\n    </div>\n  );\n}\n\n${app("TodoFilter", "{ todos: todosSlice.reducer, filter: filterSlice.reducer }")}`,
      solutionCode: `${IMPORTS}\nimport { createSelector } from "@reduxjs/toolkit";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\n\nconst todosSlice = createSlice({\n  name: "todos",\n  initialState: [\n    { id: 1, text: "Learn Redux", done: true },\n    { id: 2, text: "Learn selectors", done: false },\n    { id: 3, text: "Ship it", done: false },\n  ] as Todo[],\n  reducers: {},\n});\n\nexport const filterSlice = createSlice({\n  name: "filter",\n  initialState: "all" as "all" | "active" | "done",\n  reducers: {\n    filterChanged: (_state, action: PayloadAction<"all" | "active" | "done">) => action.payload,\n  },\n});\n\nconst selectTodos = (state: RootState) => state.todos;\nconst selectFilter = (state: RootState) => state.filter;\n\nexport const selectVisibleTodos = createSelector([selectTodos, selectFilter], (todos, filter) =>\n  todos.filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done))\n);\n\nexport function TodoFilter() {\n  const dispatch = useDispatch();\n  const visible = useSelector(selectVisibleTodos);\n  const { filterChanged } = filterSlice.actions;\n  return (\n    <div>\n      <button onClick={() => dispatch(filterChanged("all"))}>all</button>\n      <button onClick={() => dispatch(filterChanged("active"))}>active</button>\n      <button onClick={() => dispatch(filterChanged("done"))}>done</button>\n      <ul>\n        {visible.map((t) => (\n          <li key={t.id}>{t.text}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\n${app("TodoFilter", "{ todos: todosSlice.reducer, filter: filterSlice.reducer }")}`,
      explanation: "useSelector re-renders when the selected value changes by reference. A plain filter() creates a new array every time; createSelector only recomputes when its inputs change.",
      tests: [
        test("filters the list", `renderComponent();\nassertEqual(screen.getAllByRole("listitem").length, 3);\n${click("active")}\nassertEqual(screen.getAllByRole("listitem").map((l) => l.textContent), ["Learn selectors", "Ship it"]);\n${click("done")}\nassertEqual(screen.getAllByRole("listitem").map((l) => l.textContent), ["Learn Redux"]);`),
        hidden("selector is memoized", `const store = userExports.makeStore();\nconst a = userExports.selectVisibleTodos(store.getState());\nconst b = userExports.selectVisibleTodos(store.getState());\nassert(a === b, "selectVisibleTodos returned a new array for the same state — use createSelector");\nstore.dispatch(userExports.filterSlice.actions.filterChanged("done"));\nassertEqual(userExports.selectVisibleTodos(store.getState()).length, 1);`),
      ],
      wrongSolutions: [`${IMPORTS}\nconst todosSlice = createSlice({ name: "todos", initialState: [{ id: 1, text: "Learn Redux", done: true }, { id: 2, text: "Learn selectors", done: false }, { id: 3, text: "Ship it", done: false }], reducers: {} });\nexport const filterSlice = createSlice({ name: "filter", initialState: "all", reducers: { filterChanged: (_s, a) => a.payload } });\nexport const selectVisibleTodos = (state) => state.todos.filter((t) => state.filter === "all" || (state.filter === "done" ? t.done : !t.done));\nexport function TodoFilter() {\n  const dispatch = useDispatch();\n  const visible = useSelector(selectVisibleTodos);\n  const { filterChanged } = filterSlice.actions;\n  return (<div><button onClick={() => dispatch(filterChanged("all"))}>all</button><button onClick={() => dispatch(filterChanged("active"))}>active</button><button onClick={() => dispatch(filterChanged("done"))}>done</button><ul>{visible.map((t) => <li key={t.id}>{t.text}</li>)}</ul></div>);\n}\n${app("TodoFilter", "{ todos: todosSlice.reducer, filter: filterSlice.reducer }")}`],
    },
    {
      slug: "redux-cart-slice",
      title: "Shopping Cart Slice",
      difficulty: "MEDIUM",
      tags: ["redux", "redux-toolkit", "cart", "selectors"],
      estimatedMinutes: 25,
      description:
        "Export `cartSlice` (`name: \"cart\"`, initial `{ items: [] }`, items are `{ id, name, price, quantity }`) with:\n\n- `itemAdded(product)` — add with quantity 1, or increment if already present\n- `itemRemoved(id)`\n- `quantityChanged({ id, quantity })` — set the quantity; a quantity below 1 removes the item\n\nExport `selectCartTotal(state)`. `Cart` (provided buttons for the two `PRODUCTS`) renders each line as `<li>{name} × {quantity}</li>` and `<p>Total: ${total}</p>` with two decimals.",
      requirements: ["Add/increment, remove, change quantity", "Quantity < 1 removes", "Total selector"],
      hints: ["const existing = state.items.find((i) => i.id === action.payload.id);", "Removing in Immer: state.items = state.items.filter(...)"],
      starterCode: `${IMPORTS}\n\nconst PRODUCTS = [\n  { id: 1, name: "Pen", price: 1.5 },\n  { id: 2, name: "Notebook", price: 4 },\n];\n\ninterface Item {\n  id: number;\n  name: string;\n  price: number;\n  quantity: number;\n}\n\nexport const cartSlice = createSlice({\n  name: "cart",\n  initialState: { items: [] as Item[] },\n  reducers: {},\n});\n\nexport const selectCartTotal = (state: RootState): number => 0;\n\nexport function Cart() {\n  const dispatch = useDispatch();\n  return (\n    <div>\n      {PRODUCTS.map((p) => (\n        <button key={p.id}>Add {p.name}</button>\n      ))}\n    </div>\n  );\n}\n\n${app("Cart", "{ cart: cartSlice.reducer }")}`,
      solutionCode: `${IMPORTS}\n\nconst PRODUCTS = [\n  { id: 1, name: "Pen", price: 1.5 },\n  { id: 2, name: "Notebook", price: 4 },\n];\n\ninterface Item {\n  id: number;\n  name: string;\n  price: number;\n  quantity: number;\n}\n\nexport const cartSlice = createSlice({\n  name: "cart",\n  initialState: { items: [] as Item[] },\n  reducers: {\n    itemAdded(state, action: PayloadAction<Omit<Item, "quantity">>) {\n      const existing = state.items.find((i) => i.id === action.payload.id);\n      if (existing) existing.quantity += 1;\n      else state.items.push({ ...action.payload, quantity: 1 });\n    },\n    itemRemoved(state, action: PayloadAction<number>) {\n      state.items = state.items.filter((i) => i.id !== action.payload);\n    },\n    quantityChanged(state, action: PayloadAction<{ id: number; quantity: number }>) {\n      const { id, quantity } = action.payload;\n      if (quantity < 1) {\n        state.items = state.items.filter((i) => i.id !== id);\n        return;\n      }\n      const item = state.items.find((i) => i.id === id);\n      if (item) item.quantity = quantity;\n    },\n  },\n});\n\nexport const selectCartTotal = (state: RootState): number =>\n  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);\n\nexport function Cart() {\n  const dispatch = useDispatch();\n  const items = useSelector((state: RootState) => state.cart.items);\n  const total = useSelector(selectCartTotal);\n  return (\n    <div>\n      {PRODUCTS.map((p) => (\n        <button key={p.id} onClick={() => dispatch(cartSlice.actions.itemAdded(p))}>\n          Add {p.name}\n        </button>\n      ))}\n      <ul>\n        {items.map((i) => (\n          <li key={i.id}>\n            {i.name} × {i.quantity}\n          </li>\n        ))}\n      </ul>\n      <p>Total: \${total.toFixed(2)}</p>\n    </div>\n  );\n}\n\n${app("Cart", "{ cart: cartSlice.reducer }")}`,
      explanation: "Selectors derive values (the total) from the minimal stored state, so the total can never disagree with the line items.",
      tests: [
        test("adds and totals", `renderComponent();\n${click("Add Pen")}\n${click("Add Pen")}\n${click("Add Notebook")}\nexpectText("Pen × 2");\nexpectText("Total: $7.00");`),
        hidden("quantity changes and removal", `const { cartSlice, makeStore, selectCartTotal } = userExports;\nconst store = makeStore();\nconst { itemAdded, quantityChanged, itemRemoved } = cartSlice.actions;\nstore.dispatch(itemAdded({ id: 1, name: "Pen", price: 1.5 }));\nstore.dispatch(itemAdded({ id: 2, name: "Notebook", price: 4 }));\nstore.dispatch(quantityChanged({ id: 1, quantity: 4 }));\nassertEqual(selectCartTotal(store.getState()), 10);\nstore.dispatch(quantityChanged({ id: 2, quantity: 0 }));\nassertEqual(store.getState().cart.items.map((i) => i.id), [1]);\nstore.dispatch(itemRemoved(1));\nassertEqual(store.getState().cart.items, []);`),
      ],
    },
    {
      slug: "redux-combine-slices",
      title: "Configure a Store With Multiple Slices",
      difficulty: "MEDIUM",
      tags: ["redux", "configureStore", "architecture"],
      estimatedMinutes: 20,
      description:
        "This time **you** write `makeStore()`. Two slices are provided: `authSlice` (`{ user: string | null }`, actions `loggedIn(name)`, `loggedOut()`) and `themeSlice` (`\"light\" | \"dark\"`, action `toggled()`).\n\n1. Export `makeStore()` that combines them under `state.auth` and `state.theme`.\n2. Complete `Header`: shows `<p>{user ?? \"Guest\"} · {theme}</p>`, a button `Log in as Sam` / `Log out` depending on auth, and a button `Toggle theme`.",
      requirements: ["Store has auth and theme keys", "Header reads both slices", "Actions update the right slice"],
      hints: ["configureStore({ reducer: { auth: authSlice.reducer, theme: themeSlice.reducer } })", "Each slice only sees its own part of the state."],
      starterCode: `import { useState } from "react";\nimport { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\nexport const authSlice = createSlice({\n  name: "auth",\n  initialState: { user: null as string | null },\n  reducers: {\n    loggedIn: (state, action: PayloadAction<string>) => {\n      state.user = action.payload;\n    },\n    loggedOut: (state) => {\n      state.user = null;\n    },\n  },\n});\n\nexport const themeSlice = createSlice({\n  name: "theme",\n  initialState: "light" as "light" | "dark",\n  reducers: {\n    toggled: (state) => (state === "light" ? "dark" : "light"),\n  },\n});\n\nexport function makeStore() {\n  // combine both slices\n  return configureStore({ reducer: {} });\n}\n\ntype RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;\n\nfunction Header() {\n  return null;\n}\n\nexport default function App() {\n  const [store] = useState(makeStore);\n  return (\n    <Provider store={store}>\n      <Header />\n    </Provider>\n  );\n}\n`,
      solutionCode: `import { useState } from "react";\nimport { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\nexport const authSlice = createSlice({\n  name: "auth",\n  initialState: { user: null as string | null },\n  reducers: {\n    loggedIn: (state, action: PayloadAction<string>) => {\n      state.user = action.payload;\n    },\n    loggedOut: (state) => {\n      state.user = null;\n    },\n  },\n});\n\nexport const themeSlice = createSlice({\n  name: "theme",\n  initialState: "light" as "light" | "dark",\n  reducers: {\n    toggled: (state) => (state === "light" ? "dark" : "light"),\n  },\n});\n\nexport function makeStore() {\n  return configureStore({ reducer: { auth: authSlice.reducer, theme: themeSlice.reducer } });\n}\n\ntype RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;\n\nfunction Header() {\n  const user = useSelector((state: RootState) => state.auth.user);\n  const theme = useSelector((state: RootState) => state.theme);\n  const dispatch = useDispatch();\n  return (\n    <div>\n      <p>\n        {user ?? "Guest"} · {theme}\n      </p>\n      {user ? (\n        <button onClick={() => dispatch(authSlice.actions.loggedOut())}>Log out</button>\n      ) : (\n        <button onClick={() => dispatch(authSlice.actions.loggedIn("Sam"))}>Log in as Sam</button>\n      )}\n      <button onClick={() => dispatch(themeSlice.actions.toggled())}>Toggle theme</button>\n    </div>\n  );\n}\n\nexport default function App() {\n  const [store] = useState(makeStore);\n  return (\n    <Provider store={store}>\n      <Header />\n    </Provider>\n  );\n}\n`,
      explanation: "Each slice owns one key of the root state. configureStore combines them, and RootState's type is inferred from the reducers you pass in.",
      tests: [
        test("logs in and toggles", `renderComponent();\nexpectText("Guest · light");\n${click("Log in as Sam")}\n${click("Toggle theme")}\nexpectText("Sam · dark");`),
        hidden("store shape", `const store = userExports.makeStore();\nassertEqual(store.getState(), { auth: { user: null }, theme: "light" });\nstore.dispatch(userExports.authSlice.actions.loggedIn("Ana"));\nassertEqual(store.getState().auth.user, "Ana");\nassertEqual(store.getState().theme, "light");`),
      ],
    },
    {
      slug: "redux-async-thunk",
      title: "Fetch Data With createAsyncThunk",
      difficulty: "HARD",
      tags: ["redux", "createAsyncThunk", "api", "async"],
      type: "API",
      estimatedMinutes: 30,
      description:
        "Export `fetchUsers`, created with `createAsyncThunk(\"users/fetch\", ...)`, that loads `GET /api/users` (array of `{ id, name }`) and rejects for non-OK responses.\n\nExport `usersSlice` (`name: \"users\"`, initial `{ items: [], status: \"idle\", error: null }`) that handles the thunk's `pending`, `fulfilled` and `rejected` actions in `extraReducers` (status `loading` / `succeeded` / `failed`; on failure store the message `Could not load users`).\n\n`UserList` dispatches `fetchUsers()` on mount and shows `Loading...`, the names as `<li>`s, or `<p role=\"alert\">{error}</p>`.",
      requirements: ["Thunk fetches and rejects on HTTP errors", "Slice tracks status via extraReducers", "Component dispatches on mount"],
      hints: [
        "createAsyncThunk(\"users/fetch\", async () => { const res = await fetch(...); if (!res.ok) throw new Error(); return res.json(); })",
        "extraReducers: (builder) => { builder.addCase(fetchUsers.pending, (state) => { ... }) ... }",
        "useEffect(() => { dispatch(fetchUsers()); }, [dispatch]) — type dispatch as the store's dispatch so thunks are allowed.",
      ],
      starterCode: `import { useEffect, useState } from "react";\nimport { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\ninterface User {\n  id: number;\n  name: string;\n}\n\nexport const fetchUsers = createAsyncThunk("users/fetch", async (): Promise<User[]> => {\n  return [];\n});\n\nexport const usersSlice = createSlice({\n  name: "users",\n  initialState: { items: [] as User[], status: "idle" as "idle" | "loading" | "succeeded" | "failed", error: null as string | null },\n  reducers: {},\n});\n\nexport function UserList() {\n  return null;\n}\n\n${app("UserList", "{ users: usersSlice.reducer }")}`,
      solutionCode: `import { useEffect, useState } from "react";\nimport { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\ninterface User {\n  id: number;\n  name: string;\n}\n\nexport const fetchUsers = createAsyncThunk("users/fetch", async (): Promise<User[]> => {\n  const res = await fetch("/api/users");\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n});\n\nexport const usersSlice = createSlice({\n  name: "users",\n  initialState: { items: [] as User[], status: "idle" as "idle" | "loading" | "succeeded" | "failed", error: null as string | null },\n  reducers: {},\n  extraReducers: (builder) => {\n    builder\n      .addCase(fetchUsers.pending, (state) => {\n        state.status = "loading";\n        state.error = null;\n      })\n      .addCase(fetchUsers.fulfilled, (state, action) => {\n        state.status = "succeeded";\n        state.items = action.payload;\n      })\n      .addCase(fetchUsers.rejected, (state) => {\n        state.status = "failed";\n        state.error = "Could not load users";\n      });\n  },\n});\n\nexport function UserList() {\n  const dispatch = useDispatch<AppDispatch>();\n  const { items, status, error } = useSelector((state: RootState) => state.users);\n\n  useEffect(() => {\n    dispatch(fetchUsers());\n  }, [dispatch]);\n\n  if (status === "loading" || status === "idle") return <p>Loading...</p>;\n  if (status === "failed") return <p role="alert">{error}</p>;\n  return (\n    <ul>\n      {items.map((u) => (\n        <li key={u.id}>{u.name}</li>\n      ))}\n    </ul>\n  );\n}\n\ntype AppDispatch = ReturnType<typeof makeStore>["dispatch"];\n\n${app("UserList", "{ users: usersSlice.reducer }")}`,
      explanation: "createAsyncThunk turns one async function into three actions (pending/fulfilled/rejected), and extraReducers lets the slice respond to them. Components just dispatch the thunk and select the status.",
      mockApi: [{ url: "/api/users", delayMs: 20, response: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] }],
      tests: [
        test("loads users", `renderComponent();\nexpectText("Loading...");\nawait waitFor(() => expectText("Bob"));\nassertEqual(screen.getAllByRole("listitem").length, 2);`),
        hidden("handles failure", `mockApi.setRoutes([{ url: "/api/users", status: 500, response: {} }]);\nrenderComponent();\nawait waitFor(() => screen.getByRole("alert"));\nexpectText("Could not load users");`),
        hidden("thunk lifecycle in the store", `const store = userExports.makeStore();\nconst promise = store.dispatch(userExports.fetchUsers());\nassertEqual(store.getState().users.status, "loading");\nawait promise;\nassertEqual(store.getState().users.status, "succeeded");\nassertEqual(store.getState().users.items.map((u) => u.name), ["Alice", "Bob"]);`),
      ],
    },
    {
      slug: "redux-entity-adapter",
      title: "Normalized State With createEntityAdapter",
      difficulty: "HARD",
      tags: ["redux", "createEntityAdapter", "normalization"],
      estimatedMinutes: 30,
      description:
        "Storing lists as `{ ids, entities }` makes lookups and updates by id cheap. Use `createEntityAdapter` for books `{ id, title }`:\n\n- `booksAdapter` sorts books by title (`sortComparer`)\n- export `booksSlice` (`name: \"books\"`) with `bookAdded` → `addOne`, `bookRenamed({ id, title })` → `updateOne`, `bookRemoved(id)` → `removeOne`\n- export `selectAllBooks` from the adapter's selectors (bound to `state.books`)\n\n`Library` has inputs/buttons provided; render `selectAllBooks` as `<li>`s.",
      requirements: ["Normalized { ids, entities } state", "Sorted by title", "Add/rename/remove via adapter methods"],
      hints: [
        "const booksAdapter = createEntityAdapter<Book>({ sortComparer: (a, b) => a.title.localeCompare(b.title) });",
        "reducers: { bookAdded: booksAdapter.addOne, bookRemoved: booksAdapter.removeOne, bookRenamed(state, action) { booksAdapter.updateOne(state, { id, changes: { title } }) } }",
        "export const { selectAll: selectAllBooks } = booksAdapter.getSelectors((state: RootState) => state.books);",
      ],
      starterCode: `import { useState } from "react";\nimport { configureStore, createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\ninterface Book {\n  id: number;\n  title: string;\n}\n\nexport const booksSlice = createSlice({\n  name: "books",\n  initialState: { ids: [] as number[], entities: {} as Record<number, Book> },\n  reducers: {},\n});\n\nexport const selectAllBooks = (state: RootState): Book[] => [];\n\nlet nextId = 1;\n\nexport function Library() {\n  const dispatch = useDispatch();\n  const [title, setTitle] = useState("");\n  return (\n    <div>\n      <label>\n        Title <input value={title} onChange={(e) => setTitle(e.target.value)} />\n      </label>\n      <button onClick={() => { dispatch(booksSlice.actions.bookAdded({ id: nextId++, title })); setTitle(""); }}>Add book</button>\n      <ul></ul>\n    </div>\n  );\n}\n\n${app("Library", "{ books: booksSlice.reducer }")}`,
      solutionCode: `import { useState } from "react";\nimport { configureStore, createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";\nimport { Provider, useDispatch, useSelector } from "react-redux";\n\ninterface Book {\n  id: number;\n  title: string;\n}\n\nconst booksAdapter = createEntityAdapter<Book>({\n  sortComparer: (a, b) => a.title.localeCompare(b.title),\n});\n\nexport const booksSlice = createSlice({\n  name: "books",\n  initialState: booksAdapter.getInitialState(),\n  reducers: {\n    bookAdded: booksAdapter.addOne,\n    bookRemoved: booksAdapter.removeOne,\n    bookRenamed(state, action: PayloadAction<{ id: number; title: string }>) {\n      booksAdapter.updateOne(state, { id: action.payload.id, changes: { title: action.payload.title } });\n    },\n  },\n});\n\nexport const { selectAll: selectAllBooks } = booksAdapter.getSelectors((state: RootState) => state.books);\n\nlet nextId = 1;\n\nexport function Library() {\n  const dispatch = useDispatch();\n  const books = useSelector(selectAllBooks);\n  const [title, setTitle] = useState("");\n  return (\n    <div>\n      <label>\n        Title <input value={title} onChange={(e) => setTitle(e.target.value)} />\n      </label>\n      <button onClick={() => { dispatch(booksSlice.actions.bookAdded({ id: nextId++, title })); setTitle(""); }}>Add book</button>\n      <ul>\n        {books.map((b) => (\n          <li key={b.id}>{b.title}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\n${app("Library", "{ books: booksSlice.reducer }")}`,
      explanation: "An entity adapter gives you normalized state plus ready-made CRUD reducers and selectors. Sorting happens once, in the adapter, instead of in every component.",
      tests: [
        test("adds books sorted by title", `renderComponent();\nfor (const t of ["Zen", "Atlas", "Moby"]) {\n  await userEvent.type(screen.getByLabelText("Title"), t);\n  ${click("Add book")}\n}\nassertEqual(screen.getAllByRole("listitem").map((l) => l.textContent), ["Atlas", "Moby", "Zen"]);`),
        hidden("normalized state and updates", `const { makeStore, booksSlice, selectAllBooks } = userExports;\nconst store = makeStore();\nconst { bookAdded, bookRenamed, bookRemoved } = booksSlice.actions;\nstore.dispatch(bookAdded({ id: 10, title: "B" }));\nstore.dispatch(bookAdded({ id: 11, title: "C" }));\nassertEqual(store.getState().books.entities[10], { id: 10, title: "B" });\nstore.dispatch(bookRenamed({ id: 11, title: "A" }));\nassertEqual(selectAllBooks(store.getState()).map((b) => b.id), [11, 10]);\nstore.dispatch(bookRemoved(10));\nassertEqual(store.getState().books.ids, [11]);`),
      ],
    },
  ],
};
