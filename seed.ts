import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      phone: '+1234567890',
      email: 'admin@linker.local',
      role: 'SUPER_ADMIN',
      status: 'APPROVED'
    }
  })

  console.log('✅ Super Admin created:', superAdmin.username)

  // Create some demo proxy links
  const fancyProxies = [
    {
      name: 'Linker Secure Proxy',
      url: 'https://proxy1.linker.local',
      description: 'Our premium secure proxy service with high-speed connections',
      type: 'FANCY' as const,
      status: 'ACTIVE' as const
    },
    {
      name: 'Linker Stealth Proxy',
      url: 'https://proxy2.linker.local',
      description: 'Advanced stealth proxy with enhanced privacy features',
      type: 'FANCY' as const,
      status: 'ACTIVE' as const
    }
  ]

  const thirdPartyProxies = [
    {
      name: 'ProtonVPN',
      url: 'https://protonvpn.com',
      description: 'Secure VPN service with free tier available',
      type: 'THIRD_PARTY' as const,
      status: 'ACTIVE' as const
    },
    {
      name: 'Hide.me',
      url: 'https://hide.me',
      description: 'Free web proxy service',
      type: 'THIRD_PARTY' as const,
      status: 'ACTIVE' as const
    }
  ]

  for (const proxy of [...fancyProxies, ...thirdPartyProxies]) {
    const existingProxy = await prisma.proxyLink.findFirst({
      where: { name: proxy.name }
    })
    
    if (!existingProxy) {
      await prisma.proxyLink.create({
        data: proxy
      })
    }
  }

  console.log('✅ Demo proxy links created')

  // Create a demo regular user (pending approval)
  const demoUserPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: {
      username: 'demo_user',
      password: demoUserPassword,
      phone: '+1234567891',
      email: 'demo@example.com',
      role: 'USER',
      status: 'PENDING'
    }
  })

  console.log('✅ Demo user created:', demoUser.username, '(pending approval)')

  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('Super Admin - Username: admin, Password: admin123')
  console.log('Demo User - Username: demo_user, Password: demo123 (needs approval)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
