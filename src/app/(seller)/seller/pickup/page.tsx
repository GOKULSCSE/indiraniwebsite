"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Search, MapPin, Plus, AlertCircle, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface PickupLocation {
  id?: number
  pickup_location: string
  name: string
  email: string
  phone: string
  address: string
  address_2: string
  city: string
  state: string
  country: string
  pin_code: string
  isDefault?: boolean
}

interface SellerPickupLocationsProps {
  sellerName?: string
}

const SellerPickupLocations: React.FC<SellerPickupLocationsProps> = ({ sellerName = "My Store" }) => {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [locations, setLocations] = useState<PickupLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PickupLocation>({
    pickup_location: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    address_2: "",
    city: "",
    state: "",
    country: "india",
    pin_code: "",
  })

  // Fetch pickup locations (seller sees only their own)
  const fetchLocations = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!session?.user?.sellerId) {
        setError("Seller authentication required")
        return
      }

      const response = await fetch("/api/shiprocket/location", {
        headers: {
          'x-user': JSON.stringify({
            sellerId: session.user.sellerId
          })
        }
      })

      if (response.ok) {
        const result = await response.json()
        const locationsArray = result?.data?.data?.shipping_address
        setLocations(Array.isArray(locationsArray) ? locationsArray : [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch locations")
        setLocations([])
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setError("Network error occurred while fetching locations")
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  // Create new pickup location
  const createLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!session?.user?.sellerId) {
        setError("Seller authentication required")
        return
      }

      const response = await fetch("/api/shiprocket/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-user': JSON.stringify({
            sellerId: session.user.sellerId
          })
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          pickup_location: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          address_2: "",
          city: "",
          state: "",
          country: "india",
          pin_code: "",
        })
        await fetchLocations()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create location")
      }
    } catch (error) {
      console.error("Error creating location:", error)
      setError("Network error occurred while creating location")
    } finally {
      setLoading(false)
    }
  }

  const handleSetPickup = async (locationId: number) => {
    try {
      setLoading(true)
      const response = await fetch("/api/shiprocket/location/default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-seller-id": session?.user?.sellerId || "",
        },
        body: JSON.stringify({
          location_id: locationId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to set default pickup location")
      }

      toast.success("Default pickup location updated successfully")
      // Refresh the locations list
      fetchLocations()
    } catch (error) {
      console.error("Error setting default pickup location:", error)
      toast.error(error instanceof Error ? error.message : "Failed to set default pickup location")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user?.sellerId) {
      fetchLocations()
    }
  }, [status, session])

  // Filter locations based on search query
  const filteredLocations = Array.isArray(locations)
    ? locations.filter(
        (location) =>
          location.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold flex items-center">
                <Store className="h-5 w-5 mr-2" />
                {sellerName} - Pickup Locations
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Search my locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Add Location Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Pickup Location</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pickup_location">Pickup Location *</Label>
                        <Input
                          id="pickup_location"
                          name="pickup_location"
                          value={formData.pickup_location}
                          onChange={handleInputChange}
                          placeholder="e.g., gandhipuram_123"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_2">Address 2 (Optional)</Label>
                        <Input
                          id="address_2"
                          name="address_2"
                          value={formData.address_2}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pin_code">PIN Code *</Label>
                        <Input
                          id="pin_code"
                          name="pin_code"
                          value={formData.pin_code}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-red-600" onClick={createLocation} disabled={loading}>
                        {loading ? "Creating..." : "Create Location"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">My Pickup Locations</h2>
          <p className="text-muted-foreground mt-2">
            Manage your pickup locations for shipments ({filteredLocations.length} locations)
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Locations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location, index) => (
            <Card key={location.id || index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="h-5 w-5 text-primary mr-2" />
                    {location.pickup_location}
                    {location.isDefault && (
                      <Badge variant="default" className="ml-2 bg-green-600">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  {!location.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetPickup(location.id!)}
                      className="ml-2"
                    >
                      Set as Default
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span> {location.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {location.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {location.phone}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span> {location.address}
                  </p>
                  {location.address_2 && (
                    <p>
                      <span className="font-medium">Address 2:</span> {location.address_2}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{location.city}</Badge>
                    <Badge variant="secondary">{location.state}</Badge>
                    <Badge variant="outline">{location.pin_code}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Empty State */}
        {!loading && filteredLocations.length === 0 && !error && (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No pickup locations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first pickup location."}
              </p>
              {!searchQuery && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Location
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SellerPickupLocations
