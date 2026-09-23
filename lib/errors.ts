export class ForbiddenError extends Error { readonly status = 403; constructor(m = 'Forbidden') { super(m); } }
export class NotFoundError extends Error { readonly status = 404; constructor(m = 'Not found') { super(m); } }
export class ConflictError extends Error { readonly status = 409; constructor(m = 'Conflict') { super(m); } }
