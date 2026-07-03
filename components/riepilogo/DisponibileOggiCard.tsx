import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../TestoBase';
import CountUpText from '../CountUpText';
import FadeInView from '../FadeInView';
import { Tema, useTema, FONT_ESPRESSIVO } from '../../constants/tema';
import { formatEuro } from '../../utils/formatters';

export default function DisponibileOggiCard({ disponibileOggi }: { disponibileOggi: number }) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <FadeInView ritardo={40} style={stili.disponibileCard}>
      <View style={stili.disponibileIcona}>
        <Ionicons name="wallet-outline" size={18} color={disponibileOggi >= 0 ? t.primario : t.uscita} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={stili.disponibileEtichetta}>Disponibile oggi</Text>
        <Text style={stili.disponibileSottotitolo}>Al netto di budget e pagamenti ancora da fare</Text>
      </View>
      <CountUpText
        valore={disponibileOggi}
        formatta={formatEuro}
        style={[stili.disponibileValore, { color: disponibileOggi >= 0 ? t.entrata : t.uscita }]}
      />
    </FadeInView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    disponibileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      padding: 16,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    disponibileIcona: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primarioSfondo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disponibileEtichetta: {
      fontSize: 13,
      fontWeight: '700',
      color: t.titolo,
    },
    disponibileSottotitolo: {
      fontSize: 11,
      color: t.piuSottile,
      marginTop: 1,
    },
    disponibileValore: {
      fontSize: 17,
      fontWeight: '800',
      fontFamily: FONT_ESPRESSIVO,
    },
  });
}
