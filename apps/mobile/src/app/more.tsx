import { Redirect } from 'expo-router';

// The accepted profile control keeps its route; Settings now owns preferences.
export default function MoreRoute() { return <Redirect href="/settings" />; }
