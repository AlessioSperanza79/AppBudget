import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../../constants/tema';
import SelectorData from '../SelectorData';
import { creaStiliCampo } from './stiliCampo';

export default function CampoRicorrente({
  forzaRicorrente, trasferimento, divisione, ricorrente, onToggleRicorrente, dataFine, onChangeDataFine,
}: {
  forzaRicorrente: boolean | undefined;
  trasferimento: boolean;
  divisione: boolean;
  ricorrente: boolean;
  onToggleRicorrente: () => void;
  dataFine: string;
  onChangeDataFine: (v: string) => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliCampo(t), [t]);

  return (
    <>
      {!forzaRicorrente && !trasferimento && !divisione && (
        <>
          <Text style={stili.etichetta}>Ricorrente</Text>
          <TouchableOpacity
            style={[stili.btnRicorrente, ricorrente && stili.btnRicorrenteAttivo]}
            onPress={onToggleRicorrente}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ricorrente ? 'repeat' : 'repeat-outline'}
              size={18}
              color={ricorrente ? '#FFF' : t.piuSottile}
            />
            <Text style={[stili.testoToggle, ricorrente && { color: '#FFF' }]}>
              {ricorrente ? 'Sì — appare in Pianificazione' : 'No — transazione singola'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {!trasferimento && (ricorrente || forzaRicorrente) && (
        <>
          <Text style={stili.etichetta}>Fine ricorrenza</Text>
          <SelectorData valore={dataFine} onChange={onChangeDataFine} />
        </>
      )}
    </>
  );
}
