# Anthos — Product Spec

Oct 23, 2026 · @Jin

## Overview

**Anthos** (codename) is a poetry app built on three pillars: **Discovery** finds poems, **Growth** makes you converse with them, and **Creation** is what that conversation leads to.

| Pillar    | What it is                                                  | Screens                                                               | What it asks of you                                                                     |
| --------- | ----------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Discovery | The poem bank, with a dating-app card loop                  | Poem Bank, Bookmarks                                                  | Choose: ignore, bookmark or seed. Seeds and plots are scarce, so a seed is a commitment |
| Growth    | The pedagogic heart: the garden and its three reading views | Garden; Deep Reader, Long View and Deep Discovery                     | Return on six separate days, annotate, and respond at length                            |
| Creation  | Free response to poems grown to Bloom and harvested         | Anthologies, long-form composition, multimedia responses, peer review | Make something; submit the best back into Growth                                        |

Growth and Creation feed each other. Long-form and multimedia responses are composed in Creation and, once peer reviewed, are planted back into Growth: long responses in the Long View, multimedia and intertextual connections in Deep Discovery.

The audience is readers who want more poetry in their lives without a syllabus, students who want guided close reading, and committed readers who want to publish their own readings.

&#91;embedded content: core flow · bank to garden to reader and discovery\]

Discovery feeds Growth through seeds; Growth feeds Creation through harvest; and Creation returns to Growth through peer review.

## Navigation

Five tabs, as a bottom bar on phones and a sidebar on the web. Each names something a reader does, and together they follow a reading's life: found in Discover, grown in the Garden, shaped in Trails, shared in Voices, kept in You.

| Tab      | Icon         | What it holds                                                                                                                            |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Discover | Compass      | Writing curated by Anthos's editors, met one piece at a time; Bookmarks as a subview                                                     |
| Garden   | Sapling      | Deep reading along paths laid down for you: four stages of reading, and on the fifth day the text blooms                                 |
| Trails   | Winding path | Ways of reading: voiceover, video, intertextual links, and the trails readers make. The anthology forms and the writing studio live here |
| Voices   | Speech       | Readers' published reflections, after review. You hear the voices only for texts you have bloomed                                        |
| You      | Person       | Self-reflection. Your Anthology gathers every bloom with your notes, each publishable once                                               |

This supersedes earlier sections where they differ: Others is no longer a reading mode in the Garden, posting during the stages is replaced by publishing at Bloom, and what earlier sections call Curations, Anthologies or Create now lives in Trails.

## Bloom, Voices and Your Anthology

On the fifth reading day the text blooms. Bloom is the moment to look back over what you wrote and decide whether to share it.

1. **Reflect.** The Bloom screen gathers your Self notes on the text and asks for a short reflection: what changed in your reading over the five days.
2. **Choose.** You pick which notes go with the reflection. Nothing is shared by default.
3. **Publish once.** A bloom can be published once. It goes to review, then into Voices. You can also keep it private and publish it later from Your Anthology, still only once.
4. **Harvest.** The bloomed text joins Your Anthology, published or not, and frees its plot.

**Voices.** A text's voices are the published reflections on it. You hear them only for texts you have bloomed, so nobody's reading is shaped by others' before it is finished. Publishing is earned by growth, not bought: any tier can publish a bloom.

**Your Anthology.** In You: every bloom, with your notes and reflection attached, in the order you bloomed them. Each shows whether it is private, in review or published, with Publish on those not yet published.

## Trails

Trails is about shaping how texts are read: a trail is a guided way through one or more texts. It is the least settled part of Anthos, so the first release keeps it small.

- **Editors' trails** are the grand curations (the Sonnets, the _Dao De Jing_, _The Conference of the Birds_, the _Vita Nuova_) and their editions, with voiceover, video and intertextual links. They open as you bloom their texts, by the rules under Curations.
- **Readers' trails** are made from your blooms with the anthology forms (book, Tree of Life, natal chart, constellation) and the writing studio. A published trail goes through the same review as Voices.
- **First release:** one editors' trail and the Keep form.

## The Poem Bank

The bank shows one poem card at a time from a randomised loop, and every card ends in one of three actions.

A card shows the title, poet, year and a few tags (form, era, theme). Unlike a profile photo, a poem has to be read before it can be judged, so the card scrolls vertically to show the whole text. Only a deliberate horizontal swipe counts as a decision, which stops accidental choices while scrolling.

| Action   | Gesture                                                 | Result                                                       | Uses a seed |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------ | ----------- |
| Ignore   | Swipe left, or the Later button                         | Not now: returns to the bank and resurfaces after a cooldown | No          |
| Bookmark | Ribbon button (no swipe, to avoid clashing with scroll) | Saved to Bookmarks, under Discover                           | No          |
| Seed     | Swipe right, or the seed button                         | Planted in the Garden                                        | Yes         |

**Ignoring is deferral, never rejection.** The bank borrows the dating app's rhythm and scarcity, not its verdict. A poem passed over is a shelf walked past, and it will come round again; the real choice in Discovery is the seed, because that commits six days. The interface keeps saying "not now": the button reads _Later_, and a returning poem says so.

Loop rules:

- Random but not uniform: recently seen poems are down-weighted, and ignored poems sit out a cooldown (suggested 30 days) before re-entering. A returning poem is marked "Back again" and opens on a different fragment, so a second look is a second chance rather than a repeat.
- Bookmarked and planted poems leave the loop.
- One-step undo of the last action, as dating apps offer with rewind.
- Optional filters (era, form, length, theme) narrow the loop without breaking its randomness.
- If the bank is personalised, it learns from seeds, blooms and harvests, never from ignores, so passing on a poem never makes it less likely to reach you again.

## Seeds

Seeds are the scarce currency: each planting uses one, and the allowance refills daily. The numbers below are starting proposals to tune against retention and conversion.

