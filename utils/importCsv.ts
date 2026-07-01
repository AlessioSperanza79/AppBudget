// ── Parsing di un CSV di transazioni (proprio export dell'app o estratto conto semplice) ──
import { Categoria, Istituto, TipoTransazione } from '../types';

export interface RigaCsvParsata {
  importo: number;
  tipo: TipoTransazione;
  data: string; // ISO "YYYY-MM-DD"
  nomeCategoria: string;
  nota?: string;
  tag?: string;
  istitutoId?: string;
}

export interface RisultatoImportCsv {
  righe: RigaCsvParsata[];
  categorieNuove: string[]; // nomi non presenti tra le categorie esistenti
  errori: string[];         // una voce per ogni riga scartata, con il motivo
  totaleRighe: number;      // righe dati nel file (esclusa l'intestazione)
}

const MESI_IT: Record<string, number> = {
  gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
  lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11,
};

function parseData(valore: string): string | null {
  const v = valore.trim();

  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return v;

  // DD/MM/YYYY oppure DD-MM-YYYY (formato più comune negli estratti conto)
  m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, gg, mm, aaaa] = m;
    return `${aaaa}-${mm.padStart(2, '0')}-${gg.padStart(2, '0')}`;
  }

  // "5 giu 2026" — formato prodotto dall'export CSV dell'app stessa
  m = v.match(/^(\d{1,2})\s+([a-zàèìòù]{3})[a-zàèìòù]*\s+(\d{4})$/i);
  if (m) {
    const [, gg, meseAbbr, aaaa] = m;
    const mese = MESI_IT[meseAbbr.toLowerCase()];
    if (mese == null) return null;
    return `${aaaa}-${String(mese + 1).padStart(2, '0')}-${gg.padStart(2, '0')}`;
  }

  return null;
}

function parseImporto(valore: string): number | null {
  const pulito = valore.trim().replace(/[€\s]/g, '');
  if (!pulito) return null;

  // Se compaiono sia punto che virgola, il punto è separatore delle migliaia
  const normalizzato = pulito.includes(',') && pulito.includes('.')
    ? pulito.replace(/\./g, '').replace(',', '.')
    : pulito.replace(',', '.');

  const n = parseFloat(normalizzato);
  return isNaN(n) ? null : n;
}

// Divide una riga CSV rispettando i campi tra virgolette
function splitRigaCsv(riga: string, separatore: string): string[] {
  const campi: string[] = [];
  let corrente = '';
  let dentroVirgolette = false;
  for (let i = 0; i < riga.length; i++) {
    const ch = riga[i];
    if (ch === '"') {
      if (dentroVirgolette && riga[i + 1] === '"') { corrente += '"'; i++; }
      else dentroVirgolette = !dentroVirgolette;
    } else if (ch === separatore && !dentroVirgolette) {
      campi.push(corrente);
      corrente = '';
    } else {
      corrente += ch;
    }
  }
  campi.push(corrente);
  return campi.map((c) => c.trim());
}

const normalizza = (s: string) => s.trim().toLowerCase();

export function parseCsvTransazioni(
  testo: string,
  categorie: Categoria[],
  istituti: Istituto[],
): RisultatoImportCsv {
  const contenuto = testo.replace(/^﻿/, '').trim();
  const righeTesto = contenuto.split(/\r?\n/).filter((r) => r.trim() !== '');

  if (righeTesto.length < 2) {
    return { righe: [], categorieNuove: [], errori: ['Il file è vuoto o privo di righe di dati.'], totaleRighe: 0 };
  }

  const separatore = righeTesto[0].includes(';') ? ';' : ',';
  const intestazioni = splitRigaCsv(righeTesto[0], separatore).map(normalizza);
  const indice = (nomi: string[]) => nomi.map((n) => intestazioni.indexOf(n)).find((i) => i >= 0) ?? -1;

  const idxData      = indice(['data']);
  const idxTipo       = indice(['tipo']);
  const idxCategoria = indice(['categoria']);
  const idxImporto   = indice(['importo']);
  const idxNota      = indice(['nota', 'note', 'descrizione']);
  const idxTag       = indice(['tag', 'etichetta']);
  const idxConto     = indice(['conto', 'istituto']);

  if (idxData < 0 || idxImporto < 0) {
    return {
      righe: [], categorieNuove: [],
      errori: ['Intestazioni non riconosciute: servono almeno le colonne "Data" e "Importo".'],
      totaleRighe: 0,
    };
  }

  const righe: RigaCsvParsata[] = [];
  const errori: string[] = [];
  const categorieNuoveSet = new Set<string>();
  const mappaCategorie = new Map(categorie.map((c) => [normalizza(c.nome), c] as const));

  for (let i = 1; i < righeTesto.length; i++) {
    const numeroRiga = i + 1;
    const campi = splitRigaCsv(righeTesto[i], separatore);

    const dataGrezza = campi[idxData] ?? '';
    const data = parseData(dataGrezza);
    if (!data) { errori.push(`Riga ${numeroRiga}: data non valida ("${dataGrezza}").`); continue; }

    const importoGrezzo = campi[idxImporto] ?? '';
    const importoParsato = parseImporto(importoGrezzo);
    if (importoParsato == null) { errori.push(`Riga ${numeroRiga}: importo non valido ("${importoGrezzo}").`); continue; }
    if (importoParsato === 0) { errori.push(`Riga ${numeroRiga}: importo pari a zero, riga ignorata.`); continue; }

    const tipo: TipoTransazione = idxTipo >= 0 && campi[idxTipo]
      ? (normalizza(campi[idxTipo]).startsWith('e') ? 'entrata' : 'uscita')
      : (importoParsato < 0 ? 'uscita' : 'entrata');

    const nomeCategoria = idxCategoria >= 0 ? (campi[idxCategoria] ?? '') : '';
    if (!nomeCategoria) { errori.push(`Riga ${numeroRiga}: categoria mancante, riga ignorata.`); continue; }
    if (!mappaCategorie.has(normalizza(nomeCategoria))) categorieNuoveSet.add(nomeCategoria);

    const nota = idxNota >= 0 ? (campi[idxNota] ?? '') : '';
    const tag = idxTag >= 0 ? (campi[idxTag] ?? '') : '';
    const nomeConto = idxConto >= 0 ? (campi[idxConto] ?? '') : '';
    const istituto = nomeConto ? istituti.find((ist) => normalizza(ist.nome) === normalizza(nomeConto)) : undefined;

    righe.push({
      importo: Math.abs(importoParsato),
      tipo,
      data,
      nomeCategoria,
      ...(nota && { nota }),
      ...(tag && { tag }),
      ...(istituto && { istitutoId: istituto.id }),
    });
  }

  return { righe, categorieNuove: [...categorieNuoveSet], errori, totaleRighe: righeTesto.length - 1 };
}
