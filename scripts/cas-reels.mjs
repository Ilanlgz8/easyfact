// Lance les 20 cas contre le vrai modèle OVH. À lancer à la main, clé dans l'environnement :
//   PowerShell : $env:OVH_AI_ENDPOINTS_ACCESS_TOKEN = '...'; npm run test:ia
// La clé n'est jamais affichée. Arrêt automatique si le coût estimé dépasse BUDGET_EUR.
// Prix par million de tokens : à confirmer sur la fiche OVH (par défaut, valeurs hautes prudentes).
import { writeFileSync } from 'node:fs'
import { extraireTravaux, MODELE, PROMPT_VERSION } from '../src/devis/appelModele.js'
import { cas, catalogue, evaluer } from '../tests/cas.js'

const cle = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN
if (!cle) { console.error('OVH_AI_ENDPOINTS_ACCESS_TOKEN absente : rien n\'est lancé.'); process.exit(1) }
const PRIX_ENTREE = Number(process.env.PRIX_ENTREE_M ?? 0.09)
const PRIX_SORTIE = Number(process.env.PRIX_SORTIE_M ?? 0.28)
const BUDGET = Number(process.env.BUDGET_EUR ?? 5)

let tokIn = 0, tokOut = 0, attenduesTot = 0, exactesTot = 0
const cout = () => (tokIn * PRIX_ENTREE + tokOut * PRIX_SORTIE) / 1e6
const lignes = []

let detailAffiche = false, messageOvh = null
for (const c of cas) {
  if (cout() >= BUDGET) { console.error('Budget atteint, arrêt.'); break }
  let fetchFn = fetch
  if (c.reponseSimulee) { let i = 0; fetchFn = async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: c.reponseSimulee[i++] } }] }) }) }
  const t0 = Date.now()
  const r = await extraireTravaux(c.texte, catalogue, { cle, fetchFn, metiers: ['Plombier'] })
  const ms = Date.now() - t0
  for (const u of r.usages || []) { tokIn += u.prompt_tokens || 0; tokOut += u.completion_tokens || 0 }
  if (r.detail && !detailAffiche) { console.log('Message OVH :', r.detail); messageOvh = r.detail; detailAffiche = true }
  const e = evaluer(c, r)
  if (e.lignesAttendues) { attenduesTot += e.lignesAttendues; exactesTot += e.lignesExactes }
  lignes.push({ n: c.n, type: c.type, entree: c.texte, attendu: c.attendu, obtenu: e.detail, reussite: e.ok, ms, tentatives: r.tentatives, simule: !!c.reponseSimulee })
  console.log(`${String(c.n).padStart(2)} ${e.ok ? 'OK   ' : 'ECHEC'} ${String(ms).padStart(5)} ms  ${c.type} | ${e.detail}`)
}

const reels = lignes.filter((l) => !l.simule && l.tentatives > 0)
const tps = reels.map((l) => l.ms).sort((a, b) => a - b)
const bilan = {
  reussis: lignes.filter((l) => l.reussite).length, total: lignes.length,
  lignes_attendues_exactes: `${exactesTot}/${attenduesTot} (${attenduesTot ? Math.round(100 * exactesTot / attenduesTot) : 0} %)`,
  modele: MODELE, prompt: PROMPT_VERSION,
  tokens: { entree: tokIn, sortie: tokOut },
  cout_estime: `${cout().toFixed(5)} (unité des prix utilisés : ${PRIX_ENTREE}/${PRIX_SORTIE} par M tokens)`,
  temps_ms: tps.length ? { median: tps[Math.floor(tps.length / 2)], max: tps.at(-1) } : null,
}
console.log('\n' + JSON.stringify(bilan, null, 2))
writeFileSync('resultats-cas.json', JSON.stringify({ date: new Date().toISOString(), messageOvh, bilan, lignes }, null, 2))
