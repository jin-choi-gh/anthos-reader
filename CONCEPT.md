# Architecture by analogy

anthos-reader is built as **a screening**. An editor makes a **reel** of directions about a poem. A **projector** runs it for one reader, frame by frame and day by day. What it shows appears on a **screen**. And the reader keeps a **notebook**.

Every folder in [`src/`](src/) is one of these things, and the rules about which code may know what are the rules of a screening room. The reel does not know who is watching. The screen cannot move the projector by itself. Nothing the reader writes ends up on the reel.

Use the words below in code, comments, commits and conversation. When something new does not fit the picture, say so, and decide where it belongs before writing it.

This file is the architecture **as it is, and as it should be, now**, and it is the law: where the code and this file disagree, the code is wrong, until the user changes the law. It holds no history and no plans. It legislates the processes behind the screen, not how anything looks: appearance, layout, wording and placement are outside it. When the architecture changes, this file changes with it, in the same change, and says only what is then true.

## One screening, told once

A reader opens Dickinson's poem. The **projector** threads the editor's **reel**, _First reading_, and replays its **log** to find where this reader left off: the first stage, third frame.

In the **gate** is a frame whose **direction** is _respond_. The **lexicon** says what that is made of: an **intertitle** and a **notebook page**.

The **frame** lights it up: the intertitle, the **footage** with nothing **highlighted**, and an empty notebook page pinned to the whole poem. That is its **subject**, and the **scene** plays it, projecting it to the **picture** and the **praxis bar**.

The projector **holds** on this frame, because the frame asks for writing and the notebook has nothing from here. The **law** refuses a step on, as `unanswered`.

The reader writes. The praxis bar passes the draft and the submission to the scene, and the scene sends a **notebook entry** out. It goes into the **notebook**, marked with where in the screening it was written. The projector reads the notebook again and stops holding, and the law allows a step on. The frame is the same, so **the shot continues**: the scene keeps its state, and the page takes up what is now written.

A step on reaches the **intermission**. The next stage opens the next day.

## The vocabulary

One word for each idea. Where the code's word works as film language, the code's word is the figure.

