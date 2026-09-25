import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// This endpoint creates all products and prices in your Stripe account
// Run once to set up your Stripe catalog, then save the price IDs
export async function POST(request: NextRequest) {
  // Simple auth check - require a secret header
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.STRIPE_SECRET_KEY?.slice(-10)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = [
      {
        name: 'Standard Sewer Inspection',
        description: 'HD video inspection of your main sewer line with written report delivered within one business day. Includes standard cleanout access.',
        amount: 15900, // $159.00
        key: 'STANDARD_INSPECTION',
      },
      {
        name: 'Additional Unit Inspection',
        description: 'Additional unit inspection for multi-family properties when using the same access point.',
        amount: 12900, // $129.00
        key: 'ADDITIONAL_UNIT',
      },
      {
        name: 'Same-Day Report Delivery',
        description: 'Expedited report delivery on the same day of inspection.',
        amount: 3900, // $39.00
        key: 'SAME_DAY_DELIVERY',
      },
      {
        name: 'Roof Vent Access',
        description: 'Camera entry via plumbing vent on roof.',
        amount: 5000, // $50.00
        key: 'ROOF_VENT_ACCESS',
      },
      {
        name: 'Toilet Pull & Reset',
        description: 'Includes new wax ring and supply line. Reusing supply lines is the #1 cause of post-inspection leaks.',
        amount: 6500, // $65.00
        key: 'TOILET_PULL',
      },
      {
        name: 'Crawl Space Access',
        description: 'Additional fee for crawl space entry.',
        amount: 3000, // $30.00
        key: 'CRAWL_SPACE',
      },
      {
        name: 'Clean-Out Cap Replacement',
        description: 'Cut out and replace damaged or inaccessible cleanout cap.',
        amount: 5000, // $50.00
        key: 'CLEANOUT_CAP',
      },
      {
        name: 'Additional Cleanout Inspection',
        description: 'Additional cleanout inspection performed on same visit.',
        amount: 12900, // $129.00
        key: 'ADDITIONAL_CLEANOUT',
      },
    ];

    const createdProducts: Array<{ key: string; productId: string; priceId: string; name: string; amount: number }> = [];

    for (const item of products) {
      // Create product
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: {
          key: item.key,
        },
      });

      // Create price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: item.amount,
        currency: 'usd',
        metadata: {
          key: item.key,
        },
      });

      createdProducts.push({
        key: item.key,
        productId: product.id,
        priceId: price.id,
        name: item.name,
        amount: item.amount,
      });
    }

    // Return the created products with their IDs
    // Save these price IDs to your .env file
    return NextResponse.json({
      success: true,
      message: 'Products created successfully. Save these price IDs to your .env file.',
      products: createdProducts,
      envFormat: createdProducts.map(p => `STRIPE_PRICE_${p.key}=${p.priceId}`).join('\n'),
    });
  } catch (error) {
    console.error('Error creating products:', error);
    return NextResponse.json(
      { error: 'Failed to create products', details: String(error) },
      { status: 500 }
    );
  }
}
