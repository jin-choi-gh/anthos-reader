# Concept

## Synopsis

A poem arrives in `text-data/` as a loom textual complex. [`loom/`](src/loom/) builds it into **Literary Material**: a [`Poem`](src/material/types.ts) of stanzas and lines, and the editor's [`Notes`](src/material/types.ts) on it, each [`Note`](src/material/types.ts) covering ranges of lines.

An editor writes a [`Practice`](src/practice/types.ts) for that text: the **Practice Reel**. It is split into [`Stage`](src/practice/types.ts)s, and each stage into [`Step`](src/practice/types.ts)s. A step has one **direction**: _consider_ (look at one of the editor's notes) or _respond_ (write about the whole poem). The **lexicon** ([`partsOf`](src/practice/lexicon.ts)) turns each direction into **parts**: words for the praxis bar (`prose`), editor's notes to pick out in the poem (`highlight`), and something for the reader to write (`writing`). After each stage comes a **rest**, and after the last stage the **final stage**; the editor writes neither.

The **Practice Runner** takes one reader through the practice, over days. What the reader does is kept in a **log** of [`Event`](src/runner/types.ts)s: a step visited, a stage finished. Replaying the log, with the reader's notebook and today's [`Day`](src/clock/clock.ts), gives the **standing** ([`Standing`](src/runner/types.ts)): the **position** (which stage, which step), the day the next stage opens, and the step the reader is **held** at. Reaching a stage's rest finishes it; the next stage opens the next day, and a day starts at 04:00. A step that asks for writing holds the reader until the **User Notebook** has a note from it. So the poem is not read all at once: each day opens a stage, and each stage walks the reader through its steps.

On each step, the **Frame** takes the step the runner's **gate** holds ([`gateOf`](src/runner/gate.ts)), gets its parts from the lexicon, resolves their references against the editor's notes, and finds what the reader has already written there. That is the **subject**. The **Scene** plays the subject: it keeps what is open and what is being written, and projects it to the **Viewer**, which draws the poem and the notes it picks out, and to the **Praxis Bar**, which draws the prose, the writing, and the frame's Back and Next. What the reader writes leaves the scene as an **effect**, and is kept in the notebook, with where in the run it was written.

The same poem can also be read in **annotate mode**, with no runner: every one of the editor's notes, and nothing asked.

## Layers

### Literary Material: [`material/`](src/material/)

The material is the text as everything else uses it, and it knows nothing about any of them. [`toPoem`](src/loom/toPoem.ts) and [`toNotes`](src/loom/toNotes.ts) build it from loom's JSON: the [`Poem`](src/material/types.ts), its [`Line`](src/material/types.ts)s, and the editor's [`Notes`](src/material/types.ts), with each line's [`NoteRange`](src/material/types.ts)s. A place in the poem is a line and an offset counted in code points ([`codePoints`](src/material/codePoints.ts)), the unit loom counts in. A text is known by its [`TextId`](src/material/types.ts), the file it comes from. An [`Anchor`](src/material/types.ts) pins a reader's note to the whole poem.

### Practice Reel: [`practice/`](src/practice/)

A practice is written before it is run, and does not change while it runs: every field is `readonly`, and each practice is written with `satisfies Practice`. The **lexicon** is the only code that reads a step's direction; past it, a step is only its [`Parts`](src/practice/types.ts):

```ts
case "consider": // read the editor's note on a passage
  return { prose: step.prose, highlight: [step.note], writing: null }
case "respond": // write about the whole poem
  return { prose: step.prose, highlight: [], writing: { anchor: "whole", count: "one" } }
```

The rest and the final stage are written in the same terms, as [`REST`](src/practice/lexicon.ts) and [`FINAL`](src/practice/lexicon.ts). A **reference** such as `"@angle-worm"` names an editor's note by its loom id; [`references.ts`](src/practice/references.ts) resolves references ([`noteFor`](src/practice/references.ts)) and checks a practice before it runs ([`problemsOf`](src/practice/references.ts)).

### Practice Runner: [`runner/`](src/runner/)

The runner keeps the log, and from it says where the run stands. Its functions are pure, given the time: [`standingOf`](src/runner/step.ts) replays the log into a [`Standing`](src/runner/types.ts):

```ts
export interface Standing {
  readonly position: Position
  readonly opensOn: Day | null
  readonly heldAt: number | null
}
```

The **gate** ([`gateOf`](src/runner/gate.ts)) is the only code that reads the practice at a position. Only the runner adds the rests and the final stage, so a position the practice does not have is the runner's mistake, and it throws. The **law** ([`ruling`](src/runner/step.ts)) says whether the reader may move to a step, or gives a [`Reason`](src/runner/types.ts) why not: no such step, the next stage not open, a step on the way that asks for writing and has none (`unanswered`), or the practice over. The law knows nothing of how the reader moves; that is the frame's **gait**. A move the law allows is logged by [`eventsOfMove`](src/runner/step.ts). A finished stage never holds the reader again. The runner reads the notebook and never writes it; [`useRun`](src/runner/useRun.ts) runs it in React.

### User Notebook: [`notebook/`](src/notebook/)

The notebook is what the reader writes about a text, one per text, kept for good. It is kept as [`NotebookEvent`](src/notebook/types.ts)s (`noted`, `revised`, `withdrawn`), never overwritten, so no earlier version of a note is lost. Each [`ReaderNote`](src/notebook/types.ts) has an anchor, and a [`Provenance`](src/notebook/types.ts): the practice, stage and step it was written on, or `null` in annotate mode. [`notesOf`](src/notebook/notebook.ts) folds the events into the notes as they stand; [`eventOfNoting`](src/notebook/notebook.ts), [`eventOfRevising`](src/notebook/notebook.ts) and [`eventOfWithdrawing`](src/notebook/notebook.ts) turn the reader's intentions into events, and refuse what makes no sense; [`notesFrom`](src/notebook/notebook.ts) finds the notes written on one step. A [`NoteId`](src/notebook/types.ts) is made in one place only. [`useNotebook`](src/notebook/useNotebook.ts) opens a text's notebook in React.

### Frame: [`reader/frame/`](src/reader/frame/)

The frame sits on one step. [`frameOf`](src/reader/frame/frame.ts) makes a [`Frame`](src/reader/frame/types.ts) from where the run stands: a heading (the stage's name, or the practice's title in the final stage), the law's rulings on a step back and a step on, and the **subject**, with every reference resolved against the editor's notes and the notebook. The practice and the standing go no further than the frame. The frame's **gait** is a step back and a step on; [`controlsOf`](src/reader/frame/controls.ts) makes those rulings into [`FrameControls`](src/reader/frame/controls.ts), and a refusal as `unanswered` becomes no control at all. In annotate mode, [`annotateFrame`](src/reader/frame/frame.ts) has no rulings, and its subject is every editor's note, listed.

### Scene: [`reader/scenes/`](src/reader/scenes/)

The scene plays a [`Subject`](src/reader/scenes/types.ts). It knows no practice, no position and no direction, only parts:

```ts
/** Which step this is. A new key starts the scene afresh. The same key with a fresh subject keeps
 * the scene's state while something around it changes, such as the notebook. */
readonly key: string
```

It has one behaviour per part. The **commentary** ([`parts/commentary.ts`](src/reader/scenes/parts/commentary.ts)) answers the viewer: which editor's note is open. The **writing** ([`parts/writing.ts`](src/reader/scenes/parts/writing.ts)) answers the praxis bar: it keeps the draft, and acts on `draft`, `submit`, `edit` and `cancel`. The prose has no behaviour. The scene does no I/O: what the reader writes leaves as an [`Effect`](src/reader/scenes/types.ts), and the mode writes it in the notebook with where it was written. The viewer and the praxis bar never talk to each other, only to the scene. [`scene`](src/reader/scenes/scene.ts) is pure; [`useScene`](src/reader/scenes/useScene.ts) keeps it in React, and delivers its effects after keeping its state.

### Viewer: [`reader/viewer/`](src/reader/viewer/)

The viewer draws the scene's [`ViewerProjection`](src/reader/scenes/types.ts): the poem, the editor's notes it picks out (`marked`) or all of them (`listed`), and the one that is open. It tells the scene which note was tapped or closed. [`PoemBlock`](src/reader/viewer/PoemBlock.tsx) cuts each line at the edges of its notes' ranges ([`cut`](src/reader/viewer/cut.ts)).

### Praxis Bar: [`reader/praxisBar/`](src/reader/praxisBar/)

The praxis bar draws two things that never meet: the frame's controls (its heading, Back and Next), and the scene's [`PraxisBarProjection`](src/reader/scenes/types.ts) (the prose, and the writing, in [`NotebookPage`](src/reader/praxisBar/NotebookPage.tsx)). It tells the scene what the reader writes, and puts a refusal into words ([`reasonText`](src/reader/praxisBar/reasonText.ts)).

### Around the layers

- **The Reader** ([`reader/`](src/reader/)): the [`Reader`](src/reader/Reader.tsx) for one text loads its material and picks a mode ([`modeOf`](src/reader/mode.ts)). [`PracticeMode`](src/reader/PracticeMode.tsx) holds the run, the notebook, the frame and the scene, and writes the scene's effects in the notebook. [`AnnotateMode`](src/reader/AnnotateMode.tsx) holds a frame and a scene with no runner. The **pen** ([`ModeToggle`](src/reader/ModeToggle.tsx)) switches between them through the URL, and switching brings a new frame and a new scene.
- **The clock** ([`clock/`](src/clock/)) says what time it is and which day. **Storage** ([`storage/`](src/storage/)) keeps the log and the notebook in the browser, and reads each back through a guard, so a damaged log loses only what it cannot read.
- **The library** ([`library/`](src/library/)) lists every text, each a way into its Reader. [`ui/`](src/ui/) holds what every part draws with. The app ([`App.tsx`](src/App.tsx), [`route.ts`](src/route.ts)) opens the library or a Reader from the URL. The **dev panel** ([`reader/dev/`](src/reader/dev/)), in development only, works the runner, the clock and the notebook directly.

## Glossary

| Term          | Meaning                                                                                  | Code                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| anchor        | where a reader's note is pinned: the whole poem                                          | [`Anchor`](src/material/types.ts)                                                                          |
| annotate mode | the Reader with no runner: every editor's note, nothing asked                            | [`AnnotateMode`](src/reader/AnnotateMode.tsx), [`annotateFrame`](src/reader/frame/frame.ts)                |
| commentary    | the editor's notes, as a subject shows them: picked out (`marked`) or all (`listed`)     | [`Commentary`](src/reader/scenes/types.ts), [`parts/commentary.ts`](src/reader/scenes/parts/commentary.ts) |
| controls      | the frame's rulings made into Back and Next: one that goes, one refused, or none         | [`FrameControls`](src/reader/frame/controls.ts), [`Control`](src/reader/frame/controls.ts)                 |
| day           | a local date; a day starts at 04:00                                                      | [`Day`](src/clock/clock.ts), [`DAY_STARTS_AT`](src/clock/clock.ts)                                         |
| direction     | what a step asks of the reader: _consider_ or _respond_                                  | [`Step`](src/practice/types.ts)                                                                            |
| editor's note | one note of the editor's, on a range of the poem                                         | [`Note`](src/material/types.ts)                                                                            |
| effect        | what the scene sends out to be written in the notebook: a note, or a revision            | [`Effect`](src/reader/scenes/types.ts)                                                                     |
| event         | one thing in the log: a step `visited`, a stage `finished`                               | [`Event`](src/runner/types.ts)                                                                             |
| final stage   | the stage after the last: the practice is done                                           | [`FINAL`](src/practice/lexicon.ts)                                                                         |
| frame         | the step being shown: its heading, the rulings on moving, its subject                    | [`Frame`](src/reader/frame/types.ts), [`frameOf`](src/reader/frame/frame.ts)                               |
| gait          | how the frame moves: a step back and a step on                                           | [`frameOf`](src/reader/frame/frame.ts)                                                                     |
| gate          | what is at a position: a step, a rest, or the final stage                                | [`gateOf`](src/runner/gate.ts), [`Gate`](src/runner/types.ts)                                              |
| highlight     | the part that picks out editor's notes in the poem, by reference                         | [`Parts`](src/practice/types.ts)                                                                           |
| hold          | the runner keeps the reader at a step that asks for writing until it has a note          | [`Standing`](src/runner/types.ts) `heldAt`                                                                 |
| key           | which step a subject is: a new key starts the scene afresh; the same key keeps its state | [`Subject`](src/reader/scenes/types.ts)                                                                    |
| law           | whether the reader may move to a step, or why not                                        | [`ruling`](src/runner/step.ts), [`Reason`](src/runner/types.ts), [`Ruling`](src/runner/types.ts)           |
| lexicon       | the only code that reads a direction: it gives a step's parts                            | [`partsOf`](src/practice/lexicon.ts)                                                                       |
| library       | every text, each a way into its Reader                                                   | [`Library`](src/library/Library.tsx)                                                                       |
| log           | the events of one run, kept in storage                                                   | [`readLog`](src/runner/log.ts), [`logKey`](src/runner/log.ts)                                              |
| material      | a text as everything else uses it: its poem and the editor's notes                       | [`Material`](src/material/materials.ts), [`Poem`](src/material/types.ts), [`Notes`](src/material/types.ts) |
| mode          | practice mode or annotate mode, chosen by the URL                                        | [`Mode`](src/reader/mode.ts), [`modeOf`](src/reader/mode.ts)                                               |
| notebook      | what the reader writes about a text, one per text, kept as events                        | [`NotebookEvent`](src/notebook/types.ts), [`useNotebook`](src/notebook/useNotebook.ts)                     |
| parts         | what a step is made of: `prose`, `highlight`, `writing`                                  | [`Parts`](src/practice/types.ts)                                                                           |
| pen           | the toggle between practice mode and annotate mode                                       | [`ModeToggle`](src/reader/ModeToggle.tsx)                                                                  |
| poem          | the text's title, poet, stanzas and lines                                                | [`Poem`](src/material/types.ts), [`toPoem`](src/loom/toPoem.ts)                                            |
| position      | where the reader is: a stage and a step                                                  | [`Position`](src/runner/types.ts)                                                                          |
| practice      | stages of steps, written by an editor for one text                                       | [`Practice`](src/practice/types.ts)                                                                        |
| practice mode | the Reader with the runner running                                                       | [`PracticeMode`](src/reader/PracticeMode.tsx)                                                              |
| praxis bar    | draws the frame's controls, the prose and the writing                                    | [`PraxisBar`](src/reader/praxisBar/PraxisBar.tsx)                                                          |
| projection    | what the scene tells the viewer or the praxis bar to draw                                | [`ViewerProjection`](src/reader/scenes/types.ts), [`PraxisBarProjection`](src/reader/scenes/types.ts)      |
| prose         | the part with a step's words for the praxis bar                                          | [`Parts`](src/practice/types.ts)                                                                           |
| provenance    | where in a run a note was written                                                        | [`Provenance`](src/notebook/types.ts)                                                                      |
| Reader        | everything for one open text: its material, its mode                                     | [`Reader`](src/reader/Reader.tsx)                                                                          |
| reader's note | a note in the notebook, as it stands                                                     | [`ReaderNote`](src/notebook/types.ts), [`NoteId`](src/notebook/types.ts)                                   |
| reference     | a step's name for an editor's note, `"@angle-worm"`                                      | [`noteFor`](src/practice/references.ts), [`idOf`](src/practice/references.ts)                              |
| rest          | after each stage's last step: nothing said or asked                                      | [`REST`](src/practice/lexicon.ts), [`restOf`](src/runner/gate.ts)                                          |
| run           | one reader's way through a practice                                                      | [`useRun`](src/runner/useRun.ts), [`Run`](src/runner/useRun.ts)                                            |
| runner        | runs a practice for one reader, over days                                                | [`standingOf`](src/runner/step.ts), [`eventsOfMove`](src/runner/step.ts)                                   |
| scene         | plays a subject: keeps its state, answers the viewer and the praxis bar                  | [`scene`](src/reader/scenes/scene.ts), [`useScene`](src/reader/scenes/useScene.ts)                         |
| stage         | a group of steps, opened one day at a time                                               | [`Stage`](src/practice/types.ts)                                                                           |
| standing      | where the run stands: the position, when the next stage opens, the step held at          | [`Standing`](src/runner/types.ts)                                                                          |
| step          | one direction in a practice                                                              | [`Step`](src/practice/types.ts)                                                                            |
| subject       | what the frame hands the scene: parts, with every reference resolved                     | [`Subject`](src/reader/scenes/types.ts)                                                                    |
| text id       | a text's file in `text-data/`                                                            | [`TextId`](src/material/types.ts)                                                                          |
| viewer        | draws the poem and the editor's notes                                                    | [`ViewerPage`](src/reader/viewer/Viewer.tsx), [`ViewerNotes`](src/reader/viewer/Viewer.tsx)                |
| writing       | the part asking the reader to write: one note on the whole poem                          | [`Writing`](src/practice/types.ts), [`parts/writing.ts`](src/reader/scenes/parts/writing.ts)               |

## The principle: a direction is read twice

> A direction is interpreted **twice**: once in the **Practice Reel**, where the lexicon says which parts it is made of, and once by the **Viewer** and the **Praxis Bar**, which draw the parts. Everything in between carries parts, and never asks which direction it is carrying.

So a new direction made of parts that already exist is one case in the lexicon. A new part needs code in the Scene, to play it, and in the Viewer or the Praxis Bar, to draw it.

## Who may know whom

Each layer knows only the layers before it. The material knows nothing. The Practice Reel knows the material, because it refers to it. The User Notebook knows the material and the practice. The Practice Runner knows the practice and the notebook. The Frame knows all of these; the Scene never knows the practice or the runner; the Viewer and the Praxis Bar know the Scene.

The layers are a table in [`src/test/layers.ts`](src/test/layers.ts), and [`src/test/architecture.test.ts`](src/test/architecture.test.ts) enforces it. It fails on any import that crosses the layers the wrong way, and on any new folder that has not been given a layer:

```ts
export const LAYERS: Readonly<Record<string, readonly string[]>> = {
  material: [], // Literary Material: knows nothing else
  loom: ["material"], // builds Literary Material from loom's JSON
  practice: ["material"], // Practice Reel
```

Change [`LAYERS`](src/test/layers.ts) only when the layers themselves change, and change this file with it.

## Where does new code go?

- **About the poem or the editor's notes themselves?** [`material/`](src/material/), or [`loom/`](src/loom/) if it reads loom's JSON.
- **Something the editor writes in a practice?** [`practice/`](src/practice/). A new direction is a case in the lexicon.
- **Where a reader is, what they may do next, when a stage opens?** [`runner/`](src/runner/).
- **Something the reader writes, or reads back?** [`notebook/`](src/notebook/).
- **What the Reader does with the reader's actions, with no I/O?** [`reader/scenes/`](src/reader/scenes/), as a part.
- **Drawing?** [`reader/viewer/`](src/reader/viewer/) or [`reader/praxisBar/`](src/reader/praxisBar/); how it looks is free.
- **Wiring hooks, storage and effects together?** The mode: [`PracticeMode`](src/reader/PracticeMode.tsx) or [`AnnotateMode`](src/reader/AnnotateMode.tsx).

If the answer is "several of these", the piece probably needs splitting along the layers.

## Retired words

Don't use: _footage_ (the poem), _commentary track_ (the editor's notes), _timecode_ (a line and an offset), _frame_ for a step (a step), _intermission_ and _end card_ (the rest, the final stage), _citation_ (reference), _projector_ and _projectionist_ (the runner), _counter_ (position), _read-out_ (standing), _cut_ and _the shot continues_ (a new key, the same key), _picture_ (the viewer), _intertitle_ (prose), _notebook page_ (writing), _notebook entry_ (effect), _projector's controls_ and _booth_ (the frame's controls), _screen_, _screening_ and _viewing table_ (the Reader, practice mode, annotate mode), _programme_ (the library), _print_, _lab_, _claw_, _iris_, _spectator_, _staging_, _shelf_, _house clock_, _tape_, _camera on a film set_.

## This file

This file is the architecture **as it is, and as it should be, now**, and it is the law: where the code and this file disagree, the code is wrong, until the user changes the law. It holds no history and no plans. It covers the processes behind the screen, not how anything looks: appearance, layout, wording and placement are outside it.

Every file, folder and name it mentions links to the code. [`src/test/concept.test.ts`](src/test/concept.test.ts) follows the links, and fails when this file and the code drift apart:

- a link leads to a file or folder that is not there;
- a linked name is not declared in the file it links to;
- a line of code quoted here is not in the source;
- a layer of [`LAYERS`](src/test/layers.ts) has no place in this file.
