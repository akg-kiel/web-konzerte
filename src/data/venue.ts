export const venue = {
  name: 'Konzertkirche Petruskirche',
  address: {
    street: 'Weimarer Straße 1',
    postalCode: '24106',
    city: 'Kiel'
  },
  accessibility: {
    entrance: 'Die Kirche ist über einen rollstuhlgerechten Seiteneingang erreichbar.',
    toilet: 'Ein rollstuhlgerechtes WC befindet sich in der Kirche beim Seiteneingang.',
    wheelchairPlaces: 'Für Rollstuhlplätze bitten wir um vorherige Kontaktaufnahme.'
  },
  concertPhone: {
    label: '01575 287 4279',
    href: 'tel:+4915752874279'
  }
};

export const venueAddress = `${venue.address.street} · ${venue.address.postalCode} ${venue.address.city}`;
