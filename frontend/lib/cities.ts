/**
 * Localized display names for cities returned by the API.
 * API canonical keys: Lyon, Geneve, Lausanne, Zurich, Basel
 */
const CITY_LABELS: Record<string, Record<string, string>> = {
  Lyon:     { fr: 'Lyon',     en: 'Lyon',       de: 'Lyon'      },
  Geneve:   { fr: 'Genève',   en: 'Geneva',     de: 'Genf'      },
  Lausanne: { fr: 'Lausanne', en: 'Lausanne',   de: 'Lausanne'  },
  Zurich:   { fr: 'Zurich',   en: 'Zurich',     de: 'Zürich'    },
  Basel:    { fr: 'Bâle',     en: 'Basel',      de: 'Basel'     },
};

export function localizeCity(city: string, locale: string): string {
  return CITY_LABELS[city]?.[locale] ?? city;
}
