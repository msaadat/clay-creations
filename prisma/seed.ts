import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

const img = (n: number) => `/products/product-${String(n).padStart(2, "0")}.jpg`;

const CATEGORIES = [
  {
    slug: "earrings",
    name: "Earrings",
    description:
      "Elegant handcrafted earrings with delicate florals, soft colours and timeless artistry.",
    imageUrl: img(22),
  },
  {
    slug: "jhumkay",
    name: "Jhumkay",
    description:
      "Traditional elegance with a modern touch — intricate floral detailing and statement drops.",
    imageUrl: img(5),
  },
  {
    slug: "pendants",
    name: "Pendants",
    description:
      "Miniature floral art turned into wearable keepsakes, made to last well beyond a season.",
    imageUrl: img(12),
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    description:
      "Handmade necklaces crafted with floral details and artistic textures.",
    imageUrl: img(9),
  },
  {
    slug: "rings",
    name: "Rings",
    description:
      "Delicate handmade rings blooming with miniature floral artistry — lightweight and elegant.",
    imageUrl: img(21),
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    description:
      "Handcrafted bracelets inspired by florals and softness — perfect for stacking or gifting.",
    imageUrl: img(1),
  },
];

/**
 * Seed catalogue.
 *
 * Products 01, 12 and 22 are described from the actual photographs. The rest use
 * plausible placeholder names and categories so the storefront has something to
 * render — rename and recategorise them from /admin once you know which photo is
 * which piece.
 *
 * `variants` with a single entry and no optionName produce a simple product;
 * two or more entries produce a variant picker on the product page.
 */
