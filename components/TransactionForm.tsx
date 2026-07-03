import { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
import Text from './TestoBase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Transazione, Categoria, Istituto, TipoTransazione, TipologiaConto } from '../types';
import { oggiIso } from '../utils/formatters';
import SelectorData from './SelectorData';
import BottomSheet from './BottomSheet';
import { useTema, Tema } from '../constants/tema';
import AreaImporto from './transactionForm/AreaImporto';
import SelettoreTipo from './transactionForm/SelettoreTipo';
import SelettoreTrasferimento from './transactionForm/SelettoreTrasferimento';
import SelettoreCategoria from './transactionForm/SelettoreCategoria';
import SelettoreDivisione from './transactionForm/SelettoreDivisione';
import CampoTipologiaIstituto from './transactionForm/CampoTipologiaIstituto';
import CampoFoto from './transactionForm/CampoFoto';
import CampoRicorrente from './transactionForm/CampoRicorrente';
import { creaStiliCampo } from './transactionForm/stiliCampo';

interface Props {
  visibile: boolean;
  onChiudi: () => void;
  onSalva: (dati: Omit<Transazione, 'id'>) => void;
  onSalvaTrasferimento?: (dati: {
    importo: number; data: string; nota?: string; tag?: string;
    istitutoOrigineId: string; istitutoDestinazioneId: string;
  }) => void;
  onSalvaDivisa?: (righe: Omit<Transazione, 'id'>[]) => void;
  onCaricaFoto?: (uri: string) => Promise<string | undefined>;
  transazioneEsistente?: Transazione;
  categorie: Categoria[];
  istituti: Istituto[];
  forzaRicorrente?: boolean;
}

interface RigaDivisione {
  id: string;
  categoriaId: string;
  importo: string;
}

let contatoreRigaDivisione = 0;
const creaRigaDivisioneVuota = (): RigaDivisione => ({ id: `riga-${contatoreRigaDivisione++}`, categoriaId: '', importo: '' });

export default function TransactionForm({
  visibile, onChiudi, onSalva, onSalvaTrasferimento, onSalvaDivisa, onCaricaFoto, transazioneEsistente, categorie, istituti, forzaRicorrente,
}: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);
  const stiliCampo = useMemo(() => creaStiliCampo(t), [t]);

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

  // Modalità divisione: sostituisce la categoria singola con più righe categoria+importo che
  // devono sommare al totale — disponibile solo per nuove transazioni non ricorrenti/trasferimento
  const [divisione, setDivisione]           = useState(false);
  const [righeDivisione, setRigheDivisione] = useState<RigaDivisione[]>([creaRigaDivisioneVuota(), creaRigaDivisioneVuota()]);
  const divisioneDisponibile = !!onSalvaDivisa && !forzaRicorrente && !transazioneEsistente;

  const aggiornaRigaDivisione = (id: string, campo: 'categoriaId' | 'importo', valore: string) => {
    setRigheDivisione((righe) => righe.map((r) => r.id === id ? { ...r, [campo]: valore } : r));
  };
  const aggiungiRigaDivisione = () => setRigheDivisione((righe) => [...righe, creaRigaDivisioneVuota()]);
  const rimuoviRigaDivisione = (id: string) => setRigheDivisione((righe) => righe.length > 2 ? righe.filter((r) => r.id !== id) : righe);

  const totaleRigheDivisione = righeDivisione.reduce((s, r) => s + (parseFloat(r.importo.replace(',', '.')) || 0), 0);
  const residuoDivisione = Math.round((((parseFloat(importo.replace(',', '.')) || 0) - totaleRigheDivisione)) * 100) / 100;
  const righeDivisioneValide = righeDivisione.every((r) => r.categoriaId && (parseFloat(r.importo.replace(',', '.')) || 0) > 0);
  const divisioneValida = righeDivisioneValide && residuoDivisione === 0 && (parseFloat(importo.replace(',', '.')) || 0) > 0;

  // Foto scontrino: fotoUri può essere un URL già caricato (in modifica) o un percorso
  // locale appena scelto/scattato, caricato su Supabase solo al salvataggio
  const [fotoUri, setFotoUri]           = useState<string | undefined>();
  const [caricamentoFoto, setCaricamentoFoto] = useState(false);

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
      setFotoUri(transazioneEsistente?.fotoUrl);
      setDivisione(false);
      setRigheDivisione([creaRigaDivisioneVuota(), creaRigaDivisioneVuota()]);
    }
  }, [visibile, transazioneEsistente]);

  const scegliFoto = async (daFotocamera: boolean) => {
    const permesso = daFotocamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permesso.granted) {
      Alert.alert('Permesso negato', daFotocamera
        ? 'Serve il permesso fotocamera per scattare la foto dello scontrino.'
        : 'Serve il permesso galleria per scegliere la foto dello scontrino.');
      return;
    }
    const risultato = daFotocamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
    if (!risultato.canceled && risultato.assets[0]) {
      setFotoUri(risultato.assets[0].uri);
    }
  };

  const gestisciSalva = async () => {
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

    if (divisione) {
      if (!divisioneValida) {
        Alert.alert('Suddivisione incompleta', 'Ogni riga deve avere una categoria e un importo, e la somma deve corrispondere al totale.');
        return;
      }
      const righe: Omit<Transazione, 'id'>[] = righeDivisione.map((r) => ({
        importo: parseFloat(r.importo.replace(',', '.')),
        tipo, categoriaId: r.categoriaId, data,
        nota: nota.trim() || undefined,
        tag: tag.trim() || undefined,
        tipologia, istitutoId,
      }));
      onSalvaDivisa?.(righe);
      onChiudi();
      return;
    }

    if (!categoriaId) {
      Alert.alert('Categoria mancante', 'Seleziona una categoria.');
      return;
    }

    // Se la foto è un percorso locale (appena scelta/scattata, non ancora un URL) va
    // caricata su Supabase prima di salvare la transazione
    let fotoUrlFinale = fotoUri;
    if (fotoUri && !fotoUri.startsWith('http') && onCaricaFoto) {
      setCaricamentoFoto(true);
      fotoUrlFinale = await onCaricaFoto(fotoUri);
      setCaricamentoFoto(false);
      if (!fotoUrlFinale) {
        Alert.alert('Foto non caricata', 'Non sono riuscito a caricare la foto. Riprova o salva senza foto.');
        return;
      }
    }

    onSalva({
      importo: importoNum, tipo, categoriaId, data,
      nota: nota.trim() || undefined,
      tag: tag.trim() || undefined,
      tipologia,
      istitutoId,
      ricorrente: ricorrente || undefined,
      dataFine: ((ricorrente || forzaRicorrente) && dataFine) ? dataFine : undefined,
      fotoUrl: fotoUrlFinale,
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

          <AreaImporto importo={importo} onChangeText={setImporto} coloreAccento={coloreAccento} />

          <SelettoreTipo
            tipo={tipo}
            trasferimento={trasferimento}
            trasferimentoDisponibile={trasferimentoDisponibile}
            onSelezionaTipo={(tp) => { setTrasferimento(false); setTipo(tp); }}
            onSelezionaTrasferimento={() => setTrasferimento(true)}
          />

          {trasferimento ? (
            <SelettoreTrasferimento
              istituti={istituti}
              istitutoOrigineId={istitutoOrigineId}
              istitutoDestinazioneId={istitutoDestinazioneId}
              onSelezionaOrigine={setIstitutoOrigineId}
              onSelezionaDestinazione={setIstitutoDestinazioneId}
              data={data}
              onChangeData={setData}
            />
          ) : (
            <>
              <SelettoreDivisione
                divisioneDisponibile={divisioneDisponibile}
                divisione={divisione}
                onToggleDivisione={() => { setDivisione((v) => !v); setRicorrente(false); }}
                righeDivisione={righeDivisione}
                categorie={categorie}
                onAggiornaRiga={aggiornaRigaDivisione}
                onAggiungiRiga={aggiungiRigaDivisione}
                onRimuoviRiga={rimuoviRigaDivisione}
                residuoDivisione={residuoDivisione}
              />

              {!divisione && (
                <SelettoreCategoria
                  categorie={categorie}
                  categoriaId={categoriaId}
                  onSeleziona={setCategoriaId}
                />
              )}

              {/* ── Data ── */}
              <Text style={stiliCampo.etichetta}>Data</Text>
              <SelectorData valore={data} onChange={setData} />

              <CampoTipologiaIstituto
                tipologia={tipologia}
                onSelezionaTipologia={setTipologia}
                istituti={istituti}
                istitutoId={istitutoId}
                onSelezionaIstituto={setIstitutoId}
              />
            </>
          )}

          {/* ── Nota ── */}
          <Text style={stiliCampo.etichetta}>Nota (facoltativa)</Text>
          <TextInput
            style={[stiliCampo.input, stili.inputNota]}
            value={nota}
            onChangeText={setNota}
            placeholder="Es. pranzo di lavoro..."
            placeholderTextColor={t.segnaposto}
            multiline
          />

          {/* ── Tag ── */}
          <Text style={stiliCampo.etichetta}>Tag (facoltativo)</Text>
          <TextInput
            style={stiliCampo.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Es. Vacanze, Lavoro..."
            placeholderTextColor={t.segnaposto}
            autoCapitalize="none"
          />

          {!!onCaricaFoto && !trasferimento && !divisione && (
            <CampoFoto
              fotoUri={fotoUri}
              onScattaFoto={() => scegliFoto(true)}
              onScegliGalleria={() => scegliFoto(false)}
              onRimuoviFoto={() => setFotoUri(undefined)}
            />
          )}

          <CampoRicorrente
            forzaRicorrente={forzaRicorrente}
            trasferimento={trasferimento}
            divisione={divisione}
            ricorrente={ricorrente}
            onToggleRicorrente={() => { setRicorrente((v) => !v); setDivisione(false); }}
            dataFine={dataFine}
            onChangeDataFine={setDataFine}
          />

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Pulsante Salva ── */}
        <TouchableOpacity
          style={[
            stili.btnSalva,
            { backgroundColor: coloreAccento },
            (caricamentoFoto || (divisione && !divisioneValida)) && { opacity: 0.6 },
          ]}
          onPress={gestisciSalva}
          activeOpacity={0.85}
          disabled={caricamentoFoto || (divisione && !divisioneValida)}
        >
          <Text style={stili.testoSalva}>
            {caricamentoFoto
              ? 'Caricamento foto…'
              : transazioneEsistente
                ? 'Salva modifiche'
                : trasferimento
                  ? 'Registra trasferimento'
                  : divisione
                    ? `Dividi in ${righeDivisione.length} categorie`
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
    inputNota: {
      height: 80,
      textAlignVertical: 'top',
    },
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
