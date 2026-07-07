# The Writer's Workbench

An interactive workbench for 9th-grade writers, built as a static site on
GitHub Pages. Sentences are treated as things students **build** — by
combining, expanding, imitating, and revising real sentences — not specimens
they dissect.

**Part I · Sentences** — seven lessons from the two-word kernel to full
sentence craft, each following the same arc: *Notice* annotated mentor
passages (Austen, Hemingway, Douglass, London, Dickinson) → *Name* the
concepts → *Build* with construction exercises → *Apply* it to writing.
Plus a mixed-review practice engine, an alphabetical glossary, and an
Annotation Studio where students mark up their own drafts.

**Part II · Writing** — paragraphs and whole pieces (analytical, creative,
personal). In progress; shares the same architecture and components.

## For contributors

- **CONTRIBUTING.md** — philosophy, repo layout, how to add content, the
  five-job color system, and the QA checklist
- **SCHEMA.md** — the data contracts for everything in `/data/`
- **AUDIT.md** — the content-accuracy log (append when content changes)
- `/validate.html` on the running site checks all data against the schema

No build step beyond Jekyll (GitHub Pages runs it automatically). No student
data is ever collected or stored — practice and annotation state live only
in the browser's memory.
