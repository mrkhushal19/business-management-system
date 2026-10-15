export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';
export type MemberStatus = 'available' | 'busy' | 'away';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  location: string;
  supplier: string;
  status: StockStatus;
  lastRestockedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: string;
  relatedSku?: string;
  dueDate?: string;
  estimatedHours?: number;
  automationSource?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  maxCapacity: number;
  currentWorkload: number;
  status: MemberStatus;
  skills: string[];
  avatarUrl?: string;
  updatedAt?: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  delta: number;
  previousQty: number;
  newQty: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface BusinessStats {
  totalSkus: number;
  totalUnitsInStock: number;
  totalValuation: number;
  potentialRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  teamCapacityUtilization: number;
}
