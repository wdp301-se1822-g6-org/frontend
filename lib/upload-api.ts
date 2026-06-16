import { axiosInstance } from '@/lib/axios';

/**
 * Upload single image to Cloudinary
 */
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosInstance.post<{ url: string }>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Upload multiple images (up to 5) to Cloudinary
 */
export const uploadImages = (files: FileList | File[]) => {
  const formData = new FormData();
  const fileArray = files instanceof FileList ? Array.from(files) : files;
  fileArray.forEach((file) => {
    formData.append('files', file);
  });
  return axiosInstance.post<{ urls: string[] }>('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
