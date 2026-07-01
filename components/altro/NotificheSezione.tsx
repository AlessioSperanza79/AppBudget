// ── Sezione "Notifiche" della schermata Altro: avvisi di budget e promemoria ricorrenti ──
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useNotifiche } from '../../store/useNotifiche';
import { annullaTutteLeNotifiche, notificheSupportate, richiediPermessiNotifiche } from '../../utils/notifiche';
import { useTema, Tema } from '../../constants/tema';

export default function NotificheSezione() {
  const abilitate = useNotifiche((s) => s.abilitate);
  const setAbilitate = useNotifiche((s) => s.setAbilitate);

  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  const [permessoNegato, setPermessoNegato] = useState(false);

  // Le notifiche locali non sono disponibili nei browser web: sezione nascosta lì
  if (!notificheSupportate) return null;

  const gestisciToggle = async (attivo: boolean) => {
    if (!attivo) {
      setAbilitate(false);
      await annullaTutteLeNotifiche();
      return;
    }
    const concesso = await richiediPermessiNotifiche();
    setPermessoNegato(!concesso);
    if (concesso) setAbilitate(true);
  };

  return (
    <View style={stili.contenitore}>
      <Text style={stili.titoloSezione}>Notifiche</Text>

      <View style={stili.riga}>
        <View style={{ flex: 1 }}>
          <Text style={stili.etichettaRiga}>Promemoria e avvisi</Text>
          <Text style={stili.descrizioneRiga}>
            Avvisa quando superi il budget di una categoria e ricorda di applicare le transazioni ricorrenti
          </Text>
        </View>
        <Switch value={abilitate} onValueChange={gestisciToggle} trackColor={{ true: t.primario }} />
      </View>

      {permessoNegato && (
        <Text style={stili.testoErrore}>
          Permesso negato. Abilita le notifiche per AppBudget nelle impostazioni del dispositivo.
        </Text>
      )}
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      backgroundColor: t.carta,
      margin: 16,
      marginBottom: 4,
      borderRadius: 20,
      padding: 18,
      gap: 14,
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    titoloSezione: {
      fontSize: 11,
      fontWeight: '700',
      color: t.piuSottile,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    etichettaRiga: {
      fontSize: 14,
      fontWeight: '500',
      color: t.corpo,
    },
    descrizioneRiga: {
      fontSize: 12,
      color: t.piuSottile,
      marginTop: 2,
    },
    testoErrore: {
      color: t.uscita,
      fontSize: 12,
    },
  });
}
