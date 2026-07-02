// ── Hub della tab Altro: elenco di voci verso le sotto-schermate di impostazione ──
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../../../components/TestoBase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../../../components/PressableScale';
import ContenitoreScheda from '../../../components/ContenitoreScheda';
import { useTema, Tema } from '../../../constants/tema';

type IoniconName = keyof typeof Ionicons.glyphMap;

const VOCI: { chiave: string; titolo: string; sottotitolo: string; icona: IoniconName; rotta: string }[] = [
  { chiave: 'impostazioni', titolo: 'Impostazioni', sottotitolo: 'Tema, notifiche, sicurezza, backup', icona: 'settings-outline', rotta: '/altro/impostazioni' },
  { chiave: 'categorie',    titolo: 'Categorie',     sottotitolo: 'Gestisci le categorie di spesa e i budget', icona: 'pricetags-outline', rotta: '/altro/categorie' },
  { chiave: 'conti',        titolo: 'Conti & Istituti', sottotitolo: 'Banche, carte e conti collegati', icona: 'business-outline', rotta: '/altro/conti' },
  { chiave: 'guida',        titolo: 'Guida',         sottotitolo: "Come funziona ogni parte dell'app", icona: 'help-circle-outline', rotta: '/altro/guida' },
];

export default function AltroHub() {
  const router = useRouter();
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <ContenitoreScheda style={stili.contenitore}>
      {VOCI.map(({ chiave, titolo, sottotitolo, icona, rotta }) => (
        <PressableScale
          key={chiave}
          style={stili.riga}
          onPress={() => router.push(rotta as never)}
        >
          <View style={stili.cerchioIcona}>
            <Ionicons name={icona} size={20} color={t.primario} />
          </View>
          <View style={stili.testi}>
            <Text style={stili.titolo}>{titolo}</Text>
            <Text style={stili.sottotitolo}>{sottotitolo}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.piuSottile} />
        </PressableScale>
      ))}
    </ContenitoreScheda>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
      padding: 16,
      gap: 10,
    },
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: t.carta,
      borderRadius: 18,
      padding: 16,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cerchioIcona: {
      width: 40,
      height: 40,
      borderRadius: 24,
      backgroundColor: t.primarioSfondo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    testi: {
      flex: 1,
    },
    titolo: {
      fontSize: 15,
      fontWeight: '600',
      color: t.titolo,
    },
    sottotitolo: {
      fontSize: 12,
      color: t.piuSottile,
      marginTop: 2,
    },
  });
}
