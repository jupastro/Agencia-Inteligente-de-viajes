
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TravelCategory, TravelPace, BudgetLevel } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateItineraryWithMaps(
    destination: string,
    days: number,
    interests: string[],
    pace: TravelPace,
    budgetLevel: BudgetLevel,
    numRestaurants: number,
    mandatoryActivities?: string
  ) {
    // Note: Google Maps tool is only supported in Gemini 2.5 series models.
    const prompt = `Actúa como un experto en logística de viajes premium. Crea un plan maestro de ${days} días para ${destination}.
    
    PARÁMETROS CRÍTICOS:
    - Nivel de Presupuesto: ${budgetLevel} (ajusta el coste de hoteles y comidas a este nivel).
    - Gastronomía: Incluye exactamente ${numRestaurants} recomendaciones de restaurantes/comida por día.
    - ACTIVIDADES OBLIGATORIAS: Debes incluir "${mandatoryActivities || 'Ninguna'}" en el itinerario de forma lógica.
    - Intereses: ${interests.join(", ")}. Ritmo: ${pace}.
    
    ESTRUCTURA DE RESPUESTA (JSON puro):
    {
      "itinerary": [
        {
          "dayNumber": number,
          "activities": [
            {
              "startTime": "HH:MM",
              "endTime": "HH:MM",
              "title": "Nombre",
              "description": "Detalle",
              "category": "Cultura|Gastronomía|Naturaleza|Ocio|Historia",
              "travelMode": "walk|transit|car",
              "travelDuration": "tiempo",
              "mapsSearchQuery": "búsqueda en maps",
              "estimatedCost": number
            }
          ]
        }
      ],
      "reservations": [
        {
          "id": "string",
          "type": "hotel|vuelo|entrada|restaurante",
          "title": "Nombre",
          "detail": "Por qué ir",
          "estimatedCost": number
        }
      ],
      "budget": {
        "totalEstimated": number,
        "currency": "EUR",
        "level": "${budgetLevel}",
        "breakdown": {
          "lodging": number,
          "food": number,
          "activities": number,
          "transport": number
        }
      },
      "tips": [{"title": "string", "content": "string", "icon": "string"}]
    }
    Responde en CASTELLANO. Los precios deben ser realistas para un nivel ${budgetLevel} en ${destination}.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }

  async analyzeTravelImage(base64Data: string, mimeType: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Identifica qué hay en esta foto de viaje. Responde en CASTELLANO.",
          },
        ],
      },
    });
    return response.text;
  }

  async askAssistant(query: string, context?: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context ? `Contexto: ${context}\n\nPregunta: ${query}` : query,
      config: {
        systemInstruction: "Eres un asistente de viajes experto. Ayuda con el presupuesto y la logística. Castellano.",
      }
    });
    return response.text;
  }

  async generateAudioGuide(poiName: string, style: 'informative' | 'storytelling' | 'brief') {
    const prompt = `Guion de audioguía para ${poiName}. Castellano.`;
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return { audioData: response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data };
  }
}

export const gemini = new GeminiService();
