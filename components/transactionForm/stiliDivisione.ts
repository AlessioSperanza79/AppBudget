import { StyleSheet } from 'react-native';
import { Tema } from '../../constants/tema';

export function creaStiliDivisione(t: Tema) {
  return StyleSheet.create({
    rigaDivisione: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    selettoreCategoriaRiga: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    puntoCatPiccolo: {
      width: 9,
      height: 9,
      borderRadius: 5,
      flexShrink: 0,
    },
    testoSelettoreCategoriaRiga: {
      flex: 1,
      fontSize: 13,
      color: t.titolo,
      fontWeight: '500',
    },
    inputImportoRiga: {
      width: 84,
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 10,
      fontSize: 14,
      color: t.titolo,
      backgroundColor: t.sfondoInput,
      textAlign: 'right',
    },
    btnAggiungiRiga: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      marginTop: 4,
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.primario,
    },
    testoAggiungiRiga: {
      fontSize: 13,
      fontWeight: '600',
      color: t.primario,
    },
    residuoRiga: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    testoResiduo: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
