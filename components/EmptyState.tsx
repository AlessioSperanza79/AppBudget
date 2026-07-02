import { useMemo, ComponentProps } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Tema } from '../constants/tema';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  messaggio: string;
  icona?: IoniconName;
  azioneLabel?: string;
  onAzione?: () => void;
}

export default function EmptyState({ messaggio, icona = 'document-text-outline', azioneLabel, onAzione }: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={stili.contenitore}>
      <View style={stili.cerchio}>
        <Ionicons name={icona} size={32} color={t.piuSottile} />
      </View>
      <Text style={stili.testo}>{messaggio}</Text>
      {azioneLabel && onAzione && (
        <TouchableOpacity style={stili.btnAzione} onPress={onAzione}>
          <Ionicons name="add-circle-outline" size={18} color={t.primario} />
          <Text style={stili.testoAzione}>{azioneLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      gap: 16,
    },
    cerchio: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.superfice,
      borderWidth: 1,
      borderColor: t.bordo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testo: {
      fontSize: 15,
      color: t.sottile,
      textAlign: 'center',
      lineHeight: 23,
    },
    btnAzione: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.primario,
      backgroundColor: t.primarioSfondo,
    },
    testoAzione: {
      color: t.primario,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
