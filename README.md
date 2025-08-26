# Attendance Management System

A comprehensive full-stack attendance management system built with React and Node.js.

## Features

### For Students:
- **Token-based Attendance**: Submit attendance using subject tokens
- **View Attendance Records**: Track personal attendance with charts and statistics
- **Class Schedule**: View weekly timetable and subjects
- **Profile Management**: Update personal information
- **AI Chatbot**: Get help with attendance-related queries

### For Staff/Admin:
- **Dashboard**: Overview of attendance statistics
- **Student Management**: View and manage student records
- **Attendance Tracking**: View all attendance records with filtering
- **Excel Import/Export**: Bulk attendance management
- **Reports Generation**: Generate attendance reports

## Tech Stack

### Backend:
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Google Generative AI (Chatbot)
- bcrypt for password hashing

### Frontend:
- React 19 with Vite
- React Router for navigation
- React Hook Form for form handling
- Recharts for data visualization
- ExcelJS & jsPDF for file operations
- Axios for API calls

## Installation & Setup

### Prerequisites:
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup:
```bash
cd server
npm install
# Create .env file with your configurations
npm start
```

### Frontend Setup:
```bash
cd client
npm install
npm run dev
```

### Environment Variables:
Create `.env` file in server directory:
```
SECRET_KEY=your_jwt_secret_key
GOOGLE_AI_KEY=your_google_ai_api_key
MONGODB_URI=mongodb://localhost:27017/studentDb
PORT=5000
```

## Usage

1. **Registration**: Students and staff can register with their respective roles
2. **Login**: Secure authentication with JWT tokens
3. **Attendance Submission**: Students submit attendance using subject tokens during class hours
4. **Monitoring**: Staff can monitor attendance in real-time
5. **Reports**: Generate and export attendance reports

## API Endpoints

### Authentication:
- `POST /signup` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Attendance:
- `POST /attendance/submit` - Submit attendance (Students)
- `GET /attendance/student` - Get student's attendance
- `GET /attendance/all` - Get all attendance records (Staff)
- `GET /api/attendance/summary` - Get attendance summary (Dashboard)

### Other:
- `GET /students` - Get all students (Staff)
- `POST /chatbot` - AI chatbot interaction

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Environment variables for sensitive data
- Role-based access control
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please contact the development team or create an issue in the repository.