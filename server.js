// API Server for Klinik Kenanga Appointment Booking
// Uses the proven quickReg.js script

import express from 'express';
import cors from 'cors';
import { quickRegister } from './quickReg.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Appointment booking endpoint (quick registration only)
app.post('/api/book-appointment', async (req, res) => {
  try {
    console.log('📋 Received appointment request:', req.body);
    const {
      name,
      nric,
      tel,
      dob,
      sex,
      email,
      alamat,
      doctor,
      time,
      date,
      remarks
    } = req.body;

    // Validate required fields (remarks is optional)
    const requiredFields = ['name', 'nric', 'tel', 'dob', 'sex', 'email', 'alamat', 'doctor', 'time', 'date'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    // Call the proven quickRegister function, passing remarks
    const result = await quickRegister({
      name,
      nric,
      tel,
      dob,
      sex,
      email,
      alamat,
      doctor,
      time,
      date,
      remarks
    });

    console.log('✅ Appointment booked successfully:', result);
    res.json({
      success: true,
      message: 'Appointment booked successfully',
      result
    });
  } catch (error) {
    console.error('❌ Error booking appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Klinik Kenanga API server running on port ${PORT}`);
  console.log(`📝 Book appointment: POST http://localhost:${PORT}/api/book-appointment`);
}); 