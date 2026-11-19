import { Request, Response } from "express";
export const createReservation = async (req: Request, res: Response) => {
    res.status(201).json({ message: "Reservation request recieved successfully" });
};