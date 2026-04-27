import { randomUUID } from "node:crypto";

function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase();
}

export function newFeedbackId(): string {
  return newId();
}

export function newThreadId(): string {
  return newId();
}

export function newJobId(): string {
  return newId();
}
