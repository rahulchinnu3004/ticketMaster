
import { expireOneReservation } from "./services/reservation-expiration.service.js";
import { pool } from "./config/db.js";

try {
    const reservationId = await expireOneReservation();

    console.log("Expired reservation:", reservationId);
} catch (error) {
    console.error("Expiration failed:", error);
} finally {
    await pool.end();
}
