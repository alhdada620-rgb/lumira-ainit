import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "lumira:lang";

type Dict = Record<string, string>;

const en: Dict = {
  // Header
  "brand.name": "LUMIRA",
  "brand.tagline": "Health & Elegance",
  "header.systemOnline": "System Online · Mirror v2.4",
  "header.langSwitch": "العربية",
  "header.langSwitchAria": "Switch to Arabic",

  // Footer
  "footer.developedBy": "Developed & Designed by",
  "footer.copyright": "© {year} · LUMIRA SMART MIRROR",

  // Daily dashboard
  "dashboard.localTime": "Local Time",
  "dashboard.weather.condition": "Partly Cloudy · Cairo",
  "dashboard.weather.h": "H",
  "dashboard.weather.l": "L",
  "dashboard.weather.hum": "Hum",
  "dashboard.wallet.title": "Pi Network Wallet",
  "dashboard.wallet.today": "TODAY",

  // Skin analysis
  "skin.title": "AI Skin Analysis",
  "skin.metric.hydration": "Hydration",
  "skin.metric.smoothness": "Smoothness",
  "skin.metric.skinTone": "Skin Tone",
  "skin.tapHint": "Tap a gauge to simulate a new reading",
  "skin.aiInsight": "AI Insight:",
  "skin.thinking": "Lumira is thinking…",
  "skin.analyzing": "Analyzing your skin profile…",
  "skin.unable": "Unable to generate insight right now.",
  "skin.refresh": "Refresh insight",
  "skin.recent": "Recent insights",
  "skin.error.rate_limit": "Rate limited · retry soon",
  "skin.error.payment_required": "AI credits exhausted",
  "skin.error.missing_key": "AI not configured",
  "skin.error.gateway_error": "Service unavailable",
  "skin.error.network_error": "Service unavailable",
  "skin.cmd.newInsight": "New insight generated",
  "skin.cmd.rateLimit": "Rate limited",
  "skin.cmd.creditsOut": "AI credits exhausted",
  "skin.cmd.notConfigured": "AI not configured",
  "skin.cmd.gatewayError": "AI gateway error",
  "skin.cmd.networkError": "Network error",
  "skin.gauge.tapTitle": "Tap to simulate a new {label} reading",
  "skin.gauge.aria": "Simulate new {label} reading. Current value {value}",

  // Health vitals
  "vitals.title": "Health Vitals",
  "vitals.heartRate": "Heart Rate",
  "vitals.bpm": "BPM",
  "vitals.sleep": "Sleep",
  "vitals.steps": "Steps",
  "vitals.appleWatch": "Apple Watch · Connected",
  "vitals.synced": "Synced 2m ago",

  // Virtual Try-On
  "tryon.title": "Virtual Try-On · AR",
  "tryon.live": "AR · Live",
  "tryon.preview": "AR Preview",
  "tryon.match": "Match · 94%",
  "tryon.live.btn": "Live",
  "tryon.starting": "…",
  "tryon.outfit.aurora": "Aurora Coat",
  "tryon.outfit.aurora.tag": "Couture",
  "tryon.outfit.nebula": "Nebula Silk",
  "tryon.outfit.nebula.tag": "Evening",
  "tryon.outfit.solstice": "Solstice Knit",
  "tryon.outfit.solstice.tag": "Casual",
  "tryon.cmd.nowShowing": "Now showing {name}",
  "tryon.cmd.trying": "Trying {brand} · {name}",

  // Virtual Wardrobe
  "wardrobe.title": "Virtual Wardrobe",
  "wardrobe.search": "Search items, brands, occasions… (Esc to clear)",
  "wardrobe.clearSearch": "Clear search",
  "wardrobe.clearSearchTitle": "Clear search (Esc)",
  "wardrobe.cat.all": "All",
  "wardrobe.cat.zara": "Zara · M & W",
  "wardrobe.cat.hm": "H&M · Casual",
  "wardrobe.cat.nike": "Nike · Sport",
  "wardrobe.cat.arabic": "Arabic Elegance",
  "wardrobe.view.grid": "Grid view",
  "wardrobe.view.list": "List view",
  "wardrobe.view.aria": "Wardrobe view",
  "wardrobe.empty.title": "No matches",
  "wardrobe.empty.subtitle": "Try a different brand or keyword",
  "wardrobe.tryOn": "Try On",
  "wardrobe.sent": "Sent",
  "wardrobe.sentToAR": "Sent to AR",

  // Voice Visualizer
  "voice.title": "Voice Assistant",
  "voice.notSupported": "Not supported in this browser",
  "voice.listening": "Listening…",
  "voice.tapHint": "Tap mic or a preset",
  "voice.stop": "Stop",
  "voice.listen": "Listen",
  "voice.placeholder": "Say or tap a command below",
  "voice.quickCommands": "Quick commands",
  "voice.startAria": "Start listening",
  "voice.stopAria": "Stop listening",
  "voice.micDenied": "Microphone access denied",
  "voice.preset.analyzeSkin": "Analyze my skin",
  "voice.preset.analyzeSkin.phrase": "Lumira, analyze my skin",
  "voice.preset.analyzeSkin.feedback": "Analyzing your skin…",
  "voice.preset.startMirror": "Start mirror",
  "voice.preset.startMirror.phrase": "Lumira, start the mirror",
  "voice.preset.startMirror.feedback": "Activating the mirror…",
  "voice.preset.stopMirror": "Stop mirror",
  "voice.preset.stopMirror.phrase": "Stop the mirror",
  "voice.preset.stopMirror.feedback": "Stopping the mirror…",
  "voice.preset.connectPi": "Connect Pi wallet",
  "voice.preset.connectPi.phrase": "Connect Pi wallet",
  "voice.preset.connectPi.feedback": "Connecting your Pi wallet…",
  "voice.preset.nextOutfit": "Next outfit",
  "voice.preset.nextOutfit.phrase": "Show me the next outfit",
  "voice.preset.nextOutfit.feedback": "Switching outfit…",

  // Mirror Camera
  "mirror.title": "Smart Mirror · Live",
  "mirror.standby": "Mirror standby",
  "mirror.live": "Live Feed",
  "mirror.offline": "Offline",
  "mirror.startBtn": "Start Mirror",
  "mirror.starting": "Starting…",
  "mirror.stopBtn": "Stop Mirror",
  "mirror.softGlow": "Soft glow filter · enhanced",
  "mirror.activate": "Activate the front camera",
  "mirror.ar.cleared": "AR Cleared",
  "mirror.ar.saved": "AR Saved · {kind}",
  "mirror.ar.noOverlay": "No overlay applied",
  "mirror.ar.clear": "Clear",
  "mirror.ar.reset": "Reset",
  "mirror.ar.resetTitle": "Reset AR overlay (adds to history — undo to restore)",
  "mirror.ar.undo": "Undo AR overlay change",
  "mirror.ar.redo": "Redo AR overlay change",
  "mirror.ar.fineTune": "Fine-Tune Fit",
  "mirror.ar.recenter": "Recenter",
  "mirror.ar.scale": "Scale",
  "mirror.ar.offsetX": "Offset X",
  "mirror.ar.offsetY": "Offset Y",
  "mirror.ar.snapOn": "Snap On",
  "mirror.ar.snapOff": "Snap Off",
  "mirror.ar.snapTitle": "Snap to nearest alignment step",
  "mirror.ar.presets": "Presets",
  "mirror.ar.preset.shoulders": "Shoulders",
  "mirror.ar.preset.torso": "Torso",
  "mirror.ar.preset.hips": "Hips",
  "mirror.ar.preset.full": "Full Body",
  "mirror.ar.preset.lipsCenter": "Center",
  "mirror.ar.preset.lipsUpper": "Upper Lip",
  "mirror.ar.preset.lipsWide": "Wide",
  "mirror.ar.preset.cheeksNatural": "Natural",
  "mirror.ar.preset.cheeksHigh": "High Cheek",
  "mirror.ar.preset.cheeksBroad": "Broad",
  "mirror.ar.preset.eyesNatural": "Natural",
  "mirror.ar.preset.eyesCat": "Cat Eye",
  "mirror.ar.preset.eyesSoft": "Soft Line",
  "mirror.cmd.alreadyLive": "Mirror already live",
  "mirror.cmd.activated": "Front camera activated",
  "mirror.cmd.unavailable": "Camera unavailable",
  "mirror.cmd.cameraError": "Camera error",
  "mirror.cmd.alreadyOff": "Mirror is already off",
  "mirror.cmd.stopped": "Mirror stopped",

  // Pi Wallet
  "wallet.title": "Pi Wallet · Web3",
  "wallet.network": "π Network",
  "wallet.liveBalance": "Live balance · ready to spend",
  "wallet.today": "TODAY",
  "wallet.copy": "Copy",
  "wallet.copied": "Copied",
  "wallet.unlocked": "Unlocked with Pi · {count}",
  "wallet.connect": "Connect Pi Wallet",
  "wallet.authorizing": "Authorizing…",
  "wallet.authenticated": "Authenticated",
  "wallet.disconnect": "Disconnect",
  "wallet.simulatedNote": "Simulated Pi SDK flow — replace with",
  "wallet.simulatedSuffix": "for live mainnet integration.",
  "wallet.cmd.alreadyConnected": "Wallet already connected",
  "wallet.cmd.inProgress": "Connection in progress",
  "wallet.cmd.authedAs": "Authenticated as @{user}",

  // Command Log
  "log.title": "Command Log · Last 5",
  "log.empty.title": "No commands yet",
  "log.empty.subtitle": "Tap a preset chip or speak a command",
  "log.cmd.analyzeSkin": "Analyze skin",
  "log.cmd.startMirror": "Start mirror",
  "log.cmd.stopMirror": "Stop mirror",
  "log.cmd.connectPi": "Connect Pi wallet",
  "log.cmd.nextOutfit": "Next outfit",
  "log.cmd.tryOn": "Try on item",

  // Smart Catalog
  "catalog.title": "Smart Catalog · Branded Libraries",
  "catalog.tab.wardrobe": "Wardrobe",
  "catalog.tab.makeup": "Makeup Studio",
  "catalog.activateMirror": "Activate Mirror for AR",
  "catalog.starting": "Starting…",
  "catalog.brand.namshiArabic": "Namshi · Arabic",
  "catalog.cat.lipstick": "Lipstick",
  "catalog.cat.eyeliner": "Eyeliner",
  "catalog.cat.blush": "Blush",
  "catalog.premium": "Premium",
  "catalog.unlock": "Unlock",
  "catalog.tryOn": "Try On",
  "catalog.sentMirror": "Sent to Mirror",
  "catalog.appliedMirror": "Applied to Mirror",
  "catalog.payTitle": "Pay with your Pi balance",
  "catalog.insufficient": "Insufficient π balance",
  "catalog.unlocked": "Unlocked · −{price} π",
  "catalog.alreadyUnlocked": "Already unlocked",
  "catalog.footnote.tap": "Tap",
  "catalog.footnote.body": "to project a brand placeholder onto the live mirror feed. Premium pieces unlock instantly with your",
  "catalog.footnote.suffix": "balance — no fiat conversion.",

  // Pi Verification
  "piverif.label.verified": "Verified",
  "piverif.label.checking": "Checking…",
  "piverif.label.mismatch": "Mismatch",
  "piverif.label.unreachable": "Unreachable",
  "piverif.title": "Pi Verification:",
  "piverif.placeholder": "https://your-domain.com (leave blank for current site)",
  "piverif.verify": "Verify",
  "piverif.autofix": "Auto-fix",
  "piverif.clear": "Clear",
  "piverif.openFile": "Open file",
  "piverif.target": "Target:",
  "piverif.lastChecked": "Last checked {time}",
  "piverif.autofixHint": "Tap",
  "piverif.autofixHint.use": "to use",
};

