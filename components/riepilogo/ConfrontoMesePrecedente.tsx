import { useMemo } from 'react';
import Text from '../TestoBase';
import FadeInView from '../FadeInView';
import { useTema } from '../../constants/tema';
import RigaConfronto from './RigaConfronto';
import { creaStiliSezione } from './stiliSezione';

export default function ConfrontoMesePrecedente({
  totaleEntrate, totaleUscite, confrontoMesePrecedente, nomeMesePrecedenteBreve,
}: {
  totaleEntrate: number;
  totaleUscite: number;
  confrontoMesePrecedente: { entrate: number; uscite: number };
  nomeMesePrecedenteBreve: string;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliSezione(t), [t]);

  return (
    <FadeInView ritardo={280} style={stili.sezione}>
      <Text style={stili.titolo}>Confronto con {nomeMesePrecedenteBreve}</Text>
      <RigaConfronto etichetta="Entrate" corrente={totaleEntrate} precedente={confrontoMesePrecedente.entrate} colore={t.entrata} />
      <RigaConfronto etichetta="Uscite" corrente={totaleUscite} precedente={confrontoMesePrecedente.uscite} colore={t.uscita} />
    </FadeInView>
  );
}
