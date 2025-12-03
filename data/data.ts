import { TransitSystem } from '../types';

export const TRANSIT_SYSTEMS: TransitSystem[] = [
  {
    name: 'MTA New York City Transit',
    region: 'North America',
    image: '/images/transit/mta.svg',
    aliases: ['MTA', 'Metropolitan Transportation Authority', 'NYC Transit', 'New York', 'Big Apple', 'NYC Subway'],
  },
  {
    name: 'BART',
    region: 'North America',
    image: '/images/transit/bart.svg',
    aliases: ['Bay Area Rapid Transit', 'San Francisco', 'SF Bay Area', 'Bay Area'],
  },
  {
    name: 'London Underground',
    region: 'Europe',
    image: '/images/transit/tflunderground.svg',
    aliases: ['The Tube', 'TfL', 'Transport for London', 'London Tube'],
  },
  {
    name: 'Paris Métro',
    region: 'Europe',
    image: '/images/transit/paris-metro.svg',
    aliases: ['Paris Metro', 'RATP', 'Métropolitain', 'Paris subway'],
  },
  {
    name: 'Berlin U-Bahn',
    region: 'Europe',
    image: '/images/transit/berlin-ubahn.svg',
    aliases: ['BVG', 'U-Bahn Berlin', 'Berlin Metro'],
  },
  {
    name: 'Tokyo Metro',
    region: 'Asia-Pacific',
    image: '/images/transit/tokyo-metro.svg',
    aliases: ['Tokyo Subway', 'Tokyo', 'Tokyo Metro Co'],
  },
  {
    name: 'Seoul Metro',
    region: 'Asia-Pacific',
    image: '/images/transit/seoul-metro.svg',
    aliases: ['Seoul Metropolitan Subway', 'Korail Subway', 'Seoul'],
  },
  {
    name: 'Sydney Trains',
    region: 'Asia-Pacific',
    image: '/images/transit/sydney-trains.svg',
    aliases: ['Sydney Metro', 'Sydney Rail', 'Sydney'],
  },
  {
    name: 'Toronto TTC',
    region: 'North America',
    image: '/images/transit/ttc.svg',
    aliases: ['TTC', 'Toronto Transit Commission', 'Toronto'],
  },
  {
    name: 'Chicago CTA',
    region: 'North America',
    image: '/images/transit/cta.svg',
    aliases: ['CTA', 'Chicago Transit Authority', 'Chicago L', 'The L', 'Chicago'],
  },
  {
    name: 'Mexico City Metro',
    region: 'Latin America',
    image: '/images/transit/cdmx-metro.svg',
    aliases: ['CDMX Metro', 'STC Metro', 'Ciudad de México', 'Mexico City'],
  },
  {
    name: 'Dubai Metro',
    region: 'Middle East & Africa',
    image: '/images/transit/dubai-metro.svg',
    aliases: ['RTA', 'Roads and Transport Authority', 'Dubai'],
  },
];
