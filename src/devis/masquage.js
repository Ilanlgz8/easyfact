// Masquage avant envoi au modèle : noms de clients connus, e-mails, téléphones, adresses repérées.
// Remplacés par des marqueurs ([CLIENT_1], [EMAIL], [TELEPHONE], [ADRESSE]).
// ATTENTION : ce n'est pas une anonymisation. Un nom inconnu ou mal écrit peut passer.

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// Téléphones français : 06 12 34 56 78, 06.12.34.56.78, 0612345678, +33 6 12 34 56 78
const RE_TEL = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g
// Adresse : numéro + type de voie + nom, jusqu'à la virgule, au point ou à la fin de ligne.
const RE_ADRESSE = /\b\d{1,4}(?:\s?(?:bis|ter))?,?\s+(?:rue|avenue|av\.?|boulevard|bd|allée|allee|chemin|impasse|place|route|quai|cours|lotissement|résidence|residence)\b[^,.\n]{0,60}/gi
const RE_CP_VILLE = /\b\d{5}\s+[A-ZÉÈÀ][\p{L}' -]{1,40}/gu

// noms : liste des noms de clients connus (ex. « M. Martin », « SCI Exemple »).
export function masquer(texte, noms = []) {
  let t = String(texte || '')
  t = t.replace(RE_EMAIL, '[EMAIL]').replace(RE_TEL, '[TELEPHONE]').replace(RE_ADRESSE, '[ADRESSE]').replace(RE_CP_VILLE, '[ADRESSE]')
  // Noms complets puis nom de famille seul (« M. Martin » -> aussi « Martin »), du plus long au plus court.
  const variantes = []
  noms.forEach((nom, i) => {
    const n = String(nom || '').trim()
    if (n.length < 3) return
    variantes.push([n, i])
    const sansCivilite = n.replace(/^(m\.|mme|mlle|monsieur|madame)\s+/i, '').trim()
    if (sansCivilite !== n && sansCivilite.length >= 3) variantes.push([sansCivilite, i])
  })
  variantes.sort((a, b) => b[0].length - a[0].length)
  for (const [v, i] of variantes) t = t.replace(new RegExp(`(?<![\\p{L}])${echapper(v)}(?![\\p{L}])`, 'giu'), `[CLIENT_${i + 1}]`)
  return t
}
