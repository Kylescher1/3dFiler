-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_POI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'text',
    "nestedModelId" TEXT,
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "positionZ" REAL NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "POI_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "POI_nestedModelId_fkey" FOREIGN KEY ("nestedModelId") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_POI" ("content", "createdAt", "id", "modelId", "nestedModelId", "positionX", "positionY", "positionZ", "title", "type") SELECT "content", "createdAt", "id", "modelId", "nestedModelId", "positionX", "positionY", "positionZ", "title", "type" FROM "POI";
DROP TABLE "POI";
ALTER TABLE "new_POI" RENAME TO "POI";
CREATE INDEX "POI_modelId_idx" ON "POI"("modelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