- **Reader:** 3 seeds a day, refilled at local midnight, no rollover.
- **Cultivator:** 6 seeds a day, with unused seeds rolling over up to 12. **Patron:** 10 a day, rolling over up to 20.
- **Benefactor:** 15 seeds a day, rolling over up to 30.
- At the free rate a new reader fills a 30-plot garden in about ten days, so seeds stay the daily limit and plots become the long-term one.
- The seed count sits in the bank header. At zero, the seed button shows the time to refill and opens a soft upgrade sheet.
- Out of seeds mid-swipe, a right swipe offers "Bookmark it for tomorrow?" instead of a dead end.
- **A full garden blocks seeding,** whatever seeds remain. A right swipe then offers "Tend your garden" (uproot or harvest to free a plot), "Bookmark it instead", or the next tier's bigger garden.
- Planting from Bookmarks also uses a seed and needs a free plot.
- Uprooting or harvesting does not refund a seed, so seeds cannot be recycled.

## Bookmarks

Bookmarks are a lightweight shelf: the plain text of a poem, with no annotations and no discovery.

- A list sorted newest first, searchable by title and poet.
- Tapping a bookmark opens a basic reader: text, title, poet and source only.
- Each bookmark offers **Plant** (uses a seed, moves it to the Garden) and **Remove** (returns it to the bank).
- The basic reader shows a quiet prompt, "Plant to read deeply", so the contrast with the Deep Reader sells the seed.

## The Garden

The Garden is the matches screen: **30, 40 or 50 plots** depending on your tier, each holding one planted poem whose growth shows how much conversation has happened with it. When every plot is filled you cannot seed again until a plot is freed by uprooting or harvesting, or until you move up a tier.

A poem grows through **six stages, one for each day you read it**. The day you plant it is its first day, so a poem reaches Bloom on the sixth day you spend with it. The days need not be consecutive, and a poem never grows more than one stage in a day.

| Stage        | The plant                  | The reading it opens (see The six stages of reading)           |
| ------------ | -------------------------- | -------------------------------------------------------------- |
| 1. Seed      | A seed in the soil         | First encounter: form and a way in                             |
| 2. Emerging  | A shoot breaks the surface | Close reading                                                  |
| 3. Sprouting | Stem and first leaves      | Other readers                                                  |
| 4. Budding   | A closed bud               | Context                                                        |
| 5. Unfurling | Petals opening             | The critical conversation                                      |
| 6. Bloom     | Full flower                | The poem's afterlife and your own reading; **Harvest** unlocks |

A day counts as a reading day when you open the poem's Deep Reader and do at least one thing with it: spend time on the newly opened layer, write a note, or follow a discovery link. Simply tapping in and out does not count.

**Wilting.** A poem left unread for 7 days wilts. How hard wilting should bite is still open:

| Option                          | What happens                                                                           | For                                 | Against                                         |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| Cosmetic wilt (suggested start) | The plant droops and you get a gentle nudge; one reading day revives it, no stage lost | Encourages return without punishing | Weak pressure; neglected poems keep their plots |
| Wilt, then regress              | After a further week wilted, the plant drops one stage                                 | Real stakes, keeps the garden alive | Feels punitive to busy readers                  |
| Wilt, then compost              | After a long wilt, the poem returns to the bank with notes archived                    | Frees plots automatically           | Readers can lose poems they meant to return to  |

A wilting poem still holds its plot, so wilting doubles as a prompt to read, harvest or uproot. With 30 to 50 plots, several poems may wilt at once, which is another reason to start with the cosmetic rule. Benefactors can pause the garden while away.

- **Plots by tier:** 30 Reader, 40 Cultivator, 50 Patron, 60 Benefactor. In a garden this size the real limit is attention, not space: how many poems you can read.
- **Today first.** The Garden opens on the poems that will grow if you read them today, then those ready to harvest and those wilting. The whole garden sits below as a bed map, one small square per plot.
- **Beds.** You can group plots into named beds (Sonnets, Winter, For the Tree of Life). Beds only organise, but they lead naturally into anthologies.
- In the bed map, a dot marks new reader annotations or links, like an unread message.
- Growth is tied to engagement, never to payment.
- Tapping a plant opens its Deep Reader; a long press opens its actions.

There are two ways to free a plot:

|                          | Uproot                              | Harvest                                       |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| When                     | Any stage                           | Bloom only                                    |
| What happens to the poem | Returns to the bank                 | Moves to the Anthology Maker's harvest basket |
| Your notes               | Archived, restorable if you replant | Travel with the poem into the Anthology Maker |
| Published reading        | Stays up until you withdraw it      | Stays up                                      |
| Feel                     | A break-up                          | A keepsake                                    |

Uprooting asks for confirmation, because it ends the conversation with that poem. Harvesting is celebrated: the flower is cut and pressed, and the plot is left freshly turned for a new seed.

## The six stages of reading

Each growth stage opens one layer of interpretation, moving outward from the words on the page to the poem's place in the world. For the reader, every reading day brings something new; for editors, every poem is the same six-part package.

The order follows one principle: **your own reading comes before anyone else's.** Nobody else's interpretation appears until you have met the poem on its own terms and written something yourself.

| Stage        | Focus                 | Critical mode adds                                                            | Others mode shows                                     | Deep Discovery adds               | Prompt to you                                                |
| ------------ | --------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| 1. Seed      | First encounter       | Form, metre, rhyme scheme and shape; a glossary of hard words; a short way in | Nothing yet                                           | Nothing yet                       | "Which line stayed with you?"                                |
| 2. Emerging  | Close reading         | Line-level notes on imagery, sound and syntax                                 | First impressions: short, felt responses              | Same form, same poet              | "Mark a word that feels charged."                            |
| 3. Sprouting | Other readers         | The poem's open questions and ambiguities                                     | Interpretations, grouped by what they focus on        | Shared images and themes          | "Agree or argue with one reading."                           |
| 4. Budding   | Context               | The historical moment, the poet's life, publication history, textual variants | Readings that draw on context                         | Source texts and allusions        | "Does the context change your reading?"                      |
| 5. Unfurling | Critical conversation | How critics have read it over time, and where they disagree                   | Debates; others' long responses open in the Long View | Answer poems and influence        | "Which reading do you side with?"                            |
| 6. Bloom     | Afterlife             | Translations, adaptations, the poem in art and music                          | Creative responses: poems in reply, images            | Links beyond poetry; the full web | "Write your reading in a few lines", then publish or harvest |

