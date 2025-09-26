const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://linker.up.railway.app'],
  credentials: true
}))
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Linker Database API',
    uptime: process.uptime()
  })
})

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// User routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, phone, password, role = 'USER' } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        role,
        status: 'PENDING'
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    res.status(201).json({ user })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { status, role } = req.body
    const updateData = {}

    if (status) updateData.status = status
    if (role) updateData.role = role

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true
      }
    })

    res.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (user.status !== 'APPROVED') {
      let message = 'Account not approved yet'
      if (user.status === 'REJECTED') message = 'Account has been rejected'
      if (user.status === 'SUSPENDED') message = 'Account has been suspended'
      
      return res.status(403).json({ error: message })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Verify token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Chat messages routes
app.get('/api/chat/messages', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const before = req.query.before

    const where = {}
    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' })
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })

    res.json({ message })
  } catch (error) {
    console.error('Create message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Issues routes
app.get('/api/issues', authenticateToken, async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ issues })
  } catch (error) {
    console.error('Get issues error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/issues', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority = 'MEDIUM' } = req.body

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' })
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })

    res.status(201).json({ issue })
  } catch (error) {
    console.error('Create issue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/issues/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority } = req.body
    const updateData = {}

    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const issue = await prisma.issue.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })

    res.json({ issue })
  } catch (error) {
    console.error('Update issue error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Proxy links routes
app.get('/api/proxies', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN'
    
    const proxies = await prisma.proxyLink.findMany({
      where: isAdmin ? {} : { status: 'ACTIVE' }, // Show all proxies for admins, only active for regular users
      orderBy: { createdAt: 'desc' }
    })

    res.json({ proxies })
  } catch (error) {
    console.error('Get proxies error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/proxies', authenticateToken, async (req, res) => {
  try {
    const { name, url, description, type = 'THIRD_PARTY' } = req.body

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' })
    }

    const proxy = await prisma.proxyLink.create({
      data: {
        name,
        url,
        description,
        type
      }
    })

    res.status(201).json({ proxy })
  } catch (error) {
    console.error('Create proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/proxies/:id', authenticateToken, async (req, res) => {
  try {
    const { name, url, description, type, status } = req.body
    const updateData = {}

    if (name) updateData.name = name
    if (url) updateData.url = url
    if (description !== undefined) updateData.description = description
    if (type) updateData.type = type
    if (status) updateData.status = status

    const proxy = await prisma.proxyLink.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json({ proxy })
  } catch (error) {
    console.error('Update proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/api/proxies/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    await prisma.proxyLink.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin stats route
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const [
      totalUsers,
      pendingUsers,
      totalMessages,
      totalIssues,
      openIssues,
      totalProxies,
      activeProxies
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.chatMessage.count(),
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'OPEN' } }),
      prisma.proxyLink.count(),
      prisma.proxyLink.count({ where: { status: 'ACTIVE' } })
    ])

    res.json({
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: totalUsers - pendingUsers
      },
      messages: {
        total: totalMessages
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        resolved: totalIssues - openIssues
      },
      proxies: {
        total: totalProxies,
        active: activeProxies
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Linker Database API Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})
