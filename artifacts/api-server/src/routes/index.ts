import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import contentRouter from "./content";
import productsRouter from "./products";
import testimonialsRouter from "./testimonials";
import navLinksRouter from "./nav-links";
import woocommerceRouter from "./woocommerce";
import shopRouter from "./shop";
import contactRouter from "./contact";
import forumRouter from "./forum";
import socialRouter from "./social";
import pagesRouter from "./pages";
import appsRouter from "./apps";
import blogPostsRouter from "./blog-posts";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contentRouter);
router.use(productsRouter);
router.use(testimonialsRouter);
router.use(navLinksRouter);
// shopRouter MUST be registered before woocommerceRouter — they overlap on
// /shop/orders (the new local+Stripe handlers replace the old WC ones) and
// Express dispatches the first matching route.
router.use(shopRouter);
router.use(woocommerceRouter);
router.use(contactRouter);
router.use(forumRouter);
router.use(socialRouter);
router.use(pagesRouter);
router.use(appsRouter);
router.use(blogPostsRouter);
router.use(uploadsRouter);

export default router;
