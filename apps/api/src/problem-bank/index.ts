import type { CategoryBank, ResolvedProblem } from "./types.js";
import { jsx } from "./01-jsx.js";
import { components } from "./02-components.js";
import { props } from "./03-props.js";
import { children } from "./04-children.js";
import { conditional } from "./05-conditional.js";
import { lists } from "./06-lists.js";
import { events } from "./07-events.js";
import { useStateBank } from "./08-usestate.js";
import { forms } from "./09-forms.js";
import { communication } from "./10-communication.js";
import { useEffectBank } from "./11-useeffect.js";
import { api } from "./12-api.js";
import { useRefBank } from "./13-useref.js";
import { customHooks } from "./14-custom-hooks.js";
import { debugging } from "./15-debugging.js";
import { router } from "./16-router.js";
import { context } from "./17-context.js";
import { useReducerBank } from "./18-usereducer.js";
import { redux } from "./19-redux.js";
import { zustand } from "./20-zustand.js";
import { typescript } from "./21-typescript.js";
import { testing } from "./22-testing.js";
import { performance } from "./23-performance.js";
import { accessibility } from "./24-accessibility.js";
import { realWorld } from "./25-real-world.js";

/** Categories in learning order. A problem's global number is its position in this list. */
export const categoryBanks: CategoryBank[] = [
  jsx,
  components,
  props,
  children,
  conditional,
  lists,
  events,
  useStateBank,
  forms,
  communication,
  useEffectBank,
  api,
  useRefBank,
  customHooks,
  debugging,
  router,
  context,
  useReducerBank,
  redux,
  zustand,
  typescript,
  testing,
  performance,
  accessibility,
  realWorld,
];

const COMPONENT_CATEGORIES = new Set(["JSX", "Components", "Props", "Children"]);
const HOOK_CATEGORIES = new Set(["useState", "useEffect", "useRef", "Custom Hooks"]);

function collectionsFor(p: Omit<ResolvedProblem, "collections">, componentIndex: number, hookIndex: number): string[] {
  const c: string[] = [];
  if (p.order <= 100) c.push("beginner-100");
  if (COMPONENT_CATEGORIES.has(p.category) && componentIndex < 100) c.push("components-100");
  if ((HOOK_CATEGORIES.has(p.category) || p.tags.some((t) => t.startsWith("use"))) && hookIndex < 100) c.push("hooks-100");
  if (p.category === "API") c.push("api-50");
  if (p.category === "Debugging" || p.problemType === "DEBUG") c.push("debugging-50");
  return c;
}

function resolve(): ResolvedProblem[] {
  const out: ResolvedProblem[] = [];
  let componentIndex = 0;
  let hookIndex = 0;
  for (const bank of categoryBanks) {
    for (const def of bank.problems) {
      const base = {
        ...def,
        category: bank.category,
        level: bank.level,
        order: out.length + 1,
        type: def.type ?? bank.type,
        problemType: def.problemType ?? "BUILD",
        prerequisites: Array.from(new Set([...bank.prerequisites, ...(def.prerequisites ?? [])])),
      };
      const collections = collectionsFor(base, componentIndex, hookIndex);
      if (collections.includes("components-100")) componentIndex++;
      if (collections.includes("hooks-100")) hookIndex++;
      out.push({ ...base, collections });
    }
  }
  return out;
}

export const problemBank: ResolvedProblem[] = resolve();
