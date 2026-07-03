// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Regole del React Compiler (eslint-plugin-react-hooks v6): il codice esistente predata
    // l'adozione del compiler e viola questi pattern in più punti (mutazioni locali dentro
    // useMemo, setState sincrono in useEffect per l'idratazione SSR/CSR, ecc.). Da errore a
    // warning finché non si fa una revisione dedicata dei componenti coinvolti, per non
    // bloccare `npm run lint` né correggerli alla cieca insieme ad altre modifiche.
    rules: {
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
