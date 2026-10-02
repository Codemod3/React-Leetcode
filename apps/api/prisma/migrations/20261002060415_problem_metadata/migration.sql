-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "problemType" TEXT NOT NULL DEFAULT 'BUILD',
    "environment" TEXT NOT NULL,
    "mockApi" TEXT,
    "requirements" TEXT NOT NULL,
    "hints" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "collections" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "starterCode" TEXT NOT NULL,
    "solutionCode" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL DEFAULT '[]',
    "alternativeApproach" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Problem" ("category", "createdAt", "description", "difficulty", "environment", "estimatedMinutes", "explanation", "hints", "id", "mockApi", "order", "requirements", "slug", "solutionCode", "starterCode", "tags", "title", "type", "updatedAt", "version") SELECT "category", "createdAt", "description", "difficulty", "environment", "estimatedMinutes", "explanation", "hints", "id", "mockApi", "order", "requirements", "slug", "solutionCode", "starterCode", "tags", "title", "type", "updatedAt", "version" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");
CREATE INDEX "Problem_category_idx" ON "Problem"("category");
CREATE INDEX "Problem_difficulty_idx" ON "Problem"("difficulty");
CREATE INDEX "Problem_order_idx" ON "Problem"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
