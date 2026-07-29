# CLAUDE.md — orientation for a fresh session

**The Writer's Workbench** — a static Jekyll site on GitHub Pages teaching
9th-grade writing. Repo `mrjohnsonloomis/grammar`. The user is the teacher
(Mr. Johnson); students are the end audience.

Three docs already exist and are the source of truth for their areas — read
them rather than re-deriving:

| Doc | Covers |
|---|---|
| `CONTRIBUTING.md` | Teaching philosophy, repo layout, the five-job color system, QA checklist |
| `SCHEMA.md` | Every `/data/*.json` contract + every component mount |
| `AUDIT.md` | Content-accuracy log — **append to it whenever you change content** |

This file holds what those don't: current structure, decisions made in
conversation, and environment gotchas.

---

## Structure (as of the last restructure)

Three **co-equal strands** — no hierarchy, students work at all three from day
one: **the sentence**, **writing**, and **the notebook**.

```
index.html          slim hub: 3 principles → 3 strand links → tools → sources
sentences.html      Sentences landing: 7-lesson TOC + concept map + color key
writing/index.html  Writing landing: the W2–W6 module TOC
notebook/index.html Notebook landing: the N1–N2 module TOC
```

The home page is deliberately **short**. It does not carry lesson lists or the
concept map — those live on the strand landings. Don't let it grow back.

**Sentences** — `lessons/01..07`, data in `data/sentences/*.json`.
**Writing** — `writing/*`, data in `data/writing/*.json`:

| Code | Page | Code | Page |
|---|---|---|---|
| W2 | `overview-inventory.html` | W5 | `audience.html` (hub) |
| W3 | `analytical-paragraph.html` (hub) | W5a | `audience-analysis.html` |
| W3a | `topic-sentences.html` | W5b | `writing-for-the-reader.html` |
| W3b | `quotation.html` | W6 | `feedback.html` |
| W4 | `narrative-memoir.html` | | |

**Notebook** — `notebook/*`, data in `data/notebook/*.json`:

| Code | Page |
|---|---|
| N1 | `free-writing.html` |
| N2 | `visual-notes.html` (hub) |
| N2a | `general-graphics.html` |
| N2b | `specific-exercises.html` |

### Page codes — the assignment convention
Every writing/notebook page sets `code: "Writing · W3a"` / `code: "Notebook ·
N2a"` in front matter; the layout renders it in the header eyebrow. **Codes
must stay stable** — the teacher assigns work by them ("do W5b tonight").
Sentence lessons use `lesson_num` (01–07) instead.

**W1 is retired, not reused.** Free Writing moved from `writing/` to
`notebook/` and became **N1**; the rest of the Writing codes were deliberately
*not* renumbered, so old assignments still resolve. `writing/free-writing.html`
remains as a meta-refresh redirect stub. Don't hand W1 to a new page.

When a module outgrows one screen it becomes a **hub page + focused
sub-pages** (W3 → W3a/W3b; W5 → W5a/W5b), not a longer page. The hub links
down; the nav rail shows sub-pages indented via `class="sub"`. Keep sections
assignable: give them `id`s so they can be linked directly.

---

## Design decisions (hold these unless the teacher changes them)

- **"The Annotated Page"** — Literata (serif) for writing being *studied*,
  Archivo (sans) for the teaching voice. Rules and whitespace instead of card
  chrome; margin notes; bracket diagrams. Light-only (projectors + school
  Chromebooks).
