import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import SelectorData from '../SelectorData';
import { useTema } from '../../constants/tema';
import { Istituto } from '../../types';
import { creaStiliCampo } from './stiliCampo';

export default function SelettoreTrasferimento({
  istituti, istitutoOrigineId, istitutoDestinazioneId, onSelezionaOrigine, onSelezionaDestinazione, data, onChangeData,
}: {
  istituti: Istituto[];
  istitutoOrigineId: string | undefined;
  istitutoDestinazioneId: string | undefined;
  onSelezionaOrigine: (id: string) => void;
  onSelezionaDestinazione: (id: string) => void;
  data: string;
  onChangeData: (v: string) => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliCampo(t), [t]);

  return (
    <>
      <Text style={stili.etichetta}>Da</Text>
      <View style={stili.righeCategoria}>
        {istituti.map((ist) => {
          const selezionato = istitutoOrigineId === ist.id;
          return (
            <TouchableOpacity
              key={ist.id}
              style={[stili.chipIstituto, selezionato && { backgroundColor: t.uscita, borderColor: t.uscita }]}
              onPress={() => onSelezionaOrigine(ist.id)}
            >
              <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                {ist.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={stili.etichetta}>A</Text>
      <View style={stili.righeCategoria}>
        {istituti.map((ist) => {
          const selezionato = istitutoDestinazioneId === ist.id;
          const disabilitato = istitutoOrigineId === ist.id;
          return (
            <TouchableOpacity
              key={ist.id}
              disabled={disabilitato}
              style={[
                stili.chipIstituto,
                selezionato && { backgroundColor: t.entrata, borderColor: t.entrata },
                disabilitato && { opacity: 0.35 },
              ]}
              onPress={() => onSelezionaDestinazione(ist.id)}
            >
              <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                {ist.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={stili.etichetta}>Data</Text>
      <SelectorData valore={data} onChange={onChangeData} />
    </>
  );
}
