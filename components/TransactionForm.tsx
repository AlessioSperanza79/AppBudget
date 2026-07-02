import { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
import Text from './TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { Transazione, Categoria, Istituto, TipoTransazione, TipologiaConto } from '../types';
import { oggiIso } from '../utils/formatters';
import { iconaCategoria } from '../utils/iconeCategorie';
import SelectorData from './SelectorData';
import BottomSheet from './BottomSheet';
import { useTema, Tema } from '../constants/tema';

interface Props {
  visibile: boolean;
  onChiudi: () => void;
  onSalva: (dati: Omit<Transazione, 'id'>) => void;
  onSalvaTrasferimento?: (dati: {
    importo: number; data: string; nota?: string; tag?: string;
    istitutoOrigineId: string; istitutoDestinazioneId: string;
  }) => void;
  transazioneEsistente?: Transazione;
  categorie: Categoria[];
  istituti: Istituto[];
  forzaRicorrente?: boolean;
}

const ETICHETTE_TIPOLOGIA: Record<TipologiaConto, string> = {
  conto_corrente: 'Conto Corrente',
  carta_credito:  'Carta di Credito',
};

const ICONE_TIPOLOGIA: Record<TipologiaConto, keyof typeof Ionicons.glyphMap> = {
  conto_corrente: 'business-outline',
  carta_credito:  'card-outline',
};

export default function TransactionForm({
  visibile, onChiudi, onSalva, onSalvaTrasferimento, transazioneEsistente, categorie, istituti, forzaRicorrente,
}: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [importo,     setImporto]     = useState('');
  const [tipo,        setTipo]        = useState<TipoTransazione>('uscita');
  const [categoriaId, setCategoriaId] = useState('');
  const [data,        setData]        = useState(oggiIso());
  const [nota,        setNota]        = useState('');
  const [tag,         setTag]         = useState('');
  const [tipologia,   setTipologia]   = useState<TipologiaConto | undefined>();
  const [istitutoId,  setIstitutoId]  = useState<string | undefined>();
  const [ricorrente,  setRicorrente]  = useState(false);
  const [dataFine,    setDataFine]    = useState('');

  // Modalità trasferimento: alternativa a Uscita/Entrata, disponibile solo per nuove
  // transazioni (non in modifica) quando ci sono almeno 2 conti tra cui spostare
  const [trasferimento, setTrasferimento]                 = useState(false);
  const [istitutoOrigineId, setIstitutoOrigineId]         = useState<string | undefined>();
  const [istitutoDestinazioneId, setIstitutoDestinazioneId] = useState<string | undefined>();
  const trasferimentoDisponibile = !!onSalvaTrasferimento && !forzaRicorrente && !transazioneEsistente && istituti.length >= 2;

  const dataFineDefault = (): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (visibile) {
      setImporto(transazioneEsistente ? String(transazioneEsistente.importo) : '');
      setTipo(transazioneEsistente?.tipo ?? 'uscita');
      setCategoriaId(transazioneEsistente?.categoriaId ?? (categorie[0]?.id ?? ''));
      setData(transazioneEsistente?.data ?? oggiIso());
      setNota(transazioneEsistente?.nota ?? '');
      setTag(transazioneEsistente?.tag ?? '');
      setTipologia(transazioneEsistente?.tipologia);
      setIstitutoId(transazioneEsistente?.istitutoId);
      setRicorrente(transazioneEsistente?.ricorrente ?? (forzaRicorrente ?? false));
      setDataFine(transazioneEsistente?.dataFine ?? dataFineDefault());
      setTrasferimento(false);
      setIstitutoOrigineId(undefined);
      setIstitutoDestinazioneId(undefined);
    }
  }, [visibile, transazioneEsistente]);

  const gestisciSalva = () => {
    const importoNum = parseFloat(importo.replace(',', '.'));
    if (isNaN(importoNum) || importoNum <= 0) {
      Alert.alert('Importo non valido', 'Inserisci un numero maggiore di zero.');
      return;
    }

    if (trasferimento) {
      if (!istitutoOrigineId || !istitutoDestinazioneId) {
        Alert.alert('Conti mancanti', 'Seleziona il conto di origine e quello di destinazione.');
        return;
      }
      if (istitutoOrigineId === istitutoDestinazioneId) {
        Alert.alert('Conti uguali', 'Il conto di origine e quello di destinazione devono essere diversi.');
        return;
      }
      onSalvaTrasferimento?.({
        importo: importoNum, data,
        nota: nota.trim() || undefined,
        tag: tag.trim() || undefined,
        istitutoOrigineId, istitutoDestinazioneId,
      });
      onChiudi();
      return;
    }

    if (!categoriaId) {
      Alert.alert('Categoria mancante', 'Seleziona una categoria.');
      return;
    }
    onSalva({
      importo: importoNum, tipo, categoriaId, data,
      nota: nota.trim() || undefined,
      tag: tag.trim() || undefined,
      tipologia,
      istitutoId,
      ricorrente: ricorrente || undefined,
      dataFine: ((ricorrente || forzaRicorrente) && dataFine) ? dataFine : undefined,
    });
    onChiudi();
  };

  const coloreAccento = trasferimento ? t.primario : (tipo === 'entrata' ? t.entrata : t.uscita);

  return (
    <BottomSheet visibile={visibile} onChiudi={onChiudi} altezza="94%">
      <KeyboardAvoidingView
        style={stili.sfondo}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* ── Intestazione ── */}
        <View style={stili.header}>
          <Text style={stili.titolo}>
            {transazioneEsistente ? 'Modifica transazione' : 'Nuova transazione'}
          </Text>
          <TouchableOpacity onPress={onChiudi} hitSlop={8} style={stili.btnChiudi}>
            <Ionicons name="close" size={16} color={t.sottile} />
          </TouchableOpacity>
        </View>

        <ScrollView style={stili.corpo} keyboardShouldPersistTaps="handled">

          {/* ── Importo ── */}
          <View style={[stili.areaImporto, { borderColor: coloreAccento + '40' }]}>
            <Text style={stili.labelImporto}>IMPORTO</Text>
            <View style={stili.rigaImporto}>
              <Text style={[stili.simboloEuro, { color: importo ? coloreAccento : t.segnaposto }]}>€</Text>
              <TextInput
                style={[stili.inputImporto, { color: coloreAccento }]}
                value={importo}
                onChangeText={setImporto}
                placeholder="0,00"
                placeholderTextColor={t.segnaposto}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            <View style={[stili.lineaImporto, { backgroundColor: coloreAccento }]} />
          </View>

          {/* ── Tipo ── */}
          <Text style={stili.etichetta}>Tipo</Text>
          <View style={stili.toggleRiga}>
            {(['uscita', 'entrata'] as TipoTransazione[]).map((tp) => {
              const attivo = !trasferimento && tipo === tp;
              const c = tp === 'entrata' ? t.entrata : t.uscita;
              return (
                <TouchableOpacity
                  key={tp}
                  style={[stili.btnToggle, attivo && { backgroundColor: c, borderColor: c }]}
                  onPress={() => { setTrasferimento(false); setTipo(tp); }}
                >
                  <Ionicons
                    name={tp === 'entrata' ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={18}
                    color={attivo ? '#FFF' : t.piuSottile}
                  />
                  <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                    {tp === 'entrata' ? 'Entrata' : 'Uscita'}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {trasferimentoDisponibile && (
              <TouchableOpacity
                style={[stili.btnToggle, trasferimento && { backgroundColor: t.primario, borderColor: t.primario }]}
                onPress={() => setTrasferimento(true)}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color={trasferimento ? '#FFF' : t.piuSottile}
                />
                <Text style={[stili.testoToggle, trasferimento && { color: '#FFF' }]}>
                  Trasferimento
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {trasferimento ? (
            <>
              {/* ── Conto di origine/destinazione ── */}
              <Text style={stili.etichetta}>Da</Text>
              <View style={stili.righeCategoria}>
                {istituti.map((ist) => {
                  const selezionato = istitutoOrigineId === ist.id;
                  return (
                    <TouchableOpacity
                      key={ist.id}
                      style={[stili.chipIstituto, selezionato && { backgroundColor: t.uscita, borderColor: t.uscita }]}
                      onPress={() => setIstitutoOrigineId(ist.id)}
                    >
                      <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                        {ist.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={stili.etichetta}>A</Text>
              <View style={stili.righeCategoria}>
                {istituti.map((ist) => {
                  const selezionato = istitutoDestinazioneId === ist.id;
                  const disabilitato = istitutoOrigineId === ist.id;
                  return (
                    <TouchableOpacity
                      key={ist.id}
                      disabled={disabilitato}
                      style={[
                        stili.chipIstituto,
                        selezionato && { backgroundColor: t.entrata, borderColor: t.entrata },
                        disabilitato && { opacity: 0.35 },
                      ]}
                      onPress={() => setIstitutoDestinazioneId(ist.id)}
                    >
                      <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                        {ist.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Data ── */}
              <Text style={stili.etichetta}>Data</Text>
              <SelectorData valore={data} onChange={setData} />
            </>
          ) : (
            <>
              {/* ── Categoria ── */}
              <Text style={stili.etichetta}>Categoria</Text>
              {/* A capo invece di scorrimento orizzontale: con molte categorie lo scroll orizzontale
                  non è scopribile (soprattutto col mouse sul web) e alcune finivano irraggiungibili */}
              <View style={stili.righeCategoria}>
                {categorie.map((cat) => {
                  const selezionata = categoriaId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        stili.chipCategoria,
                        selezionata && { borderColor: cat.colore, borderWidth: 2, backgroundColor: cat.colore + '1A' },
                      ]}
                      onPress={() => setCategoriaId(cat.id)}
                    >
                      <View style={[stili.puntoCat, { backgroundColor: cat.colore }]}>
                        <Ionicons name={iconaCategoria(cat.nome)} size={11} color="#FFFFFF" />
                      </View>
                      <Text style={[stili.testoCat, selezionata && { color: cat.colore, fontWeight: '700' }]}>
                        {cat.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Data ── */}
              <Text style={stili.etichetta}>Data</Text>
              <SelectorData valore={data} onChange={setData} />

              {/* ── Tipologia conto ── */}
              <Text style={stili.etichetta}>Tipologia (opzionale)</Text>
              <View style={stili.toggleRiga}>
                {(['conto_corrente', 'carta_credito'] as TipologiaConto[]).map((tp) => {
                  const attivo = tipologia === tp;
                  return (
                    <TouchableOpacity
                      key={tp}
                      style={[stili.btnToggle, attivo && stili.btnToggleAttivoBlue]}
                      onPress={() => setTipologia(tipologia === tp ? undefined : tp)}
                    >
                      <Ionicons
                        name={ICONE_TIPOLOGIA[tp]}
                        size={18}
                        color={attivo ? '#FFF' : t.piuSottile}
                      />
                      <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                        {ETICHETTE_TIPOLOGIA[tp]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Istituto ── */}
              {istituti.length > 0 && (
                <>
                  <Text style={stili.etichetta}>Istituto (opzionale)</Text>
                  <View style={stili.righeCategoria}>
                    {istituti.map((ist) => {
                      const selezionato = istitutoId === ist.id;
                      return (
                        <TouchableOpacity
                          key={ist.id}
                          style={[stili.chipIstituto, selezionato && stili.chipIstitutoAttivo]}
                          onPress={() => setIstitutoId(istitutoId === ist.id ? undefined : ist.id)}
                        >
                          <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                            {ist.nome}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}

          {/* ── Nota ── */}
          <Text style={stili.etichetta}>Nota (facoltativa)</Text>
          <TextInput
            style={[stili.input, stili.inputNota]}
            value={nota}
            onChangeText={setNota}
            placeholder="Es. pranzo di lavoro..."
            placeholderTextColor={t.segnaposto}
            multiline
          />

          {/* ── Tag ── */}
          <Text style={stili.etichetta}>Tag (facoltativo)</Text>
          <TextInput
            style={stili.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Es. Vacanze, Lavoro..."
            placeholderTextColor={t.segnaposto}
            autoCapitalize="none"
          />

          {/* ── Ricorrente ── */}
          {!forzaRicorrente && !trasferimento && (
            <>
              <Text style={stili.etichetta}>Ricorrente</Text>
              <TouchableOpacity
                style={[stili.btnRicorrente, ricorrente && stili.btnRicorrenteAttivo]}
                onPress={() => setRicorrente((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={ricorrente ? 'repeat' : 'repeat-outline'}
                  size={18}
                  color={ricorrente ? '#FFF' : t.piuSottile}
                />
                <Text style={[stili.testoToggle, ricorrente && { color: '#FFF' }]}>
                  {ricorrente ? 'Sì — appare in Pianificazione' : 'No — transazione singola'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!trasferimento && (ricorrente || forzaRicorrente) && (
            <>
              <Text style={stili.etichetta}>Fine ricorrenza</Text>
              <SelectorData valore={dataFine} onChange={setDataFine} />
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Pulsante Salva ── */}
        <TouchableOpacity
          style={[stili.btnSalva, { backgroundColor: coloreAccento }]}
          onPress={gestisciSalva}
          activeOpacity={0.85}
        >
          <Text style={stili.testoSalva}>
            {transazioneEsistente
              ? 'Salva modifiche'
              : trasferimento
                ? 'Registra trasferimento'
                : `Aggiungi ${tipo === 'entrata' ? 'entrata' : 'uscita'}`}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    sfondo: {
      flex: 1,
      backgroundColor: t.sfondo,
    },

    // ── Header ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.bordoSottile,
      backgroundColor: t.carta,
    },
    titolo: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
    },
    btnChiudi: {
      width: 32,
      height: 32,
      borderRadius: 18,
      backgroundColor: t.superfice,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
      justifyContent: 'center',
    },

    corpo: {
      flex: 1,
      paddingHorizontal: 20,
    },

    // ── Area importo ──
    areaImporto: {
      backgroundColor: t.carta,
      borderRadius: 24,
      borderWidth: 1.5,
      paddingVertical: 24,
      paddingHorizontal: 20,
      marginTop: 20,
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    labelImporto: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    rigaImporto: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    simboloEuro: {
      fontSize: 26,
      fontWeight: '700',
      paddingBottom: 6,
    },
    inputImporto: {
      fontSize: 48,
      fontWeight: '800',
      minWidth: 130,
      letterSpacing: -1.5,
      paddingVertical: 0,
    },
    lineaImporto: {
      height: 3,
      width: 72,
      borderRadius: 2,
      marginTop: 10,
      opacity: 0.8,
    },

    // ── Etichette sezione ──
    etichetta: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 22,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // ── Toggle tipo ──
    toggleRiga: {
      flexDirection: 'row',
      gap: 10,
    },
    btnToggle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    btnToggleAttivoBlue: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoToggle: {
      fontSize: 14,
      fontWeight: '600',
      color: t.piuSottile,
    },

    // ── Chip categoria ──
    righeCategoria: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipCategoria: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 8,
      paddingLeft: 8,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    puntoCat: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    testoCat: {
      fontSize: 13,
      color: t.sottile,
      fontWeight: '500',
    },

    // ── Input standard ──
    input: {
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 12,
      padding: 13,
      fontSize: 15,
      backgroundColor: t.carta,
      color: t.titolo,
    },
    inputNota: {
      height: 80,
      textAlignVertical: 'top',
    },

    // ── Chip istituto ──
    chipIstituto: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    chipIstitutoAttivo: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoChipIstituto: {
      fontSize: 13,
      color: t.sottile,
      fontWeight: '500',
    },

    // ── Ricorrente ──
    btnRicorrente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    btnRicorrenteAttivo: {
      backgroundColor: t.viola,
      borderColor: t.viola,
    },

    // ── Pulsante salva ──
    btnSalva: {
      margin: 20,
      borderRadius: 18,
      padding: 17,
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    testoSalva: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}
