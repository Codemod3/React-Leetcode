import { hidden, test, type CategoryBank } from "./types.js";

const click = (name: string) => `fireEvent.click(screen.getByRole("button", { name: ${JSON.stringify(name)} }));`;
const refStub = (name: string, imports = `import { useRef } from "react";`, params = "") =>
  `${imports}\n\nfunction ${name}(${params}) {\n  // Write your solution here\n  return null;\n}\n\nexport default ${name};\n`;

export const useRefBank: CategoryBank = {
  category: "useRef",
  level: 13,
  type: "HOOK",
  prerequisites: ["useState", "useEffect"],
  problems: [
    {
      slug: "ref-focus-button",
      title: "Focus an Input With a Button",
      difficulty: "EASY",
      tags: ["useRef", "dom", "focus"],
      estimatedMinutes: 8,
      description:
        "`useRef` gives you a box (`ref.current`) that can hold a DOM element. Make `FocusForm` render an input labelled `Name` and a button `Focus name`. Clicking the button moves keyboard focus into the input.",
      requirements: ["Clicking the button focuses the input"],
      hints: ["const inputRef = useRef<HTMLInputElement>(null);", "<input ref={inputRef} /> then inputRef.current?.focus() in the click handler."],
      starterCode: refStub("FocusForm"),
      solutionCode: `import { useRef } from "react";\n\nfunction FocusForm() {\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  return (\n    <div>\n      <label>\n        Name <input ref={inputRef} />\n      </label>\n      <button onClick={() => inputRef.current?.focus()}>Focus name</button>\n    </div>\n  );\n}\n\nexport default FocusForm;\n`,
      explanation: "When you pass a ref to a DOM element, React puts the element in ref.current after rendering. That's how you call DOM methods like focus() that have no declarative equivalent.",
      tests: [
        test("focuses the input", `renderComponent();\n${click("Focus name")}\nassertEqual(document.activeElement, screen.getByLabelText("Name"), "The Name input should have focus");`),
        hidden("doesn't focus before clicking", `renderComponent();\nassert(document.activeElement !== screen.getByLabelText("Name"), "Focus should only move on click");\n${click("Focus name")}\nassertEqual(document.activeElement, screen.getByLabelText("Name"));`),
      ],
    },
    {
      slug: "ref-focus-on-mount",
      title: "Focus an Input on Mount",
      difficulty: "EASY",
      tags: ["useRef", "useEffect", "focus"],
      estimatedMinutes: 8,
      description: "Make `SearchPage` render an input labelled `Search` that is focused as soon as the component appears. Use a ref and an effect.",
      requirements: ["The input has focus right after mounting"],
      hints: ["The ref is only filled in after render, so focus inside useEffect.", "useEffect(() => { ref.current?.focus(); }, []);"],
      starterCode: refStub("SearchPage", `import { useEffect, useRef } from "react";`),
      solutionCode: `import { useEffect, useRef } from "react";\n\nfunction SearchPage() {\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  useEffect(() => {\n    inputRef.current?.focus();\n  }, []);\n\n  return (\n    <label>\n      Search <input ref={inputRef} type="search" />\n    </label>\n  );\n}\n\nexport default SearchPage;\n`,
      explanation: "During render the DOM node doesn't exist yet. Effects run after React has attached it, so ref.current is ready.",
      alternativeApproach: "The autoFocus attribute does this declaratively for the simple case; the ref approach also works when the focus target is decided at runtime.",
      tests: [
        test("focused on mount", `renderComponent();\nassertEqual(document.activeElement, screen.getByLabelText("Search"));`),
        hidden("is a search input", `renderComponent();\nassertEqual(screen.getByLabelText("Search").getAttribute("type"), "search");\nassertEqual(document.activeElement, screen.getByLabelText("Search"));`),
      ],
    },
    {
      slug: "ref-uncontrolled-input",
      title: "Read an Uncontrolled Input With a Ref",
      difficulty: "EASY",
      tags: ["useRef", "forms", "uncontrolled-components"],
      estimatedMinutes: 10,
      description:
        "Not every input needs state. Make `QuickNote` render a `<form>` with an **uncontrolled** input labelled `Note` and a submit button `Save`. On submit, prevent the default, call `onSave` with the input's current value (read through a ref), then clear the input via the ref.",
      requirements: ["No useState for the input", "onSave gets the typed value", "Input is cleared after saving"],
      hints: ["inputRef.current.value reads the DOM value directly.", "Clear it with inputRef.current.value = \"\"."],
      starterCode: refStub("QuickNote", `import { useRef, type FormEvent } from "react";`, "{ onSave }: { onSave: (note: string) => void }"),
      solutionCode: `import { useRef, type FormEvent } from "react";\n\nfunction QuickNote({ onSave }: { onSave: (note: string) => void }) {\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  function handleSubmit(event: FormEvent) {\n    event.preventDefault();\n    if (!inputRef.current) return;\n    onSave(inputRef.current.value);\n    inputRef.current.value = "";\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <label>\n        Note <input ref={inputRef} />\n      </label>\n      <button type="submit">Save</button>\n    </form>\n  );\n}\n\nexport default QuickNote;\n`,
      explanation: "Uncontrolled inputs keep their value in the DOM. That's fine when you only need the value at submit time and nothing else on screen depends on it.",
      tests: [
        test("saves the note", `const onSave = mockFn();\nrenderComponent({ onSave });\nawait userEvent.type(screen.getByLabelText("Note"), "buy oats");\n${click("Save")}\nassertEqual(onSave.calls, [["buy oats"]]);`),
        hidden("clears after saving", `renderComponent({ onSave: () => {} });\nawait userEvent.type(screen.getByLabelText("Note"), "x");\n${click("Save")}\nassertEqual(screen.getByLabelText("Note").value, "");`),
      ],
    },
    {
      slug: "ref-scroll-into-view",
      title: "Scroll to a Section",
      difficulty: "EASY",
      tags: ["useRef", "dom", "scrolling"],
      estimatedMinutes: 10,
      description:
        "Make `LandingPage` render a button `See pricing` and, further down, `<section id=\"pricing\"><h2>Pricing</h2></section>`. Clicking the button calls `scrollIntoView({ behavior: \"smooth\" })` on that section via a ref.",
      requirements: ["Ref attached to the pricing section", "Scrolls smoothly on click"],
      hints: ["const sectionRef = useRef<HTMLElement>(null);", "sectionRef.current?.scrollIntoView({ behavior: \"smooth\" })"],
      starterCode: refStub("LandingPage"),
      solutionCode: `import { useRef } from "react";\n\nfunction LandingPage() {\n  const pricingRef = useRef<HTMLElement>(null);\n\n  return (\n    <div>\n      <button onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}>See pricing</button>\n      <section id="pricing" ref={pricingRef}>\n        <h2>Pricing</h2>\n      </section>\n    </div>\n  );\n}\n\nexport default LandingPage;\n`,
      explanation: "Scrolling is an imperative browser action, so it's done through a ref to the target element.",
      tests: [
        test("scrolls to pricing", `const calls = [];\nconst original = window.HTMLElement.prototype.scrollIntoView;\nwindow.HTMLElement.prototype.scrollIntoView = function (opts) { calls.push({ id: this.id, opts }); };\ntry {\n  renderComponent();\n  ${click("See pricing")}\n} finally {\n  window.HTMLElement.prototype.scrollIntoView = original;\n}\nassertEqual(calls, [{ id: "pricing", opts: { behavior: "smooth" } }]);`),
        hidden("doesn't scroll on render", `const calls = [];\nconst original = window.HTMLElement.prototype.scrollIntoView;\nwindow.HTMLElement.prototype.scrollIntoView = function () { calls.push(this.id); };\ntry {\n  renderComponent();\n} finally {\n  window.HTMLElement.prototype.scrollIntoView = original;\n}\nassertEqual(calls.length, 0);\nscreen.getByRole("heading", { name: "Pricing" });`),
      ],
    },
    {
      slug: "ref-avoid-rerender",
      title: "Store a Value Without Re-rendering",
      difficulty: "EASY",
      tags: ["useRef", "performance"],
      estimatedMinutes: 10,
      description:
        "Make `ClickTracker` accept `onReport`. A button `Click` counts clicks **without re-rendering** the component (the count isn't shown). A button `Report` calls `onReport(count)`.\n\nThe exported `renderCount` is used by the tests to make sure clicking doesn't re-render.",
      requirements: ["Clicks are counted", "Counting doesn't cause re-renders", "Report sends the count"],
      hints: ["Changing ref.current doesn't trigger a render; calling a state setter does.", "const clicks = useRef(0); clicks.current += 1;"],
      starterCode: `import { useRef } from "react";\n\nexport let renderCount = 0;\n\nfunction ClickTracker({ onReport }: { onReport: (count: number) => void }) {\n  renderCount++;\n  // Write your solution here\n  return null;\n}\n\nexport default ClickTracker;\n`,
      solutionCode: `import { useRef } from "react";\n\nexport let renderCount = 0;\n\nfunction ClickTracker({ onReport }: { onReport: (count: number) => void }) {\n  renderCount++;\n  const clicks = useRef(0);\n\n  return (\n    <div>\n      <button onClick={() => (clicks.current += 1)}>Click</button>\n      <button onClick={() => onReport(clicks.current)}>Report</button>\n    </div>\n  );\n}\n\nexport default ClickTracker;\n`,
      explanation: "Use state for values that affect what's on screen; use refs for values you need to remember but never display (timer ids, counters for analytics, previous values).",
      tests: [
        test("reports the count", `const onReport = mockFn();\nrenderComponent({ onReport });\n${click("Click")}\n${click("Click")}\n${click("Click")}\n${click("Report")}\nassertEqual(onReport.calls, [[3]]);`),
        hidden("clicking does not re-render", `renderComponent({ onReport: () => {} });\nconst before = userExports.renderCount;\n${click("Click")}\n${click("Click")}\nassertEqual(userExports.renderCount - before, 0, "Clicking re-rendered the component — use a ref instead of state");`),
      ],
      wrongSolutions: [`import { useState } from "react";\nexport let renderCount = 0;\nfunction ClickTracker({ onReport }) {\n  renderCount++;\n  const [c, setC] = useState(0);\n  return (<div><button onClick={() => setC(c + 1)}>Click</button><button onClick={() => onReport(c)}>Report</button></div>);\n}\nexport default ClickTracker;\n`],
    },
    {
      slug: "ref-previous-value",
      title: "Remember the Previous Value",
      difficulty: "MEDIUM",
      tags: ["useRef", "useEffect"],
      estimatedMinutes: 15,
      description:
        "Make `PriceTicker` accept `price` and render `<p>Now: {price}, before: {previous}</p>`, where `previous` is the price from the previous render, or `none` on the first render.",
      requirements: ["Shows 'none' initially", "Shows the previous price after an update"],
      hints: [
        "A ref survives renders without causing them.",
        "Read ref.current during render (the old value), then update it in an effect (after render).",
      ],
      starterCode: refStub("PriceTicker", `import { useEffect, useRef } from "react";`, "{ price }: { price: number }"),
      solutionCode: `import { useEffect, useRef } from "react";\n\nfunction PriceTicker({ price }: { price: number }) {\n  const previousRef = useRef<number | null>(null);\n\n  useEffect(() => {\n    previousRef.current = price;\n  }, [price]);\n\n  return (\n    <p>\n      Now: {price}, before: {previousRef.current ?? "none"}\n    </p>\n  );\n}\n\nexport default PriceTicker;\n`,
      explanation: "During render the ref still holds the value from last time; the effect then records the current value for the next render.",
      tests: [
        test("initial render", `renderComponent({ price: 10 });\nexpectText("Now: 10, before: none");`),
        hidden("tracks previous values", `const { rerender } = renderComponent({ price: 10 });\nrerender(<Component price={12} />);\nexpectText("Now: 12, before: 10");\nrerender(<Component price={9} />);\nexpectText("Now: 9, before: 12");`),
      ],
    },
    {
      slug: "ref-stopwatch",
      title: "Stopwatch With an Interval Ref",
      difficulty: "MEDIUM",
      tags: ["useRef", "timers", "useState"],
      estimatedMinutes: 20,
      description:
        "Make `Stopwatch` accept `tickMs` (default 100) and show `<p>Ticks: {n}</p>`. Buttons:\n\n- `Start` → add 1 every `tickMs`\n- `Stop` → pause\n- `Reset` → stop and go back to 0\n\nStore the interval id in a ref. Pressing `Start` twice must **not** run two intervals at once. Clear the interval if the component unmounts.",
      requirements: ["Start/Stop/Reset work", "Double Start doesn't double the speed", "Interval cleared on unmount"],
      hints: [
        "const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);",
        "In start: if (intervalRef.current) return;",
        "A cleanup-only effect: useEffect(() => () => clearInterval(...), [])",
      ],
      starterCode: refStub("Stopwatch", `import { useEffect, useRef, useState } from "react";`, "{ tickMs = 100 }: { tickMs?: number }"),
      solutionCode: `import { useEffect, useRef, useState } from "react";\n\nfunction Stopwatch({ tickMs = 100 }: { tickMs?: number }) {\n  const [ticks, setTicks] = useState(0);\n  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);\n\n  function stop() {\n    if (intervalRef.current) clearInterval(intervalRef.current);\n    intervalRef.current = null;\n  }\n\n  function start() {\n    if (intervalRef.current) return;\n    intervalRef.current = setInterval(() => setTicks((t) => t + 1), tickMs);\n  }\n\n  function reset() {\n    stop();\n    setTicks(0);\n  }\n\n  useEffect(() => stop, []);\n\n  return (\n    <div>\n      <p>Ticks: {ticks}</p>\n      <button onClick={start}>Start</button>\n      <button onClick={stop}>Stop</button>\n      <button onClick={reset}>Reset</button>\n    </div>\n  );\n}\n\nexport default Stopwatch;\n`,
      explanation: "The interval id must survive renders but never appears on screen — exactly what refs are for. Storing it in state would trigger pointless renders.",
      tests: [
        test("starts and stops", `renderComponent({ tickMs: 20 });\n${click("Start")}\nawait sleep(110);\n${click("Stop")}\nconst text = screen.getByText(/Ticks:/).textContent;\nassert(Number(text.replace("Ticks: ", "")) >= 3, "Expected several ticks, got " + text);\nawait sleep(80);\nassertEqual(screen.getByText(/Ticks:/).textContent, text, "Ticks kept increasing after Stop");`),
        hidden("double start is not faster; reset", `renderComponent({ tickMs: 30 });\n${click("Start")}\n${click("Start")}\nawait sleep(160);\n${click("Stop")}\nconst n = Number(screen.getByText(/Ticks:/).textContent.replace("Ticks: ", ""));\nassert(n <= 6, "Got " + n + " ticks in 160ms at 30ms — two intervals are running");\n${click("Reset")}\nexpectText("Ticks: 0");`),
      ],
      wrongSolutions: [`import { useRef, useState } from "react";\nfunction Stopwatch({ tickMs = 100 }) {\n  const [t, setT] = useState(0);\n  const ref = useRef(null);\n  return (<div><p>Ticks: {t}</p><button onClick={() => { ref.current = setInterval(() => setT((x) => x + 1), tickMs); }}>Start</button><button onClick={() => clearInterval(ref.current)}>Stop</button><button onClick={() => { clearInterval(ref.current); setT(0); }}>Reset</button></div>);\n}\nexport default Stopwatch;\n`],
    },
    {
      slug: "ref-click-outside",
      title: "Close a Menu on Click Outside",
      difficulty: "MEDIUM",
      tags: ["useRef", "useEffect", "event-listeners"],
      estimatedMinutes: 20,
      description:
        "Make `UserMenu` render a button `Account` that toggles a `<ul role=\"menu\">` with items `Profile` and `Sign out` (each `<li role=\"menuitem\">`). While open, a `mousedown` **outside** the component closes the menu; a mousedown inside it doesn't.",
      requirements: ["Account toggles the menu", "Clicking outside closes it", "Clicking inside keeps it open", "Listener removed when closed/unmounted"],
      hints: [
        "Put a ref on a wrapper <div> around the button and the menu.",
        "In an effect (only while open), listen for mousedown on document and check !ref.current.contains(event.target).",
      ],
      starterCode: refStub("UserMenu", `import { useEffect, useRef, useState } from "react";`),
      solutionCode: `import { useEffect, useRef, useState } from "react";\n\nfunction UserMenu() {\n  const [open, setOpen] = useState(false);\n  const containerRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!open) return;\n    function handleMouseDown(event: MouseEvent) {\n      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);\n    }\n    document.addEventListener("mousedown", handleMouseDown);\n    return () => document.removeEventListener("mousedown", handleMouseDown);\n  }, [open]);\n\n  return (\n    <div ref={containerRef}>\n      <button aria-expanded={open} onClick={() => setOpen((o) => !o)}>\n        Account\n      </button>\n      {open && (\n        <ul role="menu">\n          <li role="menuitem">Profile</li>\n          <li role="menuitem">Sign out</li>\n        </ul>\n      )}\n    </div>\n  );\n}\n\nexport default UserMenu;\n`,
      explanation: "The ref lets the document-level listener ask 'did this click happen inside my component?'. Subscribing only while open avoids running the check when it can't matter.",
      tests: [
        test("toggles the menu", `renderComponent();\n${click("Account")}\nscreen.getByRole("menu");\n${click("Account")}\nassert(!screen.queryByRole("menu"));`),
        hidden("closes on outside click only", `renderComponent();\n${click("Account")}\nfireEvent.mouseDown(screen.getByRole("menuitem", { name: "Profile" }));\nscreen.getByRole("menu");\nfireEvent.mouseDown(document.body);\nassert(!screen.queryByRole("menu"), "Clicking outside should close the menu");`),
      ],
    },
  ],
};
