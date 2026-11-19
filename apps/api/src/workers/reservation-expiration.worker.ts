
import { expireOneReservation } from "../services/reservation-expiration.service.js";
import { pool } from "../config/db.js";
import { setTimeout as delay } from "node:timers/promises";

const POLL_INTERVAL = 10_000;

let isShuttingDown = false;
const shutdownController = new AbortController();

const runWorker = async () => {
    console.log("Reservation expiration worker started");

    while (!isShuttingDown) {
        try {
            const reservationId = await expireOneReservation();

            if (reservationId) {
                console.log(`Expired reservation: ${reservationId}`);
            } else {
               await sleeper()
            }
        } catch (error) {

    console.error("Expiration worker error:", error);

    if (!isShuttingDown) {
       await sleeper()
    }
}
    }
    console.log("Reservation expiration worker stopped");
};

const shutdown =  (signal: string) => {
    if (isShuttingDown) return;

    console.log(`${signal} received. Shutting down worker...`);

    isShuttingDown = true;
    shutdownController.abort();

};

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

const main = async () => {
    try {
        await runWorker();
    }
    finally {
        await pool.end();
        console.log("Database connection pool closed.");
    }
};

const sleeper = async () => {
    try {
        await delay(POLL_INTERVAL, undefined, {
            signal: shutdownController.signal
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            // Ignore the abort error during shutdown
            return;
        } 
        throw error;
    }
}
await main();
