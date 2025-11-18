# GenerateTab Fixes - Test Checklist

## Pre-Deployment Testing

### 1. Layout Tests
- [ ] Open Generate tab in browser
- [ ] Check that page fits within viewport (no unexpected overflow)
- [ ] Verify header shows properly with title and buttons
- [ ] Confirm left panel (controls) is visible and scrollable
- [ ] Confirm right panel (gallery) is visible and scrollable
- [ ] Check that both panels maintain proper proportions

### 2. Horizontal Scroll Tests
- [ ] Generate 3-4 images to populate gallery
- [ ] Verify gallery scrolls horizontally WITHIN its container
- [ ] Verify NO horizontal scroll appears at page level
- [ ] Resize browser window - confirm no horizontal page scroll at any width
- [ ] Test on different screen sizes (1920px, 1440px, 1024px, 768px, 375px)

### 3. Zoom/Viewport Tests
- [ ] Load page - confirm no unexpected zoom
- [ ] Generate images - confirm layout stays stable
- [ ] Open fullscreen viewer - confirm proper scaling
- [ ] Resize window - confirm responsive breakpoints work smoothly
- [ ] Check on mobile device - confirm proper mobile viewport

### 4. Refine Button Functionality Tests

#### Test A: Refine from Gallery
1. [ ] Generate an image
2. [ ] Click the image in gallery to select it
3. [ ] Verify "Advanced Tools" section appears in left panel
4. [ ] Enter refinement prompt
5. [ ] Click "Apply Refinement" button
6. [ ] Verify refinement works

#### Test B: Refine from Fullscreen (THE KEY FIX)
1. [ ] Generate an image
2. [ ] Click image to open fullscreen view
3. [ ] Click "Refine Image" button in fullscreen
4. [ ] **VERIFY**: Fullscreen closes AND left panel scrolls to "Advanced Tools"
5. [ ] **VERIFY**: Scroll position shows the refinement text area
6. [ ] Enter refinement prompt
7. [ ] Click "Apply Refinement"
8. [ ] Verify refinement works

### 5. Responsive Design Tests

#### Desktop (>640px)
- [ ] Header shows full button text ("Export All", "Clear")
- [ ] Padding is `p-6`
- [ ] Left panel is fixed width (384px)
- [ ] Gallery cards are 320px wide
- [ ] Fullscreen buttons show full text
- [ ] Icons are larger (w-5 h-5)

#### Mobile (<640px)
- [ ] Header shows icon-only buttons
- [ ] Padding reduces to `p-4`
- [ ] Left panel is full width
- [ ] Gallery cards are 320px wide (scroll horizontal)
- [ ] Fullscreen buttons show icon-only
- [ ] Icons are smaller (w-4 h-4)

### 6. Text Handling Tests
- [ ] Enter very long prompt (200+ characters)
- [ ] Verify text wraps with `break-words`
- [ ] Check title truncates properly with ellipsis
- [ ] Verify model names don't overflow
- [ ] Check fullscreen prompt displays full text with wrapping

### 7. Advanced Tools Section Tests
- [ ] Select an image
- [ ] Verify "Advanced Tools" section appears
- [ ] Verify section has proper ref attached
- [ ] Test manual scroll to section
- [ ] Test programmatic scroll (via Refine button)

### 8. Gallery Tests
- [ ] Generate 6 images
- [ ] Verify horizontal scroll works in gallery container
- [ ] Check cards don't compress (flexShrink: 0)
- [ ] Test selection highlighting
- [ ] Test hover effects
- [ ] Test download buttons
- [ ] Test delete buttons

### 9. Fullscreen Viewer Tests
- [ ] Open image in fullscreen
- [ ] Test keyboard shortcuts (ESC, Arrow Left, Arrow Right)
- [ ] Test navigation arrows
- [ ] Test all action buttons:
  - [ ] Download
  - [ ] Refine (scrolls to tools)
  - [ ] Upscale
  - [ ] Delete
- [ ] Test video playback in fullscreen
- [ ] Test click-outside to close

### 10. Build & Performance Tests
- [ ] Run `npm run build`
- [ ] Verify build succeeds with 0 errors
- [ ] Check bundle size is reasonable (< 150KB gzipped)
- [ ] Test production build with `npm run preview`
- [ ] Verify no console errors
- [ ] Check for memory leaks (generate 10+ images)

## Expected Results

### Before Fixes
- ❌ Page had horizontal scroll
- ❌ Layout didn't fit properly
- ❌ Refine button didn't scroll to tools
- ❌ Components overflowed containers
- ❌ Not responsive on mobile

### After Fixes
- ✅ No horizontal scroll at page level
- ✅ Layout fits perfectly in viewport
- ✅ Refine button scrolls to Advanced Tools section
- ✅ All content properly contained
- ✅ Fully responsive on all screen sizes

## Critical Test (MUST PASS)

**The Refine Button Test:**
1. Generate an image
2. Click image to open fullscreen
3. Click "Refine Image" button
4. **Expected**: Fullscreen closes, left panel scrolls to show "Advanced Tools" section
5. **If this fails**: The main bug is not fixed

## Regression Tests

Ensure existing functionality still works:
- [ ] Image generation with FLUX models
- [ ] Video generation with Veo 3.1
- [ ] Text-to-video (no reference image)
- [ ] Image-to-video (with reference image)
- [ ] Model selection
- [ ] Aspect ratio selection
- [ ] Generation count selection
- [ ] File upload for reference images
- [ ] Progress tracking during generation
- [ ] Gallery card interactions
- [ ] Export All functionality
- [ ] Clear All functionality
- [ ] Upscale functionality

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance Benchmarks

- [ ] Page load time < 2 seconds
- [ ] Image generation < 30 seconds
- [ ] Video generation < 60 seconds
- [ ] Smooth scrolling in gallery
- [ ] No layout shift during generation
- [ ] Responsive resize without lag

## Sign-Off

- [ ] All tests passed
- [ ] No regressions found
- [ ] Performance is acceptable
- [ ] Ready for production deployment

Tested by: _________________
Date: _________________
Environment: _________________
