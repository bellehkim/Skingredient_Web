// Auto-generated snapshot of the read-only Supabase reference data
// (product catalog + ingredient library) — see scripts intent below.
// Regenerate by re-running the same three PostgREST queries used in
// src/lib/data/catalog.ts / ingredientLibrary.ts against the real project
// and re-running this file's generation. Consumed only when
// isDemoModeActive() (src/lib/demoMode.ts) — Real Mode always reads live
// from Supabase and never imports this file's data, only its types.
import type { CatalogProduct } from "@/lib/data/catalog";
import type { IngredientLibraryEntry } from "@/lib/data/ingredientLibrary";

export const CATALOG_PRODUCTS_SNAPSHOT: CatalogProduct[] = [
  {
    "product_id": 1,
    "brand": "CeraVe",
    "product_name": "Hydrating Facial Cleanser",
    "category": "Cleanser",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Ceramide NP",
          "common_name": "Ceramides",
          "ingredient_functions": [
            {
              "functional_category": "ceramide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 2,
    "brand": "La Roche-Posay",
    "product_name": "Toleriane Purifying Foaming Cleanser",
    "category": "Cleanser",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Niacinamide",
          "common_name": "Niacinamide",
          "ingredient_functions": [
            {
              "functional_category": "niacinamide"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 3,
    "brand": "The Ordinary",
    "product_name": "Salicylic Acid 2% Cleanser",
    "category": "Cleanser",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Salicylic Acid",
          "common_name": "Salicylic Acid",
          "ingredient_functions": [
            {
              "functional_category": "salicylic_acid"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 4,
    "brand": "CeraVe",
    "product_name": "Moisturizing Cream",
    "category": "Moisturizer",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Ceramide NP",
          "common_name": "Ceramides",
          "ingredient_functions": [
            {
              "functional_category": "ceramide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Squalane",
          "common_name": "Squalane",
          "ingredient_functions": [
            {
              "functional_category": "squalane"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 5,
    "brand": "iUNIK",
    "product_name": "Centella Calming Gel Cream",
    "category": "Moisturizer",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Centella Asiatica Extract",
          "common_name": "Centella Asiatica",
          "ingredient_functions": [
            {
              "functional_category": "centella"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Beta-Glucan",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "beta_glucan"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 6,
    "brand": "Dr. Jart+",
    "product_name": "Cicapair Cream",
    "category": "Moisturizer",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Centella Asiatica Extract",
          "common_name": "Centella Asiatica",
          "ingredient_functions": [
            {
              "functional_category": "centella"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Niacinamide",
          "common_name": "Niacinamide",
          "ingredient_functions": [
            {
              "functional_category": "niacinamide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Allantoin",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "allantoin"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 7,
    "brand": "EltaMD",
    "product_name": "UV Clear SPF 46",
    "category": "Sunscreen",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Niacinamide",
          "common_name": "Niacinamide",
          "ingredient_functions": [
            {
              "functional_category": "niacinamide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Titanium Dioxide",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "uv_filter"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 8,
    "brand": "La Roche-Posay",
    "product_name": "Anthelios Melt-in Milk SPF 60",
    "category": "Sunscreen",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Titanium Dioxide",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "uv_filter"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Fragrance (Parfum)",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "fragrance"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 9,
    "brand": "Biore",
    "product_name": "UV Aqua Rich Watery Essence SPF 50",
    "category": "Sunscreen",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Titanium Dioxide",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "uv_filter"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Sodium Hyaluronate",
          "common_name": "Hyaluronic Acid",
          "ingredient_functions": [
            {
              "functional_category": "hyaluronic_acid"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 10,
    "brand": "The Ordinary",
    "product_name": "Niacinamide 10% + Zinc 1%",
    "category": "Serum",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Niacinamide",
          "common_name": "Niacinamide",
          "ingredient_functions": [
            {
              "functional_category": "niacinamide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Zinc PCA",
          "common_name": "Zinc PCA",
          "ingredient_functions": [
            {
              "functional_category": "zinc_pca"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 11,
    "brand": "The Ordinary",
    "product_name": "Hyaluronic Acid 2% + B5",
    "category": "Serum",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Sodium Hyaluronate",
          "common_name": "Hyaluronic Acid",
          "ingredient_functions": [
            {
              "functional_category": "hyaluronic_acid"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 12,
    "brand": "SkinCeuticals",
    "product_name": "C E Ferulic",
    "category": "Serum",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Ascorbic Acid",
          "common_name": "Vitamin C",
          "ingredient_functions": [
            {
              "functional_category": "vitamin_c"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Alcohol Denat.",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "alcohol_denat"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 13,
    "brand": "Differin",
    "product_name": "Adapalene Gel 0.1%",
    "category": "Treatment",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Adapalene",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "retinoid"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 14,
    "brand": "The Ordinary",
    "product_name": "AHA 30% + BHA 2% Peeling Solution",
    "category": "Treatment",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Glycolic Acid",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "glycolic_acid"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Salicylic Acid",
          "common_name": "Salicylic Acid",
          "ingredient_functions": [
            {
              "functional_category": "salicylic_acid"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 15,
    "brand": "La Roche-Posay",
    "product_name": "Effaclar Duo Benzoyl Peroxide Treatment",
    "category": "Treatment",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Benzoyl Peroxide",
          "common_name": "Benzoyl Peroxide",
          "ingredient_functions": [
            {
              "functional_category": "benzoyl_peroxide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Zinc PCA",
          "common_name": "Zinc PCA",
          "ingredient_functions": [
            {
              "functional_category": "zinc_pca"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 17,
    "brand": "Pyunkang Yul",
    "product_name": "Essence Toner",
    "category": "Toner/Essence",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Beta-Glucan",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "beta_glucan"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 18,
    "brand": "SkinFix",
    "product_name": "Barrier+ Nutrient Toning Essence",
    "category": "Toner/Essence",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Ceramide NP",
          "common_name": "Ceramides",
          "ingredient_functions": [
            {
              "functional_category": "ceramide"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Glycerin",
          "common_name": "Glycerin",
          "ingredient_functions": [
            {
              "functional_category": "glycerin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Squalane",
          "common_name": "Squalane",
          "ingredient_functions": [
            {
              "functional_category": "squalane"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 16,
    "brand": "Paula's Choice",
    "product_name": "Skin Perfecting 2% BHA Liquid",
    "category": "Treatment",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Salicylic Acid",
          "common_name": "Salicylic Acid",
          "ingredient_functions": [
            {
              "functional_category": "salicylic_acid"
            }
          ]
        }
      }
    ]
  },
  {
    "product_id": 19,
    "brand": "COSRX",
    "product_name": "Advanced Snail 92 All In One Cream",
    "category": "Moisturizer",
    "product_ingredients": [
      {
        "ingredients": {
          "inci_name": "Allantoin",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "allantoin"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Sodium Hyaluronate",
          "common_name": "Hyaluronic Acid",
          "ingredient_functions": [
            {
              "functional_category": "hyaluronic_acid"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        }
      },
      {
        "ingredients": {
          "inci_name": "Snail Secretion Filtrate",
          "common_name": "Snail Secretion Filtrate",
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Betaine",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Caprylic/Capric Triglyceride",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Butylene Glycol",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Cetearyl Olivate",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Sorbitan Olivate",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Cetearyl Alcohol",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Carbomer",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Ethyl Hexanediol",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Phenoxyethanol",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Arginine",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Dimethicone",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Sodium Polyacrylate",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Palmitic Acid",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Xanthan Gum",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Stearic Acid",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Adenosine",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Water",
          "common_name": null,
          "ingredient_functions": []
        }
      },
      {
        "ingredients": {
          "inci_name": "Myristic Acid",
          "common_name": null,
          "ingredient_functions": []
        }
      }
    ]
  }
];

interface IngredientLibraryRow {
  ingredient_id: number;
  inci_name: string;
  common_name: string;
  short_description: string;
  benefits: string[];
  best_for: string[];
  caution: string;
}

function rowToEntry(row: IngredientLibraryRow): IngredientLibraryEntry {
  return {
    id: String(row.ingredient_id),
    inciName: row.inci_name,
    name: row.common_name,
    description: row.short_description,
    benefits: row.benefits ?? [],
    bestFor: row.best_for ?? [],
    caution: row.caution,
  };
}

const INGREDIENT_LIBRARY_ROWS: IngredientLibraryRow[] = [
  {
    "ingredient_id": 1,
    "inci_name": "Ceramide NP",
    "common_name": "Ceramides",
    "short_description": "Lipids naturally found in skin that help restore and reinforce the moisture barrier.",
    "benefits": [
      "Barrier repair",
      "Moisture retention",
      "Soothing"
    ],
    "best_for": [
      "Dry skin",
      "Compromised barrier",
      "Sensitive skin"
    ],
    "caution": "Generally well tolerated with no notable irritation risk."
  },
  {
    "ingredient_id": 2,
    "inci_name": "Panthenol",
    "common_name": "Panthenol",
    "short_description": "Provitamin B5 that soothes irritation and supports hydration and barrier repair.",
    "benefits": [
      "Soothing",
      "Hydration",
      "Barrier support"
    ],
    "best_for": [
      "Reactive skin",
      "Post-procedure care",
      "Dryness"
    ],
    "caution": "Generally well tolerated; considered one of the safest, most beginner-friendly ingredients."
  },
  {
    "ingredient_id": 3,
    "inci_name": "Glycerin",
    "common_name": "Glycerin",
    "short_description": "A gentle, highly effective humectant that draws and holds moisture in the skin.",
    "benefits": [
      "Hydration",
      "Moisture retention"
    ],
    "best_for": [
      "All skin types",
      "Dehydrated skin",
      "Sensitive skin"
    ],
    "caution": "Generally well tolerated with virtually no irritation risk."
  },
  {
    "ingredient_id": 5,
    "inci_name": "Squalane",
    "common_name": "Squalane",
    "short_description": "A lightweight, non-greasy emollient that softens skin and helps prevent moisture loss.",
    "benefits": [
      "Moisture retention",
      "Softening",
      "Barrier support"
    ],
    "best_for": [
      "Dry skin",
      "Combination skin",
      "Sensitive skin"
    ],
    "caution": "Generally well tolerated with minimal irritation risk."
  },
  {
    "ingredient_id": 6,
    "inci_name": "Salicylic Acid",
    "common_name": "Salicylic Acid",
    "short_description": "An oil-soluble BHA exfoliant that clears pores and calms inflammation.",
    "benefits": [
      "Pore clearing",
      "Exfoliation",
      "Anti-inflammatory"
    ],
    "best_for": [
      "Acne-prone skin",
      "Blackheads",
      "Oily/congested pores"
    ],
    "caution": "Can cause dryness or peeling if overused; avoid combining with multiple strong exfoliants at once."
  },
  {
    "ingredient_id": 7,
    "inci_name": "Azelaic Acid",
    "common_name": "Azelaic Acid",
    "short_description": "A gentle multi-tasking acid that calms redness, fades discoloration, and helps with breakouts.",
    "benefits": [
      "Redness reduction",
      "Brightening",
      "Anti-acne"
    ],
    "best_for": [
      "Rosacea-prone skin",
      "Post-acne marks",
      "Uneven tone"
    ],
    "caution": "Mild tingling on application is common and usually temporary."
  },
  {
    "ingredient_id": 8,
    "inci_name": "Niacinamide",
    "common_name": "Niacinamide",
    "short_description": "A form of vitamin B3 that helps regulate oil, strengthen the skin barrier, and even out tone.",
    "benefits": [
      "Oil control",
      "Barrier support",
      "Tone evening"
    ],
    "best_for": [
      "Oiliness",
      "Acne-prone skin",
      "Dark spots",
      "Barrier support"
    ],
    "caution": "Generally well tolerated; very high concentrations may cause mild flushing in sensitive skin."
  },
  {
    "ingredient_id": 9,
    "inci_name": "Sodium Hyaluronate",
    "common_name": "Hyaluronic Acid",
    "short_description": "A humectant that draws water into the skin for immediate, lightweight hydration.",
    "benefits": [
      "Hydration",
      "Plumping",
      "Lightweight moisture"
    ],
    "best_for": [
      "Dehydrated skin",
      "All skin types",
      "Fine lines from dryness"
    ],
    "caution": "Can pull moisture from skin in very dry/low-humidity environments if used without a moisturizer on top."
  },
  {
    "ingredient_id": 10,
    "inci_name": "Gluconolactone",
    "common_name": "PHA (Gluconolactone)",
    "short_description": "A gentle, larger-molecule exfoliating acid that smooths texture with less irritation than AHAs.",
    "benefits": [
      "Gentle exfoliation",
      "Texture smoothing",
      "Hydration"
    ],
    "best_for": [
      "Sensitive skin",
      "Beginners to exfoliation",
      "Dry/reactive skin"
    ],
    "caution": "Generally well tolerated but can still cause mild sensitivity if overused."
  },
  {
    "ingredient_id": 11,
    "inci_name": "Retinol",
    "common_name": "Retinol",
    "short_description": "A vitamin A derivative that speeds cell turnover to improve texture and fine lines over time.",
    "benefits": [
      "Texture renewal",
      "Fine line reduction",
      "Cell turnover"
    ],
    "best_for": [
      "Uneven texture",
      "Early signs of aging",
      "Enlarged pores"
    ],
    "caution": "Can cause dryness, peeling, and sun sensitivity; introduce gradually and always pair with sunscreen."
  },
  {
    "ingredient_id": 14,
    "inci_name": "Benzoyl Peroxide",
    "common_name": "Benzoyl Peroxide",
    "short_description": "An antibacterial acne treatment that kills acne-causing bacteria and reduces inflammation.",
    "benefits": [
      "Acne treatment",
      "Antibacterial",
      "Anti-inflammatory"
    ],
    "best_for": [
      "Active breakouts",
      "Inflammatory acne"
    ],
    "caution": "Can cause dryness and irritation; may bleach fabrics and hair on contact."
  },
  {
    "ingredient_id": 15,
    "inci_name": "Ascorbic Acid",
    "common_name": "Vitamin C",
    "short_description": "A potent antioxidant that brightens tone and helps protect skin from environmental damage.",
    "benefits": [
      "Brightening",
      "Antioxidant protection",
      "Collagen support"
    ],
    "best_for": [
      "Dark spots",
      "Dullness",
      "Uneven tone"
    ],
    "caution": "Can sting or irritate sensitive/reactive skin, especially at high concentrations."
  },
  {
    "ingredient_id": 18,
    "inci_name": "Centella Asiatica Extract",
    "common_name": "Centella Asiatica",
    "short_description": "A calming botanical extract traditionally used to soothe irritation and support healing.",
    "benefits": [
      "Soothing",
      "Redness reduction",
      "Barrier support"
    ],
    "best_for": [
      "Redness",
      "Reactive skin",
      "Post-active recovery"
    ],
    "caution": "Generally well tolerated with minimal irritation risk."
  },
  {
    "ingredient_id": 20,
    "inci_name": "Zinc PCA",
    "common_name": "Zinc PCA",
    "short_description": "A mineral-derived ingredient that helps regulate oil production and calm irritation.",
    "benefits": [
      "Oil control",
      "Soothing",
      "Anti-inflammatory"
    ],
    "best_for": [
      "Oily skin",
      "Acne-prone skin"
    ],
    "caution": "Generally well tolerated with minimal irritation risk."
  },
  {
    "ingredient_id": 22,
    "inci_name": "Retinaldehyde",
    "common_name": "Retinaldehyde",
    "short_description": "A vitamin A derivative that converts to retinoic acid faster than retinol, offering stronger results with a similar tolerability profile.",
    "benefits": [
      "Texture renewal",
      "Fine line reduction",
      "Cell turnover"
    ],
    "best_for": [
      "Uneven texture",
      "Early signs of aging",
      "Retinol-experienced users"
    ],
    "caution": "Can cause dryness and sun sensitivity; introduce gradually and always pair with sunscreen."
  },
  {
    "ingredient_id": 23,
    "inci_name": "Tranexamic Acid",
    "common_name": "Tranexamic Acid",
    "short_description": "An ingredient that helps fade dark spots and even skin tone by interrupting pigment production.",
    "benefits": [
      "Brightening",
      "Dark spot fading",
      "Tone evening"
    ],
    "best_for": [
      "Hyperpigmentation",
      "Melasma-prone skin",
      "Post-acne marks"
    ],
    "caution": "Generally well tolerated with minimal irritation risk."
  },
  {
    "ingredient_id": 24,
    "inci_name": "Urea",
    "common_name": "Urea",
    "short_description": "A humectant and gentle exfoliant that hydrates and softens rough, thickened skin.",
    "benefits": [
      "Hydration",
      "Gentle exfoliation",
      "Softening"
    ],
    "best_for": [
      "Very dry skin",
      "Rough/thickened patches",
      "Flaky skin"
    ],
    "caution": "High concentrations can sting on broken or very sensitized skin."
  },
  {
    "ingredient_id": 25,
    "inci_name": "Sulfur",
    "common_name": "Sulfur",
    "short_description": "A traditional acne-fighting ingredient that absorbs excess oil and has mild antibacterial properties.",
    "benefits": [
      "Oil absorption",
      "Antibacterial",
      "Acne treatment"
    ],
    "best_for": [
      "Oily/acne-prone skin",
      "Blackheads",
      "Mild breakouts"
    ],
    "caution": "Can be drying and has a distinct sulfur odor; may irritate sensitive skin."
  },
  {
    "ingredient_id": 26,
    "inci_name": "Petrolatum",
    "common_name": "Petrolatum",
    "short_description": "An occlusive that seals in moisture and protects the skin barrier, commonly used in healing balms.",
    "benefits": [
      "Barrier protection",
      "Moisture sealing",
      "Healing support"
    ],
    "best_for": [
      "Very dry skin",
      "Barrier repair",
      "Chapped/irritated skin"
    ],
    "caution": "Generally well tolerated but can feel heavy or greasy; not ideal for very oily/acne-prone skin."
  },
  {
    "ingredient_id": 27,
    "inci_name": "Ectoin",
    "common_name": "Ectoin",
    "short_description": "A protective molecule that helps skin retain moisture and defend against environmental stress.",
    "benefits": [
      "Hydration",
      "Environmental protection",
      "Soothing"
    ],
    "best_for": [
      "Sensitive skin",
      "Environmentally stressed skin",
      "Barrier support"
    ],
    "caution": "Generally well tolerated with minimal irritation risk."
  },
  {
    "ingredient_id": 28,
    "inci_name": "Snail Secretion Filtrate",
    "common_name": "Snail Secretion Filtrate",
    "short_description": "A mucin-derived filtrate rich in glycoproteins and hyaluronic acid, used to hydrate, soothe, and support skin repair.",
    "benefits": [
      "Hydration",
      "Soothing",
      "Skin repair support"
    ],
    "best_for": [
      "Dry skin",
      "Damaged or compromised barrier",
      "Dull skin"
    ],
    "caution": "Generally well tolerated; rare sensitivity reports exist for snail-derived ingredients."
  }
];

export const INGREDIENT_LIBRARY_SNAPSHOT: IngredientLibraryEntry[] =
  INGREDIENT_LIBRARY_ROWS.map(rowToEntry);

export const FULL_INGREDIENTS_SNAPSHOT: Record<string, {
  brand: string;
  product_name: string;
  product_ingredients: {
    inci_position: number | null;
    ingredients: {
      inci_name: string;
      common_name: string | null;
      benefits: string[] | null;
      ingredient_functions: { functional_category: string }[];
    };
  }[];
}> = {
  "19": {
    "brand": "COSRX",
    "product_name": "Advanced Snail 92 All In One Cream",
    "product_ingredients": [
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Allantoin",
          "common_name": null,
          "ingredient_functions": [
            {
              "functional_category": "allantoin"
            }
          ]
        },
        "inci_position": 15
      },
      {
        "ingredients": {
          "benefits": [
            "Hydration",
            "Plumping",
            "Lightweight moisture"
          ],
          "inci_name": "Sodium Hyaluronate",
          "common_name": "Hyaluronic Acid",
          "ingredient_functions": [
            {
              "functional_category": "hyaluronic_acid"
            }
          ]
        },
        "inci_position": 14
      },
      {
        "ingredients": {
          "benefits": [
            "Soothing",
            "Hydration",
            "Barrier support"
          ],
          "inci_name": "Panthenol",
          "common_name": "Panthenol",
          "ingredient_functions": [
            {
              "functional_category": "panthenol"
            }
          ]
        },
        "inci_position": 17
      },
      {
        "ingredients": {
          "benefits": [
            "Hydration",
            "Soothing",
            "Skin repair support"
          ],
          "inci_name": "Snail Secretion Filtrate",
          "common_name": "Snail Secretion Filtrate",
          "ingredient_functions": []
        },
        "inci_position": 1
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Betaine",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 2
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Caprylic/Capric Triglyceride",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 3
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Butylene Glycol",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 4
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Cetearyl Olivate",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 5
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Sorbitan Olivate",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 6
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Cetearyl Alcohol",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 7
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Carbomer",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 8
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Ethyl Hexanediol",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 9
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Phenoxyethanol",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 10
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Arginine",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 11
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Dimethicone",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 12
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Sodium Polyacrylate",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 13
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Palmitic Acid",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 16
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Xanthan Gum",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 18
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Stearic Acid",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 19
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Adenosine",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 20
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Water",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 21
      },
      {
        "ingredients": {
          "benefits": null,
          "inci_name": "Myristic Acid",
          "common_name": null,
          "ingredient_functions": []
        },
        "inci_position": 22
      }
    ]
  }
};

export interface AllIngredientRow {
  ingredient_id: number;
  inci_name: string;
  ingredient_functions: { functional_category: string }[];
}

export const ALL_INGREDIENTS_SNAPSHOT: AllIngredientRow[] = [
  {
    "ingredient_id": 4,
    "inci_name": "Beta-Glucan",
    "ingredient_functions": [
      {
        "functional_category": "beta_glucan"
      }
    ]
  },
  {
    "ingredient_id": 12,
    "inci_name": "Adapalene",
    "ingredient_functions": [
      {
        "functional_category": "retinoid"
      }
    ]
  },
  {
    "ingredient_id": 13,
    "inci_name": "Glycolic Acid",
    "ingredient_functions": [
      {
        "functional_category": "glycolic_acid"
      }
    ]
  },
  {
    "ingredient_id": 16,
    "inci_name": "Fragrance (Parfum)",
    "ingredient_functions": [
      {
        "functional_category": "fragrance"
      }
    ]
  },
  {
    "ingredient_id": 17,
    "inci_name": "Alcohol Denat.",
    "ingredient_functions": [
      {
        "functional_category": "alcohol_denat"
      }
    ]
  },
  {
    "ingredient_id": 19,
    "inci_name": "Allantoin",
    "ingredient_functions": [
      {
        "functional_category": "allantoin"
      }
    ]
  },
  {
    "ingredient_id": 21,
    "inci_name": "Titanium Dioxide",
    "ingredient_functions": [
      {
        "functional_category": "uv_filter"
      }
    ]
  },
  {
    "ingredient_id": 8,
    "inci_name": "Niacinamide",
    "ingredient_functions": [
      {
        "functional_category": "niacinamide"
      }
    ]
  },
  {
    "ingredient_id": 9,
    "inci_name": "Sodium Hyaluronate",
    "ingredient_functions": [
      {
        "functional_category": "hyaluronic_acid"
      }
    ]
  },
  {
    "ingredient_id": 1,
    "inci_name": "Ceramide NP",
    "ingredient_functions": [
      {
        "functional_category": "ceramide"
      }
    ]
  },
  {
    "ingredient_id": 2,
    "inci_name": "Panthenol",
    "ingredient_functions": [
      {
        "functional_category": "panthenol"
      }
    ]
  },
  {
    "ingredient_id": 18,
    "inci_name": "Centella Asiatica Extract",
    "ingredient_functions": [
      {
        "functional_category": "centella"
      }
    ]
  },
  {
    "ingredient_id": 6,
    "inci_name": "Salicylic Acid",
    "ingredient_functions": [
      {
        "functional_category": "salicylic_acid"
      }
    ]
  },
  {
    "ingredient_id": 7,
    "inci_name": "Azelaic Acid",
    "ingredient_functions": [
      {
        "functional_category": "azelaic_acid"
      }
    ]
  },
  {
    "ingredient_id": 11,
    "inci_name": "Retinol",
    "ingredient_functions": [
      {
        "functional_category": "retinoid"
      }
    ]
  },
  {
    "ingredient_id": 15,
    "inci_name": "Ascorbic Acid",
    "ingredient_functions": [
      {
        "functional_category": "vitamin_c"
      }
    ]
  },
  {
    "ingredient_id": 3,
    "inci_name": "Glycerin",
    "ingredient_functions": [
      {
        "functional_category": "glycerin"
      }
    ]
  },
  {
    "ingredient_id": 5,
    "inci_name": "Squalane",
    "ingredient_functions": [
      {
        "functional_category": "squalane"
      }
    ]
  },
  {
    "ingredient_id": 14,
    "inci_name": "Benzoyl Peroxide",
    "ingredient_functions": [
      {
        "functional_category": "benzoyl_peroxide"
      }
    ]
  },
  {
    "ingredient_id": 20,
    "inci_name": "Zinc PCA",
    "ingredient_functions": [
      {
        "functional_category": "zinc_pca"
      }
    ]
  },
  {
    "ingredient_id": 10,
    "inci_name": "Gluconolactone",
    "ingredient_functions": [
      {
        "functional_category": "pha"
      }
    ]
  },
  {
    "ingredient_id": 22,
    "inci_name": "Retinaldehyde",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 23,
    "inci_name": "Tranexamic Acid",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 24,
    "inci_name": "Urea",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 25,
    "inci_name": "Sulfur",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 26,
    "inci_name": "Petrolatum",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 27,
    "inci_name": "Ectoin",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 28,
    "inci_name": "Snail Secretion Filtrate",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 29,
    "inci_name": "Betaine",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 30,
    "inci_name": "Caprylic/Capric Triglyceride",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 31,
    "inci_name": "Butylene Glycol",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 32,
    "inci_name": "Cetearyl Olivate",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 33,
    "inci_name": "Sorbitan Olivate",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 34,
    "inci_name": "Cetearyl Alcohol",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 35,
    "inci_name": "Carbomer",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 36,
    "inci_name": "Ethyl Hexanediol",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 37,
    "inci_name": "Phenoxyethanol",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 38,
    "inci_name": "Arginine",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 39,
    "inci_name": "Dimethicone",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 40,
    "inci_name": "Sodium Polyacrylate",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 41,
    "inci_name": "Palmitic Acid",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 42,
    "inci_name": "Xanthan Gum",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 43,
    "inci_name": "Stearic Acid",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 44,
    "inci_name": "Adenosine",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 45,
    "inci_name": "Water",
    "ingredient_functions": []
  },
  {
    "ingredient_id": 46,
    "inci_name": "Myristic Acid",
    "ingredient_functions": []
  }
];
