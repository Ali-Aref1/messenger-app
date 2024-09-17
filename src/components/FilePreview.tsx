import React from 'react';
import remove from '../assets/remove.png';
import { getFileIcon, truncateFileName } from '../utils';

interface FilePreviewProps {
  file: File;
  index: number;
  removeFile: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, index, removeFile }) => {
  return (
    <div key={index} className='relative flex flex-col h-fit gap-2 items-center bg-slate-600 rounded-lg p-2'>
      <img
        src={remove}
        className='absolute top-2 right-2 w-4 cursor-pointer'
        onClick={() => removeFile(index)}
        alt="Remove"
      />
      <div>
        <img
          src={file.type.includes('image') ? URL.createObjectURL(file) : getFileIcon(file.name.split('.').pop() || '')}
          alt={file.name}
          className="w-12 h-12 object-cover"
        />
        <p className='text-white text-xs'>{truncateFileName(file.name)}</p>
      </div>
    </div>
  );
};

export default FilePreview;
