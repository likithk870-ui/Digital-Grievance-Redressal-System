const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const prisma = new PrismaClient({});
const app = express();

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        const token = jwt.sign({ id: admin.id, email: admin.email, department: admin.department }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current Admin
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
    res.json(req.admin);
});

// Public Stats Counter
app.get('/api/public/stats', async (req, res) => {
    try {
        const total = await prisma.grievance.count();
        const pending = await prisma.grievance.count({ where: { status: 'Pending' } });
        const inProgress = await prisma.grievance.count({ where: { status: 'In Progress' } });
        const resolved = await prisma.grievance.count({ where: { status: 'Resolved' } });
        const urgent = await prisma.grievance.count({ where: { priority: 'Urgent' } });
        const activeOfficers = await prisma.admin.count();
        
        res.json({ total, pending, inProgress, resolved, urgent, activeOfficers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch public stats' });
    }
});

// Create Grievance
app.post('/api/grievances', async (req, res) => {
    try {
        const { title, description, category, area, customerPhone, customerEmail, priority, attachmentUrl } = req.body;
        
        // Auto-assign logic
        const adminMatch = await prisma.admin.findFirst({
            where: {
                department: { contains: category ? category.split(' ')[0] : '' },
                area: area
            }
        });

        const initialComments = [
            {
                author: 'System',
                role: 'System',
                comment: 'Grievance submitted and logged into system.',
                timestamp: new Date().toISOString()
            }
        ];

        if (adminMatch) {
            initialComments.push({
                author: adminMatch.name,
                role: adminMatch.department,
                comment: `Automatically assigned to ${adminMatch.name} (${adminMatch.department}) based on area and category matching.`,
                timestamp: new Date().toISOString()
            });
        }

        const grievance = await prisma.grievance.create({
            data: { 
                title, 
                description, 
                category: category || 'Other', 
                area: area || 'Unspecified', 
                customerPhone: customerPhone || 'N/A',
                customerEmail: customerEmail || 'N/A',
                priority: priority || 'Medium',
                attachmentUrl: attachmentUrl || null,
                assignedToId: adminMatch ? adminMatch.id : null,
                commentsJson: JSON.stringify(initialComments)
            }
        });
        res.status(201).json(grievance);
    } catch (error) {
        console.error('Error creating grievance:', error);
        res.status(500).json({ error: 'Failed to create grievance' });
    }
});

// Get all Grievances with Filter & Search
app.get('/api/grievances', authenticateAdmin, async (req, res) => {
    try {
        const { search, area, category, status, priority } = req.query;
        let whereClause = {};
        
        if (req.admin.department !== 'Management') {
            const deptPrefix = req.admin.department.split(' ')[0];
            whereClause.category = { contains: deptPrefix };
            
            // If they are not an 'All Zones' manager, restrict to their specific area
            if (req.admin.area !== 'All Zones') {
                whereClause.area = req.admin.area;
            }
        }

        if (area && area !== 'All') {
            whereClause.area = area;
        }
        if (category && category !== 'All') {
            whereClause.category = category;
        }
        if (status && status !== 'All') {
            whereClause.status = status;
        }
        if (priority && priority !== 'All') {
            whereClause.priority = priority;
        }
        if (search) {
            whereClause.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { id: { contains: search } },
                { customerPhone: { contains: search } }
            ];
        }

        const grievances = await prisma.grievance.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: true, resolvedBy: true }
        });
        res.json(grievances);
    } catch (error) {
        console.error('Error fetching grievances:', error);
        res.status(500).json({ error: 'Failed to fetch grievances' });
    }
});

// Export CSV of Grievances
app.get('/api/grievances/export/csv', authenticateAdmin, async (req, res) => {
    try {
        const grievances = await prisma.grievance.findMany({
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: true, resolvedBy: true }
        });

        const headers = ['ID', 'Title', 'Category', 'Area', 'Priority', 'Status', 'Phone', 'Created At', 'Assigned Officer', 'Rating'];
        const csvRows = [headers.join(',')];

        for (const g of grievances) {
            const row = [
                `"${g.id}"`,
                `"${(g.title || '').replace(/"/g, '""')}"`,
                `"${g.category}"`,
                `"${g.area}"`,
                `"${g.priority || 'Medium'}"`,
                `"${g.status}"`,
                `"${g.customerPhone}"`,
                `"${new Date(g.createdAt).toISOString()}"`,
                `"${g.assignedTo ? g.assignedTo.name : 'Unassigned'}"`,
                `"${g.rating || 'N/A'}"`
            ];
            csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="grievances_report.csv"');
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate CSV export' });
    }
});

// Get Grievance by ID
app.get('/api/grievances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const grievance = await prisma.grievance.findUnique({
            where: { id },
            include: { assignedTo: true, resolvedBy: true }
        });
        if (!grievance) {
            return res.status(404).json({ error: 'Grievance not found' });
        }
        res.json(grievance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch grievance' });
    }
});

