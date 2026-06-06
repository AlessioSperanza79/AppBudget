// ── Schermata Categorie + Conti: CRUD per categorie e istituti bancari ──
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Categoria, Istituto, TipoCategoria } from '../../types';

const PALETTE: string[] = [
  '#2E7D32', '#66BB6A', '#E53935', '#2563EB',
  '#F57F17', '#6A1B9A', '#00838F', '#AD1457',
  '#BF360C', '#78909C', '#FF7043', '#0288D1',
];

const TIPI: Array<{ key: TipoCategoria; label: string; colore: string }> = [
  { key: 'fissa',        label: 'Fissa',        colore: '#2563EB' },
  { key: 'variabile',    label: 'Variabile',    colore: '#F97316' },
  { key: 'investimento', label: 'Investimento', colore: '#7C3AED' },
];

type Sezione = 'categorie' | 'conti';

export default function CategorieScreen() {
  const {
    categorie, transazioni, aggiungiCategoria, rinominaCategoria, eliminaCategoria, aggiornaTipoCategoria,
    istituti, aggiungiIstituto, rinominaIstituto, eliminaIstituto,
  } = useFinanceStore();

  const [sezione, setSezione] = useState<Sezione>('categorie');

  // ── Stato modale categorie ──
  const [modaleCategoria, setModaleCategoria]         = useState(false);
  const [nomeCategoria, setNomeCategoria]             = useState('');
  const [coloreSelezionato, setColoreSelezionato]     = useState(PALETTE[0]);
  const [tipoSelezionato, setTipoSelezionato]         = useState<TipoCategoria>('variabile');
  const [categoriaInModifica, setCategoriaInModifica] = useState<Categoria | undefined>();

  // ── Stato modale istituti ──
  const [modaleIstituto, setModaleIstituto]           = useState(false);
  const [nomeIstituto, setNomeIstituto]               = useState('');
  const [istitutoInModifica, setIstitutoInModifica]   = useState<Istituto | undefined>();

  // ── Stato modale conferma eliminazione ──
  const [catDaEliminare, setCatDaEliminare]           = useState<Categoria | undefined>();
  const [istDaEliminare, setIstDaEliminare]           = useState<Istituto | undefined>();

  // ── Gestori categorie ──
  const apriNuovaCategoria = () => {
    setCategoriaInModifica(undefined);
    setNomeCategoria('');
    setColoreSelezionato(PALETTE[0]);
    setTipoSelezionato('variabile');
    setModaleCategoria(true);
  };

  const apriModificaCategoria = (cat: Categoria) => {
    setCategoriaInModifica(cat);
    setNomeCategoria(cat.nome);
    setColoreSelezionato(cat.colore);
    setTipoSelezionato(cat.tipo);
    setModaleCategoria(true);
  };

  const salvaCategoria = () => {
    const nome = nomeCategoria.trim();
    if (!nome) return;
    if (categoriaInModifica) {
      rinominaCategoria(categoriaInModifica.id, nome);
      if (tipoSelezionato !== categoriaInModifica.tipo) {
        aggiornaTipoCategoria(categoriaInModifica.id, tipoSelezionato);
      }
    } else {
      aggiungiCategoria(nome, coloreSelezionato, tipoSelezionato);
    }
    setModaleCategoria(false);
  };

  const confermaEliminaCategoria = (cat: Categoria) => {
    setCatDaEliminare(cat);
  };

  // ── Gestori istituti ──
  const apriNuovoIstituto = () => {
    setIstitutoInModifica(undefined);
    setNomeIstituto('');
    setModaleIstituto(true);
  };

  const apriModificaIstituto = (ist: Istituto) => {
    setIstitutoInModifica(ist);
    setNomeIstituto(ist.nome);
    setModaleIstituto(true);
  };

  const salvaIstituto = () => {
    const nome = nomeIstituto.trim();
    if (!nome) return;
    if (istitutoInModifica) {
      rinominaIstituto(istitutoInModifica.id, nome);
    } else {
      aggiungiIstituto(nome);
    }
    setModaleIstituto(false);
  };

  const confermaEliminaIstituto = (ist: Istituto) => {
    setIstDaEliminare(ist);
  };

  return (
    <View style={stili.contenitore}>

      {/* ── Toggle Categorie / Conti ── */}
      <View style={stili.toggleContenitore}>
        {(['categorie', 'conti'] as Sezione[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[stili.tab, sezione === s && stili.tabAttivo]}
            onPress={() => setSezione(s)}
          >
            <Text style={[stili.testoTab, sezione === s && stili.testoTabAttivo]}>
              {s === 'categorie' ? 'Categorie' : 'Conti & Istituti'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Lista Categorie ── */}
      {sezione === 'categorie' && (
        <FlatList
          data={categorie}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const tipo = TIPI.find((t) => t.key === item.tipo) ?? TIPI[1];
            return (
              <View style={stili.riga}>
                <View style={[stili.punto, { backgroundColor: item.colore }]} />
                <Text style={stili.nome}>{item.nome}</Text>
                <View style={[stili.badgeTipo, { backgroundColor: tipo.colore + '18' }]}>
                  <Text style={[stili.testoBadgeTipo, { color: tipo.colore }]}>{tipo.label}</Text>
                </View>
                <TouchableOpacity onPress={() => apriModificaCategoria(item)} style={stili.btn} hitSlop={8}>
                  <Ionicons name="pencil-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confermaEliminaCategoria(item)} style={stili.btn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#C62828" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity style={stili.btnAggiungi} onPress={apriNuovaCategoria}>
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text style={stili.testoAggiungi}>Aggiungi categoria</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* ── Lista Istituti ── */}
      {sezione === 'conti' && (
        <FlatList
          data={istituti}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={stili.riga}>
              <Ionicons name="business-outline" size={18} color="#555" />
              <Text style={stili.nome}>{item.nome}</Text>
              <TouchableOpacity onPress={() => apriModificaIstituto(item)} style={stili.btn} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confermaEliminaIstituto(item)} style={stili.btn} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#C62828" />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity style={stili.btnAggiungi} onPress={apriNuovoIstituto}>
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text style={stili.testoAggiungi}>Aggiungi istituto</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* ── Modal Categoria ── */}
      <Modal visible={modaleCategoria} animationType="fade" transparent>
        <View style={stili.sfondoModal}>
          <View style={stili.cardModal}>
            <Text style={stili.titoloModal}>
              {categoriaInModifica ? 'Modifica categoria' : 'Nuova categoria'}
            </Text>

            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nomeCategoria}
              onChangeText={setNomeCategoria}
              placeholder="Es. Viaggi"
              autoFocus
              returnKeyType="done"
            />

            <Text style={stili.etichetta}>Tipo</Text>
            <View style={stili.selectorTipo}>
              {TIPI.map(({ key, label, colore }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    stili.btnTipo,
                    tipoSelezionato === key && { backgroundColor: colore + '18', borderColor: colore },
                  ]}
                  onPress={() => setTipoSelezionato(key)}
                >
                  <Text style={[
                    stili.testoTipo,
                    tipoSelezionato === key && { color: colore, fontWeight: '700' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!categoriaInModifica && (
              <>
                <Text style={stili.etichetta}>Colore</Text>
                <View style={stili.griglia}>
                  {PALETTE.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColoreSelezionato(c)}
                      style={[stili.campione, { backgroundColor: c }, coloreSelezionato === c && stili.campioneAttivo]}
                    />
                  ))}
                </View>
              </>
            )}

            <View style={stili.rigaBottoni}>
              <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleCategoria(false)}>
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnConferma} onPress={salvaCategoria}>
                <Text style={stili.testoConferma}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Istituto ── */}
      <Modal visible={modaleIstituto} animationType="fade" transparent>
        <View style={stili.sfondoModal}>
          <View style={stili.cardModal}>
            <Text style={stili.titoloModal}>
              {istitutoInModifica ? 'Rinomina istituto' : 'Nuovo istituto'}
            </Text>
            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nomeIstituto}
              onChangeText={setNomeIstituto}
              placeholder="Es. Banca Sella"
              autoFocus
              returnKeyType="done"
            />
            <View style={stili.rigaBottoni}>
              <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleIstituto(false)}>
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnConferma} onPress={salvaIstituto}>
                <Text style={stili.testoConferma}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal conferma elimina categoria ── */}
      {catDaEliminare && (() => {
        const inUso = transazioni.some((t) => t.categoriaId === catDaEliminare.id);
        const nTrans = transazioni.filter((t) => t.categoriaId === catDaEliminare.id).length;
        return (
          <Modal visible animationType="fade" transparent>
            <View style={stili.sfondoModal}>
              <View style={stili.cardModal}>
                <View style={stili.rigaIconaElimina}>
                  <View style={stili.cerchioElimina}>
                    <Ionicons name="trash-outline" size={22} color="#C62828" />
                  </View>
                  <Text style={stili.titoloModal}>Elimina categoria</Text>
                </View>
                {inUso ? (
                  <Text style={stili.testoModal}>
                    <Text style={{ fontWeight: '700' }}>{catDaEliminare.nome}</Text>
                    {` è collegata a ${nTrans} transazion${nTrans === 1 ? 'e' : 'i'} e non può essere eliminata.\n\nRimuovi prima le transazioni collegate.`}
                  </Text>
                ) : (
                  <Text style={stili.testoModal}>
                    {'Vuoi eliminare '}
                    <Text style={{ fontWeight: '700' }}>{catDaEliminare.nome}</Text>
                    {'? Questa azione non può essere annullata.'}
                  </Text>
                )}
                <View style={stili.rigaBottoni}>
                  <TouchableOpacity style={stili.btnAnnulla} onPress={() => setCatDaEliminare(undefined)}>
                    <Text style={stili.testoAnnulla}>{inUso ? 'Chiudi' : 'Annulla'}</Text>
                  </TouchableOpacity>
                  {!inUso && (
                    <TouchableOpacity
                      style={[stili.btnConferma, { backgroundColor: '#C62828' }]}
                      onPress={() => { eliminaCategoria(catDaEliminare.id); setCatDaEliminare(undefined); }}
                    >
                      <Text style={stili.testoConferma}>Elimina</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ── Modal conferma elimina istituto ── */}
      {istDaEliminare && (() => {
        const inUso = transazioni.some((t) => t.istitutoId === istDaEliminare.id);
        const nTrans = transazioni.filter((t) => t.istitutoId === istDaEliminare.id).length;
        return (
          <Modal visible animationType="fade" transparent>
            <View style={stili.sfondoModal}>
              <View style={stili.cardModal}>
                <View style={stili.rigaIconaElimina}>
                  <View style={stili.cerchioElimina}>
                    <Ionicons name="trash-outline" size={22} color="#C62828" />
                  </View>
                  <Text style={stili.titoloModal}>Elimina conto</Text>
                </View>
                {inUso ? (
                  <Text style={stili.testoModal}>
                    <Text style={{ fontWeight: '700' }}>{istDaEliminare.nome}</Text>
                    {` è collegato a ${nTrans} transazion${nTrans === 1 ? 'e' : 'i'} e non può essere eliminato.\n\nRimuovi prima le transazioni collegate.`}
                  </Text>
                ) : (
                  <Text style={stili.testoModal}>
                    {'Vuoi eliminare '}
                    <Text style={{ fontWeight: '700' }}>{istDaEliminare.nome}</Text>
                    {'? Questa azione non può essere annullata.'}
                  </Text>
                )}
                <View style={stili.rigaBottoni}>
                  <TouchableOpacity style={stili.btnAnnulla} onPress={() => setIstDaEliminare(undefined)}>
                    <Text style={stili.testoAnnulla}>{inUso ? 'Chiudi' : 'Annulla'}</Text>
                  </TouchableOpacity>
                  {!inUso && (
                    <TouchableOpacity
                      style={[stili.btnConferma, { backgroundColor: '#C62828' }]}
                      onPress={() => { eliminaIstituto(istDaEliminare.id); setIstDaEliminare(undefined); }}
                    >
                      <Text style={stili.testoConferma}>Elimina</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}

    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Toggle ──
  toggleContenitore: {
    flexDirection: 'row',
    backgroundColor: '#E0E4EA',
    borderRadius: 12,
    margin: 16,
    marginBottom: 4,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabAttivo: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testoTab: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  testoTabAttivo: {
    color: '#1A1A2E',
    fontWeight: '700',
  },

  // ── Lista ──
  riga: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  punto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    flexShrink: 0,
  },
  nome: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  badgeTipo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testoBadgeTipo: {
    fontSize: 11,
    fontWeight: '600',
  },
  btn: {
    padding: 4,
  },
  btnAggiungi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EEF4FF',
  },
  testoAggiungi: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Modal ──
  sfondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  cardModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  titoloModal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  etichetta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#222',
  },

  // ── Tipo selector ──
  selectorTipo: {
    flexDirection: 'row',
    gap: 8,
  },
  btnTipo: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  testoTipo: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },

  // ── Palette colori ──
  griglia: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  campione: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  campioneAttivo: {
    borderWidth: 3,
    borderColor: '#222',
  },

  // ── Conferma elimina ──
  rigaIconaElimina: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cerchioElimina: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testoModal: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Bottoni modal ──
  rigaBottoni: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnAnnulla: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  testoAnnulla: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },
  btnConferma: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  testoConferma: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
