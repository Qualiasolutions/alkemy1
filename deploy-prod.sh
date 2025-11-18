#!/bin/bash
set -e

echo "🚀 Deploying to Vercel Production..."
vercel deploy --prod --yes

echo "✅ Deployment complete!"
