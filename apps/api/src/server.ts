import express from "express";
import { pool } from "./config/db.js";
import reservationRoutes from "./routes/reservation.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("TicketMaster API is running!");
});
app.use("/reservations", reservationRoutes);
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "healthy",
            database: "connected"
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            database: "disconnected"
        });
    }
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})

