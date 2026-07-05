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
    ticketLabel: 'Tickets',
    detailsHref: '/programm#kieler-philharmoniker-herbstklaenge',
    status: {
      state: 'available',
      label: 'Ticketinformationen folgen',
      description: 'Es ist noch kein externer Ticketlink hinterlegt.'
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
    ticketLabel: 'Tickets',
    detailsHref: '/programm#weihnachtsoratorium-bach',
    status: {
      state: 'available',
      label: 'Ticketinformationen folgen',
      description: 'Es ist noch kein externer Ticketlink hinterlegt.'
    },
    image: heroStage,
    imageAlt: 'Chor- und Ensembleauftritt im Altarraum der Petruskirche',
    imagePosition: '70% 58%'
  },
  {
    slug: 'die-passion-2026',
    title: 'Die Passion 2026 - Das Musical',
    programme:
      'Ein monumentales musikalisches Ereignis, das Passionsspieltradition mit moderner Musicalkraft, Chor, Solisten und Orchester verbindet.',
    category: 'Musical Premiere',
    date: {
      iso: '2027-03-21T18:00:00+01:00',
      month: 'Mär',
      day: '21',
      time: '18:00',
      display: '21. März 2027 • 18:00 Uhr',
      compact: 'MÄR 21 · 18:00 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Großer Sinfonischer Chor der Petruskirche & Projektorchester Kiel',
    price: '25€ - 45€',
    ticketLabel: 'Tickets',
    detailsHref: '/programm/die-passion-2026',
    status: {
      state: 'available',
      label: 'Ticketinformationen folgen',
      description: 'Es ist noch kein externer Ticketlink hinterlegt.'
    },
    image: heroStage,
    imageAlt: 'Chorprobe und Ensemble im Kirchenraum der Petruskirche',
    imagePosition: '64% 52%'
  },
  {
    slug: 'cello-meets-electronic',
    title: 'Cello meets Electronic',
    programme:
      'Ein immersives Klangerlebnis, das klassisches Cello-Spiel mit modernen elektronischen Elementen und Licht im Kirchenraum verbindet.',
    category: 'Pop / Crossover',
    date: {
      iso: '2026-11-14T20:00:00+01:00',
      month: 'Nov',
      day: '14',
      time: '20:00',
      display: '14. November 2026 • 20:00 Uhr',
      compact: 'NOV 14 · 20:00 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Solo-Cello, Live-Elektronik und Lichtregie',
    price: 'ab 35,00 €',
    ticketLabel: 'Tickets',
    detailsHref: '/programm#cello-meets-electronic',
    status: {
      state: 'available',
      label: 'Ticketinformationen folgen',
      description: 'Es ist noch kein externer Ticketlink hinterlegt.'
    },
    image: sinfonieFenster,
    imageAlt: 'Reflexionen von Kirchenfenstern auf einem Konzertflügel',
    imagePosition: '52% 50%'
  },
  {
    slug: 'nordische-lichter',
    title: 'A-cappella-Konzert: Nordische Lichter',
    programme:
      'Der Petruschor präsentiert zeitgenössische und klassische Chorwerke skandinavischer Komponisten in klarer Kirchenakustik.',
    category: 'Chor',
    date: {
      iso: '2026-12-05T18:00:00+01:00',
      month: 'Dez',
      day: '05',
      time: '18:00',
      display: '5. Dezember 2026 • 18:00 Uhr',
      compact: 'DEZ 05 · 18:00 Uhr'
    },
    location: 'Konzertkirche Petruskirche Kiel',
    performers: 'Petruschor Kiel',
    price: 'Eintritt frei (Spende erbeten)',
    ticketLabel: 'Details',
    detailsHref: '/programm#nordische-lichter',
    status: {
      state: 'free',
      label: 'Eintritt frei',
      description: 'Für dieses Konzert ist kein Ticketlink erforderlich.'
    },
    image: orgelMikrofon,
    imageAlt: 'Mikrofon und Instrumentendetail in der Petruskirche',
    imagePosition: '50% 45%'
  }
];

const now = new Date();

const isPastConcert = (concert: Concert) => concert.isPast || new Date(concert.date.iso) < now;

const byDateAsc = (a: Concert, b: Concert) => a.date.iso.localeCompare(b.date.iso);

export const programmeConcerts = concerts
  .filter((concert) => !isPastConcert(concert))
  .sort(byDateAsc);

export const upcomingConcerts = programmeConcerts.slice(0, 3);

export const archiveConcerts = concerts.filter(isPastConcert).sort((a, b) => byDateAsc(b, a));

export const passionConcert = concerts.find((concert) => concert.slug === 'die-passion-2026');

export const relatedConcerts = programmeConcerts
  .filter((concert) => concert.slug !== 'die-passion-2026')
  .slice(0, 3);
