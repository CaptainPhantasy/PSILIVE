// ============================================================================
// PSI SERVICE AREAS SEED DATA
// Indianapolis Metro Area Coverage
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const serviceAreas = [
  {
    name: 'Indianapolis',
    slug: 'indianapolis-in',
    city: 'Indianapolis',
    state: 'IN',
    zipCodes: ['46201', '46202', '46203', '46204', '46205', '46206', '46208', '46209', '46211', '46214', '46216', '46217', '46218', '46219', '46220', '46221', '46222', '46224', '46225', '46226', '46227', '46228', '46229', '46230', '46234', '46235', '46236', '46237', '46239', '46240', '46241', '46242', '46244', '46249', '46250', '46251', '46253', '46254', '46255', '46256', '46259', '46260', '46262', '46266', '46268', '46274', '46275', '46277', '46278', '46280', '46282', '46283', '46285', '46290'],
    population: 887642,
    priority: 10,
    description: 'Indianapolis, the Circle City, is home to precision sewer inspection services you can trust. Our Indianapolis-based inspector provides fast, thorough sewer camera inspections for homeowners, realtors, and property managers across the metro.',
    localKeywords: ['Indianapolis sewer inspection', 'Indy sewer camera', 'Indianapolis drain inspection', 'Circle City plumbing inspection'],
    geoBounds: {
      north: 39.9241,
      south: 39.6141,
      east: -85.9141,
      west: -86.2641,
      center: { lat: 39.7684, lng: -86.1581 }
    }
  },
  {
    name: 'Carmel',
    slug: 'carmel-in',
    city: 'Carmel',
    state: 'IN',
    zipCodes: ['46032', '46033', '46082', '46033'],
    population: 101068,
    priority: 9,
    description: 'Carmel, Indiana\'s thriving arts and business hub, deserves sewer inspection services as sophisticated as the city itself. We serve Carmel homeowners with cutting-edge camera technology and detailed reporting.',
    localKeywords: ['Carmel sewer inspection', 'Carmel IN sewer camera', 'Hamilton County sewer inspection'],
    geoBounds: {
      north: 39.9785,
      south: 39.9385,
      east: -86.0785,
      west: -86.1785,
      center: { lat: 39.9784, lng: -86.1181 }
    }
  },
  {
    name: 'Fishers',
    slug: 'fishers-in',
    city: 'Fishers',
    state: 'IN',
    zipCodes: ['46037', '46038', '46085'],
    population: 95272,
    priority: 8,
    description: 'Fishers, one of Indiana\'s fastest-growing communities, trusts our team for comprehensive sewer inspections. Whether you\'re buying your first home or selling an investment property, we\'ve got you covered.',
    localKeywords: ['Fishers sewer inspection', 'Fishers IN sewer camera', 'Fishers drain inspection'],
    geoBounds: {
      north: 39.9562,
      south: 39.8962,
      east: -85.8962,
      west: -86.0562,
      center: { lat: 39.9563, lng: -86.0269 }
    }
  },
  {
    name: 'Noblesville',
    slug: 'noblesville-in',
    city: 'Noblesville',
    state: 'IN',
    zipCodes: ['46060', '46062', '46070'],
    population: 65874,
    priority: 7,
    description: 'Historic Noblesville combines small-town charm with modern amenities—and we bring the same approach to sewer inspections. Our detailed reports help Noblesville homeowners make informed decisions.',
    localKeywords: ['Noblesville sewer inspection', 'Noblesville IN sewer camera', 'Noblesville drain camera'],
    geoBounds: {
      north: 40.0456,
      south: 39.9856,
      east: -85.9656,
      west: -86.0856,
      center: { lat: 40.0456, lng: -86.0086 }
    }
  },
  {
    name: 'Greenwood',
    slug: 'greenwood-in',
    city: 'Greenwood',
    state: 'IN',
    zipCodes: ['46142', '46143', '46145', '46151'],
    population: 59778,
    priority: 7,
    description: 'Southside Indianapolis families trust Greenwood sewer inspection services for peace of mind. Our camera inspections help Greenwood homeowners catch problems early, before they become expensive repairs.',
    localKeywords: ['Greenwood sewer inspection', 'Greenwood IN sewer camera', 'Southport sewer inspection'],
    geoBounds: {
      north: 39.6289,
      south: 39.5789,
      east: -86.0789,
      west: -86.1989,
      center: { lat: 39.6134, lng: -86.1833 }
    }
  },
  {
    name: 'Avon',
    slug: 'avon-in',
    city: 'Avon',
    state: 'IN',
    zipCodes: ['46123', '46168'],
    population: 18894,
    priority: 5,
    description: 'Avon\'s growing community deserves reliable sewer inspection services. We provide thorough camera inspections for Avon homeowners and realtors, helping ensure smooth property transactions.',
    localKeywords: ['Avon Indiana sewer inspection', 'Avon IN sewer camera', 'Washington Township sewer inspection'],
    geoBounds: {
      north: 39.7756,
      south: 39.7256,
      east: -86.3456,
      west: -86.4456,
      center: { lat: 39.7639, lng: -86.3997 }
    }
  },
  {
    name: 'Plainfield',
    slug: 'plainfield-in',
    city: 'Plainfield',
    state: 'IN',
    zipCodes: ['46168', '46113'],
    population: 34625,
    priority: 5,
    description: 'Plainfield offers small-town living with easy access to Indianapolis—and our sewer inspection services match that convenience. Fast scheduling, thorough inspections, detailed reports.',
    localKeywords: ['Plainfield Indiana sewer inspection', 'Plainfield IN sewer camera', 'Guilford Township sewer inspection'],
    geoBounds: {
      north: 39.7289,
      south: 39.6789,
      east: -86.3289,
      west: -86.4289,
      center: { lat: 39.7042, lng: -86.3994 }
    }
  },
  {
    name: 'Brownsburg',
    slug: 'brownsburg-in',
    city: 'Brownsburg',
    state: 'IN',
    zipCodes: ['46112', '46124'],
    population: 27093,
    priority: 5,
    description: 'Brownsburg\'s family-friendly atmosphere extends to its sewer services. We provide comprehensive inspections that help Brownsburg residents understand exactly what\'s happening underground.',
    localKeywords: ['Brownsburg Indiana sewer inspection', 'Brownsburg IN sewer camera', 'Hendricks County sewer inspection'],
    geoBounds: {
      north: 39.8689,
      south: 39.8189,
      east: -86.3589,
      west: -86.4789,
      center: { lat: 39.8406, lng: -86.3972 }
    }
  },
  {
    name: 'Zionsville',
    slug: 'zionsville-in',
    city: 'Zionsville',
    state: 'IN',
    zipCodes: ['46077', '46037'],
    population: 29836,
    priority: 6,
    description: 'Zionsville\'s charming village and rural estates both need quality sewer inspections. Our team serves Zionsville\'s unique properties with specialized inspection equipment for all types of systems.',
    localKeywords: ['Zionsville sewer inspection', 'Zionsville IN sewer camera', 'Zionsville drain inspection'],
    geoBounds: {
      north: 40.0689,
      south: 39.9489,
      east: -86.2589,
      west: -86.3589,
      center: { lat: 39.9506, lng: -86.2836 }
    }
  },
  {
    name: 'Geist',
    slug: 'geist-indianapolis-in',
    city: 'Indianapolis',
    state: 'IN',
    zipCodes: ['46236', '46250', '46256'],
    population: 15000,
    priority: 6,
    description: 'Geist Reservoir residents trust our team for specialized inspections in the Geist area. From lakeside properties to suburban homes, we understand the unique sewer challenges of the Geist community.',
    localKeywords: ['Geist Reservoir sewer inspection', 'Geist Indianapolis sewer camera', 'Fall Creek sewer inspection'],
    geoBounds: {
      north: 39.9489,
      south: 39.8689,
      east: -85.9289,
      west: -86.0689,
      center: { lat: 39.9089, lng: -85.9989 }
    }
  },
  {
    name: 'Westfield',
    slug: 'westfield-in',
    city: 'Westfield',
    state: 'IN',
    zipCodes: ['46074', '46062'],
    population: 54894,
    priority: 8,
    description: 'Westfield\'s rapid residential boom and thriving Grand Park area require dependable sewer inspection services. We help Westfield home buyers, sellers, and realtors inspect both newly constructed PVC lines and established sewer laterals before closing.',
    localKeywords: ['Westfield sewer inspection', 'Westfield IN sewer camera', 'Hamilton County sewer inspection', 'Grand Park sewer scope'],
    geoBounds: {
      north: 40.0828,
      south: 40.0028,
      east: -86.0675,
      west: -86.1875,
      center: { lat: 40.0428, lng: -86.1275 }
    }
  },
  {
    name: 'Franklin',
    slug: 'franklin-in',
    city: 'Franklin',
    state: 'IN',
    zipCodes: ['46131'],
    population: 26633,
    priority: 6,
    description: 'As the Johnson County seat, historic Franklin features a mix of classic homes with aging clay pipes and new suburban developments. Our HD camera scope inspections provide Franklin homeowners with clear, unvarnished video evidence of underground line health.',
    localKeywords: ['Franklin sewer inspection', 'Franklin IN sewer camera', 'Johnson County sewer inspection', 'Franklin College area plumbing camera'],
    geoBounds: {
      north: 39.5206,
      south: 39.4406,
      east: -85.9950,
      west: -86.1150,
      center: { lat: 39.4806, lng: -86.0550 }
    }
  },
  {
    name: 'Greenfield',
    slug: 'greenfield-in',
    city: 'Greenfield',
    state: 'IN',
    zipCodes: ['46140'],
    population: 24741,
    priority: 6,
    description: 'Greenfield homeowners and real estate investors trust our unbiased sewer inspection services along the I-70 corridor. We specialize in detecting root intrusion, line sags, and material transitions across Hancock County.',
    localKeywords: ['Greenfield sewer inspection', 'Greenfield IN sewer camera', 'Hancock County sewer inspection', 'Greenfield drain camera'],
    geoBounds: {
      north: 39.8250,
      south: 39.7450,
      east: -85.7094,
      west: -85.8294,
      center: { lat: 39.7850, lng: -85.7694 }
    }
  }
];

