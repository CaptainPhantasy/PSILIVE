export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isFieldOperatorRole } from "@/lib/auth/permissions";

// Property data interface
interface PropertyData {
  address: string;
  city: string;
  state: string;
  zip: string;
  yearBuilt: number | null;
  squareFeet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: string | null;
  propertyType: string;
  ownerName: string | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  estimatedValue: number | null;
  sewerType: string | null;
  waterSource: string | null;
  foundationType: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isFieldOperatorRole(user?.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const city = searchParams.get("city");
    const state = searchParams.get("state") || "IN";
    const zip = searchParams.get("zip");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    // In production, this would call a real property data API like:
    // - Attom Data (https://api.attomdata.com)
    // - RealtyMole (https://www.realtymole.com)
    // - Zillow API
    // - County Assessor APIs
    
    // For now, we'll generate realistic-looking data based on the address
    // This demonstrates the data structure that would come from a real API
    
    const propertyData = await lookupPropertyData(address, city, state, zip);

    return NextResponse.json({
      success: true,
      data: propertyData,
      source: "simulated", // Would be "attom" or "realtymole" in production
    });
  } catch (error) {
    console.error("Property lookup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to lookup property data" },
      { status: 500 }
    );
  }
}

// Simulated property lookup - would be replaced with real API call
async function lookupPropertyData(
  address: string,
  city: string | null,
  state: string,
  zip: string | null
): Promise<PropertyData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate realistic data based on address patterns
  const streetNumber = parseInt(address.match(/^\d+/)?.[0] || "1000");
  const isOldNeighborhood = streetNumber < 1000;
  
  // Estimate year built based on address number pattern (older addresses tend to be lower numbers)
  const baseYear = isOldNeighborhood ? 1920 : 1970;
  const yearBuilt = baseYear + Math.floor(Math.random() * 30);
  
  // Common Indianapolis neighborhood patterns
  const propertyTypes = ["Single Family", "Single Family", "Single Family", "Duplex", "Townhouse"];
  const sewerTypes = [
    "Municipal Sewer",
    "Municipal Sewer",
    "Municipal Sewer",
    "Septic System",
    "Combined Sewer",
  ];
  const foundationTypes = [
    "Basement",
    "Basement",
    "Crawl Space",
    "Slab",
    "Basement with Crawl",
  ];

  // Older homes more likely to have certain characteristics
  const sewerTypeIndex = yearBuilt < 1960 ? Math.min(4, Math.floor(Math.random() * 3)) : Math.floor(Math.random() * 3);
  const foundationIndex = yearBuilt < 1950 ? 0 : Math.floor(Math.random() * foundationTypes.length);

  return {
    address: address,
    city: city || "Indianapolis",
    state: state,
    zip: zip || "46201",
    yearBuilt: yearBuilt,
    squareFeet: 1200 + Math.floor(Math.random() * 1500),
    bedrooms: 2 + Math.floor(Math.random() * 3),
    bathrooms: 1 + Math.floor(Math.random() * 2.5),
    lotSize: `${(0.1 + Math.random() * 0.4).toFixed(2)} acres`,
    propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
    ownerName: null, // Privacy - would come from API
    lastSaleDate: `${2015 + Math.floor(Math.random() * 9)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-01`,
    lastSalePrice: 100000 + Math.floor(Math.random() * 200000),
    estimatedValue: 150000 + Math.floor(Math.random() * 250000),
    sewerType: sewerTypes[sewerTypeIndex],
    waterSource: "Municipal Water",
    foundationType: foundationTypes[foundationIndex],
  };
}
