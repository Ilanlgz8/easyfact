import { useEffect, useState } from 'react'
import { choisirIndice, metierHorsListe, INDICES } from './indices.js'

// Index INSEE à utiliser pour cette entreprise + sa série. Renvoie null tant que rien n'est disponible
// (fonction coupée, INSEE injoignable…) : le devis fonctionne alors normalement, sans suggestion.
// Métier « Autre » : l'IA le rattache UNE fois à un index de la liste ; le choix est gardé dans l'entreprise.
const CLE = 'easyfact-marche'
const lireCache = (code) => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CLE) || 'null')
    return c && c.code === code && Date.now() - c.t < 6 * 3600 * 1000 ? c.donnees : null
  } catch { return null }
}
const ecrireCache = (code, donnees) => { try { sessionStorage.setItem(CLE, JSON.stringify({ code, t: Date.now(), donnees })) } catch { /* ignore */ } }

export function useMarche(entreprise, saveEntreprise) {
  const [marche, setMarche] = useState(null)
  const metiers = entreprise?.metiers || []
  const hors = metierHorsListe(metiers)
  const choix = choisirIndice(metiers, entreprise?.indiceAutre)

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

  // 2) Série de l'index retenu.
  useEffect(() => {
    let fini = false
    const enCache = lireCache(choix.code)
    if (enCache) { setMarche({ ...enCache, origine: choix.origine, metier: choix.metier }); return }
    fetch('/api/marche?indice=' + encodeURIComponent(choix.code))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (fini || !j?.serie?.length) return
        ecrireCache(choix.code, j)
        setMarche({ ...j, origine: choix.origine, metier: choix.metier })
      })
      .catch(() => {})
    return () => { fini = true }
  }, [choix.code, choix.origine, choix.metier])

  return marche
}
