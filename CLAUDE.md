# App Budget — Finanze Personali

## Cos'è questo progetto
App di gestione delle finanze personali (entrate/uscite) costruita con Expo + React Native + TypeScript.
Funziona sia su **Android via Expo Go** sia nel **browser web** dallo stesso codice sorgente.

## Come avviare l'app
```bash
cd AppBudget
npm start          # apre il menu Expo
# poi premi 'a' per Android (Expo Go) oppure 'w' per il browser
```

## Workflow di deploy
Il branch `main` è collegato a un progetto Vercel (https://app-budget-eight.vercel.app/) con deploy automatico.
Dopo ogni modifica approvata dall'utente, fai commit e push su `main` così Vercel rigenera il deploy online.

## Versioni installate (2026-06-05)
| Pacchetto | Versione |
|---|---|
| Expo SDK | 56.0.8 |
| Expo Router | 56.2.8 |
| React Native | 0.85.3 |
| React | 19.2.3 |
| Zustand | 5.0.14 |
| react-native-gifted-charts | 1.4.77 |
| @react-native-async-storage/async-storage | 2.2.0 |
| @react-native-community/datetimepicker | 9.1.0 |
| react-native-svg | 15.15.4 |
| expo-linear-gradient | 56.0.4 |

## Struttura del progetto
```
AppBudget/
├── app/
│   ├── _layout.tsx              → Root layout (font, splash screen, theme)
│   └── (tabs)/
│       ├── _layout.tsx          → Configurazione delle 4 schede in italiano
│       ├── index.tsx            → Schermata Transazioni (lista + FAB + modale)
│       ├── riepilogo.tsx        → Schermata Riepilogo (saldo, totali, ultime 5)
│       ├── grafici.tsx          → Schermata Grafici (torta + linee mensili)
│       └── categorie.tsx        → Schermata Categorie (CRUD con palette colori)
├── components/
│   ├── TransactionItem.tsx      → Singola riga transazione (importo, categoria, data, azioni)
│   ├── TransactionForm.tsx      → Form modale per aggiungere/modificare una transazione
│   ├── CategoryBadge.tsx        → Punto colorato + nome categoria
│   ├── EmptyState.tsx           → Messaggio con icona per liste vuote
│   ├── SelectorData.tsx         → Selettore data per Android/iOS (DateTimePicker nativo)
│   └── SelectorData.web.tsx     → Selettore data per web (<input type="date"> HTML)
├── store/
│   └── useFinanceStore.ts       → Zustand store con persistenza automatica su AsyncStorage
├── types/
│   └── index.ts                 → Tipi condivisi: Transazione, Categoria, TipoTransazione
├── constants/
│   └── categorieDefault.ts      → Le 10 categorie predefinite con colori esadecimali
└── utils/
    └── formatters.ts            → formatEuro(), formatData(), oggiIso()
```

## Convenzioni di codice
- **Tutto in italiano**: nomi variabili, commenti, testi dell'interfaccia
- **Importi sempre positivi** nello store; il segno (+/-) viene applicato solo in fase di visualizzazione
- **Date salvate come stringhe ISO** "YYYY-MM-DD" (es. "2026-06-05")
- **ID generati** con `generaId()` in `useFinanceStore.ts` (timestamp + stringa casuale)
- **Commenti**: spiegano il PERCHÉ o i dettagli non ovvi, non cosa fa il codice
- **Stili**: oggetti `StyleSheet.create` in fondo a ogni file, variabili nominate in italiano (es. `stili.contenitore`)

## Note tecniche importanti
- **Expo Go compatible**: nessun modulo nativo che richiede build personalizzata
- **Grafici**: `react-native-gifted-charts` usa internamente `react-native-svg` (incluso nell'Expo SDK)
- **Selettore data cross-platform**: Metro sceglie automaticamente `SelectorData.web.tsx` per il web e `SelectorData.tsx` per native
- **Persistenza**: Zustand middleware `persist` + `createJSONStorage(AsyncStorage)` salva tutto automaticamente
- **react-native-linear-gradient**: NON installato; al suo posto si usa `expo-linear-gradient` (compatibile con Expo Go)

## Documentazione di riferimento
- Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- Expo Router: https://docs.expo.dev/router/introduction/
- react-native-gifted-charts: https://gifted-charts.web.app/
