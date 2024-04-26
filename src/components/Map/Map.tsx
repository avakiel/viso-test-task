import { useEffect, useState } from 'react'
import {
  GoogleMap,
  Marker,
  MarkerClusterer,
  useJsApiLoader,
} from '@react-google-maps/api'
import { Loader } from '../Loader'
import './Map.scss'
import { db } from '../../firebase'
import { collection, addDoc } from "firebase/firestore"; 

interface MarkerData {
  id: number
  label: string
  position: {
    lat: number
    lng: number
  }
  timeStamp: number
}

const containerStyle = {
  width: '100vw',
  height: '100vh',
}

const center = {
  lat: -3.745,
  lng: -38.523,
}

export const Map = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_API_KEY as string,
  })

  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [lastMarkerId, setLastMarkerId] = useState<number>(1)
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLngLiteral | null>(null)


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error('Error getting current location:', error)
        }
      )
    } else {
      console.error('Geolocation is not supported by this browser.')
    }
  }, [])

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const existingIds = markers.map((marker) => marker.id)

      let freeIndex = 1
      for (let i = 1; i <= lastMarkerId; i++) {
        if (!existingIds.includes(i)) {
          freeIndex = i
          break
        }
      }

      const newMarker = {
        id: freeIndex,
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
        label: freeIndex.toString(),
        timeStamp: Date.now(),
      }

      setMarkers([...markers, newMarker])
      setLastMarkerId((prevId) => Math.max(prevId, freeIndex + 1))

      try {
        const docRef = await addDoc(collection(db, "markers"), {
          Quest: newMarker.label,
          location: newMarker.position,
          timestemp: newMarker.timeStamp
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  }

  const handleDragEnd = (
    markerId: number,
    newPosition: google.maps.LatLngLiteral
  ) => {
    const markerIndex = markers.findIndex((marker) => marker.id === markerId)

    if (markerIndex !== -1) {
      const updatedMarkers = [...markers]
      updatedMarkers[markerIndex].position = newPosition
      setMarkers(updatedMarkers)
    }
  }

  const handleDeleteMarker = (markerId: number) => {
    const newMarkers = [...markers].filter((mark) => mark.id !== markerId)

    setMarkers(newMarkers)

    if (newMarkers.length === 0) {
      setLastMarkerId(1)
    }
  }

  const deleteAllMarkers = () => {
    setMarkers([])
    setLastMarkerId(1)
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentLocation || center}
      zoom={10}
      onClick={handleMapClick}
    >
      {markers.length > 0 && (
        <div className="controls">
          <button className="controls__delete" onClick={deleteAllMarkers}>
            Delete All Markers
          </button>
        </div>
      )}
      <MarkerClusterer>
        {(clusterer) => (
          <div>
            {markers.map((marker) => (
              <Marker
                draggable={true}
                label={marker.label}
                key={marker.id}
                position={marker.position}
                onDragEnd={(e) =>
                  e.latLng && handleDragEnd(marker.id, e.latLng.toJSON())
                }
                onRightClick={() => handleDeleteMarker(marker.id)}
                clusterer={clusterer}
              />
            ))}
          </div>
        )}
      </MarkerClusterer>
    </GoogleMap>
  ) : (
    <Loader />
  )
}
