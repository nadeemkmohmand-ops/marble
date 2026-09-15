/**
 * English dictionary (secondary language, LTR).
 * Keep key-for-key parity with locales/ur.js — missing keys fall back to Urdu.
 */
export default {
  // App identity
  appName: 'Al-Makkah Marble Factory Management',
  appShortName: 'Al-Makkah Marble',
  factoryName: 'Al-Makkah Marble Factory',
  tagline: 'Factory Management System',
  location: 'KPK, Pakistan',
  version: 'Version 1.1.0',
  demoNote: 'Note: This is a UI demo only — real data and calculations will arrive in a future version.',

  // Navigation
  nav: {
    home: 'Home',
    calculator: 'Calculator',
    inventory: 'Inventory',
    orders: 'Orders',
    reports: 'Reports',
    customers: 'Customers',
    workers: 'Workers',
    expenses: 'Expenses',
    notifications: 'Notifications',
    printPreview: 'Print Preview',
    about: 'About',
    settings: 'Settings',
    login: 'Login',
    sectionMain: 'Main',
    sectionManage: 'Management',
    sectionSystem: 'System',
  },

  // Common labels
  common: {
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    total: 'Total',
    date: 'Date',
    size: 'Size',
    quantity: 'Quantity',
    thickness: 'Thickness',
    actions: 'Actions',
    viewAll: 'View All',
    close: 'Close',
    all: 'All',
    menu: 'Menu',
    pieces: 'Pieces',
    slabs: 'Slabs',
    sqft: 'sq ft',
    previous: 'Previous',
    next: 'Next',
    skipToContent: 'Skip to content',
    status: 'Status',
    customer: 'Customer',
    item: 'Item',
    amount: 'Amount',
    category: 'Category',
    name: 'Name',
    phone: 'Phone',
    area: 'Area',
    balance: 'Balance',
    role: 'Role',
    shift: 'Shift',
    attendance: 'Attendance',
    note: 'Note',
  },

  // Home / Dashboard
  home: {
    welcome: 'Welcome',
    todayDate: 'Date: 14 September 2026',
    totalSlabs: 'Total Slabs',
    todaysProduction: "Today's Production",
    pendingOrders: 'Pending Orders',
    lowStockAlerts: 'Low Stock Alerts',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    newCalculation: 'New Calculation',
    viewInventory: 'View Inventory',
    generateReport: 'Generate Report',
    weeklyOverview: 'Weekly Production',
    viewReports: 'View Reports',
  },

  // Calculator
  calc: {
    subtitle: 'Estimate pieces before cutting',
    newCalculation: 'New Calculation',
    slabLength: 'Slab Length',
    slabWidth: 'Slab Width',
    pieceSize: 'Desired Piece Size',
    quantity: 'Quantity',
    calculate: 'Calculate',
    result: 'Result',
    waste: 'Waste',
    totalArea: 'Total Area',
    piecesCount: 'Number of Pieces',
    history: 'History',
    unitFeet: 'feet',
  },

  // Inventory
  inv: {
    subtitle: 'Slab stock details and management',
    id: 'ID',
    location: 'Location',
    addNewSlab: 'Add New Slab',
    searchPlaceholder: 'Search by ID or size…',
    filterSize: 'Filter by size',
    filterThickness: 'Filter by thickness',
    low: 'Low',
    modalTitle: 'Add New Slab',
    modalNote: 'This is a demo form — the Save button does not store any data.',
  },

  // Orders (placeholder page)
  orders: {
    subtitle: 'Order list and their status',
    newOrder: 'New Order',
    statusPending: 'Pending',
    statusCutting: 'Cutting',
    statusReady: 'Ready',
    statusDelivered: 'Delivered',
  },

  // Customers (placeholder page)
  customers: {
    subtitle: 'Customer list and ledger summary',
    newCustomer: 'New Customer',
    searchPlaceholder: 'Search by name or phone…',
  },

  // Workers (placeholder page)
  workers: {
    subtitle: 'Staff list, shifts and attendance',
    present: 'Present',
    absent: 'Absent',
    attendanceToday: "Today's Attendance",
  },

  // Expenses (placeholder page)
  expenses: {
    subtitle: 'Monthly factory expense record',
    addExpense: 'Add Expense',
    electricity: 'Electricity',
    labor: 'Labor',
    transport: 'Transport',
    other: 'Other',
    monthTotal: 'Total Expenses This Month',
  },

  // Notifications (placeholder page)
  notifications: {
    subtitle: 'Latest notifications and alerts',
    markAllRead: 'Mark all as read',
  },

  // Print preview (placeholder page)
  print: {
    subtitle: 'Print preview for reports and invoices',
    invoice: 'Invoice',
    report: 'Report',
    printAction: 'Print',
    invoiceNo: 'Invoice No.',
    billTo: 'Customer',
    rate: 'Rate',
    grandTotal: 'Grand Total',
    previewNote: 'This is a static preview — real print logic will be wired in a later version.',
  },

  // Reports
  rep: {
    subtitle: 'Weekly and monthly production overview',
    reportType: 'Report Type',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    productionChart: 'Weekly Production Chart',
    productionChartMonthly: 'Monthly Production Chart',
    slabTypes: 'Slab Types',
    totalProduction: 'Total Production',
    slabsUsed: 'Slabs Used',
    revenue: 'Revenue',
    wasteRate: 'Waste Rate',
  },

  // About
  about: {
    subtitle: 'Information about the app and the factory',
    appTitle: 'About the App',
    description1:
      'Al-Makkah Marble Factory Management is a mobile application built specifically for the needs of marble factories in Pakistan. It helps organize the entire factory workflow — slab calculations, inventory tracking, and daily and monthly reports — right on your phone.',
    description2:
      'The app is designed entirely in Urdu and also works offline, so factory workers and owners can use it without any difficulty.',
    features: 'Key Features',
    factoryInfo: 'Factory Information',
    managementTitle: 'Management & Designations',
    otherDesignations: 'Other Designations',
    founder: 'Co-Founder',
    factory: 'Factory',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    developerInfo: 'Developer Information',
    developerName: '[Add developer name]',
    developerNote: 'This is a placeholder — add real details here.',
  },

  // Settings
  set: {
    subtitle: 'Language, theme and notification settings',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    profile: 'Profile',
    notifications: 'Notifications',
    notifLowStock: 'Low Stock Alerts',
    notifLowStockDesc: 'Notify when any slab stock runs low',
    notifOrders: 'Order Reminders',
    notifOrdersDesc: 'Daily reminder for pending orders',
    notifReport: 'Daily Report',
    notifReportDesc: 'A summary of the day’s production every evening',
    appInfo: 'App Information',
    appRowName: 'App Name',
    appRowVersion: 'Version',
    userName: 'Muhammad Akram',
    factoryManager: 'Factory Manager',
    logout: 'Log Out',
  },

  // PWA (install / offline / updates)
  pwa: {
    installTitle: 'Install the App',
    installDesc: 'Add it to your home screen — it works without internet',
    install: 'Install',
    later: 'Later',
    offline: 'Offline mode — no internet connection',
    updateReady: 'New version available — reload to update',
    reload: 'Reload',
  },

  // Async states (Skeleton / EmptyState / ErrorState / PageLoader)
  states: {
    loading: 'Loading…',
    empty: 'No data yet',
    emptyHint: 'New data will appear here once it is added.',
    error: 'Something went wrong',
    errorHint: 'An unexpected error occurred — please try again.',
    retry: 'Try again',
  },

  // Confirm dialogs
  confirm: {
    defaultTitle: 'Are you sure?',
    confirm: 'Confirm',
    deleteTitle: 'Delete?',
    deleteMessage: 'The selected item will be deleted. This action cannot be undone.',
    confirmDelete: 'Yes, delete',
  },

  // Toast feedback
  toast: {
    demo: 'This is just a demo notification',
    demoDeleted: 'Demo: deletion will be wired in a later version',
    demoLogout: 'Demo: logout will be wired in a later version',
    demoSaved: 'Demo: the form was not saved — persistence arrives later',
  },

  // 404
  notFound: {
    title: 'Page not found',
    desc: 'The page you are looking for does not exist or has been moved.',
    backHome: 'Back to Home',
  },

  // Login (placeholder screen)
  login: {
    title: 'Login',
    subtitle: 'Sign in to continue',
    username: 'Username or email',
    password: 'Password',
    remember: 'Remember me',
    submit: 'Login',
    note: 'Demo screen — real authentication will be added in a later version.',
  },

  // Header / user menu
  header: {
    search: 'Search…',
    searchSoon: 'Global search is coming soon',
    account: 'Account',
  },

  menu: {
    profile: 'Profile',
  },
}
