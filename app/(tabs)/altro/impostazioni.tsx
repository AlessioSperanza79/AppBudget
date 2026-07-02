// ── Sotto-schermata "Impostazioni": tema, notifiche, sicurezza e backup in un unico posto ──
import { ScrollView, StyleSheet } from 'react-native';
import ImpostazioniSezione from '../../../components/altro/ImpostazioniSezione';
import NotificheSezione from '../../../components/altro/NotificheSezione';
import SicurezzaSezione from '../../../components/altro/SicurezzaSezione';
import { useTema } from '../../../constants/tema';

export default function ImpostazioniScreen() {
  const t = useTema();

  return (
    <ScrollView style={[stili.contenitore, { backgroundColor: t.sfondo }]} contentContainerStyle={stili.contenuto}>
      <ImpostazioniSezione />
      <NotificheSezione />
      <SicurezzaSezione />
    </ScrollView>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flex: 1,
  },
  contenuto: {
    paddingVertical: 12,
    paddingBottom: 32,
  },
});
