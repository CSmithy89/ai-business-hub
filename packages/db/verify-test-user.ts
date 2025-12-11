
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'testuser@example.com';
    console.log(`Verifying user: ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: true },
        });
        console.log('User verified successfully:', user.id);
    } catch (error) {
        console.error('Error verifying user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
