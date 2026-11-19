import { pool } from "../config/db.js";

export const createReservation = async (
    eventId: string,
    seatIds: string[],
    userId: string,
) => {
    const now = new Date();
    if (seatIds.length === 0) {
        throw new Error("No seats selected");
    }
    
    const uniqueSeatIds = [...new Set(seatIds)];
    if (uniqueSeatIds.length !== seatIds.length) {
        throw new Error("Duplicate seat IDs found");
    }   

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
    `SELECT
        es.id,
        es.status,
        es.reservation_id,
        r.status AS reservation_status,
        r.expires_at
     FROM event_seats es
     LEFT JOIN reservations r
        ON es.reservation_id = r.id
     WHERE es.id = ANY($1::uuid[])
       AND es.event_id = $2
     ORDER BY es.id
     FOR UPDATE OF es`,
    [seatIds, eventId]
);
        if(result.rows.length !== seatIds.length) {
            throw new Error("One or more seats are invalid");
        }
        const unavailableSeats = result.rows.filter((seat) => {
            if (seat.status === "sold") {
                return true;
            }
            if (seat.status === "reserved") {
               if (
            seat.reservation_status !== "pending" ||
            !seat.expires_at ||
            new Date(seat.expires_at) > now
        ) {
            return true;
        }
            }
            return false;
        });
        if (unavailableSeats.length > 0) {
            throw new Error("One or more seats are invalid");
        }

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};