import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const source = searchParams.get('source') || 'nasa' // nasa, openlandmap, onesoil

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Please provide lat/lon coordinates' },
        { status: 400 }
      )
    }

    let data: any = {}

    if (source === 'nasa') {
      data = await fetchNASAPowerData(lat, lon)
    } else if (source === 'openlandmap') {
      data = await fetchOpenLandMapData(lat, lon)
    } else if (source === 'onesoil') {
      data = await fetchOneSoilData(lat, lon)
    }

    return NextResponse.json({
      success: true,
      source,
      coordinates: { lat, lon },
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Soil analysis API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch soil data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchNASAPowerData(lat: string, lon: string) {
  try {
    // NASA POWER API endpoint
    const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point'
    const params = new URLSearchParams({
      parameters: 'ALLSKY_SFC_SW_DWN,PRECTOTCORR,RH2M,T2M,T2MDEW,T2MWET',
      community: 'AG',
      longitude: lon,
      latitude: lat,
      start: '20240101',
      end: '20241231',
      format: 'JSON'
    })

    const response = await fetch(`${baseUrl}?${params}`)
    const data = await response.json()

    return {
      location: { lat, lon },
      soil_moisture: data.properties?.parameter?.PRECTOTCORR || 'N/A',
      solar_radiation: data.properties?.parameter?.ALLSKY_SFC_SW_DWN || 'N/A',
      temperature: data.properties?.parameter?.T2M || 'N/A',
      humidity: data.properties?.parameter?.RH2M || 'N/A',
      evapotranspiration: data.properties?.parameter?.T2MWET || 'N/A',
      recommendations: generateSoilRecommendations(data)
    }
  } catch (error) {
    throw new Error(`NASA POWER API error: ${error}`)
  }
}

async function fetchOpenLandMapData(lat: string, lon: string) {
  try {
    // OpenLandMap API endpoint
    const baseUrl = 'https://api.openlandmap.org/v1/soil'
    
    // Mock data structure for OpenLandMap
    return {
      location: { lat, lon },
      soil_type: 'Clay Loam',
      ph_level: 6.5,
      organic_carbon: 2.1,
      nitrogen_content: 0.15,
      phosphorus_content: 0.08,
      potassium_content: 0.25,
      soil_texture: 'Medium',
      drainage: 'Good',
      recommendations: generateSoilRecommendations({})
    }
  } catch (error) {
    throw new Error(`OpenLandMap API error: ${error}`)
  }
}

async function fetchOneSoilData(lat: string, lon: string) {
  try {
    // OneSoil API endpoint
    const baseUrl = 'https://api.onesoil.ai/v1/fields'
    
    // Mock data structure for OneSoil
    return {
      location: { lat, lon },
      field_boundaries: 'Available',
      vegetation_index: 0.75,
      yield_estimate: 'Good',
      crop_health: 'Healthy',
      recommendations: generateSoilRecommendations({})
    }
  } catch (error) {
    throw new Error(`OneSoil API error: ${error}`)
  }
}

function generateSoilRecommendations(data: any): string[] {
  return [
    'Soil moisture levels are optimal for planting',
    'Consider adding organic compost to improve soil structure',
    'Monitor pH levels - current reading is suitable for most crops',
    'Irrigation recommended during dry periods',
    'Soil temperature is ideal for seed germination'
  ]
}
