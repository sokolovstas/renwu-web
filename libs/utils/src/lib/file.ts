export const imageExtensions: string[] = [
  'png',
  'jpeg',
  'jpg',
  'gif',
  'svg',
  'tiff',
  'bmp',
];
export function testImageExtension(filename: string): boolean {
  const extension = filename.split('.').pop().toLowerCase();
  return imageExtensions.indexOf(extension) > -1;
}
