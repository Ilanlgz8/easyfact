// Catalogues et exemples par métier. Sans appel réseau.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CATALOGUES, catalogueEntreprise, exemplesEntreprise, DATE_EXEMPLES } from '../src/metiers/catalogues.js'
import { SERIES, METIERS, validerCatalogue, consigneCatalogue, suggererPrix } from '../src/marche/indices.js'
import { calculerTotaux } from '../src/devis/calcul.js'
import { dateDemo } from '../src/dates.js'

const REF = new Date('2026-11-27T10:00:00Z')

const ent = (metiers) => ({ metiers, tauxHoraire: 50, deplacement: 25 })

test('chaque métier de la liste a un catalogue avec prestations ET matériaux', () => {
  for (const m of METIERS) {
    const cle = m.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const c = CATALOGUES[cle]
    assert.ok(c?.length >= 6, m)
    assert.ok(c.some((p) => p.type === 'prestation') && c.some((p) => p.type === 'materiau'), m)
    for (const p of c) assert.ok(SERIES[p.indice], `${m} : ${p.nom} -> ${p.indice}`)
    for (const p of c) assert.ok(p.prix > 0, `${m} : ${p.nom}`)
  }
})

test('menuisier : catalogue de menuiserie, bois suivi par l\'indice du chêne', () => {
  const c = catalogueEntreprise(ent(['Menuisier']), [], '2026-11')
  assert.ok(c.some((p) => p.nom === 'Pose de parquet'))
  assert.equal(c.some((p) => /mitigeur/i.test(p.nom)), false)
  const parquet = c.find((p) => p.nom === 'Parquet chêne massif')
  assert.equal(parquet.indice, 'CHENE')
  assert.equal(parquet.exemple, true)
  assert.equal(parquet.prixDepuis, DATE_EXEMPLES)
})

test('main-d\'œuvre et déplacement : prix du questionnaire, pas des exemples', () => {
  const c = catalogueEntreprise(ent(['Peintre']), [], '2026-11')
  const mo = c.find((p) => p.nom === 'Main-d’œuvre')
  assert.equal(mo.prix, 50)
  assert.equal(mo.exemple, undefined)
  assert.equal(mo.prixDepuis, '2026-11')
  assert.equal(c.find((p) => p.nom === 'Déplacement').prix, 25)
})

test('plusieurs métiers : catalogues fusionnés sans doublon, identifiants uniques', () => {
  const c = catalogueEntreprise(ent(['Plombier', 'Chauffagiste']), [], '2026-11')
  assert.ok(c.some((p) => p.nom === 'Pose d’un mitigeur') && c.some((p) => p.nom === 'Remplacement de chaudière'))
  assert.equal(new Set(c.map((p) => p.nom)).size, c.length)
  assert.equal(new Set(c.map((p) => p.id)).size, c.length)
})

test('métier « Autre » : éléments de l\'IA ajoutés SANS prix', () => {
  const ia = [{ nom: 'Pose de plaques de plâtre', detail: 'Au m²', type: 'prestation', indice: 'BT08' }]
  const c = catalogueEntreprise(ent(['Plaquiste']), ia, '2026-11')
  const p = c.find((x) => x.nom === 'Pose de plaques de plâtre')
  assert.equal(p.prix, null)
  assert.equal(p.proposeParIA, true)
  // Exemples : objet repris de l'IA, chiffrés seulement avec main-d'œuvre et déplacement du questionnaire.
  const { devis, factures } = exemplesEntreprise(ent(['Plaquiste']), c, REF)
  assert.equal(devis.length, 4)
  assert.equal(factures.length, 2)
  assert.equal(devis[0].objet, 'Pose de plaques de plâtre (exemple)')
  for (const d of [...devis, ...factures]) {
    for (const l of d.lignes) assert.ok(['Main-d’œuvre', 'Déplacement'].includes(l.label) && [50, 25].includes(l.prix), l.label)
  }
})

test('exemples du métier : lignes du catalogue, totaux calculables', () => {
  for (const m of METIERS) {
    const e = ent([m])
    const c = catalogueEntreprise(e, [], '2026-11')
    const { devis, factures } = exemplesEntreprise(e, c, REF)
    assert.equal(devis.length, 4, m)
    // ce mois-ci, le mois dernier et avant : l'assistant a toujours de quoi répondre
    assert.ok(devis.some((d) => d.date.startsWith('2026-11')) && devis.some((d) => d.date.startsWith('2026-10')), m)
    assert.equal(factures.length, 2, m)
    for (const d of [...devis, ...factures]) {
      for (const l of d.lignes) assert.ok(c.some((p) => p.nom === l.label) && l.prix > 0, `${m} : ${l.label}`)
      assert.ok(calculerTotaux(d.lignes, d.tva).ttc > 0)
    }
  }
})

test('prix d\'un matériau d\'exemple : suggestion à partir de sa date', () => {
  const serie = [{ mois: '2025-10', valeur: 112.9 }, { mois: '2026-09', valeur: 114.8 }, { mois: '2026-10', valeur: 117.0 }]
  const sg = suggererPrix(65, serie, DATE_EXEMPLES)
  assert.equal(sg.prixSuggere, 67.36) // 65 × 117 / 112,9
})

test('catalogue de l\'IA : validation stricte, aucun prix accepté', () => {
  const ok = { elements: [{ nom: 'Pose de plaques de plâtre', detail: 'Au m²', type: 'prestation', indice: 'BT08' }, { nom: 'Plaque de plâtre BA13', detail: 'À l’unité', type: 'materiau', indice: 'PLATRE' }] }
  assert.equal(validerCatalogue(JSON.stringify(ok)).length, 2)
  const avecPrix = { elements: [{ ...ok.elements[0], prix: 30 }] }
  assert.equal(validerCatalogue(JSON.stringify(avecPrix)), null)
  assert.equal(validerCatalogue(JSON.stringify({ elements: [{ ...ok.elements[0], nom: 'Pose 30,00 €' }] })), null)
  assert.equal(validerCatalogue(JSON.stringify({ elements: [{ ...ok.elements[0], indice: 'CHENE' }] })), null) // prestation : index BT seulement
  assert.equal(validerCatalogue(JSON.stringify({ elements: [{ ...ok.elements[1], indice: 'XYZ' }] })), null)
  assert.equal(validerCatalogue(JSON.stringify({ elements: Array.from({ length: 15 }, (_, i) => ({ ...ok.elements[0], nom: 'Pose ' + 'abcdefghijklmno'[i] })) })).length, 12) // 12 gardés
  assert.equal(validerCatalogue(JSON.stringify({ elements: Array(41).fill(ok.elements[0]) })), null)
  assert.equal(validerCatalogue('pas du json'), null)
  assert.equal(/prix|€/.test(consigneCatalogue().replace('N\'indique jamais de prix', '')), false)
})

test('dates de démo : relatives au jour, à Paris, mois raccourcis', () => {
  assert.equal(dateDemo(REF, { jours: 1 }), '2026-11-26')
  assert.equal(dateDemo(REF, { mois: 1, jour: 18 }), '2026-10-18')
  assert.equal(dateDemo(new Date('2027-01-02T10:00:00Z'), { mois: 1, jour: 9 }), '2026-12-09')
  assert.equal(dateDemo(new Date('2026-03-31T10:00:00Z'), { mois: 1, jour: 30 }), '2026-02-28')
  assert.equal(dateDemo(new Date('2026-12-31T23:30:00Z'), { jours: 0 }), '2027-01-01') // déjà le 1er janvier à Paris
})
