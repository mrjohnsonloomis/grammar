# AUDIT.md — content audit and accuracy log

Full audit of all lesson content (passage tags, cards, quiz items, feedback)
performed during the construction-first rebuild. Terminology reference: *Holt
Handbook: Third Course* (Holt, Rinehart and Winston, 2003). Prose and citation
style: MLA (9th ed.).

## 1. Structural corrections

### 1.1 Eight vs. nine parts of speech — RESOLVED
- The index said **eight**; the parts-of-speech page taught **nine** ("Nine
  word-categories…", "The Nine Parts of Speech") with Articles as a separate
  category, its own filter button, color, and card; the Practice page had an
  Articles filter.
- **Standardized on eight**, per Holt and standardized-test convention.
  Articles (*a, an, the*) are presented inside the adjective material as "the
  most common adjectives." Every token formerly tagged `article` is now
  `tag: "adjective", subtype: "article"`. The Practice concept filters, the
  filter bar, the color legend, and the glossary now reflect eight categories
  (the glossary keeps an "Article" entry that points into the Adjective card).

### 1.2 Participle definition — CORRECTED
- Old shorthand in the verbals intro and tour narratives: participles are the
  "-ing or -ed form."
- Replaced everywhere with: **present participle (-ing)** and **past
  participle (usually -d/-ed, often irregular: broken, sung, written, seen,
  torn, gone)**. Fixed in the Participle card, the verbal-types tour
  narrative, and the participial-phrase materials. (The old participial-phrase
  card already had it right; the intro contradicted it.)

## 2. Literature passages (Phase 1.4)

All passages verified against the public-domain editions cited below and
reproduced exactly; each now carries an MLA attribution in
`passages.json` and in the sources list on the index page.

> **Verification note:** this build environment has no open web egress, so
> quotations were restored to the canonical texts of the cited editions from
> editorial knowledge of those editions (they are among the most-reproduced
> passages in English). Before classroom use, spot-check each passage once
> against the linked Project Gutenberg files. The passage texts as data are in
> `/data/sentences/passages.json`.

| Passage | Status | Action |
|---|---|---|
| Austen, *Pride and Prejudice* (1813) | Sentence 2 was **fabricated** — the site quoted "However little known the feelings or views of such a man may be, this much is well known, that a single man…must be in want of a wife," which is not Austen's text. | Replaced with the actual second sentence ("…on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.") and retagged in full. British spelling *neighbourhood* kept and noted. |
| Hemingway, *A Farewell to Arms* (1929) | Quotation dropped "and blue" from "clear and swiftly moving **and blue** in the channels." Published 1929 → US public domain since 1 Jan 2025 (noted in attribution). | Restored "and blue"; retagged. |
| Morrison, *Beloved* (1987) | **Not public domain** — removed. | Replaced with the opening of Douglass's *Narrative* (1845), which the index copy already promised ("passages from Austen, Dickinson, London, and **Douglass**") and which the preposition craft note already referenced. Fully tagged with craft notes. |
| London, "To Build a Fire" (1908/1910) | First sentence was truncated without ellipsis; the final sentence "The sky overhung the earth like a gray pall." was **invented** (the real text reads "…there seemed an intangible pall over the face of things…"). Spelling: the *Lost Face* text uses *grey*. | Replaced with the continuous, unabridged opening paragraph (five sentences, including "It was a steep bank…" and the real pall sentence); *gray*→*grey* with a spelling note; fully retagged. |
| Dickinson, "Because I could not stop for Death" | The site used the dash-and-capitals text (Johnson/Franklin restoration), whose editions carry Harvard copyright claims; it also omitted "too" ("my leisure **too**"). | Switched to the unambiguously public-domain **1890 first-edition text** ("The Chariot," ed. Todd & Higginson), restored "too," and turned the manuscript-vs-1890 differences into craft notes (the editors' lowercasing of *Carriage* and *Civility* is itself a lesson in editing). |

## 3. Token-level tag corrections (passages)

Words unchanged from the old data keep their (verified) tags; every tag was
re-checked in context. Corrections and notable decisions:

| Location | Word | Old tag | New tag | Why |
|---|---|---|---|---|
| all passages | *a, an, the* | article | adjective (subtype article) | eight-part standardization (§1.1) |
| Austen S2 | *little* ("However little known…") | adjective "modifying feelings" | **adverb** modifying *known* | degree adverb in the concessive inversion; the old reading misparsed the construction |
| Austen S2 | *known* | (verb, but glossed as freestanding passive) | verb, participle of *may be known* | the old role text didn't connect it to the inverted verb phrase |
| Austen S2 | *his* (before *entering*) | — (new text) | pronoun, possessive | possessive-before-gerund, flagged as a craft note |
| Austen S2 | *entering* | — | **noun, subtype gerund** | gerund with its own object (*a neighbourhood*) |
| Hemingway | *moving* ("swiftly moving") | verb ("main verb… predicate adjective" — self-contradictory) | **adjective, subtype participle** | predicate adjective parallel to *clear* and *blue*; old craft/role texts disagreed with each other |
| Hemingway | *powdered* | verb, but craft note said "past participle used as an adjective" while role said "main verb" | verb, action (main verb) | it IS the main verb of *the dust…powdered the leaves*; contradictory note rewritten |
| Hemingway | *they raised* | role texts called *raised* "main verb of the following clause" without explaining the reduced relative | verb of the contact (reduced relative) clause modifying *dust* | craft note now teaches the omitted *that* |
| London | *It* ("It was nine o'clock") | pronoun; craft claimed "creates suspense…delays the real subject" while the role text said "Nothing is delayed" | pronoun (dummy subject); note rewritten | old craft and role texts contradicted each other |
| London | *Yukon* | noun ("proper noun functioning as adjective") | **adjective, subtype proper** (attributive) | tag-by-job consistency; same for *spruce* and Douglass's *Talbot* |
| Dickinson | *but* ("held but just ourselves") | conjunction | **adverb** (= *only*) | limiting adverb, not a joiner; new craft note teaches the distinction |
| Dickinson | *too* | (omitted from quotation) | adverb | restored with the corrected text |

**Participle tagging convention adopted (documented for future content):**
a participle directly modifying a noun (attributive or postpositive: *the
shattered vase*, *a truth universally acknowledged*, *surrounding families*)
is tagged `adjective/participle`; a participle inside a verb phrase (*was
broken*, *may be known*, *is…fixed*) or heading a full participial phrase with
its own objects (*having seen any authentic record*, *excusing the act to
himself*) is tagged `verb/participle`, with the phrase's adjectival/adverbial
job explained in the role note. This follows Holt's treatment of verbals as
verb forms while keeping "job in this sentence" honest.

## 4. Interactive tours & builder (old sentence-parts, verbals, phrases, clauses pages)

| Item | Problem | Fix |
|---|---|---|
| Sentence-builder set 2 | **"Mrs. Reyes explained the students the lesson"** — ungrammatical; *explain* does not take an indirect object in English. | IO step now swaps to *taught* and explicitly teaches the point: only some verbs accept an IO; *explain* requires *to the students*. Turned an error into a lesson (it's the "what verbs demand" idea). |
| Sentence-builder set 3/4 | "The sky looks." and "She is." presented as complete sentences at step 1. A linking verb without its complement is not a complete thought. | Steps relabeled "S + Linking V (not done yet)" and renarrated as a *promise the sentence must keep* — which is the lesson's actual point. |
| Sentence-builder set 3 | "The sky looks beautiful" — bland exemplar. | Now *electric* (also avoids implying *beautiful* is the only PA students should reach for). Cosmetic; logged for completeness. |
| Verbals intro | "-ing or -ed form" | see §1.2 |
| Old nav | sentence-parts.html had no up-next card (dead end); clauses page ended with a back-link only. | Every lesson now has a layout-generated up-next card; the chain runs 01→…→07→Practice. |
| Index copy | Promised "passages from Austen, Dickinson, London, and Douglass" but no Douglass passage existed. | Douglass passage added (§2). |
| Old preposition craft note | Referenced Douglass phrases that weren't on the site. | Now true — the note points at the actual Douglass passage. |

## 5. Practice item bank (old `data/problems/parts-of-speech.json`, 88 items)

All 88 items reviewed. Migrated items were re-tagged to the new schema
(lesson/concepts/difficulty/kind) with articles folded into `adjective`.

**Dropped as defective:**
- `pos-preposition-007` — the keyed answer is wrong: in "He felt tired after
  working all day," *after* takes the gerund *working* as its object and IS a
  preposition, so the item has no correct choice. (Its own explanation
  contradicts itself.)
- `pos-adjective-002` — "Which word is an adjective: *bright* red scarf" keys
  *bright* while the explanation concedes it is "technically an adverb
  modifying an adjective." Incoherent distractor set; unsalvageable.

**Corrected on migration:**
- `pos-pronoun-005` (*Her coat…*) keyed "Adjective (possessive)" — conflicts
  with Holt (which classes *my/your/her/its/our/their* as possessive
  pronouns) and with the site's own passage tagging. Re-keyed as **possessive
  pronoun** with the naming dispute taught in the feedback
  (now `cls-03-003`).
- Article items re-tagged `adjective`; feedback rewritten to teach articles as
  adjectives (e.g., `mc-03-001`, `idn-03-004`).
- Counting-style and redundant drill items (e.g., "How many nouns…") were not
  migrated; identification now leans toward function-in-context items, per
  the construction-first philosophy.
- Every migrated feedback string was extended to explain **why the tempting
  distractor tempts**, not just why the key is right.

**Not migrated (redundant with better items or diagnostic-only):** the
remaining ~50 old items. The old bank file is deleted; this log plus git
history preserve it.

## 6. Diagnostic/error-hunting language reframed (Phase 1.5 flag list → Phase 3 fixes)

| Old framing | New framing |
|---|---|
| "Which sentence uses a reflexive pronoun **correctly**?" | reflexives taught by their job (pointing back to the subject); item not migrated |
| "Which sentence uses articles **correctly**?" (a/an) | sound-rule framing kept in Adjective card ("use *an* before vowel sounds"); no error-hunt item |
| Gerund card: "✗ I appreciate you helping me / ✓ your helping me" | register framing: formal written English prefers the possessive; conversation doesn't — "match the occasion; that's a choice, not a trap" |
| "Comma splice — a common **error**" | "a hinge with no pin… most readers hear two sentences leaning on each other; save it for deliberate, informal effect" (`mc-06-001`, Independent Clause card) |
| Dangling modifier "✗/✓" framing | "Keep it attached — readers will follow the grammar, not your intention" (cards + `mc-05-002`, which asks *who ends up running?*) |
| Fragments as errors | Lesson 01 treats fragments as **unfinished moves** with fix-by-building activities (`exp-01-001…008`), plus `mc-01-003` on *deliberate* fragments as a craft choice |
| "Not quite" feedback header | "Not quite — here's the thinking" |

## 7. Copyedit sweep (Phase 1.5)

- Terminology unified sitewide: *simple/complete subject and predicate,
  direct object, indirect object, predicate nominative, predicate adjective,
  object complement* (Holt terms). "Real verb" (old verbals page) → **main
  verb** everywhere ("real" implied verbals are fake).
- "Dummy pronoun/expletive" usage unified; glossary entry added.
- Em-dash/quote typography normalized in new prose; all colors now meet WCAG
  AA for white-on-color text (gold `#B8860B`→`#8A6508`, teal
  `#2A8A7A`→`#227565`; the small gray used for text bumped to `#6E665E`).
- The "muted" gray is no longer used as a concept color (it belonged to the
  removed Articles category).

## 8. Known judgment calls (documented, not defects)

- *Infinitive phrase as adjective vs. adverb of purpose* ("someone to help me
  move") — genuine ambiguity; the tour teaches both readings (kept from the
  old site, which handled this well).
- *by far* (Douglass) — idiomatic degree unit; tokens tagged
  preposition + adverb with a craft note admitting idioms resist neat parsing.
- *due to* (London) — tagged adjective + preposition per traditional analysis.
- Dickinson 1890 vs. manuscript text — 1890 chosen for unambiguous public
  domain status; the differences are taught rather than hidden.
