/**
 * Countries a person can target. `adzuna` marks the ones Adzuna has an
 * index for (its full list as of November 2026); the others still get
 * employer boards and remote roles, filtered to that country.
 */
export type CountryOption = { code: string; name: string; adzuna: boolean }

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States', adzuna: true },
  { code: 'GB', name: 'United Kingdom', adzuna: true },
  { code: 'IN', name: 'India', adzuna: true },
  { code: 'CA', name: 'Canada', adzuna: true },
  { code: 'AU', name: 'Australia', adzuna: true },
  { code: 'DE', name: 'Germany', adzuna: true },
  { code: 'FR', name: 'France', adzuna: true },
  { code: 'NL', name: 'Netherlands', adzuna: true },
  { code: 'ES', name: 'Spain', adzuna: true },
  { code: 'IT', name: 'Italy', adzuna: true },
  { code: 'SG', name: 'Singapore', adzuna: true },
  { code: 'CH', name: 'Switzerland', adzuna: true },
  { code: 'AT', name: 'Austria', adzuna: true },
  { code: 'BE', name: 'Belgium', adzuna: true },
  { code: 'PL', name: 'Poland', adzuna: true },
  { code: 'NZ', name: 'New Zealand', adzuna: true },
  { code: 'BR', name: 'Brazil', adzuna: true },
  { code: 'MX', name: 'Mexico', adzuna: true },
  { code: 'ZA', name: 'South Africa', adzuna: true },
  { code: 'AE', name: 'UAE', adzuna: false },
  { code: 'JP', name: 'Japan', adzuna: false },
  { code: 'HK', name: 'Hong Kong', adzuna: false },
  { code: 'IE', name: 'Ireland', adzuna: false },
]

export const countryName = (code: string) => COUNTRY_OPTIONS.find(c => c.code === code)?.name ?? code
