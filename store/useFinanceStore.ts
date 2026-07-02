import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Transazione, Categoria, Istituto, TipoCategoria, Obiettivo } from '../types';
import { CATEGORIE_DEFAULT } from '../constants/categorieDefault';
import { ISTITUTI_DEFAULT } from '../constants/istitutiDefault';

const generaId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Categoria riservata per i trasferimenti tra conti: creata al bisogno (non fa parte dei
// CATEGORIE_DEFAULT perché serve anche a chi ha installato l'app prima di questa funzione)
const ID_CATEGORIA_TRASFERIMENTO = 'trasferimento-interno';

// ────────────────────────────────────────────────────────────────────────────
// Tipo dello stato dello store
// ────────────────────────────────────────────────────────────────────────────
interface FinanceState {
  transazioni: Transazione[];
  categorie: Categoria[];
  istituti: Istituto[];
  obiettivi: Obiettivo[];
  caricamento: boolean;
  reddito: number; // reddito mensile netto impostato dall'utente

  caricaDati: () => Promise<void>;
  avviaRealtime: () => () => void;

  aggiungiTransazione: (t: Omit<Transazione, 'id'>) => Promise<void>;
  importaTransazioni: (righe: Omit<Transazione, 'id'>[]) => Promise<void>;
  modificaTransazione: (id: string, aggiornamenti: Partial<Omit<Transazione, 'id'>>) => Promise<void>;
  eliminaTransazione: (id: string) => Promise<void>;
  aggiungiTrasferimento: (dati: {
    importo: number; data: string; nota?: string; tag?: string;
    istitutoOrigineId: string; istitutoDestinazioneId: string;
  }) => Promise<void>;

  aggiungiModelloRicorrente: (dati: Omit<Transazione, 'id'>) => Promise<void>;
  eliminaModelloRicorrente: (id: string) => Promise<void>;

  aggiungiCategoria: (nome: string, colore: string, tipo?: TipoCategoria) => Promise<void>;
  rinominaCategoria: (id: string, nuovoNome: string) => Promise<void>;
  eliminaCategoria: (id: string) => Promise<void>;
  aggiornaBudgetCategoria: (id: string, budget: number | undefined) => Promise<void>;
  aggiornaTipoCategoria: (id: string, tipo: TipoCategoria) => Promise<void>;
  aggiornaRolloverCategoria: (id: string, rollover: boolean) => Promise<void>;

  aggiornaReddito: (r: number) => Promise<void>;

  applicaRicorrenti: (anno: number, mese: number) => Promise<void>;

  aggiungiIstituto: (nome: string) => Promise<void>;
  rinominaIstituto: (id: string, nuovoNome: string) => Promise<void>;
  eliminaIstituto: (id: string) => Promise<void>;

  aggiungiObiettivo: (dati: Omit<Obiettivo, 'id'>) => Promise<void>;
  modificaObiettivo: (id: string, aggiornamenti: Partial<Omit<Obiettivo, 'id'>>) => Promise<void>;
  eliminaObiettivo: (id: string) => Promise<void>;
}

// ────────────────────────────────────────────────────────────────────────────
// Store: Supabase come fonte di verità, stato locale per reattività UI
// ────────────────────────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceState>()((set, get) => ({
  transazioni: [],
  categorie: [],
  istituti: [],
  obiettivi: [],
  caricamento: true,
  reddito: 0,

  caricaDati: async () => {
    set({ caricamento: true });

    const [catRis, transRis, istRis, impostRis, obiRis] = await Promise.all([
      supabase.from('categorie').select('*'),
      supabase.from('transazioni').select('*').order('data', { ascending: false }),
      supabase.from('istituti').select('*'),
      supabase.from('impostazioni').select('reddito_mensile').eq('id', 'default').maybeSingle(),
      supabase.from('obiettivi').select('*').order('created_at', { ascending: true }),
    ]);

    if (catRis.error)   console.error('[Supabase] carica categorie:', catRis.error.message);
    if (transRis.error) console.error('[Supabase] carica transazioni:', transRis.error.message);
    if (istRis.error)   console.error('[Supabase] carica istituti:', istRis.error.message);
    if (obiRis.error)   console.error('[Supabase] carica obiettivi:', obiRis.error.message);

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
      transazioni: transDb.map(({ id, importo, tipo, categoria_id, data, nota, tipologia, istituto_id, ricorrente, data_fine, template_id, tag, trasferimento, trasferimento_id }): Transazione => ({
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
      })),
      obiettivi: (obiRis.data ?? []).map(({ id, nome, importo_obiettivo, importo_attuale, colore, data_scadenza, created_at }): Obiettivo => ({
        id, nome, colore,
        importoObiettivo: Number(importo_obiettivo),
        importoAttuale: Number(importo_attuale),
        ...(data_scadenza != null && { dataScadenza: data_scadenza }),
        ...(created_at != null && { createdAt: created_at }),
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

  // ── Transazioni ──

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
    });
    if (error) console.error('[Supabase] aggiungi transazione:', error.message, error.code);
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
    if (error) {
      console.error('[Supabase] aggiungi trasferimento:', error.message, error.code);
      await get().caricaDati();
    }
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
    if (error) {
      console.error('[Supabase] importa transazioni:', error.message, error.code);
      await get().caricaDati();
    }
  },

  // Crea il modello ricorrente e tutte le transazioni reali fino a dataFine
  aggiungiModelloRicorrente: async (dati) => {
    const templateId = generaId();
    const modello: Transazione = { ...dati, id: templateId, ricorrente: true };

    // Ottimistic: mostra subito il modello nella UI
    set((s) => ({ transazioni: [modello, ...s.transazioni] }));

    await supabase.from('transazioni').insert({
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
      await supabase.from('transazioni').insert(
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
    await get().caricaDati();
  },

  modificaTransazione: async (id, aggiornamenti) => {
    set((s) => ({
      transazioni: s.transazioni.map((t) => t.id === id ? { ...t, ...aggiornamenti } : t),
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
    await supabase.from('transazioni').update(dbUpdate).eq('id', id);
  },

  eliminaTransazione: async (id) => {
    // Un trasferimento è una coppia di transazioni collegate: eliminarne una sola lascerebbe
    // l'altra gamba orfana, quindi si cancellano sempre insieme
    const bersaglio = get().transazioni.find((t) => t.id === id);
    if (bersaglio?.trasferimentoId) {
      const trasferimentoId = bersaglio.trasferimentoId;
      set((s) => ({ transazioni: s.transazioni.filter((t) => t.trasferimentoId !== trasferimentoId) }));
      const { error } = await supabase.from('transazioni').delete().eq('trasferimento_id', trasferimentoId);
      if (error) {
        console.error('[Supabase] elimina trasferimento:', error.message);
        await get().caricaDati();
      }
      return;
    }

    set((s) => ({ transazioni: s.transazioni.filter((t) => t.id !== id) }));
    const { error } = await supabase.from('transazioni').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] elimina transazione:', error.message);
      await get().caricaDati();
    }
  },

  // ── Categorie ──

  aggiungiCategoria: async (nome, colore, tipo = 'variabile') => {
    const nuova: Categoria = { id: generaId(), nome, colore, tipo };
    set((s) => ({ categorie: [...s.categorie, nuova] }));
    await supabase.from('categorie').insert({ id: nuova.id, nome: nuova.nome, colore: nuova.colore, tipo: nuova.tipo });
  },

  rinominaCategoria: async (id, nuovoNome) => {
    set((s) => ({
      categorie: s.categorie.map((c) => c.id === id ? { ...c, nome: nuovoNome } : c),
    }));
    await supabase.from('categorie').update({ nome: nuovoNome }).eq('id', id);
  },

  eliminaCategoria: async (id) => {
    set((s) => ({ categorie: s.categorie.filter((c) => c.id !== id) }));
    await supabase.from('categorie').delete().eq('id', id);
  },

  aggiornaBudgetCategoria: async (id, budget) => {
    set((s) => ({
      categorie: s.categorie.map((c) => c.id === id ? { ...c, budgetMensile: budget } : c),
    }));
    await supabase.from('categorie').update({ budget_mensile: budget ?? null }).eq('id', id);
  },

  aggiornaTipoCategoria: async (id, tipo) => {
    set((s) => ({
      categorie: s.categorie.map((c) => c.id === id ? { ...c, tipo } : c),
    }));
    await supabase.from('categorie').update({ tipo }).eq('id', id);
  },

  aggiornaRolloverCategoria: async (id, rollover) => {
    set((s) => ({
      categorie: s.categorie.map((c) => c.id === id ? { ...c, rollover } : c),
    }));
    await supabase.from('categorie').update({ rollover }).eq('id', id);
  },

  aggiornaReddito: async (r) => {
    set({ reddito: r });
    await supabase.from('impostazioni').upsert({ id: 'default', reddito_mensile: r });
  },

  applicaRicorrenti: async (anno, mese) => {
    const ricorrenti = get().transazioni.filter((t) => t.ricorrente);
    for (const t of ricorrenti) {
      const giorno = new Date(t.data + 'T00:00:00').getDate();
      const maxGiorno = new Date(anno, mese + 1, 0).getDate();
      const nuovaData = `${anno}-${String(mese + 1).padStart(2, '0')}-${String(Math.min(giorno, maxGiorno)).padStart(2, '0')}`;
      const nuova: Transazione = { ...t, id: generaId(), data: nuovaData, ricorrente: false };
      set((s) => ({ transazioni: [nuova, ...s.transazioni] }));
      await supabase.from('transazioni').insert({
        id: nuova.id, importo: nuova.importo, tipo: nuova.tipo,
        categoria_id: nuova.categoriaId, data: nuova.data,
        nota: nuova.nota ?? null, tipologia: nuova.tipologia ?? null,
        istituto_id: nuova.istitutoId ?? null, ricorrente: false,
        tag: nuova.tag ?? null,
      });
    }
  },

  // ── Istituti ──

  aggiungiIstituto: async (nome) => {
    const nuovo: Istituto = { id: generaId(), nome };
    set((s) => ({ istituti: [...s.istituti, nuovo] }));
    await supabase.from('istituti').insert(nuovo);
  },

  rinominaIstituto: async (id, nuovoNome) => {
    set((s) => ({
      istituti: s.istituti.map((i) => i.id === id ? { ...i, nome: nuovoNome } : i),
    }));
    await supabase.from('istituti').update({ nome: nuovoNome }).eq('id', id);
  },

  eliminaIstituto: async (id) => {
    set((s) => ({ istituti: s.istituti.filter((i) => i.id !== id) }));
    await supabase.from('istituti').delete().eq('id', id);
  },

  // ── Obiettivi di risparmio ──

  aggiungiObiettivo: async (dati) => {
    const nuovo: Obiettivo = { ...dati, id: generaId() };
    set((s) => ({ obiettivi: [...s.obiettivi, nuovo] }));
    await supabase.from('obiettivi').insert({
      id: nuovo.id,
      nome: nuovo.nome,
      importo_obiettivo: nuovo.importoObiettivo,
      importo_attuale: nuovo.importoAttuale,
      colore: nuovo.colore,
      data_scadenza: nuovo.dataScadenza ?? null,
    });
  },

  modificaObiettivo: async (id, aggiornamenti) => {
    set((s) => ({
      obiettivi: s.obiettivi.map((o) => o.id === id ? { ...o, ...aggiornamenti } : o),
    }));
    const dbUpdate: Record<string, unknown> = {};
    if (aggiornamenti.nome             !== undefined) dbUpdate.nome              = aggiornamenti.nome;
    if (aggiornamenti.importoObiettivo !== undefined) dbUpdate.importo_obiettivo = aggiornamenti.importoObiettivo;
    if (aggiornamenti.importoAttuale   !== undefined) dbUpdate.importo_attuale   = aggiornamenti.importoAttuale;
    if (aggiornamenti.colore           !== undefined) dbUpdate.colore            = aggiornamenti.colore;
    if (aggiornamenti.dataScadenza     !== undefined) dbUpdate.data_scadenza     = aggiornamenti.dataScadenza ?? null;
    await supabase.from('obiettivi').update(dbUpdate).eq('id', id);
  },

  eliminaObiettivo: async (id) => {
    set((s) => ({ obiettivi: s.obiettivi.filter((o) => o.id !== id) }));
    await supabase.from('obiettivi').delete().eq('id', id);
  },
}));
