#!/bin/bash
# Builder Management Workspace Setup Script

echo "Initializing Workspace environment..."

# Copy environment variables
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env file created from .env.example"
else
  echo ".env file already exists"
fi

# Install dependencies
pnpm install

# Generate prisma client
pnpm prisma:generate

echo "Setup completed successfully! Run 'docker-compose up -d' then 'pnpm dev' to start."
