# Visual Comparison: Before vs After Fix

## The Problem Code (BEFORE)

```typescript
// services/apiKeys.ts (BROKEN - lines 29-52)

const LOCAL_STORAGE_KEYS = ['alkemy_gemini_api_key', 'geminiApiKey'];
const GEMINI_STORAGE_EVENT = 'alkemy:gemini-key-changed';

// Initialize cache with env key, will be overridden by localStorage on first getGeminiApiKey() call
let cachedGeminiKey = ENV_GEMINI_KEY;

// Eagerly load from localStorage on module initialization to prevent re-prompting
const initializeCache = (): string => {  // ❌ PROBLEM: const arrow function
  if (ENV_GEMINI_KEY) {
    return ENV_GEMINI_KEY;
  }
  if (typeof window !== 'undefined') {
    for (const key of LOCAL_STORAGE_KEYS) {
      const value = toTrimmed(window.localStorage.getItem(key));
      if (value) {
        return value;
      }
    }
  }
  return '';
};

// Initialize cache immediately to prevent API key prompt on every load
cachedGeminiKey = initializeCache();  // ❌ PROBLEM: Called immediately at module level
```

### What Went Wrong

In production builds with minification:
1. `const initializeCache = ...` becomes `const Ve = ...` (Terser minification)
2. Module-level code tries to execute `cachedGeminiKey = Ve()`
3. But `Ve` hasn't been initialized yet (const variables aren't hoisted)
4. Result: `ReferenceError: Cannot access 'Ve' before initialization`

---

## The Fixed Code (AFTER)

```typescript
// services/apiKeys.ts (FIXED - lines 29-52)

const LOCAL_STORAGE_KEYS = ['alkemy_gemini_api_key', 'geminiApiKey'];
const GEMINI_STORAGE_EVENT = 'alkemy:gemini-key-changed';

// Eagerly load from localStorage on module initialization to prevent re-prompting
// IMPORTANT: Using function declaration (not const arrow function) to ensure proper hoisting
// This prevents TDZ (Temporal Dead Zone) errors in minified production bundles
function initializeCache(): string {  // ✅ SOLUTION: function declaration (hoisted)
  if (ENV_GEMINI_KEY) {
    return ENV_GEMINI_KEY;
  }
  if (typeof window !== 'undefined') {
    for (const key of LOCAL_STORAGE_KEYS) {
      const value = toTrimmed(window.localStorage.getItem(key));
      if (value) {
        return value;
      }
    }
  }
  return '';
}

// Initialize cache immediately to prevent API key prompt on every load
// IMPORTANT: Must be declared AFTER initializeCache function to avoid initialization errors
let cachedGeminiKey = initializeCache();  // ✅ SOLUTION: Now safe, function is hoisted
```

### Why This Works

In production builds with minification:
1. `function initializeCache() { ... }` becomes `function Ve() { ... }` (Terser minification)
2. Function declarations ARE hoisted to the top of the scope
3. Module-level code can safely execute `cachedGeminiKey = Ve()`
4. Result: No error, initialization succeeds

---

## Key Differences

| Aspect | BEFORE (Broken) | AFTER (Fixed) |
|--------|-----------------|---------------|
| Function type | `const` arrow function | `function` declaration |
| Hoisting | NOT hoisted | Fully hoisted |
| Execution timing | Before declaration ready | After hoisting complete |
| Production build | CRASHES with TDZ error | Works perfectly |
| Development build | Works (misleading!) | Works |

## JavaScript Hoisting Behavior

### const/let (NOT hoisted)
```javascript
console.log(myVar);  // ❌ ReferenceError: Cannot access 'myVar' before initialization
const myVar = () => {};
```

### function declarations (ARE hoisted)
```javascript
console.log(myFunc);  // ✅ Works! Function is hoisted
function myFunc() {}
```

This is a fundamental JavaScript behavior that becomes critical in module-level initialization code.

---

## Build Output Comparison

### BEFORE (Crashed)
```
ai-services-BVO2cG99.js:166 Uncaught ReferenceError: Cannot access 'Ve' before initialization
    at new <anonymous> (ai-services-BVO2cG99.js:166:2347)
```

### AFTER (Success)
```bash
✓ 2578 modules transformed.
✓ built in 14.73s

dist/assets/ai-services-CT3psk5U.js    347.71 kB │ gzip:  87.11 kB
```

---

**Lesson**: Always use `function` declarations (not `const` arrow functions) for initialization code that runs at module level.

