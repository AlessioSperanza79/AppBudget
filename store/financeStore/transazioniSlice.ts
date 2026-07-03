import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { Transazione } from '../../types';
import { FinanceState } from './types';
import { creaRollbackSeErrore } from './rollback';
import { generaId } from './id';

// Categoria riservata per i trasferimenti tra conti: creata al bisogno (non fa parte dei
// CATEGORIE_DEFAULT perché serve anche a chi ha installato l'app prima di questa funzione)
const ID_CATEGORIA_TRASFERIMENTO = 'trasferimento-interno';

export interface TransazioniSlice {
  transazioni: Transazione[];
  aggiungiTransazione: (t: Omit<Transazione, 'id'>) => Promise<void>;
  caricaFotoScontrino: (uri: string) => Promise<string | undefined>;
  importaTransazioni: (righe: Omit<Transazione, 'id'>[]) => Promise<void>;
  modificaTransazione: (id: string, aggiornamenti: Partial<Omit<Transazione, 'id'>>) => Promise<void>;
  eliminaTransazione: (id: string) => Promise<void>;
  aggiungiTrasferimento: (dati: {
    importo: number; data: string; nota?: string; tag?: string;
    istitutoOrigineId: string; istitutoDestinazioneId: string;
  }) => Promise<void>;
  aggiungiModelloRicorrente: (dati: Omit<Transazione, 'id'>) => Promise<void>;
  eliminaModelloRicorrente: (id: string) => Promise<void>;
  applicaRicorrenti: (anno: number, mese: number) => Promise<void>;
}

