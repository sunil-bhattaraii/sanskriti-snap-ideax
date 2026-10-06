import { distanceBetweenCoordinates } from '../geo';
import { formatDistance, getDistanceFromLatLonInKm } from '../location';

const PATAN_DURBAR = { latitude: 27.6726, longitude: 85.3253 };
const KRISHNA_MANDIR = { latitude: 27.6767, longitude: 85.3256 };
const KATHMANDU = { latitude: 27.7172, longitude: 85.324 };

describe('distanceBetweenCoordinates', () => {
  it('returns 0 for identical points', () => {
    expect(distanceBetweenCoordinates(PATAN_DURBAR, PATAN_DURBAR)).toBe(0);
  });

  it('is symmetric', () => {
    const a = distanceBetweenCoordinates(PATAN_DURBAR, KATHMANDU);
    const b = distanceBetweenCoordinates(KATHMANDU, PATAN_DURBAR);
    expect(a).toBeCloseTo(b, 6);
  });

  it('measures ~111.2 km per degree of latitude', () => {
    const d = distanceBetweenCoordinates(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('agrees with getDistanceFromLatLonInKm within 0.5%', () => {
    const meters = distanceBetweenCoordinates(PATAN_DURBAR, KATHMANDU);
    const km = getDistanceFromLatLonInKm(
      PATAN_DURBAR.latitude,
      PATAN_DURBAR.longitude,
      KATHMANDU.latitude,
      KATHMANDU.longitude,
    );
    expect(meters / 1000).toBeCloseTo(km, 0);
    expect(Math.abs(meters / 1000 - km) / km).toBeLessThan(0.005);
  });

  it('is finite for antipodal points', () => {
    const d = distanceBetweenCoordinates(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 180 },
    );
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(20_000_000);
  });

  it('handles crossing the antimeridian without wrapping the long way', () => {
    const d = distanceBetweenCoordinates(
      { latitude: 0, longitude: 179.9 },
      { latitude: 0, longitude: -179.9 },
    );
    expect(d).toBeLessThan(30_000);
  });

  it('scales monotonically with separation', () => {
    const near = distanceBetweenCoordinates(
      { latitude: 0, longitude: 0 },
      { latitude: 0.01, longitude: 0 },
    );
    const far = distanceBetweenCoordinates(
      { latitude: 0, longitude: 0 },
      { latitude: 0.02, longitude: 0 },
    );
    expect(far).toBeCloseTo(near * 2, 3);
  });

  it('puts Krishna Mandir within 1 km of Patan Durbar Square', () => {
    const d = distanceBetweenCoordinates(PATAN_DURBAR, KRISHNA_MANDIR);
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(1_000);
  });
});

describe('getDistanceFromLatLonInKm', () => {
  it('returns 0 for identical points', () => {
    expect(getDistanceFromLatLonInKm(27.67, 85.32, 27.67, 85.32)).toBe(0);
  });

  it('returns kilometres, not metres', () => {
    const km = getDistanceFromLatLonInKm(0, 0, 1, 0);
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });

  it('never returns NaN', () => {
    expect(
      Number.isFinite(getDistanceFromLatLonInKm(-90, -180, 90, 180)),
    ).toBe(true);
  });
});

describe('formatDistance', () => {
  it('renders sub-kilometre distances in whole metres', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(0.001)).toBe('1m');
    expect(formatDistance(0.124)).toBe('124m');
    expect(formatDistance(0.999)).toBe('999m');
  });

  it('renders one kilometre and above with one decimal', () => {
    expect(formatDistance(1)).toBe('1.0km');
    expect(formatDistance(1.05)).toBe('1.1km');
    expect(formatDistance(12.34)).toBe('12.3km');
    expect(formatDistance(123.456)).toBe('123.5km');
  });

  it('rounds metres rather than truncating', () => {
    expect(formatDistance(0.1249)).toBe('125m');
  });

  it('round-trips the display form across the 1 km boundary', () => {
    expect(formatDistance(0.999)).toBe('999m');
    expect(formatDistance(1.0)).toBe('1.0km');
  });
});