export const serviceOfferings = [
  {
    name: 'Standard Sewer Inspection',
    slug: 'standard-sewer-inspection',
    description: 'A comprehensive sewer line inspection using state-of-the-art camera technology. Our inspector inserts a high-resolution camera into your sewer line to identify cracks, blockages, root intrusion, and other issues. You receive a detailed video report and written summary of findings.',
    shortDescription: 'Complete sewer line inspection with HD video camera and detailed report.',
    basePrice: 159,
    priceUnit: 'flat rate',
    features: [
      'HD video camera inspection',
      'Real-time video feed',
      'Written inspection report',
      'Video recording via secure download link',
      'Problem area photography',
      'Location mapping of issues'
    ],
    avgDuration: 45,
    icon: 'camera',
    isFeatured: true,
    sortOrder: 1
  },
  {
    name: 'Sewer Inspection with Crawl Space Access',
    slug: 'sewer-inspection-crawl-space',
    description: 'For homes with crawl space access, this comprehensive inspection covers both the main sewer line and the crawl space plumbing. Ideal for older homes or properties with known issues.',
    shortDescription: 'Extended inspection covering crawl space plumbing and main sewer line.',
    basePrice: 189, // $159 base + $30 crawl-space access; matches the standard access-fee schedule
    priceUnit: 'flat rate',
    features: [
      'Full sewer line camera inspection',
      'Crawl space plumbing inspection',
      'HD video documentation',
      'Complete written report',
      'Problem prioritization',
      'Next-step guidance when requested'
    ],
    avgDuration: 60,
    icon: 'search',
    isFeatured: false,
    sortOrder: 2
  },
  {
    name: 'Pre-Sale Sewer Inspection',
    slug: 'pre-sale-sewer-inspection',
    description: 'Before listing your home, know exactly what buyers will discover. This inspection includes a seller\'s disclosure package, pre-listing documentation, and priority scheduling so you can address issues before negotiations begin.',
    shortDescription: 'Seller-focused inspection with disclosure documentation and priority scheduling.',
    basePrice: 159,
    priceUnit: 'flat rate',
    features: [
      'Standard sewer inspection',
      'Seller\'s disclosure documentation',
      'Pre-listing condition report',
      'Priority scheduling',
      'Realtor summary report',
      '7-day rush turnaround'
    ],
    avgDuration: 45,
    icon: 'home',
    isFeatured: true,
    sortOrder: 3
  },
  {
    name: 'Buyer\'s Sewer Inspection',
    slug: 'buyers-sewer-inspection',
    description: 'Don\'t let hidden sewer problems derail your home purchase. Our buyer\'s inspection gives you the information needed to negotiate repairs, request credits, or walk away from a bad deal.',
    shortDescription: 'Home buyer sewer inspection with negotiation documentation.',
    basePrice: 159,
    priceUnit: 'flat rate',
    features: [
      'Complete sewer camera inspection',
      'Buyer\'s summary report',
      'Repair cost estimates',
      'Negotiation documentation',
      'Realtor-friendly format',
      'Insurance claim support'
    ],
    avgDuration: 45,
    icon: 'document',
    isFeatured: true,
    sortOrder: 4
  },
  {
    name: 'Emergency Sewer Service',
    slug: 'emergency-sewer-service',
    description: 'Sewer emergencies don\'t wait for business hours. Our emergency service provides rapid response inspection and assessment for urgent situations like sewage backups, major leaks, or suspected line failures.',
    shortDescription: 'Rapid response emergency sewer inspection and assessment.',
    basePrice: 299,
    priceUnit: 'flat rate',
    features: [
      'Same-day/next-day response',
      'Priority scheduling',
      'Emergency assessment',
      'After-hours availability',
      'Immediate verbal report',
      'Full documentation within 24hrs'
    ],
    avgDuration: 30,
    icon: 'alert',
    isActive: false, // QUARANTINED 2026-07-31: PSI offers no emergency service (owner ruling, truth run). Not deleted; disabled in DB too.
    isFeatured: false,
    sortOrder: 5
  },
  {
    name: 'Commercial Sewer Inspection',
    slug: 'commercial-sewer-inspection',
    description: 'For commercial properties, restaurants, and multi-family buildings, our commercial inspection service handles larger systems and complex infrastructure with professional documentation.',
    shortDescription: 'Commercial-grade inspection for business properties and multi-family buildings.',
    basePrice: 0,
    priceUnit: 'starting at',
    features: [
      'Commercial system inspection',
      'ADA compliance documentation',
      'Grease trap assessment (restaurants)',
      'Multiple access point coverage',
      'Commercial report format',
      'Maintenance guidance when requested'
    ],
    avgDuration: 120,
    icon: 'building',
    isFeatured: false,
    sortOrder: 6
  },
  {
    name: 'Sewer Line Locating',
    slug: 'sewer-line-locating',
    description: 'Before digging for landscaping or construction, know exactly where your sewer lines run. We use electronic locating equipment to trace and mark your entire sewer system.',
    shortDescription: 'Electronic sewer line tracing and mapping service.',
    basePrice: 99,
    priceUnit: 'flat rate',
    features: [
      'Electronic line tracing',
      'Depth measurement',
      'Written map of sewer lines',
      'Marking of access points',
      'Photo documentation',
      'Construction planning support'
    ],
    avgDuration: 30,
    icon: 'map',
    isFeatured: false,
    sortOrder: 7
  }
];

