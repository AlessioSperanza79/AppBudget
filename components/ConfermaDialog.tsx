// Dialog di conferma (es. eliminazioni) basato su BottomSheet, per uniformare i vari "Sei sicuro?" dell'app
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet from './BottomSheet';
import { useTema, Tema } from '../constants/tema';

interface ProprietaConfermaDialog {
  visibile: boolean;
  onChiudi: () => void;
  titolo: string;
  messaggio: React.ReactNode;
  icona?: keyof typeof Ionicons.glyphMap;
  onConferma?: () => void;
  testoConferma?: string;
  testoAnnulla?: string;
  pericoloso?: boolean;
}

export default function ConfermaDialog({
  visibile, onChiudi, titolo, messaggio, icona = 'trash-outline',
  onConferma, testoConferma = 'Elimina', testoAnnulla = 'Annulla', pericoloso = true,
}: ProprietaConfermaDialog) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const coloreAccento = pericoloso ? t.uscita : t.primario;
  const sfondoAccento = pericoloso ? t.uscitaSfondo : t.primarioSfondo;

  // Un piccolo scatto tattile quando compare una conferma "pericolosa" (es. elimina),
  // per far percepire il peso dell'azione senza dover leggere il testo
  useEffect(() => {
    if (visibile && pericoloso && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [visibile, pericoloso]);

  const confermaConAptico = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConferma?.();
  };

  return (
    <BottomSheet visibile={visibile} onChiudi={onChiudi}>
      <View style={stili.contenuto}>
        <View style={stili.rigaIcona}>
          <View style={[stili.cerchioIcona, { backgroundColor: sfondoAccento }]}>
            <Ionicons name={icona} size={22} color={coloreAccento} />
          </View>
          <Text style={stili.titolo}>{titolo}</Text>
        </View>

        <Text style={stili.messaggio}>{messaggio}</Text>

        <View style={stili.rigaBottoni}>
          <TouchableOpacity style={stili.btnAnnulla} onPress={onChiudi}>
            <Text style={stili.testoAnnulla}>{onConferma ? testoAnnulla : 'Chiudi'}</Text>
          </TouchableOpacity>
          {onConferma && (
            <TouchableOpacity
              style={[stili.btnConferma, { backgroundColor: coloreAccento }]}
              onPress={confermaConAptico}
            >
              <Text style={stili.testoConferma}>{testoConferma}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenuto: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      paddingTop: 4,
      gap: 16,
    },
    rigaIcona: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cerchioIcona: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titolo: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
    },
    messaggio: {
      fontSize: 14,
      color: t.sottile,
      lineHeight: 21,
    },
    rigaBottoni: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    btnAnnulla: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: t.superfice,
    },
    testoAnnulla: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnConferma: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    testoConferma: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
