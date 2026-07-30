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
