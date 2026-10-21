# Agent Dev Team (shelfmark) - Documento di lavoro

> Documento di riferimento del progetto. In caso di discrepanza con le conversazioni, questo documento prevale.
> Ultimo aggiornamento: 2026-10-21

---

## 1. Goal

Realizzare un team di sviluppo composto da agent AI che sviluppa una semplice applicazione (catalogo personale di libri con collocazione fisica) con intervento umano limitato a:

- redazione di requirements e specifiche (con il supporto di un agent architect);
- creazione di issue per bug o cambi di direzione;
- approvazione finale delle merge request (inizialmente obbligatoria).

Vincoli:

- side project sperimentale, senza scadenze;
- costi contenuti, senza rinunciare a funzionalità;
- le configurazioni degli agent (prompt) devono far parte del repository dell'applicazione.

---

## 2. Architettura

### 2.1 Ruoli

| Agent | Ruolo | Modalità | Trigger (fase CI) |
|---|---|---|---|
| agentA | Architect tecnico: dalle specifiche funzionali produce il design realizzativo (moduli, componenti UI, modello dati, contratti, ordine di implementazione) in `docs/design/`; risponde ai chiarimenti tecnici | Interattivo, locale (decisioni riviste dall'umano) | Nessuno inizialmente; in futuro modifiche a `docs/specs/` |
| agentI | Issue planner: crea e aggiorna le issue a partire da specifiche e design (granularità, dipendenze, ordine); risponde ai chiarimenti funzionali citando le specifiche | Headless | Push su `docs/specs/` o `docs/design/`; label `needs-clarification` |
| agentP | Developer: implementa un'issue, chiede chiarimenti nei commenti, apre la PR | Headless | Label `ready`; risposta a un chiarimento; label `changes-requested` |
| agentMR | Reviewer: verifica la PR, interagisce con agentP, approva quando la PR è pronta | Headless | PR aperta o aggiornata |
| Umano | Specifiche funzionali, revisione del design di agentA, issue correttive, decisioni non coperte da specifiche e design, secondo approve | - | Label `needs-human` |

### 2.2 Flusso

1. L'umano redige le specifiche funzionali in `docs/specs/`.
2. agentA, in sessione interattiva con l'umano, produce il design realizzativo in `docs/design/` (architettura, moduli, componenti UI, modello dati, decisioni in forma di ADR).
3. agentI genera le issue a partire da specifiche e design, ciascuna con link alle sezioni di riferimento, criteri di accettazione verificabili e dipendenze.
4. agentP prende in carico un'issue `ready` e lavora su un branch dedicato.
5. Se servono chiarimenti, agentP commenta sull'issue e imposta `needs-clarification`.
   - Domande funzionali: agentI risponde citando le specifiche.
   - Domande tecniche: agentA risponde citando il design.
   - Se specifiche o design non coprono il caso, si imposta `needs-human`. La decisione umana va poi riportata nel documento di riferimento.
6. agentP apre la PR.
7. agentMR revisiona la PR sulla base del diff e dell'esito di build e test in CI, e itera con agentP fino all'approvazione o al limite di iterazioni.
8. L'umano fornisce il secondo approve. Il merge è consentito solo con 2 approve e CI verde.

### 2.3 Macchina a stati (label)

```
issue:  ready -> in-progress -> [needs-clarification | needs-human] -> in-review
                     |
                     +-> agent-failed (retry automatico, poi needs-human)
PR:     in-review -> changes-requested -> in-review -> approved-by-agent -> merged
```

### 2.4 Struttura del repository

```
.github/
  workflows/
    ci.yml                # PR e push su main: lint, build, test (D29)
    agent-issues.yml      # push su docs/specs -> agentI
    agent-dev.yml         # label ready / commenti -> agentP
    agent-review.yml      # PR aperta / aggiornata -> agentMR
    agent-retry.yml       # schedule: ripresa issue agent-failed
  CODEOWNERS              # .github/ e agents/ -> review umana obbligatoria
agents/
  architect.md            # agentA (architect tecnico)
  issue-planner.md        # agentI
  developer.md            # agentP
  reviewer.md             # agentMR
scripts/
  get-agent-token.*       # generazione installation token GitHub App
  run-agent.*             # avvio locale di un agent (fase locale)
docs/
  specs/                  # specifiche funzionali (umano)
  design/                 # design realizzativo e ADR (agentA, rivisto dall'umano)
src/                      # applicazione Angular (workspace nella root, D26)
public/                   # asset statici, manifest PWA, icone
angular.json, package.json, tsconfig*.json, ngsw-config.json
AGENTS.md                 # convenzioni comuni a tutti gli agent e rimando a docs/working-doc.md
CLAUDE.md                 # contiene solo l'import @AGENTS.md
```

---

## 3. Decision Log

| # | Decisione | Motivazione | Alternative scartate | Assunzioni |
|---|---|---|---|---|
| D1 | Piattaforma: GitHub | Integrazione ufficiale `anthropics/claude-code-action@v1`; approvazioni obbligatorie disponibili | GitLab Free: escluso (Q1 chiusa) | - |
| D2 | Autenticazione Claude: token OAuth dell'abbonamento Pro/Max (`claude setup-token`) | Costo fisso | API key a consumo (possibile in futuro con spending limit) | I run consumano le finestre 5h/settimanale condivise con l'uso personale |
| D3 | Una GitHub App per agent | L'autore di una PR non può approvarla; gli eventi generati con `GITHUB_TOKEN` non avviano altri workflow | Identità unica; account bot | - |
| D4 | agentA e agentI separati | agentA decide la struttura (moduli, componenti, contratti); agentI decide le unità di lavoro (issue, granularità, ordine) | Agent unico | Condividono `AGENTS.md` |
| D5 | Chiarimenti: risposta solo da specifiche (funzionali, agentI) o design (tecnici, agentA), altrimenti escalation all'umano | Evitare che gli agent prendano decisioni di design | Risposta libera di agentI/agentA | - |
| D6 | Prompt e workflow protetti da CODEOWNERS; le App non hanno il permesso `workflows` | Impedire agli agent di modificare le proprie istruzioni | Nessuna protezione | - |
| D7 | Un'issue alla volta (concurrency globale) | Evitare conflitti tra PR e picchi di consumo | Parallelismo | Rivalutabile dopo la stabilizzazione |
| D8 | Limite di iterazioni agentP <-> agentMR, poi `needs-human` | Evitare loop non convergenti | Nessun limite | Valore iniziale N da definire (vedi Q8) |
| D9 | Fase locale prima delle Actions | Test più controllato | Partire direttamente in CI | Vedi sezione 4 |
| D10 | In locale l'interazione avviene comunque su GitHub (issue, PR, label via `gh`) | La migrazione alle Actions deve cambiare solo il trigger | Simulazione con file locali | - |
| D11 | Prima migrazione in CI: agentMR | Trigger semplice, non scrive codice | agentP per primo | - |
| D13 | Stack: webapp PWA responsive su Firebase, piano gratuito Spark | Servizi integrati (Hosting, Auth, Firestore), costo nullo per traffico basso | Backend custom | Preferenza per soluzioni senza Cloud Functions; il passaggio al piano Blaze è accettato se necessario, con budget alert (gli alert non bloccano la spesa); lookup ISBN lato client |
| D14 | Collocazioni con parent opzionale (gerarchia leggera) | Organizzazione per ambienti senza obbligo di specificare l'intera gerarchia | Collocazioni piatte; gerarchia obbligatoria a livelli fissi | Il numero di collocazioni per utente è contenuto (decine), quindi si possono caricare tutte lato client |
| D15 | Condivisione per luogo: ogni luogo (es. casa, casa al mare) ha membri con ruolo (proprietario, scrittura, lettura); collocazioni e libri appartengono a un luogo | Il luogo è il confine dei permessi; le collocazioni restano leggere | Condivisione per singola collocazione o singolo libro; app mono-utente | Modello dati predisposto per la condivisione fin dall'inizio, per evitare migrazioni |
| D16 | Ogni utente ha un luogo di default creato al primo accesso; il proprietario invita tramite link (valido per utenti registrati e non); all'apertura l'app mostra i luoghi accessibili | Flusso semplice, realizzabile senza Cloud Functions | Invito per email (richiede invio email lato server o collezione utenti con email) | Il link viene condiviso dall'utente con mezzi propri (es. Web Share API); il luogo di default ha id deterministico per evitare duplicati |
| D17 | Rilascio in tre fasi: (1) beta con libri e collocazioni nel solo luogo di default; (2) luoghi multipli; (3) condivisione con inviti e ruoli. Modello dati predisposto da subito | Riduce il rischio iniziale; ogni fase è un test di evoluzione per gli agent | Rilascio unico; due fasi | - |
| D18 | Piattaforma target iniziale: solo Android (Chrome) | Nessun dispositivo iOS disponibile per i test | Supporto iOS da subito | Scansione tramite API nativa `BarcodeDetector`, dietro un'astrazione che consenta di aggiungere un fallback per iOS in futuro |
| D19 | Autenticazione: solo Google Sign-In; altri provider in futuro | Semplicità per l'utente su Android; nome utente disponibile per il luogo di default | Email/password da subito | Il codice di autenticazione non deve assumere un unico provider |
| D20 | Frontend: Angular + Angular Material, TypeScript strict | Struttura imposta che limita la deriva tra sessioni degli agent; vicinanza al modello C# (DI, servizi, tipizzazione); esperienza pregressa dell'utente; componenti e supporto PWA ufficiali | React + Vite + MUI | Convenzioni moderne fissate in `AGENTS.md` (componenti standalone, signals, nuovo control flow `@if`/`@for`) e verificate da agentMR e dal linter |
| D21 | agentA è un architect tecnico, non funzionale: le specifiche funzionali sono dell'umano | Le decisioni realizzative sono il campo di competenza dell'utente da verificare; le specifiche funzionali esprimono l'intento dell'utente | agentA come supporto alla redazione delle specifiche funzionali | Inizialmente in modalità interattiva con revisione umana delle decisioni |
| D22 | Beta con scope minimo: login, collocazioni, inserimento singolo, elenco libri; inserimento in serie nel backlog | Avviare il sistema di agent il prima possibile; le funzionalità successive diventano un test di modifica delle specifiche | Beta con inserimento in serie | - |
| D23 | Nome del repository e dell'app: `shelfmark` | Termine bibliotecario per la segnatura di collocazione; adatto a un repo pubblico | bookwhere, scaffale, dovelho, libroteca | Progetto Firebase creato con id `shelfmark-bd1a8` (id `shelfmark` non disponibile); URL di default `shelfmark-bd1a8.web.app` |
| D24 | Licenza AGPL-3.0 | Chi pubblica online una versione modificata deve rilasciarne il sorgente | MIT, Apache-2.0, nessuna licenza | La licenza copre anche i prompt in `agents/` salvo licenza separata per quella cartella |
| D25 | Istruzioni agent-agnostiche in `AGENTS.md`; `CLAUDE.md` contiene solo l'import `@AGENTS.md`; `agents/shared.md` assorbito in `AGENTS.md` | Indipendenza dallo strumento; un solo file di convenzioni | Solo `CLAUDE.md`; symlink (richiede permessi su Windows); affidarsi alla lettura nativa di `AGENTS.md` da parte di Claude Code (dipende dalla versione e dalla presenza di altri `CLAUDE.md`) | La action in CI esegue Claude Code e legge quindi `CLAUDE.md` |
| D26 | Scheletro Angular 22 nella root del repo: standalone, zoneless, TypeScript strict, SCSS, Vitest, senza SSR; Angular Material (tema azure/blue di default) e `@angular/pwa`; `--ai-config=none` | Una sola app: CI e `firebase.json` più semplici; zoneless coerente con signals (D20); PWA statica su Hosting | Workspace in sottocartella (`web/`); SSR; Karma | Richiede Node >= 24.15 (requisito di Angular CLI 22); tema e font (oggi da Google Fonts, non disponibili offline) da rivedere nel design |
| D27 | Fine riga LF per tutti i file di testo (`.gitattributes` con `eol=lf`, `.editorconfig`), CRLF solo per `.cmd`/`.bat` | Gli agent girano su runner Linux; l'umano lavora su Windows con IDE diversi (Rider, WebStorm, VS Code, Visual Studio) | `core.autocrlf` per macchina | - |
| D28 | ESLint: preset `angular-eslint` (ts, template, accessibilità) con typed linting; regole aggiuntive `prefer-signals`, `prefer-output-emitter-ref`, `prefer-signal-model`, `no-uncalled-signals`, `no-implicit-take-until-destroyed`, `template/prefer-self-closing-tags`; `eslint-plugin-rxjs-x` (recommended) e `eslint-plugin-rxjs-angular-x` (`prefer-takeuntil` con alias `takeUntilDestroyed` su Component, Directive, Injectable) | Controlli deterministici contro pattern obsoleti e leak di subscription (rischio "punti ciechi correlati") | Solo preset raccomandato; `prefer-async-pipe` (troppo restrittivo) | In Angular 22 OnPush è il default: `prefer-on-push-component-change-detection` segnala solo `ChangeDetectionStrategy.Eager`. Regole verificate con un componente di prova |
| D29 | CI minima `ci.yml`: lint, build, test su PR e push su `main`; Node 24, `permissions: contents: read`, `timeout-minutes: 15`, `concurrency` per ref | Base per la regola "CI verde" del merge e per agentMR | - | Test delle security rules aggiunti quando Firebase sarà configurato |
| D12 | Repository GitHub pubblico | Minuti Actions gratuiti su runner GitHub-hosted; ruleset e branch protection disponibili sul piano Free | Repo privato (minuti limitati, protezioni da verificare) | Agent avviati solo da utenti con permesso di scrittura (sezione 5); niente self-hosted runner |

---

## 4. Principi della fase locale

- Ogni agent è definito da prompt, input, strumenti/permessi e interazione via GitHub; in locale cambia solo chi avvia il run.
- Esecuzione headless: `claude -p` con `--append-system-prompt`, `--allowedTools`, `--max-turns`. Gli stessi flag si passano alla action tramite `claude_args`. Verificare i nomi esatti con `claude --help`.
- Ogni agent usa il proprio token (`GH_TOKEN`) generato dalla propria GitHub App, mai il token personale.
- Ogni run lavora in un `git worktree` o in un clone pulito, senza riutilizzare sessioni o contesto, per simulare il runner effimero.
- Isolamento: esecuzione in WSL o devcontainer, contenente solo il clone e il token dell'agent; nessun bypass dei permessi.
- Orchestrazione inizialmente manuale (`run-agent` con agent e numero di issue/PR); polling automatico solo se la fase locale si prolunga.

---

## 5. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Rate limit dell'abbonamento durante un run: il run headless si interrompe e non attende il reset | Step `if: failure()` che imposta `agent-failed` e commenta; workflow `schedule` di ripresa con soglia di tentativi, poi `needs-human` |
| Lavoro perso su runner effimero | Commit e push intermedi sul branch di lavoro |
| Ripresa incoerente dopo un'interruzione | Prompt di agentP idempotente: se esistono branch o PR per l'issue, riprende invece di ricominciare |
| Consumo di minuti di pipeline | `timeout-minutes` su ogni job (default GitHub: 360 min); `--max-turns`; repo pubblico per minuti gratuiti su runner GitHub-hosted |
| Self-hosted runner su repo pubblico (esecuzione di codice da fork) | Usarlo solo su repo privato o bloccando i trigger da fork |
| Agent che modificano prompt o workflow | CODEOWNERS e permessi ridotti delle App (D6) |
| Decisioni inventate dagli agent | D5 |
| Review superficiale | agentMR basato su build e test in CI; criteri di accettazione verificabili nelle issue |
| Confusione tra strumenti personali e protezioni: i controlli dell'IDE non sono visibili agli agent | Ogni controllo vincolante risiede nella configurazione del repository e in CI; l'IDE (Rider/WebStorm, VS Code, Visual Studio) è solo uno strumento di review dell'utente e usa la stessa configurazione ESLint |
| Punti ciechi correlati: agentP e agentMR basati sullo stesso modello tendono ad accettare gli stessi errori | Controlli deterministici in CI (TypeScript strict, linter con regole del framework, test); checklist di review esplicita nel prompt di agentMR; modello diverso per la review; verifica umana del comportamento tramite preview channel |
| Consumo concorrente | `concurrency` globale sugli agent (D7) |
| Repo pubblico: chiunque può aprire issue o commentare, con possibile prompt injection e consumo della quota | Avviare gli agent solo per utenti con permesso di scrittura (verificare `author_association` o il comportamento di default della action); non trattare come istruzioni il testo di utenti esterni |

---

## 6. Piano operativo

### Fase 0 - Preparazione
- [x] Escludere GitLab Free (Q1).
- [ ] Risolvere Q3-Q4.
- [x] Decidere repo pubblico o privato (Q5): pubblico.
- [x] Definire l'idea dell'app: catalogo personale di libri con collocazione fisica.
- [x] Scegliere lo stack (D13, D20).
- [ ] Redigere le specifiche funzionali della beta in `docs/specs/`.
- [ ] Produrre con agentA il design realizzativo della beta in `docs/design/`.
- [x] Creare il progetto Firebase `shelfmark` (id `shelfmark-bd1a8`).
- [ ] Valutare una licenza separata (es. MIT o CC BY 4.0) per la cartella `agents/`.
- [x] Creare il repository pubblico `shelfmark` (`git@github.com:giammin/shelfmark.git`, licenza AGPL-3.0, senza `.gitignore` iniziale).
- [ ] Aggiungere al repository la struttura della sezione 2.4 e questo documento come `docs/working-doc.md`.
- [x] Creare `AGENTS.md` e `CLAUDE.md` con il solo import `@AGENTS.md`.
- [ ] Creare le label della sezione 2.3.
- [ ] Configurare ruleset/branch protection su `main`: 2 approve, CI verde, review CODEOWNERS.
- [ ] Configurare CODEOWNERS su `.github/` e `agents/`.
- [ ] Abilitare sul progetto Firebase (piano Spark) Hosting, Auth (provider Google) e Firestore.
- [ ] (Opzionale) Valutare un sito Hosting aggiuntivo con nome più pulito o un dominio personalizzato.
- [x] Generare lo scheletro Angular + Angular Material + PWA con TypeScript strict (D26).
- [x] Configurare `angular-eslint` con regole contro pattern obsoleti e leak di subscription (D28).
- [x] Predisporre una CI minima (build, lint, test) prima che agentP scriva codice (D29).
- [ ] Aggiungere alla CI i test delle security rules con Emulator Suite (dopo la configurazione di Firestore).
- [ ] Configurare i preview channel di Firebase Hosting per le PR.
- [ ] Configurare gli IDE (Rider/WebStorm, VS Code) per usare la configurazione ESLint del progetto.

### Fase 1 - Identità e strumenti locali
- [ ] Creare 3 GitHub App (agentI, agentP, agentMR) con permessi minimi; nessun permesso `workflows`.
- [ ] Installare le App sul repository.
- [ ] Scrivere `scripts/get-agent-token` (JWT firmato con chiave privata, installation token di durata 1 ora).
- [ ] Preparare l'ambiente isolato (WSL o devcontainer) con `claude` e `gh`.
- [ ] Scrivere `scripts/run-agent` (parametri: agent, numero issue/PR; worktree pulito; token dell'agent; flag headless).

### Fase 2 - Prompt
- [ ] `AGENTS.md`: rimando al documento di lavoro, convenzioni, git workflow, formato commenti, uso delle label; convenzioni Angular (componenti standalone, signals, `@if`/`@for`, nessun `NgModule`).
- [ ] `agents/issue-planner.md`: generazione issue con link alle specifiche e criteri di accettazione; regola D5.
- [ ] `agents/developer.md`: presa in carico, chiarimenti, idempotenza, commit intermedi, apertura PR.
- [ ] `agents/reviewer.md`: checklist di review esplicita (pattern Angular obsoleti, subscription non chiuse, uso di signals/computed, modifiche alle security rules senza test), uso dei risultati CI, limite di iterazioni, approvazione.
- [ ] Scegliere per agentMR un modello diverso da quello di agentP.
- [ ] `agents/architect.md`: supporto alla redazione delle specifiche.

### Fase 3 - Ciclo locale manuale
- [ ] Eseguire un ciclo completo su un'issue piccola: agentI -> agentP -> agentMR -> umano.
- [ ] Testare un chiarimento con risposta dalle specifiche e uno con escalation a `needs-human`.
- [ ] Testare un'interruzione a metà lavoro (anche simulata) e la ripresa.
- [ ] Iterare sui prompt fino alla convergenza del ciclo senza intervento umano.

### Fase 4 - Migrazione alle Actions (un agent alla volta)
- [ ] agentMR: `agent-review.yml`, con `timeout-minutes`, `concurrency`, `--max-turns`.
- [ ] agentP: `agent-dev.yml`, con gestione `if: failure()` e label `agent-failed`.
- [ ] agentI: `agent-issues.yml`.
- [ ] Ripresa automatica: `agent-retry.yml` (schedule, soglia di tentativi).
- [ ] Verificare nella pratica il comportamento della action al raggiungimento del rate limit (Q3).

### Fase 5 - Evoluzione
- [ ] Valutare la rimozione dell'approve umano obbligatorio.
- [ ] Valutare il parallelismo tra issue.
- [ ] Valutare il passaggio ad API key con spending limit.

---

## 7. Open Questions

| # | Domanda | Stato |
|---|---|---|
| Q1 | GitLab Free come piattaforma | Chiusa: escluso, si usa GitHub |
| Q2 | Su GitHub Free, ruleset/branch protection sono applicati sui repo privati? | Chiusa: non rilevante, repo pubblico (D12) |
| Q3 | Comportamento esatto di `claude-code-action` al raggiungimento del limite di utilizzo (atteso: errore e job fallito; retry sui 429 transitori di breve durata) | Da verificare con test |
| Q4 | Nomi e semantica esatti dei flag headless di Claude Code nella versione in uso | Da verificare (`claude --help`) |
| Q5 | Repository pubblico o privato | Chiusa: pubblico (D12) |
| Q6 | Idea e stack dell'applicazione | Chiusa: vedi D13 e sezione 10 |
| Q9 | Framework frontend | Chiusa: Angular + Angular Material (D20) |
| Q10 | Fonte metadati ISBN (Google Books, Open Library, entrambe) e copertura dei libri italiani | Aperta |
| Q11 | Cloud Functions disponibili sul piano Spark? (ipotesi: no, serve Blaze) | Da verificare |
| Q12 | Supporto scansione barcode su iOS | Rinviata: iOS fuori scope iniziale (D18) |
| Q13 | Collocazioni piatte o gerarchiche | Chiusa: parent opzionale (D14) |
| Q14 | App mono-utente o con condivisione | Chiusa: condivisione per luogo (D15) |
| Q15 | Meccanismo di invito | Chiusa: link di invito (D16) |
| Q16 | Rilascio della condivisione in fase successiva | Chiusa: sì, tre fasi (D17) |
| Q17 | Metodo di autenticazione | Chiusa: Google (D19) |
| Q7 | Ambiente di isolamento locale: WSL o devcontainer | Aperta |
| Q8 | Valore iniziale del limite di iterazioni agentP <-> agentMR | Aperta |
| Q18 | `npm audit`: vulnerabilità high in `vite` 8.3.0-8.3.2 tramite `@angular/build` 22.2.x (solo dev server); il fix proposto è un downgrade a 22.1.9 | Aperta: attendere una patch di `@angular/build` o valutare un `overrides` su `vite` |

---

## 8. Progress

| Data | Avanzamento |
|---|---|
| 2026-10-21 | Definiti obiettivi, architettura, decisioni iniziali e piano operativo. Nessuna attività implementativa avviata. |
| 2026-10-21 | Esclusa GitLab Free (Q1). Definita l'idea dell'app (Q6). Aggiunto il rischio sui trigger da utenti esterni. |
| 2026-10-21 | Scelto repository GitHub pubblico (D12); chiuse Q2 e Q5. |
| 2026-10-21 | Scelto lo stack Firebase PWA (D13); bozza requisiti in sezione 10. |
| 2026-10-21 | Collocazioni con parent opzionale (D14). |
| 2026-10-21 | Condivisione per luogo con ruoli (D15). |
| 2026-10-21 | Definiti luogo di default, invito via link e rilascio in due fasi (D16, D17). |
| 2026-10-21 | Rilascio in tre fasi (D17), solo Android (D18), Cloud Functions ammesse se necessarie (D13). |
| 2026-10-21 | Autenticazione solo Google (D19). |
| 2026-10-21 | Frontend Angular + Angular Material (D20). Decisioni bloccanti chiuse. |
| 2026-10-21 | Integrate in Fase 0 e Fase 2 le protezioni statiche, la checklist di review e il ruolo dell'IDE. |
| 2026-10-21 | Aggiunto alla beta l'inserimento in serie con destinazione impostata (sezione 10). |
| 2026-10-21 | Dettagliato il flusso dell'inserimento in serie (scelta all'avvio, switch conferma/automatico, avviso duplicati). |
| 2026-10-21 | Ridefinito il ruolo di agentA come architect tecnico (D21); aggiunto `docs/design/`. |
| 2026-10-21 | Beta con scope minimo (D22); sezione 10 riorganizzata in beta, backlog, casi aperti e vincoli. |
| 2026-10-21 | Scelto il nome `shelfmark` (D23). |
| 2026-10-21 | Creato il progetto Firebase `shelfmark-bd1a8`. |
| 2026-10-21 | Scelta la licenza AGPL-3.0 (D24). |
| 2026-10-21 | Creato il repository `giammin/shelfmark`. |
| 2026-10-21 | Istruzioni agent-agnostiche in `AGENTS.md` (D25). |
| 2026-10-21 | Creato `CLAUDE.md` con il solo import `@AGENTS.md` (D25). |
| 2026-10-21 | Branch `chore/initial-setup`: scheletro Angular 22 + Material + PWA (D26), fine riga LF (D27), `.gitignore` esteso (segreti, Firebase, Visual Studio, impostazioni locali di Claude Code). Build e test verdi. |
| 2026-10-21 | ESLint con regole Angular moderne e anti-leak (D28); CI minima `ci.yml` (D29). Lint, build e test verdi in locale; CI non ancora eseguita su GitHub. |

---

## 9. Handoff

- Stato: decisioni di piattaforma, stack e scope chiuse; Fase 0 in corso sul branch `chore/initial-setup` (non ancora pushato né mergiato): `CLAUDE.md`, scheletro Angular, fine riga, `.gitignore`, ESLint, CI minima.
- Prossimo passo: push del branch e PR per verificare la CI su GitHub; abilitare Hosting, Auth e Firestore sul progetto `shelfmark-bd1a8`; redigere le specifiche funzionali della beta a partire dalla sezione 10.1, poi il design con agentA.
- Requisiti ambiente: Node >= 24.15 (Angular CLI 22); `gh` non è installato sulla macchina dell'utente (necessario per D10 e Fase 1).
- Note per chi riprende: leggere le sezioni 3 e 4 prima di qualsiasi attività; le ipotesi marcate "Da verificare" non vanno date per acquisite.

---

## 10. Bozza requisiti dell'app (da trasferire in `docs/specs/`)

### 10.1 Beta (scope minimo, D22)

- Webapp responsive, installabile come PWA, target Android (D18).
- Accesso con Google (D19); al primo accesso viene creato automaticamente il luogo di default "La biblioteca di {NOME}", non visibile come scelta finché esiste un solo luogo.
- Gestione delle collocazioni con parent opzionale (D14): creazione, modifica, eliminazione.
- Inserimento di un singolo libro tramite scansione del codice a barre ISBN, con recupero automatico dei metadati e inserimento manuale come fallback, assegnandolo a una collocazione.
- Elenco dei libri, aperto direttamente all'avvio.

### 10.2 Backlog (da introdurre come modifiche alle specifiche)

- Inserimento in serie:
  - all'avvio dell'inserimento l'utente sceglie se procedere con un singolo libro o con una serie, e in questo caso imposta la collocazione di destinazione;
  - durante la serie l'app indica in modo evidente e costante la collocazione in cui si sta inserendo;
  - uno switch, modificabile anche durante la serie, determina se ogni libro richiede conferma o viene salvato automaticamente;
  - un libro già presente genera un avviso e richiede conferma, anche in modalità automatica;
  - (successivo) elenco dei libri inseriti nella sessione, con possibilità di modificarli.
- Fase 2 - Luoghi multipli: più luoghi per utente (es. casa, casa al mare); nome del luogo modificabile; all'apertura l'app mostra i luoghi accessibili, o apre direttamente l'elenco dei libri se il luogo è uno solo.
- Fase 3 - Condivisione: il proprietario genera un link di invito monouso, con scadenza lunga, per un luogo e un ruolo (lettura o scrittura); chi lo apre accede o si registra e diventa membro.

### 10.3 Casi aperti

Lasciati aperti di proposito: emergono dal design di agentA o dai chiarimenti di agentP, e servono a testare il percorso di chiarimento.

Beta:
- più copie dello stesso libro; libro già presente all'inserimento;
- libro senza ISBN o con ISBN non trovato;
- libro prestato o temporaneamente fuori posto;
- eliminazione di una collocazione che contiene libri o sotto-collocazioni;
- prevenzione dei cicli nella gerarchia;
- nomi uguali sotto parent diversi: visualizzazione con il percorso completo;
- spostamento di una collocazione sotto un altro parent;
- ricerca dei libri in una collocazione: solo diretti o inclusi i discendenti;
- nome del luogo di default quando il nome dell'utente non è disponibile.

Inserimento in serie:
- effetto della conferma su un libro già presente (nuova copia o spostamento della copia esistente);
- ISBN non trovato in modalità automatica;
- cambio di destinazione senza chiudere la serie.

Fasi 2 e 3:
- invito di una persona non ancora registrata (il link deve sopravvivere al flusso di registrazione);
- scadenza, monouso e revoca dei link di invito;
- chi può gestire i membri; revoca dell'accesso e abbandono di un luogo;
- trasferimento della proprietà; eliminazione di un luogo;
- spostamento di un libro tra luoghi (richiede scrittura su entrambi);
- vista aggregata dei libri di tutti i luoghi accessibili.

### 10.4 Vincoli per il design (derivanti da D15, D16)

- Modello dati predisposto per luoghi e condivisione fin dalla beta: `places/{placeId}` con membri e ruoli; collocazioni e libri come sotto-collezioni del luogo.
- Luogo di default con id deterministico, per evitare duplicati alla creazione.
- Security rules testate con Firebase Emulator Suite in CI.
- Preview channel di Firebase Hosting per ogni PR.
