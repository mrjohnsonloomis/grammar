# CONTRIBUTING.md — how to add to Sentence Explorer

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
data/writing/*.json           the future writing section's content
lessons/NN-slug.html          thin pages: front matter + intro prose + mounts
practice.html glossary.html validate.html writing/index.html
AUDIT.md                      content-accuracy log — append when you change content
```

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

**A tour/builder/compare** → `data/sentences/tours.json` (shapes in SCHEMA.md).

**A lesson page** → copy an existing `lessons/*.html`; set front matter
(`root: ".."`, `nav`, `lesson_num`, `title`, `tagline`, `next_*`); follow the
Notice→Name→Build→Apply arc with `arc-label` markers; mount content by id.
Then update: the previous lesson's `next_*`, the index lesson grid and concept
map, `GX.LESSON_URLS`/`GX.LESSON_TITLES` in `assets/js/main.js`, and the
lesson list in `validate.html`/`quiz.js` if the lesson count changes.

## The tag-color legend

Defined once in `tokens.css` (see its header comment): noun=blue,
pronoun=indigo, verb=accent, adjective=gold, adverb=teal, preposition=purple,
conjunction=rose, interjection=brown; sentence jobs subject=blue, verb=accent,
DO=green, IO=purple, complements=gold, modifier=teal; verbals wear the color
of the job they do; structure is border style, never color alone (phrase =
solid rose outline, independent clause = solid indigo, dependent = **dashed**
indigo). Never rely on color alone: pair with labels, underlines, or border
styles. New colors must hit WCAG AA (≥4.5:1) for white text — check before
adding.

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
