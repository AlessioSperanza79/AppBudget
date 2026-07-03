import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../TestoBase';
import BottomSheet from '../BottomSheet';
import { Tema, useTema } from '../../constants/tema';
import { Categoria, Istituto, Transazione } from '../../types';
import RigaDettaglioTransazione from './RigaDettaglioTransazione';

interface GruppoCategoria {
  categoria: Categoria;
  totale: number;
  transazioni: Transazione[];
}

export default function ModaleDettaglioCategoria({
  categoriaDettaglio, gruppiPerCategoria, istituti, onChiudi,
}: {
  categoriaDettaglio: Categoria | undefined;
  gruppiPerCategoria: GruppoCategoria[];
  istituti: Istituto[];
  onChiudi: () => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <BottomSheet visibile={!!categoriaDettaglio} onChiudi={onChiudi} altezza="80%">
      <View style={stili.corpoDettaglioCategoria}>
        <Text style={stili.titoloModal}>{categoriaDettaglio?.nome}</Text>
      </View>
      <ScrollView style={{ paddingHorizontal: 0 }}>
        {gruppiPerCategoria
          .find((g) => g.categoria.id === categoriaDettaglio?.id)
          ?.transazioni.map((tr) => (
            <RigaDettaglioTransazione
              key={tr.id}
              transazione={tr}
              istituto={istituti.find((i) => i.id === tr.istitutoId)}
            />
          ))}
        <View style={{ height: 16 }} />
      </ScrollView>
    </BottomSheet>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    corpoDettaglioCategoria: {
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 8,
    },
    titoloModal: {
      fontSize: 18,
      fontWeight: '700',
      color: t.titolo,
    },
  });
}
