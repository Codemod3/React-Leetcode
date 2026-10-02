import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
/** Deep-freezes a value so any mutation inside a reducer throws (runner code is strict mode). */
const FREEZE = `const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };`;

export const useReducerBank: CategoryBank = {
  category: "useReducer",
  level: 18,
  type: "STATE",
  prerequisites: ["useState", "Events", "Forms"],
  problems: [
    {
      slug: "reducer-counter",
      title: "Counter With useReducer",
      difficulty: "EASY",
      tags: ["useReducer", "reducers"],
      estimatedMinutes: 12,
      description:
        "A reducer is a pure function `(state, action) => newState` that describes every way state can change.\n\nExport `counterReducer(state, action)` handling actions `{ type: \"increment\" }`, `{ type: \"decrement\" }` and `{ type: \"reset\" }` on state `{ count: number }`. For any other action type, throw `new Error(\"Unknown action: \" + action.type)`.\n\nThen make `Counter` use `useReducer(counterReducer, { count: 0 })` with buttons `+`, `-`, `Reset` and `<p>Count: {count}</p>`.",
      requirements: ["Reducer handles three actions", "Unknown actions throw", "Component dispatches actions"],
      hints: ["A switch on action.type inside the reducer.", "const [state, dispatch] = useReducer(counterReducer, { count: 0 });", "onClick={() => dispatch({ type: \"increment\" })}"],
      starterCode: `import { useReducer } from "react";\n\ntype Action = { type: "increment" } | { type: "decrement" } | { type: "reset" };\n\nexport function counterReducer(state: { count: number }, action: Action): { count: number } {\n  // handle the actions\n  return state;\n}\n\nfunction Counter() {\n  return null;\n}\n\nexport default Counter;\n`,
      solutionCode: `import { useReducer } from "react";\n\ntype Action = { type: "increment" } | { type: "decrement" } | { type: "reset" };\n\nexport function counterReducer(state: { count: number }, action: Action): { count: number } {\n  switch (action.type) {\n    case "increment":\n      return { count: state.count + 1 };\n    case "decrement":\n      return { count: state.count - 1 };\n    case "reset":\n      return { count: 0 };\n    default:\n      throw new Error("Unknown action: " + (action as { type: string }).type);\n  }\n}\n\nfunction Counter() {\n  const [state, dispatch] = useReducer(counterReducer, { count: 0 });\n  return (\n    <div>\n      <p>Count: {state.count}</p>\n      <button onClick={() => dispatch({ type: "increment" })}>+</button>\n      <button onClick={() => dispatch({ type: "decrement" })}>-</button>\n      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>\n    </div>\n  );\n}\n\nexport default Counter;\n`,
      explanation: "With a reducer, components say *what happened* (dispatch an action) and the reducer decides *how state changes*. All transitions live in one pure, testable function.",
      tests: [
        test("buttons dispatch actions", `renderComponent();\n${click("+")}\n${click("+")}\n${click("-")}\nexpectText("Count: 1");\n${click("Reset")}\nexpectText("Count: 0");`),
        hidden("reducer is pure and strict", `const { counterReducer } = userExports;\nassertEqual(counterReducer({ count: 5 }, { type: "decrement" }), { count: 4 });\nlet message = null;\ntry { counterReducer({ count: 0 }, { type: "explode" }); } catch (e) { message = e.message; }\nassertEqual(message, "Unknown action: explode");`),
      ],
    },
    {
      slug: "reducer-payload",
      title: "Actions With a Payload",
      difficulty: "EASY",
      tags: ["useReducer", "actions"],
      estimatedMinutes: 12,
      description:
        "Export `scoreReducer` for state `{ score: number; history: number[] }` with actions:\n\n- `{ type: \"add\", amount: number }` → add the amount and push it onto `history`\n- `{ type: \"undoLast\" }` → subtract the last history entry and remove it (no-op if history is empty)\n\nThe default export `Scoreboard` shows `<p>Score: {score}</p>` and buttons `+1`, `+5`, `Undo`.",
      requirements: ["add uses the payload", "undoLast reverts the last add", "No mutation"],
      hints: ["Actions can carry data: dispatch({ type: \"add\", amount: 5 })", "history: [...state.history, action.amount] and history.slice(0, -1)"],
      starterCode: `import { useReducer } from "react";\n\ninterface State {\n  score: number;\n  history: number[];\n}\ntype Action = { type: "add"; amount: number } | { type: "undoLast" };\n\nexport function scoreReducer(state: State, action: Action): State {\n  return state;\n}\n\nfunction Scoreboard() {\n  return null;\n}\n\nexport default Scoreboard;\n`,
      solutionCode: `import { useReducer } from "react";\n\ninterface State {\n  score: number;\n  history: number[];\n}\ntype Action = { type: "add"; amount: number } | { type: "undoLast" };\n\nexport function scoreReducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "add":\n      return { score: state.score + action.amount, history: [...state.history, action.amount] };\n    case "undoLast": {\n      if (state.history.length === 0) return state;\n      const last = state.history[state.history.length - 1];\n      return { score: state.score - last, history: state.history.slice(0, -1) };\n    }\n  }\n}\n\nfunction Scoreboard() {\n  const [state, dispatch] = useReducer(scoreReducer, { score: 0, history: [] });\n  return (\n    <div>\n      <p>Score: {state.score}</p>\n      <button onClick={() => dispatch({ type: "add", amount: 1 })}>+1</button>\n      <button onClick={() => dispatch({ type: "add", amount: 5 })}>+5</button>\n      <button onClick={() => dispatch({ type: "undoLast" })}>Undo</button>\n    </div>\n  );\n}\n\nexport default Scoreboard;\n`,
      explanation: "The payload carries the data a transition needs. Returning the same state object for a no-op lets React skip the re-render.",
      tests: [
        test("adds and undoes", `renderComponent();\n${click("+5")}\n${click("+1")}\nexpectText("Score: 6");\n${click("Undo")}\nexpectText("Score: 5");`),
        hidden("pure reducer with empty-history no-op", `${FREEZE}\nconst { scoreReducer } = userExports;\nconst s = deepFreeze({ score: 3, history: [1, 2] });\nassertEqual(scoreReducer(s, { type: "add", amount: 10 }), { score: 13, history: [1, 2, 10] });\nassertEqual(scoreReducer(s, { type: "undoLast" }), { score: 1, history: [1] });\nconst empty = deepFreeze({ score: 0, history: [] });\nassert(scoreReducer(empty, { type: "undoLast" }) === empty, "undoLast with no history should return the same state");`),
      ],
      wrongSolutions: [`import { useReducer } from "react";\nexport function scoreReducer(state, action) {\n  if (action.type === "add") { state.history.push(action.amount); return { ...state, score: state.score + action.amount }; }\n  const last = state.history.pop();\n  return { ...state, score: state.score - (last ?? 0) };\n}\nfunction Scoreboard() {\n  const [s, d] = useReducer(scoreReducer, { score: 0, history: [] });\n  return (<div><p>Score: {s.score}</p><button onClick={() => d({ type: "add", amount: 1 })}>+1</button><button onClick={() => d({ type: "add", amount: 5 })}>+5</button><button onClick={() => d({ type: "undoLast" })}>Undo</button></div>);\n}\nexport default Scoreboard;\n`],
    },
    {
      slug: "reducer-todos",
      title: "Todo Reducer",
      difficulty: "MEDIUM",
      tags: ["useReducer", "arrays", "immutability"],
      estimatedMinutes: 20,
      description:
        "Export `todosReducer` for state `Todo[]` (`{ id, text, done }`) with actions `added` (`{ id, text }`), `toggled` (`{ id }`), and `deleted` (`{ id }`). Never mutate the state.\n\nThe default export `TodoApp` has an input labelled `New todo`, an `Add` button, and a list where each todo is a checkbox labelled with its text plus a `Delete {text}` button. Generate ids with a counter outside the component.",
      requirements: ["Three actions handled immutably", "UI adds, toggles, deletes"],
      hints: ["added: [...state, { id, text, done: false }]", "toggled: state.map(...)", "deleted: state.filter(...)"],
      starterCode: `import { useReducer, useState } from "react";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\ntype Action = { type: "added"; id: number; text: string } | { type: "toggled"; id: number } | { type: "deleted"; id: number };\n\nexport function todosReducer(state: Todo[], action: Action): Todo[] {\n  return state;\n}\n\nfunction TodoApp() {\n  return null;\n}\n\nexport default TodoApp;\n`,
      solutionCode: `import { useReducer, useState } from "react";\n\ninterface Todo {\n  id: number;\n  text: string;\n  done: boolean;\n}\ntype Action = { type: "added"; id: number; text: string } | { type: "toggled"; id: number } | { type: "deleted"; id: number };\n\nexport function todosReducer(state: Todo[], action: Action): Todo[] {\n  switch (action.type) {\n    case "added":\n      return [...state, { id: action.id, text: action.text, done: false }];\n    case "toggled":\n      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));\n    case "deleted":\n      return state.filter((t) => t.id !== action.id);\n  }\n}\n\nlet nextId = 1;\n\nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(todosReducer, []);\n  const [text, setText] = useState("");\n\n  return (\n    <div>\n      <label>\n        New todo <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button\n        onClick={() => {\n          if (!text.trim()) return;\n          dispatch({ type: "added", id: nextId++, text: text.trim() });\n          setText("");\n        }}\n      >\n        Add\n      </button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label>\n              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: "toggled", id: t.id })} /> {t.text}\n            </label>\n            <button onClick={() => dispatch({ type: "deleted", id: t.id })}>Delete {t.text}</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default TodoApp;\n`,
      explanation: "Moving list logic into a reducer turns three scattered setState calls into one function you can read top to bottom — and test without rendering anything.",
      tests: [
        test("adds, toggles, deletes", `renderComponent();\nawait userEvent.type(screen.getByLabelText("New todo"), "Write");\n${click("Add")}\nawait userEvent.type(screen.getByLabelText("New todo"), "Ship");\n${click("Add")}\nfireEvent.click(screen.getByRole("checkbox", { name: "Write" }));\nassert(screen.getByRole("checkbox", { name: "Write" }).checked);\n${click("Delete Ship")}\nassertEqual(screen.getAllByRole("listitem").length, 1);`),
        hidden("reducer never mutates", `${FREEZE}\nconst { todosReducer } = userExports;\nconst s = deepFreeze([{ id: 1, text: "a", done: false }, { id: 2, text: "b", done: false }]);\nassertEqual(todosReducer(s, { type: "toggled", id: 2 }), [{ id: 1, text: "a", done: false }, { id: 2, text: "b", done: true }]);\nassertEqual(todosReducer(s, { type: "deleted", id: 1 }), [{ id: 2, text: "b", done: false }]);\nassertEqual(todosReducer(s, { type: "added", id: 3, text: "c" }).length, 3);`),
      ],
      wrongSolutions: [`import { useReducer, useState } from "react";\nexport function todosReducer(state, action) {\n  if (action.type === "added") { state.push({ id: action.id, text: action.text, done: false }); return [...state]; }\n  if (action.type === "toggled") { const t = state.find((x) => x.id === action.id); t.done = !t.done; return [...state]; }\n  return state.filter((t) => t.id !== action.id);\n}\nlet n = 1;\nfunction TodoApp() {\n  const [todos, d] = useReducer(todosReducer, []);\n  const [text, setText] = useState("");\n  return (<div><label>New todo <input value={text} onChange={(e) => setText(e.target.value)} /></label><button onClick={() => { d({ type: "added", id: n++, text }); setText(""); }}>Add</button><ul>{todos.map((t) => <li key={t.id}><label><input type="checkbox" checked={t.done} onChange={() => d({ type: "toggled", id: t.id })} /> {t.text}</label><button onClick={() => d({ type: "deleted", id: t.id })}>Delete {t.text}</button></li>)}</ul></div>);\n}\nexport default TodoApp;\n`],
    },
    {
      slug: "reducer-form",
      title: "Form State With a Reducer",
      difficulty: "MEDIUM",
      tags: ["useReducer", "forms"],
      estimatedMinutes: 20,
      description:
        "Export `formReducer` for state `{ values: { name, email }, status: \"editing\" | \"submitted\" }` with actions:\n\n- `{ type: \"changed\", field, value }` — update one field\n- `{ type: \"submitted\" }` — set status to `\"submitted\"`\n- `{ type: \"reset\" }` — back to empty values and `\"editing\"`\n\n`ContactForm` (default) renders inputs labelled `Name` and `Email` and a `Send` button. After submit, replace the form with `<p>Thanks, {name}!</p>` and a `Send another` button that resets.",
      requirements: ["One generic 'changed' action for every field", "Submit and reset transitions", "UI follows the status"],
      hints: ["{ ...state, values: { ...state.values, [action.field]: action.value } }", "Render based on state.status."],
      starterCode: `import { useReducer, type FormEvent } from "react";\n\ninterface State {\n  values: { name: string; email: string };\n  status: "editing" | "submitted";\n}\ntype Action = { type: "changed"; field: "name" | "email"; value: string } | { type: "submitted" } | { type: "reset" };\n\nconst initialState: State = { values: { name: "", email: "" }, status: "editing" };\n\nexport function formReducer(state: State, action: Action): State {\n  return state;\n}\n\nfunction ContactForm() {\n  return null;\n}\n\nexport default ContactForm;\n`,
      solutionCode: `import { useReducer, type FormEvent } from "react";\n\ninterface State {\n  values: { name: string; email: string };\n  status: "editing" | "submitted";\n}\ntype Action = { type: "changed"; field: "name" | "email"; value: string } | { type: "submitted" } | { type: "reset" };\n\nconst initialState: State = { values: { name: "", email: "" }, status: "editing" };\n\nexport function formReducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "changed":\n      return { ...state, values: { ...state.values, [action.field]: action.value } };\n    case "submitted":\n      return { ...state, status: "submitted" };\n    case "reset":\n      return initialState;\n  }\n}\n\nfunction ContactForm() {\n  const [state, dispatch] = useReducer(formReducer, initialState);\n\n  if (state.status === "submitted") {\n    return (\n      <div>\n        <p>Thanks, {state.values.name}!</p>\n        <button onClick={() => dispatch({ type: "reset" })}>Send another</button>\n      </div>\n    );\n  }\n\n  function handleSubmit(event: FormEvent) {\n    event.preventDefault();\n    dispatch({ type: "submitted" });\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label>\n        Name <input value={state.values.name} onChange={(e) => dispatch({ type: "changed", field: "name", value: e.target.value })} />\n      </label>\n      <label>\n        Email <input value={state.values.email} onChange={(e) => dispatch({ type: "changed", field: "email", value: e.target.value })} />\n      </label>\n      <button type="submit">Send</button>\n    </form>\n  );\n}\n\nexport default ContactForm;\n`,
      explanation: "A form's fields and its status change together; one reducer keeps every transition consistent, and the 'changed' action scales to any number of fields.",
      tests: [
        test("submits and resets", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Name"), "Ivo");\nawait userEvent.type(screen.getByLabelText("Email"), "ivo@x.io");\n${click("Send")}\nexpectText("Thanks, Ivo!");\n${click("Send another")}\nassertEqual(screen.getByLabelText("Name").value, "");`),
        hidden("reducer transitions", `${FREEZE}\nconst { formReducer } = userExports;\nconst s = deepFreeze({ values: { name: "a", email: "b" }, status: "editing" });\nassertEqual(formReducer(s, { type: "changed", field: "email", value: "c" }), { values: { name: "a", email: "c" }, status: "editing" });\nassertEqual(formReducer(s, { type: "submitted" }).status, "submitted");\nassertEqual(formReducer(s, { type: "reset" }), { values: { name: "", email: "" }, status: "editing" });`),
      ],
    },
    {
      slug: "reducer-async-status",
      title: "Loading/Success/Error With a Reducer",
      difficulty: "MEDIUM",
      tags: ["useReducer", "api", "async"],
      type: "API",
      estimatedMinutes: 20,
      description:
        "Export `requestReducer` for state `{ status: \"idle\" | \"loading\" | \"success\" | \"error\", data, error }` with actions `started`, `succeeded` (`data`), `failed` (`error` string).\n\n`Weather` (default) has a button `Load weather`. Clicking it dispatches `started`, fetches `GET /api/weather` (returns `{ city, temp }`), then dispatches `succeeded` or `failed` (use the message `Could not load weather` for non-OK responses). Render:\n\n- loading → `<p>Loading...</p>`\n- success → `<p>{city}: {temp}°C</p>`\n- error → `<p role=\"alert\">{error}</p>`",
      requirements: ["Reducer models the request lifecycle", "UI shows one state at a time"],
      hints: ["started → { status: \"loading\", data: null, error: null }", "A status field makes 'loading and error at the same time' impossible."],
      starterCode: `import { useReducer } from "react";\n\ninterface Weather {\n  city: string;\n  temp: number;\n}\ninterface State {\n  status: "idle" | "loading" | "success" | "error";\n  data: Weather | null;\n  error: string | null;\n}\ntype Action = { type: "started" } | { type: "succeeded"; data: Weather } | { type: "failed"; error: string };\n\nexport function requestReducer(state: State, action: Action): State {\n  return state;\n}\n\nfunction WeatherWidget() {\n  return null;\n}\n\nexport default WeatherWidget;\n`,
      solutionCode: `import { useReducer } from "react";\n\ninterface Weather {\n  city: string;\n  temp: number;\n}\ninterface State {\n  status: "idle" | "loading" | "success" | "error";\n  data: Weather | null;\n  error: string | null;\n}\ntype Action = { type: "started" } | { type: "succeeded"; data: Weather } | { type: "failed"; error: string };\n\nexport function requestReducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "started":\n      return { status: "loading", data: null, error: null };\n    case "succeeded":\n      return { status: "success", data: action.data, error: null };\n    case "failed":\n      return { status: "error", data: null, error: action.error };\n  }\n}\n\nfunction WeatherWidget() {\n  const [state, dispatch] = useReducer(requestReducer, { status: "idle", data: null, error: null });\n\n  async function load() {\n    dispatch({ type: "started" });\n    try {\n      const res = await fetch("/api/weather");\n      if (!res.ok) throw new Error();\n      dispatch({ type: "succeeded", data: await res.json() });\n    } catch {\n      dispatch({ type: "failed", error: "Could not load weather" });\n    }\n  }\n\n  return (\n    <div>\n      <button onClick={load}>Load weather</button>\n      {state.status === "loading" && <p>Loading...</p>}\n      {state.status === "success" && state.data && (\n        <p>\n          {state.data.city}: {state.data.temp}°C\n        </p>\n      )}\n      {state.status === "error" && <p role="alert">{state.error}</p>}\n    </div>\n  );\n}\n\nexport default WeatherWidget;\n`,
      explanation: "One status value instead of separate loading/error booleans removes impossible combinations, and every transition is visible in the reducer.",
      mockApi: [{ url: "/api/weather", delayMs: 30, response: { city: "Oslo", temp: 4 } }],
      tests: [
        test("loads weather", `renderComponent();\n${click("Load weather")}\nexpectText("Loading...");\nawait waitFor(() => expectText("Oslo: 4°C"));`),
        hidden("shows errors", `mockApi.setRoutes([{ url: "/api/weather", status: 500, response: {} }]);\nrenderComponent();\n${click("Load weather")}\nawait waitFor(() => screen.getByRole("alert"));\nexpectText("Could not load weather");\nexpectNoText("Loading...");`),
        hidden("reducer resets data on start", `const { requestReducer } = userExports;\nassertEqual(requestReducer({ status: "error", data: null, error: "x" }, { type: "started" }), { status: "loading", data: null, error: null });`),
      ],
    },
    {
      slug: "reducer-state-machine",
      title: "A Media Player State Machine",
      difficulty: "MEDIUM",
      tags: ["useReducer", "state-machines"],
      estimatedMinutes: 20,
      description:
        "Model a media player as a state machine. Export `playerReducer(state, action)` where state is `\"stopped\" | \"playing\" | \"paused\"` and actions are `play`, `pause`, `stop`. Only these transitions are allowed — anything else leaves the state unchanged:\n\n| from | play | pause | stop |\n|---|---|---|---|\n| stopped | playing | — | — |\n| playing | — | paused | stopped |\n| paused | playing | — | stopped |\n\n`Player` (default) shows `<p>Status: {state}</p>` and buttons `Play`, `Pause`, `Stop`, each **disabled** when its action isn't allowed from the current state.",
      requirements: ["Only valid transitions change state", "Buttons disabled when their action is invalid"],
      hints: ["Encode the table as data: const TRANSITIONS = { stopped: { play: \"playing\" }, ... }", "next = TRANSITIONS[state][action.type] ?? state", "Disabled if TRANSITIONS[state][action] is undefined."],
      starterCode: `import { useReducer } from "react";\n\ntype PlayerState = "stopped" | "playing" | "paused";\ntype PlayerAction = { type: "play" } | { type: "pause" } | { type: "stop" };\n\nexport function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {\n  return state;\n}\n\nfunction Player() {\n  return null;\n}\n\nexport default Player;\n`,
      solutionCode: `import { useReducer } from "react";\n\ntype PlayerState = "stopped" | "playing" | "paused";\ntype ActionType = "play" | "pause" | "stop";\ntype PlayerAction = { type: ActionType };\n\nconst TRANSITIONS: Record<PlayerState, Partial<Record<ActionType, PlayerState>>> = {\n  stopped: { play: "playing" },\n  playing: { pause: "paused", stop: "stopped" },\n  paused: { play: "playing", stop: "stopped" },\n};\n\nexport function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {\n  return TRANSITIONS[state][action.type] ?? state;\n}\n\nfunction Player() {\n  const [state, dispatch] = useReducer(playerReducer, "stopped");\n  const can = (type: ActionType) => TRANSITIONS[state][type] !== undefined;\n\n  return (\n    <div>\n      <p>Status: {state}</p>\n      <button disabled={!can("play")} onClick={() => dispatch({ type: "play" })}>Play</button>\n      <button disabled={!can("pause")} onClick={() => dispatch({ type: "pause" })}>Pause</button>\n      <button disabled={!can("stop")} onClick={() => dispatch({ type: "stop" })}>Stop</button>\n    </div>\n  );\n}\n\nexport default Player;\n`,
      explanation: "A transition table makes the rules explicit and the reducer trivial. The same table drives the UI (which buttons are enabled), so the two can't disagree.",
      tests: [
        test("plays and pauses", `renderComponent();\nexpectText("Status: stopped");\n${click("Play")}\n${click("Pause")}\nexpectText("Status: paused");`),
        hidden("invalid transitions are ignored and disabled", `const { playerReducer } = userExports;\nassertEqual(playerReducer("stopped", { type: "pause" }), "stopped");\nassertEqual(playerReducer("stopped", { type: "stop" }), "stopped");\nassertEqual(playerReducer("paused", { type: "pause" }), "paused");\nassertEqual(playerReducer("paused", { type: "stop" }), "stopped");\nrenderComponent();\nassert(screen.getByRole("button", { name: "Pause" }).disabled && screen.getByRole("button", { name: "Stop" }).disabled);\n${click("Play")}\nassert(screen.getByRole("button", { name: "Play" }).disabled, "Play should be disabled while playing");`),
      ],
    },
    {
      slug: "reducer-with-context",
      title: "Reducer + Context Task Board",
      difficulty: "HARD",
      tags: ["useReducer", "context", "architecture"],
      estimatedMinutes: 30,
      description:
        "Scale up by combining a reducer with context: one provider owns the state, any component can dispatch.\n\n- Export `TasksProvider` that runs `useReducer(tasksReducer, [])` and provides **state** and **dispatch** through two separate contexts.\n- Export hooks `useTasks()` and `useTasksDispatch()`.\n- `AddTask`: input labelled `Task` + button `Add task` (dispatches `added`).\n- `TaskList`: an `<li>` per task with its text and a `Done` button that dispatches `removed`.\n- `TaskCount`: `<p>{n} open tasks</p>`.\n\n`App` (provided) places these in different branches.",
      requirements: ["State and dispatch in separate contexts", "Any component can read or dispatch", "Add/remove work across branches"],
      hints: [
        "const TasksContext = createContext<Task[]>([]); const TasksDispatchContext = createContext<Dispatch<Action>>(() => {});",
        "dispatch from useReducer is stable, so its context never causes re-renders.",
        "Write tasksReducer with 'added' and 'removed'.",
      ],
      starterCode: `import { createContext, useContext, useReducer, useState, type Dispatch, type ReactNode } from "react";\n\ninterface Task {\n  id: number;\n  text: string;\n}\ntype Action = { type: "added"; id: number; text: string } | { type: "removed"; id: number };\n\nexport function TasksProvider({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n\nexport function useTasks(): Task[] {\n  return [];\n}\n\nexport function useTasksDispatch(): Dispatch<Action> {\n  return () => {};\n}\n\nfunction AddTask() {\n  return null;\n}\n\nfunction TaskList() {\n  return null;\n}\n\nfunction TaskCount() {\n  return null;\n}\n\n// Provided\nfunction App() {\n  return (\n    <TasksProvider>\n      <header>\n        <TaskCount />\n      </header>\n      <main>\n        <AddTask />\n        <TaskList />\n      </main>\n    </TasksProvider>\n  );\n}\n\nexport default App;\n`,
      solutionCode: `import { createContext, useContext, useReducer, useState, type Dispatch, type ReactNode } from "react";\n\ninterface Task {\n  id: number;\n  text: string;\n}\ntype Action = { type: "added"; id: number; text: string } | { type: "removed"; id: number };\n\nfunction tasksReducer(tasks: Task[], action: Action): Task[] {\n  switch (action.type) {\n    case "added":\n      return [...tasks, { id: action.id, text: action.text }];\n    case "removed":\n      return tasks.filter((t) => t.id !== action.id);\n  }\n}\n\nconst TasksContext = createContext<Task[]>([]);\nconst TasksDispatchContext = createContext<Dispatch<Action>>(() => {});\n\nexport function TasksProvider({ children }: { children: ReactNode }) {\n  const [tasks, dispatch] = useReducer(tasksReducer, []);\n  return (\n    <TasksContext.Provider value={tasks}>\n      <TasksDispatchContext.Provider value={dispatch}>{children}</TasksDispatchContext.Provider>\n    </TasksContext.Provider>\n  );\n}\n\nexport function useTasks(): Task[] {\n  return useContext(TasksContext);\n}\n\nexport function useTasksDispatch(): Dispatch<Action> {\n  return useContext(TasksDispatchContext);\n}\n\nlet nextId = 1;\n\nfunction AddTask() {\n  const [text, setText] = useState("");\n  const dispatch = useTasksDispatch();\n  return (\n    <div>\n      <label>\n        Task <input value={text} onChange={(e) => setText(e.target.value)} />\n      </label>\n      <button\n        onClick={() => {\n          if (!text.trim()) return;\n          dispatch({ type: "added", id: nextId++, text: text.trim() });\n          setText("");\n        }}\n      >\n        Add task\n      </button>\n    </div>\n  );\n}\n\nfunction TaskList() {\n  const tasks = useTasks();\n  const dispatch = useTasksDispatch();\n  return (\n    <ul>\n      {tasks.map((t) => (\n        <li key={t.id}>\n          <span>{t.text}</span>\n          <button onClick={() => dispatch({ type: "removed", id: t.id })}>Done</button>\n        </li>\n      ))}\n    </ul>\n  );\n}\n\nfunction TaskCount() {\n  return <p>{useTasks().length} open tasks</p>;\n}\n\n// Provided\nfunction App() {\n  return (\n    <TasksProvider>\n      <header>\n        <TaskCount />\n      </header>\n      <main>\n        <AddTask />\n        <TaskList />\n      </main>\n    </TasksProvider>\n  );\n}\n\nexport default App;\n`,
      explanation: "Reducer + context is React's built-in answer to app-level state: the reducer centralizes logic, context distributes it, and splitting state from dispatch keeps 'write-only' components from re-rendering.",
      tests: [
        test("adds tasks across branches", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Task"), "Plan");\n${click("Add task")}\nawait userEvent.type(screen.getByLabelText("Task"), "Build");\n${click("Add task")}\nexpectText("2 open tasks");`),
        hidden("removes a task", `renderComponent();\nawait userEvent.type(screen.getByLabelText("Task"), "Plan");\n${click("Add task")}\n${click("Done")}\nexpectText("0 open tasks");\nassertEqual(screen.queryAllByRole("listitem").length, 0);`),
        hidden("hooks work inside the provider", `const { result } = renderHook(() => ({ tasks: userExports.useTasks(), dispatch: userExports.useTasksDispatch() }), { wrapper: userExports.TasksProvider });\nact(() => result.current.dispatch({ type: "added", id: 99, text: "Hook task" }));\nassertEqual(result.current.tasks, [{ id: 99, text: "Hook task" }]);`),
      ],
    },
  ],
};
