// Draw an image source onto a canvas no larger than maxDimension and encode it as a JPEG data URL
function encodeResized(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
  quality: number
): string {
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(source, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

// Downscale an image file to a JPEG data URL small enough to keep in localStorage
export async function fileToResizedDataUrl(
  file: File,
  maxDimension = 1024,
  quality = 0.72
): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read image'));
      el.src = sourceUrl;
    });
    return encodeResized(img, img.naturalWidth, img.naturalHeight, maxDimension, quality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

// Grab the current webcam frame as a downscaled JPEG data URL
export function videoFrameToResizedDataUrl(
  video: HTMLVideoElement,
  maxDimension = 1024,
  quality = 0.72
): string {
  return encodeResized(video, video.videoWidth, video.videoHeight, maxDimension, quality);
}
