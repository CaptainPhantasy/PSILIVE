"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Home,
  Calendar,
  Ruler,
  Droplets,
  Building2,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
} from "lucide-react";

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

interface PropertyLookupProps {
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
  initialZip?: string;
  onDataLoaded?: (data: PropertyData) => void;
  onUseData?: (data: Partial<{
    homeAge: string;
    pipeMaterial: string;
    foundationType: string;
    sewerType: string;
  }>) => void;
}

export function PropertyLookup({
  initialAddress = "",
  initialCity = "",
  initialState = "IN",
  initialZip = "",
  onDataLoaded,
  onUseData,
}: PropertyLookupProps) {
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [zip, setZip] = useState(initialZip);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [autoLooked, setAutoLooked] = useState(false);

  // Auto-lookup when initial values are provided
  useEffect(() => {
    if (initialAddress && !autoLooked) {
      setAutoLooked(true);
      lookupProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  const lookupProperty = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: address.trim(),
        ...(city && { city: city.trim() }),
        ...(state && { state }),
        ...(zip && { zip: zip.trim() }),
      });

      const response = await fetch(`/api/property/lookup?${params}`);
      const result = await response.json();

      if (result.success) {
        setPropertyData(result.data);
        onDataLoaded?.(result.data);
        setExpanded(true);
      } else {
        setError(result.error || "Property not found");
      }
    } catch {
      setError("Failed to lookup property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseData = () => {
    if (!propertyData) return;

    const currentYear = new Date().getFullYear();
    const homeAge = propertyData.yearBuilt
      ? `${currentYear - propertyData.yearBuilt} years (built ${propertyData.yearBuilt})`
      : "";

    // Estimate pipe material based on year built
    let pipeMaterial = "Unknown";
    if (propertyData.yearBuilt) {
      if (propertyData.yearBuilt < 1950) {
        pipeMaterial = "Clay/Cast Iron (likely)";
      } else if (propertyData.yearBuilt < 1975) {
        pipeMaterial = "Cast Iron/Orangeburg (possible)";
      } else if (propertyData.yearBuilt < 2000) {
        pipeMaterial = "PVC/ABS (likely)";
      } else {
        pipeMaterial = "PVC (likely)";
      }
    }

    onUseData?.({
      homeAge,
      pipeMaterial,
      foundationType: propertyData.foundationType || undefined,
      sewerType: propertyData.sewerType || undefined,
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-white">
          <Home className="w-5 h-5" />
          <h3 className="font-semibold">Property Data Lookup</h3>
        </div>
        <div className="flex items-center gap-2">
          {propertyData && (
            <span className="text-emerald-200 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" />
              Data loaded
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Search form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Indianapolis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="IN"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="46201"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={lookupProperty}
              disabled={loading || !address.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Looking up property...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Lookup Property
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Property data display */}
          {propertyData && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                {/* Property overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Year Built</p>
                      <p className="font-medium">
                        {propertyData.yearBuilt || "Unknown"}
                        {propertyData.yearBuilt && (
                          <span className="text-gray-500 text-sm ml-1">
                            ({new Date().getFullYear() - propertyData.yearBuilt} yrs)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Square Feet</p>
                      <p className="font-medium">
                        {propertyData.squareFeet?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Property Type</p>
                      <p className="font-medium">{propertyData.propertyType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Sewer Type</p>
                      <p className="font-medium">{propertyData.sewerType || "Unknown"}</p>
                    </div>
                  </div>
                </div>

                {/* Additional details */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Foundation:</span>
                    <span className="font-medium">{propertyData.foundationType || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Lot Size:</span>
                    <span className="font-medium">{propertyData.lotSize || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Estimated Value:</span>
                    <span className="font-medium">{formatCurrency(propertyData.estimatedValue)}</span>
                  </div>
                  {propertyData.lastSaleDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Sale:</span>
                      <span className="font-medium">
                        {formatCurrency(propertyData.lastSalePrice)} ({propertyData.lastSaleDate.split("-")[0]})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Use data button */}
              {onUseData && (
                <button
                  onClick={handleUseData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Auto-fill Inspection Form
                </button>
              )}

              {/* Info notice */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Property data is estimated and should be verified with the homeowner.
                  Pipe material predictions are based on construction era.
                </p>
              </div>

              {/* Refresh button */}
              <button
                onClick={lookupProperty}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="text-sm">Refresh Data</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
