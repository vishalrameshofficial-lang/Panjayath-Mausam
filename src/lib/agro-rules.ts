import { DownscaledForecastItem } from './downscaler';

export interface AgroAdvisory {
  cropName: string;
  stage: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  generalAdvisory: string;
  irrigation: {
    action: 'IRRIGATE' | 'SUSPEND' | 'LIGHT_IRRIGATION' | 'DRAIN_EXCESS';
    recommendation: string;
  };
  spraying: {
    isSafeToSpray: boolean;
    recommendation: string;
  };
  harvesting: {
    action: 'FAVORABLE' | 'HOLD' | 'EMERGENCY_PROTECTION';
    recommendation: string;
  };
  audioScript: string;
}

export class AgroAdvisoryEngine {
  public static generateAdvisories(
    landCover: string,
    forecasts: DownscaledForecastItem[]
  ): AgroAdvisory[] {
    if (!forecasts || forecasts.length === 0) {
      return [];
    }

    // Calculate aggregated metrics over next 48 hours (first 48 items or all available)
    const next48 = forecasts.slice(0, 48);
    const totalRain48h = next48.reduce((sum, f) => sum + f.downscaledRain, 0);
    const maxWind = Math.max(...next48.map(f => f.downscaledWind));
    const maxTemp = Math.max(...next48.map(f => f.downscaledTemp));
    const minTemp = Math.min(...next48.map(f => f.downscaledTemp));
    const avgHumidity = next48.reduce((sum, f) => sum + f.downscaledHumidity, 0) / next48.length;

    // Detect primary crops based on region/land cover
    const crops = getCropsForLandCover(landCover);

    return crops.map(crop => {
      // Risk evaluation
      let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (totalRain48h > 45 || maxWind > 40) riskLevel = 'CRITICAL';
      else if (totalRain48h > 20 || maxWind > 25 || maxTemp > 38 || minTemp < 8) riskLevel = 'HIGH';
      else if (totalRain48h > 8 || avgHumidity > 82) riskLevel = 'MODERATE';

      // Irrigation logic
      let irrigationAction: 'IRRIGATE' | 'SUSPEND' | 'LIGHT_IRRIGATION' | 'DRAIN_EXCESS' = 'IRRIGATE';
      let irrigationText = '';
      if (totalRain48h > 25) {
        irrigationAction = 'DRAIN_EXCESS';
        irrigationText = `High downscaled rainfall expected (~${totalRain48h.toFixed(1)}mm). Clear drainage channels immediately to prevent waterlogging around roots.`;
      } else if (totalRain48h > 8) {
        irrigationAction = 'SUSPEND';
        irrigationText = `Rainfall predicted (~${totalRain48h.toFixed(1)}mm). Postpone scheduled irrigation to prevent nutrient leaching and save electricity.`;
      } else if (maxTemp > 34) {
        irrigationAction = 'LIGHT_IRRIGATION';
        irrigationText = `Elevated daytime temperature (${maxTemp.toFixed(1)}°C) increases evapotranspiration. Provide light drip irrigation during early morning or late evening.`;
      } else {
        irrigationAction = 'IRRIGATE';
        irrigationText = `Dry weather conditions. Maintain standard irrigation schedule matching crop vegetative requirement.`;
      }

      // Spraying logic
      const isSafeToSpray = maxWind < 14 && totalRain48h < 2.0;
      let sprayText = '';
      if (maxWind >= 14) {
        sprayText = `Wind gusts up to ${maxWind.toFixed(1)} km/h expected. Postpone chemical pesticide/fertilizer spraying due to high drift loss risk.`;
      } else if (totalRain48h >= 2.0) {
        sprayText = `Rain expected within 48h. Chemical sprays will wash off foliage. Delay spray applications until dry period.`;
      } else if (avgHumidity > 80 && maxTemp > 24 && maxTemp < 32) {
        sprayText = `Safe to spray (wind ${maxWind.toFixed(1)} km/h). Warm, humid conditions favor fungal leaf spot; preventative bio-fungicide spray recommended.`;
      } else {
        sprayText = `Favorable weather window for foliar nutrient sprays and pesticide treatment between 7:00 AM and 10:30 AM.`;
      }

      // Harvesting logic
      let harvestAction: 'FAVORABLE' | 'HOLD' | 'EMERGENCY_PROTECTION' = 'FAVORABLE';
      let harvestText = '';
      if (totalRain48h > 30 || maxWind > 35) {
        harvestAction = 'EMERGENCY_PROTECTION';
        harvestText = `Severe localized weather expected. Expedite harvest of mature pods/grains immediately and cover threshed produce with waterproof tarpaulin.`;
      } else if (totalRain48h > 5) {
        harvestAction = 'HOLD';
        harvestText = `Damp weather approaching. Hold harvesting of open grain crops to avoid post-harvest moisture contamination and aflatoxin.`;
      } else {
        harvestAction = 'FAVORABLE';
        harvestText = `Dry atmospheric window. Excellent conditions for crop harvesting, field drying, threshing, and storage.`;
      }

      // General advisory text
      const generalAdvisory = `${crop.name} is currently in the ${crop.stage} stage. Downscaled micro-climate indicates ${
        totalRain48h > 10 ? `significant local precipitation (${totalRain48h.toFixed(1)}mm)` : 'predominantly dry conditions'
      } with temperatures ranging from ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C. ${irrigationText}`;

      // Audio script for Web Speech API in vernacular
      const audioScript = `Agro advisory for ${crop.name}. Risk level is ${riskLevel}. Expected rain in 48 hours is ${totalRain48h.toFixed(0)} millimeters. ${
        isSafeToSpray ? 'Spraying is permitted in morning hours.' : 'Do not spray pesticides today due to weather conditions.'
      } ${irrigationText}`;

      return {
        cropName: crop.name,
        stage: crop.stage,
        riskLevel,
        generalAdvisory,
        irrigation: {
          action: irrigationAction,
          recommendation: irrigationText
        },
        spraying: {
          isSafeToSpray,
          recommendation: sprayText
        },
        harvesting: {
          action: harvestAction,
          recommendation: harvestText
        },
        audioScript
      };
    });
  }
}

