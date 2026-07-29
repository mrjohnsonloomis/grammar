# CONTRIBUTING.md — how to add to The Writer's Workbench

**The Writer's Workbench** runs three **co-equal strands** (no hierarchy —
students work at all of them from day one):

- **The sentence** — our approach to *grammar*, taught as construction.
  `/lessons/*` + `/data/sentences/*`.
- **Writing** — writing as an *iterative process*: analytical paragraphs,
  narrative memoir, audience, feedback. `/writing/*` + `/data/writing/*`.
- **The notebook** — thinking on the page: free writing and visual notes.
  `/notebook/*` + `/data/notebook/*`.

All three share the layout, components, color system, and philosophy below.
The writing and notebook strands reuse the sentence components by pointing
them at their own data with `data-file` (e.g. `data-file="notebook/cards"`) —
if a component can't be reused, fix the component, don't fork it. The strands
share one core idea: **notice first** ("reading like a writer" in grammar =
Overview &amp; Inventory in writing = the inventory-then-cluster move in the
notebook).

## The guiding philosophy (read before writing any content)

This site teaches sentences as things students **build**, not specimens they
dissect. Research (Hillocks 1986; Graham & Perin, *Writing Next*, 2007) shows
that identification-and-parsing grammar instruction does not improve writing,
while sentence combining does. So construction activities — combine, expand,
imitate, revise — are the dominant activity type and must stay the majority of
the practice bank (the validator enforces this). Identification remains as
"reading like a writer": noticing the moves an author made. Grammar concepts
are introduced when a writing move requires them and framed as **choices with
effects, not rules with violations** — prefer "which version hits harder" to
"find the mistake." Every lesson follows the same arc: **Notice** (annotated
mentor sentences) → **Name** (reference cards) → **Build** (construction
practice) → **Apply** (revise or write something). Terminology follows the
*Holt Handbook* (Third Course) so students meet the same terms elsewhere; MLA
(9th ed.) governs citations.

## Repo layout

```
_layouts/default.html         shared shell: head, nav, header, up-next, footer, scripts
assets/css/tokens.css         colors (THE tag-color legend lives here), spacing, type
assets/css/components.css     all component styles
assets/js/main.js             bootstrap: GX namespace, data loader, mount scanner
assets/js/components/         highlighter, tour(+compare), cards(+glossary),
                              sentence-builder, combiner(construct+recall), quiz
data/sentences/*.json         ALL lesson content (see SCHEMA.md — the contract)
data/writing/*.json           the Writing strand's content
data/notebook/*.json          the Notebook strand's content
lessons/NN-slug.html          thin pages: front matter + intro prose + mounts
index.html                    slim hub → links to the three strand landings
sentences.html                Sentences landing: 7-lesson TOC + concept map
writing/index.html            Writing landing: the W2–W6 module TOC
notebook/index.html           Notebook landing: the N1–N2 module TOC
practice.html glossary.html validate.html
AUDIT.md                      content-accuracy log — append when you change content
```

**Page codes (for assigning specific sections).** Sentence lessons use
`lesson_num` (01–07). Writing and notebook pages set a `code:` front-matter
field — `Writing · W2` … `W6` and `Notebook · N1` … `N2`, with sub-pages
lettered (`W3a`, `W5b`, `N2a`) — which renders in the header eyebrow. A module
that grows past one screen becomes a short **hub page** plus focused
**sub-pages** (e.g. W3 → W3a Topic Sentences, W3b Quoting a Text); the hub
links down and the nav rail shows sub-pages indented (`.sub`). Keep codes
stable — they're how work gets assigned. **W1 is retired:** Free Writing moved
to the Notebook strand as N1 and the other W codes were left alone rather than
renumbered, so previously assigned codes still resolve. Never reuse W1.

Hard constraints: static GitHub Pages site (Jekyll layouts only — **no Node
build step, no framework**); **no student data persistence** (no localStorage,
no cookies, no analytics; in-memory/sessionStorage only — construction
scratchpads must never save what students type).

## Adding content

**A passage** → `data/sentences/passages.json`. Public-domain source only,
quoted exactly from a citable edition, MLA `attribution` required. Tag every
word with one of the **eight** POS tags (articles = `adjective` subtype
`article`; see the participle convention in AUDIT.md §3). Give load-bearing
words `craft` (why the author chose it) and `role` (its job in the sentence).

**A card** → `data/sentences/cards.json` in the right group. `id` unique
site-wide (deep links use `#card-<id>`), `concept` picks the color,
`lesson` is where the glossary sends readers, `glossary: true` to index it.

