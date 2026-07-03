import { StyleSheet } from 'react-native';
import { Tema } from '../../constants/tema';

// Stili condivisi dalle sezioni "a card" del Riepilogo (prossimi pagamenti, sparkline,
// statistiche avanzate, confronto mese precedente): stesso involucro visivo, contenuto diverso
export function creaStiliSezione(t: Tema) {
  return StyleSheet.create({
    sezione: {
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 24,
      padding: 18,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titolo: {
      fontSize: 13,
      fontWeight: '700',
      color: t.corpo,
      marginBottom: 8,
    },
    separatore: {
      height: 1,
      backgroundColor: t.bordoSottile,
      marginVertical: 10,
    },
    rigaStatistica: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 6,
    },
    etichettaStatistica: {
      flex: 1,
      fontSize: 13,
      color: t.corpo,
    },
    valoreStatistica: {
      fontSize: 13,
      fontWeight: '700',
      color: t.titolo,
    },
    etichettaConPuntino: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    puntinoStat: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
  });
}
