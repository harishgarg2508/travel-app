/**
 * Client-side utility to resize and compress image files into highly optimized Base64 JPEG strings,
 * allowing safe and reliable storage inside Firestore without needing Firebase Storage buckets.
 */
export function compressImageToBase64(
  file: File,
  maxWidth = 600,
  maxHeight = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Standard validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not a valid image.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas image to highly optimized Base64 JPEG
        const base64Data = canvas.toDataURL('image/jpeg', quality);
        resolve(base64Data);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
