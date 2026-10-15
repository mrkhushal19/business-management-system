import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { InventoryItem, TeamTask, TeamMember, InventoryLog, StockStatus } from '../types';

// Collection references
const INVENTORY_COLLECTION = 'inventory';
const TASKS_COLLECTION = 'tasks';
const MEMBERS_COLLECTION = 'team_members';
const LOGS_COLLECTION = 'inventory_logs';

export function subscribeToInventory(
  onData: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, INVENTORY_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<InventoryItem, 'id'>) });
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, INVENTORY_COLLECTION);
    }
  );
}

export function subscribeToTasks(
  onData: (tasks: TeamTask[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, TASKS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TeamTask[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...(docSnap.data() as Omit<TeamTask, 'id'>) });
      });
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(tasks);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, TASKS_COLLECTION);
    }
  );
}

export function subscribeToTeamMembers(
  onData: (members: TeamMember[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, MEMBERS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const members: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        members.push({ id: docSnap.id, ...(docSnap.data() as Omit<TeamMember, 'id'>) });
      });
      members.sort((a, b) => a.name.localeCompare(b.name));
      onData(members);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, MEMBERS_COLLECTION);
    }
  );
}

export function subscribeToLogs(
  onData: (logs: InventoryLog[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, LOGS_COLLECTION), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: InventoryLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<InventoryLog, 'id'>) });
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(logs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, LOGS_COLLECTION);
    }
  );
}

