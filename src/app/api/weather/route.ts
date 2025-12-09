import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const type = searchParams.get('type') || 'current'

    // Weather API is temporarily disabled - return mock data
    return NextResponse.json({
      success: true,
      type,
      location: city || `${lat || '0'}, ${lon || '0'}`,
      data: {
        current: {
          temperature: {
            current: 28,
            feels_like: 30,
            min: 25,
            max: 32
          },
          humidity: 65,
          wind: {
            speed: 3.5,
            direction: 180
          },
          weather: {
            main: 'Clear',
            description: 'Weather API disabled',
            icon: '01d'
          },
          farming_conditions: {
            irrigation_needed: false,
            crop_stress: false,
            good_growing: true,
            planting_suitable: true,
            harvesting_suitable: true
          }
        }
      },
      mocked: true,
      note: 'Weather API disabled - using mock data'
    }, { status: 200 })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
