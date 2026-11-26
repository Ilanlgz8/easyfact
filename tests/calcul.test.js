import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculerTotaux, round2, blocagesValidation, totalLigne } from '../src/devis/calcul.js'

const L = (qte, prix) => ({ label: 'x', qte, prix })

test('HT, TVA 10 %, TTC simples', () => {
  assert.deepEqual(calculerTotaux([L(1, 280), L(1, 30)], 10), { ht: 310, tva: 31, ttc: 341 })
})
test('TVA 20 %', () => {
  assert.deepEqual(calculerTotaux([L(2, 80), L(3, 45)], 20), { ht: 295, tva: 59, ttc: 354 })
})
test('TVA 5,5 % avec arrondi au centime', () => {
  // 123,45 × 5,5 % = 6,78975 -> 6,79
  assert.deepEqual(calculerTotaux([L(1, 123.45)], 5.5), { ht: 123.45, tva: 6.79, ttc: 130.24 })
})
test('TVA 0 % (franchise)', () => {
  assert.deepEqual(calculerTotaux([L(1, 99.99)], 0), { ht: 99.99, tva: 0, ttc: 99.99 })
})
test('demi-centime arrondi vers le haut, sans erreur de virgule flottante', () => {
  assert.equal(round2(1.005), 1.01)
  assert.equal(round2(0.1 + 0.2), 0.3)
  // 10,05 × 10 % = 1,005 -> 1,01
  assert.deepEqual(calculerTotaux([L(1, 10.05)], 10), { ht: 10.05, tva: 1.01, ttc: 11.06 })
})
test('quantités décimales (1,5 h)', () => {
  assert.equal(totalLigne(L(1.5, 45)), 67.5)
  assert.deepEqual(calculerTotaux([L(1.5, 45)], 20), { ht: 67.5, tva: 13.5, ttc: 81 })
})
test('prix saisi en texte "12.5" (éditeur)', () => {
  assert.deepEqual(calculerTotaux([L(2, '12.5')], 20), { ht: 25, tva: 5, ttc: 30 })
})
test('TVA non choisie : pas de TVA ni de TTC', () => {
  assert.deepEqual(calculerTotaux([L(1, 100)], null), { ht: 100, tva: null, ttc: null })
})
test('ligne hors catalogue sans prix : exclue du HT, total ligne null', () => {
  assert.equal(totalLigne(L(1, null)), null)
  assert.deepEqual(calculerTotaux([L(1, 100), L(1, null)], 20), { ht: 100, tva: 20, ttc: 120 })
})
test('aucune ligne', () => {
  assert.deepEqual(calculerTotaux([], 20), { ht: 0, tva: 0, ttc: 0 })
})
test('validation bloquée sans TVA', () => {
  assert.ok(blocagesValidation({ tva: null, lignes: [L(1, 10)] }).includes('Choisissez le taux de TVA.'))
})
test('validation bloquée avec un prix manquant', () => {
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(1, null)] }).length > 0)
})
test('validation bloquée avec un taux non prévu', () => {
  assert.ok(blocagesValidation({ tva: 7, lignes: [L(1, 10)] }).length > 0)
})
test('validation possible quand tout est rempli', () => {
  assert.deepEqual(blocagesValidation({ tva: 10, lignes: [L(1, 10)] }), [])
})
