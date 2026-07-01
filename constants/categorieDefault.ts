import { Categoria } from '../types';
import { PALETTE_CATEGORIE } from './paletteCategorie';

// Categorie già presenti quando si apre l'app per la prima volta.
// L'utente potrà aggiungerne di nuove o rinominare queste dalla schermata Categorie.
// I colori sono presi dalla palette curata condivisa, distanziati per restare distinguibili
export const CATEGORIE_DEFAULT: Categoria[] = [
  { id: 'stipendio',   nome: 'Stipendio',       colore: PALETTE_CATEGORIE[6],  tipo: 'variabile' },
  { id: 'extra',       nome: 'Entrate extra',   colore: PALETTE_CATEGORIE[8],  tipo: 'variabile' },
  { id: 'cibo',        nome: 'Cibo & Spesa',    colore: PALETTE_CATEGORIE[0],  tipo: 'variabile' },
  { id: 'casa',        nome: 'Casa & Affitto',  colore: PALETTE_CATEGORIE[14], tipo: 'fissa'     },
  { id: 'trasporti',   nome: 'Trasporti',       colore: PALETTE_CATEGORIE[2],  tipo: 'variabile' },
  { id: 'salute',      nome: 'Salute',          colore: PALETTE_CATEGORIE[16], tipo: 'variabile' },
  { id: 'svago',       nome: 'Svago',           colore: PALETTE_CATEGORIE[10], tipo: 'variabile' },
  { id: 'shopping',    nome: 'Shopping',        colore: PALETTE_CATEGORIE[20], tipo: 'variabile' },
  { id: 'bollette',    nome: 'Bollette',        colore: PALETTE_CATEGORIE[23], tipo: 'fissa'     },
  { id: 'altro',       nome: 'Altro',           colore: PALETTE_CATEGORIE[12], tipo: 'variabile' },
];
