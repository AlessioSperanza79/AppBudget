import { useMemo } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import BottomSheet from '../BottomSheet';
import { Tema, useTema } from '../../constants/tema';

export default function ModaleReddito({
  visibile, redditoInput, onChangeText, onAnnulla, onSalva,
}: {
  visibile: boolean;
  redditoInput: string;
  onChangeText: (v: string) => void;
  onAnnulla: () => void;
  onSalva: () => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <BottomSheet visibile={visibile} onChiudi={onAnnulla}>
      <View style={stili.corpoModal}>
        <Text style={stili.titoloModal}>Reddito mensile netto</Text>
        <Text style={stili.sottotitoloModal}>
          Inserisci il tuo stipendio netto. Viene usato per calcolare il risparmio nel cruscotto flusso.
        </Text>
        <View style={stili.rigaInputReddito}>
          <Text style={stili.euroSign}>€</Text>
          <TextInput
            style={stili.inputReddito}
            value={redditoInput}
            onChangeText={onChangeText}
            placeholder="0"
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholderTextColor={t.segnaposto}
          />
        </View>
        <View style={stili.rigaBottoniModal}>
          <TouchableOpacity style={stili.btnAnnullaModal} onPress={onAnnulla}>
            <Text style={stili.testoAnnullaModal}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stili.btnSalvaModal} onPress={onSalva}>
            <Text style={stili.testoSalvaModal}>Salva</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </View>
    </BottomSheet>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    corpoModal: {
      paddingHorizontal: 24,
      paddingTop: 4,
      gap: 10,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
    },
    sottotitoloModal: {
      fontSize: 13,
      color: t.sottile,
      lineHeight: 20,
    },
    rigaInputReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      marginTop: 4,
      backgroundColor: t.sfondoInput,
    },
    euroSign: {
      fontSize: 20,
      fontWeight: '700',
      color: t.sottile,
    },
    inputReddito: {
      flex: 1,
      fontSize: 24,
      fontWeight: '700',
      color: t.titolo,
    },
    rigaBottoniModal: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    btnAnnullaModal: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.bordo,
      alignItems: 'center',
    },
    testoAnnullaModal: {
      color: t.sottile,
      fontSize: 15,
      fontWeight: '600',
    },
    btnSalvaModal: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: t.primario,
      alignItems: 'center',
    },
    testoSalvaModal: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
