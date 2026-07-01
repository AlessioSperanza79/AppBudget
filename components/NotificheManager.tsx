// ── Componente invisibile: collega i dati finanziari alla logica delle notifiche locali ──
import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useNotifiche } from '../store/useNotifiche';
import {
  annullaPromemoriaRicorrenti,
  inviaAvvisoBudget,
  programmaPromemoriaRicorrenti,
} from '../utils/notifiche';

// Soglia oltre la quale si avvisa l'utente (anche prima del 100%, per dargli margine di manovra)
const SOGLIA_AVVISO_BUDGET = 80;

export default function NotificheManager() {
  const abilitate = useNotifiche((s) => s.abilitate);
  const avvisiBudgetInviati = useNotifiche((s) => s.avvisiBudgetInviati);
  const segnaAvvisoBudgetInviato = useNotifiche((s) => s.segnaAvvisoBudgetInviato);
  const transazioni = useFinanceStore((s) => s.transazioni);
  const categorie = useFinanceStore((s) => s.categorie);

  // Promemoria mensile: attivo solo se esistono modelli ricorrenti senza data fine
  // (quelli con data fine si auto-generano da soli e non richiedono nulla all'utente)
  useEffect(() => {
    if (!abilitate) return;
    const serveApplicazioneManuale = transazioni.some((t) => t.ricorrente && !t.dataFine);
    if (serveApplicazioneManuale) programmaPromemoriaRicorrenti();
    else annullaPromemoriaRicorrenti();
  }, [abilitate, transazioni]);

  // Avviso di budget: una sola notifica per categoria per mese, alla prima soglia superata
  useEffect(() => {
    if (!abilitate) return;

    const ora = new Date();
    const chiaveMese = `${ora.getFullYear()}-${ora.getMonth()}`;

    const speseMeseCorrente = new Map<string, number>();
    for (const tr of transazioni) {
      if (tr.tipo !== 'uscita' || tr.ricorrente) continue;
      const d = new Date(tr.data + 'T00:00:00');
      if (d.getFullYear() !== ora.getFullYear() || d.getMonth() !== ora.getMonth()) continue;
      speseMeseCorrente.set(tr.categoriaId, (speseMeseCorrente.get(tr.categoriaId) ?? 0) + tr.importo);
    }

    for (const cat of categorie) {
      if (!cat.budgetMensile || cat.budgetMensile <= 0) continue;
      const perc = ((speseMeseCorrente.get(cat.id) ?? 0) / cat.budgetMensile) * 100;
      if (perc < SOGLIA_AVVISO_BUDGET) continue;

      const chiave = `${cat.id}-${chiaveMese}`;
      if (avvisiBudgetInviati.includes(chiave)) continue;

      segnaAvvisoBudgetInviato(chiave);
      inviaAvvisoBudget(cat.nome, perc);
    }
  }, [abilitate, transazioni, categorie, avvisiBudgetInviati, segnaAvvisoBudgetInviato]);

  return null;
}
