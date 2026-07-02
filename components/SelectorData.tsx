// Versione NATIVA (Android / iOS) — usa il calendario di sistema
import { useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Text from './TestoBase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatData } from '../utils/formatters';

interface Props {
  valore: string;               // data in formato ISO "YYYY-MM-DD"
  onChange: (nuovaData: string) => void;
}

export default function SelectorData({ valore, onChange }: Props) {
  const [mostraPicker, setMostraPicker] = useState(false);

  // Convertiamo la stringa ISO in oggetto Date per il picker nativo
  const dataOggetto = new Date(valore + 'T00:00:00');

  const gestisciCambio = (_: unknown, dataSelezionata?: Date) => {
    setMostraPicker(false);
    if (dataSelezionata) {
      onChange(dataSelezionata.toISOString().split('T')[0]);
    }
  };

  return (
    <>
      {/* Pulsante che mostra la data selezionata e apre il picker */}
      <TouchableOpacity style={stili.bottone} onPress={() => setMostraPicker(true)}>
        <Text style={stili.testo}>{formatData(valore)}</Text>
      </TouchableOpacity>

      {mostraPicker && (
        <DateTimePicker
          value={dataOggetto}
          mode="date"
          // Su iOS il picker inline occupa troppo spazio, "compact" è più compatto
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={gestisciCambio}
        />
      )}
    </>
  );
}

const stili = StyleSheet.create({
  bottone: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  testo: {
    fontSize: 15,
    color: '#333',
  },
});
