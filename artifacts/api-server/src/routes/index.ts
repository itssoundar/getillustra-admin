import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import dashboardRouter from "./dashboard";
import projectsRouter from "./projects";
import assetsRouter from "./assets";
import categoriesRouter from "./categories";
import stylesRouter from "./styles";
import tagsRouter from "./tags";
import usersRouter from "./users";
import analyticsRouter from "./analytics";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(dashboardRouter);
router.use(projectsRouter);
router.use(assetsRouter);
router.use(categoriesRouter);
router.use(stylesRouter);
router.use(tagsRouter);
router.use(usersRouter);
router.use(analyticsRouter);
router.use(settingsRouter);

export default router;
