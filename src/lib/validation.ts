// src/lib/validation.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim()
    .min(2, "Nom : 2 caractères minimum"),
  email: z.string().trim().toLowerCase()
    .email("Email invalide"),
  password: z.string()
    .min(8, "Mot de passe : 8 caractères minimum"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase()
    .email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const studentCreateSchema = registerSchema;

export const studentPatchSchema = z.object({
  name: z.string().trim().min(2, "Nom : 2 caractères minimum").optional(),
  email: z.string().trim().toLowerCase().email("Email invalide").optional(),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").optional(),
  role: z.enum(["ADMIN", "ENSEIGNANT", "ETUDIANT"]).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "Au moins un champ doit être fourni"
);