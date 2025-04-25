import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

/**
 * Endpoint to receive and log client-side errors
 */
router.post('/api/client-error', async (req, res) => {
  try {
    const { errorData, timestamp, userAgent, clientInfo } = req.body;
    
    // Get user info if available
    const userId = req.user?.id || null;
    
    // Log error to database
    await storage.logError({
      userId,
      errorMessage: `Client Error: ${errorData.statusText || 'Unknown error'}`,
      errorStack: JSON.stringify(errorData.errorContent),
      metadata: {
        url: errorData.url,
        clientInfo,
        userAgent,
        ...errorData
      },
      route: errorData.url,
      method: errorData.method,
      timestamp: new Date(timestamp)
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error logging client error:', err);
    res.status(500).json({ success: false, message: 'Error logging client error' });
  }
});

/**
 * Endpoint to retrieve error logs for admin users
 */
router.get('/api/error-logs', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to error logs' 
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    // Get error logs from database
    const logs = await storage.getErrorLogs(limit);
    
    res.status(200).json({ success: true, logs });
  } catch (err) {
    console.error('Error retrieving error logs:', err);
    res.status(500).json({ success: false, message: 'Error retrieving error logs' });
  }
});

export default router;