| Figure                   | What it is                                                                   | Code                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **footage**              | the poem, as everything downstream sees it                                   | [`material/`](src/material/): [`Poem`](src/material/types.ts)                                                      |
| **commentary**           | the editor's notes on the footage, a commentary track                        | [`material/`](src/material/): [`Note`](src/material/types.ts), [`Notes`](src/material/types.ts)                    |
| **timecode**             | a place in the footage: a line and a code-point offset                       | [`material/codePoints.ts`](src/material/codePoints.ts)                                                             |
| **anchor**               | where a note is pinned to the footage                                        | [`material/`](src/material/): [`Anchor`](src/material/types.ts)                                                    |
| **reel**                 | a practice: stages of frames, written by the editor                          | [`practice/`](src/practice/): [`Practice`](src/practice/types.ts), [`Stage`](src/practice/types.ts)                |
| **frame** (on the reel)  | one step of a practice                                                       | [`practice/`](src/practice/): [`Step`](src/practice/types.ts)                                                      |
| **direction**            | what a frame tells the reader to do: _consider_, _respond_                   | `step.direction`                                                                                                   |
| **lexicon**              | the reel's grammar: what parts each direction is made of                     | [`practice/lexicon.ts`](src/practice/lexicon.ts): [`partsOf`](src/practice/lexicon.ts)                             |
| **parts**                | intertitle, highlight, notebook page                                         | [`Parts`](src/practice/types.ts): `prose`, `highlight`, `writing`                                                  |
| **intermission**         | the card spliced in at the end of each stage                                 | the rest: [`REST`](src/practice/lexicon.ts)                                                                        |
| **end card**             | the card spliced in after the last stage                                     | the final stage: [`FINAL`](src/practice/lexicon.ts)                                                                |
| **citation**             | a frame's reference to the commentary, `"@angle-worm"`                       | [`practice/references.ts`](src/practice/references.ts)                                                             |
| **projector**            | runs the reel for one reader                                                 | [`runner/`](src/runner/)                                                                                           |
| **log**                  | what happened in a screening: visits, stages finished                        | [`runner/`](src/runner/): [`Event`](src/runner/types.ts)                                                           |
| **counter**              | where the reader is: a stage, a frame                                        | [`runner/`](src/runner/): [`Position`](src/runner/types.ts)                                                        |
| **standing**             | where the screening stands: counter, when the next stage opens, the hold     | [`runner/`](src/runner/): [`Standing`](src/runner/types.ts)                                                        |
| **gate**                 | what frame of the reel is in front of the light                              | [`runner/gate.ts`](src/runner/gate.ts): [`gateOf`](src/runner/gate.ts)                                             |
| **law**                  | whether the reader may move to a frame, and if not, why                      | [`runner/`](src/runner/): [`ruling`](src/runner/step.ts), [`Reason`](src/runner/types.ts)                          |
| **hold**                 | the projector does not pass a frame that asks for writing until it has it    | [`Standing.heldAt`](src/runner/types.ts), [`Reason`](src/runner/types.ts) `unanswered`                             |
| **notebook**             | what the reader writes about a text, one per text                            | [`notebook/`](src/notebook/)                                                                                       |
| **notebook entry**       | something the scene sends out to be written in the notebook                  | [`reader/scenes/`](src/reader/scenes/): [`Effect`](src/reader/scenes/types.ts)                                     |
| **screen**               | everything for one open text                                                 | [`reader/`](src/reader/): [`Reader`](src/reader/Reader.tsx)                                                        |
| **screening**            | a session with the projector running: practice mode                          | [`reader/PracticeMode.tsx`](src/reader/PracticeMode.tsx)                                                           |
| **viewing table**        | a session with no projector, the commentary to look through: annotate mode   | [`reader/AnnotateMode.tsx`](src/reader/AnnotateMode.tsx)                                                           |
| **frame** (in the gate)  | the frame lit up for the screen, with the law's rulings on moving            | [`reader/frame/`](src/reader/frame/): [`Frame`](src/reader/frame/types.ts), [`frameOf`](src/reader/frame/frame.ts) |
| **gait**                 | how the frame moves: a step back, a step on                                  | [`frameOf`](src/reader/frame/frame.ts): its rulings on step − 1 and step + 1                                       |
| **subject**              | what is in the frame, as the scene needs it: parts, references resolved      | [`reader/scenes/`](src/reader/scenes/): [`Subject`](src/reader/scenes/types.ts)                                    |
| **scene**                | what plays on the screen; it mediates between the picture and the praxis bar | [`reader/scenes/`](src/reader/scenes/)                                                                             |
| **cut**                  | a new frame: the scene starts afresh                                         | a new [`Subject.key`](src/reader/scenes/types.ts)                                                                  |
| **the shot continues**   | the same frame with something around it changed: the scene keeps its state   | the same [`Subject.key`](src/reader/scenes/types.ts)                                                               |
| **picture**              | draws the footage and the commentary                                         | [`reader/viewer/`](src/reader/viewer/)                                                                             |
| **praxis bar**           | draws the intertitle, the notebook page and the projector's controls         | [`reader/praxisBar/`](src/reader/praxisBar/)                                                                       |
| **intertitle**           | a frame's words                                                              | the `prose` part                                                                                                   |
| **highlight**            | the notes of the commentary a frame picks out                                | the `highlight` part; the commentary marked                                                                        |
| **notebook page**        | what a frame asks the reader to write, and its draft                         | the `writing` part; [`NotebookPage.tsx`](src/reader/praxisBar/NotebookPage.tsx)                                    |
| **projector's controls** | the rulings on a step back and a step on, made into controls                 | [`reader/frame/controls.ts`](src/reader/frame/controls.ts)                                                         |
| **pen**                  | switches between the screening and the viewing table, through the URL        | [`reader/ModeToggle.tsx`](src/reader/ModeToggle.tsx)                                                               |
| **programme**            | what is showing: the list of texts, each a way into its screen               | [`library/`](src/library/)                                                                                         |

