// ── Schermata Pianifica: wrapper con toggle Ricorrenti/Obiettivi ──
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import RicorrentiVista from '../../components/pianifica/RicorrentiVista';
import ObiettiviVista from '../../components/pianifica/ObiettiviVista';
import { useTema, Tema } from '../../constants/tema';

type SottoVista = 'ricorrenti' | 'obiettivi';

export default function PianificazioneScreen() {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [sottoVista, setSottoVista] = useState<SottoVista>('ricorrenti');

  return (
    <View style={stili.contenitore}>
      <View style={stili.toggleContenitore}>
        {(['ricorrenti', 'obiettivi'] as SottoVista[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[stili.tab, sottoVista === v && stili.tabAttivo]}
            onPress={() => setSottoVista(v)}
          >
            <Text style={[stili.testoTab, sottoVista === v && stili.testoTabAttivo]}>
              {v === 'ricorrenti' ? 'Ricorrenti' : 'Obiettivi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sottoVista === 'ricorrenti' ? <RicorrentiVista /> : <ObiettiviVista />}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      flex: 1,
      backgroundColor: t.sfondo,
    },
    toggleContenitore: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 12,
      margin: 16,
      marginBottom: 4,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: 'center',
    },
    tabAttivo: {
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    testoTab:       { fontSize: 14, fontWeight: '500', color: t.piuSottile },
    testoTabAttivo: { fontSize: 14, fontWeight: '700', color: t.titolo },
  });
}
