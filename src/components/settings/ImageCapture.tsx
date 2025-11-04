import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

type ImageCaptureProps = {
  label: string;
  description: string;
  onCapture: (file: File) => void;
  captured: File | null;
  required?: boolean;
};

export function ImageCapture({ label, description, onCapture, captured, required = false }: ImageCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (captured) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(captured);
    } else {
      setPreview(null);
    }
  }, [captured]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });

      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara o usa la opción de subir archivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  const removePhoto = () => {
    onCapture(null as any);
    setPreview(null);
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-slate-900">
          <p className="text-white text-center mb-4">{description}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="flex-1 bg-slate-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancelar
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Capturar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {preview ? (
        <div className="relative border-2 border-emerald-500 rounded-lg overflow-hidden">
          <img src={preview} alt="Captured" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={removePhoto}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <X size={18} />
              Eliminar
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-2 rounded-full">
            <Check size={20} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
          >
            <Camera className="mx-auto text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" size={32} />
            <p className="text-slate-300 text-sm font-medium mb-1">Tomar Foto</p>
            <p className="text-slate-500 text-xs">Usar cámara</p>
          </button>

          <label className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group">
            <Upload className="mx-auto text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" size={32} />
            <p className="text-slate-300 text-sm font-medium mb-1">Subir Archivo</p>
            <p className="text-slate-500 text-xs">Desde galería</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              required={required && !captured}
            />
          </label>
        </div>
      )}

      <p className="text-slate-400 text-xs mt-2">{description}</p>
    </div>
  );
}
