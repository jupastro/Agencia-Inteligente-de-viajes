
import React, { useState, useEffect, useRef } from 'react';
import BottomNav from './components/BottomNav';
import ItineraryCard from './components/ItineraryCard';
import AudioPlayer from './components/AudioPlayer';
import ShareModal from './components/ShareModal';
import { gemini } from './geminiService';
import { Trip, TravelPace, TripDay, BudgetLevel } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('explore');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [audioContent, setAudioContent] = useState<{ base64: string; title: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [dest, setDest] = useState('');
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState<string[]>(['Cultura', 'Gastronomía']);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(BudgetLevel.MEDIUM);
  const [numRestaurants, setNumRestaurants] = useState(2);
  const [mandatory, setMandatory] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#trip=')) {
      try {
        const encodedData = hash.replace('#trip=', '');
        const decodedData = JSON.parse(decodeURIComponent(atob(encodedData)));
        setActiveTrip(decodedData);
        setActiveTab('trips');
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        console.error("Error share", e);
      }
    }
  }, []);

  const handleGenerateTrip = async () => {
    if (!dest) return;
    setLoading(true);
    try {
      const data = await gemini.generateItineraryWithMaps(
        dest, 
        days, 
        interests, 
        TravelPace.BALANCED, 
        budgetLevel, 
        numRestaurants, 
        mandatory
      );
      
      if (!data) throw new Error("Error format");
      
      const newTrip: Trip = {
        id: Math.random().toString(36).substr(2, 9),
        destination: dest,
        durationDays: days,
        pace: TravelPace.BALANCED,
        interests: interests,
        mandatoryActivities: mandatory,
        numRestaurantsPerDay: numRestaurants,
        itinerary: data.itinerary,
        reservations: data.reservations || [],
        budget: data.budget,
        generalTips: data.tips,
        status: 'upcoming',
        createdAt: Date.now()
      };
      setTrips([newTrip, ...trips]);
      setActiveTrip(newTrip);
      setActiveTab('trips');
    } catch (error) {
      console.error("Error generating", error);
      alert("Error al generar el plan. Revisa tu conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages([...chatMessages, { role: 'user', text: userMsg }]);
    setChatInput('');
    try {
      const context = activeTrip ? `Viaje: ${activeTrip.destination}, Días: ${activeTrip.durationDays}, Presupuesto: ${activeTrip.budget.totalEstimated}€` : '';
      const aiResponse = await gemini.askAssistant(userMsg, context);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'Lo siento, no he podido procesar tu solicitud.' }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Error de conexión con el asistente.' }]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingImage(true);
    setImageResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const analysis = await gemini.analyzeTravelImage(base64, file.type);
        setImageResult(analysis || "No se pudo identificar la imagen.");
      } catch (e) {
        setImageResult("Error al analizar la imagen. Intenta con una foto más clara.");
      } finally {
        setAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-8 text-center animate-pulse">
          <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diseñando tu viaje maestro...</h2>
            <p className="text-sm text-slate-400">Consultando rutas óptimas en Google Maps y ajustando presupuestos de nivel {budgetLevel}.</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'explore':
        return (
          <div className="p-6 space-y-8 animate-fade-in">
            {imageResult && (
              <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-4 animate-bounce-in relative">
                <button onClick={() => setImageResult(null)} className="absolute top-6 right-6 opacity-60 hover:opacity-100">✕</button>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <h3 className="font-black text-lg">Análisis de Visión AI</h3>
                </div>
                <p className="text-sm leading-relaxed opacity-90">{imageResult}</p>
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter">Hola, Viajero.</h1>
              <p className="text-slate-500 font-medium">¿Listo para tu próxima aventura inteligente?</p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {[
                { name: 'Nueva York', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80' },
                { name: 'Islandia', img: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=400&q=80' },
                { name: 'Sevilla', img: 'https://images.unsplash.com/photo-1559564484-e484c204058a?auto=format&fit=crop&w=400&q=80' },
              ].map(city => (
                <div key={city.name} className="relative group overflow-hidden rounded-[2.5rem] min-w-[240px] aspect-[4/5] shadow-2xl cursor-pointer transition-transform active:scale-95" onClick={() => { setDest(city.name); setActiveTab('plan'); }}>
                  <img src={city.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={city.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-6 left-6 text-white font-black text-2xl">{city.name}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 text-lg">Scanner Vision</h3>
                <p className="text-xs text-slate-400">Analiza fotos de monumentos o menús</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className={`w-14 h-14 ${analyzingImage ? 'bg-slate-200' : 'bg-blue-600'} text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all`}
                disabled={analyzingImage}
              >
                {analyzingImage ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
        );

      case 'plan':
        return (
          <div className="p-6 space-y-8 animate-slide-up pb-32">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Configura tu Viaje</h2>
            
            <div className="space-y-6">
              {/* Destino */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Destino Mágico</label>
                <input 
                  type="text" 
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="Ej: Roma, Bali, Kioto..." 
                  className="w-full px-6 py-4 rounded-[1.75rem] bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {/* Presupuesto */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Nivel de Presupuesto</label>
                <div className="grid grid-cols-3 gap-2">
                  {[BudgetLevel.LOW, BudgetLevel.MEDIUM, BudgetLevel.HIGH].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => setBudgetLevel(lvl)}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        budgetLevel === lvl ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restaurantes y Días */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Días</label>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setDays(Math.max(1, days-1))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 active:scale-90">-</button>
                    <span className="text-xl font-black text-slate-800">{days}</span>
                    <button onClick={() => setDays(days+1)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 active:scale-90">+</button>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastro/Día</label>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setNumRestaurants(Math.max(1, numRestaurants-1))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 active:scale-90">-</button>
                    <span className="text-xl font-black text-slate-800">{numRestaurants}</span>
                    <button onClick={() => setNumRestaurants(Math.min(3, numRestaurants+1))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 active:scale-90">+</button>
                  </div>
                </div>
              </div>

              {/* Obligatorios */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Actividades "Sí o Sí"</label>
                <textarea 
                  value={mandatory}
                  onChange={(e) => setMandatory(e.target.value)}
                  placeholder="Ej: Visitar el Coliseo, cenar en Trastevere, ver la Fontana..." 
                  className="w-full px-6 py-4 rounded-[1.75rem] bg-white border border-slate-200 shadow-sm focus:outline-none h-24 font-medium text-sm p-4"
                />
              </div>

              <button 
                disabled={!dest || loading}
                onClick={handleGenerateTrip}
                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all ${
                  !dest || loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white active:scale-95 shadow-blue-200'
                }`}
              >
                {loading ? "Generando..." : "Crear Plan Inteligente"}
              </button>
            </div>
          </div>
        );

      case 'trips':
        if (!activeTrip) return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Aún no hay planes</h3>
            <button onClick={() => setActiveTab('plan')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">Diseñar mi primer viaje</button>
          </div>
        );

        return (
          <div className="animate-fade-in pb-32">
            <div className="relative h-64 overflow-hidden rounded-b-[3.5rem] shadow-2xl">
              <img src={`https://picsum.photos/seed/${activeTrip.destination}/1200/800`} className="w-full h-full object-cover" alt={activeTrip.destination} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-8 flex justify-between items-end right-8">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">{activeTrip.destination}</h2>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                    Viaje {activeTrip.budget.level}
                  </span>
                </div>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-10 space-y-12">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Presupuesto Maestro</p>
                    <h3 className="text-3xl font-black">{activeTrip.budget.totalEstimated}€</h3>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Alojamiento</p>
                    <p className="font-bold">{activeTrip.budget.breakdown.lodging}€</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Comida ({activeTrip.numRestaurantsPerDay}/día)</p>
                    <p className="font-bold">{activeTrip.budget.breakdown.food}€</p>
                  </div>
                </div>
              </div>

              {activeTrip.itinerary.map((day) => (
                <div key={day.dayNumber} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform -rotate-3">
                      {day.dayNumber}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Día {day.dayNumber}</h3>
                  </div>
                  <div className="space-y-2">
                    {day.activities.map((activity) => (
                      <ItineraryCard 
                        key={activity.id} 
                        activity={activity} 
                        onAudioGuideRequest={(title) => {
                          gemini.generateAudioGuide(title, 'storytelling').then(res => {
                            if (res.audioData) setAudioContent({ base64: res.audioData, title });
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="p-6 space-y-8 animate-fade-in pb-32">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Consejos AI</h1>
            <div className="grid gap-4">
              {[
                { title: 'Dinero & Cambio', desc: 'Mejores tarjetas para viajar sin comisiones.', icon: '💳' },
                { title: 'Packing Inteligente', desc: 'Qué llevar según el clima local.', icon: '🎒' },
                { title: 'Apps Locales', desc: 'Imprescindibles para transporte y comida.', icon: '📱' },
                { title: 'Protocolo & Cultura', desc: 'Lo que debes saber antes de llegar.', icon: '🤝' },
              ].map(tip => (
                <div key={tip.title} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 hover:border-blue-200 transition-all cursor-pointer">
                  <span className="text-3xl">{tip.icon}</span>
                  <div>
                    <h4 className="font-black text-slate-800">{tip.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="p-6 space-y-10 animate-fade-in pb-32">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100">V</div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Viajero Premium</h2>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Nivel Explorador</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Mis Viajes Guardados</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black">{trips.length}</span>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Suscripción Pro</span>
                <span className="text-blue-600 font-black text-xs uppercase tracking-tighter">Activa ✓</span>
              </div>
            </div>

            {/* Disclaimer de Privacidad y Propiedad Intelectual en UI */}
            <div className="bg-slate-100 p-8 rounded-[2.5rem] space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información Legal</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-[10px] font-black text-slate-600 uppercase">Propiedad Intelectual</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    © 2024 WanderGen AI. Todo el código fuente, lógica de prompts y diseño de interfaz son propiedad intelectual del autor. El uso comercial o redistribución requiere permiso expreso.
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-slate-600 uppercase">Privacidad y Datos</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Esta aplicación utiliza la API de Google Gemini para procesar entradas. Las imágenes y audios se procesan de forma efímera y no se almacenan permanentemente en nuestros sistemas. Al usar el scanner o audioguía, aceptas el procesamiento de datos por parte de Google AI.
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-[9px] text-slate-400 italic font-medium">
                    * El contenido generado por IA debe ser verificado por el usuario antes de tomar decisiones logísticas o de compra.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-slate-50 border-x border-slate-100 overflow-x-hidden">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-xl z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-200 transform -rotate-6">W</div>
          <span className="font-black text-2xl text-slate-900 tracking-tighter">WanderGen</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setChatOpen(!chatOpen)} 
            className={`w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center transition-all ${chatOpen ? 'text-blue-600 scale-90 border-blue-200' : 'text-slate-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z" /></svg>
          </button>
        </div>
      </header>

      <main>{renderContent()}</main>

      {/* Chat Asistente */}
      {chatOpen && (
        <div className="fixed inset-x-0 bottom-24 top-0 z-[60] bg-white flex flex-col animate-slide-up max-w-md mx-auto shadow-2xl rounded-t-[3rem]">
          <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">⚡</div>
              <h3 className="font-black text-slate-800">Concierge AI</h3>
            </div>
            <button onClick={() => setChatOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 active:scale-90">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {chatMessages.length === 0 && (
              <p className="text-center text-slate-400 text-xs py-10">Pregúntame sobre hoteles, restaurantes o logística de tu viaje.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-[1.5rem] text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t flex gap-3">
            <input 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
              className="flex-1 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              placeholder="Escribe tu duda..." 
            />
            <button onClick={handleSendMessage} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">➤</button>
          </div>
        </div>
      )}

      {audioContent && (
        <AudioPlayer 
          audioBase64={audioContent.base64} 
          title={audioContent.title} 
          onClose={() => setAudioContent(null)} 
        />
      )}

      {showShareModal && activeTrip && (
        <ShareModal 
          shareUrl={window.location.href} 
          destination={activeTrip.destination}
          duration={activeTrip.durationDays}
          onClose={() => setShowShareModal(false)} 
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default App;
