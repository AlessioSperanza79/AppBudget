# App Budget — Finanze Personali

## Cos'è questo progetto
App di gestione delle finanze personali (entrate/uscite, budget, obiettivi, patrimonio netto) costruita con Expo + React Native + TypeScript.
Funziona sia su **Android via Expo Go** sia nel **browser web** dallo stesso codice sorgente.
Il backend è **Supabase** (Postgres + Realtime + Storage): i dati non sono più solo locali, sono sincronizzati su più dispositivi.

## Come avviare l'app
```bash
cd AppBudget
npm start          # apre il menu Expo
# poi premi 'a' per Android (Expo Go) oppure 'w' per il browser
```
Richiede un file `.env` (non tracciato in git) con `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Workflow di deploy
Il branch `main` è collegato a un progetto Vercel (https://app-budget-eight.vercel.app/) con deploy automatico.
Dopo ogni modifica approvata dall'utente, fai commit e push su `main` così Vercel rigenera il deploy online.

⚠️ Il progetto Supabase free tier va in pausa dopo un periodo di inattività: se i dati sembrano "spariti", è probabile che sia questo il motivo, non un bug (vedi anche `appbudget_supabase_pause` in memoria).

## Versioni principali (2026-07-03)
| Pacchetto | Versione |
|---|---|
| Expo SDK | 56.0.8 |
| Expo Router | 56.2.8 |
| React Native | 0.85.3 |
| React | 19.2.3 |
| Zustand | 5.0.14 |
| @supabase/supabase-js | ^2.107.0 |
| react-native-gifted-charts | 1.4.77 |
| react-native-reanimated | 4.3.1 |
| @react-native-async-storage/async-storage | 2.2.0 |
| @react-native-community/datetimepicker | 9.1.0 |
| react-native-svg | 15.15.4 |
| expo-linear-gradient | 56.0.4 |
| expo-local-authentication | 56.0.4 |
| expo-notifications | 56.0.19 |
| expo-image-picker | 56.0.19 |

Nessun linter/formatter configurato (niente ESLint/Prettier) e nessun test automatico presente.

## Struttura del progetto
```
AppBudget/
├── app/
│   ├── _layout.tsx                  → Root layout (font, splash screen, theme, AppLock)
│   └── (tabs)/                      → 5 schede in italiano: Riepilogo, Movimenti, Analisi, Pianifica, Altro
│       ├── _layout.tsx              → Configurazione tab bar
│       ├── riepilogo.tsx            → Saldo, totali, cruscotto flusso mensile, ultime transazioni (schermata più grande, 1300+ righe)
│       ├── index.tsx                → Schermata Movimenti (lista transazioni + FAB + modale)
│       ├── analisi.tsx              → Grafici (torta, linee mensili, Sankey) + tabelle riepilogative
│       ├── pianificazione.tsx       → Hub con 3 viste: Budget, Obiettivi, Ricorrenti
│       └── altro/                   → Stack di sotto-schermate
│           ├── index.tsx            → Hub "Altro"
│           ├── impostazioni.tsx     → Preferenze app (tema, sicurezza, notifiche)
│           ├── categorie.tsx        → CRUD categorie con palette colori, tipo, budget, rollover
│           ├── conti.tsx            → CRUD istituti/conti bancari
│           ├── patrimonio.tsx       → CRUD voci patrimonio netto + storico
│           └── guida.tsx            → Guida completa in-app
├── components/
│   ├── TransactionItem.tsx          → Singola riga transazione
│   ├── TransactionForm.tsx          → Form modale per aggiungere/modificare una transazione (943 righe)
│   ├── CategoryBadge.tsx            → Punto colorato + nome categoria
│   ├── EmptyState.tsx               → Messaggio con icona per liste vuote
│   ├── SelectorData.tsx / .web.tsx  → Selettore data cross-platform
│   ├── AppLock.tsx                  → Blocco biometrico all'apertura app
│   ├── BottomSheet.tsx, ConfermaDialog.tsx, NotificheManager.tsx, ... → UI condivisa
│   ├── onboarding/TourIntroduttivo.tsx → Tour al primo accesso
│   ├── analisi/                     → GraficiVista, SankeyFlusso, TabelleVista
│   ├── pianifica/                   → BudgetVista, ObiettiviVista, RicorrentiVista
│   └── altro/                       → ImportaCsvModal, ImpostazioniSezione, NotificheSezione, SicurezzaSezione
├── store/
│   ├── useFinanceStore.ts           → Zustand store principale: transazioni, categorie, istituti, obiettivi, patrimonio (Supabase come fonte di verità, 630+ righe)
│   ├── usePreferenze.ts             → Tema (chiaro/scuro/sistema) e altre preferenze utente
│   ├── useSicurezza.ts              → Stato blocco biometrico
│   └── useNotifiche.ts              → Stato notifiche locali
├── lib/
│   └── supabase.ts                  → Client Supabase (URL/anon key da env)
├── types/
│   └── index.ts                     → Tipi condivisi: Transazione, Categoria, Istituto, Obiettivo, VocePatrimonio, ecc.
├── constants/
│   ├── categorieDefault.ts          → Categorie predefinite con colori esadecimali
│   ├── istitutiDefault.ts           → Istituti/conti predefiniti
│   ├── paletteCategorie.ts          → Palette colori selezionabili per le categorie
│   └── tema.ts                      → Colori tema chiaro/scuro
└── utils/
    ├── formatters.ts                → formatEuro(), formatData(), oggiIso()
    ├── budget.ts                    → Calcoli budget/rollover per categoria
    ├── csv.ts, importCsv.ts         → Export/import CSV transazioni
    ├── backup.ts, exportFile(.web).ts, importaFile(.web).ts → Backup/ripristino dati
    ├── notifiche.ts                 → Pianificazione notifiche locali
    ├── rilevaAbbonamenti.ts         → Rilevamento automatico abbonamenti ricorrenti
    └── livelloRisparmio.ts          → Calcolo livello/badge di risparmio
