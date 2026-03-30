import { Router, type Request, type Response } from "express";

const router = Router();

const WC_BASE = "https://www.rhythmstix.co.uk/wp-json/wc/v3";
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

function wcUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WC_BASE}/${endpoint}`);
  url.searchParams.set("consumer_key", WC_KEY || "");
  url.searchParams.set("consumer_secret", WC_SECRET || "");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

router.get("/shop/products", async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || "";
    const params: Record<string, string> = {
      per_page: "100",
      status: "publish",
      orderby: "menu_order",
      order: "asc",
    };
    if (category) params.category = category;

    const response = await fetch(wcUrl("products", params));
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch products" });
      return;
    }
    const products = await response.json();

    const mapped = (products as any[]).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      price: p.price,
      regularPrice: p.regular_price,
      salePrice: p.sale_price,
      onSale: p.on_sale,
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
    const response = await fetch(wcUrl("products/categories", {
      per_page: "50",
      orderby: "name",
      order: "asc",
      hide_empty: "true",
    }));
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

export default router;
