import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../TestoBase';
import PressableScale from '../PressableScale';
import SuggerimentoNovita from '../SuggerimentoNovita';
import { Tema, useTema } from '../../constants/tema';
import { Categoria, Transazione } from '../../types';
import { formatEuro } from '../../utils/formatters';
import { iconaCategoria } from '../../utils/iconeCategorie';

interface GruppoCategoria {
  categoria: Categoria;
  totale: number;
  transazioni: Transazione[];
}

export default function ListaCategorieGruppo({
  gruppiPerCategoria, onSelezionaCategoria,
}: {
  gruppiPerCategoria: GruppoCategoria[];
  onSelezionaCategoria: (categoria: Categoria) => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  if (gruppiPerCategoria.length === 0) {
    return <Text style={stili.vuoto}>Nessuna transazione in questo periodo.</Text>;
  }

  return (
    <>
      <SuggerimentoNovita chiave="dettaglio-categoria-riepilogo" testo="Tocca una categoria per vedere le transazioni" icona="hand-left-outline" />
      <Text style={stili.sottotitolo}>
        Categorie ({gruppiPerCategoria.length})
      </Text>
      {gruppiPerCategoria.map(({ categoria, totale, transazioni: txCategoria }) => (
        <PressableScale
          key={categoria.id}
          style={stili.rigaCategoriaGruppo}
          onPress={() => onSelezionaCategoria(categoria)}
        >
          <View style={[stili.avatarGruppo, { backgroundColor: categoria.colore }]}>
            <Ionicons name={iconaCategoria(categoria.nome)} size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={stili.nomeGruppo}>{categoria.nome}</Text>
            <Text style={stili.contoGruppo}>
              {txCategoria.length} transazion{txCategoria.length === 1 ? 'e' : 'i'}
            </Text>
          </View>
          <Text style={[stili.importoGruppo, { color: totale >= 0 ? t.entrata : t.uscita }]}>
            {totale >= 0 ? '+' : '−'}{formatEuro(Math.abs(totale))}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={t.piuSottile} />
        </PressableScale>
      ))}
    </>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    sottotitolo: {
      fontSize: 14,
      fontWeight: '700',
      color: t.sottile,
      marginTop: 4,
      marginBottom: 4,
      marginHorizontal: 20,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vuoto: {
      textAlign: 'center',
      color: t.piuSottile,
      margin: 40,
      lineHeight: 24,
      fontSize: 15,
    },
    rigaCategoriaGruppo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.carta,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 18,
      padding: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    avatarGruppo: {
      width: 40,
      height: 40,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    nomeGruppo: {
      fontSize: 15,
      fontWeight: '600',
      color: t.titolo,
    },
    contoGruppo: {
      fontSize: 12,
      color: t.piuSottile,
      marginTop: 2,
    },
    importoGruppo: {
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
