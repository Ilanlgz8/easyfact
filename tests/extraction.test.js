// Tests sans appel réel au modèle : le fetch est simulé.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validerReponse, versLignes, consigne } from '../src/devis/extraction.js'
import { extraireTravaux } from '../src/devis/appelModele.js'
import { catalogue, cas, evaluer } from './cas.js'

const repModele = (content, usage = { prompt_tokens: 400, completion_tokens: 60 }) =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }], usage }) })

test('JSON valide accepté, prix venant du catalogue', () => {
  const v = validerReponse('{"travaux":[{"prestationId":"p3","libelle":"mitigeur","quantite":2}]}', catalogue)
  assert.equal(v.ok, true)
  assert.deepEqual(versLignes(v.travaux, catalogue), [{ label: 'Pose d’un mitigeur', qte: 2, prix: 80 }])
})
test('bloc ```json``` accepté', () => {
  assert.equal(validerReponse('```json\n{"travaux":[]}\n```', catalogue).ok, true)
})
test('hors catalogue : prix null, signalé', () => {
  const v = validerReponse('{"travaux":[{"prestationId":null,"libelle":"Pompe à chaleur","quantite":1}]}', catalogue)
  assert.deepEqual(versLignes(v.travaux, catalogue), [{ label: 'Pompe à chaleur', qte: 1, prix: null, custom: true, horsCatalogue: true }])
})
test('identifiant inventé par le modèle => hors catalogue, pas de prix', () => {
  const v = validerReponse('{"travaux":[{"prestationId":"p99","libelle":"WC","quantite":1}]}', catalogue)
  assert.equal(v.travaux[0].prestationId, null)
  assert.equal(versLignes(v.travaux, catalogue)[0].prix, null)
})
test('prix renvoyé par le modèle : ignoré', () => {
  const v = validerReponse('{"travaux":[{"prestationId":"p3","libelle":"m","quantite":1,"prix":1}]}', catalogue)
  assert.equal(versLignes(v.travaux, catalogue)[0].prix, 80)
  assert.equal('prix' in v.travaux[0], false)
})
for (const [nom, brut] of [
  ['texte libre', 'Voici votre devis'], ['tableau', '[]'], ['travaux absent', '{"lignes":[]}'],
  ['quantité négative', '{"travaux":[{"prestationId":"p1","quantite":-2}]}'],
  ['quantité texte', '{"travaux":[{"prestationId":"p1","quantite":"beaucoup"}]}'],
  ['quantité énorme', '{"travaux":[{"prestationId":"p1","quantite":99999}]}'],
  ['hors catalogue sans libellé', '{"travaux":[{"prestationId":null,"quantite":1}]}'],
  ['contenu absent', undefined],
]) test(`réponse invalide rejetée : ${nom}`, () => assert.equal(validerReponse(brut, catalogue).ok, false))

test('la consigne n\'envoie aucun prix au modèle', () => {
  const c = consigne(catalogue)
  assert.equal(/€|\b280\b|\b45\b/.test(c), false)
})

test('réponse invalide puis valide : 1 réessai, succès', async () => {
  const reps = ['n\'importe quoi', '{"travaux":[{"prestationId":"p5","libelle":"fuite","quantite":1}]}']
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'test', fetchFn: async () => repModele(reps[n++]) })
  assert.equal(r.ok, true); assert.equal(r.tentatives, 2); assert.equal(n, 2)
})
test('deux réponses invalides : arrêt après 1 réessai (saisie manuelle)', async () => {
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'test', fetchFn: async () => { n++; return repModele('KO') } })
  assert.equal(r.ok, false); assert.equal(n, 2)
})
test('erreur HTTP 401 : échec propre', async () => {
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => ({ ok: false, status: 401 }) })
  assert.deepEqual([r.ok, r.erreur], [false, 'HTTP 401'])
})
test('réseau coupé : échec propre', async () => {
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => { throw new TypeError('fetch failed') } })
  assert.deepEqual([r.ok, r.erreur], [false, 'erreur réseau'])
})
test('texte vide : aucun appel au modèle', async () => {
  let n = 0
  const r = await extraireTravaux('   ', catalogue, { cle: 'x', fetchFn: async () => { n++ } })
  assert.equal(r.ok, false); assert.equal(n, 0)
})

// Cas 16, 17 et 20 : vérifiables sans modèle.
for (const c of cas.filter((c) => c.attendu.manuel)) {
  test(`cas ${c.n} (${c.type}) hors ligne`, async () => {
    let n = 0
    const r = await extraireTravaux(c.texte, catalogue, { cle: 'x', fetchFn: async () => repModele(c.reponseSimulee?.[n++] ?? '{}') })
    assert.equal(evaluer(c, r).ok, true)
  })
}