const PRODUCTS = [
  {
    slug: "evil-eye-blue-tile-bracelet",
    name: "Evil Eye Blue Tile Bracelet",
    category: "bracelets",
    featured: true,
    description:
      "A hand-painted blue tile centrepiece framed by freshwater pearls and glass evil-eye beads on a gold-tone chain. Light enough for everyday wear.",
    images: [1, 2],
    variants: [{ price: 220000, stock: 4 }],
  },
  {
    slug: "rose-cameo-pearl-drop-pendant",
    name: "Rose Cameo Pearl Drop Pendant",
    category: "pendants",
    featured: true,
    description:
      "Hand-sculpted roses and buds set in an ornate filigree frame, finished with a teardrop pearl. Each flower is rolled and shaped by hand, so no two are identical.",
    images: [12, 11],
    variants: [
      { optionName: "Base", optionValue: "Golden base", price: 300000, stock: 3 },
      { optionName: "Base", optionValue: "Silver base", price: 300000, stock: 2 },
    ],
  },
  {
    slug: "midnight-rose-hexagon-earrings",
    name: "Midnight Rose Hexagon Earrings",
    category: "earrings",
    featured: true,
    description:
      "Deep red roses on a black hexagon base, suspended from brass leaf studs with a pearl drop below. Statement earrings that stay comfortably light.",
    images: [22, 20],
    variants: [
      { optionName: "Base", optionValue: "Golden base", price: 299900, stock: 5 },
      { optionName: "Base", optionValue: "Silver base", price: 299900, stock: 3 },
    ],
  },
  {
    slug: "midnight-rose-oval-ring",
    name: "Midnight Rose Oval Ring",
    category: "rings",
    featured: true,
    description:
      "A cluster of miniature roses and trailing leaves on a black oval base, set on an adjustable gold-tone band.",
    images: [21],
    variants: [{ price: 155000, stock: 6 }],
  },
  {
    slug: "powder-pink-jhumkay",
    name: "Powder Pink Jhumkay",
    category: "jhumkay",
    featured: true,
    description:
      "Soft powder-pink florals on classic jhumka drops — traditional shape, handmade detail.",
    images: [5, 4],
    variants: [
      { optionName: "Base", optionValue: "Golden base", price: 285000, stock: 4 },
      { optionName: "Base", optionValue: "Silver base", price: 285000, stock: 4 },
    ],
  },
  {
    slug: "royal-blue-jhumkay",
    name: "Royal Blue Jhumkay",
    category: "jhumkay",
    description:
      "Rich royal blue blooms with gold accents, finished as a full jhumka drop.",
    images: [6, 7],
    variants: [{ price: 285000, stock: 3 }],
  },
  {
    slug: "azure-bloom-necklace",
    name: "Azure Bloom Necklace",
    category: "necklaces",
    featured: true,
    description:
      "A spray of blue and white florals on a fine chain — the piece that started the Azure range.",
    images: [9, 10],
    variants: [{ price: 350000, stock: 2 }],
  },
  {
    slug: "wildflower-meadow-necklace",
    name: "Wildflower Meadow Necklace",
    category: "necklaces",
    description:
      "Mixed wildflowers in soft pastels, arranged as a gentle asymmetric spray.",
    images: [8],
    variants: [{ price: 350000, stock: 3 }],
  },
  {
    slug: "pearl-blossom-pendant-set",
    name: "Pearl Blossom Pendant Set",
    category: "pendants",
    description:
      "A matching pendant and earring set with clustered blossoms and pearl centres.",
    images: [13, 14],
    variants: [
      { optionName: "Base", optionValue: "Golden base", price: 300000, stock: 2 },
      { optionName: "Base", optionValue: "Silver base", price: 300000, stock: 1 },
    ],
  },
  {
    slug: "lilac-hanging-bead-earrings",
    name: "Lilac Hanging Bead Earrings",
    category: "earrings",
    description:
      "Lilac florals above a fall of tiny glass beads — movement with every turn of the head.",
    images: [19, 18],
    variants: [{ price: 300000, stock: 4 }],
  },
  {
    slug: "one-tone-white-earrings",
    name: "One Tone White Earrings",
    category: "earrings",
    description:
      "Understated all-white florals for brides and anyone who prefers quiet detail.",
    images: [17],
    variants: [{ price: 189000, stock: 7 }],
  },
  {
    slug: "daisy-meadow-ring",
    name: "Daisy Meadow Ring",
    category: "rings",
    description:
      "A scatter of tiny daisies across an oval base, on an adjustable band.",
    images: [16],
    variants: [{ price: 155000, stock: 5 }],
  },
  {
    slug: "rosevine-ring",
    name: "Rosevine Ring",
    category: "rings",
    description:
      "Roses trailing along a vine, wrapped around an adjustable gold-tone band.",
    images: [15],
    variants: [{ price: 155000, stock: 4 }],
  },
  {
    slug: "pearl-charm-bracelet",
    name: "Pearl Charm Bracelet",
    category: "bracelets",
    description:
      "Freshwater pearls and a single clay blossom charm on a delicate chain.",
    images: [3],
    variants: [{ price: 210000, stock: 5 }],
  },
  {
    slug: "sweetheart-bloom-necklace",
    name: "Sweetheart Bloom Necklace",
    category: "necklaces",
    description:
      "A heart-shaped frame filled with hand-rolled roses in soft pinks.",
    images: [23, 24],
    variants: [
      { optionName: "Base", optionValue: "Golden base", price: 350000, stock: 2 },
      { optionName: "Base", optionValue: "Silver base", price: 350000, stock: 2 },
    ],
  },
];

async function main() {
  console.log("Clearing existing catalogue…");
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.variant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  console.log("Seeding categories…");
  const categoryIdBySlug = new Map<string, string>();
  for (const [index, category] of CATEGORIES.entries()) {
    const created = await db.category.create({
      data: { ...category, sortOrder: index },
    });
    categoryIdBySlug.set(category.slug, created.id);
  }

  console.log("Seeding products…");
  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.category);
    if (!categoryId) throw new Error(`Unknown category: ${product.category}`);

    await db.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        categoryId,
        isFeatured: product.featured ?? false,
        images: {
          create: product.images.map((n, i) => ({
            url: img(n),
            alt: product.name,
            sortOrder: i,
          })),
        },
        variants: {
          create: product.variants.map((variant, i) => ({
            optionName: "optionName" in variant ? variant.optionName : null,
            optionValue: "optionValue" in variant ? variant.optionValue : null,
            pricePaisa: variant.price,
            stock: variant.stock,
            sortOrder: i,
          })),
        },
      },
    });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@claycreations.pk";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  console.log(`Seeding admin user (${email})…`);
  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 10) },
    create: { email, passwordHash: await bcrypt.hash(password, 10) },
  });

  const counts = {
    categories: await db.category.count(),
    products: await db.product.count(),
    variants: await db.variant.count(),
  };
  console.log("Done:", counts);
  console.log(`\nAdmin login: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
