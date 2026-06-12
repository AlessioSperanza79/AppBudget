// ── Vista "Obiettivi" della schermata Pianifica: salvadanai virtuali con barra di avanzamento ──
import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Obiettivo } from '../../types';
import { useTema, Tema } from '../../constants/tema';
import { formatEuro, formatData } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';
import PressableScale from '../../components/PressableScale';
import SelectorData from '../../components/SelectorData';

const PALETTE: string[] = [
  '#2563EB', '#15803D', '#F57F17', '#7C3AED',
  '#E53935', '#00838F', '#AD1457', '#6A1B9A',
];

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

const dataScadenzaDefault = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function ObiettiviVista() {
  const { obiettivi, aggiungiObiettivo, modificaObiettivo, eliminaObiettivo } = useFinanceStore();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [modaleObiettivo, setModaleObiettivo]   = useState(false);
  const [obiettivoInModifica, setObiettivoInModifica] = useState<Obiettivo | undefined>();
  const [nome, setNome]                         = useState('');
  const [importoObiettivo, setImportoObiettivo] = useState('');
  const [importoAttuale, setImportoAttuale]     = useState('');
  const [colore, setColore]                     = useState(PALETTE[0]);
  const [conScadenza, setConScadenza]           = useState(false);
  const [dataScadenza, setDataScadenza]         = useState(dataScadenzaDefault());

  const [modaleFondi, setModaleFondi]           = useState(false);
  const [obiettivoFondi, setObiettivoFondi]     = useState<Obiettivo | undefined>();
  const [importoFondi, setImportoFondi]         = useState('');

  const [obDaEliminare, setObDaEliminare]       = useState<Obiettivo | undefined>();

  const apriNuovoObiettivo = () => {
    setObiettivoInModifica(undefined);
    setNome('');
    setImportoObiettivo('');
    setImportoAttuale('');
    setColore(PALETTE[0]);
    setConScadenza(false);
    setDataScadenza(dataScadenzaDefault());
    setModaleObiettivo(true);
  };

  const apriModificaObiettivo = (ob: Obiettivo) => {
    setObiettivoInModifica(ob);
    setNome(ob.nome);
    setImportoObiettivo(String(ob.importoObiettivo));
    setImportoAttuale(String(ob.importoAttuale));
    setColore(ob.colore);
    setConScadenza(!!ob.dataScadenza);
    setDataScadenza(ob.dataScadenza ?? dataScadenzaDefault());
    setModaleObiettivo(true);
  };

  const salvaObiettivo = () => {
    const nomeTrim = nome.trim();
    const target = parseFloat(importoObiettivo.replace(',', '.'));
    const attuale = parseFloat(importoAttuale.replace(',', '.')) || 0;
    if (!nomeTrim || isNaN(target) || target <= 0) return;

    const dati = {
      nome: nomeTrim,
      importoObiettivo: target,
      importoAttuale: attuale,
      colore,
      dataScadenza: conScadenza ? dataScadenza : undefined,
    };

    if (obiettivoInModifica) {
      modificaObiettivo(obiettivoInModifica.id, dati);
    } else {
      aggiungiObiettivo(dati);
    }
    setModaleObiettivo(false);
  };

  const apriFondi = (ob: Obiettivo) => {
    setObiettivoFondi(ob);
    setImportoFondi('');
    setModaleFondi(true);
  };

  const applicaFondi = (segno: 1 | -1) => {
    if (!obiettivoFondi) return;
    const valore = parseFloat(importoFondi.replace(',', '.'));
    if (isNaN(valore) || valore <= 0) return;
    const nuovoImporto = Math.max(0, obiettivoFondi.importoAttuale + segno * valore);
    modificaObiettivo(obiettivoFondi.id, { importoAttuale: nuovoImporto });
    setModaleFondi(false);
  };

  return (
    <View style={stili.contenitore}>
      <FlatList
        data={obiettivi}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            icona="flag-outline"
            messaggio={'Nessun obiettivo di risparmio.\nCreane uno per iniziare ad accantonare.'}
          />
        }
        renderItem={({ item }) => {
          const perc = Math.min((item.importoAttuale / item.importoObiettivo) * 100, 100);
          const completato = item.importoAttuale >= item.importoObiettivo;
          return (
            <View style={stili.riga}>
              <View style={stili.rigaPrincipale}>
                <View style={[stili.avatarObiettivo, { backgroundColor: item.colore }]}>
                  <Ionicons name={completato ? 'checkmark' : 'flag'} size={16} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={stili.nome}>{item.nome}</Text>
                  {item.dataScadenza && (
                    <Text style={stili.scadenza}>Scadenza: {formatData(item.dataScadenza)}</Text>
                  )}
                </View>
                <PressableScale onPress={() => apriModificaObiettivo(item)} style={stili.btn} hitSlop={8} {...suggerimento('Modifica obiettivo')}>
                  <Ionicons name="pencil-outline" size={18} color={t.primario} />
                </PressableScale>
                <PressableScale onPress={() => setObDaEliminare(item)} style={stili.btn} hitSlop={8} {...suggerimento('Elimina obiettivo')}>
                  <Ionicons name="trash-outline" size={18} color={t.uscita} />
                </PressableScale>
              </View>

              <View style={stili.progressoContenitore}>
                <View style={stili.progressoRigaTesto}>
                  <Text style={[stili.progressoTesto, { color: item.colore }]}>
                    {formatEuro(item.importoAttuale)} di {formatEuro(item.importoObiettivo)}
                  </Text>
                  <Text style={stili.progressoPerc}>{Math.round(perc)}%</Text>
                </View>
                <View style={stili.progressoBarraSfondo}>
                  <View style={[stili.progressoBarra, { width: `${perc}%` as `${number}%`, backgroundColor: item.colore }]} />
                </View>
              </View>

              <PressableScale style={stili.btnFondi} onPress={() => apriFondi(item)}>
                <Ionicons name="cash-outline" size={16} color={t.primario} />
                <Text style={stili.testoBtnFondi}>Gestisci fondi</Text>
              </PressableScale>
            </View>
          );
        }}
        ListFooterComponent={
          <PressableScale style={stili.btnAggiungi} onPress={apriNuovoObiettivo}>
            <Ionicons name="add-circle-outline" size={20} color={t.primario} />
            <Text style={stili.testoAggiungi}>Aggiungi obiettivo</Text>
          </PressableScale>
        }
      />

      {/* ── Modal Obiettivo ── */}
      <Modal visible={modaleObiettivo} animationType="fade" transparent>
        <View style={stili.sfondoModal}>
          <View style={stili.cardModal}>
            <Text style={stili.titoloModal}>
              {obiettivoInModifica ? 'Modifica obiettivo' : 'Nuovo obiettivo'}
            </Text>

            <Text style={stili.etichetta}>Nome</Text>
            <TextInput
              style={stili.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Es. Vacanza estiva"
              placeholderTextColor={t.segnaposto}
              autoFocus
              returnKeyType="done"
            />

            <Text style={stili.etichetta}>Importo obiettivo (€)</Text>
            <TextInput
              style={stili.input}
              value={importoObiettivo}
              onChangeText={setImportoObiettivo}
              placeholder="Es. 1000"
              placeholderTextColor={t.segnaposto}
              keyboardType="decimal-pad"
            />

            <Text style={stili.etichetta}>Importo già accantonato (€)</Text>
            <TextInput
              style={stili.input}
              value={importoAttuale}
              onChangeText={setImportoAttuale}
              placeholder="Es. 0"
              placeholderTextColor={t.segnaposto}
              keyboardType="decimal-pad"
            />

            <Text style={stili.etichetta}>Colore</Text>
            <View style={stili.griglia}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColore(c)}
                  style={[stili.campione, { backgroundColor: c }, colore === c && stili.campioneAttivo]}
                />
              ))}
            </View>

            <Text style={stili.etichetta}>Scadenza</Text>
            <TouchableOpacity
              style={[stili.btnScadenza, conScadenza && stili.btnScadenzaAttivo]}
              onPress={() => setConScadenza((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={conScadenza ? 'calendar' : 'calendar-outline'}
                size={18}
                color={conScadenza ? '#FFF' : t.piuSottile}
              />
              <Text style={[stili.testoBtnScadenza, conScadenza && { color: '#FFF' }]}>
                {conScadenza ? 'Sì — con data limite' : 'No — senza scadenza'}
              </Text>
            </TouchableOpacity>

            {conScadenza && (
              <View style={{ marginTop: 10 }}>
                <SelectorData valore={dataScadenza} onChange={setDataScadenza} />
              </View>
            )}

            <View style={stili.rigaBottoni}>
              <TouchableOpacity style={stili.btnAnnulla} onPress={() => setModaleObiettivo(false)}>
                <Text style={stili.testoAnnulla}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stili.btnConferma} onPress={salvaObiettivo}>
                <Text style={stili.testoConferma}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Gestisci fondi ── */}
      {obiettivoFondi && (
        <Modal visible={modaleFondi} animationType="fade" transparent>
          <View style={stili.sfondoModal}>
            <View style={stili.cardModal}>
              <Text style={stili.titoloModal}>{obiettivoFondi.nome}</Text>
              <Text style={stili.testoModal}>
                Accantonato: <Text style={{ fontWeight: '700' }}>{formatEuro(obiettivoFondi.importoAttuale)}</Text>
                {' '}di {formatEuro(obiettivoFondi.importoObiettivo)}
              </Text>

              <Text style={stili.etichetta}>Importo (€)</Text>
              <TextInput
                style={stili.input}
                value={importoFondi}
                onChangeText={setImportoFondi}
                placeholder="Es. 50"
                placeholderTextColor={t.segnaposto}
                keyboardType="decimal-pad"
                autoFocus
              />

              <View style={stili.rigaBottoni}>
                <TouchableOpacity
                  style={[stili.btnAnnulla, { borderColor: t.uscita }]}
                  onPress={() => applicaFondi(-1)}
                >
                  <Text style={[stili.testoAnnulla, { color: t.uscita }]}>− Preleva</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[stili.btnConferma, { backgroundColor: t.entrata }]}
                  onPress={() => applicaFondi(1)}
                >
                  <Text style={stili.testoConferma}>+ Versa</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setModaleFondi(false)}>
                <Text style={stili.testoAnnulla}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Modal conferma elimina ── */}
      {obDaEliminare && (
        <Modal visible animationType="fade" transparent>
          <View style={stili.sfondoModal}>
            <View style={stili.cardModal}>
              <View style={stili.rigaIconaElimina}>
                <View style={stili.cerchioElimina}>
                  <Ionicons name="trash-outline" size={22} color={t.uscita} />
                </View>
                <Text style={stili.titoloModal}>Elimina obiettivo</Text>
              </View>
              <Text style={stili.testoModal}>
                {'Vuoi eliminare '}
                <Text style={{ fontWeight: '700' }}>{obDaEliminare.nome}</Text>
                {'? Questa azione non può essere annullata.'}
              </Text>
              <View style={stili.rigaBottoni}>
                <TouchableOpacity style={stili.btnAnnulla} onPress={() => setObDaEliminare(undefined)}>
                  <Text style={stili.testoAnnulla}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[stili.btnConferma, { backgroundColor: t.uscita }]}
                  onPress={() => { eliminaObiettivo(obDaEliminare.id); setObDaEliminare(undefined); }}
                >
                  <Text style={stili.testoConferma}>Elimina</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
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
    avatarObiettivo: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    nome: {
      fontSize: 15,
      color: t.titolo,
      fontWeight: '500',
    },
    scadenza: {
      fontSize: 11,
      color: t.piuSottile,
      marginTop: 2,
    },
    btn: {
      padding: 4,
    },

    // ── Barra progresso ──
    progressoContenitore: {
      marginTop: 12,
      gap: 6,
    },
    progressoRigaTesto: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    progressoTesto: {
      fontSize: 12,
      fontWeight: '600',
    },
    progressoPerc: {
      fontSize: 12,
      fontWeight: '700',
      color: t.piuSottile,
    },
    progressoBarraSfondo: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.bordoSottile,
      overflow: 'hidden',
    },
    progressoBarra: {
      height: 6,
      borderRadius: 3,
    },

    // ── Gestisci fondi ──
    btnFondi: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: t.primarioSfondo,
    },
    testoBtnFondi: {
      fontSize: 13,
      fontWeight: '600',
      color: t.primario,
    },

    // ── Bottone aggiungi ──
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
    sfondoModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    cardModal: {
      backgroundColor: t.carta,
      borderRadius: 24,
      padding: 24,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
      marginBottom: 4,
    },
    testoModal: {
      fontSize: 14,
      color: t.sottile,
      lineHeight: 21,
      marginTop: 4,
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

    // ── Scadenza toggle ──
    btnScadenza: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.sfondoInput,
    },
    btnScadenzaAttivo: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoBtnScadenza: {
      fontSize: 14,
      fontWeight: '600',
      color: t.piuSottile,
    },

    // ── Conferma elimina ──
    rigaIconaElimina: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    cerchioElimina: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.uscitaSfondo,
      alignItems: 'center',
      justifyContent: 'center',
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
