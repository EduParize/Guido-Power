export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, string | number | boolean>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class NotificationError extends AppError {
  constructor(eventoId: string, resultadoEnvio: "REJEITADO" | "INCERTO") {
    const message = resultadoEnvio === "INCERTO"
      ? "Evento salvo, mas o resultado do envio da mensagem é incerto. Um reenvio manual pode duplicar a mensagem externa."
      : "Evento salvo, mas a mensagem não foi enviada";
    super(message, 502, { eventoId, resultadoEnvio });
    this.name = "NotificationError";
  }
}
