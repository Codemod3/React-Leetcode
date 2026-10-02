// This script is the Code Execution Environment. It runs as a separate OS process
// (spawned by LocalExecutionService), never inside the main API server process.
// It has a hard wall-clock timeout and memory cap enforced by the parent, and it
// never touches the database, the filesystem outside its temp dir, or the network
// except through the mocked fetch below.
"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");
const { JSDOM } = require("jsdom");
const esbuild = require("esbuild");

const RESULT_MARKER = "__REACTCODE_RESULT__";

// Plain-text, size-limited DOM dumps in testing-library error messages.
process.env.COLORS = "false";
process.env.DEBUG_PRINT_LIMIT = "1200";

function cleanMessage(message) {
  // eslint-disable-next-line no-control-regex
  const plain = String(message).replace(/\u001b\[[0-9;]*m/g, "");
  return plain.length > 2000 ? plain.slice(0, 2000) + "\n…" : plain;
}

function fail(status, message, stack) {
  process.stdout.write(
    "\n" + RESULT_MARKER + JSON.stringify({ status, testsPassed: 0, totalTests: 0, tests: [], error: { message, stack } })
  );
  process.exit(0);
}

async function main() {
  const tempDir = process.argv[2];
  if (!tempDir) fail("RUNTIME_ERROR", "No working directory supplied to runner");

  const userCodeRaw = fs.readFileSync(path.join(tempDir, "component.tsx"), "utf-8");
  const tests = JSON.parse(fs.readFileSync(path.join(tempDir, "tests.json"), "utf-8"));
  const mockApi = JSON.parse(fs.readFileSync(path.join(tempDir, "mockApi.json"), "utf-8"));

  // --- jsdom global environment, scoped to this process only ---
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });

  function setGlobal(key, value) {
    try {
      global[key] = value;
    } catch {
      try {
        Object.defineProperty(global, key, { value, configurable: true, writable: true });
      } catch {
        /* non-configurable built-ins: keep Node's version */
      }
    }
  }

  setGlobal("window", dom.window);
  setGlobal("document", dom.window.document);
  setGlobal("navigator", dom.window.navigator);
  setGlobal("HTMLElement", dom.window.HTMLElement);
  setGlobal("Node", dom.window.Node);
  setGlobal("getComputedStyle", dom.window.getComputedStyle);
  // Node 24 ships its own (file-backed) localStorage/sessionStorage globals, so the
  // generic copy below would skip them — map jsdom's in-memory ones explicitly.
  setGlobal("localStorage", dom.window.localStorage);
  setGlobal("sessionStorage", dom.window.sessionStorage);
  // Same for DOM-facing constructors Node also defines: user code like
  // `new FormData(formElement)` or `window.dispatchEvent(new Event("resize"))`
  // only works with jsdom's versions.
  for (const name of ["FormData", "Event", "CustomEvent", "Blob", "File", "FileList"]) {
    setGlobal(name, dom.window[name]);
  }
  Object.getOwnPropertyNames(dom.window)
    .filter((k) => !(k in global))
    .forEach((k) => setGlobal(k, dom.window[k]));

  // Mock API: a list of routes the problem declares. Every request is recorded in
  // `mockApi.calls` so tests can verify the learner actually talked to the API,
  // and tests may swap routes (`mockApi.setRoutes`) to defeat hardcoded data.
  const initialRoutes = Array.isArray(mockApi) ? mockApi : [];
  const api = {
    routes: initialRoutes,
    calls: [],
    setRoutes(routes) {
      api.routes = routes;
    },
    reset() {
      api.routes = initialRoutes;
      api.calls = [];
    },
  };

  function matchRoute(method, rawUrl) {
    const url = rawUrl.replace(/^https?:\/\/[^/]+/, "");
    const p = url.split("?")[0];
    const same = (r) => (r.method || "GET").toUpperCase() === method.toUpperCase();
    return (
      api.routes.find((r) => same(r) && r.url === url) ||
      api.routes.find((r) => same(r) && !r.url.includes("?") && r.url === p) ||
      null
    );
  }

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
    const method = ((init && init.method) || "GET").toUpperCase();
    let body = init && init.body !== undefined ? init.body : null;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* leave non-JSON bodies as strings */
      }
    }
    api.calls.push({ method, url: url.replace(/^https?:\/\/[^/]+/, ""), body, headers: (init && init.headers) || {} });

    if (init && init.signal && init.signal.aborted) {
      const e = new Error("The operation was aborted.");
      e.name = "AbortError";
      throw e;
    }

    const route = matchRoute(method, url);
    if (route && route.delayMs) {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, route.delayMs);
        if (init && init.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(t);
            const e = new Error("The operation was aborted.");
            e.name = "AbortError";
            reject(e);
          });
        }
      });
    }
    const status = route ? route.status || 200 : 404;
    const payload = route ? route.response : { error: `No mock route for ${method} ${url}` };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => JSON.parse(JSON.stringify(payload)),
      text: async () => JSON.stringify(payload),
    };
  };

  // Resolve node_modules relative to the API app (spawned with that cwd) so user/test
  // code can `import ... from "react"` etc.
  const resolveRoot = path.join(process.cwd(), "sandbox-entry.js");

  function compileModule(source, loader) {
    const { code } = esbuild.transformSync(source, { loader, format: "cjs", target: "es2020", jsx: "automatic" });
    const m = new Module(resolveRoot, module);
    m.filename = resolveRoot;
    m.paths = Module._nodeModulePaths(path.dirname(resolveRoot));
    m._compile(code, resolveRoot);
    return m.exports;
  }

  let userModule;
  try {
    userModule = compileModule(userCodeRaw, "tsx");
  } catch (err) {
    return fail("COMPILE_ERROR", err && err.message ? err.message : String(err), err && err.stack);
  }

  const Component = userModule.default || userModule.Component || userModule;
  if (typeof Component !== "function") {
    return fail("COMPILE_ERROR", "Your code must have a default export (the component or hook the problem asks for).");
  }

  // Everything tests use is resolved from the same place as the learner's imports, so
  // e.g. a test's <MemoryRouter> and the learner's <Routes> share one react-router instance.
  const sandboxRequire = Module.createRequire(resolveRoot);
  const React = sandboxRequire("react");
  const RTL = sandboxRequire("@testing-library/react");
  const userEvent = sandboxRequire("@testing-library/user-event").default;
  const { expect } = sandboxRequire("expect");
  expect.extend(sandboxRequire("@testing-library/jest-dom/matchers"));
  const { fn } = sandboxRequire("jest-mock");

  // --- preview props: what the first public test renders the component with ---
  let capturing = false;
  let previewProps;
  function serialize(value, depth) {
    if (depth > 8) return null;
    if (typeof value === "function") return { __fn: value.name || "callback" };
    if (React.isValidElement(value)) {
      const isHost = typeof value.type === "string";
      if (!isHost && value.type !== React.Fragment) return null;
      const { children, ...rest } = value.props;
      return { __el: isHost ? value.type : "#fragment", props: serialize(rest, depth + 1), children: serialize(children, depth + 1) };
    }
    if (Array.isArray(value)) return value.map((v) => serialize(v, depth + 1));
    if (value && typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value)) out[key] = serialize(value[key], depth + 1);
      return out;
    }
    return value;
  }
  function capture(props) {
    if (capturing && previewProps === undefined) previewProps = serialize(props || {}, 0);
  }
  const TestReact = Object.assign({}, React, {
    createElement(type, props, ...children) {
      if (type === Component) {
        capture({ ...(props || {}), ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) });
      }
      return React.createElement(type, props, ...children);
    },
  });

  // --- type checking for TypeScript problems (lazy: only loads the compiler when used) ---
  let ts;
  const libCache = new Map();
  function typeCheck(extra) {
    ts = ts || sandboxRequire("typescript");
    const file = path.join(process.cwd(), "__sandbox__", "solution.tsx");
    const source = userCodeRaw + (extra ? "\n" + extra : "");
    const options = {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      types: [],
    };
    const host = ts.createCompilerHost(options);
    const isUserFile = (name) => path.resolve(name) === path.resolve(file);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, lang, ...rest) => {
      if (isUserFile(name)) return ts.createSourceFile(name, source, lang, true);
      if (!libCache.has(name)) libCache.set(name, getSourceFile(name, lang, ...rest));
      return libCache.get(name);
    };
    const fileExists = host.fileExists.bind(host);
    host.fileExists = (name) => isUserFile(name) || fileExists(name);
    const readFile = host.readFile.bind(host);
    host.readFile = (name) => (isUserFile(name) ? source : readFile(name));
    const program = ts.createProgram([file], options, host);
    return ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && isUserFile(d.file.fileName))
      .map((d) => {
        const { line } = d.file.getLineAndCharacterOfPosition(d.start || 0);
        return `line ${line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`;
      });
  }

  const consoleErrors = [];
  console.error = (...args) => consoleErrors.push(args.map(String).join(" "));

  const fmt = (v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  const helpers = {
    React: TestReact,
    Component,
    lib: (name) => sandboxRequire(name),
    expect,
    fn,
    typeCheck,
    userExports: userModule,
    mockApi: api,
    render: RTL.render,
    cleanup: RTL.cleanup,
    renderHook: RTL.renderHook,
    act: RTL.act,
    screen: RTL.screen,
    fireEvent: RTL.fireEvent,
    waitFor: RTL.waitFor,
    within: RTL.within,
    userEvent,
    renderComponent: (props) => {
      capture(props);
      return RTL.render(React.createElement(Component, props || {}));
    },
    assert: (cond, message) => {
      if (!cond) throw new Error(message || "Assertion failed");
    },
    assertEqual: (actual, expected, message) => {
      if (fmt(actual) !== fmt(expected)) {
        throw new Error(`${message ? message + "\n" : ""}Expected: ${fmt(expected)}\nReceived: ${fmt(actual)}`);
      }
    },
    expectText: (text) => RTL.screen.getByText(text),
    expectNoText: (text, message) => {
      if (RTL.screen.queryByText(text)) {
        throw new Error(message || `Expected "${text}" not to be on the screen, but it was`);
      }
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    mockFn: (impl) => {
      const f = (...args) => {
        f.calls.push(args);
        return impl ? impl(...args) : undefined;
      };
      f.calls = [];
      return f;
    },
    captureConsoleErrors: async (fn) => {
      const start = consoleErrors.length;
      await fn();
      return consoleErrors.slice(start);
    },
    // React logs each kind of warning only once per process, so warning checks must
    // search everything logged since the run started, not just the current test.
    anyConsoleError: (...substrings) => consoleErrors.some((m) => substrings.some((s) => m.includes(s))),
  };

  // Errors thrown during async re-renders (e.g. after a fetch resolves) escape the test's
  // own try/catch. Record them and fail the current test instead of crashing the process.
  let asyncError = null;
  process.on("uncaughtException", (err) => {
    asyncError = asyncError || err;
  });
  process.on("unhandledRejection", (err) => {
    asyncError = asyncError || err;
  });

  const results = [];
  const toRun = tests;

  for (const test of toRun) {
    const start = Date.now();
    api.reset();
    capturing = !test.isHidden;
    asyncError = null;
    try {
      const wrapped = `(async (helpers) => { const {${Object.keys(helpers).join(
        ", "
      )}} = helpers;\n${test.code}\n})`;
      const { code: compiledTest } = esbuild.transformSync(wrapped, {
        loader: "jsx",
        // Classic runtime: the automatic one emits an `import`, which can't be eval'd.
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment",
        target: "es2020",
      });
      // eslint-disable-next-line no-eval
      const testFn = eval(compiledTest);
      await testFn(helpers);
      if (asyncError) throw asyncError;
      results.push({ id: test.id, name: test.name, passed: true, hidden: test.isHidden });
    } catch (err) {
      const cause = asyncError || err;
      const message = cause && cause.message ? cause.message : String(cause);
      results.push({
        id: test.id,
        name: test.name,
        passed: false,
        hidden: test.isHidden,
        error: cleanMessage(asyncError ? `Your component threw while re-rendering: ${message}` : message),
      });
    } finally {
      RTL.cleanup();
    }
    void start;
  }

  const passed = results.filter((r) => r.passed).length;
  const status = passed === results.length ? "PASSED" : "FAILED";

  process.stdout.write(
    "\n" +
      RESULT_MARKER +
      JSON.stringify({
        status,
        testsPassed: passed,
        totalTests: results.length,
        tests: results,
        previewProps,
      })
  );
  process.exit(0);
}

main().catch((err) => fail("RUNTIME_ERROR", err && err.message ? err.message : String(err), err && err.stack));
