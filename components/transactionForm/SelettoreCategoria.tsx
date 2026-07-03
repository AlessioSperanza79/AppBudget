import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../../constants/tema';
import { Categoria } from '../../types';
import { iconaCategoria } from '../../utils/iconeCategorie';
import { creaStiliCampo } from './stiliCampo';

export default function SelettoreCategoria({
  categorie, categoriaId, onSeleziona,
}: {
  categorie: Categoria[];
  categoriaId: string;
  onSeleziona: (id: string) => void;
}) {
  const t = useTema();
  const stili = useMemo(() => creaStiliCampo(t), [t]);

  return (
    <>
      <Text style={stili.etichetta}>Categoria</Text>
      {/* A capo invece di scorrimento orizzontale: con molte categorie lo scroll orizzontale
          non è scopribile (soprattutto col mouse sul web) e alcune finivano irraggiungibili */}
      <View style={stili.righeCategoria}>
        {categorie.map((cat) => {
          const selezionata = categoriaId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                stili.chipCategoria,
                selezionata && { borderColor: cat.colore, borderWidth: 2, backgroundColor: cat.colore + '1A' },
              ]}
              onPress={() => onSeleziona(cat.id)}
            >
              <View style={[stili.puntoCat, { backgroundColor: cat.colore }]}>
                <Ionicons name={iconaCategoria(cat.nome)} size={11} color="#FFFFFF" />
              </View>
              <Text style={[stili.testoCat, selezionata && { color: cat.colore, fontWeight: '700' }]}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}
