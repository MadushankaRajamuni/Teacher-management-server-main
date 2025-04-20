import express from 'express';

import { Department } from '../models/department.model';
import { Employee } from '../models/employee.model';
import { LeaveModel } from '../models/leave.model';
import { User } from '../models/user.model';
import { Log } from '../models/log.model';


const router = express.Router();

// GET dashboard summary - counts
router.get('/summary', async (req, res) => {
  try {
    const departments = await Department.countDocuments();
    const employees = await Employee.countDocuments();
    const users = await User.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const leavesToday = await LeaveModel.countDocuments({
      fromDate: { $lt: tomorrow },
      toDate: { $gte: today },
    });

    res.json({ departments, employees, users, leavesToday });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching summary' });
  }
});

router.get('/employee-count', async (req, res) => {
  try {
    const data = await Department.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: 'departmentId',
          as: 'employees',
        },
      },
      {
        $project: {
          departmentName: '$depName',
          count: { $size: '$employees' },
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching employee count by department' });
  }
});


// GET dashboard monthly-leaves - Bar chart
router.get('/monthly-leaves', async (req, res) => {
  try {
    const result = await LeaveModel.aggregate([
      {
        $group: {
          _id: { $month: '$fromDate' },
          leaves: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                months: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
              },
              in: { $arrayElemAt: ['$$months', '$_id'] },
            },
          },
          leaves: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching monthly leave stats' });
  }
});

// GET dashboard recent-logs - Activity feed
router.get('/recent-logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(5);
    const formatted = logs.map((log: any) => `${log.message} (${log.createdAt.toDateString()})`);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching logs' });
  }
});

export default router;
