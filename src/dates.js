// Dates des données d'exemple, calculées par rapport au jour de la démonstration (fuseau Europe/Paris) :
// la démo a toujours des devis « ce mois-ci », « le mois dernier » et plus anciens, quel que soit le jour.

const pad = (n) => String(n).padStart(2, '0')

// Jour courant à Paris, sous forme { y, m, d } (m de 1 à 12).
export function jourParis(ref = new Date()) {
  const [y, m, d] = ref.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }).split('-').map(Number)
  return { y, m, d }
}

// dateDemo(ref, { jours: 2 })          -> il y a 2 jours ('AAAA-MM-JJ')
// dateDemo(ref, { mois: 1, jour: 12 }) -> le 12 du mois précédent (ramené au dernier jour du mois si besoin)
export function dateDemo(ref, { jours, mois, jour }) {
  const { y, m, d } = jourParis(ref)
  if (jours !== undefined) {
    const t = new Date(Date.UTC(y, m - 1, d - jours))
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
  }
  const debut = new Date(Date.UTC(y, m - 1 - mois, 1))
  const Y = debut.getUTCFullYear()
  const M = debut.getUTCMonth() + 1
  const fin = new Date(Date.UTC(Y, M, 0)).getUTCDate()
  return `${Y}-${pad(M)}-${pad(Math.min(jour, fin))}`
}
