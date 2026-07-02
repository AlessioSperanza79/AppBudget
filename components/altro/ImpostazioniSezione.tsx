// ── Sezione "Impostazioni" della schermata Altro: tema + backup ──
import { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PreferenzaTema, usePreferenze } from '../../store/usePreferenze';
import { generaBackupJson } from '../../utils/backup';
import { esportaFile } from '../../utils/exportFile';
import { oggiIso } from '../../utils/formatters';
import PressableScale from '../../components/PressableScale';
import ImportaCsvModal from './ImportaCsvModal';
import { useTema, Tema } from '../../constants/tema';

const OPZIONI_TEMA: Array<{ key: PreferenzaTema; label: string; icona: keyof typeof Ionicons.glyphMap }> = [
  { key: 'sistema', label: 'Sistema', icona: 'contrast-outline' },
  { key: 'chiaro',  label: 'Chiaro',  icona: 'sunny-outline' },
  { key: 'scuro',   label: 'Scuro',   icona: 'moon-outline' },
];

export default function ImpostazioniSezione() {
  const { transazioni, categorie, istituti, reddito, obiettivi } = useFinanceStore();
  const { tema: prefTema, setTema } = usePreferenze();

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const esportaBackup = () => {
    const json = generaBackupJson(transazioni, categorie, istituti, reddito, obiettivi);
    esportaFile(`backup_appbudget_${oggiIso()}.json`, json, 'application/json');
  };

  return (
    <View style={stili.contenitore}>
      <Text style={stili.titoloSezione}>Impostazioni</Text>

      {/* ── Selettore tema ── */}
      <View style={stili.riga}>
        <Text style={stili.etichettaRiga}>Tema</Text>
        <View style={stili.toggleTema}>
          {OPZIONI_TEMA.map(({ key, label, icona }) => (
            <TouchableOpacity
              key={key}
              style={[stili.tabTema, prefTema === key && stili.tabTemaAttivo]}
              onPress={() => setTema(key)}
            >
              <Ionicons name={icona} size={15} color={prefTema === key ? t.titolo : t.piuSottile} />
              <Text style={[stili.testoTabTema, prefTema === key && stili.testoTabTemaAttivo]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Backup ── */}
      <PressableScale style={stili.btnBackup} onPress={esportaBackup}>
        <Ionicons name="cloud-download-outline" size={18} color={t.primario} />
        <Text style={stili.testoBtnBackup}>Esporta backup JSON</Text>
      </PressableScale>

      {/* ── Import CSV ── */}
      <ImportaCsvModal />
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 4,
      borderRadius: 24,
      padding: 18,
      gap: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSezione: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    etichettaRiga: {
      fontSize: 14,
      fontWeight: '500',
      color: t.corpo,
    },
    toggleTema: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 10,
      padding: 3,
    },
    tabTema: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 7,
    },
    tabTemaAttivo: {
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    testoTabTema: {
      fontSize: 12,
      fontWeight: '500',
      color: t.piuSottile,
    },
    testoTabTemaAttivo: {
      fontWeight: '700',
      color: t.titolo,
    },
    btnBackup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.primarioSfondo,
      borderRadius: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoBtnBackup: {
      fontSize: 14,
      fontWeight: '600',
      color: t.primario,
    },
  });
}
