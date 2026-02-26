#!/usr/bin/env node

/**
 * Google OAuth Configuration Tester
 * Run this to verify your Google OAuth setup
 * 
 * Usage: node test-google-oauth.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from backend .env
const envPath = path.join(__dirname, 'project', 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Handle both \n and \r\n line endings
  const lines = envContent.split(/\r?\n/);
  lines.forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('\n🔍 Testing Google OAuth Configuration...\n');

let hasErrors = false;

// Test 1: Check if dotenv is working
console.log('✓ Step 1: Checking environment variables...');
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID_HERE')) {
  console.log('  ❌ GOOGLE_CLIENT_ID not configured in backend .env');
  console.log('     Add: GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
  hasErrors = true;
} else {
  console.log(`  ✅ GOOGLE_CLIENT_ID found: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
}

if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET.includes('YOUR_CLIENT_SECRET_HERE')) {
  console.log('  ❌ GOOGLE_CLIENT_SECRET not configured in backend .env');
  console.log('     Add: GOOGLE_CLIENT_SECRET=your-client-secret');
  hasErrors = true;
} else {
  console.log(`  ✅ GOOGLE_CLIENT_SECRET found: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);
}

// Test 2: Check Client ID format
console.log('\n✓ Step 2: Validating Client ID format...');
if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID_HERE')) {
  if (process.env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
    console.log('  ✅ Client ID format looks correct');
  } else {
    console.log('  ⚠️  Client ID should end with .apps.googleusercontent.com');
    console.log('     Current:', process.env.GOOGLE_CLIENT_ID);
    hasErrors = true;
  }
}

// Test 3: Check if google-auth-library is installed
console.log('\n✓ Step 3: Checking dependencies...');
const backendNodeModules = path.join(__dirname, 'project', 'backend', 'node_modules');
const googleAuthLibPath = path.join(backendNodeModules, 'google-auth-library');
if (fs.existsSync(googleAuthLibPath)) {
  console.log('  ✅ google-auth-library is installed');
} else {
  console.log('  ❌ google-auth-library not installed');
  console.log('     Run: cd project/backend && npm install');
  hasErrors = true;
}

// Test 4: Check if backend file exists
console.log('\n✓ Step 4: Checking backend files...');

const googleAuthFilePath = path.join(__dirname, 'project', 'backend', 'googleAuth.js');
if (fs.existsSync(googleAuthFilePath)) {
  console.log('  ✅ googleAuth.js exists');
} else {
  console.log('  ❌ googleAuth.js not found');
  hasErrors = true;
}

// Test 5: Check frontend .env
console.log('\n✓ Step 5: Checking frontend configuration...');
const frontendEnvPath = path.join(__dirname, 'project', 'frontend', '.env');
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  if (frontendEnv.includes('VITE_GOOGLE_CLIENT_ID')) {
    console.log('  ✅ VITE_GOOGLE_CLIENT_ID found in frontend .env');
    
    // Extract the value
    const match = frontendEnv.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
    if (match && match[1]) {
      const frontendClientId = match[1].trim();
      if (frontendClientId.includes('YOUR_CLIENT_ID_HERE')) {
        console.log('  ⚠️  Frontend Client ID not configured yet');
        hasErrors = true;
      } else if (frontendClientId === process.env.GOOGLE_CLIENT_ID) {
        console.log('  ✅ Frontend and backend Client IDs match');
      } else {
        console.log('  ⚠️  Frontend and backend Client IDs are different');
        console.log('     Backend:', process.env.GOOGLE_CLIENT_ID);
        console.log('     Frontend:', frontendClientId);
        hasErrors = true;
      }
    }
  } else {
    console.log('  ❌ VITE_GOOGLE_CLIENT_ID not found in frontend .env');
    console.log('     Add: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Frontend .env file not found');
  console.log('     Create: project/frontend/.env');
  hasErrors = true;
}

// Test 6: Check React OAuth Google package
console.log('\n✓ Step 6: Checking frontend dependencies...');
const frontendPackageJson = path.join(__dirname, 'project', 'frontend', 'package.json');
if (fs.existsSync(frontendPackageJson)) {
  const packageContent = fs.readFileSync(frontendPackageJson, 'utf8');
  if (packageContent.includes('@react-oauth/google')) {
    console.log('  ✅ @react-oauth/google is installed');
  } else {
    console.log('  ❌ @react-oauth/google not installed');
    console.log('     Run: cd project/frontend && npm install @react-oauth/google');
    hasErrors = true;
  }
} else {
  console.log('  ⚠️  Frontend package.json not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Configuration has issues - please fix the errors above');
  console.log('\n📚 Next steps:');
  console.log('   1. Follow GOOGLE_OAUTH_CHECKLIST.md to configure Google Console');
  console.log('   2. Copy your Client ID and Client Secret to .env files');
  console.log('   3. Run this test again: node test-google-oauth.js');
} else {
  console.log('✅ All checks passed! Your Google OAuth is configured correctly');
  console.log('\n🚀 Next steps:');
  console.log('   1. Make sure both servers are running');
  console.log('   2. Go to http://localhost:5173/login');
  console.log('   3. Click "Sign in with Google"');
  console.log('   4. Select your Gmail account (must be added as test user)');
  console.log('\n📚 If you have issues, see GOOGLE_OAUTH_QUICK_START.md');
}
console.log('='.repeat(50) + '\n');

process.exit(hasErrors ? 1 : 0);
