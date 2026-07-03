import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import CountUpText from '../CountUpText';
import FadeInView from '../FadeInView';
import PressableScale from '../PressableScale';
import { Tema, useTema } from '../../constants/tema';
import { formatEuro } from '../../utils/formatters';
import { LivelloRisparmio } from '../../utils/livelloRisparmio';
import RigaFlusso from './RigaFlusso';

type Periodo = 'mensile' | 'annuale';

export default function CruscottoFlusso({
  periodo, reddito, redditoRiferimento, totaleInvestimenti, totaleFisse, totaleVariabili,
  avanzo, livelloRisparmio, onApriModaleReddito,
}: {
  periodo: Periodo;
  reddito: number;
  redditoRiferimento: number;
  totaleInvestimenti: number;
  totaleFisse: number;
  totaleVariabili: number;
  avanzo: number;
  livelloRisparmio: LivelloRisparmio;
  onApriModaleReddito: () => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <FadeInView ritardo={80} style={stili.cruscotto}>
      <View style={stili.intestazioneCruscotto}>
        <Text style={stili.titoloCruscotto}>
          {periodo === 'mensile' ? 'Flusso mensile' : 'Flusso annuale'}
        </Text>
        <PressableScale style={stili.btnEditReddito} onPress={onApriModaleReddito}>
          <Ionicons name="pencil-outline" size={12} color={t.sottile} />
          <Text style={stili.testoEditReddito}>
            {reddito > 0 ? formatEuro(redditoRiferimento) : 'Imposta reddito'}
          </Text>
        </PressableScale>
      </View>

      {reddito > 0 ? (
        <>
          {totaleInvestimenti > 0 && (
            <RigaFlusso etichetta="Investimenti" importo={totaleInvestimenti} reddito={redditoRiferimento} colore={t.viola} />
          )}
          {totaleFisse > 0 && (
            <RigaFlusso etichetta="Spese fisse" importo={totaleFisse} reddito={redditoRiferimento} colore={t.primario} />
          )}
          {totaleVariabili > 0 && (
            <RigaFlusso etichetta="Spese variabili" importo={totaleVariabili} reddito={redditoRiferimento} colore={t.arancio} />
          )}
          <View style={stili.separatoreCruscotto} />
          <View style={stili.rigaAvanzo}>
            <View style={[stili.cerchio, { backgroundColor: livelloRisparmio.coloreSfondo }]}>
              <Ionicons name={livelloRisparmio.icona} size={14} color={livelloRisparmio.colore} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stili.etichettaAvanzo}>
                {periodo === 'mensile' ? 'Risparmio' : 'Risparmio annuale'}
              </Text>
              <View style={[stili.badgeLivello, { backgroundColor: livelloRisparmio.coloreSfondo }]}>
                <Text style={[stili.testoBadgeLivello, { color: livelloRisparmio.colore }]}>
                  {livelloRisparmio.etichetta}
                </Text>
              </View>
            </View>
            <View style={stili.colonnaValoreAvanzo}>
              <CountUpText
                valore={avanzo}
                formatta={(n) => `${n >= 0 ? '+' : ''}${formatEuro(n)}`}
                style={[stili.valoreAvanzo, { color: avanzo >= 0 ? t.entrata : t.uscita }]}
              />
              <Text style={[stili.percAvanzo, { color: avanzo >= 0 ? t.entrata : t.uscita }]}>
                {redditoRiferimento > 0 ? `${Math.round(Math.abs(avanzo / redditoRiferimento) * 100)}%` : ''}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <TouchableOpacity style={stili.promptReddito} onPress={onApriModaleReddito}>
          <View style={stili.cerchioPrompt}>
            <Ionicons name="wallet-outline" size={18} color={t.primario} />
          </View>
          <Text style={stili.testoPromptReddito}>
            Imposta il reddito mensile per vedere come distribuisci ogni euro
          </Text>
          <Ionicons name="chevron-forward" size={16} color={t.primario} />
        </TouchableOpacity>
      )}
    </FadeInView>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    cruscotto: {
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
    intestazioneCruscotto: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    titoloCruscotto: {
      fontSize: 14,
      fontWeight: '700',
      color: t.titolo,
    },
    btnEditReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: t.superfice,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testoEditReddito: {
      fontSize: 12,
      color: t.sottile,
      fontWeight: '600',
    },
    separatoreCruscotto: {
      height: 1,
      backgroundColor: t.bordoSottile,
      marginVertical: 10,
    },
    cerchio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rigaAvanzo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    etichettaAvanzo: {
      fontSize: 13,
      color: t.titolo,
      fontWeight: '600',
    },
    badgeLivello: {
      alignSelf: 'flex-start',
      marginTop: 3,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    testoBadgeLivello: {
      fontSize: 11,
      fontWeight: '700',
    },
    colonnaValoreAvanzo: {
      alignItems: 'flex-end',
    },
    valoreAvanzo: {
      fontSize: 14,
      fontWeight: '800',
    },
    percAvanzo: {
      fontSize: 12,
      textAlign: 'right',
      fontWeight: '600',
      marginTop: 2,
    },
    promptReddito: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    cerchioPrompt: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primarioSfondo,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testoPromptReddito: {
      flex: 1,
      fontSize: 13,
      color: t.primario,
      fontWeight: '500',
      lineHeight: 18,
    },
  });
}
