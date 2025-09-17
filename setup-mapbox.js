#!/usr/bin/env node

/**
 * Quick Mapbox Setup Script
 * This script helps you set up your Mapbox access token
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  Mapbox Setup Helper\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file found');
  
  // Read current .env content
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('your_mapbox_access_token_here')) {
    console.log('⚠️  Mapbox token not configured yet');
    console.log('\n📋 To get your Mapbox token:');
    console.log('1. Go to https://account.mapbox.com/');
    console.log('2. Sign up or log in');
    console.log('3. Copy your access token');
    console.log('4. Run: node setup-mapbox.js <your-token>');
    console.log('\nExample: node setup-mapbox.js pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...');
  } else {
    console.log('✅ Mapbox token appears to be configured');
    console.log('Current token:', envContent.match(/REACT_APP_MAPBOX_ACCESS_TOKEN=(.+)/)?.[1]?.substring(0, 20) + '...');
  }
} else {
  console.log('❌ .env file not found');
  console.log('Creating .env file...');
  
  const envContent = `# Mapbox Configuration
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# To get your Mapbox access token:
# 1. Go to https://account.mapbox.com/
# 2. Sign up or log in
# 3. Go to "Access tokens" section
# 4. Copy your default public token or create a new one
# 5. Replace 'your_mapbox_access_token_here' with your actual token
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
}

// If token is provided as argument
const token = process.argv[2];
if (token) {
  if (token.startsWith('pk.')) {
    console.log('\n🔧 Updating .env file with your token...');
    
    const updatedContent = `# Mapbox Configuration
REACT_APP_MAPBOX_ACCESS_TOKEN=${token}

# To get your Mapbox access token:
# 1. Go to https://account.mapbox.com/
# 2. Sign up or log in
# 3. Go to "Access tokens" section
# 4. Copy your default public token or create a new one
# 5. Replace 'your_mapbox_access_token_here' with your actual token
`;

    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ Token updated successfully!');
    console.log('🔄 Please restart your development server (npm start)');
  } else {
    console.log('❌ Invalid token format. Mapbox tokens should start with "pk."');
  }
}