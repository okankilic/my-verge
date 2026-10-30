import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RotateCcw, Check } from 'lucide-react';
import { videoFrameToResizedDataUrl } from '../utils/imageResize';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  onChooseFile: () => void;
}

// Desktop webcam capture: live preview -> snapshot -> use or retake
export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onChooseFile,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSnapshot(null);
    setError(null);

    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err: unknown) => {
        const name = err instanceof DOMException ? err.name : '';
        setError(
          name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser settings, or choose a file instead.'
            : name === 'NotFoundError'
              ? 'No camera was found on this device.'
              : 'Could not start the camera.'
        );
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setSnapshot(videoFrameToResizedDataUrl(video));
  };

  return (
    // Stop clicks from reaching the card underneath (React events bubble through the tree)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

      <div className="relative w-full max-w-lg bg-paper border border-ink/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
          <span className="font-serif-journal text-base text-ink">Take a photo</span>
          <button
            onClick={onClose}
            aria-label="Close camera"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-black aspect-video relative">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">
              {error}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${snapshot ? 'hidden' : ''}`}
              />
              {snapshot && <img src={snapshot} alt="Captured" className="w-full h-full object-cover" />}
            </>
          )}
        </div>

        <div className="p-3 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              onChooseFile();
            }}
            className="min-h-[36px] px-3 text-xs text-ink/60 hover:text-ink rounded-lg hover:bg-ink/5 transition-colors"
          >
            Choose a file instead
          </button>

          {!error && (
            <div className="flex items-center gap-2">
              {snapshot ? (
                <>
                  <button
                    onClick={() => setSnapshot(null)}
                    className="min-h-[36px] px-3 flex items-center gap-1.5 text-xs font-medium bg-card border border-ink/15 rounded-lg text-ink hover:bg-paper-deep transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={() => {
                      onCapture(snapshot);
                      onClose();
                    }}
                    className="min-h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold bg-ink text-paper rounded-lg hover:bg-ink/85 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Use photo</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSnap}
                  className="min-h-[36px] px-3 flex items-center gap-1.5 text-xs font-semibold bg-ink text-paper rounded-lg hover:bg-ink/85 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
