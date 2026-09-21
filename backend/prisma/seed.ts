import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Xóa dữ liệu cũ
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Tạo sản phẩm mẫu
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Cà phê sữa',
        price: 35000,
        imageUrl: '/images/ca-phe-sua.jpg',
        stock: 100,
        category: 'coffee',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Americano',
        price: 40000,
        imageUrl: '/images/americano.jpg',
        stock: 100,
        category: 'coffee',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cappuccino',
        price: 45000,
        imageUrl: '/images/cappuccino.jpg',
        stock: 100,
        category: 'coffee',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Trà đào',
        price: 39000,
        imageUrl: '/images/tra-dao.jpg',
        stock: 80,
        category: 'tea',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Trà vải',
        price: 39000,
        imageUrl: '/images/tra-vai.jpg',
        stock: 80,
        category: 'tea',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Matcha Latte',
        price: 50000,
        imageUrl: '/images/matcha-latte.jpg',
        stock: 60,
        category: 'specialty',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chocolate Đá Xay',
        price: 55000,
        imageUrl: '/images/chocolate-da-xay.jpg',
        stock: 50,
        category: 'specialty',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sinh tố Bơ',
        price: 45000,
        imageUrl: '/images/sinh-to-bo.jpg',
        stock: 40,
        category: 'smoothie',
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