### Reader responses by category

When readers post an annotation, it carries a category: **first impression**, **interpretation**, **context**, **debate** or **creative response**. The category decides the stage at which it appears for others, so a newcomer sees short felt responses first and the debates only once they have grown into them. Editors can re-tag an annotation whose category is wrong. Long responses are not annotations; they live in the Long View.

### What opens at each stage

Features appear as the plant grows, so the six stages teach the app as well as the poem. On the first day a reader meets a poem and a few notes; the full apparatus of Others, the Long View and peer review arrives only once they have grown into it.

| Stage        | You can read                  | You can do                                                                                                               |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1. Seed      | The text and Critical notes   | Write private Self notes                                                                                                 |
| 2. Emerging  | Others' first impressions     | Post first impressions                                                                                                   |
| 3. Sprouting | Interpretations               | Post interpretations                                                                                                     |
| 4. Budding   | Readings that draw on context | Post context readings                                                                                                    |
| 5. Unfurling | Debates; the Long View opens  | Join debates. Subscribers: draft and submit long responses, offer Deep Discovery connections, review others' submissions |
| 6. Bloom     | Creative responses            | Post creative responses; harvest into Creation                                                                           |

**Posting is earned by growth, not bought.** You can post an annotation in a category only once your own plant has reached the stage where that category appears: first impressions from Emerging, debates only from Unfurling. This gives a natural rate limit (two reading days before anything can be posted), a quality filter, and a debate in which everyone has spent time with the poem. Money buys the scholarly voice instead: publishing in the Long View, peer review and offerings to Deep Discovery.

### First release: four reading stages, then Bloom

The first release has four stages of reading, **Seed, Sprouting, Budding and Unfurling**, one per reading day, and on the fifth day the text **blooms**. The Deep Reader has two modes, Critical and Self; other readers are heard in Voices after Bloom. The six-stage track above remains the long-term target.

| Stage        | Reading day | You can read                                                       | You can do                                                            | Editorial work                    |
| ------------ | ----------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------- |
| 1. Seed      | 1           | The text; form, metre and a glossary of hard words; a short way in | Notice: private Self notes, prompted by "Which line stayed with you?" | About 300 words                   |
| 2. Sprouting | 2           | Detailed Critical annotations: imagery, sound and syntax           | More Self notes, now in conversation with the critical layer          | About 600 words                   |
| 3. Budding   | 3           | Context; Deep Discovery's intertextual links                       | Self notes that answer the context                                    | About 300 words plus 4 to 6 links |
| 4. Unfurling | 4           | The poem's open questions; the Long View opens                     | Draft a longer response, if you want to                               | About 200 words                   |
| Bloom        | 5           | Nothing new: your own notes, gathered                              | Reflect, choose notes, publish once to Voices; harvest                | None                              |

- **Bloom carries the reader's own act.** It adds no editorial content: the reflection is written by the reader.
- **Editorial load:** about 1,400 words plus links per poem. A first bank of 150 poems is roughly 210,000 words.
- **Built to expand.** Stages are data, not code: each poem carries a stage track, and plants store their stage by name, so poems can move to the six-stage track one at a time.

### The editorial side

Every poem needs the same six layers, so editors work from one template, and much of it is shared or comes from elsewhere.

| Stage     | Who produces it                                                                                       | Effort per poem | Reuse                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Seed      | Automatic scansion and rhyme detection, checked by an editor, who also writes the way in and glossary | Low             | Glossary entries recur across poems                                                     |
| Emerging  | Editor                                                                                                | Medium          | None; this is the poem-specific close reading                                           |
| Sprouting | Readers supply the responses; an editor writes the open questions                                     | Low             | None                                                                                    |
| Budding   | Editor or commissioned scholar                                                                        | Medium          | High: context modules are written once per poet or period and shared by all their poems |
| Unfurling | Commissioned scholar                                                                                  | High            | Some: critical schools and debates recur within a poet's work                           |
| Bloom     | Editor curates; Deep Discovery supplies most links                                                    | Low to medium   | Translations and adaptations are linked, not written                                    |

- **Missing layers.** If a stage's editorial layer is not ready for a poem, the stage still opens with whatever reader and discovery content exists, and the poem is marked as partly annotated.
- **Bank weighting.** At launch, poems with complete six-stage packages appear more often in the bank, so most readers meet finished poems first.
- **Commissioning in batches.** Because Budding and Unfurling content is shared within a poet or period, it is cheapest to commission poems in clusters, for example ten Dickinson poems at once.

## The Deep Reader

The Deep Reader is the centre of three views that sit side by side at the same level: the poem with its line-anchored annotations. A **left swipe** opens the Long View; a **right swipe** opens Deep Discovery.

Annotations are the text's _pointing towards_: short, anchored gestures from a word or line outward, to a gloss, a sound, an image, a question. Anything longer than a pointing belongs in the Long View.

Critical and Others content arrives in layers as the plant grows (see The six stages of reading). Self is open from the first day, and the Reader shows which stage the poem is at and what the next reading day will open.

Layout: the poem with line numbers, annotated spans underlined in the active mode's colour, and a segmented switch for **Critical · Self · Others** at the top. Tapping an underline opens the annotation in a bottom sheet. Selecting any text offers "Add note", which always writes to Self.

