/**
 * Backend Storage Client for MS Official
 * Connects directly and only to the backend server API for uploading and managing screenshots.
 * Zero Firebase dependencies. All screenshots are stored on the backend disk.
 */

/**
 * File validation configuration options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes (default: 15MB) */
  maxSizeInBytes?: number;
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  /** Allowed file extensions */
  allowedExtensions?: string[];
}

/**
 * Result of file validation check
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Options for uploading files to Backend Storage
 */
export interface UploadOptions {
  /** Target backend folder/category */
  folder?: 'payments' | 'screenshots' | 'support' | 'general';
  /** User ID associated with upload */
  userId?: string;
  /** Custom file name override (optional) */
  customFileName?: string;
  /** Progress callback reporting 0 to 100 percentage */
  onProgress?: (progressPercent: number) => void;
  /** Custom validation overrides (optional) */
  validation?: FileValidationOptions;
}

/**
 * Output details from successful upload
 */
export interface UploadResult {
  /** Public download URL served by backend */
  url: string;
  /** Backend relative storage path */
  path: string;
  /** Name of the uploaded file on the backend */
  fileName: string;
  /** Size of file in bytes */
  size: number;
  /** MIME type of uploaded file */
  contentType: string;
}

// Default validation rules
export const DEFAULT_MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];

/**
 * Validates a file's MIME type, extension, and byte size.
 */
export function validateFile(file: File | Blob, options?: FileValidationOptions): FileValidationResult {
  const maxSize = options?.maxSizeInBytes ?? DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = options?.allowedMimeTypes ?? ALLOWED_IMAGE_MIME_TYPES;
  const allowedExts = options?.allowedExtensions ?? ALLOWED_IMAGE_EXTENSIONS;

  // 1. File Size Validation
  if (file.size > maxSize) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const limitInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum allowed limit of ${limitInMB} MB. Please upload a smaller screenshot.`,
    };
  }

  // 2. MIME Type Validation
  if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type}). Allowed formats: JPG, PNG, WEBP, HEIC, GIF.`,
    };
  }

  // 3. Extension Validation (if File object has a name)
  if ('name' in file && typeof file.name === 'string') {
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExts.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      return {
        valid: false,
        error: `Invalid file extension. Please select an image file ending in: ${allowedExts.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Convert Base64 / Data URL to a standard Blob
 */
export function base64ToBlob(base64Data: string): Blob {
  try {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0]?.split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1] || parts[0]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  } catch {
    throw new Error('Failed to parse image data format. Please upload an image file directly.');
  }
}

/**
 * Converts a File or Blob to Base64 Data URL
 */
function fileToDataUrl(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Uploads a base64 Data URL string to Backend Storage API
 */
export async function uploadBase64Image(
  base64DataUrl: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const folder = options?.folder || 'screenshots';
  const customFileName = options?.customFileName;

  if (options?.onProgress) {
    options.onProgress(20);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    const token = localStorage.getItem('ms_user_token') || localStorage.getItem('ms_admin_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round(20 + (event.loaded / event.total) * 75);
        options.onProgress(Math.min(95, percent));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (options?.onProgress) {
            options.onProgress(100);
          }
          resolve({
            url: data.url,
            path: data.path,
            fileName: data.fileName,
            size: data.size,
            contentType: data.contentType,
          });
        } catch {
          reject(new Error('Invalid backend server response'));
        }
      } else {
        let errorMsg = 'Failed to upload screenshot to backend';
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error uploading screenshot to backend server'));
    };

    xhr.send(
      JSON.stringify({
        dataUrl: base64DataUrl,
        folder,
        fileName: customFileName,
      })
    );
  });
}

/**
 * Securely uploads a File or Blob to Backend Storage with validation and progress tracking.
 */
export async function uploadFile(
  fileOrBlob: File | Blob,
  options?: UploadOptions
): Promise<UploadResult> {
  const validation = validateFile(fileOrBlob, options?.validation);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file selected');
  }

  if (options?.onProgress) {
    options.onProgress(10);
  }

  const dataUrl = await fileToDataUrl(fileOrBlob);
  const customFileName = 'name' in fileOrBlob ? (fileOrBlob as File).name : undefined;

  return uploadBase64Image(dataUrl, {
    ...options,
    customFileName: options?.customFileName || customFileName,
  });
}

/**
 * Securely uploads package purchase payment receipt screenshot to Backend Storage.
 */
export async function uploadPaymentScreenshot(
  fileOrBase64: File | string,
  userId: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const options: UploadOptions = {
    folder: 'payments',
    userId,
    onProgress,
  };

  if (typeof fileOrBase64 === 'string') {
    const result = await uploadBase64Image(fileOrBase64, options);
    return result.url;
  } else {
    const result = await uploadFile(fileOrBase64, options);
    return result.url;
  }
}

/**
 * Securely uploads friend referral verification screenshot to Backend Storage.
 */
export async function uploadReferralScreenshot(
  fileOrBase64: File | string,
  userId: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const options: UploadOptions = {
    folder: 'screenshots',
    userId,
    onProgress,
  };

  if (typeof fileOrBase64 === 'string') {
    const result = await uploadBase64Image(fileOrBase64, options);
    return result.url;
  } else {
    const result = await uploadFile(fileOrBase64, options);
    return result.url;
  }
}

/**
 * Deletes a file from Backend Storage given its storage path or url.
 */
export async function deleteFileFromStorage(storagePathOrUrl: string): Promise<void> {
  try {
    const token = localStorage.getItem('ms_user_token') || localStorage.getItem('ms_admin_token');
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path: storagePathOrUrl }),
    });
  } catch (error) {
    console.warn(`[Backend Storage] Could not delete file at ${storagePathOrUrl}:`, error);
  }
}
