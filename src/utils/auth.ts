import { createClient } from "@supabase/supabase-js";

// إنشاء عميل Supabase باستخدام المتغيرات البيئية
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// دالة للتحقق من المصادقة
export async function requireSupabaseAuth(req: Request) {
  // استخراج التوكن من الهيدر
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  // التحقق من المستخدم عبر Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}
