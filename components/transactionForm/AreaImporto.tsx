import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Text from '../TestoBase';
import { Tema, useTema } from '../../constants/tema';

export default function AreaImporto({
  importo, onChangeText, coloreAccento,
}: {
  importo: string;
  onChangeText: (v: string) => void;
  coloreAccento: string;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={[stili.areaImporto, { borderColor: coloreAccento + '40' }]}>
      <Text style={stili.labelImporto}>IMPORTO</Text>
      <View style={stili.rigaImporto}>
        <Text style={[stili.simboloEuro, { color: importo ? coloreAccento : t.segnaposto }]}>€</Text>
        <TextInput
          style={[stili.inputImporto, { color: coloreAccento }]}
          value={importo}
          onChangeText={onChangeText}
          placeholder="0,00"
          placeholderTextColor={t.segnaposto}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>
      <View style={[stili.lineaImporto, { backgroundColor: coloreAccento }]} />
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    areaImporto: {
      backgroundColor: t.carta,
      borderRadius: 24,
      borderWidth: 1.5,
      paddingVertical: 24,
      paddingHorizontal: 20,
      marginTop: 20,
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    labelImporto: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    rigaImporto: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    simboloEuro: {
      fontSize: 26,
      fontWeight: '700',
      paddingBottom: 6,
    },
    inputImporto: {
      fontSize: 48,
      fontWeight: '800',
      minWidth: 130,
      letterSpacing: -1.5,
      paddingVertical: 0,
    },
    lineaImporto: {
      height: 3,
      width: 72,
      borderRadius: 2,
      marginTop: 10,
      opacity: 0.8,
    },
  });
}
