# Wiki System Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a 2D wiki system to 3DFiler where users can create markdown wiki pages that reference 3D models and subsets of models.

**Architecture:** A new `WikiPage` entity with many-to-many links to `Model`. Wiki pages have title, unique slug, markdown content, and publish status. Frontend gets a wiki explorer, editor, and viewer that renders markdown alongside linked model galleries. Models show backlinks to wiki pages that reference them.

**Tech Stack:** React 19, Vite, Express, Prisma, SQLite, vanilla markdown rendering.

---

## Task 1: Add WikiPage model to Prisma schema

**Objective:** Create the database table for wiki pages and wire many-to-many relations to Model.

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Add WikiPage model and relation**

```prisma
model WikiPage {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  slug        String   @unique
  content     String   @default("")
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  models      Model[]

  @@index([userId])
  @@index([published])
  @@index([slug])
}
```

Also add `wikiPages WikiPage[]` to the `Model` model.

**Step 2: Add `wikiPages` relation to User model**

```prisma
model User {
  ...
  wikiPages WikiPage[]
}
```

**Step 3: Run migration**

Run:
```bash
cd /mnt/c/github/3Dfiler/backend && npx prisma migrate dev --name add_wiki_pages
```

Expected: Migration created and applied to SQLite database.

**Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add WikiPage model with Model many-to-many relation"
```

---

## Task 2: Create backend wiki routes

**Objective:** Build REST API for CRUD, publishing, model linking, and search.

**Files:**
- Create: `backend/src/routes/wiki.js`
- Modify: `backend/src/index.js`

**Step 1: Write wiki routes**

Create `backend/src/routes/wiki.js` with:
- `POST /` — create wiki page (auth). Auto-generate slug from title (kebab-case), ensure unique.
- `GET /mine` — list my wiki pages (auth)
- `GET /explore` — list published wiki pages (public)
- `GET /:id` — get single wiki page with linked models. For private pages, check owner or share token (reuse same pattern as models). Return `isOwner` flag.
- `GET /by-slug/:slug` — get wiki page by slug (same auth logic)
- `PATCH /:id` — update title/content/published (auth, owner only)
- `DELETE /:id` — delete (auth, owner only)
- `POST /:id/link-model` — link a model to wiki page (auth, owner only)
- `DELETE /:id/link-model/:modelId` — unlink a model (auth, owner only)
- `GET /search` — search my wiki pages by title/content (auth)

**Step 2: Register routes in index.js**

Add:
```js
import wikiRoutes from './routes/wiki.js';
app.use('/api/wiki', wikiRoutes);
```

**Step 3: Verify server starts**

Run:
```bash
cd /mnt/c/github/3Dfiler/backend && npm run dev
```
Expected: Server starts without errors. (Ctrl+C after check.)

**Step 4: Commit**

```bash
git add backend/src/routes/wiki.js backend/src/index.js
git commit -m "feat(api): add wiki CRUD, publishing, model linking, and search"
```

---

## Task 3: Add wiki pages to backend model response

**Objective:** When fetching a model, also return the wiki pages that reference it.

**Files:**
- Modify: `backend/src/routes/models.js` (GET /:id)

**Step 1: Query wiki page backlinks**

In the GET /:id handler, after the existing backlinks query, add:

```js
const wikiBacklinks = await prisma.wikiPage.findMany({
  where: { models: { some: { id: req.params.id } }, published: true },
  select: { id: true, title: true, slug: true }
});
```

If the viewer is the owner, also include unpublished wiki pages that link to it. Append `wikiBacklinks` to the response object.

**Step 2: Commit**

```bash
git add backend/src/routes/models.js
git commit -m "feat(api): include referencing wiki pages in model response"
```

---

## Task 4: Create frontend wiki pages

**Objective:** Add wiki explorer, viewer, and editor pages.

**Files:**
- Create: `frontend/src/pages/WikiExplore.jsx`
- Create: `frontend/src/pages/WikiPage.jsx`
- Create: `frontend/src/pages/WikiEdit.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Layout.jsx`

**Step 1: Write WikiExplore.jsx**

Public page listing published wiki pages in a grid. Each card shows title, truncated content preview, and linked model count. Clicking a card navigates to `/wiki/:slug`. Include a search filter.

**Step 2: Write WikiPage.jsx**

Viewer page at `/wiki/:slug`. Fetches wiki page by slug. Renders:
- Title
- Markdown content rendered to HTML (simple `<div dangerouslySetInnerHTML>` with CSS class `wiki-content`)
- Grid of linked models (cards linking to `/model/:id`)
- If owner, show "Edit" button linking to `/wiki/edit/:id`
- If not found/private, show appropriate message

**Step 3: Write WikiEdit.jsx**

Editor at `/wiki/edit/:id` (and `/wiki/new`). Form with:
- Title input
- Content textarea (markdown)
- Published checkbox
- "Linked Models" section: list current links with unlink buttons; dropdown to add more models from user's library
- Save / Cancel buttons

**Step 4: Update App.jsx routes**

Add inside Layout:
```jsx
<Route path="wiki" element={<WikiExplore />} />
<Route path="wiki/new" element={<WikiEdit />} />
<Route path="wiki/edit/:id" element={<WikiEdit />} />
```

And outside Layout:
```jsx
<Route path="/wiki/:slug" element={<WikiPage />} />
```

(Or inside Layout if you want the navbar — prefer inside Layout for consistency.)

Actually, put them inside Layout so nav shows:
```jsx
<Route path="wiki" element={<WikiExplore />} />
<Route path="wiki/:slug" element={<WikiPage />} />
<Route path="wiki/new" element={<WikiEdit />} />
<Route path="wiki/edit/:id" element={<WikiEdit />} />
```

**Step 5: Update Layout.jsx nav**

Add `<Link to="/wiki">Wiki</Link>` between Explore and Search.

**Step 6: Commit**

```bash
git add frontend/src/pages/WikiExplore.jsx frontend/src/pages/WikiPage.jsx frontend/src/pages/WikiEdit.jsx frontend/src/App.jsx frontend/src/components/Layout.jsx
git commit -m "feat(ui): add wiki explore, viewer, and editor pages"
```

---

## Task 5: Render wiki backlinks on ModelViewer

**Objective:** Show "Referenced in Wiki" section in the model viewer's left panel.

**Files:**
- Modify: `frontend/src/pages/ModelViewer.jsx`

**Step 1: Add wikiBacklinks state**

```js
const [wikiBacklinks, setWikiBacklinks] = useState([])
```

In the model fetch effect, set it from `data.wikiBacklinks`.

**Step 2: Render wiki backlinks in left panel**

Below the existing backlinks list, add a small section:
- Header: "Referenced in Wiki"
- List of wiki page titles linking to `/wiki/:slug`
- If empty, show nothing or "Not referenced in any wiki pages."

**Step 3: Commit**

```bash
git add frontend/src/pages/ModelViewer.jsx
git commit -m "feat(ui): show wiki page backlinks in model viewer"
```

---

## Task 6: Style wiki markdown content

**Objective:** Add CSS for rendered markdown so it looks good in the dark theme.

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add `.wiki-content` styles**

```css
.wiki-content { line-height: 1.7; color: #ccc; }
.wiki-content h1, .wiki-content h2, .wiki-content h3 { color: #e0e0e0; margin-top: 1.5rem; margin-bottom: 0.75rem; }
.wiki-content p { margin-bottom: 1rem; }
.wiki-content a { color: #4fc3f7; }
.wiki-content ul, .wiki-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
.wiki-content code { background: #1a1a1a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #81c784; }
.wiki-content pre { background: #111; padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid #222; }
.wiki-content blockquote { border-left: 3px solid #4fc3f7; padding-left: 1rem; color: #888; margin: 1rem 0; }
.wiki-content img { max-width: 100%; border-radius: 6px; }
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(ui): add wiki markdown content styles"
```

---

## Task 7: Test end-to-end

**Objective:** Run dev servers and verify the full flow.

**Files:** None (manual verification)

**Step 1: Start backend**

```bash
cd /mnt/c/github/3Dfiler/backend && npm run dev
```

**Step 2: Start frontend**

```bash
cd /mnt/c/github/3Dfiler/frontend && npm run dev
```

**Step 3: Manual test checklist**

- [ ] Navigate to `/wiki` — see empty state or list
- [ ] Create a new wiki page at `/wiki/new`
- [ ] Link a model to the wiki page
- [ ] View the wiki page at `/wiki/:slug` — see markdown and model gallery
- [ ] Open the linked model — see "Referenced in Wiki" section
- [ ] Edit the wiki page, change publish status
- [ ] Verify unpublished pages are hidden from other users
- [ ] Search/filter wiki pages

**Step 4: Commit any fixes**

Commit any small fixes discovered during testing.

---

## Done Criteria

- [ ] Users can create, edit, delete wiki pages
- [ ] Wiki pages support markdown content
- [ ] Wiki pages can link to multiple 3D models (subset display)
- [ ] Published wiki pages are browsable publicly at `/wiki`
- [ ] Model viewer shows which wiki pages reference the model
- [ ] Navigation includes a Wiki link
- [ ] All existing functionality remains intact
