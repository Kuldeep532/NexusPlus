import { Stack } from 'expo-router';
import { RadioPlayerProvider } from '@/features/online-radio/RadioPlayerContext';

export default function OnlineRadioLayout() {
  return <RadioPlayerProvider><Stack screenOptions={{ headerBackTitle: 'Back' }}><Stack.Screen name="index" options={{ title: 'Online Radio' }} /><Stack.Screen name="stations" options={{ title: 'Station Browser' }} /><Stack.Screen name="favorites" options={{ title: 'Favorites' }} /><Stack.Screen name="now-playing" options={{ title: 'Now Playing' }} /></Stack></RadioPlayerProvider>;
}