| Mode     | Who writes                          | What it holds                                      | Who sees it                  |
| -------- | ----------------------------------- | -------------------------------------------------- | ---------------------------- |
| Critical | Editors and licensed sources        | Glosses, allusions, metre and sound, context       | Everyone, stage by stage     |
| Self     | You                                 | Your own annotations: notes, highlights, questions | Only you, until you post one |
| Others   | Every reader who posts, on any tier | Annotations other readers have posted              | Everyone, from Sprouting on  |

Every annotation has the same anatomy, whichever mode it belongs to:

- **Anchor:** a line range plus character offsets, tied to stable line ids so text corrections do not orphan notes.
- **Type tag:** gloss, sound, image, allusion, question or response.
- **Body:** short rich text, with optional links to other poems.
- **Author and dates.**
- **Stage or category:** a critical note carries the stage (1 to 6) at which it appears; a reader note carries a category that maps to a stage.

Posting is open to every tier but earned by growth (see What opens at each stage): an annotation in Self has a Post action that shares it to Others once your plant has reached the stage for its category, and it can be withdrawn later. In Others mode, annotations are grouped by reader and by category; readers can be followed, and annotations take an "appreciate" reaction, most appreciated first. Posted annotations are moderated (reports and automated screening) but not peer reviewed, because they are short pointings, not arguments.

## The Long View

The Long View is a left swipe from the Deep Reader, at the same level in the app. Where annotations point at words, the Long View holds sustained responses to the whole poem: critical essays and readers' long-form responses.

It uses the same three modes as the Deep Reader, so the switch feels the same in both places:

| Mode     | What it holds                                   | Who can publish                | Opens at                                |
| -------- | ----------------------------------------------- | ------------------------------ | --------------------------------------- |
| Critical | Longer essays commissioned by editors           | Editors                        | Unfurling (the critical conversation)   |
| Self     | Your drafts of long responses, private          | Anyone can draft               | Seed                                    |
| Others   | Readers' long responses that passed peer review | Subscribers, after peer review | Sprouting, after your own first reading |

- **Reading:** each response opens as a clean reading page with its author, length and the lines it engages, which link back to the Deep Reader.
- **Writing:** "Write a long response" opens the composer in Creation, where long-form writing and its peer review happen. A response is planted back here only once it is accepted.
- **Length:** longer than an annotation, with no fixed limit. The composer suggests a short abstract so readers can choose what to read.
- **Readers and Cultivators** can read everything published here and draft long responses in Self; publishing is for Patrons and Benefactors.

## Peer review

Subscribers' long responses and their offerings to Deep Discovery are published only after review by two other subscribers who have grown the same poem; editors settle disagreements and can publish directly. Posted annotations are not reviewed.

What goes through review:

- Long responses, which are planted in the Long View under Others.
- Intertextual connections offered to Deep Discovery: a link to another poem, a fragment of one, or a work in another medium.
- Multimedia responses made in Creation that their maker proposes for Deep Discovery.

&#91;embedded content: peer review · two reviewers, editor on a split\]

Two accepts publish the work, credited to its author with the reviewers acknowledged. A request to revise sends it back with comments, to the same reviewers. A split goes to an editor; two declines return it with comments.

Who reviews, and how:

- **Eligibility:** subscribers who have grown the same poem to Unfurling or Bloom, so every reviewer has done the reading.
- **Rubric:** grounded in the poem's text; adds something the poem's existing layers don't; clear; civil. For connections: the link is real and its reason can be checked against the matched lines.
- **Load:** each reviewer holds at most three open reviews. A request unanswered after 14 days passes to another reviewer.
- **Visibility:** reviewers see the work without the author's name, and authors don't see who reviewed (whether to go fully open is an open question).
- **Editors** can review anything, decide splits, and withdraw published work after a report.

| Action                                              | Readers and Cultivators | Patrons and Benefactors                   | Editors                        |
| --------------------------------------------------- | ----------------------- | ----------------------------------------- | ------------------------------ |
| Post short annotations to Others (earned by growth) | Yes                     | Yes                                       | Yes                            |
| Draft long responses in Self                        | Yes                     | Yes                                       | Yes                            |
| Publish long responses to the Long View             | No                      | Yes, after peer review                    | Yes, as Critical essays        |
| Offer connections to Deep Discovery                 | No                      | Yes, after peer review                    | Yes, directly                  |
| Propose multimedia responses for Deep Discovery     | No                      | Yes, after peer review                    | Yes                            |
| Review others' submissions                          | No                      | Yes, on poems grown to Unfurling or Bloom | Decide splits; review anything |

## Deep Discovery

Deep Discovery is a right swipe from the Deep Reader, at the same level in the app. It builds the poem's rhizome: connections outward from the text-poem to other media and to fragments of other poems, with more surfacing as the plant grows.

| Relation              | Example                                                                                               | How it is found                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Answer poem           | Raleigh's "The Nymph's Reply to the Shepherd" answers Marlowe's "The Passionate Shepherd to His Love" | Curated pairs plus title and metadata cues                        |
| Allusion or echo      | Eliot's "Prufrock" echoes Marvell's "To His Coy Mistress"                                             | Text-reuse matching on phrases, then semantic similarity of lines |
| Shared form           | Other Petrarchan sonnets, other villanelles                                                           | Form tags and metre analysis                                      |
| Shared image or theme | Other poems about a nightingale, a drowned sailor, a harvest                                          | Line embeddings and theme tags                                    |
| Same poet or circle   | Keats beside Shelley and Leigh Hunt                                                                   | Poet metadata and a relationship graph                            |
| Source text           | Biblical, classical or mythic sources                                                                 | Curated source library                                            |
| Beyond poetry         | Brueghel's _Landscape with the Fall of Icarus_ beside Icarus poems; song settings of a lyric          | Linked open data such as Wikidata, plus curation                  |

