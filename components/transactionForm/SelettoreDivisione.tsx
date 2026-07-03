import { useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../../constants/tema';
import { Categoria } from '../../types';
import { formatEuro } from '../../utils/formatters';
import { iconaCategoria } from '../../utils/iconeCategorie';
import { creaStiliCampo } from './stiliCampo';
import { creaStiliDivisione } from './stiliDivisione';

interface RigaDivisione {
  id: string;
  categoriaId: string;
  importo: string;
}

export default function SelettoreDivisione({
  divisioneDisponibile, divisione, onToggleDivisione,
  righeDivisione, categorie, onAggiornaRiga, onAggiungiRiga, onRimuoviRiga, residuoDivisione,
}: {
  divisioneDisponibile: boolean;
  divisione: boolean;
  onToggleDivisione: () => void;
  righeDivisione: RigaDivisione[];
  categorie: Categoria[];
  onAggiornaRiga: (id: string, campo: 'categoriaId' | 'importo', valore: string) => void;
  onAggiungiRiga: () => void;
  onRimuoviRiga: (id: string) => void;
  residuoDivisione: number;
}) {
  const t = useTema();
  const stiliCampo = useMemo(() => creaStiliCampo(t), [t]);
  const stili = useMemo(() => creaStiliDivisione(t), [t]);
  const [rigaSelettoreCategoria, setRigaSelettoreCategoria] = useState<string | undefined>();

  if (!divisioneDisponibile) return null;

  return (
    <>
      <Text style={stiliCampo.etichetta}>Divisione</Text>
      <TouchableOpacity
        style={[stiliCampo.btnRicorrente, divisione && stiliCampo.btnRicorrenteAttivo]}
        onPress={onToggleDivisione}
        activeOpacity={0.7}
      >
        <Ionicons name={divisione ? 'layers' : 'layers-outline'} size={18} color={divisione ? '#FFF' : t.piuSottile} />
        <Text style={[stiliCampo.testoToggle, divisione && { color: '#FFF' }]}>
          {divisione ? 'Sì — su più categorie' : 'No — una sola categoria'}
        </Text>
      </TouchableOpacity>

      {divisione && (
        <>
          <Text style={stiliCampo.etichetta}>Suddivisione</Text>
          {righeDivisione.map((riga) => {
            const categoriaRiga = categorie.find((c) => c.id === riga.categoriaId);
            const selettoreAperto = rigaSelettoreCategoria === riga.id;
            return (
              <View key={riga.id}>
                <View style={stili.rigaDivisione}>
                  <TouchableOpacity
                    style={[stili.selettoreCategoriaRiga, selettoreAperto && { borderColor: t.primario }]}
                    onPress={() => setRigaSelettoreCategoria(selettoreAperto ? undefined : riga.id)}
                  >
                    {categoriaRiga && <View style={[stili.puntoCatPiccolo, { backgroundColor: categoriaRiga.colore }]} />}
                    <Text style={stili.testoSelettoreCategoriaRiga} numberOfLines={1}>
                      {categoriaRiga?.nome ?? 'Categoria'}
                    </Text>
                    <Ionicons name={selettoreAperto ? 'chevron-up' : 'chevron-down'} size={14} color={t.piuSottile} />
                  </TouchableOpacity>
                  <TextInput
                    style={stili.inputImportoRiga}
                    value={riga.importo}
                    onChangeText={(v) => onAggiornaRiga(riga.id, 'importo', v)}
                    placeholder="0,00"
                    placeholderTextColor={t.segnaposto}
                    keyboardType="decimal-pad"
                  />
                  {righeDivisione.length > 2 && (
                    <TouchableOpacity onPress={() => onRimuoviRiga(riga.id)} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={20} color={t.uscita} />
                    </TouchableOpacity>
                  )}
                </View>
                {selettoreAperto && (
                  <View style={stiliCampo.righeCategoria}>
                    {categorie.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          stiliCampo.chipCategoria,
                          riga.categoriaId === cat.id && { borderColor: cat.colore, borderWidth: 2, backgroundColor: cat.colore + '1A' },
                        ]}
                        onPress={() => { onAggiornaRiga(riga.id, 'categoriaId', cat.id); setRigaSelettoreCategoria(undefined); }}
                      >
                        <View style={[stiliCampo.puntoCat, { backgroundColor: cat.colore }]}>
                          <Ionicons name={iconaCategoria(cat.nome)} size={11} color="#FFFFFF" />
                        </View>
                        <Text style={stiliCampo.testoCat}>{cat.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={stili.btnAggiungiRiga} onPress={onAggiungiRiga}>
            <Ionicons name="add-circle-outline" size={18} color={t.primario} />
            <Text style={stili.testoAggiungiRiga}>Aggiungi riga</Text>
          </TouchableOpacity>

          <View style={stili.residuoRiga}>
            <Ionicons
              name={residuoDivisione === 0 ? 'checkmark-circle' : 'alert-circle-outline'}
              size={16}
              color={residuoDivisione === 0 ? t.entrata : t.uscita}
            />
            <Text style={[stili.testoResiduo, { color: residuoDivisione === 0 ? t.entrata : t.uscita }]}>
              {residuoDivisione === 0 ? 'Somma corrispondente al totale' : `Residuo da assegnare: ${formatEuro(Math.abs(residuoDivisione))}`}
            </Text>
          </View>
        </>
      )}
    </>
  );
}
