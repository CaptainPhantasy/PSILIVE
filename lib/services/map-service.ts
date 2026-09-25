/**
 * Map Service
 * Retrieves municipal sewer maps for Indianapolis properties.
 * Primary: MapIndy screenshot via headless browser (Puppeteer).
 * Fallback: Graceful degradation (null result, report generates without map).
 */

import { logger } from "@/lib/logger";
import { uploadBuffer } from "@/lib/s3";

export interface MapResult {
  success: boolean;
  mapImageUrl?: string;
  mapCloudPath?: string;
  source?: "mapindy" | "static" | "manual";
  error?: string;
}

const MAPINDY_BASE_URL = "https://maps.indy.gov/MapIndy/";

// Common Chrome paths by platform
const CHROME_PATHS = [
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  // Linux (Vercel serverless)
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

class MapService {
  /**
   * Get a sewer map image for a property address.
   * Attempts MapIndy screenshot first, falls back gracefully.
   */
  async getSewerMap(
    address: string,
    city: string,
    state: string
  ): Promise<MapResult> {
    // Only attempt for Indianapolis/Marion County properties
    if (!this.isIndianapolisArea(city, state)) {
      return {
        success: false,
        error: "Municipal sewer map only available for Indianapolis/Marion County properties",
      };
    }

    try {
      const result = await this.screenshotMapIndy(address, city, state);
      if (result.success) return result;

      logger.info("MapIndy screenshot unavailable, proceeding without map", { address });
      return {
        success: false,
        error: "Municipal sewer map temporarily unavailable",
      };
    } catch (error) {
      logger.error("Map service failed", { error, address });
      return {
        success: false,
        error: "Failed to retrieve municipal sewer map",
      };
    }
  }

  /**
   * Screenshot MapIndy with sewer layer enabled.
   * Uses Puppeteer to navigate, search address, enable sewer layer, and capture.
   */
  private async screenshotMapIndy(
    address: string,
    city: string,
    _state: string
  ): Promise<MapResult> {
    let browser;

    try {
      // Dynamic import — puppeteer-core is optional
      const puppeteer = await import("puppeteer-core");

      const executablePath = this.findChrome();
      if (!executablePath) {
        logger.warn("No Chrome/Chromium found for MapIndy screenshot");
        return { success: false, error: "No browser available for map screenshot" };
      }

      browser = await puppeteer.default.launch({
        executablePath,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1280,900",
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });

      // Navigate to MapIndy
      logger.info("MapIndy: Navigating to map", { address });
      await page.goto(MAPINDY_BASE_URL, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for the app to load
      await page.waitForSelector(".esri-view-surface", { timeout: 15000 }).catch(() => null);
      await this.sleep(3000); // Let ArcGIS tiles load

      // Search for the address
      const searchQuery = `${address}, ${city}, IN`;
      logger.info("MapIndy: Searching address", { searchQuery });

      // Try the search widget
      const searchInput = await page.$(".esri-search__input");
      if (searchInput) {
        await searchInput.click({ clickCount: 3 }); // Select all
        await searchInput.type(searchQuery, { delay: 50 });
        await page.keyboard.press("Enter");
        await this.sleep(5000); // Wait for map to pan and zoom
      } else {
        logger.warn("MapIndy: Search input not found, trying URL approach");
        // Fallback: use URL parameters if search widget isn't available
        const encodedAddress = encodeURIComponent(searchQuery);
        await page.goto(
          `${MAPINDY_BASE_URL}?find=${encodedAddress}`,
          { waitUntil: "networkidle2", timeout: 30000 }
        );
        await this.sleep(5000);
      }

      // Try to enable the Sanitary Sewer layer via the layer list
      try {
        // Look for layer toggle or layer list
        const layerToggle = await page.$('[data-layer-title*="Sanitary"]');
        if (layerToggle) {
          await layerToggle.click();
          await this.sleep(2000);
        }
      } catch {
        // Layer toggle not found — may already be visible or not available
        logger.info("MapIndy: Sewer layer toggle not found, proceeding with default layers");
      }

      // Hide UI elements for clean screenshot
      await page.evaluate(() => {
        const selectors = [
          ".esri-ui-top-left",
          ".esri-ui-top-right",
          ".esri-ui-bottom-left",
          ".esri-ui-bottom-right",
          ".esri-search",
          ".esri-attribution",
          "header",
          "nav",
          ".app-header",
        ];
        selectors.forEach((sel) => {
          document.querySelectorAll(sel).forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        });
      });

      await this.sleep(1000);

      // Screenshot the map viewport
      const mapElement = await page.$(".esri-view-surface") || await page.$(".esri-view");
      let screenshotBuffer: Buffer;

      if (mapElement) {
        screenshotBuffer = Buffer.from(await mapElement.screenshot({ type: "png" }));
      } else {
        // Full page screenshot as fallback, cropped
        screenshotBuffer = Buffer.from(
          await page.screenshot({
            type: "png",
            clip: { x: 0, y: 0, width: 1280, height: 800 },
          })
        );
      }

      // Upload to S3
      const fileName = `mapindy-${Date.now()}.png`;
      const cloudPath = await uploadBuffer(screenshotBuffer, fileName, "image/png", false);
      const { getFileUrl } = await import("@/lib/s3");
      const mapImageUrl = await getFileUrl(cloudPath, false);

      logger.info("MapIndy: Screenshot captured and uploaded", { cloudPath });

      return {
        success: true,
        mapImageUrl,
        mapCloudPath: cloudPath,
        source: "mapindy",
      };
    } catch (error) {
      logger.error("MapIndy screenshot failed", { error, address });
      return {
        success: false,
        error: "MapIndy screenshot failed",
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Parse a full address string into components.
   * Handles formats like "123 Main Street" or "123 Main St, Indianapolis, IN 46201"
   */
  parseAddress(fullAddress: string): { street: string; city: string; state: string; zip: string } {
    const parts = fullAddress.split(",").map((p) => p.trim());

    if (parts.length >= 3) {
      const stateZip = parts[2].trim().split(/\s+/);
      return {
        street: parts[0],
        city: parts[1],
        state: stateZip[0] || "IN",
        zip: stateZip[1] || "",
      };
    }

    if (parts.length === 2) {
      return {
        street: parts[0],
        city: parts[1],
        state: "IN",
        zip: "",
      };
    }

    return {
      street: fullAddress,
      city: "Indianapolis",
      state: "IN",
      zip: "",
    };
  }

  /**
   * Check if address is in the Indianapolis/Marion County area.
   */
  private isIndianapolisArea(city: string, state: string): boolean {
    const normalizedCity = city.toLowerCase().trim();
    const normalizedState = state.toLowerCase().trim();

    if (normalizedState !== "in" && normalizedState !== "indiana") return false;

    const indyAreas = [
      "indianapolis",
      "beech grove",
      "lawrence",
      "speedway",
      "southport",
      "cumberland",
      "clermont",
      "brownsburg",
      "avon",
      "plainfield",
      "greenwood",
      "carmel",
      "fishers",
      "noblesville",
      "westfield",
      "zionsville",
    ];

    return indyAreas.some((area) => normalizedCity.includes(area));
  }

  /**
   * Find Chrome/Chromium executable on the system.
   */
  private findChrome(): string | null {
    const { existsSync } = require("fs");
    for (const path of CHROME_PATHS) {
      if (existsSync(path)) return path;
    }
    // Check CHROME_PATH env var (for Vercel/Docker)
    const envPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath && existsSync(envPath)) return envPath;
    return null;
  }

  /**
   * Get the MapIndy URL for manual access.
   */
  getMapIndyUrl(): string {
    return MAPINDY_BASE_URL;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mapService = new MapService();
export { MapService };