Each link is a card showing the related work, the relation type, a one-line reason and the matched lines side by side, so the claim can be checked at a glance. From a card you can bookmark or plant the related poem, which feeds discovery back into the main loop.

How links are generated:

1. **Candidates** come from the metadata graph, text-reuse detection and line-level embeddings.
2. **Grounding:** a language model writes the one-line reason, and only from the matched lines, so it cannot invent a connection.
3. **Filtering** drops links under a confidence threshold. Allusion and source claims need either a text match or editorial curation.
4. **Release with growth:** links open stage by stage, following The six stages of reading: same form and poet at Emerging, sources and allusions at Budding, answer poems at Unfurling, and links beyond poetry at Bloom.
5. **Feedback:** "Useful" and "Not a real link" buttons retune ranking and flag weak links for editorial review.

**Contributions.** Beyond generated links, connections come from people. Editors add them directly. Subscribers offer them, and each offering is published only after peer review. An offering can be a link to another poem or a fragment of one, a work in another medium, or a multimedia response the subscriber made in Creation. Accepted offerings show their contributor's name and the stage at which they open.

## Creation

Creation is what Growth leads to: free response to poems you have grown to Bloom and harvested. It holds four kinds of making. Two of them return to Growth through peer review, and curations open a second way into Discovery.

| Making               | What it is                                                                        | Where it can go                                                                |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Anthologies          | Harvested poems arranged into a form of your choosing, with your notes and images | Stays yours; shareable by link or, for subscribers, in a public gallery        |
| Curations            | An ordered set of poems with a short introduction, made to be grown by others     | Published to readers who have grown enough of its poems; see Curations below   |
| Long-form responses  | Sustained critical or personal writing about one poem, composed here              | Planted in the poem's Long View once peer reviewed                             |
| Multimedia responses | Images, recordings, erasures or other made things responding to a poem            | Planted in the poem's Deep Discovery if peer review accepts that it adds to it |

Creation also holds **peer review**: the queue of submissions you have been asked to review, and the status of your own.

### Curations

A curation is an ordered set of poems with an introduction: a collection meant to be read as a whole. Readers still plant from the universal bank, but curations give their garden a shape and a destination. There are two kinds:

- **Grand curations**, made by Anthos's editors from famous collections and sequences: _Shakespeare's Sonnets_, the _Dao De Jing_, _The Conference of the Birds_, the _Vita Nuova_. They are editorial events, released occasionally.
- **Reader curations**, made by anyone in Creation from poems they have harvested. A Keep anthology can be published as a curation with one action.

**A curation is earned, not browsed.** You see a curation in full only once you have grown all or nearly all of its poems. Until then it is teased: shown half-transparent, with the poems you have grown in full colour and the rest ghosted.

| State        | When                                                         | What you see                                                                            |
| ------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Hidden       | You have grown none of its poems                             | Nothing (grand curations are announced, but not listed)                                 |
| Teased       | You have grown at least one                                  | A ghosted cover with a progress ring; grown poems in colour, the rest as ghosted titles |
| Nearly there | You have grown half or more of the unlock threshold          | Listed on the Nearly there shelf in Create                                              |
| Open         | You have grown the threshold (default 80%, at least 3 poems) | The whole curation: introduction, order, sequence notes and its Long View               |
| Complete     | Every poem grown                                             | A pressed mark on the cover; the curation can be used as a template in Create           |

"Grown" means reached Bloom, whether harvested or still in the garden.

**A teased curation is a second door into the bank.** The bank is random, so nobody will meet all of the Sonnets by chance. From a teased curation you can seed its remaining poems directly, using seeds as usual. Discovery stays random by default; curations are the deliberate path.

**Long works need a core.** Grand curations are often too long to unlock by percentage: 154 sonnets, 81 chapters. Editors therefore mark a **core path**, for example twelve sonnets that trace the sequence's arc, and the curation opens when the core is grown; the rest count towards Complete. Some works also need their own units: the _Vita Nuova_ is grown poem by poem, with Dante's prose shown between them once the curation opens, and _The Conference of the Birds_ is divided into episodes.

**Inside an open curation** the reader finds what no single poem can give: the editors' introduction, the sequence in its order, Critical notes on the sequence as a whole (the arc of the Sonnets, the stages of the birds' journey), and a curation-level Long View.

**Reader curations match readers.** Because a reader curation is visible only to people who have grown most of its poems, it reaches exactly the readers who share its maker's reading. Opening someone's curation is a kind of match, and it is how readers find each other.

**Rights and translation.** The Sonnets are free everywhere. The others need translations that are out of copyright or commissioned: James Legge's _Dao De Jing_ (1891) and Dante Gabriel Rossetti's _The New Life_ (1861) are both out of copyright. For Attar, Edward FitzGerald's _Bird-Parliament_ is out of copyright but abridged, so a commissioned translation may be worth it as an asset of Anthos's own.

### The collection reader

An open curation is read in its own reader, which looks nothing like the Garden's Deep Reader even though both run on the same text backend: the same poems, line ids, translations and annotations. The Garden reader is a **study desk**: one shared design, with the annotation apparatus in front. The collection reader is an **edition**: an aesthetic experience of the whole work, art-directed for that work.

|             | Garden reader                            | Collection reader                                                              |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Purpose     | Study one poem closely, stage by stage   | Experience a whole work as it was meant to be read                             |
| Look        | The Anthos design system on every poem   | Designed per work                                                              |
| Annotations | Front and centre: Critical, Self, Others | Hidden; your own notes appear only as small pressed-flower marks in the margin |
| Media       | Deep Discovery links beside the text     | Built in: original language, recordings, music, period images                  |
| Pace        | Daily, one stage at a time               | Page by page through the sequence, at any speed once open                      |

The first editions, as sketched on the canvas:

