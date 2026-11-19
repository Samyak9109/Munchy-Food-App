import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon (Vite breaks the default paths)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon: yellow for selected, red for open, grey for closed
function makeIcon(isOpen, selected) {
  const color = selected ? '#FFDB3C' : isOpen ? '#FF5352' : '#666';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
    className: '',
  });
}

export default function StoreMarker({ store, selected, onClick, children }) {
  const markerRef = useRef(null);
  const [lng, lat] = store.location?.coordinates || [0, 0];

  // Auto-open popup when selected
  useEffect(() => {
    if (selected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [selected]);

  if (!lat || !lng) return null;

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={makeIcon(store.isOpen, selected)}
      eventHandlers={{ click: onClick }}
    >
      {children && <Popup>{children}</Popup>}
    </Marker>
  );
}