export async function createOrUpdateInventoryItem(item: InventoryItem, performedBy: string = 'Operations Team') {
  const path = `${INVENTORY_COLLECTION}/${item.id}`;
  try {
    const status: StockStatus =
      item.quantity === 0
        ? 'out_of_stock'
        : item.quantity <= item.minThreshold
        ? 'low_stock'
        : 'in_stock';

    const payload: Omit<InventoryItem, 'id'> = {
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: Math.max(0, item.quantity),
      minThreshold: Math.max(0, item.minThreshold),
      unit: item.unit || 'units',
      unitCost: item.unitCost || 0,
      unitPrice: item.unitPrice || 0,
      location: item.location || 'Warehouse A',
      supplier: item.supplier || 'Primary Supplier',
      status,
      lastRestockedAt: item.lastRestockedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: performedBy,
    };

    await setDoc(doc(db, INVENTORY_COLLECTION, item.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInventoryItem(itemId: string) {
  const path = `${INVENTORY_COLLECTION}/${itemId}`;
  try {
    await deleteDoc(doc(db, INVENTORY_COLLECTION, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function adjustStockLevel(
  item: InventoryItem,
  delta: number,
  reason: string,
  performedBy: string,
  teamMembers: TeamMember[] = []
): Promise<{ newQuantity: number; triggeredTask?: TeamTask }> {
  const newQty = Math.max(0, item.quantity + delta);
  const status: StockStatus =
    newQty === 0 ? 'out_of_stock' : newQty <= item.minThreshold ? 'low_stock' : 'in_stock';
  const now = new Date().toISOString();

  const itemPath = `${INVENTORY_COLLECTION}/${item.id}`;
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const logPath = `${LOGS_COLLECTION}/${logId}`;

  try {
    const batch = writeBatch(db);

    // 1. Update Inventory Document
    const updatedItemPayload: Omit<InventoryItem, 'id'> = {
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: newQty,
      minThreshold: item.minThreshold,
      unit: item.unit,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      location: item.location,
      supplier: item.supplier,
      status,
      lastRestockedAt: delta > 0 ? now : item.lastRestockedAt || now,
      updatedAt: now,
      updatedBy: performedBy,
    };
    batch.set(doc(db, INVENTORY_COLLECTION, item.id), updatedItemPayload);

    // 2. Write Audit Log
    const logPayload: Omit<InventoryLog, 'id'> = {
      itemId: item.id,
      sku: item.sku,
      itemName: item.name,
      delta,
      previousQty: item.quantity,
      newQty,
      reason,
      performedBy,
      timestamp: now,
    };
    batch.set(doc(db, LOGS_COLLECTION, logId), logPayload);

    // 3. Automated Task Trigger: If stock breached reorder threshold and was not previously low/out
    let triggeredTask: TeamTask | undefined;
    if (newQty <= item.minThreshold) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const taskPath = `${TASKS_COLLECTION}/${taskId}`;
      
      // Smart Auto-Assign Algorithm
      const eligibleMembers = teamMembers.filter((m) => m.status !== 'away');
      // Score members based on department match & lowest capacity utilization
      const ranked = eligibleMembers.sort((a, b) => {
        const aMatch = a.department.toLowerCase().includes('inventory') || a.role.toLowerCase().includes('logistics') ? -1 : 0;
        const bMatch = b.department.toLowerCase().includes('inventory') || b.role.toLowerCase().includes('logistics') ? -1 : 0;
        if (aMatch !== bMatch) return aMatch - bMatch;
        const aLoad = a.currentWorkload / Math.max(1, a.maxCapacity);
        const bLoad = b.currentWorkload / Math.max(1, b.maxCapacity);
        return aLoad - bLoad;
      });

      const bestAssignee = ranked[0];

      triggeredTask = {
        id: taskId,
        title: `Restock Alert: ${item.name} (${item.sku}) below reorder point`,
        description: `Current stock dropped to ${newQty} ${item.unit} (Threshold is ${item.minThreshold}). Contact supplier '${item.supplier}' for emergency replenish of at least ${item.minThreshold * 2} units to warehouse aisle ${item.location}.`,
        priority: newQty === 0 ? 'urgent' : 'high',
        status: 'pending',
        category: 'Inventory Restock',
        relatedSku: item.sku,
        assignedToId: bestAssignee ? bestAssignee.id : '',
        assignedToName: bestAssignee ? bestAssignee.name : 'Unassigned (Queue)',
        assignedToRole: bestAssignee ? bestAssignee.role : '',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        estimatedHours: 2,
        automationSource: 'Automated Threshold Trigger',
        createdBy: 'System Automation',
        createdAt: now,
        updatedAt: now,
      };

      const { id: _, ...taskPayload } = triggeredTask;
      batch.set(doc(db, TASKS_COLLECTION, taskId), taskPayload);

      // If assigned to a team member, update their workload count
      if (bestAssignee) {
        batch.set(doc(db, MEMBERS_COLLECTION, bestAssignee.id), {
          ...bestAssignee,
          currentWorkload: (bestAssignee.currentWorkload || 0) + 1,
          updatedAt: now,
        });
      }
    }

    await batch.commit();
    return { newQuantity: newQty, triggeredTask };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, itemPath);
  }
}

export async function createTeamTask(task: TeamTask) {
  const path = `${TASKS_COLLECTION}/${task.id}`;
  try {
    const { id: _, ...payload } = task;
    await setDoc(doc(db, TASKS_COLLECTION, task.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTeamTask(taskId: string, updates: Partial<TeamTask>) {
  const path = `${TASKS_COLLECTION}/${taskId}`;
  try {
    await setDoc(doc(db, TASKS_COLLECTION, taskId), {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTeamTask(taskId: string) {
  const path = `${TASKS_COLLECTION}/${taskId}`;
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrUpdateTeamMember(member: TeamMember) {
  const path = `${MEMBERS_COLLECTION}/${member.id}`;
  try {
    const { id: _, ...payload } = member;
    await setDoc(doc(db, MEMBERS_COLLECTION, member.id), {
      ...payload,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeamMember(memberId: string) {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Automated Batch Assignment for All Unassigned Tasks
export async function autoAssignAllPendingTasks(
  tasks: TeamTask[],
  members: TeamMember[]
): Promise<number> {
  const unassigned = tasks.filter(
    (t) => (!t.assignedToId || t.assignedToId === '') && t.status !== 'completed'
  );

  if (unassigned.length === 0 || members.length === 0) return 0;

  const batch = writeBatch(db);
  const memberWorkloads = new Map<string, number>();
  members.forEach((m) => memberWorkloads.set(m.id, m.currentWorkload || 0));

  let assignedCount = 0;

  for (const task of unassigned) {
    // Find member with capacity and best category fit
    const available = members.filter((m) => m.status !== 'away');
    if (available.length === 0) break;

    const sorted = [...available].sort((a, b) => {
      const aCurrent = memberWorkloads.get(a.id) || 0;
      const bCurrent = memberWorkloads.get(b.id) || 0;
      const aRatio = aCurrent / Math.max(1, a.maxCapacity);
      const bRatio = bCurrent / Math.max(1, b.maxCapacity);
      return aRatio - bRatio;
    });

    const chosen = sorted[0];
    if (chosen) {
      const now = new Date().toISOString();
      batch.set(
        doc(db, TASKS_COLLECTION, task.id),
        {
          assignedToId: chosen.id,
          assignedToName: chosen.name,
          assignedToRole: chosen.role,
          automationSource: 'Smart Workload Balancer',
          updatedAt: now,
        },
        { merge: true }
      );

      const nextWorkload = (memberWorkloads.get(chosen.id) || 0) + 1;
      memberWorkloads.set(chosen.id, nextWorkload);
      batch.set(
        doc(db, MEMBERS_COLLECTION, chosen.id),
        {
          currentWorkload: nextWorkload,
          updatedAt: now,
        },
        { merge: true }
      );

      assignedCount++;
    }
  }

  if (assignedCount > 0) {
    await batch.commit();
  }

  return assignedCount;
}

// Seed Initial Business Data for rapid inspection and live demo
export async function seedSampleBusinessData() {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const sampleMembers: TeamMember[] = [
    {
      id: 'mem_1',
      name: 'Elena Rostova',
      email: 'elena.rostova@omniflow.io',
      role: 'Operations & Inventory Director',
      department: 'Logistics',
      maxCapacity: 8,
      currentWorkload: 2,
      status: 'available',
      skills: ['Stock Replenishment', 'Vendor Negotiation', 'ERP Audit'],
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      updatedAt: now,
    },
    {
      id: 'mem_2',
      name: 'Marcus Vance',
      email: 'marcus.vance@omniflow.io',
      role: 'Senior Warehouse Specialist',
      department: 'Warehouse Operations',
      maxCapacity: 10,
      currentWorkload: 3,
      status: 'available',
      skills: ['Inventory Inbound', 'Barcode Scanning', 'Safety Protocols'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      updatedAt: now,
    },
    {
      id: 'mem_3',
      name: 'Sophia Chen',
      email: 'sophia.chen@omniflow.io',
      role: 'Quality Assurance Lead',
      department: 'Quality & Inspection',
      maxCapacity: 6,
      currentWorkload: 1,
      status: 'available',
      skills: ['Batch Testing', 'Defect Analysis', 'ISO Standards'],
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      updatedAt: now,
    },
    {
      id: 'mem_4',
      name: 'Devon Miller',
      email: 'devon.miller@omniflow.io',
      role: 'Procurement Specialist',
      department: 'Procurement',
      maxCapacity: 7,
      currentWorkload: 2,
      status: 'available',
      skills: ['Supplier Relations', 'Cost Optimization', 'Purchase Orders'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      updatedAt: now,
    },
    {
      id: 'mem_5',
      name: 'Amina Zahra',
      email: 'amina.zahra@omniflow.io',
      role: 'Fulfillment Coordinator',
      department: 'Order Dispatch',
      maxCapacity: 9,
      currentWorkload: 1,
      status: 'available',
      skills: ['Pallet Packing', 'Express Shipping', 'Cross-Docking'],
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      updatedAt: now,
    },
  ];

  const sampleInventory: InventoryItem[] = [
    {
      id: 'inv_101',
      sku: 'SKU-CORE-MCU',
      name: 'STM32-H7 Industrial Microcontrollers',
      category: 'Electronics',
      quantity: 140,
      minThreshold: 50,
      unit: 'chips',
      unitCost: 18.5,
      unitPrice: 42.0,
      location: 'Aisle E-04 / Shelf 2',
      supplier: 'Apex Semiconductors Ltd',
      status: 'in_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'Elena Rostova',
    },
    {
      id: 'inv_102',
      sku: 'SKU-BATT-48V',
      name: '48V 15Ah LiFePO4 Modular Battery Cell',
      category: 'Power Systems',
      quantity: 14,
      minThreshold: 20,
      unit: 'packs',
      unitCost: 185.0,
      unitPrice: 340.0,
      location: 'Secured Bay B-12',
      supplier: 'VoltMax Power Corp',
      status: 'low_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'System Automation',
    },
    {
      id: 'inv_103',
      sku: 'SKU-THERM-SNS',
      name: 'Flir-Optic Thermal Image Sensor Array',
      category: 'Electronics',
      quantity: 0,
      minThreshold: 15,
      unit: 'units',
      unitCost: 92.0,
      unitPrice: 195.0,
      location: 'Cleanroom C-01',
      supplier: 'OptoPrecision GmbH',
      status: 'out_of_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'System Automation',
    },
    {
      id: 'inv_104',
      sku: 'SKU-BRKT-ST316',
      name: 'Reinforced 316 Stainless Steel Mounting Brackets',
      category: 'Hardware',
      quantity: 820,
      minThreshold: 200,
      unit: 'brackets',
      unitCost: 4.2,
      unitPrice: 11.5,
      location: 'Aisle A-08 / Bin 14',
      supplier: 'Titan Metal Fab',
      status: 'in_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'Marcus Vance',
    },
    {
      id: 'inv_105',
      sku: 'SKU-BOX-HDCRATE',
      name: 'Weatherproof Heavy-Duty Poly Crate 600L',
      category: 'Packaging',
      quantity: 28,
      minThreshold: 30,
      unit: 'crates',
      unitCost: 22.0,
      unitPrice: 48.0,
      location: 'Yard Deck Y-03',
      supplier: 'EcoPack Solutions',
      status: 'low_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'Marcus Vance',
    },
    {
      id: 'inv_106',
      sku: 'SKU-CAB-COP10M',
      name: 'Shielded Copper Industrial Harness 10M',
      category: 'Hardware',
      quantity: 210,
      minThreshold: 60,
      unit: 'coils',
      unitCost: 12.8,
      unitPrice: 29.0,
      location: 'Aisle D-02 / Shelf 1',
      supplier: 'ElectroWire Global',
      status: 'in_stock',
      lastRestockedAt: now,
      updatedAt: now,
      updatedBy: 'Devon Miller',
    },
  ];

  const sampleTasks: TeamTask[] = [
    {
      id: 'task_201',
      title: 'Restock Alert: Flir-Optic Thermal Sensor (SKU-THERM-SNS) Out of Stock',
      description: 'Inventory hit 0 units! Immediate purchase order required with OptoPrecision GmbH for 50 replacement sensors.',
      priority: 'urgent',
      status: 'in_progress',
      category: 'Inventory Restock',
      relatedSku: 'SKU-THERM-SNS',
      assignedToId: 'mem_4',
      assignedToName: 'Devon Miller',
      assignedToRole: 'Procurement Specialist',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      estimatedHours: 3,
      automationSource: 'Automated Threshold Trigger',
      createdBy: 'System Automation',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task_202',
      title: 'Battery Cell Cycle & Capacity QA Batch Audit',
      description: 'Perform ISO-9001 compliance voltage tests on remaining 14 LiFePO4 battery packs in Secured Bay B-12.',
      priority: 'high',
      status: 'pending',
      category: 'Quality & Inspection',
      relatedSku: 'SKU-BATT-48V',
      assignedToId: 'mem_3',
      assignedToName: 'Sophia Chen',
      assignedToRole: 'Quality Assurance Lead',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      estimatedHours: 4,
      automationSource: 'Smart Workload Balancer',
      createdBy: 'Elena Rostova',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task_203',
      title: 'Aisle E Warehouse Re-organization & Barcode Labeling',
      description: 'Audit bin numbers and affix new QR code tags across aisles E-01 through E-10 to prepare for autonomous scanner cart.',
      priority: 'medium',
      status: 'pending',
      category: 'Warehouse Maintenance',
      assignedToId: 'mem_2',
      assignedToName: 'Marcus Vance',
      assignedToRole: 'Senior Warehouse Specialist',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      estimatedHours: 6,
      automationSource: 'Manual',
      createdBy: 'Elena Rostova',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const sampleLogs: InventoryLog[] = [
    {
      id: 'log_301',
      itemId: 'inv_102',
      sku: 'SKU-BATT-48V',
      itemName: '48V 15Ah LiFePO4 Modular Battery Cell',
      delta: -10,
      previousQty: 24,
      newQty: 14,
      reason: 'Dispatch for Assembly Order #8491 (Breached Threshold)',
      performedBy: 'Marcus Vance',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'log_302',
      itemId: 'inv_103',
      sku: 'SKU-THERM-SNS',
      itemName: 'Flir-Optic Thermal Image Sensor Array',
      delta: -5,
      previousQty: 5,
      newQty: 0,
      reason: 'Urgent client drone retrofit fulfillment',
      performedBy: 'Amina Zahra',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'log_303',
      itemId: 'inv_101',
      sku: 'SKU-CORE-MCU',
      itemName: 'STM32-H7 Industrial Microcontrollers',
      delta: 60,
      previousQty: 80,
      newQty: 140,
      reason: 'Supplier Air Freight Inbound Delivery',
      performedBy: 'Elena Rostova',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ];

  // Batch insert
  sampleMembers.forEach((m) => {
    const { id, ...data } = m;
    batch.set(doc(db, MEMBERS_COLLECTION, id), data);
  });

  sampleInventory.forEach((inv) => {
    const { id, ...data } = inv;
    batch.set(doc(db, INVENTORY_COLLECTION, id), data);
  });

  sampleTasks.forEach((t) => {
    const { id, ...data } = t;
    batch.set(doc(db, TASKS_COLLECTION, id), data);
  });

  sampleLogs.forEach((l) => {
    const { id, ...data } = l;
    batch.set(doc(db, LOGS_COLLECTION, id), data);
  });

  await batch.commit();
}
