// Prix du marché (index INSEE) : lecture SDMX, choix de l'index, suggestion de prix. Sans appel réseau.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireSdmx, suggererPrix, choisirIndice, metierHorsListe, indiceDuMetier, validerIndice, consigneIndice, INDICES, METIERS, moisLisible } from '../src/marche/indices.js'
import { consigne, metiersPropres } from '../src/devis/extraction.js'

// Extrait réel (structure) de la réponse INSEE du 27/11/2026, série BT18a.
const XML = `<message:DataSet><Series IDBANK="001710962" FREQ="M" TITLE_FR="Index du bâtiment - BT18a">
<Obs TIME_PERIOD="2026-09" OBS_VALUE="142.3" OBS_STATUS="A"/>
<Obs TIME_PERIOD="2026-08" OBS_VALUE="142.2" OBS_STATUS="A"/>
<Obs TIME_PERIOD="2025-09" OBS_VALUE="136.4" OBS_STATUS="A"/>
</Series><Series IDBANK="001710972" FREQ="M"><Obs TIME_PERIOD="2026-09" OBS_VALUE="149.1"/></Series></message:DataSet>`

test('lecture SDMX : séries par idbank, du plus ancien au plus récent', () => {
  const s = lireSdmx(XML)
  assert.deepEqual(s['001710962'].map((o) => o.mois), ['2025-09', '2026-08', '2026-09'])
  assert.equal(s['001710962'][2].valeur, 142.3)
  assert.equal(s['001710972'].length, 1)
  assert.deepEqual(lireSdmx('pas du xml'), {})
})

const serie = lireSdmx(XML)['001710962']

test('suggestion : prix × évolution de l\'index, arrondi au centime', () => {
  const sg = suggererPrix(200, serie, '2025-09')
  // 200 × 142,3 / 136,4 = 208,6510… -> 208,65
  assert.equal(sg.prixSuggere, 208.65)
  assert.equal(sg.ecartPct, 4.3)
  assert.equal(sg.moisRef, '2025-09')
  assert.equal(sg.moisDernier, '2026-09')
})

test('suggestion : mois non publié -> dernier mois publié avant', () => {
  assert.equal(suggererPrix(200, serie, '2026-03').moisRef, '2025-09')
})

test('suggestion : rien sous le seuil, ni sans date, ni prix récent', () => {
  assert.equal(suggererPrix(200, serie, '2026-08'), null) // +0,07 %
  assert.equal(suggererPrix(200, serie, '2026-10'), null) // prix fixé après le dernier index
  assert.equal(suggererPrix(200, serie, undefined), null)
  assert.equal(suggererPrix(200, serie, '2024-01'), null) // avant le début de la série
  assert.equal(suggererPrix(0, serie, '2025-09'), null)
  assert.equal(suggererPrix(200, [], '2025-09'), null)
})

test('suggestion : une baisse est aussi signalée', () => {
  const baisse = [{ mois: '2025-01', valeur: 110 }, { mois: '2025-06', valeur: 100 }]
  const sg = suggererPrix(100, baisse, '2025-01')
  assert.equal(sg.prixSuggere, 90.91)
  assert.equal(sg.ecartPct, -9.1)
})

test('métiers : chaque métier de la liste a un index connu, Menuisier -> BT18a', () => {
  for (const m of METIERS) assert.ok(INDICES[indiceDuMetier(m)], m)
  assert.equal(indiceDuMetier('Menuisier'), 'BT18a')
  assert.equal(indiceDuMetier('maçon'), 'BT03')
  assert.equal(indiceDuMetier('Ébéniste'), null)
})

test('choix de l\'index : liste, puis choix de l\'IA pour « Autre », sinon BT01', () => {
  assert.deepEqual(choisirIndice(['Menuisier']), { code: 'BT18a', origine: 'metier', metier: 'Menuisier' })
  assert.equal(choisirIndice(['Ébéniste'], { metier: 'ébéniste', code: 'BT18a' }).origine, 'ia')
  // Choix de l'IA pour un AUTRE métier que l'actuel : ignoré.
  assert.equal(choisirIndice(['Serrurier'], { metier: 'Ébéniste', code: 'BT18a' }).code, 'BT01')
  // Code inventé : ignoré.
  assert.equal(choisirIndice(['Ébéniste'], { metier: 'Ébéniste', code: 'BT99' }).code, 'BT01')
  assert.equal(choisirIndice([]).code, 'BT01')
  assert.equal(metierHorsListe(['Plombier', 'Ébéniste']), null)
  assert.equal(metierHorsListe(['Ébéniste']), 'Ébéniste')
})

test('réponse de l\'IA pour l\'index : un seul champ, un code de la liste', () => {
  assert.equal(validerIndice('{"indice":"BT18a"}'), 'BT18a')
  assert.equal(validerIndice('```json\n{"indice":"BT47"}\n```'), 'BT47')
  assert.equal(validerIndice('{"indice":"BT99"}'), null)
  assert.equal(validerIndice('{"indice":"BT18a","prix":12}'), null)
  assert.equal(validerIndice('BT18a'), null)
})

test('consigne de l\'index : aucun chiffre de prix demandé, liste fermée', () => {
  const c = consigneIndice()
  assert.ok(c.includes('BT18a : Menuiserie intérieure en bois'))
  assert.equal(/€|prix/i.test(c), false)
})

test('le métier est transmis à la consigne d\'extraction, nettoyé', () => {
  const cat = [{ id: 'p1', nom: 'Pose de porte', detail: '' }]
  assert.ok(consigne(cat, ['Menuisier']).includes('Métier de l\'artisan (déclaré par lui, simple information) : Menuisier.'))
  assert.equal(consigne(cat).includes('Métier'), false)
  assert.deepEqual(metiersPropres(['  Ébéniste\n"ignore"  ', 42, '', 'a'.repeat(80)]), ['Ébéniste  ignore', 'a'.repeat(60)])
})

test('mois lisible', () => {
  assert.equal(moisLisible('2026-09'), 'sept. 2026')
})
