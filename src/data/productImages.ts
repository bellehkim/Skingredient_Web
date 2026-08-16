/**
 * product_id -> local demo photo path (see public/product-images/).
 *
 * Demo-only: these are real brand product photos, committed for demo
 * presentation purposes. buildProductsFromCatalog() only sets
 * Product.imageUrl when the catalog id has an entry here, and every
 * `<img>` using it falls back to the existing placeholder icon on error,
 * so a missing/renamed file still degrades gracefully.
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  "1": "/product-images/1-cerave-hydrating-facial-cleanser.jpg",
  "2": "/product-images/2-la-roche-posay-toleriane-purifying-foaming-cleanser.jpg",
  "3": "/product-images/3-the-ordinary-salicylic-acid-2-cleanser.png",
  "4": "/product-images/4-cerave-moisturizing-cream.jpg",
  "5": "/product-images/5-iunik-centella-calming-gel-cream.jpg",
  "6": "/product-images/6-dr-jart-cicapair-cream.jpg",
  "7": "/product-images/7-eltamd-uv-clear-spf46.png",
  "8": "/product-images/8-la-roche-posay-anthelios-melt-in-milk-spf60.jpg",
  "9": "/product-images/9-biore-uv-aqua-rich-spf50.png",
  "10": "/product-images/10-the-ordinary-niacinamide-10-zinc-1.png",
  "11": "/product-images/11-the-ordinary-hyaluronic-acid-2-b5.png",
  "12": "/product-images/12-skinceuticals-ce-ferulic.jpg",
  "13": "/product-images/13-differin-adapalene-gel.jpg",
  "14": "/product-images/14-the-ordinary-aha-30-bha-2-peeling-solution.png",
  "15": "/product-images/15-la-roche-posay-effaclar-duo-benzoyl-peroxide.jpg",
  "16": "/product-images/16-paulas-choice-2-bha-liquid.png",
  "17": "/product-images/17-pyunkang-yul-essence-toner.jpg",
  "18": "/product-images/18-skinfix-barrier-nutrient-toning-essence.png",
  "19": "/product-images/19-cosrx-advanced-snail-92-all-in-one-cream.jpg",
};
