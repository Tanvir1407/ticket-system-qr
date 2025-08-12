import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner";

export default function App() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const hasVerifiedRef = useRef(false); // guard to ensure single verify per scan

  const [isScanning, setIsScanning] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Start QR Scanner
  const startScanner = () => {
    if (isScanning) return;
    setVerifyStatus(null);
    setIsVerifying(false);
    hasVerifiedRef.current = false;
    setIsScanning(true);

    scannerRef.current = new QrScanner(
      videoRef.current,
      async (res) => {
        if (hasVerifiedRef.current) return;
        hasVerifiedRef.current = true;
        const scannedData = typeof res === "string" ? res : res?.data;
        stopScanner();
        await handleVerify(scannedData || "");
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
      }
    );

    scannerRef.current.start().catch((error) => {
      console.error("Failed to start scanner:", error);
      setIsScanning(false);
    });
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  // Handle Ticket Verification
  const handleVerify = async (scanData) => {
    if (!scanData) return;
    setIsVerifying(true);
    try {
      let payload;
      try {
        // Try to parse JSON from QR
        payload = JSON.parse(scanData);
      } catch {
        // If not JSON, assume plain ticket code
        payload = { ticket_id: scanData };
      }
      // const res = await fetch("https://api.test.tapkori.com/api/ticket-verify", {

      const res = await fetch("http://192.168.68.112:8000/api/ticket-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data?.status && data?.ticket?.is_verify) {
        setVerifyStatus("success");
      } else {
        setVerifyStatus("fail");
      }
    } catch (e) {
      console.error("Verification error:", e);
      setVerifyStatus("fail");
    } finally {
      setIsVerifying(false);
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

      {/* Video Feed with Overlay */}
      <div style={{ position: "relative", width: "100%" }}>
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
        {/* Status Overlay */}
        {(isVerifying || verifyStatus) && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            borderRadius: 10,
            padding: 20,
            textAlign: "center",
            minWidth: 120
          }}>
            {isVerifying && (
              <>
                <div style={{
                  width: 30,
                  height: 30,
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #0275d8",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 10px"
                }}></div>
                <div style={{ color: "white", fontSize: 14 }}>Verifying...</div>
              </>
            )}
            {verifyStatus === "success" && (
              <>
                <span style={{ fontSize: 48, color: "#5cb85c" }}>&#10004;</span>
                <div style={{ color: "#5cb85c", fontSize: 14, marginTop: 5 }}>Ticket Confirmed</div>
              </>
            )}
            {verifyStatus === "fail" && (
              <>
                <span style={{ fontSize: 48, color: "#d9534f" }}>&#10008;</span>
                <div style={{ color: "#d9534f", fontSize: 14, marginTop: 5 }}>Ticket Not Confirmed</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Start Scan Button */}
      <button
        onClick={startScanner}
        disabled={isScanning}
        style={{
          marginTop: 10,
          width: "100%",
          padding: 12,
          fontSize: 16,
          backgroundColor: isScanning ? "#999" : "#0275d8",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: isScanning ? "not-allowed" : "pointer",
        }}
      >
        {isScanning ? "Scanning..." : "Start Scanning"}
      </button>


      {/* CSS Animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

    </div>
  );
}
