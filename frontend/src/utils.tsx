import filepng from './assets/file.png'
import pdf from './assets/pdf.png';
import rar from './assets/rar.png';
export const getFileIcon = (fileExtension: string): string => {
    switch (fileExtension) {
      case 'pdf':
        return pdf;
      case 'rar':
      case 'zip':
        return rar;
      default:
        return filepng; // default file icon
    }
  };

export const truncateFileName = (fileName: string): string => {
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();
    return fileName?.length > 10 ? `${fileName?.slice(0, 10)}...${fileExtension}` : fileName;
  };
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };
export const isImageFile = (filename: string | undefined): boolean => {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];
    return imageExtensions.includes(getFileExtension(filename || ''));
  };

export const getDirectoryPath = (userIp: string, chatIp: string): string => {
    const sortedIps = [userIp, chatIp].sort();
    return `${sortedIps[0]}_to_${sortedIps[1]}`;
  };