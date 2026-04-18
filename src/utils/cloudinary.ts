import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UPLOAD_PRESET = 'gc_offers';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image URI (from expo-image-picker) directly to Cloudinary.
 * Handles both web (File/Blob via fetch) and native (RN FormData URI).
 */
export async function uploadOfferImage(uri: string): Promise<string> {
  if (!CLOUD_NAME) {
    throw new Error('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
  }

  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);

  if (Platform.OS === 'web') {
    // On web, expo-image-picker gives a blob: or data: URI — fetch it as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `offer_${Date.now()}.jpg`;
    formData.append('file', new File([blob], filename, { type: blob.type || 'image/jpeg' }));
  } else {
    // On native, pass the file object with uri/name/type
    const filename = uri.split('/').pop() ?? `offer_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('file', { uri, name: filename, type } as any);
  }

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const result = await response.json();
  return result.secure_url as string;
}
