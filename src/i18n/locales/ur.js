/**
 * Urdu dictionary (primary language, RTL).
 * Nested namespaces — resolved by dotted keys: t('inv.searchPlaceholder').
 * Interpolation: t('welcome', { name }) → {{name}} replaced.
 * Plurals: t('key', { count }) → `key_one` / `key_other` variants.
 *
 * HOW TO ADD A KEY: add it here AND in locales/en.js, then use t('ns.key').
 */
export default {
  // App identity
  appName: 'المکہ ماربل فیکٹری مینجمنٹ',
  appShortName: 'المکہ ماربل',
  factoryName: 'المکہ ماربل فیکٹری',
  tagline: 'فیکٹری مینجمنٹ سسٹم',
  location: 'خیبر پختونخوا، پاکستان',
  version: 'ورژن 1.1.0',
  demoNote:
    'نوٹ: یہ صرف UI ڈیمو ہے — اصل ڈیٹا اور حساب کتاب آنے والے ورژن میں شامل ہوں گے۔',

  // Navigation
  nav: {
    home: 'ہوم',
    calculator: 'حساب کتاب',
    inventory: 'ذخیرہ',
    orders: 'آرڈرز',
    reports: 'رپورٹس',
    customers: 'گاہک',
    workers: 'ورکرز',
    expenses: 'اخراجات',
    notifications: 'اطلاعات',
    printPreview: 'پرنٹ پریویو',
    about: 'تعارف',
    settings: 'ترتیبات',
    login: 'لاگ ان',
    sectionMain: 'مرکزی',
    sectionManage: 'انتظام',
    sectionSystem: 'سسٹم',
  },

  // Common labels
  common: {
    save: 'محفوظ کریں',
    cancel: 'منسوخ',
    add: 'شامل کریں',
    edit: 'ترمیم',
    delete: 'حذف کریں',
    search: 'تلاش کریں',
    filter: 'فلٹر',
    export: 'ایکسپورٹ',
    print: 'پرنٹ',
    total: 'کل',
    date: 'تاریخ',
    size: 'سائز',
    quantity: 'تعداد',
    thickness: 'موٹائی',
    actions: 'اعمال',
    viewAll: 'سب دیکھیں',
    close: 'بند کریں',
    all: 'سب',
    menu: 'مینو',
    pieces: 'ٹکڑے',
    slabs: 'سلیبز',
    sqft: 'مربع فٹ',
    previous: 'پچھلا',
    next: 'اگلا',
    skipToContent: 'مواد پر جائیں',
    status: 'سٹیٹس',
    customer: 'گاہک',
    item: 'آئٹم',
    amount: 'رقم',
    category: 'قسم',
    name: 'نام',
    phone: 'فون',
    area: 'علاقہ',
    balance: 'بقیہ رقم',
    role: 'عہدہ',
    shift: 'شفٹ',
    attendance: 'حاضری',
    note: 'نوٹ',
  },

  // Home / Dashboard
  home: {
    welcome: 'خوش آمدید',
    todayDate: 'تاریخ: 14 ستمبر 2026',
    totalSlabs: 'کل سلیبز',
    todaysProduction: 'آج کی پیداواری',
    pendingOrders: 'زیر التوا آرڈرز',
    lowStockAlerts: 'کم ذخیرہ الرٹس',
    recentActivity: 'حالیہ سرگرمی',
    quickActions: 'فوری اقدامات',
    newCalculation: 'نیا حساب',
    viewInventory: 'ذخیرہ دیکھیں',
    generateReport: 'رپورٹ بنائیں',
    weeklyOverview: 'ہفتہ وار پیداواری',
    viewReports: 'رپورٹس دیکھیں',
  },

  // Calculator
  calc: {
    subtitle: 'کٹنگ سے پہلے ٹکڑوں کا اندازہ لگائیں',
    newCalculation: 'نیا حساب',
    slabLength: 'سلیب کی لمبائی',
    slabWidth: 'سلیب کی چوڑائی',
    pieceSize: 'مطلوبہ ٹکڑے کا سائز',
    quantity: 'تعداد',
    calculate: 'حساب لگائیں',
    result: 'نتیجہ',
    waste: 'ضائع',
    totalArea: 'کل رقبہ',
    piecesCount: 'ٹکڑوں کی تعداد',
    history: 'سابقہ حسابات',
    unitFeet: 'فٹ',
  },

  // Inventory
  inv: {
    subtitle: 'سلیب ذخیرے کی تفصیل اور انتظام',
    id: 'آئی ڈی',
    location: 'مقام',
    addNewSlab: 'نیا سلیب شامل کریں',
    searchPlaceholder: 'آئی ڈی یا سائز سے تلاش کریں…',
    filterSize: 'سائز کے مطابق',
    filterThickness: 'موٹائی کے مطابق',
    low: 'کم',
    modalTitle: 'نیا سلیب شامل کریں',
    modalNote:
      'یہ صرف ڈیمو فارم ہے — محفوظ کریں کا بٹن کوئی ڈیٹا محفوظ نہیں کرتا۔',
  },

  // Orders (placeholder page)
  orders: {
    subtitle: 'آرڈرز کی فہرست اور ان کی سٹیٹس',
    newOrder: 'نیا آرڈر',
    statusPending: 'زیر التوا',
    statusCutting: 'کٹنگ میں',
    statusReady: 'تیار',
    statusDelivered: 'ڈیلیور ہو گیا',
  },

  // Customers (placeholder page)
  customers: {
    subtitle: 'گاہکوں کی فہرست اور لیجر کا خلاصہ',
    newCustomer: 'نیا گاہک',
    searchPlaceholder: 'نام یا فون نمبر سے تلاش کریں…',
  },

  // Workers (placeholder page)
  workers: {
    subtitle: 'عملے کی فہرست، شفٹ اور حاضری',
    present: 'حاضر',
    absent: 'غیر حاضر',
    attendanceToday: 'آج کی حاضری',
  },

  // Expenses (placeholder page)
  expenses: {
    subtitle: 'فیکٹری کے ماہانہ اخراجات کا ریکارڈ',
    addExpense: 'نیا خرچ شامل کریں',
    electricity: 'بجلی',
    labor: 'مزدوری',
    transport: 'ٹرانسپورٹ',
    other: 'دیگر',
    monthTotal: 'اس ماہ کے کل اخراجات',
  },

  // Notifications (placeholder page)
  notifications: {
    subtitle: 'تازہ اطلاعات اور الرٹس',
    markAllRead: 'سب پڑھی ہوئی نشان زد کریں',
  },

  // Print preview (placeholder page)
  print: {
    subtitle: 'رپورٹ اور انوائس کا پرنٹ پریویو',
    invoice: 'انوائس',
    report: 'رپورٹ',
    printAction: 'پرنٹ کریں',
    invoiceNo: 'انوائس نمبر',
    billTo: 'گاہک',
    rate: 'ریٹ',
    grandTotal: 'کل رقم',
    previewNote: 'یہ ایک جامد (static) پریویو ہے — اصل پرنٹ لوژک بعد کے ورژن میں جڑے گا۔',
  },

  // Reports
  rep: {
    subtitle: 'ہفتہ وار اور ماہانہ پیداواری کا جائزہ',
    reportType: 'رپورٹ کی قسم',
    weekly: 'ہفتہ وار',
    monthly: 'ماہانہ',
    custom: 'حسب ضرورت',
    from: 'سے',
    to: 'تک',
    exportPdf: 'پی ڈی ایف ایکسپورٹ',
    exportExcel: 'ایکسل ایکسپورٹ',
    productionChart: 'ہفتہ وار پیداواری کا گراف',
    productionChartMonthly: 'ماہانہ پیداواری کا گراف',
    slabTypes: 'سلیب کی اقسام',
    totalProduction: 'کل پیداواری',
    slabsUsed: 'استعمال شدہ سلیبز',
    revenue: 'کل آمدنی',
    wasteRate: 'ضائع کی شرح',
  },

  // About
  about: {
    subtitle: 'ایپ اور فیکٹری کے بارے میں معلومات',
    appTitle: 'ایپ کے بارے میں',
    description1:
      'المکہ ماربل فیکٹری مینجمنٹ ایک موبائل ایپلیکیشن ہے جو خاص طور پر پاکستان کی ماربل فیکٹریوں کی ضروریات کو مدنظر رکھ کر تیار کی گئی ہے۔ اس کی مدد سے فیکٹری کا پورا کام — سلیب کا حساب کتاب، ذخیرے کی نگرانی، اور روزانہ و ماہانہ رپورٹس — آپ کے موبائل پر ہی منظم ہو جاتا ہے۔',
    description2:
      'یہ ایپ مکمل طور پر اردو زبان میں ڈیزائن کی گئی ہے اور آف لائن بھی کام کرتی ہے، تاکہ فیکٹری کے ورکرز اور مالکان اسے بغیر کسی مشکل کے استعمال کر سکیں۔',
    features: 'اہم خصوصیات',
    factoryInfo: 'فیکٹری کی معلومات',
    managementTitle: 'انتظامیہ اور عہدے',
    otherDesignations: 'دیگر عہدے',
    founder: 'شریک بانی',
    factory: 'فیکٹری',
    address: 'مقام',
    phone: 'فون',
    email: 'ای میل',
    developerInfo: 'ڈویلپر کی معلومات',
    developerName: '[ڈویلپر کا نام شامل کریں]',
    developerNote: 'یہ ایک نمونہ (placeholder) نام ہے — اصل معلومات یہاں شامل کریں۔',
  },

  // Settings
  set: {
    subtitle: 'زبان، تھیم اور اطلاعات کی ترتیبات',
    preferences: 'ترجیحات',
    language: 'زبان',
    theme: 'تھیم',
    light: 'لائٹ',
    dark: 'ڈارک',
    profile: 'پروفائل',
    notifications: 'اطلاعات',
    notifLowStock: 'کم ذخیرہ الرٹس',
    notifLowStockDesc: 'جب کسی سلیب کا ذخیرہ کم ہو جائے تو مطلع کریں',
    notifOrders: 'آرڈر یاد دہانیاں',
    notifOrdersDesc: 'زیر التوا آرڈرز کی روزانہ یاد دہانی',
    notifReport: 'روزانہ رپورٹ',
    notifReportDesc: 'ہر شام کو دن کی پیداواری کا خلاصہ',
    appInfo: 'ایپ کی معلومات',
    appRowName: 'ایپ کا نام',
    appRowVersion: 'ورژن',
    userName: 'محمد اکرم',
    factoryManager: 'فیکٹری مینیجر',
    logout: 'لاگ آؤٹ',
  },

  // PWA (install / offline / updates)
  pwa: {
    installTitle: 'ایپ انسٹال کریں',
    installDesc: 'ہوم اسکرین پر شامل کریں — انٹرنیٹ کے بغیر بھی کام کرتی ہے',
    addToHome: 'ہوم اسکرین پر شامل کریں',
    install: 'انسٹال کریں',
    installSuccess: 'ایپ انسٹال ہو گئی — ہوم اسکرین دیکھیں',
    installManual: 'خودکار انسٹال دستیاب نہیں — براؤزر کے مینو سے «ہوم اسکرین پر شامل کریں» منتخب کریں',
    later: 'بعد میں',
    offline: 'آف لائن موڈ — انٹرنیٹ کنکشن دستیاب نہیں',
    updateReady: 'نیا ورژن دستیاب ہے — ری لوڈ کریں',
    reload: 'ری لوڈ کریں',
  },

  // Async states (Skeleton / EmptyState / ErrorState / PageLoader)
  states: {
    loading: 'لوڈ ہو رہا ہے…',
    empty: 'کوئی ڈیٹا موجود نہیں',
    emptyHint: 'جب نیا ڈیٹا شامل ہوگا تو یہاں نظر آئے گا۔',
    error: 'کچھ غلط ہو گیا',
    errorHint: 'ایک غیر متوقع خرابی پیش آئی — براہ کرم دوبارہ کوشش کریں۔',
    retry: 'دوبارہ کوشش کریں',
  },

  // Confirm dialogs
  confirm: {
    defaultTitle: 'کیا آپ مطمئن ہیں؟',
    confirm: 'تصدیق کریں',
    deleteTitle: 'حذف کریں؟',
    deleteMessage: 'منتخب شدہ آئٹم حذف ہو جائے گا۔ یہ عمل واپس نہیں کیا جا سکتا۔',
    confirmDelete: 'جی، حذف کریں',
  },

  // Toast feedback
  toast: {
    demo: 'یہ صرف ایک ڈیمو اطلاع ہے',
    demoDeleted: 'ڈیمو: حذف کا عمل بعد کے ورژن میں جڑے گا',
    demoLogout: 'ڈیمو: لاگ آؤٹ بعد کے ورژن میں جڑے گا',
    demoSaved: 'ڈیمو: فارم محفوظ نہیں ہوا — پی کے اے آئی بعد میں جڑے گی',
  },

  // 404
  notFound: {
    title: 'صفحہ نہیں ملا',
    desc: 'جو صفحہ آپ تلاش کر رہے ہیں وہ موجود نہیں یا منتقل ہو چکا ہے۔',
    backHome: 'ہوم پر واپس جائیں',
  },

  // Login (placeholder screen)
  login: {
    title: 'لاگ ان',
    subtitle: 'جاری رکھنے کے لیے سائن ان کریں',
    username: 'یوزر نیم یا ای میل',
    password: 'پاس ورڈ',
    remember: 'مجھے یاد رکھیں',
    submit: 'لاگ ان',
    note: 'ڈیمو اسکرین — اصل آتھینٹیکیشن ایک بعد کے ورژن میں شامل ہوگی۔',
  },

  // Header / user menu
  header: {
    search: 'تلاش کریں…',
    searchSoon: 'گلوبل سرچ جلد آرہی ہے',
    account: 'اکاؤنٹ',
  },

  menu: {
    profile: 'پروفائل',
  },
}
