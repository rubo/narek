// Maps the reader's font-size preference to the utility that sets --font-scale
// on a book article. Full literals so Tailwind's scanner keeps the utilities;
// an interpolated `text-scale-${fontScale}` would be purged.
export const scaleClasses = {
  sm: 'text-scale-sm',
  base: 'text-scale-base',
  lg: 'text-scale-lg',
};
