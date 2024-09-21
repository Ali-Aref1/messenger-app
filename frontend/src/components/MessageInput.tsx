import React, { ChangeEvent } from 'react';
import attachIcon from '../assets/paper-clip.png';

interface MessageInputProps {
  msg: string;
  setMsg: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fileObjects: File[];
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const MessageInput: React.FC<MessageInputProps> = ({ msg, setMsg, sendMessage, handleFileChange, fileObjects, fileInputRef }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full h-fit p-2 border-slate-500 bg-slate-300 border-t-4 flex gap-2">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="text"
        value={msg}
        onChange={(e) => {setMsg(e.target.value); }}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 p-2 border-2 border-gray-400 rounded"
      />
      <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white rounded px-4 py-2">
        <img src={attachIcon} alt="Attach" className="w-6 h-6" />
      </button>
      <button onClick={sendMessage} className={`bg-green-500 text-white rounded px-4 py-2 ${(msg.trim()==""&&fileObjects.length==0)&&"disabled opacity-25 cursor-not-allowed"}`}>
        Send
      </button>
    </div>
  );
};

export default MessageInput;
