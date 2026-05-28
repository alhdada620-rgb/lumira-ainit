
import { requireSupabaseAuth } from "@/utils/auth";

// Handler للموافقة على الدفع
export async function approvePiPayment(req, res) {
  const user = await requireSupabaseAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // منطق الموافقة على الدفع
  return res.status(200).json({ message: "Payment approved", user });
}

// Handler لإتمام الدفع
export async function completePiPayment(req, res) {
  const user = await requireSupabaseAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // منطق إتمام الدفع
  return res.status(200).json({ message: "Payment completed", user });
}
