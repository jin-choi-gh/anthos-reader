# anthos-reader

A reader for poems with practices: an editor writes a practice of directions about a poem, and the app takes one reader through it, stage by stage and day by day, showing the poem with the editor's notes and keeping what the reader writes. Vite, React 19 and TypeScript; no back end (the reader's data is in the browser's `localStorage`).

## `CONCEPT.md` is the law

`CONCEPT.md` is the letter of the law for this codebase's architecture. The code follows it; it never bends to fit the code. Only the user changes it.

The law covers the processes behind the screen: data, state, messages, rulings and the layers. It does not cover how anything looks: appearance, layout, wording, colour and placement on screen are not legislated. Do not add them to `CONCEPT.md`, and a visual change is never a clash.

**When an architectural point clashes with `CONCEPT.md`, stop.** This covers a point you would suggest yourself, one a task seems to need, and one the user asks for without noticing the clash. Examples: a new layer or folder, an import across the layers, a figure renamed or added, a direction read outside the lexicon, state or I/O put somewhere the law does not put it.

1. Do not write the code, and do not edit `CONCEPT.md` to make room for it.
2. Tell the user what clashes: the change, the section of `CONCEPT.md` it goes against (quote it), and the ways out, which are to keep the law and change the plan, or to change the law.
3. Make no further progress on that work until the user has settled the clash.
4. If the user changes the law, change `CONCEPT.md` (and `src/test/layers.ts`, if the layers change) first, then the code.

Work that fits the law needs no permission: a new file in the folder the law gives it, a new direction made of existing parts, a fix inside a layer.

## Read this first: `CONCEPT.md`

The codebase is built in eight layers: **Literary Material** (`material/`), **Practice Reel** (`practice/`), **Practice Runner** (`runner/`), **User Notebook** (`notebook/`), **Frame**, **Scene**, **Viewer** and **Praxis Bar** (under `reader/`). `CONCEPT.md` tells how a poem moves through them (Synopsis), what each does (Layers), what every term means and where it is in the code (Glossary), and where new code goes. Read it before changing anything structural.

- Use its vocabulary in code, comments, tests and commits, and avoid the words it retires.
- Place new code by its "Where does new code go?" section. A change that fits none of its answers is a clash: see above.
- `CONCEPT.md` holds only the architecture as it is, and as it should be, at this moment: no plans, no history, no changelog, no "will" or "used to". Plans and past decisions do not go in it.
- Keep `CONCEPT.md` true. Every file, folder and name it mentions links to the code, and `src/test/concept.test.ts` follows the links: it fails when a link leads nowhere, a linked name is not declared in its file, a quoted line is not in the source, or a layer has no place in the file. When it fails after a change that fits the law (a file moved within its layer, a name renamed), bring the links and quotes in `CONCEPT.md` up to date in the same change, never the test. When it fails because the architecture itself changed, that is a clash: stop, as above.
- Link every file, folder or exported name you add to `CONCEPT.md`: ``[`gateOf`](src/runner/gate.ts)``.

## The rules that follow from the layers

- **A direction is read in one place only**: the lexicon (`src/practice/lexicon.ts`), which turns it into parts. Everything after it, the Viewer and the Praxis Bar included, works with parts, and nothing switches on `step.direction`.
- **The table in `src/test/layers.ts` is the law of who may know whom**, and `src/test/architecture.test.ts` enforces it. A new folder of source must be given a layer there. Change the table only when the layers change, and `CONCEPT.md` with it.
- **Pure core, thin shell.** Folds, deciders, the law, the lexicon, the frame and the scene are plain functions, tested without React. Ids and times are made in the hooks and passed in. The scene does no I/O: it returns notebook entries (`Effect`s), and the session writes them.
- **Only the gate reads the practice at a station** (`src/runner/gate.ts`).
- Every `switch` over a union ends with `default: return assertNever(x)` (`src/assertNever.ts`).
- Practice, log and notebook types are `readonly`. Practices are written with `satisfies Practice`.
- Anything read from storage or JSON passes a type guard first (`src/storage/log.ts`).

## Commands

```sh
npm run dev           # Vite dev server
npm test              # vitest, once
npx tsc -b --noEmit   # type-check (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
npm run lint          # oxlint
npm run format:check  # prettier (no semicolons, 100 columns)
npm run build         # type-check and build
```

Before calling a change done, run the tests, the type-check, the lint and the format check.

## Conventions

- Tests live in a `test/` folder beside the code they test (`src/runner/test/step.test.ts`). Test names read as sentences about behaviour.
- Comments are full sentences stating a contract: what a function takes and gives, its edge cases, and why a subtle choice was made. They do not restate `CONCEPT.md`: no file headers explaining the layers or which layer may know what.
- Texts are in `text-data/`, as loom textual complexes. They are not in git.
- Notes about plans and past decisions are kept outside the repo, in `../anthos-reader-notes/`.
