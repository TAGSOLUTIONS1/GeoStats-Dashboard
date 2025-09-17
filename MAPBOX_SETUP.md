# Mapbox Setup Instructions

## Getting Your Mapbox Access Token

1. **Sign up for Mapbox**:
   - Go to [https://account.mapbox.com/](https://account.mapbox.com/)
   - Create a new account or log in with existing credentials

2. **Get Your Access Token**:
   - Once logged in, navigate to the "Access tokens" section
   - You'll see your default public token, or you can create a new one
   - Copy the token (it will look like: `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...`)

3. **Update Your Environment File**:
   - Open the `.env` file in your project root
   - Replace `your_mapbox_access_token_here` with your actual token:
   ```
   REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...
   ```

4. **Restart Your Development Server**:
   - Stop your current development server (Ctrl+C)
   - Run `npm start` again to load the new environment variable

## Features Included

✅ **Interactive Map**: Full Mapbox GL JS integration  
✅ **Navigation Controls**: Zoom, pan, and rotate controls  
✅ **Geolocation**: Find user's current location  
✅ **Fullscreen Mode**: Toggle fullscreen view  
✅ **Scale Control**: Distance scale indicator  
✅ **Data Visualization**: Sample data points with markers and popups  
✅ **Custom Controls**: Additional zoom and feedback buttons  
✅ **Real-time Info**: Live coordinates and zoom level display  

## Map Styles Available

You can change the map style by modifying the `style` property in the Map component:
- `mapbox://styles/mapbox/streets-v12` (default)
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/satellite-streets-v12`

## Troubleshooting

- **Map not loading**: Check that your access token is correctly set in the `.env` file
- **Console errors**: Make sure you've restarted the development server after adding the token
- **Styling issues**: Ensure `mapbox-gl/dist/mapbox-gl.css` is imported (already included)

## Next Steps

- Add your own data sources and layers
- Customize markers and popups
- Implement search functionality
- Add more interactive features