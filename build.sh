#!/bin/bash

# Cloudflare Pages build script
echo "Starting build process..."

# Use npm (not bun) for consistency
echo "Installing dependencies with npm..."
npm ci

echo "Building the project..."
npm run build

echo "Build completed successfully!"
echo "Output directory: dist"