export const createTransazioniSlice: StateCreator<FinanceState, [], [], TransazioniSlice> = (set, get) => {
  const rollbackSeErrore = creaRollbackSeErrore(get);

  return {
    transazioni: [],

    aggiungiTransazione: async (t) => {
      const nuova: Transazione = { ...t, id: generaId() };
      set((s) => ({ transazioni: [nuova, ...s.transazioni] }));
      const { error } = await supabase.from('transazioni').insert({
        id: nuova.id,
        importo: nuova.importo,
        tipo: nuova.tipo,
        categoria_id: nuova.categoriaId,
        data: nuova.data,
        nota: nuova.nota ?? null,
        tipologia: nuova.tipologia ?? null,
        istituto_id: nuova.istitutoId ?? null,
        ricorrente: nuova.ricorrente ?? false,
        data_fine: nuova.dataFine ?? null,
        template_id: nuova.templateId ?? null,
        tag: nuova.tag ?? null,
        foto_url: nuova.fotoUrl ?? null,
      });
      rollbackSeErrore('aggiungi transazione', error);
    },

    // Carica la foto dello scontrino su Supabase Storage (bucket pubblico "scontrini") e
    // restituisce l'URL pubblico da salvare sulla transazione
    caricaFotoScontrino: async (uri: string) => {
      try {
        const risposta = await fetch(uri);
        const bytes = await risposta.arrayBuffer();
        // Il tipo mime va letto dalla risposta del fetch, non indovinato dall'estensione
        // dell'uri: su web expo-image-picker restituisce un uri "blob:" senza estensione
        const contentType = risposta.headers.get('content-type') || 'image/jpeg';
        const estensione = contentType.split('/').pop() || 'jpg';
        const nomeFile = `${generaId()}.${estensione}`;
        const { error } = await supabase.storage.from('Scontrini').upload(nomeFile, bytes, {
          contentType,
        });
        if (error) {
          console.error('[Supabase] carica foto scontrino:', error.message);
          return undefined;
        }
        const { data } = supabase.storage.from('Scontrini').getPublicUrl(nomeFile);
        return data.publicUrl;
      } catch (e) {
        console.error('[Supabase] carica foto scontrino:', e);
        return undefined;
      }
    },

    // Uno spostamento tra conti è modellato come due transazioni collegate (uscita dal conto di
    // origine, entrata su quello di destinazione) sotto una categoria riservata "Trasferimento",
    // così i totali entrate/uscite del flusso possono escluderle senza bisogno di un tipo a parte
    aggiungiTrasferimento: async ({ importo, data, nota, tag, istitutoOrigineId, istitutoDestinazioneId }) => {
      let categoria = get().categorie.find((c) => c.id === ID_CATEGORIA_TRASFERIMENTO);
      if (!categoria) {
        categoria = { id: ID_CATEGORIA_TRASFERIMENTO, nome: 'Trasferimento', colore: '#64748B', tipo: 'variabile' };
        set((s) => ({ categorie: [...s.categorie, categoria!] }));
        const { error: errCat } = await supabase.from('categorie').insert({
          id: categoria.id, nome: categoria.nome, colore: categoria.colore, tipo: categoria.tipo,
        });
        if (errCat) console.error('[Supabase] crea categoria trasferimento:', errCat.message);
      }

      const trasferimentoId = generaId();
      const gambaUscita: Transazione = {
        id: generaId(), importo, tipo: 'uscita', categoriaId: categoria.id, data,
        istitutoId: istitutoOrigineId, trasferimento: true, trasferimentoId,
        ...(nota && { nota }), ...(tag && { tag }),
      };
      const gambaEntrata: Transazione = {
        id: generaId(), importo, tipo: 'entrata', categoriaId: categoria.id, data,
        istitutoId: istitutoDestinazioneId, trasferimento: true, trasferimentoId,
        ...(nota && { nota }), ...(tag && { tag }),
      };

      set((s) => ({ transazioni: [gambaUscita, gambaEntrata, ...s.transazioni] }));

      const { error } = await supabase.from('transazioni').insert([gambaUscita, gambaEntrata].map((tr) => ({
        id: tr.id,
        importo: tr.importo,
        tipo: tr.tipo,
        categoria_id: tr.categoriaId,
        data: tr.data,
        nota: tr.nota ?? null,
        istituto_id: tr.istitutoId ?? null,
        tag: tr.tag ?? null,
        trasferimento: true,
        trasferimento_id: trasferimentoId,
      })));
      rollbackSeErrore('aggiungi trasferimento', error);
    },

    // Inserimento massivo (import CSV): le categorie mancanti vanno create PRIMA di chiamare questa azione
    importaTransazioni: async (righe) => {
      const nuove: Transazione[] = righe.map((r) => ({ ...r, id: generaId() }));
      set((s) => ({ transazioni: [...nuove, ...s.transazioni] }));
      const { error } = await supabase.from('transazioni').insert(nuove.map((t) => ({
        id: t.id,
        importo: t.importo,
        tipo: t.tipo,
        categoria_id: t.categoriaId,
        data: t.data,
        nota: t.nota ?? null,
        tipologia: t.tipologia ?? null,
        istituto_id: t.istitutoId ?? null,
        ricorrente: false,
        data_fine: null,
        template_id: null,
        tag: t.tag ?? null,
      })));
      rollbackSeErrore('importa transazioni', error);
    },

    // Crea il modello ricorrente e tutte le transazioni reali fino a dataFine
    aggiungiModelloRicorrente: async (dati) => {
      const templateId = generaId();
      const modello: Transazione = { ...dati, id: templateId, ricorrente: true };

      // Ottimistic: mostra subito il modello nella UI
      set((s) => ({ transazioni: [modello, ...s.transazioni] }));

      const { error: errModello } = await supabase.from('transazioni').insert({
        id: modello.id,
        importo: modello.importo,
        tipo: modello.tipo,
        categoria_id: modello.categoriaId,
        data: modello.data,
        nota: modello.nota ?? null,
        tipologia: modello.tipologia ?? null,
        istituto_id: modello.istitutoId ?? null,
        ricorrente: true,
        data_fine: modello.dataFine ?? null,
        template_id: null,
        tag: modello.tag ?? null,
      });
      if (rollbackSeErrore('aggiungi modello ricorrente', errModello)) return;

      if (!dati.dataFine) return;

      // Genera le transazioni reali per ogni mese da data a dataFine
      const inizioDate = new Date(dati.data + 'T00:00:00');
      const fineDate   = new Date(dati.dataFine + 'T00:00:00');
      const giornoDel  = inizioDate.getDate();
      const generate: Transazione[] = [];

      let cursore = new Date(inizioDate.getFullYear(), inizioDate.getMonth(), 1);
      while (cursore <= fineDate) {
        const maxGiorno = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 0).getDate();
        const gg  = String(Math.min(giornoDel, maxGiorno)).padStart(2, '0');
        const mm  = String(cursore.getMonth() + 1).padStart(2, '0');
        const dataStr = `${cursore.getFullYear()}-${mm}-${gg}`;
        generate.push({
          id: generaId(),
          importo: dati.importo,
          tipo: dati.tipo,
          categoriaId: dati.categoriaId,
          data: dataStr,
          ...(dati.nota      != null && { nota: dati.nota }),
          ...(dati.tipologia != null && { tipologia: dati.tipologia }),
          ...(dati.istitutoId!= null && { istitutoId: dati.istitutoId }),
          ...(dati.tag       != null && { tag: dati.tag }),
          templateId,
        });
        cursore = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 1);
      }

      if (generate.length > 0) {
        const { error: errOccorrenze } = await supabase.from('transazioni').insert(
          generate.map((t) => ({
            id: t.id,
            importo: t.importo,
            tipo: t.tipo,
            categoria_id: t.categoriaId,
            data: t.data,
            nota: t.nota ?? null,
            tipologia: t.tipologia ?? null,
            istituto_id: t.istitutoId ?? null,
            ricorrente: false,
            data_fine: null,
            template_id: templateId,
            tag: t.tag ?? null,
          })),
        );
        if (errOccorrenze) console.error('[Supabase] genera occorrenze ricorrenti:', errOccorrenze.message);
      }

      // Ricarica autoritativo: evita race condition con i callback realtime
      // che possono sovrascrivere lo stato locale prima che tutte le insert finiscano
      await get().caricaDati();
    },

    // Elimina il modello e tutte le transazioni auto-create collegate
    eliminaModelloRicorrente: async (id) => {
      set((s) => ({
        transazioni: s.transazioni.filter((t) => t.id !== id && t.templateId !== id),
      }));
      const { error } = await supabase.from('transazioni').delete().or(`id.eq.${id},template_id.eq.${id}`);
      if (error) console.error('[Supabase] elimina modello ricorrente:', error.message);
      // Ricarica sempre (anche senza errore): rimuove eventuali occorrenze già generate lato server
      await get().caricaDati();
    },

    modificaTransazione: async (id, aggiornamenti) => {
      // Modificare il modello ricorrente propaga i campi condivisi (non la data, che è
      // specifica di ogni occorrenza) a tutte le transazioni già generate da esso: altrimenti
      // il modello in Pianificazione e le occorrenze già create in Riepilogo/Movimenti
      // finiscono disallineati, come se la modifica non avesse avuto effetto
      const bersaglio = get().transazioni.find((t) => t.id === id);
      const CAMPI_CONDIVISI = ['importo', 'tipo', 'categoriaId', 'nota', 'tipologia', 'istitutoId', 'tag'] as const;
      const aggiornamentiCondivisi: Partial<Omit<Transazione, 'id'>> = {};
      if (bersaglio?.ricorrente) {
        for (const campo of CAMPI_CONDIVISI) {
          if (aggiornamenti[campo] !== undefined) (aggiornamentiCondivisi as Record<string, unknown>)[campo] = aggiornamenti[campo];
        }
      }
      const idFigli = Object.keys(aggiornamentiCondivisi).length > 0
        ? get().transazioni.filter((t) => t.templateId === id).map((t) => t.id)
        : [];

      set((s) => ({
        transazioni: s.transazioni.map((t) => {
          if (t.id === id) return { ...t, ...aggiornamenti };
          if (idFigli.includes(t.id)) return { ...t, ...aggiornamentiCondivisi };
          return t;
        }),
      }));

      const dbUpdate: Record<string, unknown> = {};
      if (aggiornamenti.importo     !== undefined) dbUpdate.importo      = aggiornamenti.importo;
      if (aggiornamenti.tipo        !== undefined) dbUpdate.tipo         = aggiornamenti.tipo;
      if (aggiornamenti.categoriaId !== undefined) dbUpdate.categoria_id = aggiornamenti.categoriaId;
      if (aggiornamenti.data        !== undefined) dbUpdate.data         = aggiornamenti.data;
      if (aggiornamenti.nota        !== undefined) dbUpdate.nota         = aggiornamenti.nota;
      if (aggiornamenti.tipologia   !== undefined) dbUpdate.tipologia    = aggiornamenti.tipologia;
      if (aggiornamenti.istitutoId  !== undefined) dbUpdate.istituto_id  = aggiornamenti.istitutoId;
      if (aggiornamenti.ricorrente  !== undefined) dbUpdate.ricorrente   = aggiornamenti.ricorrente;
      if (aggiornamenti.tag         !== undefined) dbUpdate.tag          = aggiornamenti.tag;
      if (aggiornamenti.fotoUrl     !== undefined) dbUpdate.foto_url     = aggiornamenti.fotoUrl;
      const { error } = await supabase.from('transazioni').update(dbUpdate).eq('id', id);
      if (rollbackSeErrore('modifica transazione', error)) return;

      if (idFigli.length > 0) {
        const dbUpdateCondiviso: Record<string, unknown> = {};
        if (aggiornamentiCondivisi.importo     !== undefined) dbUpdateCondiviso.importo      = aggiornamentiCondivisi.importo;
        if (aggiornamentiCondivisi.tipo        !== undefined) dbUpdateCondiviso.tipo         = aggiornamentiCondivisi.tipo;
        if (aggiornamentiCondivisi.categoriaId !== undefined) dbUpdateCondiviso.categoria_id = aggiornamentiCondivisi.categoriaId;
        if (aggiornamentiCondivisi.nota        !== undefined) dbUpdateCondiviso.nota         = aggiornamentiCondivisi.nota;
        if (aggiornamentiCondivisi.tipologia   !== undefined) dbUpdateCondiviso.tipologia    = aggiornamentiCondivisi.tipologia;
        if (aggiornamentiCondivisi.istitutoId  !== undefined) dbUpdateCondiviso.istituto_id  = aggiornamentiCondivisi.istitutoId;
        if (aggiornamentiCondivisi.tag         !== undefined) dbUpdateCondiviso.tag          = aggiornamentiCondivisi.tag;
        const { error: errFigli } = await supabase.from('transazioni').update(dbUpdateCondiviso).in('id', idFigli);
        rollbackSeErrore('propaga modifica a occorrenze ricorrenti', errFigli);
      }
    },

    eliminaTransazione: async (id) => {
      // Un trasferimento è una coppia di transazioni collegate: eliminarne una sola lascerebbe
      // l'altra gamba orfana, quindi si cancellano sempre insieme
      const bersaglio = get().transazioni.find((t) => t.id === id);
      if (bersaglio?.trasferimentoId) {
        const trasferimentoId = bersaglio.trasferimentoId;
        set((s) => ({ transazioni: s.transazioni.filter((t) => t.trasferimentoId !== trasferimentoId) }));
        const { error } = await supabase.from('transazioni').delete().eq('trasferimento_id', trasferimentoId);
        rollbackSeErrore('elimina trasferimento', error);
        return;
      }

      set((s) => ({ transazioni: s.transazioni.filter((t) => t.id !== id) }));
      const { error } = await supabase.from('transazioni').delete().eq('id', id);
      rollbackSeErrore('elimina transazione', error);
    },

    applicaRicorrenti: async (anno, mese) => {
      const ricorrenti = get().transazioni.filter((t) => t.ricorrente);
      for (const t of ricorrenti) {
        const giorno = new Date(t.data + 'T00:00:00').getDate();
        const maxGiorno = new Date(anno, mese + 1, 0).getDate();
        const nuovaData = `${anno}-${String(mese + 1).padStart(2, '0')}-${String(Math.min(giorno, maxGiorno)).padStart(2, '0')}`;
        const nuova: Transazione = { ...t, id: generaId(), data: nuovaData, ricorrente: false };
        set((s) => ({ transazioni: [nuova, ...s.transazioni] }));
        const { error } = await supabase.from('transazioni').insert({
          id: nuova.id, importo: nuova.importo, tipo: nuova.tipo,
          categoria_id: nuova.categoriaId, data: nuova.data,
          nota: nuova.nota ?? null, tipologia: nuova.tipologia ?? null,
          istituto_id: nuova.istitutoId ?? null, ricorrente: false,
          tag: nuova.tag ?? null,
        });
        rollbackSeErrore('applica ricorrente', error);
      }
    },
  };
};
