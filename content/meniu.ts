/**
 * Meniul restaurantului. Nu face parte din `SiteData` (types.ts din
 * hotel-forge nu-l avea), fiindcă e un modul opțional care apare la
 * puține locații. Se încarcă separat, din date/07-meniu-restaurant.md,
 * și se randează doar dacă `Meniu restaurant: da` în setari.md.
 */

export interface MeniuPreparat {
  nume: string
  /** Formatat, ca la oferte: „38 lei". */
  pret?: string
  alergeni?: string
  /** Gramajul porției, lângă nume: „300 g pește / 300 g legume". */
  gramaj?: string
  /**
   * Ingredientele, din corpul blocului `###`. E textul care vinde
   * preparatul și, la un restaurant de nișă, singurul care răspunde la
   * „ce e într-un storceag?" fără un telefon.
   */
  descriere?: string
  /** O condiție de comandă: „precomandă, minimum 4 persoane". */
  nota?: string
  /**
   * Valorile nutriționale, ca text liber. Sunt o obligație de etichetare,
   * nu un argument de vânzare — de asta se randează pliate.
   */
  nutritie?: string
}

export interface MeniuCategorie {
  nume: string
  /** „Servit între 12:00 și 22:00", de exemplu. */
  servit?: string
  preparate: MeniuPreparat[]
}
