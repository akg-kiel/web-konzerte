import type { ImageMetadata } from 'astro';

import heroStage from '../assets/hero/l1130722-hero.jpg';
import orgelMikrofon from '../assets/concerts/orgel-mikrofon.jpg';
import sinfonieFenster from '../assets/concerts/sinfonie-fenster.jpg';

export type ConcertVariant = 'home' | 'programme' | 'archive';

export type ConcertStatusState = 'available' | 'lastTickets' | 'soldOut' | 'free';

export interface ConcertDate {
  iso: string;
  month: string;
  day: string;
  time: string;
  display: string;
  compact: string;
}

export interface ConcertStatus {
  state: ConcertStatusState;
  label: string;
  description: string;
}

export interface Concert {
  slug: string;
  title: string;
  programme: string;
  category: string;
  date: ConcertDate;
  location: string;
  performers: string;
  price: string;
  ticketUrl?: string;
  ticketLabel: string;
  detailsHref: string;
  status: ConcertStatus;
  image: ImageMetadata;
  imageAlt: string;
  imagePosition: string;
  isPast?: boolean;
}

export const concerts: Concert[] = [
  {
    slug: 'kieler-philharmoniker-herbstklaenge',
    title: 'Kieler Philharmoniker: Herbstklänge',
    programme:
      'Werke von Brahms und Mendelssohn Bartholdy. Ein Abend der großen romantischen Gefühle im einzigartigen Kirchenraum.',
    category: 'Sinfonie',
    date: {
      iso: '2024-11-15T19:30:00+01:00',
      month: 'Nov',
      day: '15',
      time: '19:30',
      display: '15. November 2024 • 19:30 Uhr',
      compact: 'NOV 15 · 19:30 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Kieler Philharmoniker',
    price: 'ab 24,00 €',
    ticketUrl: '/programm#tickets-kieler-philharmoniker-herbstklaenge',
    ticketLabel: 'Tickets',
    detailsHref: '/programm#kieler-philharmoniker-herbstklaenge',
    status: {
      state: 'available',
      label: 'Tickets im Vorverkauf',
      description: 'Für diesen Termin ist ein Ticketlink hinterlegt.'
    },
    image: sinfonieFenster,
    imageAlt: 'Dunkler Blick über Flügel und Kirchenfenster in der Petruskirche',
    imagePosition: '48% 42%'
  },
  {
    slug: 'orgelkonzert-zur-adventszeit',
    title: 'Orgelkonzert zur Adventszeit',
    programme:
      'Traditionelle und moderne Orgelwerke zur Einstimmung auf die Vorweihnachtszeit. Gespielt an der historischen Sauer-Orgel.',
    category: 'Orgel',
    date: {
      iso: '2024-11-28T18:00:00+01:00',
      month: 'Nov',
      day: '28',
      time: '18:00',
      display: '28. November 2024 • 18:00 Uhr',
      compact: 'NOV 28 · 18:00 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Sauer-Orgel der Petruskirche',
    price: 'Eintritt frei',
    ticketLabel: 'Details',
    detailsHref: '/programm#orgelkonzert-zur-adventszeit',
    status: {
      state: 'free',
      label: 'Eintritt frei',
      description: 'Für dieses Konzert ist kein Ticketlink erforderlich.'
    },
    image: orgelMikrofon,
    imageAlt: 'Mikrofon auf einem Flügel vor Kirchenfenstern',
    imagePosition: '50% 52%'
  },
  {
    slug: 'weihnachtsoratorium-bach',
    title: 'Weihnachtsoratorium – J.S. Bach',
    programme:
      'Der Petrus-Chor und Solisten präsentieren die Kantaten I-III. Ein musikalischer Höhepunkt in der Vorweihnachtszeit.',
    category: 'Chor',
    date: {
      iso: '2024-12-12T20:00:00+01:00',
      month: 'Dez',
      day: '12',
      time: '20:00',
      display: '12. Dezember 2024 • 20:00 Uhr',
      compact: 'DEZ 12 · 20:00 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Petrus-Chor und Solisten',
    price: 'ab 18,00 €',
    ticketUrl: '/programm#tickets-weihnachtsoratorium-bach',
    ticketLabel: 'Tickets',
    detailsHref: '/programm#weihnachtsoratorium-bach',
    status: {
      state: 'available',
      label: 'Tickets im Vorverkauf',
      description: 'Für diesen Termin ist ein Ticketlink hinterlegt.'
    },
    image: heroStage,
    imageAlt: 'Chor- und Ensembleauftritt im Altarraum der Petruskirche',
    imagePosition: '70% 58%'
  }
];

export const upcomingConcerts = concerts.filter((concert) => !concert.isPast).slice(0, 3);

export const programmeConcerts = concerts.filter((concert) => !concert.isPast);

export const archiveConcerts = concerts.filter((concert) => concert.isPast);
