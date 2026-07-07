# SCHEMA.md — data contracts for The Writer's Workbench

All lesson content lives in JSON under `/data/`. Pages are thin: front matter +
intro prose + component mounts that load content by id. This document is the
contract for every file in `/data/`. The validator (`/validate.html`) checks
these shapes; run it after any content change.

Components are mounted declaratively:

```html
<div data-component="highlighter" data-passages="austen-pride,london-fire"></div>
<div data-component="tour" data-tour="verbal-types"></div>
<div data-component="builder" data-builder="kernel-builder" data-steps="2"></div>
<div data-component="compare" data-compare="trap-running,trap-cooking"></div>
<div data-component="cards" data-group="pos"></div>
<div data-component="construct" data-items="cmb-04-001,exp-04-002"></div>
<div data-component="recall" data-item="rec-02-001"></div>
<div data-component="quiz" data-lesson="03" data-count="5" data-cumulative="true"></div>
```

`data-*` ids must exist in the corresponding JSON file. `main.js` scans for
`[data-component]` and mounts each one.

## Shared vocabulary

**Concept ids** (drive color via tokens.css; use these exact strings):
`noun pronoun verb adjective adverb preposition conjunction interjection`
(the eight parts of speech — articles are a subtype of adjective, never a
ninth tag), `subject do io pn pa oc modifier` (sentence jobs),
`participle gerund infinitive` (verbals), `phrase clause` (structure).

**Lesson ids**: `"01"` … `"07"`.

**Difficulty**: integer `1` (intro) to `3` (stretch).

---

## /data/sentences/passages.json

```jsonc
{
  "passages": [
    {
      "id": "austen-pride",            // kebab-case, unique
      "title": "Pride and Prejudice",
      "meta": "Jane Austen, 1813 — the famous opening",  // shown under title
      "type": "narrative",             // "narrative" | "poetic" (poetic renders line breaks)
      "attribution": "Austen, Jane. <em>Pride and Prejudice</em>. 1813. ...", // MLA 9th ed.
      "tokens": [ /* Token[] */ ]
    }
  ]
}
```

**Token** — one word, punctuation mark, or line break:

```jsonc
{ "t": "truth",                 // the exact text
  "tag": "noun",                // one of the eight POS concept ids (words only)
  "subtype": "abstract",        // optional; free but prefer the list below
  "craft": "Why the author chose it…",   // optional; HTML allowed
  "role": "Predicate nominative — renames <em>It</em>."  // optional; HTML
}
{ "t": ",", "punct": true }     // punctuation: not clickable, glued to previous word
{ "br": true }                  // line break (poetry)
```

Rendering inserts a space before every token except the first, punctuation,
tokens after a `br`, or tokens with `"glue": true`. A word token with `craft`
or `role` renders as a focusable `<button>`; without either it still
highlights by tag but is not clickable.

Preferred `subtype` values — nouns: `proper common concrete abstract gerund`;
verbs: `action linking helping modal participle`; adjectives: `article
demonstrative participle proper`; pronouns: `personal possessive relative
demonstrative indefinite reflexive`; conjunctions: `coordinating
subordinating correlative`; adverbs: `negation intensifier relative`.

Every quoted passage must be public-domain, quoted exactly from a reliable
edition, and carry an MLA-style `attribution`.

**Structure spans** (optional per passage) power the "Show structure
brackets" toggle:

```jsonc
"spans": [
  { "from": 12, "to": 25,            // 0-based token indices, inclusive
    "structure": "clause",           // "phrase" | "clause" | "clause-ind"
    "label": "adverb clause (when)" }// hover tooltip
]
```

Spans must form a proper tree (nested or disjoint, never crossing), at most
two levels deep. Compute indices with a matcher script (see git history:
`add_spans.py`) — never count by hand.

---

## /data/sentences/cards.json

Reference cards (the Name layer). Groups render as one `cards` mount; the
glossary page renders every card with `"glossary": true`.

