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