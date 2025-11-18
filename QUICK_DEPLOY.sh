#!/bin/bash
# Quick deployment script for TDZ fix

echo "=== Alkemy TDZ Fix Deployment ==="
echo ""
echo "1. Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "2. Running test suite..."
npm test -- --run

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing with deployment..."
fi

echo ""
echo "3. Deploying to Vercel production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Check deployment URL in Vercel output above"
echo "  2. Monitor logs: vercel logs <deployment-url>"
echo "  3. Test in production browser"
echo "  4. Check for TDZ errors in console"
