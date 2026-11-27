// Tests sans appel réel au modèle : le fetch est simulé.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validerReponse, versLignes, consigne, normaliser } from '../src/devis/extraction.js'
import { extraireTravaux } from '../src/devis/appelModele.js'
import { masquer } from '../src/devis/masquage.js'
import { catalogue, cas, evaluer } from './cas.js'

const repModele = (content, usage = { prompt_tokens: 400, completion_tokens: 60 }) =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }], usage }) })
const J = (lignes, im = []) => JSON.stringify({ lignes, informations_manquantes: im })

test('JSON valide accepté, prestation reconnue par son nom exact, prix venant du catalogue', () => {
  const v = validerReponse(J([{ libelle: 'Pose d’un mitigeur', quantite: 2, unite: null }]), catalogue)
  assert.equal(v.ok, true)
  assert.deepEqual(versLignes(v.travaux, catalogue), [{ label: 'Pose d’un mitigeur', qte: 2, prix: 80 }])
})
test('nom du catalogue avec apostrophe droite et majuscules : reconnu', () => {
  const v = validerReponse(J([{ libelle: "POSE D'UN MITIGEUR", quantite: 1, unite: null }]), catalogue)
  assert.equal(v.travaux[0].prestationId, 'p3')
})
test('bloc ```json``` accepté', () => {
  assert.equal(validerReponse('```json\n{"lignes":[],"informations_manquantes":[]}\n```', catalogue).ok, true)
})
test('hors catalogue : prix null, signalé', () => {
  const v = validerReponse(J([{ libelle: 'Pompe à chaleur', quantite: 1, unite: null }]), catalogue)
  assert.deepEqual(versLignes(v.travaux, catalogue), [{ label: 'Pompe à chaleur', qte: 1, prix: null, custom: true, horsCatalogue: true }])
})
test('quantité inconnue : null conservé (pas de quantité inventée), information manquante transmise', () => {
  const v = validerReponse(J([{ libelle: 'Main-d’œuvre', quantite: null, unite: 'h' }], ['Nombre d’heures non précisé']), catalogue)
  assert.equal(v.travaux[0].quantite, null)
  assert.deepEqual(v.informations_manquantes, ['Nombre d’heures non précisé'])
  assert.deepEqual(versLignes(v.travaux, catalogue), [{ label: 'Main-d’œuvre', qte: null, unite: 'h', prix: 45 }])
})
for (const [nom, brut] of [
  ['texte libre', 'Voici votre devis'], ['tableau', '[]'], ['lignes absent', '{"travaux":[]}'],
  ['champ prix dans une ligne', J([{ libelle: 'Pose d’un mitigeur', quantite: 1, unite: null, prix: 1 }])],
  ['champ total à la racine', '{"lignes":[],"informations_manquantes":[],"total":10}'],
  ['ancien format prestationId', J([{ prestationId: 'p3', libelle: 'm', quantite: 1 }])],
  ['quantité négative', J([{ libelle: 'x', quantite: -2, unite: null }])],
  ['quantité texte', J([{ libelle: 'x', quantite: '2', unite: null }])],
  ['quantité énorme', J([{ libelle: 'x', quantite: 99999, unite: null }])],
  ['libellé vide', J([{ libelle: '', quantite: 1, unite: null }])],
  ['unité non textuelle', J([{ libelle: 'x', quantite: 1, unite: 3 }])],
  ['informations_manquantes non textuelles', '{"lignes":[],"informations_manquantes":[1]}'],
  ['contenu absent', undefined],
]) test(`réponse invalide rejetée : ${nom}`, () => assert.equal(validerReponse(brut, catalogue).ok, false))

test('la consigne n\'envoie aucun prix au modèle', () => {
  assert.equal(/€|\b280\b|\b45\b|\b120\b/.test(consigne(catalogue)), false)
})
test('la consigne n\'est plus limitée à la plomberie', () => {
  assert.equal(/plombier/i.test(consigne(catalogue)), false)
})
test('normalisation', () => assert.equal(normaliser('  Pose D’un   Mitigeur '), "pose d'un mitigeur"))

