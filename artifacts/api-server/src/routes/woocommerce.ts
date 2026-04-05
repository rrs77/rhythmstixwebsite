import { Router, type Request, type Response } from "express";

const router = Router();

const WC_BASE = "https://www.rhythmstix.co.uk/wp-json/wc/v3";
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

const WC_AUTH_HEADER = `Basic ${Buffer.from(`${WC_KEY || ""}:${WC_SECRET || ""}`).toString("base64")}`;

function wcUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WC_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

function wcFetch(endpoint: string, params: Record<string, string> = {}) {
  return fetch(wcUrl(endpoint, params), {
    headers: { Authorization: WC_AUTH_HEADER },
  });
}

const wcCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function cachedWcFetch(endpoint: string, params: Record<string, string> = {}) {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  const cached = wcCache.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  const response = await wcFetch(endpoint, params);
  if (!response.ok) {
    throw new Error(`WC API error: ${response.status}`);
  }
  const data = await response.json();
  wcCache.set(key, { data, expires: Date.now() + CACHE_TTL });
  return data;
}

interface ProductFamily {
  id: string;
  title: string;
  description: string;
  categorySlugs: string[];
  representativeSlug: string;
  priceLabel: string;
}

const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    id: "guide-the-way",
    title: "Guide The Way",
    description: "A complete KS2 musical production with songs, script, choreography, and backing tracks. Available as individual components or a full package.",
    categorySlugs: ["gtw"],
    representativeSlug: "gtw-licence-re-verse-lyric-and-dance-viewer-script-and-score-pdf-and-all-audio-files",
    priceLabel: "From £10",
  },
  {
    id: "bandlab-lets-get-started",
    title: "BandLab Let's Get Started",
    description: "A step-by-step guide to using BandLab for music creation in the classroom. Ideal for KS2/KS3 music teachers getting started with digital music-making.",
    categorySlugs: ["getstarted"],
    representativeSlug: "lgs",
    priceLabel: "£30",
  },
  {
    id: "sneaky-creatures",
    title: "Sneaky Creatures",
    description: "A free, fun song resource for early years and KS1. Includes vocal and backing track versions ready to download.",
    categorySlugs: [],
    representativeSlug: "sneaky-creatures",
    priceLabel: "Free",
  },
];

router.get("/shop/products", async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || "";
    const grouped = req.query.grouped === "true";
    const params: Record<string, string> = {
      per_page: "100",
      status: "publish",
      orderby: "menu_order",
      order: "asc",
    };
    if (category) params.category = category;

    const products = await cachedWcFetch("products", params);

    const allProducts = (products as any[]).filter((p: any) => p.type !== "variation");

    if (grouped) {
      const families = PRODUCT_FAMILIES.map((family) => {
        const rep = allProducts.find((p: any) => p.slug === family.representativeSlug);

        return {
          id: family.id,
          title: family.title,
          description: family.description,
          priceLabel: family.priceLabel,
          image: rep?.images?.[0] ? { src: rep.images[0].src, alt: rep.images[0].alt } : null,
          permalink: rep?.permalink || null,
        };
      });

      res.json(families);
      return;
    }

    const mapped = allProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      price: p.price,
      regularPrice: p.regular_price,
      salePrice: p.sale_price,
      onSale: p.on_sale,
      downloadable: p.downloadable || false,
      virtual: p.virtual || false,
      purchasable: p.purchasable !== false,
      description: p.short_description || p.description,
      permalink: p.permalink,
      images: p.images.map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      })),
      categories: p.categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      attributes: p.attributes.map((a: any) => ({
        name: a.name,
        options: a.options,
      })),
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shop/categories", async (_req: Request, res: Response) => {
  try {
    const response = await wcFetch("products/categories", {
      per_page: "50",
      orderby: "name",
      order: "asc",
      hide_empty: "true",
    });
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch categories" });
      return;
    }
    const categories = await response.json();

    const mapped = (categories as any[]).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
      image: c.image ? { src: c.image.src, alt: c.image.alt } : null,
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shop/orders", async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    if (!session?.user) {
      res.status(401).json({ error: "You must be logged in to place an order" });
      return;
    }

    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    const orderData = {
      payment_method: "cod",
      payment_method_title: "Direct",
      set_paid: false,
      billing: {
        first_name: session.user.first_name || "",
        last_name: session.user.last_name || "",
        email: session.user.email,
      },
      line_items: [
        {
          product_id: productId,
          quantity,
        },
      ],
      customer_id: session.user.id || 0,
    };

    const productRes = await wcFetch(`products/${productId}`);
    if (productRes.ok) {
      const product = await productRes.json() as any;
      const price = parseFloat(product.price);
      if (price === 0 || isNaN(price)) {
        orderData.set_paid = true;
      }
    }

    const response = await fetch(wcUrl("orders"), {
      method: "POST",
      headers: {
        Authorization: WC_AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      res.status(response.status).json({ error: "Failed to create order", details: errData });
      return;
    }

    const order = await response.json() as any;

    res.json({
      orderId: order.id,
      status: order.status,
      total: order.total,
      paymentUrl: order.payment_url || null,
      downloads: order.line_items?.flatMap((item: any) =>
        (item.downloads || []).map((d: any) => ({
          name: d.name,
          url: d.download_url,
        }))
      ) || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shop/orders", async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    if (!session?.user) {
      res.status(401).json({ error: "You must be logged in" });
      return;
    }

    const customerId = session.user.id;
    if (!customerId) {
      res.json([]);
      return;
    }

    const response = await wcFetch("orders", {
      customer: String(customerId),
      per_page: "50",
      orderby: "date",
      order: "desc",
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch orders" });
      return;
    }

    const orders = await response.json() as any[];

    const mapped = orders.map((o: any) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      dateCreated: o.date_created,
      items: o.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        productId: item.product_id,
        downloads: (item.downloads || []).map((d: any) => ({
          name: d.name,
          url: d.download_url,
        })),
      })),
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