```

## Convenzioni di codice
- **Tutto in italiano**: nomi variabili, commenti, testi dell'interfaccia
- **Importi sempre positivi** nello store; il segno (+/-) viene applicato solo in fase di visualizzazione
- **Date salvate come stringhe ISO** "YYYY-MM-DD" (es. "2026-07-03"); i mesi negli snapshot come "YYYY-MM"
- **ID generati** con `generaId()` in `useFinanceStore.ts` (timestamp + stringa casuale)
- **Commenti**: spiegano il PERCHÉ o i dettagli non ovvi, non cosa fa il codice
- **Stili**: oggetti `StyleSheet.create` in fondo a ogni file, variabili nominate in italiano (es. `stili.contenitore`)
- **Colonne DB Supabase in snake_case**: la mappatura verso/da i tipi TS camelCase avviene sempre dentro `useFinanceStore.ts` (es. `categoria_id` ↔ `categoriaId`)

## Note tecniche importanti
- **Expo Go compatible**: nessun modulo nativo che richiede build personalizzata
- **Grafici**: `react-native-gifted-charts` usa internamente `react-native-svg` (incluso nell'Expo SDK)
- **Selettore data cross-platform**: Metro sceglie automaticamente `SelectorData.web.tsx` per il web e `SelectorData.tsx` per native
- **Persistenza**: Supabase è la fonte di verità; lo store Zustand tiene solo lo stato locale in memoria per la reattività della UI (nessun middleware `persist`/AsyncStorage sui dati finanziari)
- **Sync realtime**: `avviaRealtime()` in `useFinanceStore.ts` si iscrive ai canali Postgres Changes su tutte le tabelle e ricarica tutto (`caricaDati()`) a ogni evento
- **Trasferimenti tra conti**: modellati come due transazioni collegate (`trasferimento: true`, stesso `trasferimentoId`) sotto una categoria riservata "Trasferimento", non come tipo a parte
- **Transazioni ricorrenti**: un "modello" (`ricorrente: true`) genera le occorrenze reali fino a `dataFine`; modificarlo propaga i campi condivisi (non la data) a tutte le occorrenze già create tramite `templateId`
- **Foto scontrini**: caricate su Supabase Storage, bucket `Scontrini`
- **react-native-linear-gradient**: NON installato; al suo posto si usa `expo-linear-gradient` (compatibile con Expo Go)
- **Gestione errori nello store**: alcune mutation ottimistiche non controllano ancora l'esito della chiamata Supabase (nessun rollback/notifica in caso di fallimento) — attenzione quando si aggiungono nuove azioni

## Documentazione di riferimento
- Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- Expo Router: https://docs.expo.dev/router/introduction/
- react-native-gifted-charts: https://gifted-charts.web.app/
- Supabase JS client: https://supabase.com/docs/reference/javascript/introduction
