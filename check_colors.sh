#!/bin/bash
grep -lR "colors\." src | while read file; do
  if ! grep -q "useTheme" "$file" && ! grep -q "const colors" "$file" && ! grep -q "let colors" "$file" && ! grep -q "var colors" "$file" && ! grep -q "import.*colors" "$file"; then
    echo "Potential culprit: $file"
    grep -H "colors\." "$file"
  fi
done
