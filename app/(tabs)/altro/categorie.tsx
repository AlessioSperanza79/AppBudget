// ── Sotto-schermata "Categorie": CRUD categorie con budget mensile ──
import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { Categoria, TipoCategoria } from '../../../types';
import PressableScale from '../../../components/PressableScale';
import BottomSheet from '../../../components/BottomSheet';
import ConfermaDialog from '../../../components/ConfermaDialog';
import { useTema, Tema } from '../../../constants/tema';
import { PALETTE_CATEGORIE } from '../../../constants/paletteCategorie';
import { formatEuro } from '../../../utils/formatters';
import { iconaCategoria } from '../../../utils/iconeCategorie';

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

const PALETTE: string[] = PALETTE_CATEGORIE;

const TIPI: Array<{ key: TipoCategoria; label: string; colore: string }> = [
  { key: 'fissa',        label: 'Fissa',        colore: '#2563EB' },
  { key: 'variabile',    label: 'Variabile',    colore: '#F97316' },
  { key: 'investimento', label: 'Investimento', colore: '#7C3AED' },
];

export default function CategorieScreen() {
  const {
    categorie, transazioni, aggiungiCategoria, rinominaCategoria, eliminaCategoria, aggiornaTipoCategoria,
  } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [modaleCategoria, setModaleCategoria]         = useState(false);
  const [nomeCategoria, setNomeCategoria]             = useState('');
  const [coloreSelezionato, setColoreSelezionato]     = useState(PALETTE[0]);
  const [tipoSelezionato, setTipoSelezionato]         = useState<TipoCategoria>('variabile');
  const [categoriaInModifica, setCategoriaInModifica] = useState<Categoria | undefined>();

  const [catDaEliminare, setCatDaEliminare]           = useState<Categoria | undefined>();

  // Spesa del mese corrente per categoria, usata per la barra di avanzamento del budget
  const speseMeseCorrente = useMemo(() => {
    const ora = new Date();
    const mappa = new Map<string, number>();
    for (const tr of transazioni) {
      if (tr.tipo !== 'uscita' || tr.ricorrente) continue;
      const d = new Date(tr.data + 'T00:00:00');
      if (d.getFullYear() !== ora.getFullYear() || d.getMonth() !== ora.getMonth()) continue;
      mappa.set(tr.categoriaId, (mappa.get(tr.categoriaId) ?? 0) + tr.importo);
    }
    return mappa;
  }, [transazioni]);

  // Percentuale di giorni trascorsi nel mese corrente, per confrontare il passo di spesa
  // con il passo atteso (es. "sei al 60% del budget ma è già passato l'80% del mese")
  const percGiorniMese = useMemo(() => {
    const ora = new Date();
    const giorniTotali = new Date(ora.getFullYear(), ora.getMonth() + 1, 0).getDate();
    return (ora.getDate() / giorniTotali) * 100;
  }, []);

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

  return (
    <View style={stili.contenitore}>
      <FlatList
        style={stili.lista}
        data={categorie}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const tipo = TIPI.find((tp) => tp.key === item.tipo) ?? TIPI[1];
          const spesa = speseMeseCorrente.get(item.id) ?? 0;
          const budget = item.budgetMensile;
          const perc = budget ? Math.min((spesa / budget) * 100, 100) : 0;
          const coloreBarra = perc >= 100 ? t.uscita : perc >= 80 ? t.arancio : t.entrata;
          return (
            <View style={stili.riga}>
              <View style={stili.rigaPrincipale}>
                <View style={[stili.avatarCategoria, { backgroundColor: item.colore }]}>
                  <Ionicons name={iconaCategoria(item.nome)} size={17} color="#FFFFFF" />
                </View>
                <Text style={stili.nome}>{item.nome}</Text>
                <View style={[stili.badgeTipo, { backgroundColor: tipo.colore + '18' }]}>
                  <Text style={[stili.testoBadgeTipo, { color: tipo.colore }]}>{tipo.label}</Text>
                </View>
                <PressableScale onPress={() => apriModificaCategoria(item)} style={stili.btn} hitSlop={8} {...suggerimento('Modifica categoria')}>
                  <Ionicons name="pencil-outline" size={18} color={t.primario} />
                </PressableScale>
                <PressableScale onPress={() => setCatDaEliminare(item)} style={stili.btn} hitSlop={8} {...suggerimento('Elimina categoria')}>
                  <Ionicons name="trash-outline" size={18} color={t.uscita} />
                </PressableScale>
              </View>

              {budget != null && budget > 0 && (
                <View style={stili.budgetContenitore}>
                  <View style={stili.budgetRigaTesto}>
                    <Text style={[stili.budgetTesto, { color: coloreBarra }]}>
                      {formatEuro(spesa)} di {formatEuro(budget)}
                    </Text>
                    {perc >= 100 && (
                      <View style={stili.budgetAvviso}>
                        <Ionicons name="alert-circle" size={12} color={t.uscita} />
                        <Text style={[stili.budgetTestoAvviso, { color: t.uscita }]}>Budget superato</Text>
                      </View>
                    )}
                  </View>
                  <View style={stili.budgetBarraSfondo}>
                    <View style={[stili.budgetBarra, { width: `${perc}%` as `${number}%`, backgroundColor: coloreBarra }]} />
                    <View style={[stili.budgetMarker, { left: `${percGiorniMese}%` as `${number}%` }]} />
                  </View>
                  {perc >= percGiorniMese + 15 && (
                    <Text style={stili.budgetHintPasso}>Stai spendendo più veloce del previsto</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <PressableScale style={stili.btnAggiungi} onPress={apriNuovaCategoria}>
            <Ionicons name="add-circle-outline" size={20} color={t.primario} />
            <Text style={stili.testoAggiungi}>Aggiungi categoria</Text>
          </PressableScale>
        }
      />

      {/* ── Modal Categoria ── */}
      <BottomSheet visibile={modaleCategoria} onChiudi={() => setModaleCategoria(false)} altezza="92%">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={stili.corpoModal} keyboardShouldPersistTaps="handled">
            <Text style={stili.titoloModal}>
              {categoriaInModifica ? 'Modifica categoria' : 'Nuova categoria'}
            </Text>

            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nomeCategoria}
              onChangeText={setNomeCategoria}
              placeholder="Es. Viaggi"
              placeholderTextColor={t.segnaposto}
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
            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ── Modal conferma elimina categoria ── */}
      {(() => {
        const inUso  = !!catDaEliminare && transazioni.some((tr) => tr.categoriaId === catDaEliminare.id);
        const nTrans = catDaEliminare ? transazioni.filter((tr) => tr.categoriaId === catDaEliminare.id).length : 0;
        return (
          <ConfermaDialog
            visibile={!!catDaEliminare}
            onChiudi={() => setCatDaEliminare(undefined)}
            titolo="Elimina categoria"
            messaggio={
              inUso ? (
                <>
                  <Text style={{ fontWeight: '700' }}>{catDaEliminare?.nome}</Text>
                  {` è collegata a ${nTrans} transazion${nTrans === 1 ? 'e' : 'i'} e non può essere eliminata.\n\nRimuovi prima le transazioni collegate.`}
                </>
              ) : (
                <>
                  {'Vuoi eliminare '}
                  <Text style={{ fontWeight: '700' }}>{catDaEliminare?.nome}</Text>
                  {'? Questa azione non può essere annullata.'}
                </>
              )
            }
            onConferma={inUso ? undefined : () => {
              if (catDaEliminare) eliminaCategoria(catDaEliminare.id);
              setCatDaEliminare(undefined);
            }}
          />
        );
      })()}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
    lista: {
      flex: 1,
    },

    // ── Lista ──
    riga: {
      backgroundColor: t.carta,
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    rigaPrincipale: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    // ── Barra budget ──
    budgetContenitore: {
      marginTop: 10,
      gap: 6,
    },
    budgetRigaTesto: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    budgetTesto: {
      fontSize: 12,
      fontWeight: '600',
    },
    budgetAvviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    budgetTestoAvviso: {
      fontSize: 11,
      fontWeight: '700',
    },
    budgetBarraSfondo: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.bordoSottile,
      overflow: 'visible',
    },
    budgetBarra: {
      height: 6,
      borderRadius: 3,
    },
    // Marker verticale che indica quanti giorni del mese sono già trascorsi, per confrontare
    // il passo di spesa reale con quello atteso
    budgetMarker: {
      position: 'absolute',
      top: -2,
      width: 2,
      height: 10,
      borderRadius: 1,
      backgroundColor: t.titolo,
      opacity: 0.4,
    },
    budgetHintPasso: {
      fontSize: 11,
      color: t.arancio,
      fontWeight: '600',
      marginTop: 4,
    },
    avatarCategoria: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    nome: {
      flex: 1,
      fontSize: 15,
      color: t.titolo,
      fontWeight: '500',
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
      marginTop: 4,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.primario,
      backgroundColor: t.primarioSfondo,
    },
    testoAggiungi: {
      color: t.primario,
      fontSize: 15,
      fontWeight: '600',
    },

    // ── Modal ──
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 4,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    etichetta: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 12,
      padding: 13,
      fontSize: 15,
      color: t.titolo,
      backgroundColor: t.sfondoInput,
    },

    // ── Tipo selector ──
    selectorTipo: {
      flexDirection: 'row',
      gap: 8,
    },
    btnTipo: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.bordo,
      alignItems: 'center',
      backgroundColor: t.sfondoInput,
    },
    testoTipo: {
      fontSize: 12,
      color: t.sottile,
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
      borderColor: t.titolo,
    },

    // ── Bottoni modal ──
    rigaBottoni: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
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
