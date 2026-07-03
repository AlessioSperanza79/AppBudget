import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../../constants/tema';
import { TipoTransazione } from '../../types';
import { creaStiliCampo } from './stiliCampo';

export default function SelettoreTipo({
  tipo, trasferimento, trasferimentoDisponibile, onSelezionaTipo, onSelezionaTrasferimento,
}: {
  tipo: TipoTransazione;
  trasferimento: boolean;
  trasferimentoDisponibile: boolean;
  onSelezionaTipo: (tp: TipoTransazione) => void;
  onSelezionaTrasferimento: () => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliCampo(t), [t]);

  return (
    <>
      <Text style={stili.etichetta}>Tipo</Text>
      <View style={stili.toggleRiga}>
        {(['uscita', 'entrata'] as TipoTransazione[]).map((tp) => {
          const attivo = !trasferimento && tipo === tp;
          const c = tp === 'entrata' ? t.entrata : t.uscita;
          return (
            <TouchableOpacity
              key={tp}
              style={[stili.btnToggle, attivo && { backgroundColor: c, borderColor: c }]}
              onPress={() => onSelezionaTipo(tp)}
            >
              <Ionicons
                name={tp === 'entrata' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={18}
                color={attivo ? '#FFF' : t.piuSottile}
              />
              <Text style={[stili.testoToggle, attivo && { color: '#FFF' }]}>
                {tp === 'entrata' ? 'Entrata' : 'Uscita'}
              </Text>
            </TouchableOpacity>
          );
        })}
        {trasferimentoDisponibile && (
          <TouchableOpacity
            style={[stili.btnToggle, trasferimento && { backgroundColor: t.primario, borderColor: t.primario }]}
            onPress={onSelezionaTrasferimento}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={trasferimento ? '#FFF' : t.piuSottile}
            />
            <Text style={[stili.testoToggle, trasferimento && { color: '#FFF' }]}>
              Trasferimento
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
