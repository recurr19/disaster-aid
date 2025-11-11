/**
 * Constants for help types and medical needs
 */

export const HELP_TYPES = [
  'Food',
  'Water',
  'Shelter',
  'Medical',
  'Rescue',
  'Sanitation',
  'Baby Supplies',
  'Transportation',
  'Power/Charging'
];

export const MEDICAL_NEEDS = [
  'insulin',
  'dialysis',
  'wheelchair',
  'oxygen',
  'medication',
  'infant care',
  'elderly care',
  'mental health'
];

export const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg']
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const TICKET_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const USER_ROLES = {
  CITIZEN: 'citizen',
  NGO: 'ngo',
  AUTHORITY: 'authority',
  DISPATCHER: 'dispatcher'
};

export const NETWORK_THRESHOLDS = {
  EXCELLENT: 100,
  GOOD: 70,
  FAIR: 40,
  POOR: 20,
  VERY_POOR: 1
};

export const BATTERY_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 100
};
