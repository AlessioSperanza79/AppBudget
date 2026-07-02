// ── Bottone + flusso "Importa CSV": legge un file, mostra un'anteprima e conferma l'inserimento ──
import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { parseCsvTransazioni, RigaCsvParsata } from '../../utils/importCsv';
import { selezionaFileCsv } from '../../utils/importaFile';
import PressableScale from '../PressableScale';
import BottomSheet from '../BottomSheet';
import { useTema, Tema } from '../../constants/tema';
import { PALETTE_CATEGORIE } from '../../constants/paletteCategorie';

type Fase = 'inattivo' | 'caricamento' | 'anteprima' | 'importazione' | 'completato';

export default function ImportaCsvModal() {
  const categorie = useFinanceStore((s) => s.categorie);
  const istituti = useFinanceStore((s) => s.istituti);
  const aggiungiCategoria = useFinanceStore((s) => s.aggiungiCategoria);
  const importaTransazioni = useFinanceStore((s) => s.importaTransazioni);

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [fase, setFase] = useState<Fase>('inattivo');
  const [righe, setRighe] = useState<RigaCsvParsata[]>([]);
  const [categorieNuove, setCategorieNuove] = useState<string[]>([]);
  const [errori, setErrori] = useState<string[]>([]);
  const [erroreGenerale, setErroreGenerale] = useState('');
  const [importate, setImportate] = useState(0);

  const avviaImport = async () => {
    setErroreGenerale('');
    const contenuto = await selezionaFileCsv();
    if (!contenuto) return;

    setFase('caricamento');
    const risultato = parseCsvTransazioni(contenuto, categorie, istituti);
    if (risultato.righe.length === 0) {
      setErroreGenerale(risultato.errori[0] ?? 'Nessuna riga valida trovata nel file.');
      setFase('inattivo');
      return;
    }
    setRighe(risultato.righe);
    setCategorieNuove(risultato.categorieNuove);
    setErrori(risultato.errori);
    setFase('anteprima');
  };

  const confermaImport = async () => {
    setFase('importazione');

    // Crea prima le categorie mancanti (azione già esistente nello store, una alla volta)
    for (const nome of categorieNuove) {
      const colore = PALETTE_CATEGORIE[Math.floor(Math.random() * PALETTE_CATEGORIE.length)];
      await aggiungiCategoria(nome, colore);
    }

    // Rilegge lo stato aggiornato per mappare nome → id, comprese le categorie appena create
    const mappa = new Map(
      useFinanceStore.getState().categorie.map((c) => [c.nome.trim().toLowerCase(), c.id] as const)
    );

    const risolte = righe
      .map((r) => {
        const categoriaId = mappa.get(r.nomeCategoria.trim().toLowerCase());
        if (!categoriaId) return null;
        return {
          importo: r.importo,
          tipo: r.tipo,
          data: r.data,
          categoriaId,
          ...(r.nota && { nota: r.nota }),
          ...(r.tag && { tag: r.tag }),
          ...(r.istitutoId && { istitutoId: r.istitutoId }),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    await importaTransazioni(risolte);
    setImportate(risolte.length);
    setFase('completato');
  };

  const chiudi = () => {
    setFase('inattivo');
    setRighe([]);
    setCategorieNuove([]);
    setErrori([]);
    setImportate(0);
  };

  return (
    <View>
      <PressableScale style={stili.btnImporta} onPress={avviaImport}>
        <Ionicons name="cloud-upload-outline" size={18} color={t.primario} />
        <Text style={stili.testoBtnImporta}>Importa CSV</Text>
      </PressableScale>
      {!!erroreGenerale && <Text style={stili.testoErrore}>{erroreGenerale}</Text>}

      <BottomSheet visibile={fase !== 'inattivo'} onChiudi={fase === 'importazione' ? () => {} : chiudi}>
        <View style={stili.corpoModal}>
          {fase === 'caricamento' && <Text style={stili.testoStato}>Lettura del file…</Text>}

          {fase === 'anteprima' && (
            <>
              <Text style={stili.titoloModal}>Anteprima importazione</Text>
              <Text style={stili.testoRiepilogo}>
                {righe.length} transazion{righe.length === 1 ? 'e pronta' : 'i pronte'} da importare
              </Text>

              {categorieNuove.length > 0 && (
                <View style={stili.blocco}>
                  <Text style={stili.etichettaBlocco}>Nuove categorie da creare</Text>
                  <Text style={stili.testoBlocco}>{categorieNuove.join(', ')}</Text>
                </View>
              )}

              {errori.length > 0 && (
                <View style={stili.blocco}>
                  <Text style={[stili.etichettaBlocco, { color: t.uscita }]}>
                    {errori.length} rig{errori.length === 1 ? 'a scartata' : 'he scartate'}
                  </Text>
                  {errori.slice(0, 8).map((e, i) => (
                    <Text key={i} style={stili.testoErroreRiga}>{e}</Text>
                  ))}
                  {errori.length > 8 && <Text style={stili.testoErroreRiga}>… e altre {errori.length - 8}</Text>}
                </View>
              )}

              <View style={stili.rigaBottoni}>
                <TouchableOpacity style={stili.btnAnnulla} onPress={chiudi}>
                  <Text style={stili.testoAnnulla}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={stili.btnConferma} onPress={confermaImport}>
                  <Text style={stili.testoConferma}>Importa</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {fase === 'importazione' && <Text style={stili.testoStato}>Importazione in corso…</Text>}

          {fase === 'completato' && (
            <>
              <Ionicons name="checkmark-circle" size={40} color={t.entrata} style={{ alignSelf: 'center', marginTop: 8 }} />
              <Text style={[stili.titoloModal, { textAlign: 'center' }]}>Fatto!</Text>
              <Text style={[stili.testoRiepilogo, { textAlign: 'center' }]}>
                {importate} transazioni importate con successo.
              </Text>
              <TouchableOpacity style={[stili.btnConferma, { marginTop: 20 }]} onPress={chiudi}>
                <Text style={stili.testoConferma}>Chiudi</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    btnImporta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.primarioSfondo,
      borderRadius: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoBtnImporta: {
      fontSize: 14,
      fontWeight: '600',
      color: t.primario,
    },
    testoErrore: {
      color: t.uscita,
      fontSize: 12,
      marginTop: 8,
    },

    // ── Modal ──
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    testoRiepilogo: {
      fontSize: 14,
      color: t.sottile,
      marginBottom: 4,
    },
    testoStato: {
      fontSize: 15,
      color: t.sottile,
      textAlign: 'center',
      marginTop: 40,
    },
    blocco: {
      marginTop: 16,
      padding: 12,
      borderRadius: 12,
      backgroundColor: t.superfice,
    },
    etichettaBlocco: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    testoBlocco: {
      fontSize: 13,
      color: t.corpo,
      lineHeight: 20,
    },
    testoErroreRiga: {
      fontSize: 12,
      color: t.sottile,
      lineHeight: 18,
    },
    rigaBottoni: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    btnAnnulla: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
    },
    testoAnnulla: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnConferma: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: t.primario,
      alignItems: 'center',
    },
    testoConferma: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
