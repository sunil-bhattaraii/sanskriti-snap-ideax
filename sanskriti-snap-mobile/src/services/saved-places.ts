import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedPlace = {
    id: string;
    name: string;
    location: string;
    distance: string;
    image: string;
    latitude: number;
    longitude: number;
    savedAt: number;
};

const SAVED_PLACES_KEY = '@sanskriti_saved_places_v1';

export async function readSavedPlaces(): Promise<SavedPlace[]> {
    const raw = await AsyncStorage.getItem(SAVED_PLACES_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
}

export async function savePlace(place: Omit<SavedPlace, 'savedAt'>) {
    const places = await readSavedPlaces();
    const next = [
        { ...place, savedAt: Date.now() },
        ...places.filter((item) => item.id !== place.id),
    ];
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
}

export async function removeSavedPlace(id: string) {
    const places = await readSavedPlaces();
    await AsyncStorage.setItem(
        SAVED_PLACES_KEY,
        JSON.stringify(places.filter((place) => place.id !== id)),
    );
}

export async function isPlaceSaved(id: string) {
    return (await readSavedPlaces()).some((place) => place.id === id);
}