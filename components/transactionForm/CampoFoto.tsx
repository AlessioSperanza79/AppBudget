import { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../TestoBase';
import { Ionicons } from '@expo/vector-icons';
import { Tema, useTema } from '../../constants/tema';
import { creaStiliCampo } from './stiliCampo';

export default function CampoFoto({
  fotoUri, onScattaFoto, onScegliGalleria, onRimuoviFoto,
}: {
  fotoUri: string | undefined;
  onScattaFoto: () => void;
  onScegliGalleria: () => void;
  onRimuoviFoto: () => void;
}) {
  const t = useTema();
  const stiliCampo = useMemo(() => creaStiliCampo(t), [t]);
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <>
      <Text style={stiliCampo.etichetta}>Foto scontrino (facoltativa)</Text>
      {fotoUri ? (
        <View style={stili.anteprimaFotoContenitore}>
          <Image source={{ uri: fotoUri }} style={stili.anteprimaFoto} />
          <TouchableOpacity style={stili.btnRimuoviFoto} onPress={onRimuoviFoto} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={t.uscita} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={stiliCampo.toggleRiga}>
          <TouchableOpacity style={stiliCampo.btnToggle} onPress={onScattaFoto}>
            <Ionicons name="camera-outline" size={18} color={t.piuSottile} />
            <Text style={stiliCampo.testoToggle}>Scatta foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stiliCampo.btnToggle} onPress={onScegliGalleria}>
            <Ionicons name="images-outline" size={18} color={t.piuSottile} />
            <Text style={stiliCampo.testoToggle}>Da galleria</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    anteprimaFotoContenitore: {
      position: 'relative',
      alignSelf: 'flex-start',
    },
    anteprimaFoto: {
      width: 96,
      height: 96,
      borderRadius: 14,
      backgroundColor: t.superfice,
    },
    btnRimuoviFoto: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: t.carta,
      borderRadius: 11,
    },
  });
}
