# DisasterAid - Crisis Relief Platform

**Team Number:** 15

A comprehensive disaster response and coordination platform that connects citizens in need with NGOs, dispatchers, and government authorities for efficient emergency relief operations.

## About Project

DisasterAid addresses the challenge of coordinating urgent relief needs during disasters, where victims struggle to communicate with NGOs and authorities. Our solution is a real-time crisis relief coordination platform that connects victims, NGOs, and authorities, enabling multi-beneficiary requests, instant dispatcher logins, and live resource tracking. The platform uses a modular architecture with real-time dashboards, offline-first design, and automated matching to streamline relief efforts.

## Features

### For Citizens
- **SOS Emergency Requests** - Quick distress signal submission with priority handling
- **Multi-type Help Requests** - Food, water, shelter, medical aid, rescue, and more
- **Real-time Status Tracking** - Live updates on request status and dispatcher location
- **Offline Support** - Queue requests when network is weak, auto-submit when online
- **Media Upload** - Photos, videos, and audio evidence with camera capture
- **Battery & Network Monitoring** - Smart priority based on device status

### For NGOs
- **Intelligent Matching** - Algorithm-based assignment of requests to NGOs
- **Capacity Management** - Define resources, personnel, vehicles, and service areas
- **Dispatcher Management** - Add and assign field dispatchers to tickets
- **Real-time Dashboard** - Live updates on matches and assignments
- **Ticket Tracking** - Monitor active, completed, and rejected requests

### For Dispatchers
- **Field Operations** - Accept assignments and update status in real-time
- **Proof Upload** - Submit evidence of completed relief work
- **Live Tracking Map** - Route visualization from NGO to victim location
- **Task Management** - View active and completed assignments

### For Authorities
- **Crisis Overview** - Monitor all tickets, assignments, and active relief operations
- **SOS Queue** - Prioritized view of emergency requests
- **Resource Allocation** - Track NGO capacity and deployment
- **Heatmaps** - Geographic visualization of crisis zones
- **Analytics Dashboard** - Real-time statistics and insights

## Tech Stack

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Leaflet.js** - Interactive maps
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP requests
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **Multer** - File uploads

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

```bash
cd disasteraid-auth-backend
npm install

# Create .env file with:
# MONGO_URI=mongodb://localhost:27017/disasteraid
# JWT_SECRET=your_jwt_secret_here
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

npm start
# Server runs on http://localhost:5001
```

### Frontend Setup

```bash
cd disasteraid-auth-frontend
npm install
npm start
# App runs on http://localhost:3000
```

## User Roles

1. **Citizen** - Submit help requests and track status
2. **NGO** - Receive and accept matches, manage dispatchers
3. **Dispatcher** - Execute field operations and update status
4. **Authority** - Monitor and coordinate overall relief efforts

## Project Structure

```
disaster-aid/
├── disasteraid-auth-backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & upload middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helpers (matching, notifications, realtime)
│   └── server.js        # Entry point
│
└── disasteraid-auth-frontend/
    ├── public/          # Static assets
    └── src/
        ├── api/         # API service functions
        ├── components/  # Reusable components
        ├── context/     # React context (Auth)
        ├── hooks/       # Custom hooks
        ├── pages/       # Page components
        └── utils/       # Helper functions
```

## Real-time Features

- **WebSocket Rooms** - Targeted updates for NGOs, dispatchers, and citizens
- **Live Status Updates** - Instant notification of ticket status changes
- **Dispatcher Tracking** - Real-time location simulation on maps
- **Auto-refresh Matches** - NGO dashboard updates without page reload

## Notifications

- Email notifications for ticket assignments and status updates
- In-app toast notifications for errors and success messages
- Real-time WebSocket events for instant updates

## Key Algorithms

### Intelligent Matching Algorithm
- Calculates optimal NGO-ticket matches based on:
  - Geographic distance
  - Help type compatibility
  - NGO capacity and resources
  - Priority scores (SOS, battery level, beneficiaries)
  - Service area coverage

### Multi-assign Matching
- Prevents duplicate assignments
- Ensures fair distribution across NGOs
- Prioritizes SOS requests
- Maintains match history

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- File upload validation and size limits

## Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly UI components
- Optimized for field operations

## Future Enhancements

- Push notifications
- Advanced analytics and reporting
- Multi-language support
- Integration with government APIs
- SMS notifications for low-network areas
- Blockchain for transparent resource tracking

## Development Team

**Team Number:** 15

| Name | Roll Number |
|------|-------------|
| Pranjit Gautam | 2025201062 |
| Param Modi | 2025201087 |
| Srushti Pekamwar | 2025201066 |
| Anurag Kaushal | 2025202013 |
| K Lakshmi Sai Aasritha | 2025204019 |

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for humanitarian relief operations**
