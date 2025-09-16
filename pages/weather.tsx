import { WeatherWidget } from "../src/components/ui/weather-widget"
import { WeatherForecast } from "../src/components/ui/weather-forecast"

export default function WeatherPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌤️ Live Weather Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time weather data and agricultural recommendations for informed farming decisions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <WeatherWidget city="Mumbai" autoDetectLocation={true} />
          <WeatherWidget city="Delhi" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <WeatherForecast city="Mumbai" />
          <WeatherForecast city="Delhi" />
        </div>
      </div>
    </div>
  )
}
