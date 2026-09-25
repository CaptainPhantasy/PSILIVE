// ============================================================================
// PSI FAQ SEED DATA
// Common questions about sewer inspections
// ============================================================================

import { PrismaClient, FAQCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const faqs: { question: string; answer: string; shortAnswer: string; category: FAQCategory; keywords: string[]; sortOrder: number; isPublished: boolean }[] = [
  // GENERAL
  {
    question: 'What is a sewer camera inspection?',
    answer: 'A sewer camera inspection involves inserting a specialized waterproof camera into your sewer line to visually inspect the entire pipe. Our high-resolution cameras can travel through bends and transitions, identifying cracks, root intrusion, blockages, bellies, offset joints, and other issues. The entire process is recorded, and you receive a complete video report along with a written summary of findings.',
    shortAnswer: 'A sewer camera inspection uses a waterproof video camera to inspect your pipes and identify problems like cracks, roots, and blockages.',
    category: 'GENERAL',
    keywords: ['sewer camera', 'video inspection', 'drain camera', 'pipe inspection'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'How long does a sewer inspection take?',
    answer: 'A standard sewer inspection typically takes 30-60 minutes depending on the complexity of your system and the length of the sewer line. Simple inspections on average homes take about 45 minutes. If additional access points need to be located or if significant issues are found, the inspection may take longer.',
    shortAnswer: 'Standard inspections take 30-60 minutes, with most averaging around 45 minutes.',
    category: 'GENERAL',
    keywords: ['how long', 'duration', 'time', 'appointment length'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'Do I need to be home during the inspection?',
    answer: 'For the initial portion of the inspection, we recommend you be present so we can explain what we find in real-time. However, if you need to leave, we can complete the inspection and provide you with a complete video and written report afterward. If accessing an exterior cleanout, we typically do not need anyone home after initial access is confirmed.',
    shortAnswer: 'Present for the beginning is ideal, but we can complete the inspection and send your report if you need to leave.',
    category: 'GENERAL',
    keywords: ['home', 'present', 'required', 'access'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'What equipment do you use?',
    answer: 'We run three professional camera scope systems, matched to the job. Our high-end system carries an electronic locator and sonde transmitter — that lets us pinpoint the camera\'s exact underground location and depth from the surface. Every system records high-definition video for your report.',
    shortAnswer: 'Three camera systems, including a high-end unit with locator and sonde for exact underground positioning.',
    category: 'GENERAL',
    keywords: ['equipment', 'tools', 'camera', 'brand', 'RIDGID', 'SeeSnake', 'locator'],
    sortOrder: 4,
    isPublished: true
  },

  // BOOKING
  {
    question: 'How do I schedule a sewer inspection?',
    answer: 'Scheduling is easy! You can book online through our website 24/7, or call or text us at (317) 620-3858 during business hours. We\'ll confirm your appointment time and send you a reminder before we arrive.',
    shortAnswer: 'Book online anytime, or call/text (317) 620-3858 during business hours.',
    category: 'BOOKING',
    keywords: ['schedule', 'appointment', 'book', 'booking', 'how to schedule'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'What are your hours of operation?',
    answer: 'We offer flexible scheduling to meet your needs. Standard appointments are available Monday through Saturday. Contact us to find a time that works for your schedule.',
    shortAnswer: 'Monday through Saturday.',
    category: 'BOOKING',
    keywords: ['hours', 'open', 'available', 'days', 'weekend', 'evening'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'Do you offer same-day or emergency service?',
    answer: 'We don\'t offer emergency callout service. You can see real-time availability and book the earliest open slot online, and for time-sensitive real estate transactions every report is delivered within one business day.',
    shortAnswer: 'No emergency callout — book the earliest open slot online; reports arrive within one business day.',
    category: 'BOOKING',
    keywords: ['emergency', 'same day', 'urgent', 'rush', 'immediate'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'Is there a cancellation policy?',
    answer: 'We understand plans change. If you need to reschedule, please give us at least 24 hours notice so we can offer your time slot to another customer. Cancellations within 24 hours of the appointment may be subject to a fee. No-shows without notice may be charged the full inspection fee.',
    shortAnswer: 'Please provide 24 hours notice for rescheduling to avoid fees.',
    category: 'BOOKING',
    keywords: ['cancel', 'reschedule', 'policy', 'fee'],
    sortOrder: 4,
    isPublished: true
  },
  {
    question: 'What areas do you serve?',
    answer: 'We proudly serve the greater Indianapolis metro area including Indianapolis, Carmel, Fishers, Noblesville, Greenwood, Avon, Plainfield, Brownsburg, Zionsville, and surrounding communities. If you\'re unsure whether we serve your area, just ask!',
    shortAnswer: 'Greater Indianapolis metro including Carmel, Fishers, Noblesville, Greenwood, and surrounding communities.',
    category: 'BOOKING',
    keywords: ['areas', 'service area', 'locations', 'Indianapolis', 'Carmel', 'Fishers'],
    sortOrder: 5,
    isPublished: true
  },

  // PRICING
  {
    question: 'How much does a sewer inspection cost?',
    answer: 'Our standard sewer inspection is $159 for most residential properties with cleanout access. This includes the complete camera inspection, HD video recording, and a written report delivered within one business day. Additional access methods like roof vent access (+$50), toilet pull (+$65), or crawl space access (+$30) have different pricing. We provide upfront pricing before starting any work.',
    shortAnswer: 'Standard residential inspection starts at $159 with complete report and video included.',
    category: 'PRICING',
    keywords: ['cost', 'price', 'cost', 'fee', 'how much', 'pricing'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'Are there any additional fees?',
    answer: 'Our quoted price includes the inspection, report, and video. There are no hidden fees. If additional services are needed (like line locating or work beyond standard access points), we\'ll discuss pricing with you before proceeding. You\'ll never be surprised by charges on your invoice.',
    shortAnswer: 'Quoted prices are all-inclusive. Additional services are discussed before work begins.',
    category: 'PRICING',
    keywords: ['fees', 'extra', 'additional', 'hidden', 'surprise'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'Do you offer discounts?',
    answer: 'We keep pricing simple: a flat $159 standard inspection with upfront pricing before any work begins — you never need a coupon to get our best price. Realtors and multi-property clients: ask about partner pricing when booking.',
    shortAnswer: 'Flat $159 standard pricing, upfront with no surprises. Partner pricing available for realtors.',
    category: 'PRICING',
    keywords: ['discount', 'military', 'senior', 'referral', 'savings', 'coupon'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'What forms of payment do you accept?',
    answer: 'We accept all major credit cards, debit cards, cash, and checks. Payment is expected at the time of service unless other arrangements have been made in advance.',
    shortAnswer: 'Credit cards, debit cards, cash, and checks.',
    category: 'PRICING',
    keywords: ['payment', 'credit card', 'cash', 'check', 'financing'],
    sortOrder: 4,
    isPublished: true
  },

  // TECHNICAL
  {
    question: 'What can a sewer camera find that other methods cannot?',
    answer: 'Sewer camera inspections can identify many issues that aren\'t detectable through external inspection or drain cleaning: Hairline cracks in pipes, Root intrusion (even small amounts), Offset or separated joints, Bellies (low spots where waste collects), Grease buildup, Foreign objects, Pipe material deterioration, and collapsed or crushed sections. This information helps you address problems before they become emergencies.',
    shortAnswer: 'Cameras detect cracks, roots, bellies, offsets, and other hidden issues invisible from outside.',
    category: 'TECHNICAL',
    keywords: ['cracks', 'roots', 'damage', 'problems', 'issues', 'findings'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'How do I know if I need a sewer inspection?',
    answer: 'Consider an inspection if: You\'re buying or selling a home, You\'re experiencing slow drains or recurring clogs, You smell sewer gas in your home, You have multiple drains backing up simultaneously, You\'re planning major renovations, You notice wet spots in your yard near sewer lines, Your home is over 25 years old and hasn\'t had an inspection, or You\'re just being proactive about home maintenance.',
    shortAnswer: 'Get an inspection when buying/selling, with slow drains, bad smells, or as preventive maintenance.',
    category: 'TECHNICAL',
    keywords: ['signs', 'when', 'need', 'symptoms', 'problems', 'slow drains'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'What\'s the difference between sewer inspection and drain cleaning?',
    answer: 'Sewer inspection uses a camera to see inside pipes and diagnose problems. Drain cleaning uses specialized tools to remove clogs and buildup. Think of it this way: inspection diagnoses, cleaning treats. Often we\'ll inspect first to see exactly what\'s causing problems, then recommend cleaning only if needed. This approach saves you money by avoiding unnecessary cleaning.',
    shortAnswer: 'Inspection diagnoses problems with a camera; cleaning removes blockages. We inspect before recommending cleaning.',
    category: 'TECHNICAL',
    keywords: ['drain cleaning', 'clog', 'difference', 'vs', 'clearing'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'What pipe materials can you inspect?',
    answer: 'We can inspect all common residential sewer pipe materials including: Cast Iron (common in older homes), Clay/Terracotta (very old homes), PVC (most common in newer construction), ABS (popular since the 1970s), Orangeburg (homes from 1940s-1970s), Concrete (commercial and some residential), and even cast-in-place pipes. Our cameras work in pipes from 2 to 12 inches in diameter.',
    shortAnswer: 'We inspect all pipe types: cast iron, clay, PVC, ABS, orangeburg, concrete, and more.',
    category: 'TECHNICAL',
    keywords: ['pipes', 'materials', 'cast iron', 'PVC', 'clay', 'ABS'],
    sortOrder: 4,
    isPublished: true
  },
  {
    question: 'What is a sewer belly and why does it matter?',
    answer: 'A "belly" is a low spot or sag in the sewer line where waste and water collect instead of flowing freely. Bellies can cause slow drains, frequent clogs, and waste accumulation that leads to pipe deterioration. They\'re often caused by soil settling or improper original installation. Our camera can identify bellies and measure their depth, helping you decide if repair is needed.',
    shortAnswer: 'A belly is a low spot where waste collects, causing slow drains and potential damage. We can identify and measure them.',
    category: 'TECHNICAL',
    keywords: ['belly', 'sag', 'low spot', 'grade', 'slope'],
    sortOrder: 5,
    isPublished: true
  },
  {
    question: 'Can you inspect pipes under a concrete slab?',
    answer: 'Yes, if there\'s an accessible entry point (like a cleanout or toilet drain), we can often inspect pipes running under concrete slabs. However, some slab pipes may require cutting access holes or using existing plumbing connections. We\'ll assess your specific situation and explain all options during booking.',
    shortAnswer: 'Yes, through accessible entry points. We\'ll assess your situation and explain all options.',
    category: 'TECHNICAL',
    keywords: ['slab', 'concrete', 'basement', 'foundation', 'under floor'],
    sortOrder: 6,
    isPublished: true
  },

  // PROCESS
  {
    question: 'What happens during a sewer inspection?',
    answer: 'Here\'s what to expect: 1) Technician arrives and accesses your sewer system, usually through an exterior cleanout. 2) Camera is inserted and travels through the entire accessible sewer line. 3) You can watch the live video feed if you\'d like. 4) Technician identifies and explains issues as they\'re found. 5) Camera is removed and final assessment is provided. 6) Written report and video recording are prepared and delivered. The whole process typically takes 45-60 minutes.',
    shortAnswer: 'We insert a camera through your cleanout, inspect the full line while you watch, then deliver a complete report.',
    category: 'PROCESS',
    keywords: ['what to expect', 'process', 'procedure', 'during', 'steps'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'How do I prepare for my inspection?',
    answer: 'Preparing for your inspection is simple: Clear access to your cleanout (usually in the yard or basement), Ensure toilets are accessible for potential toilet removal access, Make a list of any drain problems you\'ve noticed, Have your home\'s plumbing history ready if available, and Plan to be home for at least the beginning of the appointment. No need to stop using your drains beforehand—our camera can work through normal waste.',
    shortAnswer: 'Clear cleanout access, make a list of drain issues, and be present at the start. Normal drain use is fine.',
    category: 'PROCESS',
    keywords: ['prepare', 'preparation', 'before', 'access', 'cleanout'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'What is a cleanout and do I need one?',
    answer: 'A cleanout is a covered access point that allows entry into your sewer line. If your home doesn\'t have an accessible cleanout, we may need to create one during the inspection or recommend installation. Some inspections can be performed through a toilet drain, but cleanout access is preferred as it provides a better view of the entire system. We can discuss your specific situation when you book.',
    shortAnswer: 'A cleanout is an access point to your sewer line. We can often work through toilets if no cleanout exists.',
    category: 'PROCESS',
    keywords: ['cleanout', 'access', 'entry', 'point', 'toilet'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'When will I get my report?',
    answer: 'You\'ll receive your written report and video recording after the inspection — delivered within one business day via secure download link.',
    shortAnswer: 'Reports delivered immediately after inspection, typically within hours via USB or secure download.',
    category: 'PROCESS',
    keywords: ['report', 'when', 'delivery', 'video', 'results', 'turnaround'],
    sortOrder: 4,
    isPublished: true
  },

  // AFTER SERVICE
  {
    question: 'What do I do if problems are found?',
    answer: 'After your inspection, you\'ll have a clear understanding of anything the camera found. We don\'t sell repairs and we don\'t refer contractors — you get the footage, the location, and plain-English facts you can hand to any contractor you choose.',
    shortAnswer: 'We explain findings clearly; any repair is yours to arrange with any contractor you choose.',
    category: 'AFTER_SERVICE',
    keywords: ['repair', 'fix', 'problems', 'recommendations', 'next steps'],
    sortOrder: 1,
    isPublished: true
  },
  {
    question: 'Can you repair the issues you find?',
    answer: 'PSI provides inspection findings and clear reporting. Our sister company, Indiana Drain Company, offers optional cleaning, maintenance, and qualifying repair services. When you ask for guidance, we can discuss practical next steps and a separate quote where appropriate. You may choose IDC, another provider, or no additional service; your findings do not depend on that choice.',
    shortAnswer: 'PSI reports the findings. Optional IDC services and next-step guidance are available when requested, with separate approval.',
    category: 'AFTER_SERVICE',
    keywords: ['repair', 'fix', 'plumber', 'contractor', 'recommend'],
    sortOrder: 2,
    isPublished: true
  },
  {
    question: 'Is there a warranty on your inspection?',
    answer: 'We stand behind our inspections. If we inspect a section of pipe and you later discover an issue that was present but not identified during the inspection, contact us. We\'ll revisit the inspection at no charge. Note: We cannot warrant future damage, damage that occurs after the inspection, or issues in sections of pipe that were inaccessible.',
    shortAnswer: 'We stand behind our work. Contact us if you find an issue we missed in the inspected section.',
    category: 'AFTER_SERVICE',
    keywords: ['warranty', 'guarantee', 'promise', 'stand behind'],
    sortOrder: 3,
    isPublished: true
  },
  {
    question: 'How often should I have my sewer inspected?',
    answer: 'We recommend: Every 3-5 years as routine maintenance, Before purchasing any home, Before major renovations that involve plumbing, If you\'re experiencing recurring drain problems, and If your home is over 25 years old and you\'ve never had an inspection. Regular inspections catch problems early when they\'re easier and less expensive to address.',
    shortAnswer: 'Every 3-5 years for maintenance, before buying a home, and before major plumbing work.',
    category: 'AFTER_SERVICE',
    keywords: ['how often', 'frequency', 'maintenance', 'routine', 'preventive'],
    sortOrder: 4,
    isPublished: true
  },
  {
    question: 'Why should I leave a review?',
    answer: 'Your review helps other homeowners in our community make informed decisions about sewer services. It also helps our small business grow through word-of-mouth referrals. If we did a great job for you, we\'d truly appreciate you sharing your experience on Google, Yelp, or our website. If something could have been better, please contact us directly so we can make it right.',
    shortAnswer: 'Reviews help other homeowners find us and help us improve. Contact us directly if anything wasn\'t perfect.',
    category: 'AFTER_SERVICE',
    keywords: ['review', 'testimonial', 'feedback', 'google', 'yelp'],
    sortOrder: 5,
    isPublished: true
  }
];

async function main() {
  console.log('🌱 Seeding PSI FAQs...\n');

  for (const faq of faqs) {
    const created = await prisma.fAQ.upsert({
      where: {
        // Use question as unique identifier
        id: faq.question
      },
      update: {
        ...faq,
      },
      create: {
        ...faq,
      },
    });
    console.log(`   ✓ ${faq.category}: ${faq.question.substring(0, 50)}...`);
  }

  console.log(`\n✅ Seed complete! ${faqs.length} FAQs created.`);
}

// Only run when executed directly — importing the `faqs` array from another
// script must NOT trigger a re-seed.
if (process.argv[1] && process.argv[1].includes('seed-faqs')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
