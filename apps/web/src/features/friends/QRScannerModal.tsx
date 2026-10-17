import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Link as LinkIcon, AlertCircle, Shield, RefreshCw, Smartphone, ExternalLink, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { parseQRUrl, decodeQRFromImage } from '@/lib/qr-code';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInsecureContext, setIsInsecureContext] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Cleanup on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setErrorMessage(null);
      setManualInput('');
      setIsInsecureContext(false);
    }
  }, [isOpen, stopCamera]);

  // Frame scanner loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const parsed = parseQRUrl(code.data);
        if (parsed.isValid && parsed.qrToken) {
          stopCamera();
          onScanSuccess(parsed.qrToken);
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [onScanSuccess, stopCamera]);

  // Check if browser context supports live camera stream
  const checkSecureContext = () => {
    if (typeof window === 'undefined') return true;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';
    const isSecure = window.isSecureContext ?? (isLocal || isHttps);
    return isSecure;
  };

  // Start camera explicitly on user request
  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    setIsInsecureContext(false);

    // 1. Verify Secure Context (Browser security blocks navigator.mediaDevices over non-localhost HTTP)
    if (!checkSecureContext()) {
      setIsInsecureContext(true);
      setCameraError('Insecure Connection: Modern browsers restrict live camera access on HTTP IP addresses.');
      return;
    }

    // 2. Resolve mediaDevices
    const mediaDevices = navigator.mediaDevices || (
      (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia
        ? {
            getUserMedia: (constraints: MediaStreamConstraints) =>
              new Promise<MediaStream>((resolve, reject) => {
                const legacy = (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;
                legacy.call(navigator, constraints, resolve, reject);
              }),
          }
        : null
    );

    if (!mediaDevices || !mediaDevices.getUserMedia) {
      setIsInsecureContext(!checkSecureContext());
      setCameraError('Camera access is not supported by your browser in this context. Please use HTTPS, localhost, or the "Take Photo" option.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Preferred mobile: back-facing camera with ideal resolution
        stream = await mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Initial back-camera constraint failed, attempting generic video fallback:', firstErr);
        // Fallback: any available video input (desktop webcam, laptop front camera, etc.)
        stream = await mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setIsCameraActive(false);
      const errName = err?.name || '';
      const errMsg = err?.message || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission was blocked. Please tap the lock/camera icon in your browser address bar to allow camera access.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('No camera detected on this device. Please upload a QR image or paste the invitation link.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('Camera is already in use by another app. Please close other camera applications and try again.');
      } else if (errName === 'OverconstrainedError') {
        setCameraError('Camera resolution constraints could not be satisfied. Please retry.');
      } else {
        setCameraError(`Camera error (${errName || 'Notice'}): ${errMsg || 'Unable to open camera.'}`);
      }
    }
  };

  // Handle uploaded QR image file or camera capture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const scannedText = await decodeQRFromImage(file);
    setIsProcessing(false);

    if (scannedText) {
      const parsed = parseQRUrl(scannedText);
      if (parsed.isValid && parsed.qrToken) {
        onScanSuccess(parsed.qrToken);
      } else {
        setErrorMessage(parsed.error || 'The uploaded image does not contain a valid BreakTym QR code.');
      }
    } else {
      setErrorMessage('Could not find a readable QR code in this image. Please upload a clearer screenshot.');
    }

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';
  };

  // Handle manual token / link submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = parseQRUrl(manualInput);
    if (parsed.isValid && parsed.qrToken) {
      onScanSuccess(parsed.qrToken);
    } else {
      setErrorMessage(parsed.error || 'Please enter a valid BreakTym invitation link or token.');
    }
  };

  const handleSwitchToHttps = () => {
    window.location.href = window.location.href.replace('http:', 'https:');
  };

  const handleSwitchToLocalhost = () => {
    window.location.href = `${window.location.protocol}//localhost:${window.location.port}${window.location.pathname}${window.location.search}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Scan BreakTym QR Code"
      description="Connect instantly with a friend's personal QR code."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1 text-left">
        {/* Method Switcher Pills */}
        <div className="flex p-1 rounded-xl bg-[#1C1C23] border border-[#30303A]">
          <button
            type="button"
            onClick={() => {
              setScanMode('camera');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              scanMode === 'camera'
                ? 'bg-[#202027] text-[#B45CFF] shadow-sm border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanMode('upload');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              scanMode === 'upload'
                ? 'bg-[#202027] text-[#B45CFF] shadow-sm border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanMode('manual');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              scanMode === 'manual'
                ? 'bg-[#202027] text-[#B45CFF] shadow-sm border border-[#B45CFF]/30'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste Link</span>
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[#FF6B81] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode 1: Live Camera Scan */}
        {scanMode === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-3">
                <div className="flex items-start gap-2 text-amber-300 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {isInsecureContext ? 'Secure Connection (HTTPS) Required' : 'Camera Access Notice'}
                  </span>
                </div>

                <p className="text-[11px] text-[#A5A0B5] leading-relaxed">
                  {cameraError}
                </p>

                {isInsecureContext ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-[#F5F3FA]">
                      Choose an option to enable your camera immediately:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {typeof window !== 'undefined' && window.location.protocol === 'http:' && (
                        <NeomorphicButton
                          type="button"
                          variant="primary"
                          onClick={handleSwitchToHttps}
                          className="text-xs py-2 px-3"
                          icon={<Shield className="w-3.5 h-3.5" />}
                        >
                          Switch to HTTPS
                        </NeomorphicButton>
                      )}

                      {typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (
                        <NeomorphicButton
                          type="button"
                          variant="secondary"
                          onClick={handleSwitchToLocalhost}
                          className="text-xs py-2 px-3"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Open on localhost
                        </NeomorphicButton>
                      )}
                    </div>

                    {/* Instant native camera capture fallback */}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-[10px] text-[#A5A0B5] mb-2">
                        Or take a photo directly using your phone's native camera:
                      </p>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#202027] hover:bg-[#282833] border border-[#B45CFF]/40 text-xs font-semibold text-[#F5F3FA] cursor-pointer transition-all">
                        <Smartphone className="w-3.5 h-3.5 text-[#B45CFF]" />
                        <span>Snap Photo with Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isProcessing}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <NeomorphicButton
                      type="button"
                      variant="primary"
                      onClick={startCamera}
                      className="text-xs py-2 px-3.5"
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Retry Camera
                    </NeomorphicButton>

                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#202027] hover:bg-[#282833] border border-[#30303A] text-xs font-semibold text-[#F5F3FA] cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-[#B45CFF]" />
                      <span>Upload Image Instead</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : isCameraActive ? (
              <div className="space-y-3">
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-[#B45CFF]/60 shadow-[0_0_24px_rgba(180,92,255,0.35)]">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Targeting Overlay Frame */}
                  <div className="absolute inset-0 border-2 border-[#B45CFF]/80 m-6 rounded-xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />

                    {/* Animated Scanning Beam */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#86EFAC] to-transparent shadow-[0_0_8px_#86EFAC] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-white font-medium">
                      Align QR code in center
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <NeomorphicButton
                    type="button"
                    variant="secondary"
                    onClick={stopCamera}
                    className="text-xs py-2 px-4"
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Stop Camera
                  </NeomorphicButton>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#1C1C23] border border-[#30303A] text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#B45CFF]/15 text-[#B45CFF] flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F5F3FA]">Live Camera Scanner</p>
                  <p className="text-[11px] text-[#A5A0B5] mt-0.5 max-w-xs mx-auto">
                    Point your camera directly at your friend's personal BreakTym QR code.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <NeomorphicButton
                    onClick={startCamera}
                    className="w-full text-xs py-2.5"
                    icon={<Camera className="w-3.5 h-3.5" />}
                  >
                    Start Camera Scanner
                  </NeomorphicButton>

                  <label className="block w-full cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <div className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-[#A5A0B5] hover:text-[#F5F3FA] bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                      <Smartphone className="w-3.5 h-3.5 text-[#86EFAC]" />
                      <span>Or Snap Photo with Native Camera</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Upload Screenshot / Image */}
        {scanMode === 'upload' && (
          <div className="p-6 rounded-2xl bg-[#1C1C23] border border-[#30303A] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#B45CFF]/15 text-[#B45CFF] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F5F3FA]">Upload QR Code Image</p>
              <p className="text-[11px] text-[#A5A0B5] mt-0.5">
                Select a screenshot or photo of a BreakTym QR code. Decoded directly on your device.
              </p>
            </div>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <div className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#B45CFF] to-[#8B5CF6] hover:opacity-90 transition-opacity">
                {isProcessing ? 'Analyzing image...' : 'Choose Image File'}
              </div>
            </label>
          </div>
        )}

        {/* Mode 3: Manual Link or Token Paste */}
        {scanMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <p className="text-xs text-[#A5A0B5]">
              Paste the BreakTym invitation link or token shared by your friend:
            </p>
            <NeomorphicInput
              placeholder="e.g. https://breaktym.app/?add=token_..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              leadingIcon={<LinkIcon className="w-4 h-4" />}
              autoFocus
              required
            />
            <NeomorphicButton
              type="submit"
              className="w-full text-xs py-2.5"
              disabled={!manualInput.trim()}
            >
              Resolve Profile
            </NeomorphicButton>
          </form>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-[#7E7991] pt-1">
          <Shield className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
          <span>Local client-side decoding ensures your images and links are processed securely.</span>
        </div>
      </div>
    </Modal>
  );
};
