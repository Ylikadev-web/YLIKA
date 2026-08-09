"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { setRequisitoCumple } from "@/lib/db/requisitos";

export async function setRequisitoCumpleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const requisitoId = String(formData.get("requisitoId") || "");
  const expedienteId = String(formData.get("expedienteId") || "");
  const raw = String(formData.get("cumple") ?? "");
  const cumple = raw === "" ? null : raw === "1";
  const motivo = String(formData.get("motivo") || "") || null;
  if (!requisitoId) throw new Error("Requisito requerido");

  await setRequisitoCumple(requisitoId, cumple, motivo);
  if (expedienteId) {
    revalidatePath(`/app/comercial/${expedienteId}`);
  }
  revalidatePath("/app/licitaciones");
}
