// Transcription : fetch simulé, aucun appel réel.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transcrire, nettoyerTexte, AUDIO_MAX_OCTETS } from '../src/devis/transcription.js'

const audio = new Uint8Array([1, 2, 3])
const ok = (text) => ({ ok: true, status: 200, json: async () => ({ text, usage: { seconds: 3 } }) })

test('texte transcrit renvoyé', async () => {
  const r = await transcrire(audio, 'audio/webm;codecs=opus', { cle: 'x', fetchFn: async () => ok(' Changer le chauffe-eau. ') })
  assert.deepEqual([r.ok, r.texte, r.secondes], [true, 'Changer le chauffe-eau.', 3])
})
test('requête : modèle whisper turbo, langue fr, fichier joint', async () => {
  let corps
  await transcrire(audio, 'audio/webm', { cle: 'x', fetchFn: async (u, o) => { corps = o.body; return ok('a') } })
  assert.equal(corps.get('model'), 'whisper-large-v3-turbo')
  assert.equal(corps.get('language'), 'fr')
  assert.ok(corps.get('file'))
})
test('silence : phrase inventée par Whisper ignorée', () => {
  assert.equal(nettoyerTexte(' Sous-titrage MFP.'), '')
  assert.equal(nettoyerTexte('Merci d\'avoir regardé cette vidéo'), '')
  assert.equal(nettoyerTexte('  ...  '), '')
  assert.equal(nettoyerTexte('Poser deux mitigeurs'), 'Poser deux mitigeurs')
})
test('audio vide, trop long ou format refusé : aucun appel', async () => {
  let n = 0
  const f = async () => { n++; return ok('x') }
  assert.equal((await transcrire(new Uint8Array(0), 'audio/webm', { cle: 'x', fetchFn: f })).erreur, 'audio vide')
  assert.equal((await transcrire(new Uint8Array(AUDIO_MAX_OCTETS + 1), 'audio/webm', { cle: 'x', fetchFn: f })).erreur, 'audio trop long')
  assert.equal((await transcrire(audio, 'video/mp4', { cle: 'x', fetchFn: f })).erreur, 'format audio refusé')
  assert.equal(n, 0)
})
test('erreur serveur 5xx : un seul réessai', async () => {
  let n = 0
  const r = await transcrire(audio, 'audio/webm', { cle: 'x', fetchFn: async () => { n++; return { ok: false, status: 503 } } })
  assert.deepEqual([r.ok, r.erreur, n], [false, 'HTTP 503', 2])
})
test('401 / 429 : pas de réessai', async () => {
  for (const status of [401, 429]) {
    let n = 0
    const r = await transcrire(audio, 'audio/webm', { cle: 'x', fetchFn: async () => { n++; return { ok: false, status } } })
    assert.deepEqual([r.erreur, n], [`HTTP ${status}`, 1])
  }
})
test('réseau coupé puis succès', async () => {
  let n = 0
  const r = await transcrire(audio, 'audio/webm', { cle: 'x', fetchFn: async () => { if (n++ === 0) throw new TypeError('fetch failed'); return ok('ok') } })
  assert.deepEqual([r.ok, r.tentatives], [true, 2])
})