**Retired**, so don't use them: _tape_ (say reel, or practice), _print_ and _lab_ (footage; loom develops it), _claw_ (law), _read-out_ (standing), _booth_ (the projector's controls), _projectionist_ (the projector), _iris_ (highlight), _spectator_ (the reader), _staging_ (the scene), _hold_ for the scene (the shot continues; _hold_ is the projector's), _shelf_ and _house clock_ (storage, clock), _camera on a film set_ (this picture).

## The footage: `material/`

**Like footage, it is what everything else is about, and it knows nothing about them.** loom develops a raw textual complex into it ([`loom/`](src/loom/)), and from then on the poem is the **footage** and the editor's notes its **commentary**.

- The footage imports nothing. The reel cites it, the notebook pins notes to it, and the screen shows it.
- Places in it are **timecodes**: a line and an offset counted in code points, the footage's own unit ([`codePoints`](src/material/codePoints.ts)).
- A text is known by its **[`TextId`](src/material/types.ts)**, the file it was developed from.
- An **anchor** pins a note to the whole poem.

## The reel: `practice/`

**Like a reel, it is made before the screening and does not change during it.** It knows nothing of who is watching or where they are.

- A practice is stages of **frames** (steps). The editor writes each frame as one **direction**.
- Every field is `readonly`. Practices are written with `satisfies Practice`, so the compiler checks them against the reel's grammar.
- **The lexicon is the reel's grammar.** It is the only code that reads a frame's direction, and it turns each direction into **parts**:

  ```ts
  case "consider": // read the editor's note on a passage
    return { prose: step.prose, highlight: [step.note], writing: null }
  case "respond": // write about the whole poem
    return { prose: step.prose, highlight: [], writing: { anchor: "whole", count: "one" } }
  ```

- The editor never writes the **intermission** (the rest) or the **end card** (the final stage). The projector splices them in, but they are written in the same grammar, as [`REST`](src/practice/lexicon.ts) and [`FINAL`](src/practice/lexicon.ts).
- A **citation** (`"@angle-worm"`) names a note of the commentary. [`references.ts`](src/practice/references.ts) resolves citations and checks a practice before it is screened.

## The projector: `runner/`

**Like a projector, it runs the reel for one audience and keeps track of where it is, but it never decides what the screen does with it.**

- Its **log** records what happened: the reader came to a frame (`visited`), a stage reached its intermission (`finished`). Nothing else goes in it.
- Replaying the log gives the **standing**: the **counter** ([`Position`](src/runner/types.ts)), when the next stage opens, and where the projector **holds**.
- The **gate** ([`gateOf`](src/runner/gate.ts)) is the only code that reads the reel at a position. Only the projector knows where it spliced in the intermissions and the end card, so a position the reel does not have is the projector's mistake, and it throws.
- The **law** ([`ruling`](src/runner/step.ts)) says whether the reader may move to a frame, and if not, why: no such frame, the next stage is not open, a frame on the way asks for writing that isn't there (`unanswered`), or the practice is over. The law does not know how the screen moves; that is the frame's **gait**.
- The projector **holds** on a frame that asks for writing until the notebook has something from it. It asks the lexicon whether the frame asks, and the notebook whether it was answered; it never knows the word "respond".
- **What is past is past.** A finished stage never holds again.
- It reads the notebook but never writes it. Its functions are pure (folds and deciders, given the time); [`useRun`](src/runner/useRun.ts) is the projector switched on.

## The notebook: `notebook/`

**Like a notebook, it belongs to the reader, not to the film, and it outlives any screening.**

- There is one notebook per text. Notes written in a screening and notes written at the viewing table sit side by side.
- Each note is pinned to the footage by an **anchor**, and says where it was written: the practice, stage and frame, or `null` at the viewing table.
- It is kept as events (`noted`, `revised`, `withdrawn`) and never overwritten, so no earlier version of a note is ever lost.
- The code falls into a fold ([`notesOf`](src/notebook/notebook.ts)), deciders ([`eventOfNoting`](src/notebook/notebook.ts), [`eventOfRevising`](src/notebook/notebook.ts), [`eventOfWithdrawing`](src/notebook/notebook.ts)) and a query ([`notesFrom`](src/notebook/notebook.ts)). [`NoteId`](src/notebook/types.ts) is a branded type, made in one place only.

## The screen: `reader/`

**Like a screen, it shows what the projector puts in front of it, and lets the reader write. It cannot change the reel, and it moves the projector only through the projector's own controls.**

The [`Reader`](src/reader/Reader.tsx) is the screen for one text. It loads the footage, and holds one of two sessions: a **screening** (practice mode), with the projector running, or the **viewing table** (annotate mode), with no projector and the whole commentary open to the reader. The **pen** switches between them, and switching brings a new frame and a new scene.

### The frame: `reader/frame/`

The **frame** is the frame in the gate, lit up for the screen. It takes what the gate holds, asks the lexicon for its parts, resolves its citations against the commentary, and finds what the reader has already written there. The result is the **subject**. Practice and standing go no further than the frame.

The frame's **gait** is a step back and a step on. It asks the law about each, and the **projector's controls** ([`controls.ts`](src/reader/frame/controls.ts)) are those rulings made into controls. A refusal as `unanswered` becomes no control at all (`none`), not a refused one.

At the viewing table there is no projector, so the frame has no rulings and no position. Its subject is the whole commentary (`listed`), and asks for nothing.

### The scene: `reader/scenes/`

The **scene** is what plays on the screen. It receives a **subject**, made of parts and carrying a frame number:

```ts
/** The frame number. A new key is a cut: the scene starts afresh. The same key with a fresh subject
 * is the shot continuing while something around it changes, such as the notebook. */
readonly key: string
```

- A **cut** is a new frame. The scene starts afresh.
- When **the shot continues** (same frame, but the notebook has changed), the scene keeps its state: the open note and the draft are kept, and the page takes up what is now written.
- The scene has **one behaviour per part**, not one per direction. [`parts/commentary.ts`](src/reader/scenes/parts/commentary.ts) answers the picture: which note is open. [`parts/writing.ts`](src/reader/scenes/parts/writing.ts) answers the praxis bar: it holds the draft, and acts on its messages (`draft`, `submit`, `edit`, `cancel`). The intertitle has no behaviour.
- **The scene does no I/O.** What the reader writes leaves as a **notebook entry** ([`Effect`](src/reader/scenes/types.ts)). The session adds where in the screening it was written, and puts it in the notebook.
- The picture and the praxis bar never talk to each other. Each talks only to the scene.

### The picture and the praxis bar: `reader/viewer/`, `reader/praxisBar/`

The **picture** and the **praxis bar** draw the scene's projections, and pass the reader's actions to the scene as messages. The praxis bar also draws the projector's controls. How either looks is its own affair, and not legislated here.

## Behind the screen: `clock/`, `storage/`

The **clock** ([`clock/`](src/clock/)) says what time it is and which day; days start at 04:00. **Storage** ([`storage/`](src/storage/)) keeps append-only logs in the browser, and reads each one back through a guard, so a damaged log loses only what it cannot read. Both serve the projector and the notebook alike, so neither borrows from the other. They have no figure, because they need none.

## Around the screen: `library/`, `reader/dev/`, `ui/`, the app

- The **programme** ([`library/`](src/library/)) is what is showing: every text in `text-data/`, each a way into its screen.
- The **dev panel** ([`reader/dev/`](src/reader/dev/)), in development only, works the projector and the clock directly, beside the frame and the scene, never through them: a day forward, the screening restarted, the notebook cleared.
- [`ui/`](src/ui/) holds what every screen shares to draw with.
- The app ([`App.tsx`](src/App.tsx), [`route.ts`](src/route.ts)) opens the programme or a screen, from the URL. [`assertNever`](src/assertNever.ts) closes every `switch` over a union, anywhere.

## The principle: a direction is read twice

> A direction is interpreted **twice**: once **on the reel**, where the lexicon says which parts it is made of, and once **on the screen**, where each part is drawn. Everything in between carries parts, and never asks which direction it is carrying.

So a new direction made of parts that already exist is **one case in the lexicon**. A new _part_ needs code in two places: the scene, to play it, and the picture or the praxis bar, to draw it. The projector, the frame and the notebook do not change.

## Who may know whom

Each layer knows only what lies upstream of it. The footage knows nothing. The reel knows the footage, because it cites it. The notebook knows the footage and the reel. The projector knows the reel and the notebook. The screen knows all of these, but its scene never knows the reel or the projector.

The layers are a table in [`src/test/layers.ts`](src/test/layers.ts), and [`src/test/architecture.test.ts`](src/test/architecture.test.ts) enforces it. It fails on any import that crosses the picture the wrong way, and on any new folder that has not been given a layer:

```ts
export const LAYERS: Readonly<Record<string, readonly string[]>> = {
  material: [], // the footage: knows nothing else
  loom: ["material"], // develops loom's JSON into the footage
  practice: ["material"], // the reel
```

Change [`LAYERS`](src/test/layers.ts) only when the picture itself changes, and change this file with it.

## Keeping this file true

Every file, folder and name this file mentions links to the code. [`src/test/concept.test.ts`](src/test/concept.test.ts) follows the links, and fails when this file and the code drift apart:

- a link leads to a file or folder that is not there;
- a linked name is not declared in the file it links to;
- a line of code quoted here is not in the source;
- a layer of [`LAYERS`](src/test/layers.ts) has no place in this file.

When it fails after a change to the code, the change has moved something in the picture: bring this file up to date in the same change.

## Where does new code go?

- **About the poem or the editor's notes themselves?** [`material/`](src/material/), or [`loom/`](src/loom/) if it reads loom's JSON.
- **Something the editor writes in a practice?** [`practice/`](src/practice/). A new direction is a case in the lexicon.
- **Where a reader is, what they may do next, when a stage opens?** [`runner/`](src/runner/).
- **Something the reader writes, or reads back?** [`notebook/`](src/notebook/).
- **What the screen does with the reader's actions, with no I/O?** [`reader/scenes/`](src/reader/scenes/), as a part.
- **Drawing?** [`reader/viewer/`](src/reader/viewer/) or [`reader/praxisBar/`](src/reader/praxisBar/), and how it looks is free.
- **Wiring hooks, storage and notebook entries together?** The session: [`PracticeMode`](src/reader/PracticeMode.tsx) or [`AnnotateMode`](src/reader/AnnotateMode.tsx).

If the answer is "several of these", the piece probably needs splitting along the picture's lines.
