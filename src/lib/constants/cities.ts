export interface City {
  name: string
  state: string  // state/province
  country: 'US' | 'IN'
  lat: number
  lng: number
  adzunaLocation: string  // how Adzuna expects the location string
}

export const US_CITIES: City[] = [
  // Top 25 US tech/job market cities
  { name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lng: -74.0060, adzunaLocation: 'New York' },
  { name: 'San Francisco', state: 'CA', country: 'US', lat: 37.7749, lng: -122.4194, adzunaLocation: 'San Francisco' },
  { name: 'Seattle', state: 'WA', country: 'US', lat: 47.6062, lng: -122.3321, adzunaLocation: 'Seattle' },
  { name: 'Austin', state: 'TX', country: 'US', lat: 30.2672, lng: -97.7431, adzunaLocation: 'Austin' },
  { name: 'Chicago', state: 'IL', country: 'US', lat: 41.8781, lng: -87.6298, adzunaLocation: 'Chicago' },
  { name: 'Boston', state: 'MA', country: 'US', lat: 42.3601, lng: -71.0589, adzunaLocation: 'Boston' },
  { name: 'Los Angeles', state: 'CA', country: 'US', lat: 34.0522, lng: -118.2437, adzunaLocation: 'Los Angeles' },
  { name: 'Denver', state: 'CO', country: 'US', lat: 39.7392, lng: -104.9903, adzunaLocation: 'Denver' },
  { name: 'Atlanta', state: 'GA', country: 'US', lat: 33.7490, lng: -84.3880, adzunaLocation: 'Atlanta' },
  { name: 'Miami', state: 'FL', country: 'US', lat: 25.7617, lng: -80.1918, adzunaLocation: 'Miami' },
  { name: 'Dallas', state: 'TX', country: 'US', lat: 32.7767, lng: -96.7970, adzunaLocation: 'Dallas' },
  { name: 'Washington', state: 'DC', country: 'US', lat: 38.9072, lng: -77.0369, adzunaLocation: 'Washington DC' },
  { name: 'Portland', state: 'OR', country: 'US', lat: 45.5152, lng: -122.6784, adzunaLocation: 'Portland' },
  { name: 'Minneapolis', state: 'MN', country: 'US', lat: 44.9778, lng: -93.2650, adzunaLocation: 'Minneapolis' },
  { name: 'Raleigh', state: 'NC', country: 'US', lat: 35.7796, lng: -78.6382, adzunaLocation: 'Raleigh' },
  { name: 'Philadelphia', state: 'PA', country: 'US', lat: 39.9526, lng: -75.1652, adzunaLocation: 'Philadelphia' },
  { name: 'San Diego', state: 'CA', country: 'US', lat: 32.7157, lng: -117.1611, adzunaLocation: 'San Diego' },
  { name: 'Phoenix', state: 'AZ', country: 'US', lat: 33.4484, lng: -112.0740, adzunaLocation: 'Phoenix' },
  { name: 'Nashville', state: 'TN', country: 'US', lat: 36.1627, lng: -86.7816, adzunaLocation: 'Nashville' },
  { name: 'Salt Lake City', state: 'UT', country: 'US', lat: 40.7608, lng: -111.8910, adzunaLocation: 'Salt Lake City' },
  { name: 'San Jose', state: 'CA', country: 'US', lat: 37.3382, lng: -121.8863, adzunaLocation: 'San Jose' },
  { name: 'Detroit', state: 'MI', country: 'US', lat: 42.3314, lng: -83.0458, adzunaLocation: 'Detroit' },
  { name: 'Pittsburgh', state: 'PA', country: 'US', lat: 40.4406, lng: -79.9959, adzunaLocation: 'Pittsburgh' },
  { name: 'Charlotte', state: 'NC', country: 'US', lat: 35.2271, lng: -80.8431, adzunaLocation: 'Charlotte' },
  { name: 'Houston', state: 'TX', country: 'US', lat: 29.7604, lng: -95.3698, adzunaLocation: 'Houston' },
]

export const IN_CITIES: City[] = [
  // Top 20 Indian tech/job market cities
  { name: 'Bangalore', state: 'Karnataka', country: 'IN', lat: 12.9716, lng: 77.5946, adzunaLocation: 'Bangalore' },
  { name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0760, lng: 72.8777, adzunaLocation: 'Mumbai' },
  { name: 'Delhi NCR', state: 'Delhi', country: 'IN', lat: 28.7041, lng: 77.1025, adzunaLocation: 'Delhi' },
  { name: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.3850, lng: 78.4867, adzunaLocation: 'Hyderabad' },
  { name: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.5204, lng: 73.8567, adzunaLocation: 'Pune' },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 13.0827, lng: 80.2707, adzunaLocation: 'Chennai' },
  { name: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.5726, lng: 88.3639, adzunaLocation: 'Kolkata' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'IN', lat: 23.0225, lng: 72.5714, adzunaLocation: 'Ahmedabad' },
  { name: 'Gurgaon', state: 'Haryana', country: 'IN', lat: 28.4595, lng: 77.0266, adzunaLocation: 'Gurgaon' },
  { name: 'Noida', state: 'Uttar Pradesh', country: 'IN', lat: 28.5355, lng: 77.3910, adzunaLocation: 'Noida' },
  { name: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.9124, lng: 75.7873, adzunaLocation: 'Jaipur' },
  { name: 'Chandigarh', state: 'Punjab', country: 'IN', lat: 30.7333, lng: 76.7794, adzunaLocation: 'Chandigarh' },
  { name: 'Kochi', state: 'Kerala', country: 'IN', lat: 9.9312, lng: 76.2673, adzunaLocation: 'Kochi' },
  { name: 'Indore', state: 'Madhya Pradesh', country: 'IN', lat: 22.7196, lng: 75.8577, adzunaLocation: 'Indore' },
  { name: 'Coimbatore', state: 'Tamil Nadu', country: 'IN', lat: 11.0168, lng: 76.9558, adzunaLocation: 'Coimbatore' },
  { name: 'Thiruvananthapuram', state: 'Kerala', country: 'IN', lat: 8.5241, lng: 76.9366, adzunaLocation: 'Thiruvananthapuram' },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', lat: 26.8467, lng: 80.9462, adzunaLocation: 'Lucknow' },
  { name: 'Nagpur', state: 'Maharashtra', country: 'IN', lat: 21.1458, lng: 79.0882, adzunaLocation: 'Nagpur' },
  { name: 'Mysore', state: 'Karnataka', country: 'IN', lat: 12.2958, lng: 76.6394, adzunaLocation: 'Mysore' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN', lat: 17.6868, lng: 83.2185, adzunaLocation: 'Visakhapatnam' },
]

export const ALL_CITIES = [...US_CITIES, ...IN_CITIES]

export function getCitiesByCountry(country: 'US' | 'IN'): City[] {
  return country === 'US' ? US_CITIES : IN_CITIES
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase()
  return ALL_CITIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.state.toLowerCase().includes(q)
  )
}
