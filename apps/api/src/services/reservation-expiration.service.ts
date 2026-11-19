
import { pool } from "../config/db.js";

export const expireOneReservation = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const reservationResult = await client.query(
            `SELECT id
             FROM reservations
             WHERE status = 'pending'
               AND expires_at <= NOW()
             ORDER BY expires_at, id
             LIMIT 1
             FOR UPDATE SKIP LOCKED
             `
        );

        if (reservationResult.rows.length === 0) {
            await client.query("COMMIT");
            return null;
        }
        const reservations = reservationResult.rows[0];
        if (!reservations) {
            throw new Error("Reservation not found");
        }
        const reservationId = reservations.id;

        await client.query(
            `SELECT id
             FROM event_seats
             WHERE reservation_id = $1
               AND status = 'reserved'
             ORDER BY id
             FOR UPDATE`,
            [reservationId]
        );

        const recheckResult = await client.query(
          `SELECT status,
       expires_at,
       expires_at <= clock_timestamp() AS is_expired
FROM reservations
WHERE id = $1`,
          [reservationId]
        );

        const reservation = recheckResult.rows[0];

        if (!reservation || reservation.status !== "pending" || !reservation.is_expired) {
    await client.query("COMMIT");
    return null;
}

        await client.query(
            `UPDATE event_seats
             SET status = 'available',
                 reservation_id = NULL,
                 hold_expires_at = NULL
             WHERE reservation_id = $1
               AND status = 'reserved'`,
            [reservationId]
        );

        await client.query(
            `UPDATE reservations
             SET status = 'expired',
                 updated_at = NOW()
             WHERE id = $1`,
            [reservationId]
        );

        await client.query("COMMIT");

        return reservationId;

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Error occurred while rolling back transaction:", rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
};
