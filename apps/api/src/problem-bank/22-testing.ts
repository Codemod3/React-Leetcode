import { hidden, test, type CategoryBank } from "./types.js";

/**
 * Testing problems are graded by mutation testing: the learner's default export is an async
 * test function. It must pass against the correct implementation and fail against each mutant.
 * `impls` is JS source defining the components (Correct + mutants) inside the test code.
 */
const HARNESS = `const kit = (C) => ({ Component: C, render, screen, fireEvent, userEvent, waitFor, within, expect, fn, renderHook, act, mockApi });
async function runLearnerTest(C) {
  mockApi.reset(); // a learner test may change routes; never leak that into the next run
  try {
    await Component(kit(C));
    return null;
  } catch (e) {
    return e;
  } finally {
    cleanup();
  }
}`;

export const passesCorrect = (impls: string) =>
  `${impls}\n${HARNESS}\nconst err = await runLearnerTest(Correct);\nassert(!err, "Your test failed against a correct implementation: " + (err && err.message));`;

export const catchesMutants = (impls: string, mutants: [string, string][]) =>
  `${impls}\n${HARNESS}\n` +
  mutants
    .map(
      ([name, description]) =>
        `assert(await runLearnerTest(${name}), ${JSON.stringify(`Your test passed against a broken version (${description}) — it should have failed.`)});`
    )
    .join("\n");

export const NOTE =
  "\n\nYour default export is a test. It receives `{ Component, render, screen, fireEvent, userEvent, waitFor, within, expect, fn }` — `expect` is Jest's, with jest-dom matchers like `toBeInTheDocument()` and `toHaveTextContent()`. Render and test the **`Component` you're given**: the grader runs your test against a correct version and against several subtly broken ones, and your test must pass the first and fail the rest.";

export const testStarter = (reference: string, signature: string) =>
  `// The component under test, for reference (the grader passes in its own copies):\n${reference
    .trim()
    .split("\n")
    .map((l) => "// " + l)
    .join("\n")}\n\nexport default async function ${signature} {\n  // Write your test here\n}\n`;

const GREETING = `function Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}`;
const COUNTER = `function Counter() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount((c) => c + 1)}>+</button>\n    </div>\n  );\n}`;

