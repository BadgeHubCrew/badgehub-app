import { z } from "zod";

export const NO_BODY_DESCRIPTION = "No Request Body for this request";
export const NO_BODY_SCHEMA = z.any().optional().describe(NO_BODY_DESCRIPTION);
