// Agricultural API Service Utility
export class AgriculturalAPIService {
  private baseUrl: string

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Remove trailing slash to avoid double slashes
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  // Weather Services (disabled)
  async getCurrentWeather(_lat: number, _lon: number) {
    return { data: null }
  }

  async getWeatherForecast(_lat: number, _lon: number) {
    return { data: null }
  }

  async getSoilMoisture(_lat: number, _lon: number) {
    return { data: null }
  }

  // Market Prices Services
  async getCropPrices(crop: string, state?: string, mandi?: string) {
    const params = new URLSearchParams({ crop })
    if (state) params.append('state', state)
    if (mandi) params.append('mandi', mandi)
    
    const response = await fetch(
      `${this.baseUrl}/api/market-prices?${params.toString()}`
    )
    return response.json()
  }

  async getFAOPrices(crop: string) {
    const response = await fetch(
      `${this.baseUrl}/api/market-prices?crop=${crop}&source=fao`
    )
    return response.json()
  }

  async getWorldBankPrices(crop: string) {
    const response = await fetch(
      `${this.baseUrl}/api/market-prices?crop=${crop}&source=worldbank`
    )
    return response.json()
  }

  // Soil Analysis Services
  async getNASASoilData(lat: number, lon: number) {
    const response = await fetch(
      `${this.baseUrl}/api/soil-analysis?lat=${lat}&lon=${lon}&source=nasa`
    )
    return response.json()
  }

  async getOpenLandMapData(lat: number, lon: number) {
    const response = await fetch(
      `${this.baseUrl}/api/soil-analysis?lat=${lat}&lon=${lon}&source=openlandmap`
    )
    return response.json()
  }

  async getOneSoilData(lat: number, lon: number) {
    const response = await fetch(
      `${this.baseUrl}/api/soil-analysis?lat=${lat}&lon=${lon}&source=onesoil`
    )
    return response.json()
  }

  // Crop Advisory Services
  async identifyPlant(image: string, source: 'plantid' | 'plantnet' = 'plantid') {
    const response = await fetch(`${this.baseUrl}/api/crop-advisory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        type: 'identification',
        source
      })
    })
    return response.json()
  }

  async detectDisease(image: string, source: 'plantid' | 'plantnet' = 'plantid') {
    const response = await fetch(`${this.baseUrl}/api/crop-advisory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        type: 'disease',
        source
      })
    })
    return response.json()
  }

  // Utility Methods
  async getFarmingRecommendations(lat: number, lon: number, crop?: string) {
    try {
      const [soil, prices] = await Promise.all([
        this.getNASASoilData(lat, lon),
        crop ? this.getCropPrices(crop) : Promise.resolve(null)
      ])

      return {
        weather_recommendations: [],
        soil_recommendations: this.generateSoilRecommendations(soil),
        market_recommendations: prices ? this.generateMarketRecommendations(prices) : null,
        overall_score: this.calculateFarmingScore(null, soil, prices)
      }
    } catch (error) {
      throw new Error(`Failed to get farming recommendations: ${error}`)
    }
  }

  private generateWeatherRecommendations(weather: any): string[] {
    return []
  }

  private generateSoilRecommendations(soil: any): string[] {
    const recommendations = []
    
    if (soil.data?.soil_moisture < 30) {
      recommendations.push('Soil moisture low - irrigation needed')
    }
    
    if (soil.data?.ph_level < 6 || soil.data?.ph_level > 8) {
      recommendations.push('Soil pH adjustment recommended')
    }

    return recommendations
  }

  private generateMarketRecommendations(prices: any): string[] {
    const recommendations = []
    
    if (prices.data?.trend === 'rising') {
      recommendations.push('Prices rising - consider holding crops')
    } else if (prices.data?.trend === 'falling') {
      recommendations.push('Prices falling - consider selling soon')
    }

    return recommendations
  }

  private calculateFarmingScore(weather: any, soil: any, prices: any): number {
    let score = 0
    
    // Weather score (0-40) disabled
    score += 20

    // Soil score (0-30)
    if (soil.data?.soil_moisture > 40) score += 30
    else if (soil.data?.soil_moisture > 20) score += 20
    else score += 10

    // Market score (0-30)
    if (prices?.data?.trend === 'rising') score += 30
    else if (prices?.data?.trend === 'stable') score += 20
    else score += 10

    return Math.min(score, 100)
  }
}

// Export singleton instance
export const agriculturalAPI = new AgriculturalAPIService()
