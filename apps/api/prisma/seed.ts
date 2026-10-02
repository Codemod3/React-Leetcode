import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { problemBank } from "../src/problem-bank/index.js";
import { contentHash } from "../src/problem-bank/content-hash.js";

// Written by `npm run problems:verify`: the props each problem's first public test renders
// with, so the browser preview can render prop-driven components meaningfully.
const PREVIEW_PROPS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "problem-bank", "preview-props.generated.json");
const previewProps: Record<string, unknown> = existsSync(PREVIEW_PROPS_FILE) ? JSON.parse(readFileSync(PREVIEW_PROPS_FILE, "utf-8")) : {};

// Problems live in src/problem-bank (one file per learning level) so they're type-checked
// and can be verified with `npm run problems:verify` before they ever reach the database.

const prisma = new PrismaClient();

async function upsertUser(username: string, email: string, password: string, role: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { username, email, passwordHash, role },
  });
}

async function main() {
  await upsertUser("admin", "admin@reactcode.dev", "admin12345", "ADMIN");
  await upsertUser("demo", "demo@reactcode.dev", "demo12345", "USER");

  // The seed only manages bank problems; admin-authored ones are left alone.
  const adminSlugs = new Set(
    (await prisma.problem.findMany({ where: { source: "admin" }, select: { slug: true } })).map((p) => p.slug)
  );
  const clash = problemBank.find((p) => adminSlugs.has(p.slug));
  if (clash) throw new Error(`Bank problem slug "${clash.slug}" is already used by an admin-authored problem — rename one of them.`);

  for (const p of problemBank) {
    const data = {
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      category: p.category,
      level: p.level,
      tags: JSON.stringify(p.tags),
      type: p.type,
      problemType: p.problemType,
      environment: JSON.stringify({ react: true, previewProps: previewProps[p.slug] ?? null }),
      contentHash: contentHash(p),
      mockApi: p.mockApi ? JSON.stringify(p.mockApi) : null,
      requirements: JSON.stringify(p.requirements),
      hints: JSON.stringify(p.hints),
      prerequisites: JSON.stringify(p.prerequisites),
      collections: JSON.stringify(p.collections),
      order: p.order,
      estimatedMinutes: p.estimatedMinutes ?? null,
      starterCode: p.starterCode,
      solutionCode: p.solutionCode,
      explanation: p.explanation,
      commonMistakes: JSON.stringify(p.commonMistakes ?? []),
      alternativeApproach: p.alternativeApproach ?? null,
      wrongSolutions: JSON.stringify(p.wrongSolutions ?? []),
      source: "bank",
    };

    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });

    await prisma.testCase.deleteMany({ where: { problemId: problem.id } });
    await prisma.testCase.createMany({
      data: p.tests.map((t, index) => ({
        problemId: problem.id,
        name: t.name,
        type: "INTERACTION",
        spec: JSON.stringify({ code: t.code }),
        isHidden: !!t.hidden,
        order: index,
      })),
    });
  }

  const removed = await prisma.problem.deleteMany({
    where: { source: "bank", slug: { notIn: problemBank.map((p) => p.slug) } },
  });

  // Keep admin-authored problems numbered after the bank, in their existing relative order.
  const adminProblems = await prisma.problem.findMany({ where: { source: "admin" }, orderBy: { order: "asc" }, select: { id: true } });
  for (const [i, p] of adminProblems.entries()) {
    await prisma.problem.update({ where: { id: p.id }, data: { order: problemBank.length + i + 1 } });
  }

  console.log(
    `Seeded ${problemBank.length} problems${removed.count ? `, removed ${removed.count} retired problem(s)` : ""}` +
      `${adminProblems.length ? `, kept ${adminProblems.length} admin problem(s)` : ""}.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