```jsonc
{
  "groups": [
    {
      "id": "pos",                    // mount id
      "cards": [
        {
          "id": "noun",               // unique across ALL groups (deep-link #card-noun)
          "concept": "noun",          // concept id -> color stripe
          "term": "Noun",             // display + glossary term
          "lesson": "03",             // home lesson (glossary links here)
          "short": "Names a person, place, thing, or idea.",
          "detail": "HTML body…",     // may use .tip and .mini-ex markup
          "glossary": true            // include in the glossary index
        }
      ]
    }
  ]
}
```

---

## /data/sentences/tours.json

Step-based interactives. Three top-level collections:

```jsonc
{
  "builders": [        // sentence-builder.js — progressive build stepper
    {
      "id": "kernel-builder",
      "sets": [                        // shuffle rotates sets
        { "steps": [
            { "label": "S + V",
              "narrative": "HTML…",
              "words": [ { "text": "The dog", "role": "subject", "tag": "Subject" } ],
              "explanations": { "subject": ["Title", "HTML body"] }   // keyed by role
            } ] }
      ]
    }
  ],
  "tours": [           // tour.js — labeled steps of chunked sentences
    {
      "id": "verbal-types",
      "sets": [
        { "steps": [
            { "label": "Participle",
              "narrative": "HTML…",
              "formula": "<code>IND</code> …",      // optional formula line
              "chunks": [
                { "text": "shattered", "verbal": "participle", "structure": "phrase",
                  "func": "adj", "role": "plain", "tag": "Participle (Adj)",
                  "id": "v1", "clickable": true }
              ],
              "explanations": {
                "v1": { "type": "Participle", "func": "Adjective",
                        "concept": "participle",    // colors the callout + chip
                        "body": "HTML…" }
              } } ] }
      ]
    }
  ],
  "compares": [        // tour.js — two-column contrast (trap pairs, emphasis pairs)
    {
      "id": "trap-running",
      "label": "\"running\"",          // button label when several compares share a mount
      "a": { "label": "Verbal", "sentence": ["The ", {"m": "running"}, " water froze."], "why": "HTML…" },
      "b": { "label": "Main verb", "sentence": ["The water ", {"m": "is running"}, "."], "why": "HTML…" },
      "test": "HTML… the takeaway test"
    }
  ]
}
```

Chunk fields: `role` (sentence job), `verbal`, `structure` (`phrase` |
`clause` | `clause-ind`), `func` (`adj adv subject do pn appos modifier
independent`) — all optional; they drive fills/outlines per the legend.

A fourth collection, `stages`, powers the slider interactives (kernel x-ray,
revision scrubber; mounted as `data-component="stages"`):

```jsonc
"stages": [
  { "id": "london-xray",
    "intro": "HTML shown above the slider",
    "stages": [
      { "label": "Kernel",                     // slider stop label
        "text": "Day had broken <span class='mv mv-gold'>cold</span>.", // HTML; mark
        "note": "HTML teaching note for this stage" }                   // additions with mv-*
    ] }
]
```

---

## /data/sentences/items.json

The unified practice bank. Every item:

```jsonc
{ "id": "idn-03-001",        // kind-lesson-serial; unique
  "lesson": "03",
  "concepts": ["noun"],      // concept ids (first one = reporting bucket)
  "difficulty": 1,
  "kind": "identify" }       // + kind-specific fields below
```

**Identification kinds** (auto-checked):

- `identify` — click words. Fields: `instruction`, `sentence` (array of word
  strings), `answer` (array of 0-based indices into `sentence`), `feedback`
  (HTML: why the right answer is right AND why the tempting wrong pick tempts).
- `classify` — one word in context. Fields: `sentence` (string), `target`
  (word appearing exactly once in `sentence`), `prompt`, `choices` (strings),
  `answer` (0-based index), `feedback`.
