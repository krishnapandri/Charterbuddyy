#!/bin/bash

# Make the script exit on error
set -e

# Navigate to the root directory of the project
cd "$(dirname "$0")/.."

# Ensure dependencies are installed
echo "Checking for dependencies..."
if ! command -v node &> /dev/null; then
  echo "Node.js is required but not installed."
  exit 1
fi

# Run migration script
echo "Running database migration script..."
node --experimental-modules scripts/db-migration.js

echo "Migration completed!"