import React, { useState, useEffect, useRef } from "react";
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from "html5-qrcode";

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

export default function App() {
  const [result, setResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const [message, setMessage] = useState("");

  const handleScan = async (scannedData) => {
    if (!scannedData) {
      setMessage("No scanned data to verify.");
      return;
    }
    try {
      const payload = JSON.parse(scannedData);
      alert("Verifying ticket...");
      console.log("Payload to verify:", payload);

      const res = await fetch("http://192.168.68.109:8000/api/ticket-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("Response from server:", res);

      const data = await res.json();
      setMessage(data?.message || "No message from server");
    } catch (error) {
      console.error("Error verifying ticket:", error);
      setMessage("Invalid QR code or network error!");
    }
  };

  const SCANNER_CONFIG = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    supportedScanFormats: [Html5QrcodeSupportedFormats.QR_CODE],
  };

  const startScanner = () => {
    if (isScanning) return;

    setIsScanning(true);
    setResult("");
    setMessage("");

    scannerRef.current = new Html5QrcodeScanner("reader", SCANNER_CONFIG, false);

    scannerRef.current.render(
      (decodedText) => {
        setResult(decodedText);
        stopScanner();
      },
      () => {}
    );
  };

  const stopScanner = () => {
    if (
      scannerRef.current &&
      scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED
    ) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (
        scannerRef.current &&
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">QR Code Scanner</h1>

        <div id="reader" className="w-full h-80 bg-gray-200 rounded-lg mb-6"></div>

        <button
          onClick={isScanning ? stopScanner : startScanner}
          className={`w-full flex items-center justify-center font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200 ${
            isScanning
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isScanning ? <StopIcon /> : <CameraIcon />}
          <span className="ml-2">{isScanning ? "Stop Scanning" : "Start Scanning"}</span>
        </button>

        <div className="mt-6 bg-gray-50 border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Scanned Result:</h2>
          <p className="break-all">{result || "No result yet."}</p>
        </div>

        {/* Verify Now Button */}
        <button
          onClick={() => handleScan(result)}
          disabled={!result}
          className={`mt-4 w-full py-3 rounded-lg font-semibold ${
            result ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Verify Now
        </button>

        {message && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            <strong>Verification Message:</strong> {message}
          </div>
        )}
      </div>
    </div>
  );
}