- **Wide measure.** `.container`/`.header`/`.arc-nav-inner` = **1180px**;
  `.prose` and `.section-sub` = **80ch**. The teacher explicitly disliked the
  old narrow column ("doesn't use more of the screen… requires more
  scrolling"). Don't narrow it back. Mobile rules unchanged.
- **Quotations use `.source-quote`, not `.pull`.** The big decorative
  pull-quote was rejected on aesthetics. `.source-quote` is quiet: small
  italic, thin left rule, optional `<cite>`. Goal is to read like the
  teacher's own source documents.
- **`.toc` / `.toc-row`** is the standard list pattern for any page index
  (`.toc-sub` for indented children). It lives in `components.css` — global,
  not page-scoped.
- **Colors answer "what job is this doing?"** — never "what is this called?"
  Five jobs (name/act/desc/sit/con) defined once in `tokens.css`. Structure is
  line *style*, never hue. Never rely on color alone.
- **`.vn-figs` / `.vn-fig`** (components.css) is the Notebook strand's figure
  grid: small hand-sketch SVGs showing the *shape* of a graphic. Graphite only
  (`.vn-ink`, `.vn-ink-soft`, `.vn-dot`) — these are structures, not word-jobs,
  so they never borrow the five job colors. `.wide` gives a 2-up layout.

## Pedagogical spine

- **Notice first.** The shared idea across the strands: "reading like a
  writer" (grammar) and Overview & Inventory (writing) are the same instinct.
- **The notebook is where thinking happens, in words or in shapes.** Free
  writing (N1) and visual notes (N2) are two ways of working the same page, not
  alternatives. Visual work is *thinking*, never decoration — if the graphic
  arrives after the thought, it's a diagram of your notes, not a tool.
- **The kernel, at two scales.** A *sentence* kernel is subject + verb
  (Lesson 01). A *paragraph* kernel is **one noticing** (W3). Both mean: build
  from the seed; don't staple parts together. Lesson 01 and W3 cross-link.
- **Evidence-first analysis.** Notice → ask "so what?" → claim (topic
  sentence) → prove with evidence + reasoning. The claim arrives *last*.
- **Construction over identification.** Combine/expand/imitate/revise must
  stay the majority of the practice bank (the validator enforces this).
- **Choices with effects, not rules with violations.** Prefer "which version
  hits harder" to "find the mistake."

### A rejected design, and why (don't rebuild it)
An earlier "build the paragraph" **slider** was rejected: it "suggests a
chronology that isn't always the same and neglects to start with noticing."
Its replacement is the `kernel` component — the paragraph visibly *grows* from
one noticing, and the proof is assembled by **drag-and-drop** (pair each quote
with its reasoning). It is a quick example, **not a drafting space**. If you
add interactives here, favor that shape.

---

## Hard constraints

- **No student data persistence. Ever.** No localStorage, cookies, or
  analytics; in-memory only. Every scratchpad says so on screen. The one
  sanctioned escape is **user-initiated export** (`GX.exportDoc` → `.doc`,
  `GX.exportPrint` → print/PDF), generated on the fly — and pages must say
  loudly that nothing is saved.
- **No Node build step, no framework.** Jekyll layouts + vanilla JS only.
- **Never fabricate content attributed to a real person.** When a source
  couldn't be fetched, the correct move was a visible placeholder + asking the
  teacher — not inventing plausible text. Quotations must be exact, MLA-cited,
  public-domain.
- Content lives in JSON, not in pages. Pages are front matter + prose + mounts.

---

## Workflow

```bash
# build (no Gemfile in repo — bundler will fail; use gem exec)
gem exec jekyll build --destination "$SCRATCH/_sitebuild"

# serve the BUILT site (Liquid must render), then QA against it
cd "$SCRATCH/_sitebuild" && nohup python3 -m http.server 8899 &
```

- **`/validate.html` must say ALL CHECKS PASSED** after any data change. Add
  checks there when you add a data shape or a new mount.
- **Playwright** is in the scratchpad's `node_modules`, but the bundled
  browser path is stale — launch with
  `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`.
- Font requests 403 in the sandbox; `ERR_CONNECTION_RESET` console errors for
  fonts are expected noise, not failures.
- Put harnesses/screenshots in the scratchpad, never in the repo (a stray
  `_qa_harness.html` will get committed).
- Git: develop on the assigned branch, `git push -u origin <branch>`, retry
  with backoff on network errors. Commit footers per harness instructions —
  **never put a model identifier in any repo artifact.**
- GitHub work goes through the `mcp__github__*` tools; there is no `gh` CLI.

### Environment gotchas
- The proxy **blocks literary/text sources** (Project Gutenberg, Wikisource,
  americanliterature.com) and goodstorycompany.com. Don't burn turns retrying;
  flag the unverified item instead of guessing.

---

## Open items

- **London spelling, unresolved.** `data/sentences/passages.json` (and the
  Adjective card's craft note) print British **"grey"** and
  **"little-travelled"**; the American 1908 original likely uses **"gray"** and
  **"traveled"**. Left as-is because the cited source (Gutenberg ebook 2429)
  is unreachable from this environment. Needs the teacher's confirmation
  before changing — three tokens plus the card note.
- W2/W4/W6 and N1 are short enough to stand alone; split them into hub +
  sub-pages the same way (W3, W5, N2) if they grow.
- **A figure from the Visual Notes PDF is missing.** Page 2 of the teacher's
  source doc says "He includes this picture, too" and embeds an image —
  presumably a plate from Sibbet's *Visual Meetings*. It isn't reproduced on
  N2 (couldn't be extracted here, and republishing a copyrighted plate on a
  public site is the wrong default). The prose reads fine without it; ask the
  teacher whether they want something in that spot.

## Working with this teacher

- Deliver the whole ask; if one part is genuinely blocked, finish everything
  else and say plainly what's left and why.
- Verify in a browser before claiming something works — this codebase's bugs
  (escaped HTML, unstyled page-scoped CSS, mis-targeted selectors) are the
  kind only rendering catches.
- Feedback often arrives as a numbered list mixing content, structure, and
  aesthetics. Ask only when readings would diverge materially; otherwise pick
  the sensible default, state it, and build.