- **Shakespeare's Sonnets:** the 1609 quarto's typography at dusk, a Modern/1609 text switch, and a ribbon showing where each sonnet sits in the sequence (the Fair Youth, the Dark Lady).
- **Dao De Jing:** ink on paper, Legge's English beside the Chinese set vertically, a vermilion seal for each chapter, and the chapter read aloud in Mandarin.
- **The New Life:** vellum, red rubrics and illuminated initials, Rossetti's translation with Dante's Italian a tap away, and Rossetti's own paintings as plates.

A "Study this" control opens the same poem in the Garden reader, and an open curation's poems offer "Read it in the edition" in return.

**Built as extensions.** Each edition is an **edition extension**, a fifth extension type alongside forms, tools, materials and exporters, using the same host API. The extension receives the curation's text and the reader's grown poems and notes, and owns only the presentation, so a new edition is a design project rather than an engineering one.

### Anthologies

The Anthology Maker is the stage after the garden: harvested poems are gathered into an artefact of your own design, where the form you choose, the place each poem takes in it, your notes and your images all carry meaning.

Its aim is extra-poetic engagement. An anthology need not be a page-by-page book; it can be a diagram, a chart, a deck or a map, so arranging poems becomes an act of interpretation in its own right.

How it works:

1. **Harvest.** A bloomed poem moves to the harvest basket with its Self annotations and highlights. It stays there for good and can be used in any number of anthologies.
2. **Choose a form.** The overarching shape: a book, a Tree of Life, a natal chart, or one of the forms below.
3. **Place poems.** Drag poems from the basket into the form's positions. Where a poem sits is part of what the anthology says.
4. **Make it yours.** Keep any of your Deep Reader notes beside each poem, write new connecting text, and add images: photos, drawings, scans, collage.
5. **Finish and share.** View it as an interactive artefact, export it to print or as an image, and share a private link.

| Form          | Shape                                             | What a position means                                                                      | What a connection means                               |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Book          | Pages in sequence                                 | A page or spread                                                                           | Reading order                                         |
| Tree of Life  | Ten sephirot on three pillars, joined by 22 paths | The quality of that sphere, from Keter (crown) at the top to Malkuth (kingdom) at the root | A path: your reading of how one poem leads to another |
| Natal chart   | A wheel of 12 houses                              | The house's area of life, such as self (1st), partnership (7th) or vocation (10th)         | Aspects you draw between poems                        |
| Constellation | Stars on a night sky                              | A star, sized by how much you wrote about it                                               | Lines you draw between stars                          |
| Herbarium     | Pressed-specimen sheets                           | A sheet with the poem, its harvest date and your field notes                               | Families you group poems into                         |
| Deck          | Cards to shuffle and deal                         | A card: poem on the front, note or image on the back                                       | Spreads and draws                                     |
| Map           | Places on a real or invented map                  | A place                                                                                    | Routes                                                |
| Blank canvas  | Free arrangement                                  | Whatever you decide                                                                        | Whatever you draw                                     |

Rules and details:

- Only harvested poems can be placed, so every anthology is built from poems you have grown.
- Each form, and each tool for working on poems, is an extension running inside a fixed editor shell, so new ones can be added without rebuilding the editor (see the architecture section below).
- Notes carried in stay linked to the Deep Reader by default; you can detach a copy to rewrite it for the anthology.
- Uploaded images must be your own or licensed to you; images in public anthologies go through the same moderation as published readings.
- Anthologies are private by default. Subscribers can publish them to a public gallery, where other readers can view and appreciate them.

## Anthology Maker architecture: built to extend

The Anthology Maker is the one part of the app built to keep changing. Discover and the Garden each do one job and can keep a fixed UI. The Anthology Maker is a stable **shell** that hosts **extensions**, so the team can ship new forms and new ways of working with poems without rebuilding the editor.

&#91;embedded content: anthology maker layers · extensions over a fixed shell and content model\]

Extensions never touch the content model directly: every read and edit passes through the shell's host API, which is what keeps them safe to add and swap.

### Extension types

| Type          | What it does                                                              | Examples                                                                        |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Form          | Owns the stage: its positions, connections, meanings, layout and gestures | Book, Tree of Life, Natal chart, Constellation, Map                             |
| Tool          | Makes a new artefact from materials, and works inside any form            | Erasure, cut-up, collage, re-lineation, side-by-side translation                |
| Material type | Adds a new kind of thing that can be placed                               | Voice recording, drawing, map pin, found text                                   |
| Exporter      | Turns an anthology into an output                                         | Print PDF, poster image, printable card deck, short video, interactive web page |

### The extension contract

- **Manifest:** id, version, type, name, thumbnail, tier, and the capabilities it needs (media upload, microphone, location).
- **Document schema:** a form declares a JSON Schema for its own data. The shell stores, syncs and versions that data without needing to understand it.
- **Stage component:** renders the document and handles gestures. It reads materials and makes edits only through the host API.
- **Inspector schema:** the properties the shell's inspector shows for a selected item, so most settings need no custom UI.
- **Contributions:** tools for the toolbar, empty-state text and onboarding hints.
- **Migrations:** code that upgrades a document from one version of the extension to the next. Each anthology pins the version it was made with.

The host API is deliberately small: read materials, place, move or remove a material, create a derived artefact, attach media, draw a connection, request a capability, report the selection, and commit an edit.

### Rules the shell enforces

- **Source text is read-only.** Tools never change a poem; an erasure or cut-up is saved as a new derived artefact that links to its source and is labelled as a derivative.
- **Rights travel with the poem.** A licensed poem can carry flags such as "no transformation", and the host API refuses those operations. Public-domain poems carry none.
- **Every edit is an operation.** Because all changes pass through the host, undo, version history and later real-time collaboration work the same in every form.
- **Extensions are sandboxed.** They reach the network, the user's data and device features only through the host API.

### How to build it

