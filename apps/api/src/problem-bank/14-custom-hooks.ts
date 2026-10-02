import { hidden, test, type CategoryBank } from "./types.js";

const hookStub = (name: string, imports: string, signature: string) =>
  `${imports}\n\nfunction ${name}(${signature}) {\n  // Write your hook here\n}\n\nexport default ${name};\n`;

export const customHooks: CategoryBank = {
  category: "Custom Hooks",
  level: 14,
  type: "CUSTOM_HOOK",
  prerequisites: ["useState", "useEffect", "useRef"],
  problems: [
    {
      slug: "use-toggle",
      title: "useToggle",
      difficulty: "EASY",
      tags: ["custom-hooks", "useState"],
      estimatedMinutes: 10,
      description:
        "A custom hook is a function whose name starts with `use` and that calls other hooks. It lets components share **stateful logic**.\n\nWrite `useToggle(initialValue = false)` that returns `[value, toggle]`. Calling `toggle()` flips the value.\n\nThe tests call your hook from a test component — the default export is the hook itself.",
      requirements: ["Returns [value, toggle]", "Respects initialValue", "toggle flips the value"],
      hints: ["Inside, use useState(initialValue).", "const toggle = () => setValue((v) => !v); return [value, toggle] as const;"],
      starterCode: hookStub("useToggle", `import { useState } from "react";`, "initialValue = false"),
      solutionCode: `import { useCallback, useState } from "react";\n\nfunction useToggle(initialValue = false) {\n  const [value, setValue] = useState(initialValue);\n  const toggle = useCallback(() => setValue((v) => !v), []);\n  return [value, toggle] as const;\n}\n\nexport default useToggle;\n`,
      explanation: "Each component that calls useToggle gets its own independent state — hooks share logic, not state.",
      tests: [
        test("toggles", `const { result } = renderHook(() => Component());\nassertEqual(result.current[0], false);\nact(() => result.current[1]());\nassertEqual(result.current[0], true);`),
        hidden("respects the initial value and toggles back", `const { result } = renderHook(() => Component(true));\nassertEqual(result.current[0], true);\nact(() => result.current[1]());\nact(() => result.current[1]());\nassertEqual(result.current[0], true);`),
      ],
    },
    {
      slug: "use-counter",
      title: "useCounter With Limits",
      difficulty: "MEDIUM",
      tags: ["custom-hooks", "useState"],
      estimatedMinutes: 15,
      description:
        "Write `useCounter(initial = 0, { min = -Infinity, max = Infinity } = {})` returning `{ count, increment, decrement, reset }`:\n\n- `increment`/`decrement` change the count by 1 but never past min/max\n- `reset` returns to `initial`",
      requirements: ["Returns count and three actions", "Clamps to min/max", "reset goes back to initial"],
      hints: ["Clamp with Math.min(max, ...) and Math.max(min, ...).", "Use functional updates so rapid calls stack correctly."],
      starterCode: hookStub("useCounter", `import { useState } from "react";`, "initial = 0, { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {}"),
      solutionCode: `import { useState } from "react";\n\nfunction useCounter(initial = 0, { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {}) {\n  const [count, setCount] = useState(initial);\n\n  return {\n    count,\n    increment: () => setCount((c) => Math.min(max, c + 1)),\n    decrement: () => setCount((c) => Math.max(min, c - 1)),\n    reset: () => setCount(initial),\n  };\n}\n\nexport default useCounter;\n`,
      explanation: "Returning an object with named actions makes the hook's API self-documenting at the call site: const { count, increment } = useCounter().",
      tests: [
        test("increments and decrements", `const { result } = renderHook(() => Component(5));\nact(() => result.current.increment());\nact(() => result.current.increment());\nact(() => result.current.decrement());\nassertEqual(result.current.count, 6);`),
        hidden("clamps and resets", `const { result } = renderHook(() => Component(1, { min: 0, max: 2 }));\nact(() => { result.current.increment(); result.current.increment(); result.current.increment(); });\nassertEqual(result.current.count, 2);\nact(() => { result.current.decrement(); result.current.decrement(); result.current.decrement(); });\nassertEqual(result.current.count, 0);\nact(() => result.current.reset());\nassertEqual(result.current.count, 1);`),
      ],
      wrongSolutions: [`import { useState } from "react";\nfunction useCounter(initial = 0, { min = -Infinity, max = Infinity } = {}) {\n  const [count, setCount] = useState(initial);\n  return { count, increment: () => setCount(count + 1 > max ? max : count + 1), decrement: () => setCount(count - 1 < min ? min : count - 1), reset: () => setCount(initial) };\n}\nexport default useCounter;\n`],
    },
    {
      slug: "use-previous",
      title: "usePrevious",
      difficulty: "MEDIUM",
      tags: ["custom-hooks", "useRef", "useEffect"],
      estimatedMinutes: 12,
      description: "Write `usePrevious(value)` that returns the value from the **previous** render (`undefined` on the first render).",
      requirements: ["undefined on first render", "Returns the previous render's value afterwards"],
      hints: ["Store the value in a ref.", "Update the ref in an effect, and return what it held during render."],
      starterCode: hookStub("usePrevious", `import { useEffect, useRef } from "react";`, "value: unknown"),
      solutionCode: `import { useEffect, useRef } from "react";\n\nfunction usePrevious<T>(value: T): T | undefined {\n  const ref = useRef<T>();\n  useEffect(() => {\n    ref.current = value;\n  }, [value]);\n  return ref.current;\n}\n\nexport default usePrevious;\n`,
      explanation: "Extracting the previous-value pattern into a hook turns three lines of ref/effect plumbing into one readable call.",
      tests: [
        test("first render is undefined", `const { result } = renderHook((props) => Component(props.v), { initialProps: { v: 1 } });\nassertEqual(result.current, undefined);`),
        hidden("tracks previous values", `const { result, rerender } = renderHook((props) => Component(props.v), { initialProps: { v: "a" } });\nrerender({ v: "b" });\nassertEqual(result.current, "a");\nrerender({ v: "c" });\nassertEqual(result.current, "b");`),
      ],
    },
    {
      slug: "use-document-title",
      title: "useDocumentTitle",
      difficulty: "EASY",
      tags: ["custom-hooks", "useEffect", "cleanup"],
      estimatedMinutes: 10,
      description:
        "Write `useDocumentTitle(title)` that sets `document.title` to `title` whenever it changes, and **restores** whatever the title was before when the component using it unmounts.",
      requirements: ["Sets the title", "Updates when title changes", "Restores the original title on unmount"],
      hints: ["Remember the original title once, e.g. in a ref initialised from document.title.", "A separate effect with [] can restore it in its cleanup."],
      starterCode: hookStub("useDocumentTitle", `import { useEffect, useRef } from "react";`, "title: string"),
      solutionCode: `import { useEffect, useRef } from "react";\n\nfunction useDocumentTitle(title: string) {\n  const originalTitle = useRef(document.title);\n\n  useEffect(() => {\n    document.title = title;\n  }, [title]);\n\n  useEffect(() => {\n    const original = originalTitle.current;\n    return () => {\n      document.title = original;\n    };\n  }, []);\n}\n\nexport default useDocumentTitle;\n`,
      explanation: "Splitting into two effects keeps each one focused: one syncs the title, the other only cleans up on unmount.",
      tests: [
        test("sets and updates the title", `document.title = "Home";\nconst { rerender } = renderHook((props) => Component(props.t), { initialProps: { t: "Inbox (1)" } });\nassertEqual(document.title, "Inbox (1)");\nrerender({ t: "Inbox (2)" });\nassertEqual(document.title, "Inbox (2)");`),
        hidden("restores on unmount", `document.title = "My App";\nconst { rerender, unmount } = renderHook((props) => Component(props.t), { initialProps: { t: "Editing" } });\nrerender({ t: "Editing*" });\nunmount();\nassertEqual(document.title, "My App");`),
      ],
    },
    {
      slug: "use-local-storage",
      title: "useLocalStorage",
      difficulty: "MEDIUM",
      tags: ["custom-hooks", "localStorage", "useState"],
      estimatedMinutes: 15,
      description:
        "Write `useLocalStorage(key, initialValue)` that works like `useState` but persists the value as **JSON** in `localStorage[key]`.\n\n- If the key already has a stored value, start with that (parsed).\n- Otherwise start with `initialValue`.\n- Setting the value updates both state and storage.",
      requirements: ["Reads existing JSON from storage", "Falls back to initialValue", "Writes JSON on every change"],
      hints: [
        "useState(() => { const raw = localStorage.getItem(key); return raw !== null ? JSON.parse(raw) : initialValue; })",
        "Sync to storage in an effect that depends on [key, value].",
      ],
      starterCode: hookStub("useLocalStorage", `import { useEffect, useState } from "react";`, "key: string, initialValue: unknown"),
      solutionCode: `import { useEffect, useState } from "react";\n\nfunction useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(() => {\n    const raw = localStorage.getItem(key);\n    return raw !== null ? (JSON.parse(raw) as T) : initialValue;\n  });\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n\n  return [value, setValue] as const;\n}\n\nexport default useLocalStorage;\n`,
      explanation: "A hook can keep the exact useState interface while adding behaviour (persistence) behind it, so components don't need to change.",
      tests: [
        test("persists as JSON", `localStorage.clear();\nconst { result } = renderHook(() => Component("prefs", { theme: "light" }));\nassertEqual(result.current[0], { theme: "light" });\nact(() => result.current[1]({ theme: "dark" }));\nassertEqual(result.current[0], { theme: "dark" });\nassertEqual(localStorage.getItem("prefs"), JSON.stringify({ theme: "dark" }));`),
        hidden("reads an existing value", `localStorage.setItem("count", "41");\nconst { result } = renderHook(() => Component("count", 0));\nassertEqual(result.current[0], 41);\nact(() => result.current[1](42));\nassertEqual(localStorage.getItem("count"), "42");`),
      ],
    },
    {
      slug: "use-debounce",
      title: "useDebounce",
      difficulty: "HARD",
      tags: ["custom-hooks", "useEffect", "timers", "debouncing"],
      estimatedMinutes: 20,
      description:
        "Write `useDebounce(value, delay)` that returns a **debounced** copy of `value`: it only updates after `value` has stopped changing for `delay` ms.\n\nExample: typing quickly in a search box should trigger one search after the user pauses, not one per keystroke.\n\n- Starts equal to `value`.\n- Each change restarts the timer.\n- Pending timers are cleared on unmount.",
      requirements: ["Initial value is returned immediately", "Rapid changes only produce the final value", "Updates after the delay"],
      hints: [
        "Keep the debounced value in state.",
        "In an effect on [value, delay], set a timeout that updates it...",
        "...and return clearTimeout as the cleanup, which cancels the previous timer whenever value changes.",
      ],
      starterCode: hookStub("useDebounce", `import { useEffect, useState } from "react";`, "value: unknown, delay: number"),
      solutionCode: `import { useEffect, useState } from "react";\n\nfunction useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState(value);\n\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n\n  return debounced;\n}\n\nexport default useDebounce;\n`,
      explanation: "The cleanup is what makes this work: every new value cancels the previous timer, so only a value that 'survives' the whole delay gets through.",
      commonMistakes: ["Not clearing the timeout: every intermediate value eventually gets applied, just late."],
      tests: [
        test("updates after the delay", `const { result, rerender } = renderHook((p) => Component(p.v, 50), { initialProps: { v: "a" } });\nassertEqual(result.current, "a");\nrerender({ v: "ab" });\nassertEqual(result.current, "a", "Should not update immediately");\nawait waitFor(() => assertEqual(result.current, "ab"), { timeout: 500 });`),
        hidden("rapid changes only apply the last value", `const seen = [];\nconst { result, rerender } = renderHook((p) => { const v = Component(p.v, 60); seen.push(v); return v; }, { initialProps: { v: "r" } });\nfor (const v of ["re", "rea", "reac", "react"]) {\n  rerender({ v });\n  await sleep(15);\n}\nawait waitFor(() => assertEqual(result.current, "react"), { timeout: 500 });\nawait sleep(100);\nassertEqual(Array.from(new Set(seen)), ["r", "react"], "Intermediate values leaked through: " + JSON.stringify(Array.from(new Set(seen))));`),
      ],
      wrongSolutions: [`import { useEffect, useState } from "react";\nfunction useDebounce(value, delay) {\n  const [d, setD] = useState(value);\n  useEffect(() => { setTimeout(() => setD(value), delay); }, [value, delay]);\n  return d;\n}\nexport default useDebounce;\n`],
    },
    {
      slug: "use-undo-redo",
      title: "useUndoRedo",
      difficulty: "HARD",
      tags: ["custom-hooks", "useReducer", "history"],
      estimatedMinutes: 30,
      description:
        "Write `useUndoRedo(initialValue)` that tracks a value's history. It returns:\n\n```\n{ value, set, undo, redo, canUndo, canRedo }\n```\n\n- `set(v)` records a new value (and discards any redo history)\n- `undo()` / `redo()` move back and forward; they do nothing when there's nowhere to go\n- `canUndo` / `canRedo` say whether that's possible",
      requirements: ["set/undo/redo behave like an editor's history", "Setting after undo clears the redo stack", "canUndo/canRedo are accurate"],
      hints: [
        "Model it as three parts: past (array), present (value), future (array).",
        "undo: move present to the front of future, pop the last of past into present. redo is the mirror image.",
        "Keep all three in one state object (or a reducer) so they always update together.",
      ],
      starterCode: hookStub("useUndoRedo", `import { useState } from "react";`, "initialValue: unknown"),
      solutionCode: `import { useCallback, useState } from "react";\n\ninterface History<T> {\n  past: T[];\n  present: T;\n  future: T[];\n}\n\nfunction useUndoRedo<T>(initialValue: T) {\n  const [history, setHistory] = useState<History<T>>({ past: [], present: initialValue, future: [] });\n\n  const set = useCallback((value: T) => {\n    setHistory((h) => ({ past: [...h.past, h.present], present: value, future: [] }));\n  }, []);\n\n  const undo = useCallback(() => {\n    setHistory((h) => {\n      if (h.past.length === 0) return h;\n      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };\n    });\n  }, []);\n\n  const redo = useCallback(() => {\n    setHistory((h) => {\n      if (h.future.length === 0) return h;\n      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };\n    });\n  }, []);\n\n  return {\n    value: history.present,\n    set,\n    undo,\n    redo,\n    canUndo: history.past.length > 0,\n    canRedo: history.future.length > 0,\n  };\n}\n\nexport default useUndoRedo;\n`,
      explanation: "Past/present/future is the classic undo model (Redux's docs use the same shape). Keeping all three in one state object guarantees every transition updates them consistently.",
      commonMistakes: ["Forgetting to clear `future` on set, so redo resurrects an abandoned branch.", "Three separate useState calls that get out of sync when updated in quick succession."],
      tests: [
        test("undo and redo", `const { result } = renderHook(() => Component("a"));\nact(() => result.current.set("b"));\nact(() => result.current.set("c"));\nact(() => result.current.undo());\nassertEqual(result.current.value, "b");\nact(() => result.current.redo());\nassertEqual(result.current.value, "c");`),
        hidden("set clears redo history and flags are accurate", `const { result } = renderHook(() => Component(1));\nassertEqual([result.current.canUndo, result.current.canRedo], [false, false]);\nact(() => result.current.set(2));\nact(() => result.current.set(3));\nact(() => result.current.undo());\nact(() => result.current.undo());\nassertEqual(result.current.value, 1);\nassertEqual([result.current.canUndo, result.current.canRedo], [false, true]);\nact(() => result.current.undo());\nassertEqual(result.current.value, 1, "undo with no history should do nothing");\nact(() => result.current.redo());\nact(() => result.current.set(9));\nassertEqual(result.current.canRedo, false, "set should clear the redo stack");\nact(() => result.current.redo());\nassertEqual(result.current.value, 9);\nact(() => result.current.undo());\nassertEqual(result.current.value, 2);`),
      ],
      wrongSolutions: [`import { useState } from "react";\nfunction useUndoRedo(initialValue) {\n  const [past, setPast] = useState([]);\n  const [present, setPresent] = useState(initialValue);\n  const [future, setFuture] = useState([]);\n  return {\n    value: present,\n    set: (v) => { setPast([...past, present]); setPresent(v); },\n    undo: () => { if (!past.length) return; setFuture([present, ...future]); setPresent(past[past.length - 1]); setPast(past.slice(0, -1)); },\n    redo: () => { if (!future.length) return; setPast([...past, present]); setPresent(future[0]); setFuture(future.slice(1)); },\n    canUndo: past.length > 0,\n    canRedo: future.length > 0,\n  };\n}\nexport default useUndoRedo;\n`],
    },
    {
      slug: "use-fetch",
      title: "useFetch",
      difficulty: "HARD",
      tags: ["custom-hooks", "api", "useEffect", "race-conditions"],
      estimatedMinutes: 25,
      description:
        "Write `useFetch(url)` that returns `{ data, loading, error }`:\n\n- `loading` is true while a request is in flight\n- `data` holds the parsed JSON on success\n- `error` holds an `Error` when the response is not OK (and `data` is null)\n- When `url` changes, fetch again — and ignore any late response for an old url",
      requirements: ["Loading/data/error states", "Non-OK responses become errors", "Refetches on url change", "Ignores stale responses"],
      hints: [
        "This is the Fetch Users component logic, moved into a hook.",
        "Reset to { data: null, loading: true, error: null } at the start of each request.",
        "Use an `ignore` flag set in the effect cleanup.",
      ],
      starterCode: hookStub("useFetch", `import { useEffect, useState } from "react";`, "url: string"),
      solutionCode: `import { useEffect, useState } from "react";\n\ninterface FetchState<T> {\n  data: T | null;\n  loading: boolean;\n  error: Error | null;\n}\n\nfunction useFetch<T = unknown>(url: string): FetchState<T> {\n  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });\n\n  useEffect(() => {\n    let ignore = false;\n    setState({ data: null, loading: true, error: null });\n\n    fetch(url)\n      .then(async (res) => {\n        if (!res.ok) throw new Error(\`Request failed with status \${res.status}\`);\n        return (await res.json()) as T;\n      })\n      .then((data) => {\n        if (!ignore) setState({ data, loading: false, error: null });\n      })\n      .catch((error: Error) => {\n        if (!ignore) setState({ data: null, loading: false, error });\n      });\n\n    return () => {\n      ignore = true;\n    };\n  }, [url]);\n\n  return state;\n}\n\nexport default useFetch;\n`,
      explanation: "A single state object updated in one setState keeps data/loading/error consistent with each other. The ignore flag makes the hook safe against out-of-order responses.",
      mockApi: [
        { url: "/api/users", response: [{ id: 1, name: "Alice" }] },
        { url: "/api/slow", delayMs: 150, response: { which: "slow" } },
        { url: "/api/fast", delayMs: 10, response: { which: "fast" } },
        { url: "/api/broken", status: 500, response: { error: "nope" } },
      ],
      tests: [
        test("loads data", `const { result } = renderHook(() => Component("/api/users"));\nassertEqual(result.current.loading, true);\nawait waitFor(() => assertEqual(result.current.loading, false));\nassertEqual(result.current.data, [{ id: 1, name: "Alice" }]);\nassertEqual(result.current.error, null);`),
        hidden("reports errors", `const { result } = renderHook(() => Component("/api/broken"));\nawait waitFor(() => assertEqual(result.current.loading, false));\nassert(result.current.error instanceof Error, "error should be an Error instance");\nassertEqual(result.current.data, null);`),
        hidden("refetches and ignores stale responses", `const { result, rerender } = renderHook((p) => Component(p.url), { initialProps: { url: "/api/slow" } });\nrerender({ url: "/api/fast" });\nawait waitFor(() => assertEqual(result.current.data, { which: "fast" }));\nawait sleep(250);\nassertEqual(result.current.data, { which: "fast" }, "A stale response overwrote the current one");`),
      ],
      wrongSolutions: [`import { useEffect, useState } from "react";\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n  useEffect(() => { setLoading(true); fetch(url).then((r) => { if (!r.ok) throw new Error("x"); return r.json(); }).then((d) => { setData(d); setLoading(false); }).catch((e) => { setError(e); setLoading(false); }); }, [url]);\n  return { data, loading, error };\n}\nexport default useFetch;\n`],
    },
  ],
};
