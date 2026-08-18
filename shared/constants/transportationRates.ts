export const DEVELOPMENT_TRANSPORTATION_RATES: Record<string, number> = {
  Cairo: 100,
  Alexandria: 200,
  Giza: 100,
  Suez: 150,
  Ismailia: 150,
  "Port Said": 180,
  Damietta: 180,
  Dakahlia: 160,
  Sharqia: 140,
  Qalyubia: 100,
  "Kafr El Sheikh": 170,
  Gharbia: 150,
  Monufia: 130,
  Beheira: 180,
  Fayoum: 140,
  "Beni Suef": 160,
  Minya: 200,
  Assiut: 250,
  Sohag: 280,
  Qena: 300,
  Luxor: 350,
  Aswan: 400,
};

export const DEFAULT_TANGO_FARE = 150;

export function getTangoFare(destinationCity?: string): number {
  if (!destinationCity) return DEFAULT_TANGO_FARE;
  return DEVELOPMENT_TRANSPORTATION_RATES[destinationCity] ?? DEFAULT_TANGO_FARE;
}

/**
 * One-way highest-class train fare (Talgo / VIP where it runs, otherwise
 * first-class deluxe) per destination city, from the Egyptian National
 * Railways tariff sheet effective 2026-07-01. Round-trip doubling is handled
 * automatically by the caller (requestService.ts) - do not double these here.
 * Entries marked "estimated" are distance-modeled off the confirmed fares,
 * not read directly off the sheet - re-check against the tariff sheet next
 * time it's updated rather than assuming they're exact.
 */
export const TRAIN_FARES: Partial<Record<string, number>> = {
  // Cairo -> Said (Upper Egypt) direction, First Class Premium A/C column. Confirmed.
  Fayoum: 900,
  "Beni Suef": 140,
  Minya: 500,
  Assiut: 500,
  Sohag: 710,
  Qena: 770, // No distinct Qena station row on the sheet; uses the Nag Hammadi fare (same zone).
  "Nag Hammadi": 770,
  Luxor: 770,
  Edfu: 880,
  "Kom Ombo": 1000,
  Aswan: 1000,

  // Cairo -> Delta/Canal direction, First Class Deluxe (اولي فاخر) column. Confirmed.
  Benha: 90,
  Qewaisna: 100,
  "Berket El Sabaa": 110,

  // Cairo -> Delta/Canal direction - estimated, see comment above.
  Monufia: 120,
  Menouf: 120,
  Sharqia: 150,
  Zagazig: 150,
  Gharbia: 160,
  Tanta: 160,
  "Kafr El Zayat": 185,
  Suez: 220,
  Beheira: 235,
  Damanhur: 235,
  Dakahlia: 240,
  Mansoura: 240,
  "Kafr El Sheikh": 240,
  Ismailia: 240,
  Damietta: 300,
  Alexandria: 310,
  "Port Said": 330,
};

/** Returns null (not a made-up default) when a city has no verified train fare yet. */
export function getTrainFare(destinationCity?: string): number | null {
  if (!destinationCity) return null;
  return TRAIN_FARES[destinationCity] ?? null;
}
