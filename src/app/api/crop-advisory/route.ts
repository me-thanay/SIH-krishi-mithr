import { NextRequest, NextResponse } from 'next/server'

const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY || 'your_plant_id_api_key_here'
const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY || 'your_plantnet_api_key_here'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, type = 'disease', source = 'plantid' } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Please provide image data' },
        { status: 400 }
      )
    }

    let data: any = {}

    if (source === 'plantid') {
      data = await fetchPlantIdData(image, type)
    } else if (source === 'plantnet') {
      data = await fetchPlantNetData(image, type)
    }

    return NextResponse.json({
      success: true,
      source,
      type,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Crop advisory API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze crop image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchPlantIdData(image: string, type: string) {
  try {
    const baseUrl = 'https://api.plant.id/v3/identification'
    
    const requestBody = {
      images: [image],
      modifiers: type === 'disease' ? ['crops_medium', 'disease'] : ['crops_medium'],
      plant_language: 'en',
      plant_details: ['common_names', 'url', 'description', 'taxonomy', 'rank', 'gbif_id', 'inaturalist_id', 'image', 'synonyms']
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PLANT_ID_API_KEY
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    return {
      identification: data.result?.classification?.suggestions?.[0] || null,
      disease_detection: type === 'disease' ? data.result?.disease?.suggestions?.[0] || null : null,
      confidence: data.result?.classification?.suggestions?.[0]?.probability || 0,
      recommendations: generateCropRecommendations(data, type)
    }
  } catch (error) {
    throw new Error(`Plant.id API error: ${error}`)
  }
}

async function fetchPlantNetData(image: string, type: string) {
  try {
    const baseUrl = 'https://my-api.plantnet.org/v2/identify'
    
    const formData = new FormData()
    formData.append('images', image)
    formData.append('organs', 'auto')
    formData.append('include-related-images', 'true')
    formData.append('no-reject', 'false')

    const response = await fetch(`${baseUrl}?api-key=${PLANTNET_API_KEY}`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    return {
      identification: data.results?.[0] || null,
      confidence: data.results?.[0]?.score || 0,
      recommendations: generateCropRecommendations(data, type)
    }
  } catch (error) {
    throw new Error(`PlantNet API error: ${error}`)
  }
}

function generateCropRecommendations(data: any, type: string): string[] {
  if (type === 'disease') {
    return [
      'Apply fungicide treatment immediately',
      'Improve air circulation around plants',
      'Remove affected plant parts',
      'Monitor for further spread',
      'Consider resistant varieties for future planting'
    ]
  } else {
    return [
      'Plant appears healthy - continue current care routine',
      'Ensure adequate watering and nutrition',
      'Monitor for pest activity',
      'Consider crop rotation for soil health',
      'Maintain proper spacing between plants'
    ]
  }
}
