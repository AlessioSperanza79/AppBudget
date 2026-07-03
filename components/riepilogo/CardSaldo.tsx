import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../TestoBase';
import CountUpText from '../CountUpText';
import FadeInView from '../FadeInView';
import { Tema, useTema, FONT_ESPRESSIVO } from '../../constants/tema';
import { formatEuro } from '../../utils/formatters';

type Periodo = 'mensile' | 'annuale';

export default function CardSaldo({
  periodo, saldo, totaleEntrate, totaleUscite, variazioneSaldo, nomeMesePrecedenteBreve, coloriGradiente,
}: {
  periodo: Periodo;
  saldo: number;
  totaleEntrate: number;
  totaleUscite: number;
  variazioneSaldo: number | null;
  nomeMesePrecedenteBreve: string;
  coloriGradiente: [string, string];
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <FadeInView ritardo={0}>
    <LinearGradient
      colors={coloriGradiente}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={stili.cardSaldo}
    >
      {/* Cerchi decorativi in vetro per dare profondità senza librerie native extra */}
      <View style={stili.cerchioDecorativoGrande} />
      <View style={stili.cerchioDecorativoPiccolo} />

      <Text style={stili.etichettaSaldo}>
        {periodo === 'mensile' ? 'Saldo del mese' : "Saldo dell'anno"}
      </Text>
      <CountUpText
        valore={saldo}
        formatta={(n) => `${n >= 0 ? '+' : ''}${formatEuro(n)}`}
        style={stili.valoreSaldo}
      />
      {variazioneSaldo != null && variazioneSaldo !== 0 && (
        <View style={stili.badgeVariazione}>
          <Ionicons
            name={variazioneSaldo >= 0 ? 'arrow-up' : 'arrow-down'}
            size={11}
            color="#FFFFFF"
          />
          <Text style={stili.testoVariazione}>
            {variazioneSaldo >= 0 ? '+' : ''}{formatEuro(variazioneSaldo)} vs {nomeMesePrecedenteBreve}
          </Text>
        </View>
      )}
      <View style={stili.rigaStat}>
        <View style={stili.stat}>
          <View style={stili.rigaStatIcon}>
            <Ionicons name="arrow-up-circle-outline" size={14} color="#A7F3D0" />
            <Text style={[stili.labelStat, { color: '#A7F3D0' }]}>Entrate</Text>
          </View>
          <CountUpText valore={totaleEntrate} formatta={formatEuro} style={[stili.valoreStat, { color: '#A7F3D0' }]} />
        </View>
        <View style={stili.separatoreStat} />
        <View style={stili.stat}>
          <View style={stili.rigaStatIcon}>
            <Ionicons name="arrow-down-circle-outline" size={14} color="#FECDD3" />
            <Text style={[stili.labelStat, { color: '#FECDD3' }]}>Uscite</Text>
          </View>
          <CountUpText valore={totaleUscite} formatta={formatEuro} style={[stili.valoreStat, { color: '#FECDD3' }]} />
        </View>
      </View>
    </LinearGradient>
    </FadeInView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    cardSaldo: {
      margin: 16,
      marginTop: 12,
      borderRadius: 28,
      padding: 24,
      gap: 4,
      overflow: 'hidden',
      shadowColor: t.primario,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 6,
    },
    cerchioDecorativoGrande: {
      position: 'absolute',
      top: -60,
      right: -50,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255,255,255,0.10)',
    },
    cerchioDecorativoPiccolo: {
      position: 'absolute',
      bottom: -30,
      left: -20,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    etichettaSaldo: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    valoreSaldo: {
      color: '#FFF',
      fontSize: 46,
      fontWeight: '800',
      fontFamily: FONT_ESPRESSIVO,
      letterSpacing: -1.5,
      marginTop: 4,
    },
    badgeVariazione: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    testoVariazione: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    rigaStat: {
      flexDirection: 'row',
      marginTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.2)',
      paddingTop: 14,
      gap: 12,
    },
    stat: {
      flex: 1,
      gap: 5,
    },
    rigaStatIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    separatoreStat: {
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    labelStat: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      fontWeight: '500',
    },
    valoreStat: {
      color: '#FFF',
      fontSize: 17,
      fontWeight: '700',
      fontFamily: FONT_ESPRESSIVO,
    },
  });
}