- Build the stage with web technology inside the native app, so one extension runs on iOS, Android and the web.
- Build the first-party forms (Book, Tree of Life, Natal chart) on the same API an outside developer would use. If the core team cannot build a form through the API, the API is missing something.
- Ship extensions as versioned bundles behind feature flags, so a new form can reach a test group first. Check current app-store rules on code delivered after install before shipping extensions outside app releases.
- Later, the same contract can become a creator SDK, so poets, artists and teachers can publish forms and tools of their own.

## Tiers

There are four tiers: **Reader** (free), **Cultivator**, **Patron** and **Benefactor**. The names describe how much someone supports Anthos, not how much they know: standing is earned separately, through the harvest and the reviewer levels. Each paid tier has one clear reason to exist. Cultivator pays for **reading more deeply**, Patron for **a voice**, Benefactor for **support and things you can hold**. Reading itself is never locked, so every tier gets every stage, all three Deep Reader modes and Deep Discovery, and nobody can buy a bloom. Elsewhere in this spec, "subscribers" in the context of publishing, peer review and contributions means Patrons and Benefactors.

| Feature                                                                             | Reader                              | Cultivator                         | Patron                               | Benefactor                                                  |
| ----------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Price, monthly / annual                                                             | Free                                | £3.99 / £29.99                     | £6.99 / £54.99                       | £12.99 / £99.99                                             |
| Garden plots                                                                        | 30                                  | 40                                 | 50                                   | 60                                                          |
| Seeds                                                                               | 3 a day                             | 6 a day, rolling over up to 12     | 10 a day, rolling over up to 20      | 15 a day, rolling over up to 30                             |
| The whole library, every stage, Deep Reader, Long View and Deep Discovery (reading) | Full                                | Full                               | Full                                 | Full                                                        |
| Curations                                                                           | Open by growth; sample each edition | Every edition                      | Every edition                        | Every edition, with early access                            |
| Post short annotations to Others (earned by growth)                                 | Yes                                 | Yes                                | Yes                                  | Yes                                                         |
| Beds, undo last swipe, bank filters                                                 | 3 beds                              | Yes                                | Yes                                  | Yes                                                         |
| Anthology forms                                                                     | Book, Tree of Life, Natal chart     | Every form                         | Every form                           | Every form, plus early access to new forms and tools        |
| Publish long responses to the Long View                                             | No                                  | No                                 | Yes, after peer review               | Yes, after peer review                                      |
| Offer connections and multimedia to Deep Discovery                                  | No                                  | No                                 | Yes, after peer review               | Yes, after peer review                                      |
| Peer review and reputation                                                          | No                                  | No                                 | Yes                                  | Yes                                                         |
| Publish reader curations                                                            | No                                  | No                                 | Yes                                  | Yes                                                         |
| Anthology sharing                                                                   | Private link, screen-quality export | Private link, print-quality export | Public gallery, print-quality export | Public gallery, print-quality export                        |
| Printed anthology                                                                   | No                                  | No                                 | No                                   | One a year, printed and posted                              |
| Creator tools (later)                                                               | No                                  | No                                 | No                                   | Publish your own forms and tools once the creator SDK opens |

Who each tier is for:

- **Reader** is for the curious: the whole library and enough room and seeds to build the habit.
- **Cultivator** is for the regular reader who wants a bigger garden, more seeds and the editions.
- **Patron** is for the reader who wants a voice: publishing in the Long View and Deep Discovery, peer review and reputation, and published curations.
- **Benefactor** is for those who want to support the project and hold something in their hands: the largest garden, a printed anthology each year, and first access to new editions, forms and tools.

**Pricing rationale.** UK prices include 20% VAT, and the App Store takes 15% under its Small Business Program, so about 71% of an in-app price and about 80% of a web price reaches Anthos. Assuming 45% of payers choose Cultivator, 40% Patron and 15% Benefactor, and 70% pay annually, the average is about £35 a year per paying subscriber after fees and printing. A team costing about £450,000 a year then needs about 12,700 subscribers, or about 9,000 with £100,000 to £150,000 a year from grants, print and gift sales. Founding members (the first 1,000) get a first year at £29.99 on any paid tier; students pay half; schools and universities buy institutional licences. Prices are tested on the web before launch in the app stores.

Moving between tiers:

- Upgrading adds the new plots at once.
- Downgrading, or a lapsed subscription, never deletes a poem. Plots above the new limit go **dormant**: they keep their stage and notes but cannot grow, and seeding stays blocked until harvesting or uprooting brings the garden back under its limit.
- Published readings and public anthologies follow the open question below.

## Data model

Twenty entities cover the whole flow; a poem's state for each user lives in one record, so the bank, bookmarks, garden and harvest basket are views of the same table.