export const testing: CategoryBank = {
  category: "Testing",
  level: 22,
  type: "COMPONENT",
  prerequisites: ["useState", "Events", "Forms"],
  problems: [
    {
      slug: "testing-render-props",
      title: "Test What a Component Renders",
      difficulty: "EASY",
      tags: ["testing", "react-testing-library", "props"],
      problemType: "TEST",
      estimatedMinutes: 10,
      description: "Write a test for `Greeting`, which takes a `name` prop and renders `<h1>Hello, {name}!</h1>`." + NOTE,
      requirements: ["Passes for the correct component", "Fails if the name prop is ignored", "Fails if the greeting text is wrong"],
      hints: [
        "render(<Component name=\"Ada\" />);",
        "expect(screen.getByRole(\"heading\")).toHaveTextContent(\"Hello, Ada!\");",
        "Pick a name that a hardcoded component wouldn't happen to use.",
      ],
      starterCode: testStarter(GREETING, "testGreeting({ Component, render, screen, expect })"),
      solutionCode: `export default async function testGreeting({ Component, render, screen, expect }) {\n  render(<Component name="Ada" />);\n  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, Ada!");\n}\n`,
      explanation: "A good rendering test checks the output a user would see, for an input chosen so a broken implementation can't pass by accident.",
      tests: (() => {
        const impls = `const Correct = ({ name }) => <h1>Hello, {name}!</h1>;\nconst IgnoresName = () => <h1>Hello, World!</h1>;\nconst WrongText = ({ name }) => <h1>Hi {name}</h1>;\nconst NotAHeading = ({ name }) => <p>Hello, {name}!</p>;`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["IgnoresName", "ignores the name prop"], ["WrongText", "wrong greeting text"]])),
        ];
      })(),
    },
    {
      slug: "testing-click",
      title: "Test a Click Interaction",
      difficulty: "EASY",
      tags: ["testing", "events", "useState"],
      problemType: "TEST",
      estimatedMinutes: 10,
      description: "Write a test for `Counter`: it shows `Count: 0` and a `+` button; each click adds 1." + NOTE,
      requirements: ["Checks the initial value", "Checks the value after clicking (more than once is a good idea)"],
      hints: ["fireEvent.click(screen.getByRole(\"button\", { name: \"+\" }))", "Click twice: a version that adds 2 would pass a single-click test that only checks 'not 0'.", "expect(screen.getByText(\"Count: 2\")).toBeInTheDocument();"],
      starterCode: testStarter(COUNTER.replace("React.useState", "useState"), "testCounter({ Component, render, screen, fireEvent, expect })"),
      solutionCode: `export default async function testCounter({ Component, render, screen, fireEvent, expect }) {\n  render(<Component />);\n  expect(screen.getByText("Count: 0")).toBeInTheDocument();\n  const plus = screen.getByRole("button", { name: "+" });\n  fireEvent.click(plus);\n  fireEvent.click(plus);\n  expect(screen.getByText("Count: 2")).toBeInTheDocument();\n}\n`,
      explanation: "Interaction tests drive the component the way a user would (find the button by its role and name, click it) and then check what's visible.",
      tests: (() => {
        const impls = `const Correct = ${COUNTER.replace("function Counter", "function")};\nconst ByTwo = () => { const [c, setC] = React.useState(0); return (<div><p>Count: {c}</p><button onClick={() => setC(c + 2)}>+</button></div>); };\nconst StartsAtOne = () => { const [c, setC] = React.useState(1); return (<div><p>Count: {c}</p><button onClick={() => setC(c + 1)}>+</button></div>); };\nconst Dead = () => (<div><p>Count: 0</p><button>+</button></div>);`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["ByTwo", "adds 2 per click"], ["StartsAtOne", "starts at 1"], ["Dead", "button does nothing"]])),
        ];
      })(),
    },
    {
      slug: "testing-typing",
      title: "Test Typing Into an Input",
      difficulty: "EASY",
      tags: ["testing", "forms", "user-event"],
      problemType: "TEST",
      estimatedMinutes: 10,
      description: "Write a test for `Echo`: it has an input labelled `Message` and shows `You typed: {text}` below it, exactly as typed." + NOTE,
      requirements: ["Finds the input by its label", "Types with userEvent", "Checks the echoed text exactly"],
      hints: ["await userEvent.type(screen.getByLabelText(\"Message\"), \"Hi there\");", "Use text with mixed case so an upper-casing bug would show up."],
      starterCode: testStarter(`function Echo() {\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <label>Message <input value={text} onChange={(e) => setText(e.target.value)} /></label>\n      <p>You typed: {text}</p>\n    </div>\n  );\n}`, "testEcho({ Component, render, screen, userEvent, expect })"),
      solutionCode: `export default async function testEcho({ Component, render, screen, userEvent, expect }) {\n  render(<Component />);\n  await userEvent.type(screen.getByLabelText("Message"), "Hi there");\n  expect(screen.getByText("You typed: Hi there")).toBeInTheDocument();\n}\n`,
      explanation: "userEvent simulates real typing (keydown, input, keyup per character), which is closer to what users do than setting a value directly.",
      tests: (() => {
        const impls = `const Correct = () => { const [t, setT] = React.useState(""); return (<div><label>Message <input value={t} onChange={(e) => setT(e.target.value)} /></label><p>You typed: {t}</p></div>); };\nconst Upper = () => { const [t, setT] = React.useState(""); return (<div><label>Message <input value={t} onChange={(e) => setT(e.target.value)} /></label><p>You typed: {t.toUpperCase()}</p></div>); };\nconst Ignores = () => (<div><label>Message <input /></label><p>You typed: </p></div>);\nconst DropsLast = () => { const [t, setT] = React.useState(""); return (<div><label>Message <input value={t} onChange={(e) => setT(e.target.value)} /></label><p>You typed: {t.slice(0, -1)}</p></div>); };`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["Upper", "upper-cases the text"], ["Ignores", "never shows what was typed"], ["DropsLast", "drops the last character"]])),
        ];
      })(),
    },
    {
      slug: "testing-callback-props",
      title: "Test a Callback With a Mock Function",
      difficulty: "MEDIUM",
      tags: ["testing", "mocks", "callbacks"],
      problemType: "TEST",
      estimatedMinutes: 15,
      description:
        "Write a test for `SubscribeForm({ onSubscribe })`: it has an input labelled `Email` and a submit button `Subscribe`; submitting calls `onSubscribe(email)` **exactly once**.\n\nUse `fn()` to create a mock function and pass it as the prop." + NOTE,
      requirements: ["Uses a mock function", "Checks the argument", "Checks it's called exactly once"],
      hints: ["const onSubscribe = fn(); render(<Component onSubscribe={onSubscribe} />);", "expect(onSubscribe).toHaveBeenCalledTimes(1); expect(onSubscribe).toHaveBeenCalledWith(\"a@b.co\");"],
      starterCode: testStarter(`function SubscribeForm({ onSubscribe }) {\n  const [email, setEmail] = useState("");\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); onSubscribe(email); }}>\n      <label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} /></label>\n      <button type="submit">Subscribe</button>\n    </form>\n  );\n}`, "testSubscribe({ Component, render, screen, userEvent, expect, fn })"),
      solutionCode: `export default async function testSubscribe({ Component, render, screen, userEvent, expect, fn }) {\n  const onSubscribe = fn();\n  render(<Component onSubscribe={onSubscribe} />);\n  await userEvent.type(screen.getByLabelText("Email"), "a@b.co");\n  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));\n  expect(onSubscribe).toHaveBeenCalledTimes(1);\n  expect(onSubscribe).toHaveBeenCalledWith("a@b.co");\n}\n`,
      explanation: "Mock functions record how they were called, so you can test a component's outputs (callbacks) as precisely as its rendered UI.",
      tests: (() => {
        const form = (onSubmit: string) => `({ onSubscribe }) => { const [e, setE] = React.useState(""); return (<form onSubmit={(ev) => { ev.preventDefault(); ${onSubmit} }}><label>Email <input value={e} onChange={(x) => setE(x.target.value)} /></label><button type="submit">Subscribe</button></form>); }`;
        const impls = `const Correct = ${form("onSubscribe(e);")};\nconst Never = ${form("")};\nconst Empty = ${form('onSubscribe("");')};\nconst Twice = ${form("onSubscribe(e); onSubscribe(e);")};`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["Never", "never calls onSubscribe"], ["Empty", "passes an empty string"], ["Twice", "calls it twice"]])),
        ];
      })(),
    },
    {
      slug: "testing-conditional",
      title: "Test Both Branches of a Toggle",
      difficulty: "EASY",
      tags: ["testing", "conditional-rendering"],
      problemType: "TEST",
      estimatedMinutes: 10,
      description:
        "Write a test for `Disclosure`: a button `Show details` reveals `<p>Secret details</p>` and changes to `Hide details`; clicking again hides the text.\n\nCheck absence with `queryBy...` (it returns `null` instead of throwing)." + NOTE,
      requirements: ["Checks it's hidden first", "Checks it appears", "Checks it hides again"],
      hints: ["expect(screen.queryByText(\"Secret details\")).not.toBeInTheDocument();", "Test the full cycle: hidden → shown → hidden."],
      starterCode: testStarter(`function Disclosure() {\n  const [open, setOpen] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setOpen(!open)}>{open ? "Hide details" : "Show details"}</button>\n      {open && <p>Secret details</p>}\n    </div>\n  );\n}`, "testDisclosure({ Component, render, screen, fireEvent, expect })"),
      solutionCode: `export default async function testDisclosure({ Component, render, screen, fireEvent, expect }) {\n  render(<Component />);\n  expect(screen.queryByText("Secret details")).not.toBeInTheDocument();\n  fireEvent.click(screen.getByRole("button", { name: "Show details" }));\n  expect(screen.getByText("Secret details")).toBeInTheDocument();\n  fireEvent.click(screen.getByRole("button", { name: "Hide details" }));\n  expect(screen.queryByText("Secret details")).not.toBeInTheDocument();\n}\n`,
      explanation: "getBy* throws when nothing matches, which is right for 'this must exist'. queryBy* returns null, which is right for 'this must not exist'.",
      tests: (() => {
        const impls = `const Correct = () => { const [o, setO] = React.useState(false); return (<div><button onClick={() => setO(!o)}>{o ? "Hide details" : "Show details"}</button>{o && <p>Secret details</p>}</div>); };\nconst AlwaysShown = () => { const [o, setO] = React.useState(false); return (<div><button onClick={() => setO(!o)}>{o ? "Hide details" : "Show details"}</button><p>Secret details</p></div>); };\nconst OneWay = () => { const [o, setO] = React.useState(false); return (<div><button onClick={() => setO(true)}>{o ? "Hide details" : "Show details"}</button>{o && <p>Secret details</p>}</div>); };`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["AlwaysShown", "details visible from the start"], ["OneWay", "can't hide again"]])),
        ];
      })(),
    },
    {
      slug: "testing-async-ui",
      title: "Test Asynchronous UI",
      difficulty: "MEDIUM",
      tags: ["testing", "async", "api"],
      problemType: "TEST",
      type: "API",
      estimatedMinutes: 15,
      description:
        "Write a test for `UserList`, which fetches `GET /api/users` (mocked to return `Alice` and `Bob`), shows `Loading...` while waiting, then lists the names and removes the loading text.\n\nUse `await screen.findByText(...)` (or `waitFor`) to wait for the data." + NOTE,
      requirements: ["Checks the loading state", "Waits for the data", "Checks loading disappears"],
      hints: ["expect(screen.getByText(\"Loading...\")).toBeInTheDocument();", "expect(await screen.findByText(\"Bob\")).toBeInTheDocument();", "Then: expect(screen.queryByText(\"Loading...\")).not.toBeInTheDocument();"],
      starterCode: testStarter(`function UserList() {\n  const [users, setUsers] = useState(null);\n  useEffect(() => { fetch("/api/users").then((r) => r.json()).then(setUsers); }, []);\n  if (!users) return <p>Loading...</p>;\n  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;\n}`, "testUserList({ Component, render, screen, expect })"),
      solutionCode: `export default async function testUserList({ Component, render, screen, expect }) {\n  render(<Component />);\n  expect(screen.getByText("Loading...")).toBeInTheDocument();\n  expect(await screen.findByText("Alice")).toBeInTheDocument();\n  expect(screen.getByText("Bob")).toBeInTheDocument();\n  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();\n}\n`,
      explanation: "findBy* queries retry until the element appears (or time out), which is how tests wait for async UI without arbitrary sleeps.",
      mockApi: [{ url: "/api/users", delayMs: 20, response: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] }],
      tests: (() => {
        const impls = `const useUsers = () => { const [u, setU] = React.useState(null); React.useEffect(() => { fetch("/api/users").then((r) => r.json()).then(setU); }, []); return u; };\nconst Correct = () => { const u = useUsers(); if (!u) return <p>Loading...</p>; return <ul>{u.map((x) => <li key={x.id}>{x.name}</li>)}</ul>; };\nconst StuckLoading = () => <p>Loading...</p>;\nconst LoadingStays = () => { const u = useUsers(); return (<div><p>Loading...</p>{u && <ul>{u.map((x) => <li key={x.id}>{x.name}</li>)}</ul>}</div>); };\nconst OnlyFirst = () => { const u = useUsers(); if (!u) return <p>Loading...</p>; return <ul><li>{u[0].name}</li></ul>; };`;
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["StuckLoading", "never finishes loading"], ["LoadingStays", "loading text never disappears"], ["OnlyFirst", "only shows the first user"]])),
        ];
      })(),
    },
    {
      slug: "testing-accessible-queries",
      title: "Write Tests That Catch Accessibility Bugs",
      difficulty: "MEDIUM",
      tags: ["testing", "accessibility", "queries"],
      problemType: "TEST",
      estimatedMinutes: 15,
      description:
        "Write a test for `LoginForm({ onLogin })`: inputs labelled `Email` and `Password`, and a `Log in` button that calls `onLogin({ email, password })`.\n\nQuery the way assistive technology does — `getByLabelText` and `getByRole` — so the test fails if the labels aren't connected or the button isn't a real button." + NOTE,
      requirements: ["Finds fields by label and the button by role", "Checks onLogin's argument"],
      hints: ["getByPlaceholderText or getByText would pass for inaccessible markup — avoid them here.", "expect(onLogin).toHaveBeenCalledWith({ email: \"a@b.co\", password: \"pw\" });"],
      starterCode: testStarter(`function LoginForm({ onLogin }) {\n  const [email, setEmail] = useState("");\n  const [password, setPassword] = useState("");\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); onLogin({ email, password }); }}>\n      <label htmlFor="email">Email</label>\n      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n      <label htmlFor="password">Password</label>\n      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />\n      <button type="submit">Log in</button>\n    </form>\n  );\n}`, "testLogin({ Component, render, screen, userEvent, expect, fn })"),
      solutionCode: `export default async function testLogin({ Component, render, screen, userEvent, expect, fn }) {\n  const onLogin = fn();\n  render(<Component onLogin={onLogin} />);\n  await userEvent.type(screen.getByLabelText("Email"), "a@b.co");\n  await userEvent.type(screen.getByLabelText("Password"), "pw");\n  await userEvent.click(screen.getByRole("button", { name: "Log in" }));\n  expect(onLogin).toHaveBeenCalledWith({ email: "a@b.co", password: "pw" });\n}\n`,
      explanation: "Role and label queries only find elements that assistive technology can find too, so the same test that checks behaviour also guards accessibility.",
      tests: (() => {
        const field = (label: string, id: string, type = "text", connect = true) =>
          `<label${connect ? ` htmlFor="${id}"` : ""}>${label}</label><input id="${id}" type="${type}" placeholder="${label}" value={v.${id}} onChange={(e) => setV({ ...v, ${id}: e.target.value })} />`;
        const form = (fields: string, button: string) =>
          `({ onLogin }) => { const [v, setV] = React.useState({ email: "", password: "" }); const submit = () => onLogin({ email: v.email, password: v.password }); return (<form onSubmit={(e) => { e.preventDefault(); submit(); }}>${fields}${button}</form>); }`;
        const goodFields = field("Email", "email") + field("Password", "password", "password");
        const impls = [
          `const Correct = ${form(goodFields, `<button type="submit">Log in</button>`)};`,
          `const UnlabelledInputs = ${form(field("Email", "email", "text", false) + field("Password", "password", "password", false), `<button type="submit">Log in</button>`)};`,
          `const DivButton = ${form(goodFields, `<div onClick={submit}>Log in</div>`)};`,
          `const SwappedValues = ({ onLogin }) => { const [v, setV] = React.useState({ email: "", password: "" }); return (<form onSubmit={(e) => { e.preventDefault(); onLogin({ email: v.password, password: v.email }); }}>${goodFields}<button type="submit">Log in</button></form>); };`,
        ].join("\n");
        return [
          test("passes against the correct component", passesCorrect(impls)),
          hidden("catches broken versions", catchesMutants(impls, [["UnlabelledInputs", "labels not connected to inputs"], ["DivButton", "a clickable div instead of a button"], ["SwappedValues", "email and password swapped"]])),
        ];
      })(),
    },
  ],
};
