import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;

export const context: CategoryBank = {
  category: "Context",
  level: 17,
  type: "STATE",
  prerequisites: ["Props", "useState", "Component Communication"],
  problems: [
    {
      slug: "context-create-consume",
      title: "Create and Consume a Context",
      difficulty: "EASY",
      tags: ["context", "useContext"],
      estimatedMinutes: 10,
      description:
        "Context passes data deep into the tree without threading props through every level.\n\n1. Create and export `ThemeContext` with the default value `\"light\"`.\n2. Make the exported `ThemedButton` read the theme with `useContext` and render `<button className={\"btn-\" + theme}>Save</button>`.\n3. Make `App` provide `\"dark\"` around a `Toolbar` that renders `ThemedButton` — without passing any props.",
      requirements: ["ThemeContext defaults to 'light'", "ThemedButton reads the context", "App provides 'dark'"],
      hints: ["export const ThemeContext = createContext(\"light\");", "<ThemeContext.Provider value=\"dark\">...</ThemeContext.Provider>", "const theme = useContext(ThemeContext);"],
      starterCode: `import { createContext, useContext } from "react";\n\n// export const ThemeContext = ...\n\nexport function ThemedButton() {\n  return null;\n}\n\nfunction Toolbar() {\n  return <ThemedButton />;\n}\n\nfunction App() {\n  return <Toolbar />;\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext } from "react";\n\nexport const ThemeContext = createContext("light");\n\nexport function ThemedButton() {\n  const theme = useContext(ThemeContext);\n  return <button className={"btn-" + theme}>Save</button>;\n}\n\nfunction Toolbar() {\n  return <ThemedButton />;\n}\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <Toolbar />\n    </ThemeContext.Provider>\n  );\n}\n\nexport default App;\n`,
      explanation: "useContext reads the value from the nearest Provider above the component. Without a Provider, it falls back to the default passed to createContext.",
      tests: [
        test("App provides dark", `renderComponent();\nassertEqual(screen.getByRole("button", { name: "Save" }).className, "btn-dark");`),
        hidden("default value without a provider", `render(<userExports.ThemedButton />);\nassertEqual(screen.getByRole("button").className, "btn-light");`),
        hidden("any provider value works", `const { ThemeContext, ThemedButton } = userExports;\nrender(<ThemeContext.Provider value="neon"><div><ThemedButton /></div></ThemeContext.Provider>);\nassertEqual(screen.getByRole("button").className, "btn-neon");`),
      ],
    },
    {
      slug: "context-theme-toggle",
      title: "Toggle a Theme Through Context",
      difficulty: "EASY",
      tags: ["context", "useState"],
      estimatedMinutes: 15,
      description:
        "Make the context value include both the state **and** a way to change it.\n\n- Export `ThemeProvider({ children })`: keeps `theme` (`\"light\"` initially) in state and provides `{ theme, toggleTheme }`.\n- `ThemeLabel` (deep in the tree) renders `<p>Current theme: {theme}</p>`.\n- `ThemeToggle` renders a button `Toggle theme` that calls `toggleTheme`.\n\n`App` (provided) renders both inside the provider, in separate branches.",
      requirements: ["Provider holds the state", "Consumers read and change it without props"],
      hints: ["The context default can be { theme: \"light\", toggleTheme: () => {} }.", "<ThemeContext.Provider value={{ theme, toggleTheme }}>"],
      starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\nconst ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });\n\nexport function ThemeProvider({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n\nfunction ThemeLabel() {\n  return null;\n}\n\nfunction ThemeToggle() {\n  return null;\n}\n\n// Provided\nfunction App() {\n  return (\n    <ThemeProvider>\n      <header>\n        <ThemeToggle />\n      </header>\n      <main>\n        <section>\n          <ThemeLabel />\n        </section>\n      </main>\n    </ThemeProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\nconst ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });\n\nexport function ThemeProvider({ children }: { children: ReactNode }) {\n  const [theme, setTheme] = useState("light");\n  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));\n  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;\n}\n\nfunction ThemeLabel() {\n  const { theme } = useContext(ThemeContext);\n  return <p>Current theme: {theme}</p>;\n}\n\nfunction ThemeToggle() {\n  const { toggleTheme } = useContext(ThemeContext);\n  return <button onClick={toggleTheme}>Toggle theme</button>;\n}\n\n// Provided\nfunction App() {\n  return (\n    <ThemeProvider>\n      <header>\n        <ThemeToggle />\n      </header>\n      <main>\n        <section>\n          <ThemeLabel />\n        </section>\n      </main>\n    </ThemeProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "A provider component that owns state and exposes it with an updater is the standard 'global state with Context' pattern. Any descendant can read or change it.",
      tests: [
        test("toggles", `renderComponent();\nexpectText("Current theme: light");\n${click("Toggle theme")}\nexpectText("Current theme: dark");`),
        hidden("toggles back", `renderComponent();\n${click("Toggle theme")}\n${click("Toggle theme")}\nexpectText("Current theme: light");`),
      ],
    },
    {
      slug: "context-avoid-prop-drilling",
      title: "Replace Prop Drilling With Context",
      difficulty: "MEDIUM",
      tags: ["context", "refactoring", "prop-drilling"],
      problemType: "REFACTOR",
      estimatedMinutes: 15,
      description:
        "`App` passes `user` and `onLogout` through `Layout` and `Sidebar`, which don't use them — only `UserMenu` does. Refactor to an exported `UserContext` (value `{ user, logout }`) so the in-between components take **no props**.\n\nBehaviour must stay the same: `UserMenu` shows `Signed in as {name}` and a `Log out` button; after logging out it shows `Not signed in`. Export `UserContext`, `Layout`, `Sidebar`, and `UserMenu`.",
      requirements: ["Same behaviour", "Layout and Sidebar no longer receive user props", "UserMenu reads from context"],
      hints: ["Create UserContext and provide { user, logout } in App.", "Layout and Sidebar just render their children / UserMenu."],
      starterCode: `import { createContext, useContext, useState } from "react";\n\ninterface User {\n  name: string;\n}\n\nexport function UserMenu({ user, onLogout }: { user: User | null; onLogout: () => void }) {\n  if (!user) return <p>Not signed in</p>;\n  return (\n    <div>\n      <p>Signed in as {user.name}</p>\n      <button onClick={onLogout}>Log out</button>\n    </div>\n  );\n}\n\nexport function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {\n  return (\n    <aside>\n      <UserMenu user={user} onLogout={onLogout} />\n    </aside>\n  );\n}\n\nexport function Layout({ user, onLogout }: { user: User | null; onLogout: () => void }) {\n  return (\n    <div>\n      <Sidebar user={user} onLogout={onLogout} />\n    </div>\n  );\n}\n\nfunction App() {\n  const [user, setUser] = useState<User | null>({ name: "Ada" });\n  return <Layout user={user} onLogout={() => setUser(null)} />;\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useState } from "react";\n\ninterface User {\n  name: string;\n}\n\nexport const UserContext = createContext<{ user: User | null; logout: () => void }>({ user: null, logout: () => {} });\n\nexport function UserMenu() {\n  const { user, logout } = useContext(UserContext);\n  if (!user) return <p>Not signed in</p>;\n  return (\n    <div>\n      <p>Signed in as {user.name}</p>\n      <button onClick={logout}>Log out</button>\n    </div>\n  );\n}\n\nexport function Sidebar() {\n  return (\n    <aside>\n      <UserMenu />\n    </aside>\n  );\n}\n\nexport function Layout() {\n  return (\n    <div>\n      <Sidebar />\n    </div>\n  );\n}\n\nfunction App() {\n  const [user, setUser] = useState<User | null>({ name: "Ada" });\n  return (\n    <UserContext.Provider value={{ user, logout: () => setUser(null) }}>\n      <Layout />\n    </UserContext.Provider>\n  );\n}\n\nexport default App;\n`,
      explanation: "Prop drilling forces components to know about data they only pass along. Context lets the producer and the consumer connect directly, so the middle layers stay simple.",
      tests: [
        test("signs in and out", `renderComponent();\nexpectText("Signed in as Ada");\n${click("Log out")}\nexpectText("Not signed in");`),
        hidden("Layout gets the user from context, not props", `const { UserContext, Layout } = userExports;\nassert(UserContext, "Export your UserContext");\nconst logout = mockFn();\nrender(<UserContext.Provider value={{ user: { name: "Zed" }, logout }}><Layout /></UserContext.Provider>);\nexpectText("Signed in as Zed");\n${click("Log out")}\nassertEqual(logout.calls.length, 1);`),
      ],
    },
    {
      slug: "context-custom-hook-guard",
      title: "A Context Hook With a Helpful Error",
      difficulty: "MEDIUM",
      tags: ["context", "custom-hooks", "error-handling"],
      estimatedMinutes: 15,
      description:
        "Write the auth context the way libraries do:\n\n- `AuthContext` is created with `null` as the default.\n- Export `AuthProvider({ children })`, which keeps `user` (`null` initially) and provides `{ user, login(name), logout() }`.\n- Export `useAuth()`, which returns the context value — and **throws** `new Error(\"useAuth must be used within an AuthProvider\")` if there is no provider.\n- `App` (default) renders an `AuthStatus` inside the provider: when logged out, a `Log in as Kim` button; when logged in, `Hello, Kim` and a `Log out` button.",
      requirements: ["useAuth works inside the provider", "useAuth throws a clear error outside it", "login/logout work"],
      hints: ["const ctx = useContext(AuthContext); if (!ctx) throw new Error(...);", "Using null as the default is what makes the missing provider detectable."],
      starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface AuthValue {\n  user: string | null;\n  login: (name: string) => void;\n  logout: () => void;\n}\n\nconst AuthContext = createContext<AuthValue | null>(null);\n\nexport function AuthProvider({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n\nexport function useAuth(): AuthValue {\n  throw new Error("not implemented");\n}\n\nfunction AuthStatus() {\n  return null;\n}\n\nfunction App() {\n  return (\n    <AuthProvider>\n      <AuthStatus />\n    </AuthProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\ninterface AuthValue {\n  user: string | null;\n  login: (name: string) => void;\n  logout: () => void;\n}\n\nconst AuthContext = createContext<AuthValue | null>(null);\n\nexport function AuthProvider({ children }: { children: ReactNode }) {\n  const [user, setUser] = useState<string | null>(null);\n  return (\n    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>{children}</AuthContext.Provider>\n  );\n}\n\nexport function useAuth(): AuthValue {\n  const ctx = useContext(AuthContext);\n  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");\n  return ctx;\n}\n\nfunction AuthStatus() {\n  const { user, login, logout } = useAuth();\n  if (!user) return <button onClick={() => login("Kim")}>Log in as Kim</button>;\n  return (\n    <div>\n      <p>Hello, {user}</p>\n      <button onClick={logout}>Log out</button>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <AuthProvider>\n      <AuthStatus />\n    </AuthProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "A custom hook hides the context object and turns a confusing `Cannot read properties of null` into an error that says exactly what's wrong. TypeScript also knows the returned value isn't null.",
      tests: [
        test("logs in and out", `renderComponent();\n${click("Log in as Kim")}\nexpectText("Hello, Kim");\n${click("Log out")}\nscreen.getByRole("button", { name: "Log in as Kim" });`),
        hidden("throws outside the provider", `let message = null;\ntry {\n  renderHook(() => userExports.useAuth());\n} catch (e) {\n  message = e.message;\n}\nassertEqual(message, "useAuth must be used within an AuthProvider");`),
        hidden("works inside the provider", `const { result } = renderHook(() => userExports.useAuth(), { wrapper: userExports.AuthProvider });\nassertEqual(result.current.user, null);\nact(() => result.current.login("Lee"));\nassertEqual(result.current.user, "Lee");`),
      ],
    },
    {
      slug: "context-cart",
      title: "Shopping Cart Context",
      difficulty: "MEDIUM",
      tags: ["context", "useState", "arrays"],
      estimatedMinutes: 20,
      description:
        "Export a `CartProvider` that provides `{ items, addItem(product), removeItem(id), total }` where `items` is `{ id, name, price, quantity }[]`:\n\n- adding a product that's already in the cart increases its quantity\n- `total` is the sum of price × quantity (derived, not stored)\n\nThe provided `ProductList` and `CartSummary` are siblings; complete them with a `useCart()` hook:\n\n- ProductList: a button `Add {name}` per product\n- CartSummary: one `<li>` per item as `{name} × {quantity}` with a `Remove {name}` button, then `<p>Total: ${total}</p>` (two decimals)",
      requirements: ["Siblings share the cart via context", "Adding twice increments quantity", "Remove deletes the line", "Total is correct"],
      hints: ["addItem: if it exists, map and bump quantity; else append with quantity 1.", "const total = items.reduce((s, i) => s + i.price * i.quantity, 0);"],
      starterCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Tea", price: 4 },\n  { id: 2, name: "Mug", price: 9.5 },\n];\n\nexport function CartProvider({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n\nfunction useCart() {\n  // return the context value\n}\n\nfunction ProductList() {\n  return null;\n}\n\nfunction CartSummary() {\n  return null;\n}\n\nfunction App() {\n  return (\n    <CartProvider>\n      <ProductList />\n      <CartSummary />\n    </CartProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useState, type ReactNode } from "react";\n\nconst PRODUCTS = [\n  { id: 1, name: "Tea", price: 4 },\n  { id: 2, name: "Mug", price: 9.5 },\n];\n\ninterface Product {\n  id: number;\n  name: string;\n  price: number;\n}\ninterface CartItem extends Product {\n  quantity: number;\n}\ninterface CartValue {\n  items: CartItem[];\n  addItem: (p: Product) => void;\n  removeItem: (id: number) => void;\n  total: number;\n}\n\nconst CartContext = createContext<CartValue | null>(null);\n\nexport function CartProvider({ children }: { children: ReactNode }) {\n  const [items, setItems] = useState<CartItem[]>([]);\n\n  function addItem(product: Product) {\n    setItems((prev) =>\n      prev.some((i) => i.id === product.id)\n        ? prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))\n        : [...prev, { ...product, quantity: 1 }]\n    );\n  }\n\n  function removeItem(id: number) {\n    setItems((prev) => prev.filter((i) => i.id !== id));\n  }\n\n  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);\n\n  return <CartContext.Provider value={{ items, addItem, removeItem, total }}>{children}</CartContext.Provider>;\n}\n\nfunction useCart() {\n  const ctx = useContext(CartContext);\n  if (!ctx) throw new Error("useCart must be used within a CartProvider");\n  return ctx;\n}\n\nfunction ProductList() {\n  const { addItem } = useCart();\n  return (\n    <div>\n      {PRODUCTS.map((p) => (\n        <button key={p.id} onClick={() => addItem(p)}>\n          Add {p.name}\n        </button>\n      ))}\n    </div>\n  );\n}\n\nfunction CartSummary() {\n  const { items, removeItem, total } = useCart();\n  return (\n    <div>\n      <ul>\n        {items.map((i) => (\n          <li key={i.id}>\n            <span>\n              {i.name} × {i.quantity}\n            </span>\n            <button onClick={() => removeItem(i.id)}>Remove {i.name}</button>\n          </li>\n        ))}\n      </ul>\n      <p>Total: \${total.toFixed(2)}</p>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <CartProvider>\n      <ProductList />\n      <CartSummary />\n    </CartProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "The provider owns the cart; product lists, headers, and checkout pages anywhere in the tree can read or change it without being connected by props.",
      tests: [
        test("adds and totals", `renderComponent();\n${click("Add Tea")}\n${click("Add Tea")}\n${click("Add Mug")}\nexpectText("Tea × 2");\nexpectText("Mug × 1");\nexpectText("Total: $17.50");`),
        hidden("removes a line", `renderComponent();\n${click("Add Tea")}\n${click("Add Mug")}\n${click("Remove Tea")}\nassertEqual(screen.getAllByRole("listitem").length, 1);\nexpectText("Total: $9.50");`),
      ],
    },
    {
      slug: "context-nested-providers",
      title: "Nested Providers Override Values",
      difficulty: "MEDIUM",
      tags: ["context", "composition"],
      estimatedMinutes: 12,
      description:
        "Create `LanguageContext` (default `\"en\"`) and an exported `Greeting` that renders `<p>{GREETINGS[language]}</p>` using the provided `GREETINGS` map.\n\nMake `App` render a `Greeting` under an `\"en\"` provider, and inside that same provider, a `<section>` wrapped in a **second** provider with `\"es\"` that also renders a `Greeting`. The nearest provider wins, so the page shows `Hello` and `Hola`.",
      requirements: ["Two Greetings, two languages", "The inner provider overrides the outer one"],
      hints: ["Providers can be nested; useContext reads the closest one above.", "<LanguageContext.Provider value=\"es\"> ... </LanguageContext.Provider>"],
      starterCode: `import { createContext, useContext } from "react";\n\nconst GREETINGS: Record<string, string> = { en: "Hello", es: "Hola", fr: "Bonjour" };\n\nexport function Greeting() {\n  return null;\n}\n\nfunction App() {\n  return null;\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext } from "react";\n\nconst GREETINGS: Record<string, string> = { en: "Hello", es: "Hola", fr: "Bonjour" };\n\nexport const LanguageContext = createContext("en");\n\nexport function Greeting() {\n  const language = useContext(LanguageContext);\n  return <p>{GREETINGS[language]}</p>;\n}\n\nfunction App() {\n  return (\n    <LanguageContext.Provider value="en">\n      <Greeting />\n      <section>\n        <LanguageContext.Provider value="es">\n          <Greeting />\n        </LanguageContext.Provider>\n      </section>\n    </LanguageContext.Provider>\n  );\n}\n\nexport default App;\n`,
      explanation: "Context lookups walk up the tree and stop at the first matching provider, so you can override a value for one subtree (a different locale, a dark sidebar in a light app...).",
      tests: [
        test("both languages", `const { container } = renderComponent();\nassertEqual(Array.from(container.querySelectorAll("p")).map((p) => p.textContent), ["Hello", "Hola"]);`),
        hidden("inner greeting is inside the section", `const { container } = renderComponent();\nassertEqual(container.querySelector("section p")?.textContent, "Hola");\nrender(<userExports.Greeting />);\nassert(screen.getAllByText("Hello").length === 2, "Greeting without a provider should default to English");`),
      ],
    },
    {
      slug: "context-split-state-dispatch",
      title: "Split Contexts to Avoid Re-renders",
      difficulty: "HARD",
      tags: ["context", "performance", "memo"],
      problemType: "OPTIMIZE",
      estimatedMinutes: 25,
      description:
        "`CounterProvider` puts `{ count, increment }` in **one** context, so `IncrementButton` — which only needs `increment` — re-renders every time the count changes. The exported `buttonRenders` counter shows it.\n\nSplit it into two contexts: one for the count, one for the (stable) `increment` function. `IncrementButton` should then render once and never again when the count changes. Keep the visible behaviour the same.",
      requirements: ["Same behaviour", "IncrementButton doesn't re-render when count changes"],
      hints: [
        "Every component that calls useContext(X) re-renders when X's value changes.",
        "Make increment stable with useCallback (or a function using the updater form), and put it in its own context.",
        "Wrap IncrementButton in memo so its parent's re-renders don't reach it either.",
      ],
      starterCode: `import { createContext, memo, useCallback, useContext, useState, type ReactNode } from "react";\n\nexport let buttonRenders = 0;\n\nconst CounterContext = createContext({ count: 0, increment: () => {} });\n\nfunction CounterProvider({ children }: { children: ReactNode }) {\n  const [count, setCount] = useState(0);\n  const increment = () => setCount((c) => c + 1);\n  return <CounterContext.Provider value={{ count, increment }}>{children}</CounterContext.Provider>;\n}\n\nfunction CountDisplay() {\n  const { count } = useContext(CounterContext);\n  return <p>Count: {count}</p>;\n}\n\nconst IncrementButton = memo(function IncrementButton() {\n  buttonRenders++;\n  const { increment } = useContext(CounterContext);\n  return <button onClick={increment}>Increment</button>;\n});\n\nfunction App() {\n  return (\n    <CounterProvider>\n      <CountDisplay />\n      <IncrementButton />\n    </CounterProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, memo, useCallback, useContext, useState, type ReactNode } from "react";\n\nexport let buttonRenders = 0;\n\nconst CountContext = createContext(0);\nconst IncrementContext = createContext<() => void>(() => {});\n\nfunction CounterProvider({ children }: { children: ReactNode }) {\n  const [count, setCount] = useState(0);\n  const increment = useCallback(() => setCount((c) => c + 1), []);\n  return (\n    <IncrementContext.Provider value={increment}>\n      <CountContext.Provider value={count}>{children}</CountContext.Provider>\n    </IncrementContext.Provider>\n  );\n}\n\nfunction CountDisplay() {\n  const count = useContext(CountContext);\n  return <p>Count: {count}</p>;\n}\n\nconst IncrementButton = memo(function IncrementButton() {\n  buttonRenders++;\n  const increment = useContext(IncrementContext);\n  return <button onClick={increment}>Increment</button>;\n});\n\nfunction App() {\n  return (\n    <CounterProvider>\n      <CountDisplay />\n      <IncrementButton />\n    </CounterProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "A context consumer re-renders whenever the context value changes — and an inline object is a new value on every render. Separating rarely-changing values (actions) from frequently-changing ones (state) limits re-renders to the components that actually need the new data.",
      tests: [
        test("counts", `renderComponent();\n${click("Increment")}\n${click("Increment")}\nexpectText("Count: 2");`),
        hidden("button does not re-render", `renderComponent();\nconst before = userExports.buttonRenders;\n${click("Increment")}\n${click("Increment")}\n${click("Increment")}\nexpectText("Count: 3");\nassertEqual(userExports.buttonRenders - before, 0, "IncrementButton re-rendered when only the count changed");`),
      ],
    },
  ],
};
