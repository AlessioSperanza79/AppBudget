import { StyleSheet } from 'react-native';
import { Tema } from '../../constants/tema';

export function creaStiliCampo(t: Tema) {
  return StyleSheet.create({
    etichetta: {
      fontSize: 10,
      fontWeight: '700',
      color: t.piuSottile,
      marginTop: 22,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    toggleRiga: {
      flexDirection: 'row',
      gap: 10,
    },
    btnToggle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    btnToggleAttivoBlue: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoToggle: {
      fontSize: 14,
      fontWeight: '600',
      color: t.piuSottile,
    },
    righeCategoria: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipCategoria: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 8,
      paddingLeft: 8,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    puntoCat: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    testoCat: {
      fontSize: 13,
      color: t.sottile,
      fontWeight: '500',
    },
    chipIstituto: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    chipIstitutoAttivo: {
      backgroundColor: t.primario,
      borderColor: t.primario,
    },
    testoChipIstituto: {
      fontSize: 13,
      color: t.sottile,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.bordo,
      borderRadius: 12,
      padding: 13,
      fontSize: 15,
      backgroundColor: t.carta,
      color: t.titolo,
    },
    btnRicorrente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: t.bordo,
      backgroundColor: t.carta,
    },
    btnRicorrenteAttivo: {
      backgroundColor: t.viola,
      borderColor: t.viola,
    },
  });
}
