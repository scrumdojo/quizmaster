# 🎫 AI-chat voor doorvragen op de toelichting bij quizvragen (Learning Mode)

## User story
Als gebruiker van de learning mode wil ik vrij kunnen doorvragen op de toelichting bij een quizvraag, zodat ik — afhankelijk van mijn behoefte — onbegrepen termen uitgelegd krijg, een dieper antwoord krijg, een concreet voorbeeld krijg, of een alternatieve uitleg (bv. een vergelijking/metafoor), zonder de app te moeten verlaten.

## Context / aanleiding
Origineel ticket meldde: *"De toelichting op de vragen vind ik niet afdoende. Ik wil kunnen doorvragen op de uitleg bij de antwoorden van de quizvragen."*

Na doorvragen (interview met gebruiker) blijkt dit geen vast probleem met lengte of diepgang van de toelichting zelf, maar een **behoefte aan interactief doorvragen**, met uiteenlopende doelen per moment:

- Onbegrepen vakjargon (bv. "systeemprompt")
- Behoefte aan een uitgebreidere/diepere uitleg van het concept
- Behoefte aan een concreet voorbeeld
- Behoefte aan een alternatieve uitleg (bv. metafoor/vergelijking)

Gebruiker geeft aan dit **cruciaal** te vinden voor het leerproces — haakt soms af door onbegrepen uitleg.

## Gewenste oplossing
- Een AI-chat waarin de gebruiker een **vrije, open vervolgvraag** kan stellen (geen vaste multiple-choice vervolgvragen, want de behoefte varieert per situatie).
- De chat neemt **automatisch context mee**: de quizvraag, het gegeven antwoord én de toelichting — gebruiker hoeft dit niet zelf te herhalen.
- Chatvenster verschijnt **inline, direct onder de toelichting**, uitklapbaar.
- Beschikbaar bij **elke quizvraag** in learning mode.
- De chat is **begrensd tot het onderwerp van de betreffende quizvraag** (geen algemene/open chat losstaand van de leerstof). Bij een off-topic vraag herkent de AI dit en verwijst vriendelijk terug naar de leerstof, zonder het gesprek hard af te breken.
- **Chatgeschiedenis blijft behouden per quizvraag**, zodat de gebruiker een lopend gesprek kan vervolgen zolang die vraag actief is.
- De AI volgt de **toon en taal van de gebruiker**, tenzij deze grof of onvriendelijk is — dan blijft de AI neutraal en vriendelijk.

## Acceptatiecriteria
- [ ] Onder elke toelichting in learning mode is een uitklapbaar chatveld zichtbaar.
- [ ] Bij openen van de chat heeft de AI zonder extra input al de vraag, het antwoord en de toelichting als context.
- [ ] Gebruiker kan een vrije tekstvraag stellen en de AI beantwoordt naar type behoefte, o.a. getest op:
  - [ ] Uitleg van een onbekende term (bv. "wat is een systeemprompt?")
  - [ ] Verzoek om diepere/uitgebreidere uitleg (bv. "leg dit uitgebreider uit")
  - [ ] Verzoek om een voorbeeld (bv. "geef hier een voorbeeld van")
  - [ ] Verzoek om een alternatieve uitleg/vergelijking (bv. "leg dit uit met een vergelijking")
- [ ] Functionaliteit werkt op elke quizvraag, niet beperkt tot een subset van onderwerpen.
- [ ] De chat blijft functioneel begrensd tot de context van de betreffende quizvraag; bij een off-topic vraag verwijst de AI vriendelijk terug naar de leerstof.
- [ ] Chatgeschiedenis binnen één quizvraag blijft behouden zolang de gebruiker op die vraag actief is (bv. bij opnieuw uitklappen van het chatveld).
- [ ] AI-toon volgt de toon/taal van de gebruiker; bij grove of onvriendelijke input blijft de AI neutraal en vriendelijk (geen escalatie in toon).

## Buiten scope (voor nu)
- Uitleg waarom een *ander* (fout) antwoord incorrect was — niet expliciet gevraagd door gebruiker.

## Prioriteit
**Hoog** — gebruiker geeft aan af te haken door dit probleem; directe impact op leerproces/retentie.

## Open vragen voor het team
Geen — alle eerdere open punten (toon, scope-begrenzing) zijn afgestemd met de gebruiker.

---
*Gerefined via AI-interview (critical incident + laddering techniek) met de gebruiker.*

## Vertical slices (implementatie-aanpak)

*Toegevoegd na technische verkenning van de codebase, zodat het epic stap voor stap gebouwd kan worden. Elke slice is end-to-end (BE + FE + specs) en los te demonstreren.*

### Herbruikbaar patroon: Robin AI

Deze feature is architecturaal bijna een kopie van de bestaande **Robin AI** flow (`docs/ai-assistant.md`), maar dan voor de *taker* in plaats van de *maker*:

- Eén stateless backend-endpoint, bijv. `POST /api/question/{id}/explanation-chat`, analoog aan `AiAssistantController` / `AiAssistantService`.
- Eén nieuwe system-prompt (`backend/src/main/resources/prompts/explanation-chat.md`), analoog aan `robin-chat.md`.
- **Frontend bezit het transcript** en stuurt het steeds volledig mee; backend blijft stateless tussen calls (geen nieuwe DB-tabel nodig — zelfde ephemeral aanpak als Robin).
- Aanknopingspunt in de FE: `frontend/src/take/question-take/question-form.tsx` / `components/question-feedback.tsx`, waar `questionExplanation` al beschikbaar is zodra feedback getoond wordt.

