#!/bin/bash
grep -r "\bcolors\b" src | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  content=$(echo "$line" | cut -d: -f2-)
  
  # Skip if file is valid
  if grep -q "useTheme" "$file" || grep -q "const colors" "$file" || grep -q "let colors" "$file" || grep -q "var colors" "$file" || grep -q "import.*colors" "$file"; then
    continue
  fi

  # Skip comments
  if [[ "$content" =~ ^[[:space:]]*// ]]; then continue; fi
  
  # Skip transition-colors
  if [[ "$content" =~ transition-colors ]]; then continue; fi
  
  # Skip object keys like colors: { ... }
  if [[ "$content" =~ colors: ]]; then continue; fi

  echo "Potential culprit in $file: $content"
done
