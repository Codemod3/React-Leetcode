import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
const effectImports = `import { useEffect, useState } from "react";`;

/** Spy on window/document add/removeEventListener during `body`. */
const spyListeners = (target: "window" | "document", body: string) =>
  `const removed = [];\nconst original = ${target}.removeEventListener;\n${target}.removeEventListener = function (type, ...rest) { removed.push(type); return original.call(this, type, ...rest); };\ntry {\n${body}\n} finally {\n  ${target}.removeEventListener = original;\n}`;

export const useEffectBank: CategoryBank = {
  category: "useEffect",
  level: 11,
  type: "HOOK",
  prerequisites: ["useState", "Events"],
  problems: [
    {
      slug: "run-on-mount",
      title: "Run Code on Mount",
      difficulty: "EASY",
      tags: ["useEffect", "dependencies"],
      estimatedMinutes: 10,
      description:
        "Effects run code **after** React renders, for things that aren't about rendering (timers, subscriptions, logging, network requests).\n\nMake `MountLogger` accept an `onMount` function and call it **exactly once**, when the component first mounts — not on later re-renders.",
      requirements: ["Calls onMount after the first render", "Never calls it again on re-renders"],
      hints: ["useEffect(() => { ... }, deps)", "An empty dependency array [] means 'run once after the first render'."],
      starterCode: `${effectImports}\n\nfunction MountLogger({ onMount }: { onMount: () => void }) {\n  // Write your solution here\n  return <p>Mounted</p>;\n}\n\nexport default MountLogger;\n`,
      solutionCode: `${effectImports}\n\nfunction MountLogger({ onMount }: { onMount: () => void }) {\n  useEffect(() => {\n    onMount();\n  }, []);\n\n  return <p>Mounted</p>;\n}\n\nexport default MountLogger;\n`,
      explanation: "The dependency array tells React when to re-run the effect. With [] there's nothing that can change, so it runs once after mount.",
      commonMistakes: ["Leaving out the array: the effect runs after every render.", "Calling onMount() directly in the component body: it runs during render, every render."],
      tests: [
        test("calls onMount", `const onMount = mockFn();\nrenderComponent({ onMount });\nassertEqual(onMount.calls.length, 1);`),
        hidden("not again on re-render", `const onMount = mockFn();\nconst { rerender } = renderComponent({ onMount });\nrerender(<Component onMount={onMount} />);\nrerender(<Component onMount={onMount} />);\nassertEqual(onMount.calls.length, 1, "onMount ran " + onMount.calls.length + " times — check the dependency array");`),
      ],
      wrongSolutions: [`import { useEffect } from "react";\nfunction MountLogger({ onMount }) {\n  useEffect(() => { onMount(); });\n  return <p>Mounted</p>;\n}\nexport default MountLogger;\n`],
    },
    {
      slug: "effect-document-title",
      title: "Sync the Document Title",
      difficulty: "EASY",
      tags: ["useEffect", "side-effects"],
      estimatedMinutes: 10,
      description:
        "Make `ClickTitle` render a button `Click me` and keep a click count. Use an effect to set `document.title` to `Clicked {n} times` whenever the count changes (starting with `Clicked 0 times`).",
      requirements: ["Title reflects the count", "Effect re-runs when the count changes"],
      hints: ["Setting document.title is a side effect — it belongs in useEffect.", "useEffect(() => { document.title = ...; }, [count]);"],
      starterCode: `${effectImports}\n\nfunction ClickTitle() {\n  // Write your solution here\n  return null;\n}\n\nexport default ClickTitle;\n`,
      solutionCode: `${effectImports}\n\nfunction ClickTitle() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    document.title = \`Clicked \${count} times\`;\n  }, [count]);\n\n  return <button onClick={() => setCount((c) => c + 1)}>Click me</button>;\n}\n\nexport default ClickTitle;\n`,
      explanation: "Effects synchronize React state with something outside React — here, the browser tab title.",
      tests: [
        test("sets the initial title", `document.title = "";\nrenderComponent();\nassertEqual(document.title, "Clicked 0 times");`),
        hidden("updates on click", `renderComponent();\n${click("Click me")}\n${click("Click me")}\nassertEqual(document.title, "Clicked 2 times");`),
      ],
      wrongSolutions: [`import { useEffect, useState } from "react";\nfunction ClickTitle() {\n  const [count, setCount] = useState(0);\n  useEffect(() => { document.title = "Clicked " + count + " times"; }, []);\n  return <button onClick={() => setCount(count + 1)}>Click me</button>;\n}\nexport default ClickTitle;\n`],
    },
    {
      slug: "effect-on-state-change",
      title: "Run an Effect When State Changes",
      difficulty: "EASY",
      tags: ["useEffect", "dependencies"],
      estimatedMinutes: 12,
      description:
        "Make `QueryReporter` accept `onQueryChange`. It has an input labelled `Query` and a separate button `Toggle theme` (which flips an unrelated `dark` boolean and shows `<p>Theme: dark</p>` / `<p>Theme: light</p>`).\n\nCall `onQueryChange(query)` in an effect whenever **the query** changes (including the initial empty string), but **not** when only the theme changes.",
      requirements: ["Reports the initial query", "Reports each change of query", "Does not report when the theme toggles"],
      hints: ["List exactly the values the effect uses in its dependency array.", "[query] — not [query, dark], and not omitted."],
      starterCode: `${effectImports}\n\nfunction QueryReporter({ onQueryChange }: { onQueryChange: (q: string) => void }) {\n  // Write your solution here\n  return null;\n}\n\nexport default QueryReporter;\n`,
      solutionCode: `${effectImports}\n\nfunction QueryReporter({ onQueryChange }: { onQueryChange: (q: string) => void }) {\n  const [query, setQuery] = useState("");\n  const [dark, setDark] = useState(false);\n\n  useEffect(() => {\n    onQueryChange(query);\n  }, [query]);\n\n  return (\n    <div>\n      <label>\n        Query <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      </label>\n      <button onClick={() => setDark((d) => !d)}>Toggle theme</button>\n      <p>Theme: {dark ? "dark" : "light"}</p>\n    </div>\n  );\n}\n\nexport default QueryReporter;\n`,
      explanation: "React compares each dependency with its previous value and only re-runs the effect when one of them changed.",
      tests: [
        test("reports query changes", `const onQueryChange = mockFn();\nrenderComponent({ onQueryChange });\nawait userEvent.type(screen.getByLabelText("Query"), "ab");\nassertEqual(onQueryChange.calls, [[""], ["a"], ["ab"]]);`),
        hidden("ignores unrelated state", `const onQueryChange = mockFn();\nrenderComponent({ onQueryChange });\n${click("Toggle theme")}\n${click("Toggle theme")}\nexpectText("Theme: light");\nassertEqual(onQueryChange.calls, [[""]]);`),
      ],
      wrongSolutions: [`import { useEffect, useState } from "react";\nfunction QueryReporter({ onQueryChange }) {\n  const [query, setQuery] = useState("");\n  const [dark, setDark] = useState(false);\n  useEffect(() => { onQueryChange(query); });\n  return (<div><label>Query <input value={query} onChange={(e) => setQuery(e.target.value)} /></label><button onClick={() => setDark(!dark)}>Toggle theme</button><p>Theme: {dark ? "dark" : "light"}</p></div>);\n}\nexport default QueryReporter;\n`],
    },
    {
      slug: "effect-on-prop-change",
      title: "Run an Effect When a Prop Changes",
      difficulty: "EASY",
      tags: ["useEffect", "dependencies", "props"],
      estimatedMinutes: 10,
      description:
        "Make `ProfileViewTracker` accept `userId`, `theme`, and `onView`. Render `<p>Viewing user {userId}</p>` with `className={theme}`. Call `onView(userId)` when it mounts and whenever `userId` changes — but not when only `theme` changes.",
      requirements: ["Reports on mount", "Reports on userId change", "Ignores theme changes"],
      hints: ["Props can be dependencies too.", "useEffect(() => { onView(userId); }, [userId]);"],
      starterCode: `${effectImports}\n\ninterface Props {\n  userId: number;\n  theme: string;\n  onView: (userId: number) => void;\n}\n\nfunction ProfileViewTracker(props: Props) {\n  // Write your solution here\n  return null;\n}\n\nexport default ProfileViewTracker;\n`,
      solutionCode: `${effectImports}\n\ninterface Props {\n  userId: number;\n  theme: string;\n  onView: (userId: number) => void;\n}\n\nfunction ProfileViewTracker({ userId, theme, onView }: Props) {\n  useEffect(() => {\n    onView(userId);\n  }, [userId]);\n\n  return <p className={theme}>Viewing user {userId}</p>;\n}\n\nexport default ProfileViewTracker;\n`,
      explanation: "Whether a value comes from props or state doesn't matter to an effect — anything that can change between renders goes in the dependency array.",
      tests: [
        test("reports on mount and id change", `const onView = mockFn();\nconst { rerender } = renderComponent({ userId: 1, theme: "light", onView });\nrerender(<Component userId={2} theme="light" onView={onView} />);\nassertEqual(onView.calls, [[1], [2]]);`),
        hidden("ignores theme changes", `const onView = mockFn();\nconst { rerender } = renderComponent({ userId: 5, theme: "light", onView });\nrerender(<Component userId={5} theme="dark" onView={onView} />);\nassertEqual(onView.calls, [[5]]);\nassertEqual(expectText("Viewing user 5").className, "dark");`),
      ],
      wrongSolutions: [`import { useEffect } from "react";\nfunction ProfileViewTracker({ userId, theme, onView }) {\n  useEffect(() => { onView(userId); }, []);\n  return <p className={theme}>Viewing user {userId}</p>;\n}\nexport default ProfileViewTracker;\n`],
    },
    {
      slug: "effect-cleanup-interval",
      title: "Clean Up an Interval",
      difficulty: "MEDIUM",
      tags: ["useEffect", "cleanup", "timers"],
      estimatedMinutes: 15,
      description:
        "Make `Ticker` accept `intervalMs` and `onTick`. While mounted, call `onTick()` every `intervalMs` milliseconds. Render `<p>Ticking</p>`.\n\nWhen the component unmounts, the interval **must stop** — otherwise it keeps running forever (a memory leak).",
      requirements: ["Ticks repeatedly while mounted", "Stops after unmount"],
      hints: ["setInterval returns an id; clearInterval(id) stops it.", "Return a cleanup function from the effect: return () => clearInterval(id);"],
      starterCode: `${effectImports}\n\nfunction Ticker({ intervalMs, onTick }: { intervalMs: number; onTick: () => void }) {\n  // Write your solution here\n  return <p>Ticking</p>;\n}\n\nexport default Ticker;\n`,
      solutionCode: `${effectImports}\n\nfunction Ticker({ intervalMs, onTick }: { intervalMs: number; onTick: () => void }) {\n  useEffect(() => {\n    const id = setInterval(onTick, intervalMs);\n    return () => clearInterval(id);\n  }, [intervalMs, onTick]);\n\n  return <p>Ticking</p>;\n}\n\nexport default Ticker;\n`,
      explanation: "React runs an effect's cleanup before the effect re-runs and when the component unmounts. Anything you start in an effect (timers, listeners, subscriptions), you stop in its cleanup.",
      tests: [
        test("ticks", `const onTick = mockFn();\nrenderComponent({ intervalMs: 20, onTick });\nawait sleep(130);\nassert(onTick.calls.length >= 3, "Expected several ticks, got " + onTick.calls.length);`),
        hidden("stops after unmount", `const onTick = mockFn();\nconst { unmount } = renderComponent({ intervalMs: 20, onTick });\nawait sleep(70);\nunmount();\nconst after = onTick.calls.length;\nawait sleep(100);\nassertEqual(onTick.calls.length, after, "onTick kept firing after unmount — clear the interval in the cleanup");`),
      ],
      wrongSolutions: [`import { useEffect } from "react";\nfunction Ticker({ intervalMs, onTick }) {\n  useEffect(() => { setInterval(onTick, intervalMs); }, []);\n  return <p>Ticking</p>;\n}\nexport default Ticker;\n`],
    },
    {
      slug: "effect-window-resize",
      title: "Listen to Window Resize",
      difficulty: "MEDIUM",
      tags: ["useEffect", "cleanup", "event-listeners"],
      estimatedMinutes: 15,
      description:
        "Make `WindowWidth` render `<p>Width: {width}</p>`, starting from `window.innerWidth` and updating whenever the window is resized. Remove the listener when the component unmounts.",
      requirements: ["Shows the current width", "Updates on resize", "Removes the listener on unmount"],
      hints: [
        "window.addEventListener(\"resize\", handler) inside an effect with [] deps.",
        "Cleanup must remove the same function you added.",
        "Read window.innerWidth inside the handler.",
      ],
      starterCode: `${effectImports}\n\nfunction WindowWidth() {\n  // Write your solution here\n  return null;\n}\n\nexport default WindowWidth;\n`,
      solutionCode: `${effectImports}\n\nfunction WindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n\n  useEffect(() => {\n    function handleResize() {\n      setWidth(window.innerWidth);\n    }\n    window.addEventListener("resize", handleResize);\n    return () => window.removeEventListener("resize", handleResize);\n  }, []);\n\n  return <p>Width: {width}</p>;\n}\n\nexport default WindowWidth;\n`,
      explanation: "Subscribing in an effect and unsubscribing in its cleanup is the standard pattern for any browser event outside your component's own JSX.",
      commonMistakes: ["Passing a new arrow function to removeEventListener — it must be the exact same function reference."],
      tests: [
        test("updates on resize", `window.innerWidth = 1024;\nrenderComponent();\nexpectText("Width: 1024");\nwindow.innerWidth = 480;\nact(() => { window.dispatchEvent(new window.Event("resize")); });\nexpectText("Width: 480");`),
        hidden("removes the listener", spyListeners("window", `  const { unmount } = renderComponent();\n  unmount();`) + `\nassert(removed.includes("resize"), "Remove the resize listener in the effect cleanup");`),
      ],
      wrongSolutions: [`import { useEffect, useState } from "react";\nfunction WindowWidth() {\n  const [w, setW] = useState(window.innerWidth);\n  useEffect(() => { window.addEventListener("resize", () => setW(window.innerWidth)); }, []);\n  return <p>Width: {w}</p>;\n}\nexport default WindowWidth;\n`],
    },
    {
      slug: "effect-escape-listener",
      title: "Global Keyboard Shortcut",
      difficulty: "EASY",
      tags: ["useEffect", "cleanup", "keyboard"],
      estimatedMinutes: 12,
      description:
        "Make `EscapeHandler` accept `onEscape` and render `<p>Press Escape to close</p>`. Listen for `keydown` on `document`; when the key is `Escape`, call `onEscape()`. Stop listening when the component unmounts.",
      requirements: ["Escape anywhere calls onEscape", "Other keys don't", "No calls after unmount"],
      hints: ["document.addEventListener(\"keydown\", handler)", "Check event.key inside the handler."],
      starterCode: `${effectImports}\n\nfunction EscapeHandler({ onEscape }: { onEscape: () => void }) {\n  // Write your solution here\n  return <p>Press Escape to close</p>;\n}\n\nexport default EscapeHandler;\n`,
      solutionCode: `${effectImports}\n\nfunction EscapeHandler({ onEscape }: { onEscape: () => void }) {\n  useEffect(() => {\n    function handleKeyDown(event: KeyboardEvent) {\n      if (event.key === "Escape") onEscape();\n    }\n    document.addEventListener("keydown", handleKeyDown);\n    return () => document.removeEventListener("keydown", handleKeyDown);\n  }, [onEscape]);\n\n  return <p>Press Escape to close</p>;\n}\n\nexport default EscapeHandler;\n`,
      explanation: "Global shortcuts can't be attached via JSX because they're not tied to one element — an effect subscribes to the document instead.",
      tests: [
        test("Escape calls onEscape", `const onEscape = mockFn();\nrenderComponent({ onEscape });\nfireEvent.keyDown(document, { key: "Escape" });\nfireEvent.keyDown(document, { key: "Enter" });\nassertEqual(onEscape.calls.length, 1);`),
        hidden("stops after unmount", `const onEscape = mockFn();\nconst { unmount } = renderComponent({ onEscape });\nunmount();\nfireEvent.keyDown(document, { key: "Escape" });\nassertEqual(onEscape.calls.length, 0, "The listener is still attached after unmount");`),
      ],
      wrongSolutions: [`import { useEffect } from "react";\nfunction EscapeHandler({ onEscape }) {\n  useEffect(() => { document.addEventListener("keydown", (e) => { if (e.key === "Escape") onEscape(); }); }, []);\n  return <p>Press Escape to close</p>;\n}\nexport default EscapeHandler;\n`],
    },
    {
      slug: "effect-local-storage",
      title: "Save and Restore From localStorage",
      difficulty: "MEDIUM",
      tags: ["useEffect", "localStorage", "persistence"],
      estimatedMinutes: 15,
      description:
        "Make `DraftNote` render a textarea labelled `Note`. Its text should survive a page reload:\n\n- Start with the value stored in `localStorage` under the key `draft-note` (or `\"\"`).\n- Save it back to `localStorage` whenever it changes.",
      requirements: ["Restores the saved draft", "Saves on every change"],
      hints: [
        "Read once with a lazy initializer: useState(() => localStorage.getItem(\"draft-note\") ?? \"\")",
        "Write in an effect that depends on the text.",
      ],
      starterCode: `${effectImports}\n\nfunction DraftNote() {\n  // Write your solution here\n  return null;\n}\n\nexport default DraftNote;\n`,
      solutionCode: `${effectImports}\n\nconst KEY = "draft-note";\n\nfunction DraftNote() {\n  const [text, setText] = useState(() => localStorage.getItem(KEY) ?? "");\n\n  useEffect(() => {\n    localStorage.setItem(KEY, text);\n  }, [text]);\n\n  return (\n    <label>\n      Note\n      <textarea value={text} onChange={(e) => setText(e.target.value)} />\n    </label>\n  );\n}\n\nexport default DraftNote;\n`,
      explanation: "Reading storage during initialization avoids a flash of empty content; writing in an effect keeps storage in sync with state.",
      tests: [
        test("saves as you type", `localStorage.clear();\nrenderComponent();\nawait userEvent.type(screen.getByLabelText("Note"), "Hi");\nassertEqual(localStorage.getItem("draft-note"), "Hi");`),
        hidden("restores a saved draft", `localStorage.setItem("draft-note", "Remember milk");\nrenderComponent();\nassertEqual(screen.getByLabelText("Note").value, "Remember milk");`),
      ],
    },
    {
      slug: "effect-countdown",
      title: "Countdown Timer",
      difficulty: "MEDIUM",
      tags: ["useEffect", "timers", "cleanup"],
      estimatedMinutes: 20,
      description:
        "Make `Countdown` accept `from`, `intervalMs` (default 1000), and an optional `onFinish`. Show the remaining number in a `<p>`, counting down by 1 every `intervalMs`. At 0, show `<p>Time's up!</p>`, call `onFinish()` **once**, and stop.",
      requirements: ["Counts down to 0", "Shows 'Time's up!' at 0", "Calls onFinish exactly once", "Stops timing at 0"],
      hints: [
        "One approach: an effect that depends on `remaining` and schedules a single setTimeout for the next step.",
        "When remaining hits 0, call onFinish instead of scheduling another timeout.",
        "Return clearTimeout as the cleanup.",
      ],
      starterCode: `${effectImports}\n\ninterface CountdownProps {\n  from: number;\n  intervalMs?: number;\n  onFinish?: () => void;\n}\n\nfunction Countdown(props: CountdownProps) {\n  // Write your solution here\n  return null;\n}\n\nexport default Countdown;\n`,
      solutionCode: `${effectImports}\n\ninterface CountdownProps {\n  from: number;\n  intervalMs?: number;\n  onFinish?: () => void;\n}\n\nfunction Countdown({ from, intervalMs = 1000, onFinish }: CountdownProps) {\n  const [remaining, setRemaining] = useState(from);\n\n  useEffect(() => {\n    if (remaining === 0) {\n      onFinish?.();\n      return;\n    }\n    const id = setTimeout(() => setRemaining((r) => r - 1), intervalMs);\n    return () => clearTimeout(id);\n  }, [remaining, intervalMs]);\n\n  return <p>{remaining === 0 ? "Time's up!" : remaining}</p>;\n}\n\nexport default Countdown;\n`,
      explanation: "Scheduling one timeout per step, driven by state, makes 'stop at zero' natural: at 0 the effect simply doesn't schedule another step.",
      alternativeApproach: "A single setInterval works too, but then you must clear it from inside the update when you reach 0.",
      tests: [
        test("counts down to Time's up!", `renderComponent({ from: 3, intervalMs: 20 });\nexpectText("3");\nawait waitFor(() => expectText("Time's up!"), { timeout: 1000 });`),
        hidden("calls onFinish once and stops", `const onFinish = mockFn();\nrenderComponent({ from: 2, intervalMs: 20, onFinish });\nawait waitFor(() => expectText("Time's up!"), { timeout: 1000 });\nawait sleep(100);\nassertEqual(onFinish.calls.length, 1);\nexpectText("Time's up!");`),
      ],
    },
    {
      slug: "effect-online-status",
      title: "Online/Offline Detection",
      difficulty: "EASY",
      tags: ["useEffect", "event-listeners", "browser-apis"],
      estimatedMinutes: 12,
      description:
        "Make `ConnectionStatus` render `<p>Online</p>` or `<p>Offline</p>`. Start from `navigator.onLine`, then listen for the window's `online` and `offline` events. Remove both listeners on unmount.",
      requirements: ["Initial state from navigator.onLine", "Reacts to online/offline events", "Cleans up both listeners"],
      hints: ["Two listeners, one effect.", "The cleanup should remove both."],
      starterCode: `${effectImports}\n\nfunction ConnectionStatus() {\n  // Write your solution here\n  return null;\n}\n\nexport default ConnectionStatus;\n`,
      solutionCode: `${effectImports}\n\nfunction ConnectionStatus() {\n  const [online, setOnline] = useState(navigator.onLine);\n\n  useEffect(() => {\n    const goOnline = () => setOnline(true);\n    const goOffline = () => setOnline(false);\n    window.addEventListener("online", goOnline);\n    window.addEventListener("offline", goOffline);\n    return () => {\n      window.removeEventListener("online", goOnline);\n      window.removeEventListener("offline", goOffline);\n    };\n  }, []);\n\n  return <p>{online ? "Online" : "Offline"}</p>;\n}\n\nexport default ConnectionStatus;\n`,
      explanation: "One effect can manage several related subscriptions, as long as its cleanup undoes all of them.",
      tests: [
        test("reacts to offline/online", `renderComponent();\nexpectText("Online");\nact(() => { window.dispatchEvent(new window.Event("offline")); });\nexpectText("Offline");\nact(() => { window.dispatchEvent(new window.Event("online")); });\nexpectText("Online");`),
        hidden("removes both listeners", spyListeners("window", `  const { unmount } = renderComponent();\n  unmount();`) + `\nassert(removed.includes("online") && removed.includes("offline"), "Remove both the online and offline listeners");`),
      ],
    },
    {
      slug: "effect-not-needed-derived",
      title: "You Might Not Need an Effect",
      difficulty: "MEDIUM",
      tags: ["useEffect", "derived-state", "refactoring"],
      problemType: "REFACTOR",
      estimatedMinutes: 12,
      description:
        "`FullNameForm` works, but it uses an effect to copy `first + last` into a separate `fullName` state. That causes an extra render after every keystroke, and briefly shows a stale name.\n\nRefactor it so `fullName` is **calculated during render**. Behaviour must stay the same. The exported `renderCount` lets the tests count renders.",
      requirements: ["Same visible behaviour", "Exactly one render per keystroke (no effect-driven re-render)"],
      hints: ["If a value can be computed from props or state, don't store it in state.", "const fullName = `${first} ${last}`.trim(); — then delete the effect and the extra useState."],
      starterCode: `${effectImports}\n\nexport let renderCount = 0;\n\nfunction FullNameForm() {\n  renderCount++;\n  const [first, setFirst] = useState("");\n  const [last, setLast] = useState("");\n  const [fullName, setFullName] = useState("");\n\n  useEffect(() => {\n    setFullName(\`\${first} \${last}\`.trim());\n  }, [first, last]);\n\n  return (\n    <div>\n      <label>\n        First <input value={first} onChange={(e) => setFirst(e.target.value)} />\n      </label>\n      <label>\n        Last <input value={last} onChange={(e) => setLast(e.target.value)} />\n      </label>\n      <p>Full name: {fullName}</p>\n    </div>\n  );\n}\n\nexport default FullNameForm;\n`,
      solutionCode: `import { useState } from "react";\n\nexport let renderCount = 0;\n\nfunction FullNameForm() {\n  renderCount++;\n  const [first, setFirst] = useState("");\n  const [last, setLast] = useState("");\n  const fullName = \`\${first} \${last}\`.trim();\n\n  return (\n    <div>\n      <label>\n        First <input value={first} onChange={(e) => setFirst(e.target.value)} />\n      </label>\n      <label>\n        Last <input value={last} onChange={(e) => setLast(e.target.value)} />\n      </label>\n      <p>Full name: {fullName}</p>\n    </div>\n  );\n}\n\nexport default FullNameForm;\n`,
      explanation: "Effects are for synchronizing with things outside React. Deriving data from state isn't one of those: compute it during render, and it can never be out of date.",
      tests: [
        test("shows the full name", `renderComponent();\nawait userEvent.type(screen.getByLabelText("First"), "Ada");\nawait userEvent.type(screen.getByLabelText("Last"), "Byron");\nexpectText("Full name: Ada Byron");`),
        hidden("one render per keystroke", `renderComponent();\nconst before = userExports.renderCount;\nfireEvent.change(screen.getByLabelText("First"), { target: { value: "X" } });\nassertEqual(userExports.renderCount - before, 1, "A keystroke caused " + (userExports.renderCount - before) + " renders — derive fullName instead of syncing it with an effect");\nexpectText("Full name: X");`),
      ],
    },
  ],
};