function getCropsForLandCover(landCover: string): Array<{ name: string; stage: string }> {
  if (landCover.includes('Sugarcane')) {
    return [
      { name: 'Sugarcane', stage: 'Grand Growth / Tillering' },
      { name: 'Soybean', stage: 'Pod Formation / Flowering' }
    ];
  }
  if (landCover.includes('Grapes') || landCover.includes('Wheat')) {
    return [
      { name: 'Table Grapes', stage: 'Berry Development' },
      { name: 'Wheat', stage: 'Crown Root Initiation' }
    ];
  }
  if (landCover.includes('Orchard') || landCover.includes('Alpine')) {
    return [
      { name: 'Apple', stage: 'Fruit Setting / Foliar Development' },
      { name: 'Maize', stage: 'Tasseling & Silking' }
    ];
  }
  if (landCover.includes('Tea') || landCover.includes('Coffee')) {
    return [
      { name: 'Tea', stage: 'Flushing & Plucking' },
      { name: 'Black Pepper', stage: 'Berry Maturation' }
    ];
  }
  if (landCover.includes('Bajra') || landCover.includes('Arid')) {
    return [
      { name: 'Pearl Millet (Bajra)', stage: 'Grain Filling' },
      { name: 'Cluster Bean (Guar)', stage: 'Vegetative Flowering' }
    ];
  }
  // Default Gangetic / Alluvial
  return [
    { name: 'Paddy (Rice)', stage: 'Panicle Initiation' },
    { name: 'Mustard', stage: 'Early Vegetative' }
  ];
}
