import { Categoria } from '../types';

// Categorie già presenti quando si apre l'app per la prima volta.
// L'utente potrà aggiungerne di nuove o rinominare queste dalla schermata Categorie.
export const CATEGORIE_DEFAULT: Categoria[] = [
  { id: 'stipendio',   nome: 'Stipendio',       colore: '#2E7D32', tipo: 'variabile' },
  { id: 'extra',       nome: 'Entrate extra',   colore: '#66BB6A', tipo: 'variabile' },
  { id: 'cibo',        nome: 'Cibo & Spesa',    colore: '#E53935', tipo: 'variabile' },
  { id: 'casa',        nome: 'Casa & Affitto',  colore: '#1565C0', tipo: 'fissa'     },
  { id: 'trasporti',   nome: 'Trasporti',       colore: '#F57F17', tipo: 'variabile' },
  { id: 'salute',      nome: 'Salute',          colore: '#6A1B9A', tipo: 'variabile' },
  { id: 'svago',       nome: 'Svago',           colore: '#00838F', tipo: 'variabile' },
  { id: 'shopping',    nome: 'Shopping',        colore: '#AD1457', tipo: 'variabile' },
  { id: 'bollette',    nome: 'Bollette',        colore: '#BF360C', tipo: 'fissa'     },
  { id: 'altro',       nome: 'Altro',           colore: '#78909C', tipo: 'variabile' },
];
