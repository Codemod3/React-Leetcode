import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { problemBank } from "../problem-bank/index.js";
import type { ResolvedProblem } from "../problem-bank/types.js";
import { verifyProblem } from "../problem-bank/verify.js";

// Usage: tsx src/scripts/verify-problems.ts [filter] [--concurrency=N]
// filter matches a slug substring or an exact category name.

const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith("--"));
const concurrency = Number(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 3);

const PREVIEW_PROPS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "problem-bank", "preview-props.generated.json");
const previewProps: Record<string, unknown> = existsSync(PREVIEW_PROPS_FILE)
  ? JSON.parse(readFileSync(PREVIEW_PROPS_FILE, "utf-8"))
  : {};

async function verify(p: ResolvedProblem): Promise<string[]> {
  const { issues, previewProps: captured } = await verifyProblem(p);
  if (captured) previewProps[p.slug] = captured;
  else delete previewProps[p.slug];
  return issues;
}

async function main() {
  const slugs = new Set<string>();
  const titles = new Set<string>();
  for (const p of problemBank) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
    if (titles.has(p.title)) throw new Error(`Duplicate title: ${p.title}`);
    slugs.add(p.slug);
    titles.add(p.title);
  }

  const selected = problemBank.filter((p) => !filter || p.category === filter || p.slug.includes(filter));
  console.log(`Verifying ${selected.length} of ${problemBank.length} problems (concurrency ${concurrency})...\n`);

  const failures: { problem: ResolvedProblem; issues: string[] }[] = [];
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < selected.length) {
      const p = selected[next++];
      const issues = await verify(p);
      done++;
      if (issues.length) failures.push({ problem: p, issues });
      console.log(`${issues.length ? "FAIL" : "ok  "} [${String(done).padStart(3)}/${selected.length}] #${p.order} ${p.slug}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const known = new Set(problemBank.map((p) => p.slug));
  const sorted = Object.fromEntries(Object.entries(previewProps).filter(([slug]) => known.has(slug)).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(PREVIEW_PROPS_FILE, JSON.stringify(sorted, null, 2) + "\n");

  if (failures.length) {
    console.log(`\n${failures.length} problem(s) failed verification:\n`);
    for (const f of failures.sort((a, b) => a.problem.order - b.problem.order)) {
      console.log(`#${f.problem.order} ${f.problem.slug}`);
      for (const issue of f.issues) console.log(`  - ${issue}`);
    }
    process.exit(1);
  }
  console.log(`\nAll ${selected.length} problems verified.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
