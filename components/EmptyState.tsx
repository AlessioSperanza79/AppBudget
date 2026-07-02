import { useMemo, ComponentProps, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Text from './TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Tema } from '../constants/tema';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  messaggio: string;
  icona?: IoniconName;
  azioneLabel?: string;
  onAzione?: () => void;
  illustrazione?: ReactNode;
}

export default function EmptyState({ messaggio, icona = 'document-text-outline', azioneLabel, onAzione, illustrazione }: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={stili.contenitore}>
      {illustrazione ?? (
        <View style={stili.cerchioEsterno}>
          <View style={stili.cerchio}>
            <Ionicons name={icona} size={30} color={t.primario} />
          </View>
        </View>
      )}
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
      gap: 18,
    },
    // Doppio strato: un cerchio grande e tenue dietro uno più piccolo e pieno, per un
    // effetto "adesivo morbido" più caldo del singolo cerchio piatto di prima
    cerchioEsterno: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: t.superfice,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cerchio: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.primarioSfondo,
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
