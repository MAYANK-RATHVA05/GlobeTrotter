/**
 * Curated high-resolution destination photography from Unsplash.
 * Hand-picked for editorial aesthetic, rich lighting, and aspirational travel vibe.
 */

export interface DestinationPhoto {
  url: string;
  credit: string;
  alt: string;
}

export const DESTINATION_PHOTOS: Record<string, DestinationPhoto> = {
  tokyo: {
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=85',
    credit: 'Jezael Melgoza',
    alt: 'Tokyo cityscape with illuminated Tokyo Tower',
  },
  kyoto: {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85',
    credit: 'Su San Lee',
    alt: 'Traditional wooden pagoda and street in Kyoto, Japan',
  },
  osaka: {
    url: 'https://images.unsplash.com/photo-1590559899731-a372a12c40c8?auto=format&fit=crop&w=1200&q=85',
    credit: 'Masaaki Komori',
    alt: 'Osaka Castle surrounded by gardens',
  },
  paris: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85',
    credit: 'Anthony DELANOIX',
    alt: 'Eiffel Tower and Paris rooftop architecture',
  },
  bali: {
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85',
    credit: 'Oliver Sjöström',
    alt: 'Lush tropical paradise and temples in Bali',
  },
  'new york': {
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=85',
    credit: 'Florian Wehde',
    alt: 'Manhattan skyline at dusk with yellow cabs',
  },
  switzerland: {
    url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=85',
    credit: 'Dino Reichmuth',
    alt: 'Emerald lake and snow-capped peaks in the Swiss Alps',
  },
  dubai: {
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85',
    credit: 'ZQ Lee',
    alt: 'Dubai skyline and Burj Khalifa reflections',
  },
  rome: {
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=85',
    credit: 'David Vives',
    alt: 'The Colosseum glowing in the evening sunset in Rome',
  },
  barcelona: {
    url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=85',
    credit: 'Logan Armstrong',
    alt: 'Aerial view of Sagrada Familia in Barcelona',
  },
  london: {
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85',
    credit: 'Luke Stackpoole',
    alt: 'Big Ben and Westminster Bridge in London',
  },
  amsterdam: {
    url: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1200&q=85',
    credit: 'Miquel Puig',
    alt: 'Historic canal houses with bicycles in Amsterdam',
  },
  iceland: {
    url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=85',
    credit: 'Jonatan Pie',
    alt: 'Dramatic waterfall and black sand beach in Iceland',
  },
  singapore: {
    url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=85',
    credit: 'Ketan Rajput',
    alt: 'Gardens by the Bay supertrees in Singapore',
  },
  amalfi: {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85',
    credit: 'Petar Petkovski',
    alt: 'Colorful cliffside village of Positano on the Amalfi Coast',
  },
  santorini: {
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85',
    credit: 'Heidi Kaden',
    alt: 'White houses and blue church domes in Santorini',
  },
};

const DEFAULT_TRAVEL_PHOTOS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
];

/**
 * Returns a high-res photo URL for any city or destination name.
 */
export function getCityPhoto(name?: string | null): string {
  if (!name) return DEFAULT_TRAVEL_PHOTOS[0];
  const clean = name.toLowerCase().trim();

  for (const [key, photo] of Object.entries(DESTINATION_PHOTOS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return photo.url;
    }
  }

  // Consistent deterministic fallback based on string length
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DEFAULT_TRAVEL_PHOTOS[hash % DEFAULT_TRAVEL_PHOTOS.length];
}
