import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as ctrl from "./bookings.controller.js";

export const resourcesRouter = Router();
// Any authenticated user can view resources
resourcesRouter.get("/", requireAuth, ctrl.listResources);
resourcesRouter.get("/:id/bookings", requireAuth, ctrl.getResourceBookings);

export const bookingsRouter = Router();
// Any authenticated user can book and view their bookings
bookingsRouter.post("/", requireAuth, ctrl.createBooking);
bookingsRouter.patch("/:id", requireAuth, ctrl.updateBooking);
bookingsRouter.post("/:id/request-reschedule", requireAuth, ctrl.requestReschedule);

export const myBookingsRouter = Router();
myBookingsRouter.get("/", requireAuth, ctrl.listMyBookings);
