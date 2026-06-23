import React, { useState, useRef } from 'react';

export default function AITryOnModalSimple({ product, isOpen, onClose }) {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  console.log('Simple modal rendering for product:', product);

  const handleFileUpload = (e) => {
    console.log('File upload triggered');
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File loaded successfully');
        setUserImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    console.log('Camera start triggered');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facing: 'user' } 
      });
      console.log('Camera access granted');
      // For now, just show a message that camera works
      alert('Camera access granted! (Full camera implementation coming soon)');
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access denied. Please allow camera permissions.');
    }
  };

  const processAITryOn = () => {
    if (!userImage) return;
    
    setIsProcessing(true);
    console.log('Starting AI processing...');
    // Simulate AI processing
    setTimeout(() => {
      console.log('AI processing complete!');
      setIsProcessing(false);
      alert('AI Try-On complete! (Full AI implementation coming soon)');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">AI Try-On</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="text-white mb-4">
          <p className="font-semibold">{product?.name}</p>
          <p className="text-gray-400">{product?.category}</p>
          <p className="text-gold-400">₹{product?.price}</p>
        </div>

        {!userImage ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-center">Choose your photo method:</p>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                📤 Upload Photo
              </button>
            </div>

            <button 
              onClick={startCamera}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📷 Use Camera
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <img 
                src={userImage} 
                alt="Uploaded" 
                className="w-32 h-32 rounded-lg mx-auto mb-2 object-cover"
              />
              <p className="text-green-400 text-sm">Photo uploaded successfully!</p>
            </div>

            <button 
              onClick={processAITryOn}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg 
                         hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? '🔄 Processing...' : '✨ Generate AI Try-On'}
            </button>

            <button 
              onClick={() => setUserImage(null)}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Try Different Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
