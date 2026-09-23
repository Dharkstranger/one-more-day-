import { registerRootComponent } from 'expo';

// Background tasks must be defined at startup, before any UI renders.
import './src/services/location/geofence';

import App from './App';

registerRootComponent(App);
