export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'tif',
  'tiff',
] as const;

const IMAGE_EXTENSION_SET = new Set(
  IMAGE_EXTENSIONS.map((extension) => extension.toLowerCase()),
);

const normalizeExtension = (value: string) =>
  value.includes('.')
    ? value.split('.').at(-1)?.toLowerCase()
    : value.toLowerCase();

export const hasImageExtension = (value?: string | null) => {
  if (!value) {
    return false;
  }

  const normalizedExtension = normalizeExtension(value);

  return normalizedExtension
    ? IMAGE_EXTENSION_SET.has(normalizedExtension)
    : false;
};