const ar: Dict = {
  // Header
  "brand.name": "لوميرا",
  "brand.tagline": "صحة وأناقة",
  "header.systemOnline": "النظام متصل · المرآة v2.4",
  "header.langSwitch": "English",
  "header.langSwitchAria": "Switch to English",

  // Footer
  "footer.developedBy": "تصميم وتطوير",
  "footer.copyright": "© {year} · مرآة لوميرا الذكية",

  // Daily dashboard
  "dashboard.localTime": "الوقت المحلي",
  "dashboard.weather.condition": "غائم جزئيًا · القاهرة",
  "dashboard.weather.h": "ع",
  "dashboard.weather.l": "د",
  "dashboard.weather.hum": "رطوبة",
  "dashboard.wallet.title": "محفظة شبكة Pi",
  "dashboard.wallet.today": "اليوم",

  // Skin analysis
  "skin.title": "تحليل البشرة بالذكاء الاصطناعي",
  "skin.metric.hydration": "الترطيب",
  "skin.metric.smoothness": "النعومة",
  "skin.metric.skinTone": "لون البشرة",
  "skin.tapHint": "انقر على المؤشر لمحاكاة قراءة جديدة",
  "skin.aiInsight": "ملاحظة الذكاء الاصطناعي:",
  "skin.thinking": "لوميرا تفكر…",
  "skin.analyzing": "جاري تحليل ملف بشرتك…",
  "skin.unable": "تعذّر إنشاء التحليل الآن.",
  "skin.refresh": "تحديث التحليل",
  "skin.recent": "أحدث الملاحظات",
  "skin.error.rate_limit": "تم تجاوز الحد · حاول قريبًا",
  "skin.error.payment_required": "نفدت رصيد الذكاء الاصطناعي",
  "skin.error.missing_key": "الذكاء الاصطناعي غير مهيأ",
  "skin.error.gateway_error": "الخدمة غير متاحة",
  "skin.error.network_error": "الخدمة غير متاحة",
  "skin.cmd.newInsight": "تم إنشاء ملاحظة جديدة",
  "skin.cmd.rateLimit": "تم تجاوز الحد",
  "skin.cmd.creditsOut": "نفد رصيد الذكاء الاصطناعي",
  "skin.cmd.notConfigured": "الذكاء الاصطناعي غير مهيأ",
  "skin.cmd.gatewayError": "خطأ في بوابة الذكاء الاصطناعي",
  "skin.cmd.networkError": "خطأ في الشبكة",
  "skin.gauge.tapTitle": "انقر لمحاكاة قراءة {label} جديدة",
  "skin.gauge.aria": "محاكاة قراءة {label} جديدة. القيمة الحالية {value}",

  // Health vitals
  "vitals.title": "المؤشرات الصحية",
  "vitals.heartRate": "معدل ضربات القلب",
  "vitals.bpm": "نبضة/د",
  "vitals.sleep": "النوم",
  "vitals.steps": "الخطوات",
  "vitals.appleWatch": "Apple Watch · متصلة",
  "vitals.synced": "آخر مزامنة قبل دقيقتين",

  // Virtual Try-On
  "tryon.title": "تجربة افتراضية · واقع معزز",
  "tryon.live": "AR · مباشر",
  "tryon.preview": "معاينة AR",
  "tryon.match": "تطابق · 94%",
  "tryon.live.btn": "مباشر",
  "tryon.starting": "…",
  "tryon.outfit.aurora": "معطف أورورا",
  "tryon.outfit.aurora.tag": "كوتور",
  "tryon.outfit.nebula": "حرير نيبيولا",
  "tryon.outfit.nebula.tag": "سهرة",
  "tryon.outfit.solstice": "تريكو سولستيس",
  "tryon.outfit.solstice.tag": "كاجوال",
  "tryon.cmd.nowShowing": "يتم عرض {name}",
  "tryon.cmd.trying": "جاري تجربة {brand} · {name}",

  // Virtual Wardrobe
  "wardrobe.title": "خزانة افتراضية",
  "wardrobe.search": "ابحث عن قطع أو ماركات أو مناسبات… (Esc للمسح)",
  "wardrobe.clearSearch": "مسح البحث",
  "wardrobe.clearSearchTitle": "مسح البحث (Esc)",
  "wardrobe.cat.all": "الكل",
  "wardrobe.cat.zara": "Zara · رجال ونساء",
  "wardrobe.cat.hm": "H&M · كاجوال",
  "wardrobe.cat.nike": "Nike · رياضي",
  "wardrobe.cat.arabic": "الأناقة العربية",
  "wardrobe.view.grid": "عرض شبكي",
  "wardrobe.view.list": "عرض قائمة",
  "wardrobe.view.aria": "عرض الخزانة",
  "wardrobe.empty.title": "لا توجد نتائج",
  "wardrobe.empty.subtitle": "جرّب ماركة أو كلمة أخرى",
  "wardrobe.tryOn": "جرّب",
  "wardrobe.sent": "أُرسل",
  "wardrobe.sentToAR": "أُرسل إلى AR",

  // Voice Visualizer
  "voice.title": "المساعد الصوتي",
  "voice.notSupported": "غير مدعوم في هذا المتصفح",
  "voice.listening": "يستمع…",
  "voice.tapHint": "انقر الميكروفون أو أمرًا جاهزًا",
  "voice.stop": "إيقاف",
  "voice.listen": "استمع",
  "voice.placeholder": "تحدث أو انقر أمرًا أدناه",
  "voice.quickCommands": "أوامر سريعة",
  "voice.startAria": "ابدأ الاستماع",
  "voice.stopAria": "أوقف الاستماع",
  "voice.micDenied": "تم رفض الوصول إلى الميكروفون",
  "voice.preset.analyzeSkin": "حلّل بشرتي",
  "voice.preset.analyzeSkin.phrase": "لوميرا، حلّلي بشرتي",
  "voice.preset.analyzeSkin.feedback": "جاري تحليل بشرتك…",
  "voice.preset.startMirror": "تشغيل المرآة",
  "voice.preset.startMirror.phrase": "لوميرا، شغّلي المرآة",
  "voice.preset.startMirror.feedback": "تشغيل المرآة…",
  "voice.preset.stopMirror": "إيقاف المرآة",
  "voice.preset.stopMirror.phrase": "أوقفي المرآة",
  "voice.preset.stopMirror.feedback": "إيقاف المرآة…",
  "voice.preset.connectPi": "اربط محفظة Pi",
  "voice.preset.connectPi.phrase": "اربط محفظة Pi",
  "voice.preset.connectPi.feedback": "جاري ربط محفظة Pi…",
  "voice.preset.nextOutfit": "الإطلالة التالية",
  "voice.preset.nextOutfit.phrase": "اعرضي الإطلالة التالية",
  "voice.preset.nextOutfit.feedback": "تبديل الإطلالة…",

  // Mirror Camera
  "mirror.title": "المرآة الذكية · مباشر",
  "mirror.standby": "المرآة في وضع الاستعداد",
  "mirror.live": "بث مباشر",
  "mirror.offline": "غير متصلة",
  "mirror.startBtn": "تشغيل المرآة",
  "mirror.starting": "جاري التشغيل…",
  "mirror.stopBtn": "إيقاف المرآة",
  "mirror.softGlow": "فلتر التوهج الناعم · مفعل",
  "mirror.activate": "فعّل الكاميرا الأمامية",
  "mirror.ar.cleared": "تم مسح AR",
  "mirror.ar.saved": "AR محفوظ · {kind}",
  "mirror.ar.noOverlay": "لا توجد طبقة مطبقة",
  "mirror.ar.clear": "مسح",
  "mirror.ar.reset": "إعادة",
  "mirror.ar.resetTitle": "إعادة طبقة AR (يضاف للسجل — تراجع للاستعادة)",
  "mirror.ar.undo": "تراجع عن تغيير AR",
  "mirror.ar.redo": "إعادة تغيير AR",
  "mirror.ar.fineTune": "ضبط دقيق للملاءمة",
  "mirror.ar.recenter": "إعادة التوسيط",
  "mirror.ar.scale": "الحجم",
  "mirror.ar.offsetX": "إزاحة أفقية",
  "mirror.ar.offsetY": "إزاحة رأسية",
  "mirror.ar.snapOn": "الالتقاط مفعّل",
  "mirror.ar.snapOff": "الالتقاط متوقف",
  "mirror.ar.snapTitle": "الالتقاط لأقرب نقطة محاذاة",
  "mirror.ar.presets": "الإعدادات المسبقة",
  "mirror.ar.preset.shoulders": "الأكتاف",
  "mirror.ar.preset.torso": "الجذع",
  "mirror.ar.preset.hips": "الورك",
  "mirror.ar.preset.full": "كامل الجسم",
  "mirror.ar.preset.lipsCenter": "المنتصف",
  "mirror.ar.preset.lipsUpper": "الشفة العليا",
  "mirror.ar.preset.lipsWide": "عريض",
  "mirror.ar.preset.cheeksNatural": "طبيعي",
  "mirror.ar.preset.cheeksHigh": "خد مرتفع",
  "mirror.ar.preset.cheeksBroad": "عريض",
  "mirror.ar.preset.eyesNatural": "طبيعي",
  "mirror.ar.preset.eyesCat": "عين القطة",
  "mirror.ar.preset.eyesSoft": "خط ناعم",
  "mirror.cmd.alreadyLive": "المرآة تعمل بالفعل",
  "mirror.cmd.activated": "تم تفعيل الكاميرا الأمامية",
  "mirror.cmd.unavailable": "الكاميرا غير متاحة",
  "mirror.cmd.cameraError": "خطأ في الكاميرا",
  "mirror.cmd.alreadyOff": "المرآة متوقفة بالفعل",
  "mirror.cmd.stopped": "تم إيقاف المرآة",

  // Pi Wallet
  "wallet.title": "محفظة Pi · Web3",
  "wallet.network": "شبكة π",
  "wallet.liveBalance": "رصيد مباشر · جاهز للإنفاق",
  "wallet.today": "اليوم",
  "wallet.copy": "نسخ",
  "wallet.copied": "تم النسخ",
  "wallet.unlocked": "مفتوح بـ Pi · {count}",
  "wallet.connect": "اربط محفظة Pi",
  "wallet.authorizing": "جاري التفويض…",
  "wallet.authenticated": "تم التحقق",
  "wallet.disconnect": "قطع الاتصال",
  "wallet.simulatedNote": "محاكاة Pi SDK — استبدلها بـ",
  "wallet.simulatedSuffix": "للتكامل المباشر مع الشبكة الرئيسية.",
  "wallet.cmd.alreadyConnected": "المحفظة متصلة بالفعل",
  "wallet.cmd.inProgress": "الاتصال جارٍ",
  "wallet.cmd.authedAs": "تم التحقق كـ @{user}",

  // Command Log
  "log.title": "سجل الأوامر · آخر 5",
  "log.empty.title": "لا توجد أوامر بعد",
  "log.empty.subtitle": "انقر اختصارًا أو انطق أمرًا",
  "log.cmd.analyzeSkin": "تحليل البشرة",
  "log.cmd.startMirror": "تشغيل المرآة",
  "log.cmd.stopMirror": "إيقاف المرآة",
  "log.cmd.connectPi": "ربط محفظة Pi",
  "log.cmd.nextOutfit": "الإطلالة التالية",
  "log.cmd.tryOn": "تجربة قطعة",

  // Smart Catalog
  "catalog.title": "كتالوج ذكي · مكتبات الماركات",
  "catalog.tab.wardrobe": "الخزانة",
  "catalog.tab.makeup": "استوديو المكياج",
  "catalog.activateMirror": "فعّل المرآة لتجربة AR",
  "catalog.starting": "جاري التشغيل…",
  "catalog.brand.namshiArabic": "Namshi · عربي",
  "catalog.cat.lipstick": "أحمر شفاه",
  "catalog.cat.eyeliner": "كحل",
  "catalog.cat.blush": "أحمر خدود",
  "catalog.premium": "بريميوم",
  "catalog.unlock": "افتح",
  "catalog.tryOn": "جرّب",
  "catalog.sentMirror": "أُرسل للمرآة",
  "catalog.appliedMirror": "تم التطبيق على المرآة",
  "catalog.payTitle": "ادفع من رصيد Pi",
  "catalog.insufficient": "رصيد π غير كافٍ",
  "catalog.unlocked": "مفتوح · −{price} π",
  "catalog.alreadyUnlocked": "مفتوح بالفعل",
  "catalog.footnote.tap": "انقر",
  "catalog.footnote.body": "لإسقاط الماركة على بث المرآة. القطع البريميوم تُفتح فورًا برصيدك من",
  "catalog.footnote.suffix": "بدون تحويل لعملات ورقية.",

  // Pi Verification
  "piverif.label.verified": "موثّق",
  "piverif.label.checking": "جاري التحقق…",
  "piverif.label.mismatch": "غير مطابق",
  "piverif.label.unreachable": "غير متاح",
  "piverif.title": "تحقق Pi:",
  "piverif.placeholder": "https://your-domain.com (اتركه فارغًا للموقع الحالي)",
  "piverif.verify": "تحقق",
  "piverif.autofix": "إصلاح تلقائي",
  "piverif.clear": "مسح",
  "piverif.openFile": "فتح الملف",
  "piverif.target": "الهدف:",
  "piverif.lastChecked": "آخر فحص {time}",
  "piverif.autofixHint": "اضغط",
  "piverif.autofixHint.use": "لاستخدام",
};

const DICTS: Record<Lang, Dict> = { en, ar };

interface I18nCtx {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ar") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  // Reflect on <html> for RTL + accessibility
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "ar" : "en");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[lang];
      const template = dict[key] ?? DICTS.en[key] ?? key;
      return format(template, vars);
    },
    [lang],
  );

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggleLang,
      t,
    }),
    [lang, setLang, toggleLang, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback so components don't crash if used outside the provider
    return {
      lang: "en" as Lang,
      dir: "ltr" as const,
      setLang: () => {},
      toggleLang: () => {},
      t: (key: string, vars?: Record<string, string | number>) =>
        format(en[key] ?? key, vars),
    } satisfies I18nCtx;
  }
  return ctx;
}
