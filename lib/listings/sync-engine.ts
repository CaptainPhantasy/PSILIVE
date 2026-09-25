// ============================================================================
// Listings Sync Engine
// Manages distribution of business data to directories
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration for each publisher
const PUBLISHERS = {
  google: {
    name: 'Google Business Profile',
    apiEndpoint: 'https://mybusinessbusinessinformation.googleapis.com/v1',
    scopes: ['https://www.googleapis.com/auth/business'],
    fields: ['name', 'address', 'phone', 'website', 'hours', 'photos', 'categories'],
  },
  yelp: {
    name: 'Yelp',
    apiEndpoint: 'https://api.yelp.com/v3',
    scopes: ['businesses'],
    fields: ['name', 'address', 'phone', 'hours', 'photos', 'categories'],
  },
  bing: {
    name: 'Bing Places',
    apiEndpoint: 'https://ssl.bing.com/Assets/ManageEntities',
    fields: ['name', 'address', 'phone', 'hours'],
  },
} as const;

// ============================================================================
// Data Transformer
// Converts internal format to publisher-specific formats
// ============================================================================

interface LocationData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  website: string;
  hours: Record<string, { open: string; close: string }>;
  description?: string;
  photos?: string[];
  categories?: string[];
}

export function transformForGoogle(location: LocationData) {
  return {
    name: location.name,
    storeCode: `psi-${location.address.zip}`,
    locationNames: [location.name],
    primaryPhone: location.phone,
    websiteUrl: location.website,
    address: {
      addressLines: [location.address.street],
      locality: location.address.city,
      administrativeArea: location.address.state,
      postalCode: location.address.zip,
      countryCode: location.address.country,
    },
    profile: {
      description: location.description?.substring(0, 750), // Google limit
    },
    hours: {
      periods: Object.entries(location.hours).map(([dayOfWeek, hours]) => ({
        openDay: dayOfWeek.toUpperCase(),
        openTime: hours.open.replace(':', ''),
        closeDay: dayOfWeek.toUpperCase(),
        closeTime: hours.close.replace(':', ''),
      })),
    },
    categories: {
      primaryCategory: {
        name: 'Sewer Cleaning Service',
      },
    },
  };
}

export function transformForYelp(location: LocationData) {
  return {
    name: location.name,
    address1: location.address.street,
    city: location.address.city,
    state: location.address.state,
    zip: location.address.zip,
    country: location.address.country,
    phone: location.phone,
    website: location.website,
    description: location.description?.substring(0, 5000), // Yelp limit
    hours: [
      {
        start: Object.keys(location.hours)[0].toUpperCase(),
        end: Object.keys(location.hours)[0].toUpperCase(),
        is_overnight: false,
        day_of_week: Object.keys(location.hours).map(d => d.toUpperCase()),
      },
    ],
  };
}

// ============================================================================
// Listings Sync Engine
// Main class for managing sync operations
// ============================================================================

export class ListingsSyncEngine {
  private publisher: keyof typeof PUBLISHERS;
  private accessToken?: string;
  
  constructor(publisher: keyof typeof PUBLISHERS) {
    this.publisher = publisher;
  }

  // Authenticate with the publisher
  async authenticate(): Promise<boolean> {
    // This would use actual OAuth/API keys in production
    // For now, return true as placeholder
    console.log(`Authenticating with ${PUBLISHERS[this.publisher].name}...`);
    return true;
  }

  // Get all locations from the knowledge graph
  private async getLocations(): Promise<any[]> {
    const areas = await prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });
    
    // For multi-location, we'd have a Location model
    // For single-location, use the company info
    return areas;
  }

  // Push data to a publisher
  async push(locationData: LocationData): Promise<{ success: boolean; error?: string }> {
    try {
      const transformed = this.publisher === 'google' 
        ? transformForGoogle(locationData)
        : transformForYelp(locationData);
      
      // In production, this would make actual API calls
      console.log(`Pushing to ${this.publisher}:`, JSON.stringify(transformed, null, 2));
      
      // Record the sync
      await this.recordSync(this.publisher, {
        status: 'SYNCED',
        lastSyncedAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      await this.recordSync(this.publisher, {
        status: 'FAILED',
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  // Pull data from a publisher
  async pull(): Promise<any[]> {
    // In production, this would fetch actual listings
    console.log(`Pulling from ${this.publisher}...`);
    return [];
  }

  // Verify data consistency
  async verify(): Promise<{
    isConsistent: boolean;
    discrepancies: string[];
  }> {
    const discrepancies: string[] = [];
    
    // In production:
    // 1. Pull current live data from publisher
    // 2. Compare with knowledge graph
    // 3. Report any differences
    
    return {
      isConsistent: discrepancies.length === 0,
      discrepancies,
    };
  }

  // Record sync status in database
  private async recordSync(
    source: string,
    data: {
      status: string;
      lastSyncedAt?: Date;
      error?: string;
    }
  ) {
    await prisma.listingSync.upsert({
      where: {
        source_sourceEntityId: {
          source,
          sourceEntityId: 'primary',
        },
      },
      update: {
        syncStatus: data.status as any,
        syncError: data.error,
        lastSyncedAt: data.lastSyncedAt || new Date(),
      },
      create: {
        source,
        sourceEntityId: 'primary',
        syncStatus: data.status as any,
        syncError: data.error,
        lastSyncedAt: data.lastSyncedAt || new Date(),
      },
    });
  }

  // Run a full sync
  async syncAll(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    await this.authenticate();
    
    const locations = await this.getLocations();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const location of locations) {
      const result = await this.push(location as LocationData);
      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push(result.error || 'Unknown error');
      }
    }

    return { synced, failed, errors };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function syncToGoogle(): Promise<{
  synced: number;
  failed: number;
}> {
  const engine = new ListingsSyncEngine('google');
  const result = await engine.syncAll();
  return { synced: result.synced, failed: result.failed };
}

export async function syncToYelp(): Promise<{
  synced: number;
  failed: number;
}> {
  const engine = new ListingsSyncEngine('yelp');
  const result = await engine.syncAll();
  return { synced: result.synced, failed: result.failed };
}

export async function syncAll(): Promise<{
  results: Record<string, { synced: number; failed: number }>;
}> {
  const google = await syncToGoogle();
  const yelp = await syncToYelp();
  
  return {
    results: {
      google,
      yelp,
    },
  };
}

export async function verifyAll(): Promise<{
  publisher: string;
  isConsistent: boolean;
  discrepancies: string[];
}[]> {
  const publishers = ['google', 'yelp'] as const;
  const results = [];

  for (const publisher of publishers) {
    const engine = new ListingsSyncEngine(publisher);
    const result = await engine.verify();
    results.push({
      publisher,
      ...result,
    });
  }

  return results;
}
