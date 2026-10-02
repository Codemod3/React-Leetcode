import * as Babel from "@babel/standalone";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import * as ReactRouterDom from "react-router-dom";
import * as ReduxToolkit from "@reduxjs/toolkit";
import * as ReactRedux from "react-redux";
import * as Zustand from "zustand";
import * as ZustandMiddleware from "zustand/middleware";
import { matchMockRoute, type MockRoute } from "@reactcode/shared";

// Libraries learners may import in the preview — the same set the test runner provides.
const MODULES: Record<string, unknown> = {
  react: React,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOM,
  "react-router-dom": ReactRouterDom,
  "@reduxjs/toolkit": ReduxToolkit,
  "react-redux": ReactRedux,
  zustand: Zustand,
  "zustand/middleware": ZustandMiddleware,
};

/**
 * Turns the serialized props captured from a problem's first public test back into real
 * props: { __fn } becomes a function that reports its calls, { __el } a host element.
 */
export function deserializePreviewProps(value: unknown, onCall: (name: string, args: unknown[]) => void, key = "prop"): unknown {
  if (Array.isArray(value)) return value.map((v, i) => deserializePreviewProps(v, onCall, `${key}[${i}]`));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("__fn" in obj) return (...args: unknown[]) => onCall(key, args);
    if ("__el" in obj) {
      const props = (deserializePreviewProps(obj.props ?? {}, onCall, key) ?? {}) as Record<string, unknown>;
      const children = deserializePreviewProps(obj.children, onCall, key) as React.ReactNode;
      const type = obj.__el === "#fragment" ? React.Fragment : String(obj.__el);
      return React.createElement(type, props, children);
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deserializePreviewProps(v, onCall, k)]));
  }
  return value;
}

/**
 * Compiles untrusted TSX into a React component and renders it, purely so the
 * learner gets instant visual feedback. This is a convenience preview, NOT the
 * judge: it runs in the main browser tab with no isolation from the host page,
 * so correctness is never decided here. The real verdict always comes from the
 * server-side execution engine, which runs the code in its own process against
 * the official tests.
 */
export function compilePreviewComponent(code: string, mockApi: MockRoute[] | null): React.ComponentType {
  const transformed = Babel.transform(code, {
    filename: "component.tsx",
    presets: [
      ["typescript", { isTSX: true, allExtensions: true }],
      ["react", { runtime: "classic" }],
    ],
    plugins: ["transform-modules-commonjs"],
  }).code;

  if (!transformed) throw new Error("Compilation produced no output");

  const moduleShim = { exports: {} as Record<string, unknown> };
  const requireShim = (name: string) => {
    if (name in MODULES) return MODULES[name];
    throw new Error(`The preview can't import "${name}". Available: ${Object.keys(MODULES).join(", ")}`);
  };

  // Shadow the global fetch so preview requests hit the problem's mock routes,
  // matching what the test runner does on the server.
  const previewFetch = async (input: string, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const route = mockApi ? matchMockRoute(mockApi, method, String(input)) : null;
    if (route?.delayMs) await new Promise((r) => setTimeout(r, route.delayMs));
    const status = route ? route.status ?? 200 : 404;
    const body = route ? route.response : { error: `No mock route for ${method} ${input}` };
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  };

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("module", "exports", "require", "React", "fetch", transformed);
  fn(moduleShim, moduleShim.exports, requireShim, React, previewFetch);

  const exported = moduleShim.exports as { default?: unknown };
  const Component = exported.default ?? moduleShim.exports;

  if (typeof Component !== "function") {
    throw new Error("Your code must have a default export.");
  }

  return Component as React.ComponentType;
}

export class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
