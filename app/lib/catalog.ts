export interface AtelierProduct {
  id: string;
  handle: string;
  title: string;
  category: 'outerwear' | 'dresses' | 'tops' | 'bottoms' | 'sets';
  categoryTitle: string;
  tag: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  featuredImage: {
    url: string;
    altText: string;
    width: number;
    height: number;
  };
  images: Array<{
    id: string;
    url: string;
    altText: string;
    width?: number;
    height?: number;
  }>;
  description: string;
  descriptionHtml: string;
  specs: {
    fabric: string;
    silhouette: string;
    craft: string;
    details: string;
    care: string;
  };
  modelInfo: string;
  availableSizes: string[];
  colors: Array<{
    name: string;
    hex: string;
  }>;
  inStock: boolean;
  relatedHandles: string[];
}

export const CRUSH_CATALOG: AtelierProduct[] = [
  {
    id: 'gid://shopify/Product/crush-01',
    handle: 'alabaster-sculpted-trench',
    title: 'Alabaster Sculpted Trench',
    category: 'outerwear',
    categoryTitle: 'Tailored Outerwear',
    tag: 'Drop 01 // Limited Edition',
    price: {amount: '380.00', currencyCode: 'USD'},
    compareAtPrice: {amount: '450.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-full-1.jpg',
      altText: 'Alabaster Sculpted Trench worn on model',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-1-1', url: '/images/model-full-1.jpg', altText: 'Full length model view'},
      {id: 'img-1-2', url: '/images/hanger-garment-1.jpg', altText: 'Garment rail presentation'},
      {id: 'img-1-3', url: '/images/look-studio-1.jpg', altText: 'Architectural silhouette profile'},
      {id: 'img-1-4', url: '/images/model-look-1.jpg', altText: 'Textile texture and lapel close-up'},
    ],
    description:
      'A structural double-breasted trench in alabaster twill with exaggerated shoulder architecture, high storm flap, and cinchable self-belt.',
    descriptionHtml: `
      <p>Precision-engineered in heavyweight water-repellent cotton twill with an immaculate structured drape. Features exaggerated peaked storm flaps, wide notched lapels, and clean concealed welt pockets.</p>
      <p>The self-tie waist belt allows effortless transitions from an authoritative architectural column to a sculpted hourglass silhouette.</p>
    `,
    specs: {
      fabric: '100% Organic Heavyweight Cotton Twill (420 GSM)',
      silhouette: 'Structured drop-shoulder column with cinched belt',
      craft: 'Tailored in the United States with clean Hong Kong interior seams',
      details: 'Horn-effect buttons, metal belt buckle, deep storm flap',
      care: 'Specialist dry clean only. Store on shaped atelier hanger.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small (US 4). Length: 49.5 inches.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
      {name: 'Ink Black', hex: '#111111'},
    ],
    inStock: true,
    relatedHandles: [
      'champagne-bias-silk-slip',
      'monolith-structured-blazer',
      'pleated-tailored-wide-trouser',
      'obsidian-cashmere-cocoon',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-02',
    handle: 'champagne-bias-silk-slip',
    title: 'Champagne Bias Silk Slip',
    category: 'dresses',
    categoryTitle: 'Dresses & Gowns',
    tag: 'Atelier Essential // Evening',
    price: {amount: '290.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-full-2.jpg',
      altText: 'Champagne Bias Silk Slip worn on model',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-2-1', url: '/images/model-full-2.jpg', altText: 'Front drape and silhouette'},
      {id: 'img-2-2', url: '/images/hanger-garment-2.jpg', altText: 'Hanger presentation in studio'},
      {id: 'img-2-3', url: '/images/look-studio-2.jpg', altText: 'Bias cut movement study'},
      {id: 'img-2-4', url: '/images/model-look-2.jpg', altText: 'Back neckline and strap details'},
    ],
    description:
      'Heavyweight 22-momme silk charmeuse cut on the true bias. Cascades liquidly over contours with zero constriction.',
    descriptionHtml: `
      <p>A masterclass in bias-cut tailoring. Crafted from 22-momme Grade 6A mulberry silk with a matte satin sheen, this gown hugs the natural contours of the body before releasing into a fluid floor sweep.</p>
      <p>Features ultra-fine Rouleau straps, french seams throughout, and an invisible side zip closure.</p>
    `,
    specs: {
      fabric: '100% Pure Mulberry Silk Charmeuse (22 Momme)',
      silhouette: 'True bias-cut contour with fluid ankle sweep',
      craft: 'Hand-rolled hems and French seams throughout',
      details: 'Adjustable Rouleau shoulder straps, low scoop back',
      care: 'Dry clean only or gentle cold silk hand wash with pH-neutral detergent.',
    },
    modelInfo: "Model is 5'9\" / 175 cm wearing size Small (US 4). Length: 55 inches.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Champagne Silk', hex: '#EBE5D8'},
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
    ],
    inStock: true,
    relatedHandles: [
      'alabaster-sculpted-trench',
      'monolith-structured-blazer',
      'asymmetric-silk-evening-gown',
      'obsidian-cashmere-cocoon',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-03',
    handle: 'monolith-structured-blazer',
    title: 'Monolith Structured Blazer',
    category: 'outerwear',
    categoryTitle: 'Tailored Outerwear',
    tag: 'Signature Tailoring // SS 2026',
    price: {amount: '420.00', currencyCode: 'USD'},
    compareAtPrice: {amount: '480.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-full-3.jpg',
      altText: 'Monolith Structured Blazer worn on model',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-3-1', url: '/images/model-full-3.jpg', altText: 'Front tailoring perspective'},
      {id: 'img-3-2', url: '/images/hanger-garment-3.jpg', altText: 'Atelier hanger view'},
      {id: 'img-3-3', url: '/images/look-studio-3.jpg', altText: 'Shoulder line and waist darting'},
      {id: 'img-3-4', url: '/images/model-look-3.jpg', altText: 'Profile and lapel detail'},
    ],
    description:
      'Sharply defined padded shoulders taper into a nipped waistline. An authoritative modern statement piece for contemporary dressing.',
    descriptionHtml: `
      <p>Architectural tailoring designed to command attention. Featuring full floating horsehair canvas construction, structured peak lapels, and waist-defining darts.</p>
      <p>Lined in pure cupro for effortless layering over fine silks and structured shirting.</p>
    `,
    specs: {
      fabric: '98% Virgin Wool Suiting, 2% Elastane for resilience',
      silhouette: 'Exaggerated peak shoulder with sculpted nip waist',
      craft: 'Floating canvas chest piece with bespoke hand-stitched collar',
      details: 'Dual back vents, working cuff buttons, interior passport pocket',
      care: 'Professional dry clean only. Store on shaped wood hanger.',
    },
    modelInfo: "Model is 5'11\" / 180 cm wearing size Small (US 4).",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
    inStock: true,
    relatedHandles: [
      'pleated-tailored-wide-trouser',
      'atelier-oversized-poplin-shirt',
      'champagne-bias-silk-slip',
      'alabaster-sculpted-trench',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-04',
    handle: 'heather-draped-column-dress',
    title: 'Heather Draped Column Dress',
    category: 'dresses',
    categoryTitle: 'Dresses & Gowns',
    tag: 'Atelier Knits // Drop 01',
    price: {amount: '260.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-full-4.jpg',
      altText: 'Heather Draped Column Dress on model',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-4-1', url: '/images/model-full-4.jpg', altText: 'Draped front column'},
      {id: 'img-4-2', url: '/images/hanger-garment-4.jpg', altText: 'Garment rail hanging view'},
      {id: 'img-4-3', url: '/images/look-studio-4.jpg', altText: 'Waist gathering details'},
      {id: 'img-4-4', url: '/images/model-look-4.jpg', altText: 'Side movement and drape'},
    ],
    description:
      'Sculptural column dress in compact heather rib knit. Features asymmetric gathering along the hip and a graceful mock neck.',
    descriptionHtml: `
      <p>Knitted from high-twist viscose-blend yarns that hold architectural form while providing soothing second-skin comfort. Asymmetric side pleating flatters the waist and hip.</p>
      <p>Finished with a subtle back slit for effortless walking movement.</p>
    `,
    specs: {
      fabric: '72% Viscose, 28% High-Twist Polyester Knit',
      silhouette: 'Column silhouette with asymmetric hip gather',
      craft: 'Fully fashioned seamless knit technology',
      details: 'High mock collar, concealed center-back zip',
      care: 'Hand wash cold flat dry or specialist dry clean.',
    },
    modelInfo: "Model is 5'9\" / 175 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Soft Stone', hex: '#D8D5CE'},
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
      {name: 'Ink Black', hex: '#111111'},
    ],
    inStock: true,
    relatedHandles: [
      'obsidian-cashmere-cocoon',
      'alabaster-sculpted-trench',
      'asymmetric-silk-evening-gown',
      'monolith-structured-blazer',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-05',
    handle: 'obsidian-cashmere-cocoon',
    title: 'Obsidian Cashmere Cocoon',
    category: 'outerwear',
    categoryTitle: 'Tailored Outerwear',
    tag: 'Ultra-Luxury // Cashmere Edition',
    price: {amount: '490.00', currencyCode: 'USD'},
    compareAtPrice: {amount: '580.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-full-5.jpg',
      altText: 'Obsidian Cashmere Cocoon Coat on model',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-5-1', url: '/images/model-full-5.jpg', altText: 'Full length cashmere cocoon drape'},
      {id: 'img-5-2', url: '/images/hanger-garment-5.jpg', altText: 'Atelier hanger view'},
      {id: 'img-5-3', url: '/images/look-studio-5.jpg', altText: 'Shawl collar detail'},
      {id: 'img-5-4', url: '/images/model-look-5.jpg', altText: 'Texture and interior finish'},
    ],
    description:
      'Hand-finished in pure double-faced cashmere with an enveloping cocoon silhouette and deep drop shoulders for understated grandeur.',
    descriptionHtml: `
      <p>Unmatched soft warmth and volume without weight. Crafted from double-faced cashmere sourced from certified ethical mills, split and hand-sewn along every edge.</p>
      <p>Features seamless kimono sleeves, deep welt pockets, and a dramatic standing shawl collar.</p>
    `,
    specs: {
      fabric: '100% Grade-A Mongolian Double-Faced Cashmere (580 GSM)',
      silhouette: 'Oversized cocoon silhouette with drop shoulder',
      craft: 'Hand-split and hand-stitched blind seams',
      details: 'Deep inset pockets, matching wrap belt included',
      care: 'Specialist luxury dry clean only. Store folded in breathable dust bag.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small / Medium.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
    inStock: true,
    relatedHandles: [
      'alabaster-sculpted-trench',
      'champagne-bias-silk-slip',
      'heather-draped-column-dress',
      'monochrome-quilted-puffer',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-06',
    handle: 'sculptural-hooded-overcoat',
    title: 'Sculptural Minimalist Hoodie',
    category: 'tops',
    categoryTitle: 'Tops & Shirting',
    tag: 'Streetwear Atelier // SS 2026',
    price: {amount: '220.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/hoodie.jpg',
      altText: 'Sculptural Minimalist Hoodie',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-6-1', url: '/images/hoodie.jpg', altText: 'Hoodie architectural silhouette'},
      {id: 'img-6-2', url: '/images/look-studio-3.jpg', altText: 'Studio drape preview'},
      {id: 'img-6-3', url: '/images/rack-garment-3.jpg', altText: 'Garment rail shot'},
    ],
    description:
      'Heavyweight 500 GSM loopback cotton hoodie with structured double-layered hood and clean seamless pocketing.',
    descriptionHtml: `
      <p>Reimagining street casual through high-fashion proportion. Cut in custom-milled 500 GSM organic cotton french terry with dropped shoulders and ribbed cuffs that maintain their form indefinitely.</p>
      <p>Subtle blind embossed CRUSH atelier branding at the nape.</p>
    `,
    specs: {
      fabric: '100% Organic Loopback French Terry (500 GSM)',
      silhouette: 'Boxy, cropped-hem silhouette with articulated sleeves',
      craft: 'Flatlock stitched throughout for lifetime durability',
      details: 'Double-layered standing hood without drawstrings',
      care: 'Machine wash cold inside-out, hang dry.',
    },
    modelInfo: "Model is 5'9\" / 175 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
    ],
    inStock: true,
    relatedHandles: [
      'monochrome-quilted-puffer',
      'pleated-tailored-wide-trouser',
      'chalk-ivory-ribbed-knit-set',
      'monolith-structured-blazer',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-07',
    handle: 'monochrome-quilted-puffer',
    title: 'Monochrome Quilted Puffer',
    category: 'outerwear',
    categoryTitle: 'Tailored Outerwear',
    tag: 'Winter Atelier // Limited Run',
    price: {amount: '440.00', currencyCode: 'USD'},
    compareAtPrice: {amount: '510.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/puffer.jpg',
      altText: 'Monochrome Quilted Puffer Jacket',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-7-1', url: '/images/puffer.jpg', altText: 'Puffer architectural volume'},
      {id: 'img-7-2', url: '/images/model-look-1.jpg', altText: 'High neck collar styling'},
      {id: 'img-7-3', url: '/images/look-studio-4.jpg', altText: 'Studio perspective'},
    ],
    description:
      'Matte architectural down jacket with geometric baffle quilting, exaggerated stand collar, and internal storm cuffs.',
    descriptionHtml: `
      <p>Sculpted winter protection. Filled with ethically sourced 800-fill power goose down enveloped in water-resistant matte micro-ripstop.</p>
      <p>Features magnetic storm flap closures, fleece-lined hand pockets, and adjustable hem toggles.</p>
    `,
    specs: {
      fabric: 'Matte Water-Resistant Technical Shell, 800-Fill Responsible Down',
      silhouette: 'Cropped cocoon volume with high funnel neck',
      craft: 'Thermo-welded baffle construction to prevent cold spots',
      details: 'Concealed magnetic placket, interior phone pouch',
      care: 'Professional down specialist clean only.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
    inStock: true,
    relatedHandles: [
      'sculptural-hooded-overcoat',
      'pleated-tailored-wide-trouser',
      'obsidian-cashmere-cocoon',
      'alabaster-sculpted-trench',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-08',
    handle: 'asymmetric-silk-evening-gown',
    title: 'Asymmetric Silk Evening Gown',
    category: 'dresses',
    categoryTitle: 'Dresses & Gowns',
    tag: 'Couture Drop // Gala Edition',
    price: {amount: '520.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/look-studio-2.jpg',
      altText: 'Asymmetric Silk Evening Gown',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-8-1', url: '/images/look-studio-2.jpg', altText: 'Sculptural silhouette view'},
      {id: 'img-8-2', url: '/images/model-look-2.jpg', altText: 'Drape study on model'},
      {id: 'img-8-3', url: '/images/hanger-garment-2.jpg', altText: 'Hanger presentation'},
    ],
    description:
      'One-shoulder sculpted evening gown with cascading silk georgette drape and floor-length architectural train.',
    descriptionHtml: `
      <p>Crafted for moments of undeniable presence. Constructed with an internal boned corset and draped in double-layered silk georgette that catches air as you walk.</p>
      <p>A daring high side split is balanced by the dignified high single-shoulder neckline.</p>
    `,
    specs: {
      fabric: '100% Silk Crepe de Chine & Silk Georgette Overlay',
      silhouette: 'Fitted bodice with asymmetric cascade and train',
      craft: 'Hand-draped atelier construction with internal support',
      details: 'Invisible back zipper, horsehair hem for dramatic flare',
      care: 'Specialist couture dry clean only.',
    },
    modelInfo: "Model is 5'11\" / 180 cm wearing size Small (US 4). Length: 60 inches.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Champagne Silk', hex: '#EBE5D8'},
      {name: 'Ink Black', hex: '#111111'},
    ],
    inStock: true,
    relatedHandles: [
      'champagne-bias-silk-slip',
      'heather-draped-column-dress',
      'obsidian-cashmere-cocoon',
      'monolith-structured-blazer',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-09',
    handle: 'atelier-oversized-poplin-shirt',
    title: 'Atelier Oversized Poplin Shirt',
    category: 'tops',
    categoryTitle: 'Tops & Shirting',
    tag: 'Everyday Atelier // Poplin',
    price: {amount: '195.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/look-studio-1.jpg',
      altText: 'Atelier Oversized Poplin Shirt',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-9-1', url: '/images/look-studio-1.jpg', altText: 'Poplin shirt profile'},
      {id: 'img-9-2', url: '/images/rack-garment-1.jpg', altText: 'Rail presentation'},
      {id: 'img-9-3', url: '/images/hanger-garment-1.jpg', altText: 'Garment close-up'},
    ],
    description:
      'Crisp 120s two-ply organic cotton poplin cut with oversized menswear proportions and extended cuffs.',
    descriptionHtml: `
      <p>The definitive white shirt. Woven from Egyptian extra-long staple cotton with a dry, paper-touch finish. Features dropped shoulders, a dramatic curved hemline, and elongated button cuffs designed to be folded back.</p>
    `,
    specs: {
      fabric: '100% Egyptian Giza Cotton Poplin (120/2 Count)',
      silhouette: 'Exaggerated oversized menswear cut',
      craft: 'Single-needle stitching with 20 stitches per inch',
      details: 'Mother of pearl buttons, extended French cuffs',
      care: 'Machine wash warm, iron while damp or steam press.',
    },
    modelInfo: "Model is 5'9\" / 175 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
      {name: 'Ink Black', hex: '#111111'},
    ],
    inStock: true,
    relatedHandles: [
      'pleated-tailored-wide-trouser',
      'monolith-structured-blazer',
      'alabaster-sculpted-trench',
      'sculptural-hooded-overcoat',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-10',
    handle: 'pleated-tailored-wide-trouser',
    title: 'Pleated Tailored Wide Trouser',
    category: 'bottoms',
    categoryTitle: 'Bottoms & Tailoring',
    tag: 'Architectural Suiting // SS 2026',
    price: {amount: '280.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/look-studio-4.jpg',
      altText: 'Pleated Tailored Wide Trouser',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-10-1', url: '/images/look-studio-4.jpg', altText: 'Trouser silhouette and drape'},
      {id: 'img-10-2', url: '/images/model-look-3.jpg', altText: 'Waistband and pleat detail'},
      {id: 'img-10-3', url: '/images/rack-garment-4.jpg', altText: 'Hanging presentation'},
    ],
    description:
      'High-waisted wide-leg trousers featuring deep forward pleats and an immaculate, liquid break over footwear.',
    descriptionHtml: `
      <p>Tailored from fluid high-twist wool gabardine with natural crease recovery. Designed with an extended waistband tab, deep side slant pockets, and a wide-leg cut that elongates the leg line.</p>
    `,
    specs: {
      fabric: '100% High-Twist Wool Gabardine',
      silhouette: 'High-rise, relaxed wide-leg with forward double pleats',
      craft: 'Curtain waistband construction for supreme waist comfort',
      details: 'Extended button tab, horn buttons, back welt pockets',
      care: 'Professional dry clean only.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small (US 4). Inseam: 33 inches.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
    inStock: true,
    relatedHandles: [
      'monolith-structured-blazer',
      'atelier-oversized-poplin-shirt',
      'alabaster-sculpted-trench',
      'sculptural-hooded-overcoat',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-11',
    handle: 'double-faced-wool-kimono-coat',
    title: 'Double-Faced Wool Kimono Coat',
    category: 'outerwear',
    categoryTitle: 'Tailored Outerwear',
    tag: 'Sculptural Outerwear // SS 2026',
    price: {amount: '460.00', currencyCode: 'USD'},
    compareAtPrice: {amount: '520.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/look-studio-5.jpg',
      altText: 'Double-Faced Wool Kimono Coat',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-11-1', url: '/images/look-studio-5.jpg', altText: 'Kimono coat drape'},
      {id: 'img-11-2', url: '/images/model-look-4.jpg', altText: 'Sleeve volume on model'},
      {id: 'img-11-3', url: '/images/rack-garment-5.jpg', altText: 'Hanging perspective'},
    ],
    description:
      'Minimalist wrap coat with wide kimono sleeves, clean shawl lapels, and an enveloping wool drape.',
    descriptionHtml: `
      <p>Inspired by Eastern minimalism and Western tailoring. Pure virgin wool double-cloth hand-finished along all exposed edges. Can be worn open and fluid or fastened with the included architectural sash.</p>
    `,
    specs: {
      fabric: '100% Virgin Double-Cloth Wool',
      silhouette: 'Fluid wrap kimono silhouette',
      craft: 'Hand-finished invisible seams throughout',
      details: 'Side seam pockets, tonal belt',
      care: 'Dry clean only.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Soft Stone', hex: '#D8D5CE'},
      {name: 'Ink Black', hex: '#111111'},
    ],
    inStock: true,
    relatedHandles: [
      'alabaster-sculpted-trench',
      'heather-draped-column-dress',
      'champagne-bias-silk-slip',
      'pleated-tailored-wide-trouser',
    ],
  },
  {
    id: 'gid://shopify/Product/crush-12',
    handle: 'chalk-ivory-ribbed-knit-set',
    title: 'Chalk Ivory Ribbed Knit Set',
    category: 'sets',
    categoryTitle: 'Minimalist Sets',
    tag: 'Atelier Knits // Two-Piece',
    price: {amount: '310.00', currencyCode: 'USD'},
    featuredImage: {
      url: '/images/model-look-5.jpg',
      altText: 'Chalk Ivory Ribbed Knit Set',
      width: 1200,
      height: 1600,
    },
    images: [
      {id: 'img-12-1', url: '/images/model-look-5.jpg', altText: 'Knit set worn by model'},
      {id: 'img-12-2', url: '/images/hanger-garment-1.jpg', altText: 'Garment rail shot'},
      {id: 'img-12-3', url: '/images/look-studio-3.jpg', altText: 'Texture close-up'},
    ],
    description:
      'Coordinated two-piece set in chalk ivory compact rib. Includes an asymmetric tunic top and matching flared knit trousers.',
    descriptionHtml: `
      <p>Effortless monochromatic luxury. Knitted with high-gauge viscose and stretch nylon for a fluid, sculpted fall that resists bagging at the knees and elbows.</p>
      <p>Wear together as a cohesive statement or as versatile separates across your seasonal wardrobe.</p>
    `,
    specs: {
      fabric: '80% Eco-Vero Viscose, 20% Stretch Polyamide',
      silhouette: 'Elongated tunic top with matching high-waisted kick-flare pants',
      craft: 'Seamless 3D knit construction',
      details: 'Elasticized internal waistband, split cuffs',
      care: 'Gentle hand wash cold, dry flat.',
    },
    modelInfo: "Model is 5'9\" / 175 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
    inStock: true,
    relatedHandles: [
      'alabaster-sculpted-trench',
      'obsidian-cashmere-cocoon',
      'sculptural-hooded-overcoat',
      'atelier-oversized-poplin-shirt',
    ],
  },
];

/**
 * Helper to fetch a product by handle from CRUSH_CATALOG
 */
export function getCatalogProductByHandle(handle: string): AtelierProduct | undefined {
  return CRUSH_CATALOG.find((p) => p.handle.toLowerCase() === handle.toLowerCase());
}

/**
 * Helper to filter catalog by category
 */
export function getCatalogByCategory(category: string): AtelierProduct[] {
  if (!category || category === 'all') return CRUSH_CATALOG;
  return CRUSH_CATALOG.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Convert AtelierProduct to Storefront API ProductItem shape for seamless rendering in ProductItem component
 */
export function toStorefrontProductItem(p: AtelierProduct) {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    featuredImage: {
      id: p.featuredImage.url,
      altText: p.featuredImage.altText,
      url: p.featuredImage.url,
      width: p.featuredImage.width,
      height: p.featuredImage.height,
    },
    priceRange: {
      minVariantPrice: p.price,
      maxVariantPrice: p.price,
    },
    compareAtPriceRange: p.compareAtPrice
      ? {
          minVariantPrice: p.compareAtPrice,
          maxVariantPrice: p.compareAtPrice,
        }
      : undefined,
  };
}
