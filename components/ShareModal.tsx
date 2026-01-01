
import React, { useState } from 'react';

interface ShareModalProps {
  shareUrl: string;
  destination: string;
  duration: number;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ shareUrl, destination, duration, onClose }) => {
  const [copied, setCopied] = useState(false);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up">
        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Compartir Viaje</h3>
            <p className="text-sm text-slate-500">Envía este itinerario a tus amigos para que puedan unirse a la aventura.</p>
          </div>

          {/* Trip Preview Card */}
          <div className="relative group overflow-hidden rounded-3xl aspect-[16/7] shadow-lg border border-slate-100">
            <img 
              src={`https://picsum.photos/seed/${destination}/600/300`} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              alt={destination} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-5 text-left">
              <h4 className="text-white font-black text-xl leading-none">{destination}</h4>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Plan de {duration} días</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl flex flex-col items-center justify-center border border-slate-100 shadow-inner">
            <img 
              src={qrCodeUrl} 
              alt="Trip QR Code" 
              className="w-40 h-40 rounded-2xl shadow-sm bg-white p-2"
            />
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escanea para importar</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Copiado!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Link Mágico
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
