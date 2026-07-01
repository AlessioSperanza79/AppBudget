// ── Helper per notifiche locali: promemoria ricorrenti mensili e avvisi di budget superato ──
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ID_PROMEMORIA_RICORRENTI = 'promemoria-ricorrenti-mensile';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Le notifiche locali non sono disponibili nei browser web
export const notificheSupportate = Platform.OS !== 'web';

export async function richiediPermessiNotifiche(): Promise<boolean> {
  if (!notificheSupportate) return false;
  const attuale = await Notifications.getPermissionsAsync();
  if (attuale.granted) return true;
  const richiesta = await Notifications.requestPermissionsAsync();
  return richiesta.granted;
}

// Programma (in modo idempotente) il promemoria del giorno 1 di ogni mese per applicare
// i modelli ricorrenti senza data fine, che richiedono conferma manuale
export async function programmaPromemoriaRicorrenti(): Promise<void> {
  if (!notificheSupportate) return;
  const esistenti = await Notifications.getAllScheduledNotificationsAsync();
  if (esistenti.some((n) => n.identifier === ID_PROMEMORIA_RICORRENTI)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: ID_PROMEMORIA_RICORRENTI,
    content: {
      title: 'Transazioni ricorrenti da applicare',
      body: 'Controlla in Pianifica se ci sono modelli ricorrenti da applicare per il nuovo mese.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 9,
      minute: 0,
    },
  });
}

export async function annullaPromemoriaRicorrenti(): Promise<void> {
  if (!notificheSupportate) return;
  await Notifications.cancelScheduledNotificationAsync(ID_PROMEMORIA_RICORRENTI);
}

// Invia subito un avviso quando una categoria supera la soglia di budget
export async function inviaAvvisoBudget(nomeCategoria: string, percentuale: number): Promise<void> {
  if (!notificheSupportate) return;
  const superato = percentuale >= 100;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: superato ? 'Budget superato' : 'Budget quasi esaurito',
      body: superato
        ? `Hai superato il budget mensile per "${nomeCategoria}".`
        : `Hai raggiunto l'${Math.round(percentuale)}% del budget mensile per "${nomeCategoria}".`,
    },
    trigger: null, // invio immediato
  });
}

export async function annullaTutteLeNotifiche(): Promise<void> {
  if (!notificheSupportate) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
