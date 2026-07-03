import { useMemo } from 'react';
import { View } from 'react-native';
import Text from '../TestoBase';
import CountUpText from '../CountUpText';
import FadeInView from '../FadeInView';
import { useTema } from '../../constants/tema';
import { Categoria } from '../../types';
import { formatEuro } from '../../utils/formatters';
import { creaStiliSezione } from './stiliSezione';

export default function StatisticheAvanzate({
  totaleUscite, mediaGiornaliera, differenzaMediaPerc, topCategorieSpesa,
}: {
  totaleUscite: number;
  mediaGiornaliera: number;
  differenzaMediaPerc: number | null;
  topCategorieSpesa: { categoria: Categoria; valore: number }[];
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliSezione(t), [t]);

  return (
    <FadeInView ritardo={240} style={stili.sezione}>
      <Text style={stili.titolo}>Statistiche</Text>

      <View style={stili.rigaStatistica}>
        <Text style={stili.etichettaStatistica}>Media spesa giornaliera</Text>
        <CountUpText valore={mediaGiornaliera} formatta={formatEuro} style={stili.valoreStatistica} />
      </View>

      {differenzaMediaPerc != null && (
        <View style={stili.rigaStatistica}>
          <Text style={stili.etichettaStatistica}>Rispetto alla media ultimi 3 mesi</Text>
          <Text style={[
            stili.valoreStatistica,
            { color: differenzaMediaPerc <= 0 ? t.entrata : t.uscita },
          ]}>
            {differenzaMediaPerc >= 0 ? '+' : ''}{Math.round(differenzaMediaPerc)}%
          </Text>
        </View>
      )}

      {topCategorieSpesa.length > 0 && (
        <>
          <View style={stili.separatore} />
          <Text style={stiliSottotitolo(t).sottotitolo}>Categorie con più spese</Text>
          {topCategorieSpesa.map(({ categoria, valore }) => (
            <View key={categoria.id} style={stili.rigaStatistica}>
              <View style={stili.etichettaConPuntino}>
                <View style={[stili.puntinoStat, { backgroundColor: categoria.colore }]} />
                <Text style={stili.etichettaStatistica} numberOfLines={1}>{categoria.nome}</Text>
              </View>
              <Text style={stili.valoreStatistica}>
                {formatEuro(valore)} · {Math.round((valore / totaleUscite) * 100)}%
              </Text>
            </View>
          ))}
        </>
      )}
    </FadeInView>
  );
}

// Sottotitolo di gruppo interno alla card: usato solo qui, non merita di entrare negli stili condivisi
function stiliSottotitolo(t: { piuSottile: string }) {
  return {
    sottotitolo: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: t.piuSottile,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
  };
}