### Aanname over scope

De epic spreekt over "learning mode", maar de toelichting wordt op dezelfde manier direct getoond bij zowel een quizvraag in **Learning mode** (`QuizMode.LEARN`) als bij een **losse vraag** (`/question/:id`, die geen exam/learn-onderscheid kent). Voorstel: de chat triggeren op "toelichting is zichtbaar" in plaats van hard op de `QuizMode.LEARN`-enum — dat dekt beide taker-flows zonder aparte code-paden en is vermoedelijk ook wat de gebruiker bedoelt. Leg dit kort voor aan de PO voor bevestiging bij slice 1.

### Slice 1a — Chatvenster tonen, zonder domeincontext

Het dunste mogelijke end-to-end pad: bewijst dat de keten UI → backend → OpenRouter → UI werkt, volledig los van quizdata.

- Onder de toelichting verschijnt een uitklapbaar chatveld (dicht bij standaard) met tekstinvoer en verzendknop.
- Nieuw component/hook analoog aan `robin-sheet.tsx` / `use-robin-prompt-form.ts`, maar onder `frontend/src/take/question-take/` (bijv. `explanation-chat-sheet.tsx` + `use-explanation-chat.ts`). FE-transcript-state net als Robin (in-memory, ephemeral).
- Nieuw, minimaal BE-endpoint (bijv. `POST /api/question/{id}/explanation-chat`) analoog aan `AiAssistantController`/`AiAssistantService`, met een generieke placeholder-prompt (geen vraaginhoud erin) — puur om de OpenRouter-verbinding, config en foutafhandeling (bv. 503 bij ontbrekend token, zie `AiAssistantService`) te bewijzen.
- Geen vraag/antwoord/toelichting in de prompt; dat komt in 1b.
- Dekt AC1 en het technische fundament onder AC6 (transcript-state bestaat al, wordt in 1b inhoudelijk gevuld).

### Slice 1b — Vraagcontext koppelen aan het gesprek

- Sheet geeft `questionId` (en evt. `attemptId`) mee bij het openen; backend haalt zelf `Question.question`, `answers[]`, `explanations[]`/`questionExplanation` op — context gaat als ID-referentie over de wire, niet als vrije tekst vanaf de client (consistent met hoe Robin `excludedQuestionId` doorgeeft in plaats van de hele vraag).
- Vervangt de placeholder-prompt door een echte system-prompt (`prompts/explanation-chat.md`) die deze data als opening van het gesprek meeneemt — analoog aan Robin's `seedTranscript`-truc in `use-robin-prompt-form.ts:32-38`.
- Meerdere vervolgvragen binnen dezelfde sessie blijven werken en behouden bij opnieuw in-/uitklappen zolang de vraag actief is (FE-transcript uit 1a wordt nu inhoudelijk gevoed).
- Dekt AC2, AC6, en een deel van AC3 (antwoord verwijst nu naar de specifieke vraag/toelichting, nog niet per-onderwerp getest).

### Slice 2 — Werkt op elke vraagtype en elk onderwerp

- Contextopbouw expliciet correct voor alle drie vraagtypen (single-choice, multiple-choice, numerical) — elk heeft een andere antwoordvorm die mee moet in de prompt-context.
- Specs met de 4 concrete behoefte-voorbeelden uit de AC's (onbekende term, diepere uitleg, voorbeeld, vergelijking) om te bevestigen dat het antwoord zich naar de vraag van de gebruiker voegt.
- Geen nieuwe UI; puur prompt- en contextverbreding.
- Dekt AC3 (volledig) en AC4.

### Slice 3 — Functionele begrenzing: off-topic vraag wordt vriendelijk teruggeleid

- Prompt-instructie + gedrag: bij een vraag die niets met de quizvraag te maken heeft, verwijst de AI vriendelijk terug naar de leerstof zonder het gesprek af te breken (chat blijft open en bruikbaar).
- Specs: expliciet off-topic voorbeeld + vervolgvraag die wél weer on-topic is, om te bevestigen dat het gesprek niet blijvend "op slot" gaat.
- Dekt AC5.

### Slice 4 — Toon volgt de gebruiker, blijft neutraal bij grofheid

- Prompt-instructie voor toon/taal-matching, met expliciete uitzondering: bij grove/onvriendelijke input blijft de AI neutraal en vriendelijk (geen escalatie).
- Specs met een beleefde en een grove input, die beide een passend antwoord verifiëren.
- Dekt AC7.

### Slice 5 — Robuustheid en afronding

- Foutafhandeling richting de gebruiker (bv. AI-call faalt) in plaats van een stille no-op — analoog aan de foutafhandeling in `use-robin-prompt-form.ts`.
- Edge cases: vraag zonder toelichting, herhaalde poging van een learning-quiz (quizzes kunnen opnieuw gedaan worden — chat start dan logischerwijs leeg per nieuwe poging).
- Documentatie: `docs/ai-assistant.md` en `docs/domain-language.md` bijwerken met deze nieuwe taker-gerichte AI-chat, zodra de eerste slices gemerged zijn (conform de repo-regel dat code en docs samen meebewegen).