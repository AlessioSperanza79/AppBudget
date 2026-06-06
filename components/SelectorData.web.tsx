// Versione WEB — usa l'input HTML nativo del browser
// Metro sceglie automaticamente questo file quando compila per il web

interface Props {
  valore: string;               // data in formato ISO "YYYY-MM-DD"
  onChange: (nuovaData: string) => void;
}

export default function SelectorData({ valore, onChange }: Props) {
  return (
    // @ts-ignore — type="date" è un attributo HTML valido ma non riconosciuto dal tipo React Native
    <input
      type="date"
      value={valore}
      onChange={(e: { target: HTMLInputElement }) => onChange(e.target.value)}
      style={{
        border: '1px solid #DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#F5F5F5',
        color: '#333',
        width: '100%',
        boxSizing: 'border-box' as const,
        fontFamily: 'inherit',
      }}
    />
  );
}
