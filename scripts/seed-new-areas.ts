// Surgical seed: adds ONLY the three new service areas (Westfield, Franklin,
// Greenfield) and links the existing service offerings to them. Upsert-only,
// no deletes, and it never touches the 10 pre-existing area rows — so any
// edits made through the admin dashboard stay intact. Safe to re-run.

import { PrismaClient } from '@prisma/client';
import { serviceAreas, serviceOfferings } from '../prisma/seed-service-areas';

const prisma = new PrismaClient();

const NEW_SLUGS = ['westfield-in', 'franklin-in', 'greenfield-in'];

async function main() {
  const newAreas = serviceAreas.filter((a) => NEW_SLUGS.includes(a.slug));
  if (newAreas.length !== NEW_SLUGS.length) {
    throw new Error(`Expected ${NEW_SLUGS.length} new areas in seed data, found ${newAreas.length}`);
  }

  console.log('Upserting 3 new service areas...');
  for (const area of newAreas) {
    const created = await prisma.serviceArea.upsert({
      where: { slug: area.slug },
      update: area,
      create: area,
    });
    console.log(`  ✓ ${created.name} (${created.slug})`);
  }

  // Link every existing offering to the new areas (same treatment as Carmel).
  // Uses the seed's own offering list to look up slugs, but only writes
  // pricing rows for the 3 new areas.
  console.log('Linking existing service offerings to the new areas...');
  const services = await prisma.serviceOffering.findMany({
    where: { slug: { in: serviceOfferings.map((s) => s.slug) } },
  });
  for (const area of newAreas) {
    const dbArea = await prisma.serviceArea.findUniqueOrThrow({ where: { slug: area.slug } });
    for (const service of services) {
      await prisma.serviceAreaPricing.upsert({
        where: {
          serviceAreaId_serviceId: {
            serviceAreaId: dbArea.id,
            serviceId: service.id,
          },
        },
        update: {
          isAvailable: true,
          estimatedWaitDays: service.slug.includes('emergency') ? 0 : 1,
        },
        create: {
          serviceAreaId: dbArea.id,
          serviceId: service.id,
          isAvailable: true,
          estimatedWaitDays: service.slug.includes('emergency') ? 0 : 1,
        },
      });
    }
    console.log(`  ✓ Linked ${services.length} services to ${area.name}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
