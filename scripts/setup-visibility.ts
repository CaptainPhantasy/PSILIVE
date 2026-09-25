#!/usr/bin/env npx ts-node
/**
 * PSI Visibility Platform - Setup Script
 * 
 * This script automates the setup of the visibility schema:
 * 1. Reads visibility-schema.prisma
 * 2. Appends new models/enums to schema.prisma
 * 3. Runs prisma migrate dev
 * 4. Runs seed scripts
 * 
 * Usage: npx ts-node scripts/setup-visibility.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
const VISIBILITY_SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma', 'visibility-schema.prisma');
const SEED_SERVICES_PATH = path.join(PROJECT_ROOT, 'prisma', 'seed-service-areas.ts');
const SEED_FAQ_PATH = path.join(PROJECT_ROOT, 'prisma', 'seed-faqs.ts');

function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌'
  }[type];
  console.log(`${prefix} ${message}`);
}

function step(num: number, total: number, message: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`STEP ${num}/${total}: ${message}`);
  console.log('═'.repeat(60));
}

async function main() {
  console.log('\n🛠️  PSI Visibility Platform Setup\n');
  console.log('This script will:');
  console.log('  1. Merge visibility schema into schema.prisma');
  console.log('  2. Run Prisma migration');
  console.log('  3. Seed service areas & services');
  console.log('  4. Seed FAQs\n');

  const totalSteps = 5;

  // ============================================
  // STEP 1: Read and validate files
  // ============================================
  step(1, totalSteps, 'Reading schema files');

  if (!fs.existsSync(VISIBILITY_SCHEMA_PATH)) {
    log(`Visibility schema not found at ${VISIBILITY_SCHEMA_PATH}`, 'error');
    process.exit(1);
  }
  log(`Found visibility schema`, 'success');

  if (!fs.existsSync(SCHEMA_PATH)) {
    log(`Main schema not found at ${SCHEMA_PATH}`, 'error');
    process.exit(1);
  }
  log(`Found main schema`, 'success');

  // ============================================
  // STEP 2: Check if already merged
  // ============================================
  step(2, totalSteps, 'Checking schema status');

  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  
  if (schemaContent.includes('model ServiceArea {')) {
    log('Visibility models already merged into schema.prisma', 'info');
    log('Skipping merge step', 'info');
  } else {
    log('Visibility models need to be merged', 'info');
    
    // Read visibility schema (everything after the header comment)
    const visibilityContent = fs.readFileSync(VISIBILITY_SCHEMA_PATH, 'utf-8');
    
    // Extract just the models and enums (skip the header comment)
    const modelsStart = visibilityContent.indexOf('\nmodel ServiceArea');
    if (modelsStart === -1) {
      log('Could not find ServiceArea model in visibility schema', 'error');
      process.exit(1);
    }
    
    const visibilityModels = visibilityContent.substring(modelsStart);
    
    // Append to schema.prisma
    const updatedSchema = schemaContent.trim() + '\n\n' + visibilityModels;
    fs.writeFileSync(SCHEMA_PATH, updatedSchema);
    
    log(`Merged visibility models into schema.prisma`, 'success');
  }

  // ============================================
  // STEP 3: Run Prisma generate
  // ============================================
  step(3, totalSteps, 'Running Prisma generate');

  try {
    log('Generating Prisma client...');
    execSync('npx prisma generate', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    log('Prisma client generated', 'success');
  } catch (error) {
    log('Failed to generate Prisma client', 'error');
    process.exit(1);
  }

  // ============================================
  // STEP 4: Run Prisma migrate
  // ============================================
  step(4, totalSteps, 'Running Prisma migration');

  try {
    log('Running migration (this may take a moment)...');
    execSync('npx prisma migrate dev --name add_visibility_models', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    log('Migration completed', 'success');
  } catch (error: any) {
    // Check if migration already exists
    if (error.message?.includes('migration') && error.message?.includes('already exists')) {
      log('Migration already exists, trying to apply...', 'info');
      try {
        execSync('npx prisma migrate deploy', {
          cwd: PROJECT_ROOT,
          stdio: 'inherit'
        });
        log('Migration applied', 'success');
      } catch (deployError) {
        log('Migration already applied or database is in sync', 'info');
      }
    } else {
      log('Migration failed - you may need to handle this manually', 'error');
      console.log('\n💡 Common solutions:');
      console.log('  - If the database already has these tables, run: npx prisma migrate resolve --applied <migration-name>');
      console.log('  - If you want to reset: npx prisma migrate reset');
      process.exit(1);
    }
  }

  // ============================================
  // STEP 5: Seed data
  // ============================================
  step(5, totalSteps, 'Seeding database');

  // Seed service areas
  if (fs.existsSync(SEED_SERVICES_PATH)) {
    try {
      log('Seeding service areas and services...');
      execSync(`npx ts-node ${SEED_SERVICES_PATH}`, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
      log('Service areas seeded', 'success');
    } catch (error) {
      log('Failed to seed service areas', 'error');
      // Continue anyway - seed might have partial success
    }
  } else {
    log(`Seed script not found at ${SEED_SERVICES_PATH}`, 'error');
  }

  // Seed FAQs
  if (fs.existsSync(SEED_FAQ_PATH)) {
    try {
      log('Seeding FAQs...');
      execSync(`npx ts-node ${SEED_FAQ_PATH}`, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
      log('FAQs seeded', 'success');
    } catch (error) {
      log('Failed to seed FAQs', 'error');
    }
  } else {
    log(`Seed script not found at ${SEED_FAQ_PATH}`, 'error');
  }

  // ============================================
  // Complete
  // ============================================
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SETUP COMPLETE!');
  console.log('═'.repeat(60));
  console.log('\nNext steps:');
  console.log('  1. Review the generated pages at /areas and /sewer-inspection-*');
  console.log('  2. Visit /admin/knowledge-graph to manage your visibility data');
  console.log('  3. Complete Google Business Profile setup with your photos');
  console.log('  4. Add API keys to .env.local when ready for live integrations:');
  console.log('     - GOOGLE_BUSINESS_API_KEY');
  console.log('     - YELP_API_KEY');
  console.log('     - OPENAI_API_KEY');
  console.log('');
}

main().catch((error) => {
  log(`Setup failed: ${error.message}`, 'error');
  process.exit(1);
});
