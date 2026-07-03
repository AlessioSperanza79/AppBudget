import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Text from '../TestoBase';
import FadeInView from '../FadeInView';
import { Tema, useTema } from '../../constants/tema';
import { creaPointerConfig } from '../../utils/pointerConfig';

interface PuntoSaldo {
  value: number;
  label: string;
  labelTextStyle: { fontSize: number; color: string };
}

export default function TrendSaldoSparkline({
  ultimi6MesiSaldi, larghezza,
}: {
  ultimi6MesiSaldi: PuntoSaldo[];
  larghezza: number;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <FadeInView ritardo={160} style={stili.sezioneSparkline}>
      <Text style={stili.titoloSparkline}>Trend saldo — ultimi 6 mesi</Text>
      <LineChart
        data={ultimi6MesiSaldi}
        width={larghezza - 104}
        yAxisLabelWidth={35}
        height={90}
        areaChart
        color={t.primario}
        thickness={2}
        startFillColor={t.primario}
        endFillColor={t.primario}
        startOpacity={0.15}
        endOpacity={0.01}
        dataPointsColor={t.primario}
        dataPointsRadius={3}
        hideDataPoints={Platform.OS === 'web'}
        noOfSections={3}
        yAxisTextStyle={{ fontSize: 10, color: t.piuSottile }}
        rulesColor={t.bordoSottile}
        rulesType="solid"
        disableScroll
        pointerConfig={creaPointerConfig(t, t.primario, 90)}
      />
    </FadeInView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    sezioneSparkline: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 24,
      padding: 18,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSparkline: {
      fontSize: 13,
      fontWeight: '700',
      color: t.corpo,
      marginBottom: 8,
    },
  });
}
