import {
  Boxes,
  LayoutDashboard,
  Landmark,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  User,
  Wallet,
} from 'lucide-react'

/**
 * Navigation registry for the whole application.
 *
 * Every entry maps a hash route to a page component. Modules that are not
 * implemented yet are marked with `available: false`; the shell renders them
 * as a "coming soon" placeholder instead of hiding them, so the information
 * architecture stays visible from Phase 1 onwards.
 */
export const navigation = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: 'Sales',
    path: '/sales',
    icon: ShoppingCart,
    available: true,
    description: 'Invoices, returns and customer balances.',
  },
  {
    label: 'Purchases',
    path: '/purchases',
    icon: Receipt,
    available: true,
    description: 'Supplier invoices, stock in and pending payments.',
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: Boxes,
    available: true,
    description: 'Item groups, product classes and catalog organization.',
  },
  {
    label: 'Items',
    path: '/items',
    icon: Boxes,
    available: true,
    description: 'Product catalogue, stock levels and pricing.',
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: Users,
    available: true,
    description: 'Customer records, credit limits and ledgers.',
  },
  {
    label: 'Customer Ledger',
    path: '/customer-ledger',
    icon: ScrollText,
    available: true,
    description: 'Customer receivable ledger and running balances.',
  },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: Truck,
    available: true,
    description: 'Supplier records, purchasing partners and balances.',
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: Wallet,
    available: true,
    description: 'Daily expenses, categories and approvals.',
  },
  {
    label: 'Ledger',
    path: '/ledger',
    icon: ScrollText,
    available: true,
    description: 'Combined accounts ledger and reporting.',
  },
  {
    label: 'Banks',
    path: '/banks',
    icon: Landmark,
    available: true,
    description: 'Bank accounts, deposits and reconciliation.',
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    available: true,
    description: 'Your account and password settings.',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    available: true,
    description: 'Company profile, users, roles and preferences.',
  },
]


