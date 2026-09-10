"use client"

import React, { useEffect, useState } from "react"
import { MapPin, Minus, Search, TrendingDown, TrendingUp } from "lucide-react"
import { NewNavbar } from "../src/components/ui/new-navbar"

interface MarketData {
  crop: string
  variety?: string
  grade?: string
  min_price: number
  max_price: number
  modal_price?: number
  trend: "rising" | "falling" | "stable"
  recommendation: string
  location?: string
  market?: string
  district?: string
  state?: string
  date?: string
  source?: string
}

export default function MarketPricesPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [sourceLabel, setSourceLabel] = useState("data.gov.in / AGMARKNET")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketData()
  }, [])

  const fetchMarketData = async (crop?: string, state?: string) => {
    setIsLoading(true)
    setError(null)
    setStatusNote(null)

    try {
      const params = new URLSearchParams({ limit: "10", offset: "0" })
      if (crop) params.set("crop", crop)
      if (state) params.set("state", state)

      const response = await fetch(`/api/market-prices?${params.toString()}`)
      const body = await response.json()

      if (!response.ok || !body?.success || !Array.isArray(body.data)) {
        throw new Error(body?.error || "Could not load mandi prices")
      }

      setMarketData(body.data)
      setSourceLabel(body.source || "data.gov.in / AGMARKNET")
      setUpdatedAt(body.updated || null)
      setStatusNote(body.cached ? body.message || "Showing last known mandi prices." : null)
    } catch (err) {
      console.error("Market data fetch error:", err)
      setMarketData([])
      setError(err instanceof Error ? err.message : "Could not load mandi prices")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredData = marketData.filter((item) => {
    const q = searchTerm.toLowerCase()
    return (
      item.crop.toLowerCase().includes(q) ||
      (item.market || "").toLowerCase().includes(q) ||
      (item.state || "").toLowerCase().includes(q) ||
      (item.variety || "").toLowerCase().includes(q)
    )
  })

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "falling":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "rising":
        return "bg-green-50 text-green-600"
      case "falling":
        return "bg-red-50 text-red-600"
      default:
        return "bg-gray-50 text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewNavbar />

      <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <TrendingUp className="h-8 w-8 text-green-500" />
            Market Prices
          </h1>
          <p className="mt-2 text-gray-600">
            Live mandi prices from AGMARKNET (data.gov.in)
          </p>
          {statusNote && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              {statusNote}
            </p>
          )}
        </div>

        <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
          <form
            className="flex flex-col gap-4 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              fetchMarketData(searchTerm.trim() || undefined, stateFilter.trim() || undefined)
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search crop, e.g. Wheat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-green-500"
              />
            </div>
            <input
              type="text"
              placeholder="State, e.g. Telangana"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Search API
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
            <p className="text-gray-600">Loading live mandi prices...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((item, index) => (
              <div key={`${item.crop}-${item.market}-${index}`} className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.crop}</h3>
                    {item.variety && (
                      <p className="text-sm text-gray-500">{item.variety}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTrendColor(item.trend)}`}>
                    {getTrendIcon(item.trend)}
                    <span className="capitalize">{item.grade || item.trend}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Min – Max</span>
                    <span className="font-semibold text-gray-900">
                      ₹{item.min_price} – ₹{item.max_price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Modal price</span>
                    <span className="font-semibold text-green-600">
                      ₹{item.modal_price ?? Math.round((item.min_price + item.max_price) / 2)}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-gray-600">Mandi</span>
                      <span className="flex items-start gap-1 text-right text-sm text-gray-900">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {item.location}
                      </span>
                    </div>
                  )}
                  {item.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Arrival</span>
                      <span className="text-sm text-gray-900">{item.date}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-700">{item.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredData.length === 0 && (
          <div className="py-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No Results Found</h3>
            <p className="mb-4 text-gray-600">Try a crop name that matches AGMARKNET, such as Wheat or Potato.</p>
            <button
              onClick={() => {
                setSearchTerm("")
                setStateFilter("")
                fetchMarketData()
              }}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Show latest mandi prices
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => fetchMarketData(searchTerm.trim() || undefined, stateFilter.trim() || undefined)}
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Fetching from AGMARKNET..." : "Refresh Data"}
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Data source: {sourceLabel}
            {updatedAt ? ` · updated ${new Date(updatedAt).toLocaleString()}` : ""}
          </p>
        </div>
      </div>
    </div>
  )
}
