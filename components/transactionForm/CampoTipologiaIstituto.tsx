import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../../constants/tema';
import { Istituto, TipologiaConto } from '../../types';
import { creaStiliCampo } from './stiliCampo';

const ETICHETTE_TIPOLOGIA: Record<TipologiaConto, string> = {
  conto_corrente: 'Conto Corrente',
  carta_credito:  'Carta di Credito',
};

const ICONE_TIPOLOGIA: Record<TipologiaConto, keyof typeof Ionicons.glyphMap> = {
  conto_corrente: 'business-outline',
  carta_credito:  'card-outline',
};

export default function CampoTipologiaIstituto({
  tipologia, onSelezionaTipologia, istituti, istitutoId, onSelezionaIstituto,
}: {
  tipologia: TipologiaConto | undefined;
  onSelezionaTipologia: (tp: TipologiaConto | undefined) => void;
  istituti: Istituto[];
  istitutoId: string | undefined;
  onSelezionaIstituto: (id: string | undefined) => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliCampo(t), [t]);

  return (
    <>
      <Text style={stili.etichetta}>Tipologia (opzionale)</Text>
      <View style={stili.toggleRiga}>
        {(['conto_corrente', 'carta_credito'] as TipologiaConto[]).map((tp) => {
          const attivo = tipologia === tp;
          return (
            <TouchableOpacity
              key={tp}
              style={[stili.btnToggle, attivo && stili.btnToggleAttivoBlue]}
              onPress={() => onSelezionaTipologia(tipologia === tp ? undefined : tp)}
            >
              <Ionicons
                name={ICONE_TIPOLOGIA[tp]}
                size={18}
                color={attivo ? '#FFF' : t.piuSottile}
              />
              <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                {ETICHETTE_TIPOLOGIA[tp]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {istituti.length > 0 && (
        <>
          <Text style={stili.etichetta}>Istituto (opzionale)</Text>
          <View style={stili.righeCategoria}>
            {istituti.map((ist) => {
              const selezionato = istitutoId === ist.id;
              return (
                <TouchableOpacity
                  key={ist.id}
                  style={[stili.chipIstituto, selezionato && stili.chipIstitutoAttivo]}
                  onPress={() => onSelezionaIstituto(istitutoId === ist.id ? undefined : ist.id)}
                >
                  <Text style={[stili.testoChipIstituto, selezionato && { color: '#FFF' }]}>
                    {ist.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}
