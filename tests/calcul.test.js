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
  assert.ok(blocagesValidation({ tva: null, lignes: [L(1, 10)] }).some((m) => m.startsWith('Choisissez le taux de TVA')))
})
test('validation bloquée avec un prix manquant', () => {
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(1, null)] }).length > 0)
})
// Décision du 27/11/2026 : « Autre taux » saisi par l'artisan (ex. Corse). Les taux aberrants restent refusés.
test('autre taux saisi par l\'artisan accepté (2,1 %, 13 %)', () => {
  assert.deepEqual(blocagesValidation({ tva: 2.1, lignes: [L(1, 10)] }), [])
  assert.deepEqual(blocagesValidation({ tva: 13, lignes: [L(1, 10)] }), [])
})
test('taux aberrants refusés : négatif, > 100 %, 3 décimales, texte', () => {
  for (const tva of [-1, 101, 5.555, 'abc', NaN]) assert.ok(blocagesValidation({ tva, lignes: [L(1, 10)] }).length > 0, String(tva))
})
test('TVA 2,1 % : 1 234,56 × 2,1 % = 25,93 (25,92576 arrondi)', () => {
  assert.deepEqual(calculerTotaux([L(1, 1234.56)], 2.1), { ht: 1234.56, tva: 25.93, ttc: 1260.49 })
})
test('total de ligne arrondi avant la somme : 3 × 0,333 n\'existe pas, 1,5 × 33,33 = 50,00 (49,995)', () => {
  assert.equal(totalLigne(L(1.5, 33.33)), 50)
  assert.deepEqual(calculerTotaux([L(1.5, 33.33), L(1.5, 33.33)], 0), { ht: 100, tva: 0, ttc: 100 })
})
test('prix ou quantité aberrants bloqués', () => {
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(1, -5)] }).length > 0)
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(1, 2_000_000)] }).length > 0)
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(0, 10)] }).length > 0)
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(20_000, 10)] }).length > 0)
})
test('quantité inconnue (null) : ligne exclue du total et validation bloquée', () => {
  assert.equal(totalLigne(L(null, 10)), null)
  assert.ok(blocagesValidation({ tva: 20, lignes: [L(null, 10)] }).some((m) => m.startsWith('Indiquez la quantité')))
})
test('grands montants sans erreur de virgule flottante', () => {
  assert.deepEqual(calculerTotaux([L(3, 333333.33)], 20), { ht: 999999.99, tva: 200000, ttc: 1199999.99 })
})
test('validation possible quand tout est rempli', () => {
  assert.deepEqual(blocagesValidation({ tva: 10, lignes: [L(1, 10)] }), [])
})
