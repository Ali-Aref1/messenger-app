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
export const FormatDate = (date: Date,lang:string): string => {
const day = date.getDate(); // Get day and add leading zero if needed
const month = date.getMonth() + 1; // Get month (getMonth() is zero-indexed)
const year = date.getFullYear(); // Get the full year

const formattedDate = lang=='ar'?`${convertToIndianNumerals(year)}/${convertToIndianNumerals(month)}/${convertToIndianNumerals(day)}`:`${day}/${month}/${year}`;
return formattedDate;
}

export const getTimeDifference = (date1: Date, date2: Date): number => {
  const startOfDay1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const startOfDay2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const timeDifference = startOfDay2.getTime() - startOfDay1.getTime();
  return timeDifference / (1000 * 60 * 60 * 24);
}

export const convertToIndianNumerals = (number: number): string => {
  const indianNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return number.toString().split('').map(digit => indianNumerals[parseInt(digit)]).join('');
};

export const formatTime = (date: Date,lang:string) => {
  let hours = date.getHours()==0?12:(date.getHours()>12?date.getHours()-12:date.getHours());
  let ampm;
  if(lang==='en'||lang==='en-US'){
    ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  return `${String(hours).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`;
  }
  else if(lang==='ar'){
    ampm = date.getHours() >= 12 ? 'م' : 'ص';
    return `${ampm} ${ convertToIndianNumerals(hours).padStart(2,'۰')}:${convertToIndianNumerals(date.getMinutes()).padStart(2, '۰')}`;
  }
}