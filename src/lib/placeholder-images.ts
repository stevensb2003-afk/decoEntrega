import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Filter out user avatars, as they are no longer used.
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages.filter(
    p => !p.id.startsWith('user')
);