- `mc` — multiple choice. Fields: `prompt`, optional `stimulus` (HTML shown
  in a serif block: sentences being compared), `choices`, `answer`, `feedback`.

**Construction kinds** (reveal-and-compare; self-assessed, nothing saved):

- `combine` — Fields: `kernels` (array of 2-3 short sentences), optional
  `prompt` (default "Combine these into one sentence…"), `models` (2-3 of
  `{ "sentence": "HTML with <span class='mv mv-phrase'>move</span> marked",
     "move": "Participial phrase", "note": "What the move does" }`).
- `expand` — Fields: `kernel` (string), `question` (e.g. "Where? Add a phrase
  that says where."), `models` (as above).
- `imitate` — Fields: `mentor` `{ "sentence": "HTML", "source": "Jack London" }`,
  `frame` (HTML: the structural skeleton, e.g. "___-ing ___, the ___ ___."),
  `models` (1-2 sample imitations).
- `revise` — Fields: `passage` (HTML: the choppy original), `prompt`,
  `models` (`{ "passage": "HTML", "note": "moves used" }`).
- `recall` — free-recall prompt for lesson tops. Fields: `prompt`, optional
  `hint`, `model` (HTML model answer).

Rules the validator enforces: known `lesson`/`kind`/`concepts`; `answer` in
range; `identify` answers index real words; `classify` target occurs exactly
once; every identification item has `feedback`; every construction item has
`models` (or `model` for recall); ids unique; every card `id` unique; every
passage token `tag` is one of the eight POS ids.

---

## /data/writing/* — the Writing strand

The Writing strand reuses the same components by pointing them at writing
data with `data-file`:

```html
<div data-component="cards"    data-group="oi-method"    data-file="writing/cards"></div>
<div data-component="compare"  data-compare="tell-show-nervous" data-file="writing/tours"></div>
<div data-component="stages"   data-stages="frost-paragraph"    data-file="writing/tours"></div>
<div data-component="construct" data-items="wtg-para-001"        data-file="writing/items"></div>
```

- `data/writing/cards.json` — `{ groups: [...] }`, same shape as the grammar
  cards, but `concept` uses writing ids (`w-think w-notice w-argue w-story
  w-reader`) which render a colored lexicon dot and **no job-chip** (chips are
  grammar-only). Writing cards don't appear in the grammar glossary.
- `data/writing/tours.json` — `compares`, `stages` (both as in the sentences
  file), plus `oimodels` for the O&I pad.
- `data/writing/items.json` — construction items (`combine expand imitate
  revise`), same shape as the grammar bank; `module` replaces `lesson`.

Two Writing-only components:

- **`oipad`** (`assets/js/components/writing.js`) — `<div
  data-component="oipad" data-file="writing/tours" data-model="frost">`. Reads
  an entry from `oimodels`:
  ```jsonc
  { "id": "frost", "about": "…", "text": "poem\nwith\nlines", "source": "MLA…",
    "overview": "one-sentence model", "inventory": ["noticing", …],
    "overview2": "synthesized second pass", "note": "…" }
  ```
- **`freewrite`** — `<div data-component="freewrite" data-minutes="5"
  data-prompt="…">`. No data; a timed, never-saved pad.

Both are in-memory only; nothing typed is stored (the "private writing"
ethos). `data/writing/demo.json` remains as a minimal architecture proof.

## Adding a lesson (checklist)

1. Add content to the JSON banks (passages/cards/tours/items) — never inline
   in pages.
2. Create `lessons/NN-slug.html` with front matter (`layout: default`,
   `root: ".."`, `nav`, `title`, `lesson_num`, next-lesson fields) and mounts.
3. Follow the arc: **Notice** (mentor sentences) → **Name** (cards) →
   **Build** (construction) → **Apply** (revise/write).
4. Update the index cards + concept map, the previous lesson's `next_*`
   front matter, and run `/validate.html` + the QA checklist in
   CONTRIBUTING.md.