| Entity          | Key fields                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User            | id, display name, tier (reader, cultivator, patron, benefactor), roles (reader, reviewer, editor), reviewer\_level (reviewer, trusted, fellow)                                                                               |
| Poem            | id, title, poet\_id, year, lines (each with a stable line id), source, rights\_status, rights\_flags (such as no\_transformation), tags                                                                                      |
| Poet            | id, name, birth and death years, circle                                                                                                                                                                                      |
| UserPoemState   | user\_id, poem\_id, state (ignored, bookmarked, planted, uprooted, harvested), changed\_at, cooldown\_until                                                                                                                  |
| SeedWallet      | user\_id, balance, next\_refill\_at, tier (reader, cultivator, patron, benefactor)                                                                                                                                           |
| Plant           | user\_id, poem\_id, plot (1 to the tier's limit), dormant, planted\_at, growth\_stage (seed, emerging, sprouting, budding, unfurling, bloom), reading\_days, last\_reading\_day, wilting\_since, ended\_by (uproot, harvest) |
| Annotation      | id, poem\_id, author\_id, kind (critical, self), visibility (private, posted), anchor (start and end line id plus character offsets), type\_tag, stage (1 to 6, critical notes), category (posted notes), body, timestamps   |
| LongResponse    | id, poem\_id, author\_id, kind (critical essay, reader response), title, abstract, body, engaged\_line\_ids, status (draft, in\_review, revise, published, declined, withdrawn), published\_at                               |
| Submission      | id, kind (long\_response, connection, multimedia), target\_id, author\_id, round, status, editor\_id                                                                                                                         |
| Review          | id, submission\_id, reviewer\_id, verdict (accept, revise, decline), comments, due\_at, submitted\_at                                                                                                                        |
| Relation        | id, poem\_id, artefact\_id, type, reason, matched\_spans, confidence, origin (auto, editor, contributed), contributor\_id, submission\_id, unlock\_stage, feedback counts                                                    |
| Artefact        | id, kind (poem, fragment, painting, song setting, letter, multimedia response), title, creator, year, link                                                                                                                   |
| Fragment        | id, poem\_id, anchor (line ids plus character offsets), created\_by                                                                                                                                                          |
| DerivedArtefact | id, user\_id, tool\_extension\_id, tool\_version, source\_ids (poems or fragments), data (the tool's JSON), label (erasure, cut-up and so on)                                                                                |
| Extension       | id, type (form, tool, material, exporter), version, manifest, document\_schema, inspector\_schema, tier, status (internal, beta, live)                                                                                       |
| Anthology       | id, user\_id, form\_extension\_id, form\_version, title, document (the form's JSON), visibility (private, link, public), timestamps                                                                                          |
| Placement       | anthology\_id, position\_key, material\_ref (poem, fragment, derived artefact, media), carried\_annotation\_ids, detached\_note                                                                                              |
| Media           | id, user\_id, kind (image, audio, drawing, video), url, alt\_text, rights\_confirmed, moderation\_status                                                                                                                     |
| Curation        | id, kind (grand, reader), author\_id, title, introduction, core\_item\_ids, unlock\_threshold (default 0.8, at least 3 poems), visibility, released\_at; progress is derived from the reader's plants                        |
| CurationItem    | curation\_id, position, poem\_id or unit (such as a prose section shown between poems), in\_core                                                                                                                             |

## Content and rights

Launch on public-domain poetry and license modern work later, because rights are the largest cost and risk in the bank.

- **Public domain first.** In the UK and EU a work is generally free 70 years after the author's death; in the US, works published roughly 95 or more years ago are generally free. A poem must clear every territory the app ships in, so each Poem carries a rights\_status checked per region.
- **Sources:** Project Gutenberg and Wikisource hold clean public-domain texts; each poem records the edition it came from.
- **Modern poems** need licences from publishers or estates, usually per poem and per territory. Treat this as a later phase.
- **Critical annotations** should be commissioned and original. Nineteenth-century commentary can be adapted, but modern critical editions cannot be copied.
- **Reader content:** the terms of service grant the app a licence to display published readings, and the author keeps ownership.

This section is product guidance, not legal advice; a rights lawyer should confirm the territory rules before launch.

## MVP scope and open questions

A first release can prove the full grow-and-harvest loop with complete four-stage reading packages for 100 to 150 public-domain poems, commissioned in poet clusters, curated plus metadata-based discovery links, and an Anthology Maker with three forms. More poems join the bank only once their packages are complete, because every seeded poem must be able to bloom.

In the MVP:

- Bank with ignore, bookmark and seed, plus the daily seed allowance
- Bookmarks with the basic reader
- A tiered Garden (30, 40 or 50 plots) with the Today view, bed map, four growth stages (Seed, Sprouting, Budding, Bloom), uproot and harvest
- Deep Reader (Critical, Self, Others) with posting earned by growth, and the Long View with peer-reviewed long responses
- Peer review in Creation for long responses; Discovery offerings and multimedia submissions follow once the queue works
- Deep Discovery with curated and metadata links
- Anthology Maker shell and host API, with the Book, Tree of Life and Natal chart forms built as first-party extensions
- One tool extension (Erasure) to prove the API handles more than layout
- Carried notes, image upload and private sharing

Open questions:

- [ ] Which wilting rule: cosmetic only, regression after a further week, or compost back to the bank? (Options under The Garden.)
- [ ] Is 3 seeds a day too tight for a Reader's first week?
- [ ] Do the proposed prices (£3.99, £6.99 and £12.99 a month) hold up in a web price test, and what share of payers chooses each tier?
- [ ] What exactly counts as a reading day: time on the new layer, a note, a discovery link, or any one of these?
- [ ] Can a harvested poem be replanted to grow it further, or is harvest final?
- [ ] Do lapsed subscribers' published readings and public anthologies stay visible, frozen, or come down?
- [ ] Who writes the critical annotations: in-house editors, commissioned scholars, or a licensed partner?
- [ ] Which forms need expert review (Tree of Life, natal chart) so they are respectful and accurate to their traditions?
- [ ] When should outside creators get the extension SDK: after launch, or only once first-party forms have stress-tested the API?
- [ ] How are derivatives of licensed poems handled if a rights holder allows reading but not erasure or cut-up?
- [ ] Should finishing an anthology earn an extra plot, so making is rewarded with room?
- [ ] Swipe directions: is "left swipe for the Long View, right swipe for Deep Discovery" right, and on desktop which side does each panel sit?
- [ ] Peer review visibility: single-blind as proposed, double-blind, or fully open with reviewers named?
- [ ] Should reviewing earn something (a seed, a badge, a plot), so the review queue keeps moving?
- [ ] Is Anthos the product name or only the codename? Every screen currently uses it as the working name.
- [ ] Curation thresholds: is 80% (at least 3 poems) right for reader curations, and how long should a grand curation's core path be?
- [ ] Are grand curations included in paid tiers, sold as one-off editions, or free events that bring readers in?
- [ ] When to move from four stages to six: per poem as packages are written, or for the whole bank at once?
- [ ] Who reviews a bloom before it reaches Voices: an editor, one trusted reviewer, or the two-reviewer peer review used for long responses?
- [ ] What can be published in Trails by readers, and at which tier?
