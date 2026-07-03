import { useMemo } from 'react';
import { View } from 'react-native';
import Text from '../TestoBase';
import FadeInView from '../FadeInView';
import { useTema } from '../../constants/tema';
import { Categoria, Transazione } from '../../types';
import { formatEuro } from '../../utils/formatters';
import { creaStiliSezione } from './stiliSezione';

export default function ProssimiPagamenti({
  prossimeRicorrenze, categorie,
}: {
  prossimeRicorrenze: { transazione: Transazione; giorno: number }[];
  categorie: Categoria[];
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliSezione(t), [t]);

  return (
    <FadeInView ritardo={120} style={stili.sezione}>
      <Text style={stili.titolo}>Prossimi pagamenti</Text>
      {prossimeRicorrenze.map(({ transazione: tr, giorno }) => {
        const categoria = categorie.find((c) => c.id === tr.categoriaId);
        const isEntrata = tr.tipo === 'entrata';
        return (
          <View key={tr.id} style={stili.rigaStatistica}>
            <View style={stili.etichettaConPuntino}>
              <View style={[stili.puntinoStat, { backgroundColor: categoria?.colore ?? t.piuSottile }]} />
              <Text style={stili.etichettaStatistica} numberOfLines={1}>
                {categoria?.nome ?? '—'} · giorno {giorno}
              </Text>
            </View>
            <Text style={[stili.valoreStatistica, { color: isEntrata ? t.entrata : t.uscita }]}>
              {isEntrata ? '+' : '−'}{formatEuro(tr.importo)}
            </Text>
          </View>
        );
      })}
    </FadeInView>
  );
}
