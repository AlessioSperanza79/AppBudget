import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Modal, Alert, KeyboardAvoidingView,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transazione, Categoria, Istituto, TipoTransazione, TipologiaConto } from '../types';
import { oggiIso } from '../utils/formatters';
import SelectorData from './SelectorData';

interface Props {
  visibile: boolean;
  onChiudi: () => void;
  onSalva: (dati: Omit<Transazione, 'id'>) => void;
  transazioneEsistente?: Transazione;
  categorie: Categoria[];
  istituti: Istituto[];
  forzaRicorrente?: boolean; // true nella schermata Pianificazione
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
  visibile, onChiudi, onSalva, transazioneEsistente, categorie, istituti, forzaRicorrente,
}: Props) {
  const [importo,     setImporto]     = useState('');
  const [tipo,        setTipo]        = useState<TipoTransazione>('uscita');
  const [categoriaId, setCategoriaId] = useState('');
  const [data,        setData]        = useState(oggiIso());
  const [nota,        setNota]        = useState('');
  const [tipologia,   setTipologia]   = useState<TipologiaConto | undefined>();
  const [istitutoId,  setIstitutoId]  = useState<string | undefined>();
  const [ricorrente,  setRicorrente]  = useState(false);
  const [dataFine,    setDataFine]    = useState('');

  // dataFine di default: 12 mesi da oggi
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
      setTipologia(transazioneEsistente?.tipologia);
      setIstitutoId(transazioneEsistente?.istitutoId);
      setRicorrente(transazioneEsistente?.ricorrente ?? (forzaRicorrente ?? false));
      setDataFine(transazioneEsistente?.dataFine ?? dataFineDefault());
    }
  }, [visibile, transazioneEsistente]);

  const gestisciSalva = () => {
    const importoNum = parseFloat(importo.replace(',', '.'));
    if (isNaN(importoNum) || importoNum <= 0) {
      Alert.alert('Importo non valido', 'Inserisci un numero maggiore di zero.');
      return;
    }
    if (!categoriaId) {
      Alert.alert('Categoria mancante', 'Seleziona una categoria.');
      return;
    }
    onSalva({
      importo: importoNum, tipo, categoriaId, data,
      nota: nota.trim() || undefined,
      tipologia,
      istitutoId,
      ricorrente: ricorrente || undefined,
      dataFine: ((ricorrente || forzaRicorrente) && dataFine) ? dataFine : undefined,
    });
    onChiudi();
  };

  const coloreAccento = tipo === 'entrata' ? '#16A34A' : '#DC2626';

  return (
    <Modal visible={visibile} animationType="slide" presentationStyle="pageSheet">
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
            <Ionicons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={stili.corpo} keyboardShouldPersistTaps="handled">

          {/* ── Importo (grande e centrato) ── */}
          <View style={stili.areaImporto}>
            <Text style={stili.labelImporto}>IMPORTO</Text>
            <View style={stili.rigaImporto}>
              <Text style={[stili.simboloEuro, { color: importo ? coloreAccento : '#CBD5E1' }]}>€</Text>
              <TextInput
                style={[stili.inputImporto, { color: coloreAccento }]}
                value={importo}
                onChangeText={setImporto}
                placeholder="0,00"
                placeholderTextColor="#CBD5E1"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            <View style={[stili.lineaImporto, { backgroundColor: coloreAccento }]} />
          </View>

          {/* ── Tipo ── */}
          <Text style={stili.etichetta}>Tipo</Text>
          <View style={stili.toggleRiga}>
            {(['uscita', 'entrata'] as TipoTransazione[]).map((t) => {
              const attivo = tipo === t;
              const c = t === 'entrata' ? '#16A34A' : '#DC2626';
              return (
                <TouchableOpacity
                  key={t}
                  style={[stili.btnToggle, attivo && { backgroundColor: c, borderColor: c }]}
                  onPress={() => setTipo(t)}
                >
                  <Ionicons
                    name={t === 'entrata' ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={18}
                    color={attivo ? '#FFF' : '#94A3B8'}
                  />
                  <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                    {t === 'entrata' ? 'Entrata' : 'Uscita'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Categoria ── */}
          <Text style={stili.etichetta}>Categoria</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
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
                  <View style={[stili.puntoCat, { backgroundColor: cat.colore }]} />
                  <Text style={[stili.testoCat, selezionata && { color: cat.colore, fontWeight: '700' }]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
                  style={[stili.btnToggle, attivo && stili.btnToggleAttivo]}
                  onPress={() => setTipologia(tipologia === tp ? undefined : tp)}
                >
                  <Ionicons
                    name={ICONE_TIPOLOGIA[tp]}
                    size={18}
                    color={attivo ? '#FFF' : '#94A3B8'}
                  />
                  <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                    {ETICHETTE_TIPOLOGIA[tp]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Istituto bancario ── */}
          {istituti.length > 0 && (
            <>
              <Text style={stili.etichetta}>Istituto (opzionale)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
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
              </ScrollView>
            </>
          )}

          {/* ── Nota ── */}
          <Text style={stili.etichetta}>Nota (facoltativa)</Text>
          <TextInput
            style={[stili.input, stili.inputNota]}
            value={nota}
            onChangeText={setNota}
            placeholder="Es. pranzo di lavoro..."
            placeholderTextColor="#CBD5E1"
            multiline
          />

          {/* ── Ricorrente ── */}
          {!forzaRicorrente && (
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
                  color={ricorrente ? '#FFF' : '#94A3B8'}
                />
                <Text style={[stili.testoToggle, ricorrente && { color: '#FFF' }]}>
                  {ricorrente ? 'Sì — appare in Pianificazione' : 'No — transazione singola'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Fine ricorrenza (visibile solo se ricorrente) ── */}
          {(ricorrente || forzaRicorrente) && (
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
        >
          <Text style={stili.testoSalva}>
            {transazioneEsistente
              ? 'Salva modifiche'
              : `Aggiungi ${tipo === 'entrata' ? 'entrata' : 'uscita'}`}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </Modal>
  );
}

const stili = StyleSheet.create({
  sfondo: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  titolo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnChiudi: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  corpo: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ── Area importo ──
  areaImporto: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labelImporto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
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
    opacity: 0.7,
  },

  // ── Etichette sezione ──
  etichetta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 22,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Toggle tipo e tipologia ──
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  btnToggleAttivo: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  testoToggle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // ── Chip categoria ──
  chipCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    marginRight: 8,
    marginBottom: 4,
  },
  puntoCat: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  testoCat: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Input standard ──
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#0F172A',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    marginRight: 8,
    marginBottom: 4,
  },
  chipIstitutoAttivo: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  testoChipIstituto: {
    fontSize: 13,
    color: '#64748B',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  btnRicorrenteAttivo: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },

  // ── Pulsante salva ──
  btnSalva: {
    margin: 20,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
