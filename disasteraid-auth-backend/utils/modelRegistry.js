// Registry of all MongoDB models in the application
const modelRegistry = [
  {
    name: 'User',
    description: 'User accounts (citizens, NGOs, dispatchers, authorities)',
    icon: 'user',
    commonOperations: ['findOne', 'find', 'create', 'updateOne'],
    schema: {
      name: 'string',
      email: 'string (unique)',
      password: 'string (hashed)',
      role: 'string (user/ngo/dispatcher/authority)',
      phone: 'string',
      location: 'object (coordinates)',
      createdAt: 'Date',
      updatedAt: 'Date'
    }
  },
  {
    name: 'Ticket',
    description: 'Help requests and SOS tickets',
    icon: 'ticket',
    commonOperations: ['find', 'create', 'updateOne', 'countDocuments'],
    schema: {
      ticketId: 'string (unique, DA-XXXXX)',
      userId: 'ObjectId (ref: User)',
      type: 'string (emergency type)',
      priority: 'string (low/medium/high/critical)',
      status: 'string (open/assigned/resolved)',
      location: 'object (coordinates)',
      description: 'string',
      images: 'array of strings (URLs)',
      createdAt: 'Date',
      updatedAt: 'Date'
    }
  },
  {
    name: 'RegisteredNGO',
    description: 'NGO organizations with service areas',
    icon: 'building',
    commonOperations: ['find', 'findOne', 'aggregate', 'updateOne'],
    schema: {
      ngoId: 'ObjectId (ref: User)',
      organizationName: 'string',
      registrationNumber: 'string (unique)',
      categories: 'array of strings',
      resources: 'array of objects',
      serviceArea: 'object (coordinates)',
      contactInfo: 'object',
      verificationStatus: 'string (pending/verified)',
      createdAt: 'Date'
    }
  },
  {
    name: 'TicketAssignment',
    description: 'NGO-ticket assignment proposals',
    icon: 'clipboard',
    commonOperations: ['find', 'create', 'updateOne', 'deleteOne'],
    schema: {
      ticketId: 'ObjectId (ref: Ticket)',
      ngoId: 'ObjectId (ref: RegisteredNGO)',
      assignedAt: 'Date',
      status: 'string (pending/accepted/completed)',
      notes: 'string',
      createdAt: 'Date'
    }
  },
  {
    name: 'Dispatcher',
    description: 'Dispatcher accounts for delivery',
    icon: 'truck',
    commonOperations: ['find', 'create', 'updateOne'],
    schema: {
      dispatcherId: 'ObjectId (ref: User)',
      assignedRegion: 'string',
      activeTickets: 'array of ObjectIds',
      status: 'string (active/offline)',
      permissions: 'array of strings',
      createdAt: 'Date'
    }
  },
  {
    name: 'Overlay',
    description: 'Map overlays for authority dashboard',
    icon: 'map',
    commonOperations: ['find', 'create', 'updateOne', 'deleteOne'],
    schema: {
      name: 'string',
      type: 'string (heatmap/marker/polygon)',
      data: 'object (GeoJSON)',
      metadata: 'object',
      visibility: 'boolean',
      createdBy: 'ObjectId (ref: User)',
      createdAt: 'Date'
    }
  }
];

function getAllModels() {
  return modelRegistry;
}

function getModelInfo(modelName) {
  return modelRegistry.find(m => m.name === modelName);
}

module.exports = {
  getAllModels,
  getModelInfo,
  modelRegistry
};