async function main() {
  console.log('🌱 Seeding PSI Service Areas and Offerings...\n');

  // Create Service Areas
  console.log('📍 Creating Service Areas...');
  for (const area of serviceAreas) {
    const created = await prisma.serviceArea.upsert({
      where: { slug: area.slug },
      update: area,
      create: area,
    });
    console.log(`   ✓ ${created.name} (${created.priority} priority)`);
  }

  // Create Service Offerings
  console.log('\n🔧 Creating Service Offerings...');
  for (const service of serviceOfferings) {
    const created = await prisma.serviceOffering.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
    console.log(`   ✓ ${created.name} ($${created.basePrice})`);
  }

  // Link all services to all areas (all available everywhere)
  console.log('\n🔗 Linking Services to Areas...');
  const areas = await prisma.serviceArea.findMany();
  const services = await prisma.serviceOffering.findMany();

  for (const area of areas) {
    for (const service of services) {
      await prisma.serviceAreaPricing.upsert({
        where: {
          serviceAreaId_serviceId: {
            serviceAreaId: area.id,
            serviceId: service.id,
          }
        },
        update: {
          isAvailable: true,
          estimatedWaitDays: service.slug.includes('emergency') ? 0 : 1,
        },
        create: {
          serviceAreaId: area.id,
          serviceId: service.id,
          isAvailable: true,
          estimatedWaitDays: service.slug.includes('emergency') ? 0 : 1,
        },
      });
    }
    console.log(`   ✓ Linked all services to ${area.name}`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   • ${areas.length} service areas`);
  console.log(`   • ${services.length} service offerings`);
}

// Only run the full seed when this file is executed directly
// (`tsx prisma/seed-service-areas.ts`). Importing its data arrays from another
// script (e.g. scripts/seed-new-areas.ts) must NOT trigger a full re-seed.
if (process.argv[1] && process.argv[1].includes('seed-service-areas')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
