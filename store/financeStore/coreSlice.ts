import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { Categoria, Istituto, Transazione, TipoCategoria, Obiettivo, VocePatrimonio, SnapshotPatrimonio } from '../../types';
import { CATEGORIE_DEFAULT } from '../../constants/categorieDefault';
import { ISTITUTI_DEFAULT } from '../../constants/istitutiDefault';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';

export interface CoreSlice {
  caricamento: boolean;
  reddito: number; // reddito mensile netto impostato dall'utente
  caricaDati: () => Promise<void>;
  avviaRealtime: () => () => void;
  aggiornaReddito: (r: number) => Promise<void>;
}

// Carica tutte le tabelle e popola l'intero store: vive qui (invece che nella slice di ogni
// dominio) perché aggiorna in un solo giro tutte le fette dello stato condiviso
export const createCoreSlice: StateCreator<FinanceState, [], [], CoreSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    caricamento: true,
    reddito: 0,

    caricaDati: async () => {
      set({ caricamento: true });

      const [catRis, transRis, istRis, impostRis, obiRis, patVociRis, patStoricoRis] = await Promise.all([
        supabase.from('categorie').select('*'),
        supabase.from('transazioni').select('*').order('data', { ascending: false }),
        supabase.from('istituti').select('*'),
        supabase.from('impostazioni').select('reddito_mensile').eq('id', 'default').maybeSingle(),
        supabase.from('obiettivi').select('*').order('created_at', { ascending: true }),
        supabase.from('patrimonio_voci').select('*').order('created_at', { ascending: true }),
        supabase.from('patrimonio_storico').select('*').order('data', { ascending: true }),
      ]);

      if (catRis.error)   console.error('[Supabase] carica categorie:', catRis.error.message);
      if (transRis.error) console.error('[Supabase] carica transazioni:', transRis.error.message);
      if (istRis.error)   console.error('[Supabase] carica istituti:', istRis.error.message);
      if (obiRis.error)   console.error('[Supabase] carica obiettivi:', obiRis.error.message);
      if (patVociRis.error)    console.error('[Supabase] carica patrimonio_voci:', patVociRis.error.message);
      if (patStoricoRis.error) console.error('[Supabase] carica patrimonio_storico:', patStoricoRis.error.message);

      // Prima apertura: inserisce le categorie e gli istituti predefiniti
      if (catRis.data?.length === 0) {
        const { error: errCat } = await supabase.from('categorie').insert(
          CATEGORIE_DEFAULT.map(({ id, nome, colore, tipo }) => ({ id, nome, colore, tipo })),
        );
        if (errCat) console.error('[Supabase] seed categorie:', errCat.message);
      }
      if (istRis.data?.length === 0) {
        const { error: errIst } = await supabase.from('istituti').insert(ISTITUTI_DEFAULT);
        if (errIst) console.error('[Supabase] seed istituti:', errIst.message);
      }

      const catDb   = catRis.data?.length  === 0 ? CATEGORIE_DEFAULT : (catRis.data  ?? []);
      const istDb   = istRis.data?.length  === 0 ? ISTITUTI_DEFAULT  : (istRis.data  ?? []);
      const transDb = transRis.data ?? [];

      set({
        categorie: catDb.map(({ id, nome, colore, budget_mensile, tipo, rollover }): Categoria => ({
          id, nome, colore,
          tipo: (tipo as TipoCategoria) ?? 'variabile',
          ...(budget_mensile != null && { budgetMensile: Number(budget_mensile) }),
          ...(rollover === true && { rollover: true }),
        })),
        istituti:  istDb.map(({ id, nome }): Istituto => ({ id, nome })),
        transazioni: transDb.map(({ id, importo, tipo, categoria_id, data, nota, tipologia, istituto_id, ricorrente, data_fine, template_id, tag, trasferimento, trasferimento_id, foto_url }): Transazione => ({
          id,
          importo: Number(importo),
          tipo,
          categoriaId: categoria_id,
          data,
          ...(nota            != null && { nota }),
          ...(tipologia       != null && { tipologia }),
          ...(istituto_id     != null && { istitutoId: istituto_id }),
          ...(ricorrente      === true && { ricorrente: true }),
          ...(data_fine       != null && { dataFine: data_fine }),
          ...(template_id     != null && { templateId: template_id }),
          ...(tag             != null && { tag }),
          ...(trasferimento   === true && { trasferimento: true }),
          ...(trasferimento_id != null && { trasferimentoId: trasferimento_id }),
          ...(foto_url        != null && { fotoUrl: foto_url }),
        })),
        obiettivi: (obiRis.data ?? []).map(({ id, nome, importo_obiettivo, importo_attuale, colore, data_scadenza, created_at }): Obiettivo => ({
          id, nome, colore,
          importoObiettivo: Number(importo_obiettivo),
          importoAttuale: Number(importo_attuale),
          ...(data_scadenza != null && { dataScadenza: data_scadenza }),
          ...(created_at != null && { createdAt: created_at }),
        })),
        patrimonioVoci: (patVociRis.data ?? []).map(({ id, nome, tipo, valore, colore }): VocePatrimonio => ({
          id, nome, colore,
          tipo: tipo as 'attivo' | 'passivo',
          valore: Number(valore),
        })),
        patrimonioStorico: (patStoricoRis.data ?? []).map(({ data, valore }): SnapshotPatrimonio => ({
          data, valore: Number(valore),
        })),
        reddito: Number(impostRis.data?.reddito_mensile ?? 0),
        caricamento: false,
      });
    },

    // Ascolta le modifiche in tempo reale e ricarica tutto
    avviaRealtime: () => {
      const canale = supabase
        .channel('finance-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transazioni' },  () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categorie' },    () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'istituti' },     () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'impostazioni' }, () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'obiettivi' },     () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patrimonio_voci' },    () => get().caricaDati())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patrimonio_storico' }, () => get().caricaDati())
        .subscribe((status, err) => {
          if (err) {
            // Il socket si chiude per timeout/rete: il client riconnette automaticamente
            console.warn('[Realtime]', status, err.message);
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              get().caricaDati();
            }
          }
        });

      return () => { supabase.removeChannel(canale); };
    },

    aggiornaReddito: async (r) => {
      set({ reddito: r });
      const { error } = await supabase.from('impostazioni').upsert({ id: 'default', reddito_mensile: r });
      rollbackSeErrore('aggiorna reddito', error);
    },
  };
};
