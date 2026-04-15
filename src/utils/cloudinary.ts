import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UPLOAD_PRESET = 'gc_offers';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image URI (from expo-image-picker) directly to Cloudinary
 * using an unsigned upload preset. Returns the secure CDN URL.
 */
export async function uploadOfferImage(uri: string): Promise<string> {
  if (!CLOUD_NAME) {
    throw new Error('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
  }

  const formData = new FormData();

  // React Native FormData accepts the file as an object with uri/name/type
  const filename = uri.split('/').pop() ?? 'offer.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri, name: filename, type } as any);
  formData.append('upload_preset', UPLOAD_PRESET);

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
