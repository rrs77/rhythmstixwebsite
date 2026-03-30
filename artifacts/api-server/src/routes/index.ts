import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import contentRouter from "./content";
import productsRouter from "./products";
import testimonialsRouter from "./testimonials";
import navLinksRouter from "./nav-links";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contentRouter);
router.use(productsRouter);
router.use(testimonialsRouter);
router.use(navLinksRouter);

export default router;
