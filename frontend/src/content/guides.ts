export interface Guide {
  slug:string; title:string; description:string; author:{name:string;bio:string}; reviewer:{name:string;bio:string};
  publishedAt:string; updatedAt:string; image:{url:string;alt:string};
  sections:{heading:string;body:string}[]; productSlugs:string[]; sources:{title:string;url:string}[];
}
// Publish only reviewed articles with real contributors and original licensed photos.
// Editorial briefs are in docs/SEO-OPERATIONS.md; they are not public articles.
export const guides: Guide[] = [];
