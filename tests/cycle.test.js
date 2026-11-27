import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creerDevis, nouvelleVersion, prochainNumero, derniereVersion } from '../src/devis/cycle.js'

const entreprise = { nom: 'Entreprise Test', siret: '000' }
const client = { id: 'c1', nom: 'Client Test' }
const doc = { clientId: 'c1', objet: 'Objet', tva: 10, lignes: [{ label: 'A', qte: 1, prix: 100 }] }
const etat0 = { devis: [{ id: 'd1', numero: '025', statut: 'attente', lignes: [] }] }
const opts = (cle, id = 'n' + cle) => ({ id, date: '2026-11-27', cle, entreprise, client })

test('numéro suivant = max + 1 sur 3 chiffres', () => {
  assert.equal(prochainNumero([{ numero: '009' }, { numero: '025' }]), '026')
  assert.equal(prochainNumero([]), '001')
})

test('double validation (même clé) : un seul devis, même numéro', () => {
  const r1 = creerDevis(etat0, doc, opts('k1'))
  const r2 = creerDevis(r1.etat, doc, opts('k1', 'autre-id'))
  assert.equal(r2.dejaFait, true)
  assert.equal(r2.etat.devis.length, 2)
  assert.equal(r2.devis.id, r1.devis.id)
  assert.equal(r1.devis.numero, '026')
})

test('deux validations différentes : numéros distincts', () => {
  const r1 = creerDevis(etat0, doc, opts('k1'))
  const r2 = creerDevis(r1.etat, doc, opts('k2'))
  assert.notEqual(r1.devis.numero, r2.devis.numero)
})

test('validation sans clé refusée', () => {
  assert.equal(creerDevis(etat0, doc, { ...opts('x'), cle: '' }).erreur, 'clé manquante')
})

test('devis figé : copie de l\'entreprise, du client et des lignes', () => {
  const e = { ...entreprise }
  const lignes = [{ label: 'A', qte: 1, prix: 100 }]
  const r = creerDevis(etat0, { ...doc, lignes }, { ...opts('k1'), entreprise: e })
  e.nom = 'Changé'
  lignes[0].prix = 999
  assert.equal(r.devis.fige.entreprise.nom, 'Entreprise Test')
  assert.equal(r.devis.fige.client.nom, 'Client Test')
  assert.equal(r.devis.lignes[0].prix, 100)
})

test('nouvelle version : même numéro, version + 1, ancienne remplacée et conservée', () => {
  const r1 = creerDevis(etat0, doc, opts('k1'))
  const r2 = nouvelleVersion(r1.etat, r1.devis.id, { ...doc, tva: 20 }, opts('k2'))
  assert.equal(r2.devis.numero, r1.devis.numero)
  assert.equal(r2.devis.version, 2)
  const ancien = r2.etat.devis.find((d) => d.id === r1.devis.id)
  assert.equal(ancien.statut, 'remplace')
  assert.equal(ancien.tva, 10)
  assert.equal(derniereVersion(r2.etat.devis, r1.devis.id).id, r2.devis.id)
})

test('nouvelle version idempotente (double clic)', () => {
  const r1 = creerDevis(etat0, doc, opts('k1'))
  const r2 = nouvelleVersion(r1.etat, r1.devis.id, doc, opts('k2'))
  const r3 = nouvelleVersion(r2.etat, r1.devis.id, doc, opts('k2', 'autre'))
  assert.equal(r3.dejaFait, true)
  assert.equal(r3.etat.devis.length, r2.etat.devis.length)
})

test('verrou : modifier un devis déjà remplacé (autre onglet) = conflit', () => {
  const r1 = creerDevis(etat0, doc, opts('k1'))
  const r2 = nouvelleVersion(r1.etat, r1.devis.id, doc, opts('k2'))
  const r3 = nouvelleVersion(r2.etat, r1.devis.id, doc, opts('k3'))
  assert.equal(r3.erreur, 'conflit')
})

test('devis facturé non modifiable', () => {
  const etat = { devis: [{ id: 'd9', numero: '009', statut: 'facture' }] }
  assert.equal(nouvelleVersion(etat, 'd9', doc, opts('k1')).erreur, 'conflit')
})

test('devis introuvable', () => {
  assert.equal(nouvelleVersion(etat0, 'zz', doc, opts('k1')).erreur, 'introuvable')
})
