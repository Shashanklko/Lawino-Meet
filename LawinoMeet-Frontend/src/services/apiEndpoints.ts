import type { EndpointDefinition } from '../types/api';

export const ENDPOINTS: EndpointDefinition[] = [
  // ==========================================
  // 1. AUTHENTICATION MODULE (/api/auth)
  // ==========================================
  {
    id: 'auth-register-client',
    name: 'Register User (Client / Lawyer / Admin)',
    module: 'AUTH',
    method: 'POST',
    path: '/api/auth/register',
    description: 'Register a new user in the Lawino Meet platform (Role: CLIENT, LAWYER, or ADMIN).',
    requiresAuth: false,
    sampleBody: {
      name: 'John Doe',
      email: 'client.test@lawinomeet.com',
      password: 'Password123!',
      role: 'CLIENT',
      phone: '+1234567890',
      specialization: 'Corporate Law',
      fee: 150.00
    }
  },
  {
    id: 'auth-login',
    name: 'Login User & Capture JWT',
    module: 'AUTH',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user credentials and receive a JWT access token.',
    requiresAuth: false,
    sampleBody: {
      email: 'client.test@lawinomeet.com',
      password: 'Password123!'
    }
  },

  // ==========================================
  // 2. USER MANAGEMENT MODULE (/api/users)
  // ==========================================
  {
    id: 'user-create',
    name: 'Create User',
    module: 'USERS',
    method: 'POST',
    path: '/api/users',
    description: 'Create a new user account (Requires ADMIN or system privilege).',
    requiresAuth: true,
    sampleBody: {
      name: 'Jane Smith',
      email: 'lawyer.jane@lawinomeet.com',
      password: 'SecurePassword123!',
      role: 'LAWYER',
      phone: '+9876543210',
      specialization: 'Family Law',
      fee: 200.00
    }
  },
  {
    id: 'user-get-all',
    name: 'Get All Users',
    module: 'USERS',
    method: 'GET',
    path: '/api/users',
    description: 'Retrieve a list of all registered users in the database.',
    requiresAuth: true
  },
  {
    id: 'user-get-by-id',
    name: 'Get User By ID',
    module: 'USERS',
    method: 'GET',
    path: '/api/users/{id}',
    description: 'Fetch user details by database User ID.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'User ID' }
    ]
  },
  {
    id: 'user-update',
    name: 'Update User Profile',
    module: 'USERS',
    method: 'PUT',
    path: '/api/users/{id}',
    description: 'Update user profile info.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'User ID' }
    ],
    sampleBody: {
      name: 'Johnathan Doe Updated',
      email: 'client.test@lawinomeet.com',
      password: 'Password123!',
      role: 'CLIENT',
      phone: '+1122334455',
      specialization: 'General',
      fee: 0.00
    }
  },
  {
    id: 'user-delete',
    name: 'Delete User',
    module: 'USERS',
    method: 'DELETE',
    path: '/api/users/{id}',
    description: 'Delete a user by User ID.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'User ID' }
    ]
  },

  // ==========================================
  // 3. CONSULTATIONS MODULE (/api/consultations)
  // ==========================================
  {
    id: 'consultation-request',
    name: 'Request Consultation',
    module: 'CONSULTATIONS',
    method: 'POST',
    path: '/api/consultations/request',
    description: 'Client submits a consultation inquiry to a lawyer (Contact details masked for privacy).',
    requiresAuth: true,
    sampleBody: {
      clientId: 1,
      lawyerId: 2,
      type: 'ONLINE',
      notes: 'Need urgent legal assistance regarding property contract clause 4.'
    }
  },
  {
    id: 'consultation-approve',
    name: 'Approve Consultation & Set Fee',
    module: 'CONSULTATIONS',
    method: 'POST',
    path: '/api/consultations/{id}/approve',
    description: 'Lawyer approves the inquiry request and specifies the consultation fee.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Consultation ID' },
      { name: 'customFee', type: 'number', required: true, in: 'query', defaultValue: 120.50, description: 'Approved Fee Amount' }
    ]
  },
  {
    id: 'consultation-toggle-room',
    name: 'Toggle Room Status (Active/Inactive)',
    module: 'CONSULTATIONS',
    method: 'POST',
    path: '/api/consultations/{id}/toggle-room',
    description: 'Lawyer or admin activates or deactivates the virtual video meeting room.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Consultation ID' },
      { name: 'isRoomActive', type: 'boolean', required: true, in: 'query', defaultValue: true, description: 'Room Status' }
    ]
  },
  {
    id: 'consultation-no-show-appeal',
    name: 'Raise No-Show Appeal',
    module: 'CONSULTATIONS',
    method: 'POST',
    path: '/api/consultations/{id}/no-show-appeal',
    description: 'Raise a dispute ticket for Admin review if lawyer or client failed to show up.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Consultation ID' }
    ]
  },
  {
    id: 'consultation-get-by-id',
    name: 'Get Consultation Details',
    module: 'CONSULTATIONS',
    method: 'GET',
    path: '/api/consultations/{id}',
    description: 'Retrieve details for a specific consultation session.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Consultation ID' }
    ]
  },
  {
    id: 'consultation-get-by-code',
    name: 'Get Consultation by Meeting Code',
    module: 'CONSULTATIONS',
    method: 'GET',
    path: '/api/consultations/code/{meetingCode}',
    description: 'Find consultation details via random unique meeting code.',
    requiresAuth: true,
    params: [
      { name: 'meetingCode', type: 'string', required: true, in: 'path', defaultValue: 'MEET-123456', description: 'Unique Meeting Code' }
    ]
  },
  {
    id: 'consultation-get-client',
    name: 'Get Client Consultations',
    module: 'CONSULTATIONS',
    method: 'GET',
    path: '/api/consultations/client/{clientId}',
    description: 'Fetch all consultation records associated with a client.',
    requiresAuth: true,
    params: [
      { name: 'clientId', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Client User ID' }
    ]
  },
  {
    id: 'consultation-get-lawyer-inbox',
    name: 'Get Lawyer Consultation Inbox',
    module: 'CONSULTATIONS',
    method: 'GET',
    path: '/api/consultations/lawyer-inbox/{lawyerId}',
    description: 'Retrieve lawyer inbox containing pending, approved, and completed requests.',
    requiresAuth: true,
    params: [
      { name: 'lawyerId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Lawyer User ID' }
    ]
  },

  // ==========================================
  // 4. PAYMENTS MODULE (/api/payments)
  // ==========================================
  {
    id: 'payment-checkout',
    name: 'Process Payment Checkout',
    module: 'PAYMENTS',
    method: 'POST',
    path: '/api/payments/checkout/{consultationId}',
    description: 'Process checkout payment for consultation, unlock lawyer contact info, and record transaction.',
    requiresAuth: true,
    params: [
      { name: 'consultationId', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Consultation ID' }
    ]
  },

  // ==========================================
  // 5. PAYOUTS MODULE (/api/payouts)
  // ==========================================
  {
    id: 'payout-wallet',
    name: 'Get Lawyer Wallet Breakdown',
    module: 'PAYOUTS',
    method: 'GET',
    path: '/api/payouts/wallet/{lawyerId}',
    description: 'Calculate available earnings, total payouts, and held funds for a lawyer.',
    requiresAuth: true,
    params: [
      { name: 'lawyerId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Lawyer User ID' }
    ]
  },
  {
    id: 'payout-request',
    name: 'Request Earnings Payout',
    module: 'PAYOUTS',
    method: 'POST',
    path: '/api/payouts/request',
    description: 'Lawyer submits a payout withdrawal request to transfer wallet funds to bank account.',
    requiresAuth: true,
    params: [
      { name: 'lawyerId', type: 'number', required: true, in: 'query', defaultValue: 2, description: 'Lawyer User ID' },
      { name: 'amount', type: 'number', required: true, in: 'query', defaultValue: 100.00, description: 'Payout Amount ($)' },
      { name: 'bankDetails', type: 'string', required: true, in: 'query', defaultValue: 'IBAN: US991234567890', description: 'Bank Account / Wire Details' }
    ]
  },
  {
    id: 'payout-lawyer-requests',
    name: 'Get Lawyer Payout Requests',
    module: 'PAYOUTS',
    method: 'GET',
    path: '/api/payouts/lawyer/{lawyerId}',
    description: 'Retrieve history of payout withdrawal requests for a lawyer.',
    requiresAuth: true,
    params: [
      { name: 'lawyerId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Lawyer User ID' }
    ]
  },

  // ==========================================
  // 6. DASHBOARD MODULE (/api/dashboard)
  // ==========================================
  {
    id: 'dashboard-client',
    name: 'Client Dashboard Metrics',
    module: 'DASHBOARD',
    method: 'GET',
    path: '/api/dashboard/client/{clientId}',
    description: 'Fetch aggregate statistics and upcoming bookings for client dashboard.',
    requiresAuth: true,
    params: [
      { name: 'clientId', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Client User ID' }
    ]
  },
  {
    id: 'dashboard-lawyer',
    name: 'Lawyer Dashboard Metrics',
    module: 'DASHBOARD',
    method: 'GET',
    path: '/api/dashboard/lawyer/{lawyerId}',
    description: 'Fetch earnings summary, consultations, and pending payouts for lawyer dashboard.',
    requiresAuth: true,
    params: [
      { name: 'lawyerId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Lawyer User ID' }
    ]
  },
  {
    id: 'dashboard-admin',
    name: 'Admin Platform Metrics',
    module: 'DASHBOARD',
    method: 'GET',
    path: '/api/dashboard/admin',
    description: 'Fetch total disputes, total payment transactions, pending payouts, and collected platform fees.',
    requiresAuth: true
  },

  // ==========================================
  // 7. CHAT MODULE (/api/chat)
  // ==========================================
  {
    id: 'chat-start',
    name: 'Start Chat Session',
    module: 'CHAT',
    method: 'POST',
    path: '/api/chat/start',
    description: 'Initialize a chat session between a client and a lawyer.',
    requiresAuth: true,
    sampleBody: {
      clientId: 1,
      lawyerId: 2,
      consultationId: 1
    }
  },
  {
    id: 'chat-history',
    name: 'Get Chat Session History',
    module: 'CHAT',
    method: 'GET',
    path: '/api/chat/{sessionId}/history',
    description: 'Retrieve message history for a given chat session.',
    requiresAuth: true,
    params: [
      { name: 'sessionId', type: 'string', required: true, in: 'path', defaultValue: 'SESSION-99', description: 'Chat Session ID' }
    ]
  },
  {
    id: 'chat-unlock',
    name: 'Unlock Chat Reply',
    module: 'CHAT',
    method: 'POST',
    path: '/api/chat/{sessionId}/unlock',
    description: 'Unlock reply permissions for a chat session.',
    requiresAuth: true,
    params: [
      { name: 'sessionId', type: 'string', required: true, in: 'path', defaultValue: 'SESSION-99', description: 'Chat Session ID' }
    ]
  },
  {
    id: 'chat-user-sessions',
    name: 'Get Client Chat Sessions',
    module: 'CHAT',
    method: 'GET',
    path: '/api/chat/sessions/user/{userId}',
    description: 'Retrieve all active and resolved chat sessions for a client.',
    requiresAuth: true,
    params: [
      { name: 'userId', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Client User ID' }
    ]
  },
  {
    id: 'chat-pro-sessions',
    name: 'Get Professional Chat Sessions',
    module: 'CHAT',
    method: 'GET',
    path: '/api/chat/sessions/pro/{proId}',
    description: 'Retrieve all active and resolved chat sessions for a lawyer.',
    requiresAuth: true,
    params: [
      { name: 'proId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Professional Lawyer ID' }
    ]
  },

  // ==========================================
  // 8. ADMIN MODULE (/api/admin)
  // ==========================================
  {
    id: 'admin-disputes',
    name: 'Get All Dispute Tickets',
    module: 'ADMIN',
    method: 'GET',
    path: '/api/admin/disputes',
    description: 'Retrieve all open and resolved dispute tickets.',
    requiresAuth: true
  },
  {
    id: 'admin-resolve-dispute',
    name: 'Resolve Dispute Ticket',
    module: 'ADMIN',
    method: 'POST',
    path: '/api/admin/disputes/{id}/resolve',
    description: 'Admin resolves a dispute ticket with refund decision and notes.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Dispute Ticket ID' },
      { name: 'approveRefund', type: 'boolean', required: true, in: 'query', defaultValue: true, description: 'Approve Refund?' },
      { name: 'adminNotes', type: 'string', required: true, in: 'query', defaultValue: 'Verified no-show by lawyer. Full refund approved.', description: 'Resolution Notes' }
    ]
  },
  {
    id: 'admin-verify-lawyer',
    name: 'Toggle Lawyer Verification',
    module: 'ADMIN',
    method: 'PUT',
    path: '/api/admin/users/{lawyerUserId}/verify',
    description: 'Admin updates verified status for a lawyer profile.',
    requiresAuth: true,
    params: [
      { name: 'lawyerUserId', type: 'number', required: true, in: 'path', defaultValue: 2, description: 'Lawyer User ID' },
      { name: 'isVerified', type: 'boolean', required: true, in: 'query', defaultValue: true, description: 'Verified Status' }
    ]
  },
  {
    id: 'admin-pending-payouts',
    name: 'Get Pending Payout Requests',
    module: 'ADMIN',
    method: 'GET',
    path: '/api/admin/payouts/pending',
    description: 'Retrieve list of all lawyer payout requests awaiting admin approval.',
    requiresAuth: true
  },
  {
    id: 'admin-approve-payout',
    name: 'Approve Payout Request',
    module: 'ADMIN',
    method: 'POST',
    path: '/api/admin/payouts/{id}/approve',
    description: 'Admin approves payout request and updates lawyer wallet balance.',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'number', required: true, in: 'path', defaultValue: 1, description: 'Payout Request ID' }
    ]
  }
];
