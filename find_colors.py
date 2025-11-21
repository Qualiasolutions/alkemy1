import os
import re

def find_colors_usage(root_dir):
    # Regex to find 'colors' as a standalone word
    # We want to avoid:
    # - const colors = ... (declaration)
    # - { colors } = ... (destructuring)
    # - colors: ... (property key)
    # - "colors" or 'colors' (string)
    # - .colors (property access - although this might be relevant if the object is missing, the error is 'colors is not defined')
    # - // ... colors ... (comment)
    
    # The error "colors is not defined" implies it's being used as a variable, e.g. `console.log(colors)` or `colors.primary` where colors itself is the variable.
    
    # Simple regex to find 'colors'
    regex = re.compile(r'\bcolors\b')
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if not file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for i, line in enumerate(lines):
                    # Skip comments
                    if '//' in line:
                        line = line.split('//')[0]
                    
                    matches = regex.finditer(line)
                    for match in matches:
                        # Check context
                        start = match.start()
                        end = match.end()
                        
                        # Check if it's a property key (followed by :)
                        rest_of_line = line[end:].strip()
                        if rest_of_line.startswith(':'):
                            continue
                            
                        # Check if it's a string
                        # This is a naive check, might fail on complex strings
                        quote_count = line[:start].count('"') + line[:start].count("'")
                        if quote_count % 2 != 0:
                            continue
                            
                        # Check if it's a declaration
                        pre_context = line[:start].strip()
                        if pre_context.endswith('const') or pre_context.endswith('let') or pre_context.endswith('var'):
                            continue
                        if pre_context.endswith('{') or pre_context.endswith(','):
                            # Likely destructuring or object literal
                            # But wait, if it's { colors } = useTheme(), that's a declaration.
                            # If it's { color: colors.red }, that's usage.
                            pass
                            
                        # Check if it's a property access (preceded by .)
                        if pre_context.endswith('.'):
                            continue
                            
                        print(f"{filepath}:{i+1}: {line.strip()}")
            except Exception as e:
                print(f"Error reading {filepath}: {e}")

if __name__ == "__main__":
    find_colors_usage('./src')
