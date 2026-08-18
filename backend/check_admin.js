const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  let admin = await prisma.admin.findUnique({ where: { email: 'admin@resolveit.gov' } });
  console.log('Current Admin data:', admin);
  
  if (admin) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      admin = await prisma.admin.update({
        where: { email: 'admin@resolveit.gov' },
        data: { password: hashedPassword, department: 'Management' }
      });
      console.log('Admin updated:', admin);
      console.log('Password successfully reset to: password123');
  } else {
      console.log('Admin not found in DB!');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
