import { useEffect, useState } from 'react'
import { choisirIndice, metierHorsListe, INDICES, serieConnue } from './indices.js'

// Séries INSEE utiles au devis : l'index du métier (main-d'œuvre) + l'index propre à chaque élément du catalogue
// (matériaux : prix de production INSEE). Renvoie null tant que rien n'est disponible (fonction coupée,
// INSEE injoignable…) : le devis fonctionne alors normalement, sans suggestion.
// Métier « Autre » : l'IA le rattache UNE fois à un index de la liste ; le choix est gardé dans l'entreprise.
const CLE = 'easyfact-marche-v2'
const DUREE = 6 * 3600 * 1000
const lireCache = () => { try { const c = JSON.parse(sessionStorage.getItem(CLE) || 'null'); return c && Date.now() - c.t < DUREE ? c.series : {} } catch { return {} } }
const ecrireCache = (series) => { try { sessionStorage.setItem(CLE, JSON.stringify({ t: Date.now(), series })) } catch { /* ignore */ } }

export function useMarche(entreprise, saveEntreprise, prestations = []) {
  const [series, setSeries] = useState(null)
  const metiers = entreprise?.metiers || []
  const hors = metierHorsListe(metiers)
  const choix = choisirIndice(metiers, entreprise?.indiceAutre)
  const codes = [...new Set([choix.code, ...prestations.map((p) => p.indice).filter(serieConnue)])].sort()
  const cle = codes.join(',')

  // 1) Métier hors liste pas encore classé : on demande à l'IA (une seule fois par métier).
  useEffect(() => {
    if (!hors || choix.origine === 'ia') return
    let fini = false
    fetch('/api/marche', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metier: hors }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!fini && j?.indice && INDICES[j.indice]) saveEntreprise({ indiceAutre: { metier: hors, code: j.indice } }) })
      .catch(() => {})
    return () => { fini = true }
  }, [hors, choix.origine]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2) Séries manquantes (une seule requête groupée).
  useEffect(() => {
    let fini = false
    const enCache = lireCache()
    const manquants = codes.filter((c) => !enCache[c])
    if (!manquants.length) { setSeries(enCache); return }
    fetch('/api/marche?indices=' + encodeURIComponent(manquants.join(',')))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (fini) return
        const tout = { ...enCache, ...(j?.series || {}) }
        ecrireCache(tout)
        setSeries(tout)
      })
      .catch(() => { if (!fini && Object.keys(enCache).length) setSeries(enCache) })
    return () => { fini = true }
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!series || !series[choix.code] && !codes.some((c) => series[c])) return null
  return { defaut: choix.code, origine: choix.origine, metier: choix.metier, series }
}
