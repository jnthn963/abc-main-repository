// Simple in-memory store for QR Gateway settings
// In production, this would be stored in the database and fetched from API

type GatewayListener = () => void;

interface GatewaySettings {
  qrCodeUrl: string;
  receiverName: string;
  receiverNumber: string;
  updatedAt: string;
}

// Default placeholder QR code (data URL for a simple QR placeholder)
const DEFAULT_QR_PLACEHOLDER = "";

let gatewaySettings: GatewaySettings = {
  qrCodeUrl: DEFAULT_QR_PLACEHOLDER,
  receiverName: "Alpha Banking Cooperative",
  receiverNumber: "+63 917 XXX XXXX",
  updatedAt: new Date().toISOString(),
};

const listeners: Set<GatewayListener> = new Set();

// Subscribe to gateway changes
export const subscribeToGateway = (listener: GatewayListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Notify all listeners of changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

// Get current gateway settings
export const getGatewaySettings = (): GatewaySettings => {
  return { ...gatewaySettings };
};

// Update gateway settings (admin only in production)
export const updateGatewaySettings = (
  qrCodeUrl: string,
  receiverName: string,
  receiverNumber: string
): void => {
  gatewaySettings = {
    qrCodeUrl,
    receiverName,
    receiverNumber,
    updatedAt: new Date().toISOString(),
  };
  
  // Store in localStorage for persistence across page reloads
  // In production, this would be stored in the database
  try {
    localStorage.setItem("abc_gateway_settings", JSON.stringify(gatewaySettings));
  } catch (e) {
    console.error("Failed to persist gateway settings:", e);
  }
  
  notifyListeners();
};

// Load gateway settings from localStorage on init
export const loadGatewaySettings = (): void => {
  try {
    const stored = localStorage.getItem("abc_gateway_settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      gatewaySettings = {
        qrCodeUrl: parsed.qrCodeUrl || DEFAULT_QR_PLACEHOLDER,
        receiverName: parsed.receiverName || "Alpha Banking Cooperative",
        receiverNumber: parsed.receiverNumber || "+63 917 XXX XXXX",
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error("Failed to load gateway settings:", e);
  }
};

// Initialize on import
loadGatewaySettings();
