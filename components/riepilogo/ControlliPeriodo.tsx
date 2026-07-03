import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useMemo } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import PressableScale from '../PressableScale';
import { Tema, useTema } from '../../constants/tema';

type Periodo = 'mensile' | 'annuale';

// Sul web mostra un'etichetta al passaggio del mouse; su native viene ignorata
const suggerimento = (testo: string) => (Platform.OS === 'web' ? { title: testo } : {});

export default function ControlliPeriodo({
  periodo, onCambiaPeriodo, periodoLabel, onNaviga, onBackup, onCiclaTema, iconaTema,
}: {
  periodo: Periodo;
  onCambiaPeriodo: (p: Periodo) => void;
  periodoLabel: string;
  onNaviga: (direzione: 1 | -1) => void;
  onBackup: () => void;
  onCiclaTema: () => void;
  iconaTema: ComponentProps<typeof Ionicons>['name'];
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={stili.controlliContenitore}>
      <View style={stili.rigaToggle}>
        <View style={[stili.toggle, { flex: 1 }]}>
          {(['mensile', 'annuale'] as Periodo[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[stili.toggleBtn, periodo === p && stili.toggleBtnAttivo]}
              onPress={() => onCambiaPeriodo(p)}
            >
              <Text style={[stili.toggleTesto, periodo === p && stili.toggleTestoAttivo]}>
                {p === 'mensile' ? 'Mensile' : 'Annuale'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <PressableScale onPress={onBackup} style={stili.btnTema} hitSlop={8} {...suggerimento('Esporta backup JSON')}>
          <Ionicons name="cloud-download-outline" size={20} color={t.sottile} />
        </PressableScale>
        <PressableScale onPress={onCiclaTema} style={stili.btnTema} hitSlop={8} {...suggerimento('Cambia tema')}>
          <Ionicons name={iconaTema} size={20} color={t.sottile} />
        </PressableScale>
      </View>

      <View style={stili.navigatore}>
        <PressableScale onPress={() => onNaviga(-1)} hitSlop={10} style={stili.btnNav}>
          <Ionicons name="chevron-back" size={18} color={t.sottile} />
        </PressableScale>
        <Text style={stili.labelPeriodo}>{periodoLabel}</Text>
        <PressableScale onPress={() => onNaviga(1)} hitSlop={10} style={stili.btnNav}>
          <Ionicons name="chevron-forward" size={18} color={t.sottile} />
        </PressableScale>
      </View>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    controlliContenitore: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
      gap: 10,
    },
    rigaToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    btnTema: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.carta,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: t.toggleSfondo,
      borderRadius: 12,
      padding: 4,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: 'center',
    },
    toggleBtnAttivo: {
      backgroundColor: t.toggleAttivo,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleTesto: {
      fontSize: 14,
      fontWeight: '500',
      color: t.sottile,
    },
    toggleTestoAttivo: {
      color: t.titolo,
      fontWeight: '700',
    },
    navigatore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.carta,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    btnNav: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: t.superfice,
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelPeriodo: {
      fontSize: 15,
      fontWeight: '700',
      color: t.titolo,
    },
  });
}
