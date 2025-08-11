import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner";

export default function App() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  const startScanner = () => {
    if (isScanning) return;

    setResult("");
    setMessage("");
    setIsScanning(true);

    scannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        setResult(result);
        stopScanner();
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scannerRef.current
      .start()
      .catch((error) => {
        console.error("Failed to start scanner:", error);
        setMessage("Camera access denied or not available.");
        setIsScanning(false);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  const handleVerify = async () => {
    if (!result) return;
    try {
      const payload = JSON.parse(result);
      const res = await fetch("http://192.168.68.109:8000/api/ticket-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessage(data?.message || "No message from server");
    } catch (e) {
      setMessage("Verification failed: Invalid QR code or network error.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>QR Code Scanner</h1>

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: 300,
          backgroundColor: "#ccc",
          borderRadius: 8,
          objectFit: "cover",
        }}
        muted
        playsInline
      />

      <button
        onClick={isScanning ? stopScanner : startScanner}
        style={{
          marginTop: 10,
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: isScanning ? "#d9534f" : "#0275d8",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {isScanning ? "Stop Scanning" : "Start Scanning"}
      </button>

      <div
        style={{
          marginTop: 20,
          minHeight: 70,
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 6,
          backgroundColor: "#f9f9f9",
          wordBreak: "break-word",
        }}
      >
        <b>Scanned Result:</b>
        <p>{result || "No result yet."}</p>
      </div>

      <button
        onClick={handleVerify}
        disabled={!result}
        style={{
          marginTop: 15,
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: result ? "#5cb85c" : "#999",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: result ? "pointer" : "not-allowed",
        }}
      >
        Verify Now
      </button>

      {message && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#dff0d8",
            color: "#3c763d",
            borderRadius: 6,
          }}
        >
          <b>Verification Message:</b> {message}
        </div>
      )}
    </div>
  );
}
