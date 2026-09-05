import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QrCode, X, Keyboard, Camera, Check, Trash2, Layers, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const BarcodeScanner = ({ 
  onScan, 
  onBatchScan, 
  onClose, 
  onManual, 
  multiScan = false, 
  title = "Scan Barcode / QR Code",
  initialItems = []
}) => {
  const scannerRef = useRef(null);
  const [readerId] = useState(() => "qr-reader-" + Math.random().toString(36).substring(2, 9));
  const [errorMsg, setErrorMsg] = useState("");
  const [scannedItems, setScannedItems] = useState(initialItems);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const lastScannedRef = useRef({ code: '', time: 0 });

  // Web Audio API beep sound for feedback on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  useEffect(() => {
    let html5QrCode = null;
    let isMounted = true;
    
    const startScanner = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ];

        html5QrCode = new Html5Qrcode(readerId, {
          formatsToSupport,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        scannerRef.current = html5QrCode;

        let cameraConfig = { facingMode: "environment" };
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const backCam = cameras.find(c => /back|rear|belakang|environment/i.test(c.label)) || cameras[cameras.length - 1];
            if (backCam) {
              cameraConfig = backCam.id;
            }
          }
        } catch (e) {
          cameraConfig = { facingMode: "environment" };
        }
        
        if (!isMounted) return;

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 20,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.min(Math.floor(viewfinderWidth * 0.88), 340),
              height: Math.min(Math.floor(viewfinderHeight * 0.65), 200)
            }),
            aspectRatio: 1.333
          },
          (decodedText) => {
            const cleanCode = decodedText.trim();
            if (!cleanCode) return;

            const now = Date.now();
            // 1.5s cooldown for same barcode to prevent accidental double-scan
            if (lastScannedRef.current.code === cleanCode && (now - lastScannedRef.current.time) < 1500) {
              return;
            }
            lastScannedRef.current = { code: cleanCode, time: now };

            playBeep();

            if (multiScan) {
              setScannedItems(prev => {
                if (prev.includes(cleanCode)) {
                  toast(`SN "${cleanCode}" sudah ada di daftar.`, { icon: 'ℹ️' });
                  return prev;
                }
                toast.success(`SN ter-scan: ${cleanCode}`, { duration: 1500 });
                return [...prev, cleanCode];
              });
            } else {
              if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                  scannerRef.current.clear();
                }).catch(e => console.log(e));
                scannerRef.current = null;
              }
              if (onScan) onScan(cleanCode);
              if (onClose) onClose();
            }
          },
          (errorMessage) => {}
        );
      } catch (err) {
        console.error("Camera start error:", err);
        setErrorMsg("Gagal membuka kamera. Pastikan izin kamera telah diizinkan pada browser.");
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch(e => console.log(e));
        scannerRef.current = null;
      }
    };
  }, [multiScan, onScan, onClose, readerId]);

  const handleFinishBatch = () => {
    if (onBatchScan) {
      onBatchScan(scannedItems);
    }
    onClose();
  };

  const handleRemoveItem = (index) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const scannerContent = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', border: '1px solid #E2E8F0', boxSizing: 'border-box', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F7FC', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#152C4A' }}>
                {title.replace(/^📷\s*/, '')} {multiScan && <span style={{ fontSize: '0.7rem', color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px' }}>Multi-Scan</span>}
              </h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.7rem', color: '#64748B' }}>
                {multiScan ? 'Arahkan kamera ke setiap barcode secara berurutan' : 'Arahkan kamera ke barcode/QR serial perangkat'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
            <X size={14} />
          </button>
        </div>
        
        {/* Camera Container */}
        <div id={readerId} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', minHeight: '220px', backgroundColor: '#0F172A', position: 'relative' }}>
          {errorMsg && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', color: '#FECACA', fontWeight: 600, fontSize: '0.75rem' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Multi-Scan Live Counter & List */}
        {multiScan && (
          <div style={{ marginTop: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={13} color="#2563EB" /> Terdeteksi: <strong style={{ color: '#2563EB' }}>{scannedItems.length} Unit</strong>
              </span>
              {scannedItems.length > 0 && (
                <button 
                  onClick={() => setIsConfirmClearOpen(true)}
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.15s ease' }}
                  title="Bersihkan seluruh daftar barcode yang telah di-scan"
                >
                  <Trash2 size={10} /> Bersihkan Semua
                </button>
              )}
            </div>

            {/* List of scanned tag chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '75px', overflowY: 'auto' }}>
              {scannedItems.length === 0 ? (
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>Belum ada barcode yang di-scan...</span>
              ) : (
                scannedItems.map((sn, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', 
                      borderRadius: '6px', padding: '2px 6px', fontSize: '0.65rem', 
                      fontFamily: 'monospace', fontWeight: 700, color: '#1E293B',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {sn}
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ marginTop: '0.85rem', display: 'flex', gap: '8px' }}>
          {multiScan ? (
            <>
              {onManual && (
                <button 
                  onClick={() => {
                    const manualSn = prompt('Masukkan Serial Number (atau paste banyak SN pisahkan baris):');
                    if (manualSn) {
                      const lines = manualSn.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
                      if (lines.length > 0) {
                        setScannedItems(prev => {
                          const combined = [...prev];
                          lines.forEach(l => {
                            if (!combined.includes(l)) combined.push(l);
                          });
                          return combined;
                        });
                        toast.success(`${lines.length} SN ditambahkan.`);
                      }
                    }
                  }}
                  style={{ backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Keyboard size={13} />
                  <span>Ketik / Paste</span>
                </button>
              )}
              <button 
                onClick={handleFinishBatch}
                className="sgt-btn-primary"
                style={{ flex: 1, padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Check size={14} />
                <span>Selesai Scan ({scannedItems.length} Unit)</span>
              </button>
            </>
          ) : (
            <>
              {onManual && (
                <button 
                  onClick={() => {
                    const manualSn = prompt('Masukkan Serial Number (SN):');
                    if (manualSn) {
                      onManual(manualSn.trim());
                    }
                  }}
                  style={{ flex: 1, backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Keyboard size={13} />
                  <span>Ketik Manual</span>
                </button>
              )}
              <button 
                onClick={onClose}
                style={{ flex: 1, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </>
          )}
        </div>

      </div>

      {/* Modal Alert Konfirmasi Bersihkan Semua Barcode Scanned */}
      {isConfirmClearOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000000,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #E2E8F0',
            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#DC2626', flexShrink: 0
              }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#152C4A' }}>
                  Konfirmasi Bersihkan Barcode
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                  Apakah Anda yakin ingin menghapus/mengosongkan seluruh daftar <strong>{scannedItems.length} Barcode</strong> yang telah di-scan?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setScannedItems([]);
                  setIsConfirmClearOpen(false);
                  toast.success('Daftar Barcode berhasil dibersihkan.');
                }}
                style={{
                  padding: '6px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)'
                }}
              >
                <Trash2 size={12} />
                <span>Ya, Bersihkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(scannerContent, document.body) : scannerContent;
};
