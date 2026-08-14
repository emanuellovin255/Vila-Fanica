/**
 * Pregătește cele 11 fotografii ale Vilei Fănică pentru `poze/`.
 *
 * Originalele sunt salvate de pe Facebook la 414×414 — prea mici pentru
 * un site. Le ducem la 828 (×2, cât să acopere ecranele dense la
 * dimensiunile reale de afișare) cu Lanczos3, apoi un `sharpen` blând care
 * întoarce muchiile pierdute la interpolare. Peste ×2 nu se merge: acolo
 * începe să se inventeze detaliu, iar rezultatul arată a plastic.
 */
import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const SURSA = '/Users/lovinemanuel/Desktop/SITEURI GATA/Resorturi /Vila Fanica/Poze Camere'
const TINTA = '/Users/lovinemanuel/Desktop/SITEURI GATA/Resorturi /Vila Fanica/poze'

const HARTA = [
  ['502872232_4941218852770713_5160129478644080590_n.jpg', 'vila-fanica-seara-cu-balcoane-inflorate'],
  ['494642285_4905128029713129_3614398658346619285_n.jpg', 'vila-fanica-fatada-de-sticla'],
  ['503202371_4941219832770615_1721232602345892079_n.jpg', 'balcoane-cu-muscate-vara'],
  ['482021884_4837711583121441_4013209570213329034_n.jpg', 'camera-dubla-cu-pat-matrimonial'],
  ['481208577_4837711613121438_3892835414239669809_n.jpg', 'camera-dubla-cu-birou-si-frigider'],
  ['481480956_4837711539788112_4167333851898019725_n.jpg', 'camera-cu-masa-de-toaleta'],
  ['482023776_4837711499788116_7554360482424451096_n.jpg', 'baie-cu-cabina-de-dus'],
  ['495668431_4915991235293475_7721164364941639816_n.jpg', 'strandul-apollo-vazut-de-la-vila'],
  ['496006229_4915991501960115_8417299803470024882_n.jpg', 'strandul-apollo-bazinul-cu-fantana'],
  ['495660142_4915991548626777_8165751614667299883_n.jpg', 'strandul-apollo-toboganele'],
  ['505242846_4951976148361650_4832712389458143992_n.jpg', 'strandul-apollo-vedere-de-sus'],
]

await mkdir(TINTA, { recursive: true })

for (const [sursa, nume] of HARTA) {
  const iesire = path.join(TINTA, `${nume}.webp`)
  const info = await sharp(path.join(SURSA, sursa))
    .resize({ width: 828, height: 828, fit: 'inside', kernel: 'lanczos3', withoutEnlargement: false })
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.7 })
    .webp({ quality: 82, effort: 6 })
    .toFile(iesire)
  console.log(`  ${nume}.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
}

console.log(`\n  ${HARTA.length} poze în poze/`)