**A practice item** → `data/sentences/items.json`. Use the id pattern
`kind-lesson-serial` (`cmb-05-008`). Identification feedback must explain why
the right answer is right **and why the tempting distractor tempts**.
Construction items need 2–3 annotated `models` with the move named — models
are reveal-and-compare, so write them as things worth comparing against.
The generator script pattern in git history (`build_items.py`) shows how
identify answer-indices were computed rather than hand-counted.

**A notebook card** → `data/notebook/cards.json`, same shape as the writing
cards. `concept` is one of `n-think n-graphic n-exercise` (dot colors are in
components.css next to the `w-*` ones). Card ids must not collide with the
writing bank — the validator checks. Notebook cards don't enter the grammar
glossary.

**A visual-notes figure** → an inline `<svg>` inside `.vn-figs` / `.vn-fig`
markup on the page (this is the one place drawings are page-level, not JSON,
because each figure is one-of-a-kind). Use only `.vn-ink`, `.vn-ink-soft`,
`.vn-dot`, and `text.vn-label`; always give the `<svg>` `role="img"` and an
`aria-label` describing what the sketch shows. Never color these with the
five job colors — they aren't showing word-jobs.

**A tour/builder/compare/stages interactive** → `data/sentences/tours.json`
(shapes in SCHEMA.md; `stages` powers the x-ray/revision sliders).

**Structure spans on a passage** → `spans` in passages.json; compute indices
with a matcher script (`add_spans.py` in git history), never by hand. The
Annotation Studio (`/studio.html`) needs no content — it runs entirely on
student input and never stores it.

**A lesson page** → copy an existing `lessons/*.html`; set front matter
(`root: ".."`, `nav`, `lesson_num`, `title`, `tagline`, `next_*`); follow the
Notice→Name→Build→Apply arc with `arc-label` markers; mount content by id.
Then update: the previous lesson's `next_*`, the index lesson grid and concept
map, `GX.LESSON_URLS`/`GX.LESSON_TITLES` in `assets/js/main.js`, and the
lesson list in `validate.html`/`quiz.js` if the lesson count changes.

## The five-job color system

Defined once in `tokens.css` (see its header comment). Color answers **"what
job is this doing?"** — never "what is this word called?":

- **Names** (`--name`, blue) — nouns, pronouns, gerunds, noun clauses, and
  every noun seat (subject, DO, IO, predicate nominative)
- **Acts** (`--act`, red) — verbs and verb phrases
- **Describes** (`--desc`, ochre) — adjectives, articles, participles,
  appositives, adjective clauses, predicate adjectives, object complements
- **Situates** (`--sit`, green-teal) — adverbs, adverbial phrases/clauses,
  modifiers, infinitives
- **Connects** (`--con`, plum) — conjunctions, prepositions (as heads),
  relative pronouns

Within a family, **labels distinguish seats** (subject vs. direct object are
both Names-blue; the tag says which). **Structure is line style, never hue**:
phrase = thin solid bracket, independent clause = heavy solid, dependent =
dashed — all in graphite (`--structure`). Interjections wear neutral gray
(`--apart`). Old token names (`--blue`, `--gold`, `--rose`…) are aliased to
the job system in tokens.css so legacy markup keeps working; new code should
use job tokens. Never rely on color alone; every colored mark pairs with a
label or line style. New colors must hit WCAG AA (≥4.5:1) for white text.
The site is deliberately light-only (projectors and school Chromebooks).

## QA checklist (run before merging)

1. Open `/validate.html` — must say **ALL CHECKS PASSED** (checks every JSON
   bank against SCHEMA.md: known tags/kinds/lessons, answer indices, unique
   ids, classify targets, feedback/models present, construction > identification).
2. `jekyll build` cleanly; click through every changed page.
3. Word Toolbox: every filter highlights exactly its words; Show All and
   passage switching reset state; every clickable word's popover has content;
   cards expand; Check Yourself runs to its summary; **zero console errors**.
4. Keyboard: tab to tokens/chunks/cards/choices and operate with Enter.
5. Phone width (~375px): no horizontal body scroll, tap targets sane.
6. New/changed quotations: verify against the cited edition; append to
   AUDIT.md (what changed, old→new, one-line justification).
7. Shuffle/new-example buttons never crash or dead-end.

A Playwright script covering most of this lives in git history (`qa.js` in the
Phase 5 work); adapt it if you're making broad changes.
