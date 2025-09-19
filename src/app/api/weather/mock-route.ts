import { NextRequest, NextResponse } from 'next/server'

// Mock weather data for testing without API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || 'Hyderabad'
    const type = searchParams.get('type') || 'current'

    // Mock weather data
    const mockWeatherData = {
      success: true,
      type,
      location: city,
      data: {
        current: {
          temperature: {
            current: 28,
            feels_like: 30,
            min: 25,
            max: 32
          },
          humidity: 65,
          pressure: 1013,
          wind: {
            speed: 3.5,
            direction: 180
          },
          weather: {
            main: 'Partly Cloudy',
            description: 'partly cloudy',
            icon: '02d'
          },
          visibility: 10000,
          clouds: 40,
          sunrise: new Date('2024-01-15T06:30:00'),
          sunset: new Date('2024-01-15T18:30:00'),
          farming_conditions: {
            irrigation_needed: false,
            crop_stress: false,
            good_growing: true,
            planting_suitable: true,
            harvesting_suitable: true
          }
        }
      },
      timestamp: new Date().toISOString(),
      note: 'This is mock data for testing. Get real data by adding OPENWEATHER_API_KEY to environment variables.'
    }

    return NextResponse.json(mockWeatherData)

  } catch (error) {
    console.error('Mock weather API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mock weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
