// รวมข้อมูลจุดจอดรถ (lib/parking-data.js) กับพิกัด (lib/parking-coords.json)
// พิกัดสร้างด้วย:  node scripts/geocode-parking.mjs  (หรือแก้ไฟล์ json ด้วยมือก็ได้)
import { PARKING_GROUPS, PARKING_SPOTS_RAW } from './parking-data';
import coords from './parking-coords.json';

export { PARKING_GROUPS };

export const PARKING_SPOTS = PARKING_SPOTS_RAW.map((s) => ({
    ...s,
    latitude: coords[s.id]?.lat ?? s.latitude,
    longitude: coords[s.id]?.lng ?? s.longitude,
}));
