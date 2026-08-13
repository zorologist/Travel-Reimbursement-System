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
 * Railways tariff sheet. NEEDS VERIFICATION: fill these in directly from
 * the official tariff document - do not guess from a scanned/photographed
 * table, misreading a digit here means paying someone the wrong amount.
 */
export const TRAIN_FARES: Partial<Record<string, number>> = {
  // Fill in as: "CityName": fareInEGP,
};

/** Returns null (not a made-up default) when a city has no verified train fare yet. */
export function getTrainFare(destinationCity?: string): number | null {
  if (!destinationCity) return null;
  return TRAIN_FARES[destinationCity] ?? null;
}
