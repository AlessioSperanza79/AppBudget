// ── Banner "Novità" dismissibile: evidenzia una funzione senza costruire un vero overlay-spotlight ──
import { useMemo, ComponentProps } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferenze } from '../store/usePreferenze';
import { useTema, Tema } from '../constants/tema';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  chiave: string;
  testo: string;
  icona?: IoniconName;
}

export default function SuggerimentoNovita({ chiave, testo, icona = 'sparkles-outline' }: Props) {
  const visto = usePreferenze((s) => !!s.suggerimentiVisti[chiave]);
  const segnaVisto = usePreferenze((s) => s.segnaSuggerimentoVisto);

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  if (visto) return null;

  return (
    <View style={stili.contenitore}>
      <Ionicons name={icona} size={16} color={t.primario} />
      <Text style={stili.testo}>{testo}</Text>
      <TouchableOpacity onPress={() => segnaVisto(chiave)} hitSlop={8}>
        <Ionicons name="close" size={16} color={t.piuSottile} />
      </TouchableOpacity>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.primarioSfondo,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    testo: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '500',
      color: t.corpo,
    },
  });
}
