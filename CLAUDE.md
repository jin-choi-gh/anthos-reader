# anthos-reader

A reader for poems with practices: an editor writes a practice of directions about a poem, and the app takes one reader through it, stage by stage and day by day, showing the poem with the editor's notes and keeping what the reader writes. Vite, React 19 and TypeScript; no back end (the reader's data is in the browser's `localStorage`).

## Read this first: `CONCEPT.md`

The codebase is built as one picture: **a reel** (the practice), **a projector** (the runner), **a screen** (the reader), and **a notebook** (what the reader writes), with the poem as the **footage**. `CONCEPT.md` maps every folder in `src/` to that picture, fixes the vocabulary, and says where new code goes. Read it before changing anything structural.

- Use its vocabulary in code, comments, tests and commits, and avoid the words it retires.
- Place new code by its "Where does new code go?" section. If a change does not fit the picture, stop and discuss where it belongs before writing it.
- Keep `CONCEPT.md` true. Every file, folder and name it mentions links to the code, and `src/test/concept.test.ts` follows the links: it fails when a link leads nowhere, a linked name is not declared in its file, a quoted line is not in the source, or a layer has no place in the file. When it fails after a code change, update `CONCEPT.md` in the same change, never the test.
- Link every file, folder or exported name you add to `CONCEPT.md`: ``[`gateOf`](src/runner/gate.ts)``.

## The rules that follow from the picture

- **A direction is read in two places only**: the lexicon (`src/practice/lexicon.ts`), which turns it into parts, and the screen, which draws the parts. Nothing in between switches on `step.direction`.
- **The layers are enforced** by `src/test/architecture.test.ts`, from the table in `src/test/layers.ts`. A new folder of source must be given a layer there. Change the table only when the picture changes, and `CONCEPT.md` with it.
- **Pure core, thin shell.** Folds, deciders, the law, the lexicon, the frame and the scene are plain functions, tested without React. Ids and times are made in the hooks and passed in. The scene does no I/O: it returns notebook entries (`Effect`s), and the session writes them.
- **Only the gate reads the reel at a position** (`src/runner/gate.ts`).
- Every `switch` over a union ends with `default: return assertNever(x)` (`src/assertNever.ts`).
- Reel, log and notebook types are `readonly`. Practices are written with `satisfies Practice`.
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
- Comments are full sentences stating a contract: what a function takes and gives, its edge cases, and why a subtle choice was made. They do not restate `CONCEPT.md`: no file headers explaining the picture or which layer may know what.
- Texts are in `text-data/`, as loom textual complexes. They are not in git.
- Notes about plans and past decisions are kept outside the repo, in `../anthos-reader-notes/`.
