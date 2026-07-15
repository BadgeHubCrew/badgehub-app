import { ORPCError } from "@orpc/server";

export function notFound(reason: string): never {
  throw new ORPCError("NOT_FOUND", {
    status: 404,
    message: reason,
    data: { reason },
  });
}

export function forbidden(reason: string): never {
  throw new ORPCError("FORBIDDEN", {
    status: 403,
    message: reason,
    data: { reason },
  });
}

export function conflict(reason: string): never {
  throw new ORPCError("CONFLICT", {
    status: 409,
    message: reason,
    data: { reason },
  });
}

export function badRequest(reason: string): never {
  throw new ORPCError("BAD_REQUEST", {
    status: 400,
    message: reason,
    data: { reason },
  });
}
