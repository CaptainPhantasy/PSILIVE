"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  Wifi,
  Bluetooth,
  RefreshCw,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Signal,
  Settings,
} from "lucide-react";

interface PairedCamera {
  id: string;
  name: string;
  type: "bluetooth" | "wifi" | "manual";
  lastConnected?: string;
  isConnected: boolean;
}

interface CameraPairingProps {
  inspectionId: string;
  onCameraSelect?: (camera: PairedCamera | null) => void;
}

export function CameraPairing({ inspectionId, onCameraSelect }: CameraPairingProps) {
  const [cameras, setCameras] = useState<PairedCamera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<PairedCamera | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualCameraName, setManualCameraName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<PairedCamera[]>([]);

  // Check Bluetooth support
  useEffect(() => {
    if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
      setBluetoothSupported(true);
    }
  }, []);

  // Load saved cameras from localStorage
  useEffect(() => {
    const savedCameras = localStorage.getItem("psi_paired_cameras");
    if (savedCameras) {
      try {
        const parsed = JSON.parse(savedCameras) as PairedCamera[];
        setCameras(parsed.map(c => ({ ...c, isConnected: false })));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save cameras to localStorage
  const saveCameras = useCallback((newCameras: PairedCamera[]) => {
    localStorage.setItem("psi_paired_cameras", JSON.stringify(newCameras));
    setCameras(newCameras);
  }, []);

  // Scan for Bluetooth devices
  const scanBluetooth = async () => {
    if (!bluetoothSupported) {
      setError("Bluetooth is not supported in this browser");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResults([]);

    try {
      // Request Bluetooth device - filters for common camera/video services
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });

      if (device) {
        const newCamera: PairedCamera = {
          id: device.id || `bt-${Date.now()}`,
          name: device.name || "Unknown Camera",
          type: "bluetooth",
          lastConnected: new Date().toISOString(),
          isConnected: true,
        };

        // Check if already paired
        const exists = cameras.find(c => c.id === newCamera.id);
        if (!exists) {
          const updated = [...cameras, newCamera];
          saveCameras(updated);
        }

        setSelectedCamera(newCamera);
        onCameraSelect?.(newCamera);
      }
    } catch (err) {
      console.error("Bluetooth scan error:", err);
      if ((err as Error).name !== "NotFoundError") {
        setError("Failed to scan for Bluetooth devices. Please try again.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Simulate WiFi camera discovery (would connect to actual API in production)
  const scanWifi = async () => {
    setIsScanning(true);
    setError(null);
    setScanResults([]);

    try {
      // Simulated scan - in production, this would query local network
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show common sewer camera brands as discovered devices
      const discoveredCameras: PairedCamera[] = [
        {
          id: `wifi-camera-${Date.now()}`,
          name: "HD Sewer Camera",
          type: "wifi",
          isConnected: false,
        },
        {
          id: `wifi-spartan-${Date.now()}`,
          name: "Spartan Tool Camera",
          type: "wifi",
          isConnected: false,
        },
      ];

      setScanResults(discoveredCameras);
    } catch {
      setError("WiFi scan failed. Please check your network connection.");
    } finally {
      setIsScanning(false);
    }
  };

  // Add a scanned camera to paired list
  const pairScannedCamera = (camera: PairedCamera) => {
    const exists = cameras.find(c => c.name === camera.name && c.type === camera.type);
    if (!exists) {
      const paired: PairedCamera = {
        ...camera,
        lastConnected: new Date().toISOString(),
        isConnected: true,
      };
      const updated = [...cameras, paired];
      saveCameras(updated);
      setSelectedCamera(paired);
      onCameraSelect?.(paired);
    }
    setScanResults([]);
  };

  // Add manual camera
  const addManualCamera = () => {
    if (!manualCameraName.trim()) return;

    const newCamera: PairedCamera = {
      id: `manual-${Date.now()}`,
      name: manualCameraName.trim(),
      type: "manual",
      lastConnected: new Date().toISOString(),
      isConnected: true,
    };

    const updated = [...cameras, newCamera];
    saveCameras(updated);
    setSelectedCamera(newCamera);
    onCameraSelect?.(newCamera);
    setManualCameraName("");
    setShowManualAdd(false);
  };

  // Remove a camera
  const removeCamera = (cameraId: string) => {
    const updated = cameras.filter(c => c.id !== cameraId);
    saveCameras(updated);
    if (selectedCamera?.id === cameraId) {
      setSelectedCamera(null);
      onCameraSelect?.(null);
    }
  };

  // Select a camera
  const selectCamera = (camera: PairedCamera) => {
    const updated = cameras.map(c => ({
      ...c,
      isConnected: c.id === camera.id,
      lastConnected: c.id === camera.id ? new Date().toISOString() : c.lastConnected,
    }));
    saveCameras(updated);
    setSelectedCamera({ ...camera, isConnected: true });
    onCameraSelect?.({ ...camera, isConnected: true });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">Camera Pairing</h3>
          </div>
          {selectedCamera && (
            <div className="flex items-center gap-1 text-green-200 text-sm">
              <Signal className="w-4 h-4" />
              <span>Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Currently selected camera */}
        {selectedCamera && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  {selectedCamera.type === "bluetooth" ? (
                    <Bluetooth className="w-4 h-4 text-green-600" />
                  ) : selectedCamera.type === "wifi" ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <Camera className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-green-800">{selectedCamera.name}</p>
                  <p className="text-xs text-green-600">Active camera for this inspection</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
        )}

        {/* Scan buttons */}
        <div className="flex gap-2">
          <button
            onClick={scanBluetooth}
            disabled={isScanning || !bluetoothSupported}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bluetooth className="w-5 h-5" />
            )}
            <span>Bluetooth</span>
          </button>
          <button
            onClick={scanWifi}
            disabled={isScanning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
            <span>WiFi Scan</span>
          </button>
        </div>

        {/* WiFi scan results */}
        {scanResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Discovered Cameras:</p>
            {scanResults.map(camera => (
              <button
                key={camera.id}
                onClick={() => pairScannedCamera(camera)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">{camera.name}</span>
                </div>
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
            ))}
          </div>
        )}

        {/* Paired cameras list */}
        {cameras.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Saved Cameras:</p>
            {cameras.map(camera => (
              <div
                key={camera.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedCamera?.id === camera.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <button
                  onClick={() => selectCamera(camera)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {camera.type === "bluetooth" ? (
                      <Bluetooth className="w-4 h-4 text-blue-500" />
                    ) : camera.type === "wifi" ? (
                      <Wifi className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Settings className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{camera.name}</p>
                    <p className="text-xs text-gray-500">
                      {camera.type.charAt(0).toUpperCase() + camera.type.slice(1)} •{" "}
                      {camera.lastConnected
                        ? `Last used ${new Date(camera.lastConnected).toLocaleDateString()}`
                        : "Never used"}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => removeCamera(camera.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        {showManualAdd ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCameraName}
              onChange={e => setManualCameraName(e.target.value)}
              placeholder="Camera name (e.g., HD Sewer Camera)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={addManualCamera}
              disabled={!manualCameraName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowManualAdd(false);
                setManualCameraName("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowManualAdd(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Camera Manually</span>
          </button>
        )}

        {/* Help text */}
        {!bluetoothSupported && (
          <p className="text-xs text-gray-500 text-center">
            Bluetooth scanning requires Chrome on Android or a compatible browser.
            Use WiFi scan or add your camera manually.
          </p>
        )}
      </div>
    </div>
  );
}
