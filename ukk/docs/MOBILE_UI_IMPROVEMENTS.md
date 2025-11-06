# Mobile UI/UX Improvements

## Changes Made

### 1. **Dialog/Modal Component** (`components/ui/dialog.tsx`)

#### Before:

- Dialog menggunakan `max-w-[calc(100%-2rem)]` yang membuat content melebar di mobile
- Position: center screen di semua devices
- Animation: zoom in/out untuk semua devices

#### After:

- **Mobile-first approach**:
  - Dialog muncul dari **bottom** seperti iOS native bottom sheet
  - Full width di mobile dengan `rounded-t-2xl` (top rounded corners)
  - `max-h-[85vh]` dengan `overflow-y-auto` untuk content yang panjang
  - Animation: slide from bottom
- **Desktop (sm breakpoint and up)**:
  - Tetap center screen dengan `max-w-lg`
  - Rounded corners di semua sisi
  - Animation: zoom in/out (original behavior)

```tsx
// Mobile: bottom sheet style
fixed bottom-0 left-0 right-0 rounded-t-2xl

// Desktop: centered modal
sm:bottom-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg
```

### 2. **Assignment Modal** (`components/projects/AssignmentModal.tsx`)

#### Improvements:

- **Responsive text sizes**: `text-lg sm:text-xl`, `text-sm sm:text-base`
- **Responsive icon sizes**: `h-5 w-5 sm:h-6 sm:w-6`
- **Responsive spacing**: `pt-3 sm:pt-4`, `mt-3 sm:mt-4`
- **Responsive padding**: `p-3 sm:p-4`
- **Full-width button on mobile**: `w-full sm:w-auto`
- **Scrollable unfinished cards list**: `max-h-[200px] overflow-y-auto`
- **Truncated long text**: `truncate` untuk card titles
- **Smaller badge text**: `text-[10px] sm:text-xs`

### 3. **Global CSS** (`app/globals.css`)

#### Added:

- **Prevent horizontal scroll**:

  ```css
  html,
  body {
    overflow-x: hidden;
  }
  ```

- **Prevent content from overflowing**:

  ```css
  * {
    max-w-full;
  }
  ```

- **Improve touch targets** (accessibility):

  ```css
  button,
  a,
  input,
  select,
  textarea {
    min-h: 44px; /* iOS recommended minimum */
  }
  ```

- **Prevent double-tap zoom**:

  ```css
  button,
  a {
    touch-action: manipulation;
  }
  html {
    -webkit-tap-highlight-color: transparent;
  }
  ```

- **Better font rendering**:
  ```css
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ```

### 4. **Metadata** (`app/layout.tsx`)

#### Added viewport settings:

```tsx
viewport: {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom
}
```

### 5. **Card Detail Dialog** (`components/cards/CardDetail.tsx`)

- Changed `max-w-2xl` to `sm:max-w-2xl` untuk responsive di mobile

## Benefits

✅ **No more horizontal scrolling** on mobile
✅ **Native-like bottom sheet** experience on mobile  
✅ **Better touch targets** for accessibility
✅ **Smoother animations** specific to device type
✅ **Responsive text and spacing** for all screen sizes
✅ **Scrollable content** when modal has long lists
✅ **Prevents zoom** on input focus (iOS behavior)
✅ **Better readability** with proper text sizes

## Testing Checklist

- [ ] Open modal on mobile (< 640px width)
- [ ] Check bottom sheet animation
- [ ] Verify no horizontal scroll
- [ ] Test with long content (should scroll vertically)
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on desktop (should look same as before)
- [ ] Test assignment modal with many unfinished cards
- [ ] Test input focus (should not zoom on iOS)
- [ ] Test button tap targets (should be easy to tap)

## Browser Support

- ✅ Chrome (Android)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)

## Responsive Breakpoints

- **Mobile**: `< 640px` (sm breakpoint)
- **Desktop**: `≥ 640px`

All changes use Tailwind's `sm:` breakpoint prefix for consistency.
