import express from "express";
import {
  searchAll,
  searchUsers,
  searchVideos,
  getTrendingKeywords,
} from "../controllers/searchController";

const router = express.Router();

router.get("/", searchAll);
router.get("/users", searchUsers);
router.get("/videos", searchVideos);
router.get("/trending", getTrendingKeywords);

export default router;
