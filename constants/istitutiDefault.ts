import { Istituto } from '../types';

// Istituti precaricati al primo avvio. L'utente può aggiungerne altri dalla schermata Categorie.
export const ISTITUTI_DEFAULT: Istituto[] = [
  { id: 'intesa',    nome: 'Intesa Sanpaolo' },
  { id: 'unicredit', nome: 'UniCredit' },
  { id: 'fineco',    nome: 'FinecoBank' },
  { id: 'revolut',   nome: 'Revolut' },
  { id: 'n26',       nome: 'N26' },
  { id: 'poste',     nome: 'PostePay' },
];
