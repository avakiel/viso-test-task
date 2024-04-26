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
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore'

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

  useEffect(() => {
    const fetchMarkers = async () => {
      const loadedMarkers = await loadMarkers()
      setMarkers(loadedMarkers)
    }

    fetchMarkers()
  }, [])

  const loadMarkers = async () => {
    const querySnapshot = await getDocs(collection(db, 'markers'))
    const loadedMarkers: MarkerData[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      loadedMarkers.push({
        id: data.Quest,
        label: data.Quest.toString(),
        position: data.location,
        timeStamp: data.timestemp,
      })
    })
    return loadedMarkers
  }

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
      const querySnapshot = await getDocs(collection(db, 'markers'))
  
      const existingIds = new Set<number>()
  
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        existingIds.add(data.Quest)
      })
  
      let newId = 1
      while (existingIds.has(newId)) {
        newId++
      }
  
      const newMarker = {
        id: newId,
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
        label: newId.toString(),
        timeStamp: Date.now(),
      }
  
      await addDoc(collection(db, 'markers'), {
        Quest: newMarker.id,
        location: newMarker.position,
        timestemp: newMarker.timeStamp,
      })
  
      setMarkers((prevMarkers) => [...prevMarkers, newMarker])
    }
  }
  
  
  const handleDragEnd = async (
    markerId: number,
    newPosition: google.maps.LatLngLiteral
  ) => {
    const markerDoc = doc(db, 'markers', markerId.toString())
    await updateDoc(markerDoc, {
      location: newPosition,
    })

    setMarkers((prevMarkers) =>
      prevMarkers.map((marker) =>
        marker.id === markerId ? { ...marker, position: newPosition } : marker
      )
    )
  }

  const handleDeleteMarker = async (markerId: number) => {
    const querySnapshot = await getDocs(collection(db, 'markers'))
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.Quest === markerId) {
        deleteDoc(doc.ref)
      }
    })

    setMarkers((prevMarkers) =>
      prevMarkers.filter((marker) => marker.id !== markerId)
    )
  }

  const deleteAllMarkers = async () => {
    const querySnapshot = await getDocs(collection(db, 'markers'))
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref)
    })

    setMarkers([])
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
