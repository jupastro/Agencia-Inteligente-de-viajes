
import React from 'react';
import { Activity, TravelCategory } from '../types';

interface ItineraryCardProps {
  activity: Activity & { mapsSearchQuery?: string };
  onAudioGuideRequest?: (title: string) => void;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ activity, onAudioGuideRequest }) => {
  const getCategoryColor = (cat: TravelCategory) => {
    switch (cat) {
      case TravelCategory.CULTURE: return 'bg-purple-100 text-purple-700';
      case TravelCategory.GASTRONOMY: return 'bg-orange-100 text-orange-700';
      case TravelCategory.NATURE: return 'bg-green-100 text-green-700';
      case TravelCategory.LEISURE: return 'bg-blue-100 text-blue-700';
      case TravelCategory.HISTORY: return 'bg-amber-100 text-amber-700';
      case TravelCategory.LODGING: return 'bg-indigo-100 text-indigo-700';
      case TravelCategory.LOGISTICS: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const openInMaps = () => {
    const query = activity.mapsSearchQuery || activity.title;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const getTransportIcon = (mode: string) => {
    switch(mode) {
      case 'walk': return '🚶';
      case 'transit': return '🚌';
      default: return '🚗';
    }
  };

  return (
    <div className="relative pl-10 pb-10 border-l-2 border-slate-100 last:pb-0">
      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-sm"></div>
      
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group active:scale-[0.98]">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-black text-slate-400 tracking-tight">{activity.startTime} - {activity.endTime}</span>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${getCategoryColor(activity.category)}`}>
              {activity.category}
            </span>
            {activity.estimatedCost > 0 && (
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                Est. {activity.estimatedCost}€
              </span>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-tight">{activity.title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3">{activity.description}</p>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onAudioGuideRequest?.(activity.title)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-50 text-blue-600 rounded-[1.25rem] text-xs font-black hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            Audioguía AI
          </button>
          <button 
            onClick={openInMaps}
            className="w-12 h-12 bg-slate-50 text-slate-400 rounded-[1.25rem] flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </button>
        </div>

        {activity.travelDuration && (
          <div className="mt-5 pt-5 border-t border-slate-50 flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span className="text-lg">{getTransportIcon(activity.travelMode)}</span>
            <span>{activity.travelDuration} en {activity.travelMode === 'walk' ? 'pie' : activity.travelMode === 'transit' ? 'transporte' : 'coche'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryCard;
