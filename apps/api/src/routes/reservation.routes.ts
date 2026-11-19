import { Router } from "express";
import { createReservation } from "../controllers/reservation.controller.js";

const router = Router();

router.post("/", createReservation);

export default router;