// Submit Citizen Rating & Feedback
app.post('/api/grievances/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;
        
        const grievance = await prisma.grievance.update({
            where: { id },
            data: { rating: Number(rating), feedback }
        });

        res.json(grievance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

// Add Timeline Progress Comment
app.post('/api/grievances/:id/comments', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const grievance = await prisma.grievance.findUnique({ where: { id } });
        if (!grievance) return res.status(404).json({ error: 'Grievance not found' });

        let existingComments = [];
        try {
            existingComments = JSON.parse(grievance.commentsJson || '[]');
        } catch (e) {
            existingComments = [];
        }

        existingComments.push({
            author: req.admin.email,
            role: req.admin.department,
            comment,
            timestamp: new Date().toISOString()
        });

        const updated = await prisma.grievance.update({
            where: { id },
            data: { commentsJson: JSON.stringify(existingComments) }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Update Status
app.put('/api/grievances/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;
        
        const grievance = await prisma.grievance.findUnique({ where: { id } });
        if (!grievance) return res.status(404).json({ error: 'Grievance not found' });

        let existingComments = [];
        try {
            existingComments = JSON.parse(grievance.commentsJson || '[]');
        } catch (e) {
            existingComments = [];
        }

        const data = {};
        if (status) {
            data.status = status;
            if (status === 'Resolved') {
                data.resolvedById = req.admin.id;
            }
            existingComments.push({
                author: req.admin.email,
                role: req.admin.department,
                comment: `Status updated to ${status}`,
                timestamp: new Date().toISOString()
            });
        }
        if (priority) {
            data.priority = priority;
            existingComments.push({
                author: req.admin.email,
                role: req.admin.department,
                comment: `Priority level adjusted to ${priority}`,
                timestamp: new Date().toISOString()
            });
        }

        data.commentsJson = JSON.stringify(existingComments);

        const updatedGrievance = await prisma.grievance.update({
            where: { id },
            data
        });
        res.json(updatedGrievance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update grievance' });
    }
});

// Assign Grievance
app.put('/api/grievances/:id/assign', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;

        const grievance = await prisma.grievance.findUnique({ where: { id } });
        let existingComments = [];
        try {
            existingComments = JSON.parse(grievance?.commentsJson || '[]');
        } catch (e) {
            existingComments = [];
        }

        let assignedOfficerName = 'Unassigned';
        if (assignedToId) {
            const officer = await prisma.admin.findUnique({ where: { id: assignedToId } });
            if (officer) assignedOfficerName = `${officer.name} (${officer.department})`;
        }

        existingComments.push({
            author: req.admin.email,
            role: req.admin.department,
            comment: `Reassigned handling officer to: ${assignedOfficerName}`,
            timestamp: new Date().toISOString()
        });

        const updatedGrievance = await prisma.grievance.update({
            where: { id },
            data: { 
                assignedToId: assignedToId || null,
                commentsJson: JSON.stringify(existingComments)
            }
        });
        res.json(updatedGrievance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign grievance' });
    }
});

// Bulk Action Grievances
app.post('/api/grievances/bulk-action', authenticateAdmin, async (req, res) => {
    try {
        const { ids, status, reply } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ error: 'No IDs provided' });

        const data = {};
        if (status) {
            data.status = status;
            if (status === 'Resolved') {
                data.resolvedById = req.admin.id;
            }
        }

        await prisma.grievance.updateMany({
            where: { id: { in: ids } },
            data
        });

        if (reply && transporter) {
            const grievances = await prisma.grievance.findMany({ where: { id: { in: ids } } });
            for (const g of grievances) {
                if (g.customerPhone !== 'N/A') {
                    // Simulate sending SMS or Email based on phone/contact info
                    console.log(`\n--- BULK NOTIFICATION ---`);
                    console.log(`To: Customer Phone ${g.customerPhone}`);
                    console.log(`Re: Grievance ${g.id}`);
                    console.log(`Message: ${reply}`);
                    console.log(`-------------------------\n`);
                }
            }
        }

        res.json({ success: true, count: ids.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to perform bulk action' });
    }
});

// Get Staff
app.get('/api/staff', authenticateAdmin, async (req, res) => {
    try {
        const staff = await prisma.admin.findMany({
            select: { id: true, name: true, department: true, email: true, area: true, workPhone: true }
        });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

// Add Staff
app.post('/api/staff', authenticateAdmin, async (req, res) => {
    try {
        if (req.admin.department !== 'Management') {
            return res.status(403).json({ error: 'Forbidden. Super Admin access required.' });
        }
        
        const { name, department, area, workPhone, email, password } = req.body;
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await prisma.admin.create({
            data: { name, department, area, workPhone, email, password: hashedPassword },
            select: { id: true, name: true, department: true, email: true, area: true, workPhone: true }
        });
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create staff' });
    }
});

// Delete Staff
app.delete('/api/staff/:id', authenticateAdmin, async (req, res) => {
    try {
        if (req.admin.department !== 'Management') {
            return res.status(403).json({ error: 'Forbidden. Super Admin access required.' });
        }
        
        const { id } = req.params;
        await prisma.admin.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
});

// Create Support Message
app.post('/api/support', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const support = await prisma.supportMessage.create({
            data: { name, email, message }
        });
        res.status(201).json(support);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit support message' });
    }
});

// Get Support Messages
app.get('/api/support', authenticateAdmin, async (req, res) => {
    try {
        if (req.admin.department !== 'Management') {
            return res.status(403).json({ error: 'Forbidden. Only Management can view support messages.' });
        }
        
        const messages = await prisma.supportMessage.findMany({
            orderBy: { createdAt: 'desc' },
            include: { repliedBy: true }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch support messages' });
    }
});

// Reply to Support Message
app.put('/api/support/:id/reply', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        
        // Update database
        const message = await prisma.supportMessage.update({
            where: { id },
            data: {
                reply,
                repliedAt: new Date(),
                repliedById: req.admin.id
            },
            include: { repliedBy: true }
        });

        // Send Email using Nodemailer
        if (transporter) {
            const info = await transporter.sendMail({
                from: '"Digital Grievance System" <support@resolveit.gov>',
                to: message.email,
                subject: 'Re: Customer Support - Digital Grievance System',
                text: `Hello ${message.name},\n\nRegarding your message:\n"${message.message}"\n\nOur team (${message.repliedBy.department}) replied:\n${reply}\n\nThank you,\nResolveIt Support Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #2563EB;">Support Reply</h2>
                        <p>Hello <strong>${message.name}</strong>,</p>
                        <p>Regarding your message:</p>
                        <blockquote style="background: #f9f9f9; border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
                            ${message.message}
                        </blockquote>
                        <p>Our team (<strong>${message.repliedBy.department}</strong>) replied:</p>
                        <blockquote style="background: #eff6ff; border-left: 4px solid #2563EB; margin: 1.5em 10px; padding: 0.5em 10px;">
                            ${reply}
                        </blockquote>
                        <br/>
                        <p>Thank you,<br/><strong>ResolveIt Support Team</strong></p>
                    </div>
                `
            });

            console.log('\n=============================================');
            console.log('✉️  EMAIL SENT SUCCESSFULLY!');
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
            console.log('=============================================\n');
        }

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reply to support message' });
    }
});

const PORT = 5000;

// Seed Staff Accounts
const seedAdmin = async () => {
    const staffAccounts = [
        // Super Admin
        { name: 'General Manager', department: 'Management', area: 'All Zones', workPhone: '555-0000', email: 'admin@resolveit.gov', password: 'password123' },
        
        // Department Heads (All Zones)
        { name: 'Water Dept Head', department: 'Water Dept', area: 'All Zones', workPhone: '555-1000', email: 'water_head@resolveit.gov', password: 'password123' },
        { name: 'Roads Dept Head', department: 'Roads Dept', area: 'All Zones', workPhone: '555-2000', email: 'roads_head@resolveit.gov', password: 'password123' },
        { name: 'Electricity Dept Head', department: 'Electricity Dept', area: 'All Zones', workPhone: '555-3000', email: 'electricity_head@resolveit.gov', password: 'password123' },

        // Zone Workers
        { name: 'North Water Support', department: 'Water Dept', area: 'North Zone', workPhone: '555-0101', email: 'water_north@resolveit.gov', password: 'password123' },
        { name: 'South Water Support', department: 'Water Dept', area: 'South Zone', workPhone: '555-0102', email: 'water_south@resolveit.gov', password: 'password123' },
        { name: 'North Roads Support', department: 'Roads Dept', area: 'North Zone', workPhone: '555-0201', email: 'roads_north@resolveit.gov', password: 'password123' },
        { name: 'South Roads Support', department: 'Roads Dept', area: 'South Zone', workPhone: '555-0202', email: 'roads_south@resolveit.gov', password: 'password123' },
        { name: 'North Electricity Support', department: 'Electricity Dept', area: 'North Zone', workPhone: '555-0301', email: 'electricity_north@resolveit.gov', password: 'password123' },
        { name: 'South Electricity Support', department: 'Electricity Dept', area: 'South Zone', workPhone: '555-0302', email: 'electricity_south@resolveit.gov', password: 'password123' }
    ];

    for (const staff of staffAccounts) {
        const existing = await prisma.admin.findUnique({ where: { email: staff.email } });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(staff.password, 10);
            await prisma.admin.create({
                data: { name: staff.name, department: staff.department, area: staff.area, workPhone: staff.workPhone, email: staff.email, password: hashedPassword }
            });
        }
    }
    console.log('Area-specific staff created.');
};

app.listen(PORT, async () => {
    await seedAdmin();
    
    // Setup Ethereal Email Account
    console.log('Setting up Ethereal Email for testing...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
    console.log('Ethereal Email transporter ready!');
    
    console.log(`Server running on port ${PORT}`);
});