const OK = J([{ libelle: 'Recherche de fuite', quantite: 1, unite: null }])
test('réponse invalide puis valide : 1 réessai, succès', async () => {
  const reps = ['n\'importe quoi', OK]
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'test', fetchFn: async () => repModele(reps[n++]) })
  assert.equal(r.ok, true); assert.equal(r.tentatives, 2); assert.equal(n, 2)
})
test('deux réponses invalides : arrêt après 1 réessai (saisie manuelle)', async () => {
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'test', fetchFn: async () => { n++; return repModele('KO') } })
  assert.equal(r.ok, false); assert.equal(n, 2)
})
test('erreur HTTP 401 : échec propre, sans réessai', async () => {
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => ({ ok: false, status: 401 }) })
  assert.deepEqual([r.ok, r.erreur, r.tentatives], [false, 'HTTP 401', 1])
})
const rep429 = (ra) => ({ ok: false, status: 429, headers: { get: (h) => (h === 'retry-after' && ra !== undefined ? String(ra) : null) }, text: async () => '' })
test('429 avec délai court : on attend le délai demandé puis 1 réessai', async () => {
  const reps = [rep429(2), repModele(OK)]
  let n = 0; let attendu = null
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => reps[n++], attendre: async (ms) => { attendu = ms } })
  assert.equal(r.ok, true); assert.equal(attendu, 2000); assert.equal(n, 2)
})
test('429 avec délai long : abandon immédiat (saisie manuelle), délai transmis', async () => {
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => { n++; return rep429(60) }, attendre: async () => assert.fail('ne doit pas attendre') })
  assert.deepEqual([r.ok, r.erreur, r.retryAfter, n], [false, 'HTTP 429', 60, 1])
})
test('429 deux fois : pas plus d\'un réessai', async () => {
  let n = 0
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => { n++; return rep429(1) }, attendre: async () => {} })
  assert.equal(r.ok, false); assert.equal(n, 2)
})
test('réseau coupé : échec propre', async () => {
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => { throw new TypeError('fetch failed') } })
  assert.deepEqual([r.ok, r.erreur], [false, 'erreur réseau'])
})
test('délai dépassé : échec propre', async () => {
  const e = new Error('t'); e.name = 'TimeoutError'
  const r = await extraireTravaux('fuite', catalogue, { cle: 'x', fetchFn: async () => { throw e } })
  assert.deepEqual([r.ok, r.erreur, r.tentatives], [false, 'délai dépassé', 2])
})
test('texte vide : aucun appel au modèle', async () => {
  let n = 0
  const r = await extraireTravaux('   ', catalogue, { cle: 'x', fetchFn: async () => { n++ } })
  assert.equal(r.ok, false); assert.equal(n, 0)
})

// Masquage
test('masquage : e-mail, téléphone, adresse, nom de client connu', () => {
  const t = masquer('M. Martin (martin@client.example, 06 39 98 00 01) au 4 allée Imaginaire, 20200 Bastia : fuite', ['M. Martin', 'SCI Exemple'])
  assert.equal(/martin|@|06 39|Imaginaire|Bastia/i.test(t), false, t)
  assert.ok(t.includes('[CLIENT_1]') && t.includes('[EMAIL]') && t.includes('[TELEPHONE]') && t.includes('[ADRESSE]'))
  assert.ok(t.endsWith(': fuite'))
})
test('masquage : nom de famille seul et formats +33', () => {
  const t = masquer('chez Durand, appeler le +33 6 12 34 56 78', ['M. Durand'])
  assert.equal(t, 'chez [CLIENT_1], appeler le [TELEPHONE]')
})
test('masquage : ne touche pas aux quantités ni aux mots proches', () => {
  assert.equal(masquer('pose de 2 mitigeurs, 1h30, chauffe-eau 200 L', ['M. Martin']), 'pose de 2 mitigeurs, 1h30, chauffe-eau 200 L')
  assert.equal(masquer('Martinez', ['M. Martin']), 'Martinez')
})

// Cas 16, 17 et 20 : vérifiables sans modèle.
for (const c of cas.filter((c) => c.attendu.manuel)) {
  test(`cas ${c.n} (${c.type}) hors ligne`, async () => {
    let n = 0
    const r = await extraireTravaux(c.texte, catalogue, { cle: 'x', fetchFn: async () => repModele(c.reponseSimulee?.[n++] ?? '{}') })
    assert.equal(evaluer(c, r).ok, true)
  })
}
