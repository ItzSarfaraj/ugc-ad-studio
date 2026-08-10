// Defining Express datatypes

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      plan?: string;
      file: any;
    }
  }
}

export {};