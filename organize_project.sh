#!/bin/bash

# Create src directories
mkdir -p src/components
mkdir -p src/services
mkdir -p src/tabs
mkdir -p src/hooks
mkdir -p src/contexts
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/constants
mkdir -p src/theme
mkdir -p src/data
mkdir -p src/pages
mkdir -p src/styles
mkdir -p src/lib
mkdir -p src/api

# Cleanup duplicates/unused in src before move
# We decided root components/SkeletonLoader.tsx is better, so delete src/ one
rm -f src/components/SkeletonLoader.tsx
# We decided src/services/hunyuanWorldService.ts should be preserved, but bflService.ts.disabled deleted
rm -f src/services/bflService.ts.disabled
# Move hunyuanWorldService.ts to root services first to consolidate (it will be moved back to src/services with the rest)
if [ -f src/services/hunyuanWorldService.ts ]; then
    mv src/services/hunyuanWorldService.ts services/
fi

# Move directories contents to src
# Use rsync to merge directories or mv for simple moves
# We use cp -r then rm to be safer than mv for merging
cp -r components/* src/components/ 2>/dev/null && rm -rf components
cp -r services/* src/services/ 2>/dev/null && rm -rf services
cp -r tabs/* src/tabs/ 2>/dev/null && rm -rf tabs
cp -r hooks/* src/hooks/ 2>/dev/null && rm -rf hooks
cp -r contexts/* src/contexts/ 2>/dev/null && rm -rf contexts
# types is tricky because of types.ts file and types/ dir
cp -r types/* src/types/ 2>/dev/null && rm -rf types
cp -r utils/* src/utils/ 2>/dev/null && rm -rf utils
cp -r constants/* src/constants/ 2>/dev/null && rm -rf constants
cp -r theme/* src/theme/ 2>/dev/null && rm -rf theme
cp -r data/* src/data/ 2>/dev/null && rm -rf data
cp -r pages/* src/pages/ 2>/dev/null && rm -rf pages
cp -r styles/* src/styles/ 2>/dev/null && rm -rf styles
cp -r lib/* src/lib/ 2>/dev/null && rm -rf lib

# Move root files to src
mv App.tsx src/
mv App.optimized.tsx src/
mv index.tsx src/
mv index.css src/
mv types.ts src/
mv check_gh.sh src/ 2>/dev/null # If it's a source script

# Cleanup root junk
rm -f *.backup
rm -f *.backup-*
rm -f *.bugfix_backup
rm -f *.log
rm -f test-*.js
rm -f test-*.ts
rm -f test-*.html

# Update index.html
sed -i 's|src="/index.tsx"|src="/src/index.tsx"|g' index.html

echo "Reorganization complete. Please manually update vite.config.ts and tsconfig.json."
