import { PrismaClient, ProductSize } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// Định nghĩa dữ liệu Menu
// ==========================================

interface ProductSeed {
  name: string;
  description?: string;
  category: string;
  allowToppings: boolean;
  imageUrl?: string;
  prices: { size: ProductSize; price: number }[];
}

const PRODUCTS: ProductSeed[] = [
  // ──────────────────────────────────────────
  // CÀ PHÊ PHIN TRUYỀN THỐNG (No topping)
  // ──────────────────────────────────────────
  {
    name: 'Phin Sữa Đá',
    description: 'Iced Coffee with Condensed Milk',
    category: 'phin',
    allowToppings: false,
    imageUrl: '/images/phin-sua-da.jpg',
    prices: [
      { size: 'S', price: 29000 },
      { size: 'M', price: 39000 },
      { size: 'L', price: 45000 },
    ],
  },
  {
    name: 'Phin Đen Đá',
    description: 'Iced Black Coffee',
    category: 'phin',
    allowToppings: false,
    imageUrl: '/images/phin-den-da.jpg',
    prices: [
      { size: 'S', price: 29000 },
      { size: 'M', price: 35000 },
      { size: 'L', price: 39000 },
    ],
  },
  {
    name: 'Bạc Xỉu',
    description: 'Iced White Phin Coffee & Condensed Milk',
    category: 'phin',
    allowToppings: false,
    imageUrl: '/images/bac-xiu.jpg',
    prices: [
      { size: 'S', price: 29000 },
      { size: 'M', price: 39000 },
      { size: 'L', price: 45000 },
    ],
  },

  // ──────────────────────────────────────────
  // TRÀ TRÁI CÂY & TRÀ SỮA (Có topping)
  // ──────────────────────────────────────────
  {
    name: 'Trà Sen Vàng',
    description: 'Tea with Lotus Seeds',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-sen-vang.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 55000 },
      { size: 'L', price: 65000 },
    ],
  },
  {
    name: 'Trà Thạch Đào',
    description: 'Tea with Peach Jelly',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-thach-dao.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 55000 },
      { size: 'L', price: 65000 },
    ],
  },
  {
    name: 'Trà Thanh Đào',
    description: 'Peach Tea with Lemongrass',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-thanh-dao.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 55000 },
      { size: 'L', price: 65000 },
    ],
  },
  {
    name: 'Trà Thạch Vải',
    description: 'Tea with Lychee Jelly',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-thach-vai.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 55000 },
      { size: 'L', price: 65000 },
    ],
  },
  {
    name: 'Trà Xanh Đậu Đỏ',
    description: 'Green Tea with Red Bean',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-xanh-dau-do.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 55000 },
      { size: 'L', price: 65000 },
    ],
  },
  {
    name: 'Trà Sữa Highlands',
    description: 'Highlands Milk Tea',
    category: 'tra',
    allowToppings: true,
    imageUrl: '/images/tra-sua-highlands.jpg',
    prices: [
      // KHÔNG có size S
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },

  // ──────────────────────────────────────────
  // FREEZE ĐÁ XAY (Có topping)
  // ──────────────────────────────────────────
  {
    name: 'Freeze Trà Xanh',
    description: 'Green Tea Freeze',
    category: 'freeze',
    allowToppings: true,
    imageUrl: '/images/freeze-tra-xanh.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },
  {
    name: 'Caramel Phin Freeze',
    description: 'Caramel Phin Freeze',
    category: 'freeze',
    allowToppings: true,
    imageUrl: '/images/caramel-phin-freeze.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },
  {
    name: 'Cookies & Cream',
    description: 'Cookies & Cream Freeze',
    category: 'freeze',
    allowToppings: true,
    imageUrl: '/images/cookies-cream.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },
  {
    name: 'Freeze Sô-Cô-La',
    description: 'Chocolate Freeze',
    category: 'freeze',
    allowToppings: true,
    imageUrl: '/images/freeze-socola.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },
  {
    name: 'Classic Phin Freeze',
    description: 'Classic Phin Freeze',
    category: 'freeze',
    allowToppings: true,
    imageUrl: '/images/classic-phin-freeze.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 65000 },
      { size: 'L', price: 69000 },
    ],
  },

  // ──────────────────────────────────────────
  // PHINDI – CÀ PHÊ THẾ HỆ MỚI (No topping)
  // ──────────────────────────────────────────
  {
    name: 'PhinDi Hạnh Nhân',
    description: 'Iced Coffee with Almond & Fresh Milk',
    category: 'phindi',
    allowToppings: false,
    imageUrl: '/images/phindi-hanh-nhan.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },
  {
    name: 'PhinDi Kem Sữa',
    description: 'Iced Coffee with Milk Foam',
    category: 'phindi',
    allowToppings: false,
    imageUrl: '/images/phindi-kem-sua.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },
  {
    name: 'PhinDi Choco',
    description: 'Iced Coffee with Chocolate',
    category: 'phindi',
    allowToppings: false,
    imageUrl: '/images/phindi-choco.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },

  // ──────────────────────────────────────────
  // ESPRESSO (No topping)
  // ──────────────────────────────────────────
  {
    name: 'Americano',
    description: 'Americano',
    category: 'espresso',
    allowToppings: false,
    imageUrl: '/images/americano.jpg',
    prices: [
      { size: 'S', price: 45000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },
  {
    name: 'Cappuccino / Latte',
    description: 'Cappuccino or Latte',
    category: 'espresso',
    allowToppings: false,
    imageUrl: '/images/cappuccino-latte.jpg',
    prices: [
      { size: 'S', price: 65000 },
      { size: 'M', price: 75000 },
      { size: 'L', price: 79000 },
    ],
  },
  {
    name: 'Caramel Macchiato',
    description: 'Caramel Macchiato / Mocha',
    category: 'espresso',
    allowToppings: false,
    imageUrl: '/images/caramel-macchiato.jpg',
    prices: [
      { size: 'S', price: 69000 },
      { size: 'M', price: 79000 },
      { size: 'L', price: 85000 },
    ],
  },

  // ──────────────────────────────────────────
  // THỨC UỐNG KHÁC (Có topping)
  // ──────────────────────────────────────────
  {
    name: 'Chanh Đá Xay',
    description: 'Ice Blended Lime Juice',
    category: 'other',
    allowToppings: true,
    imageUrl: '/images/chanh-da-xay.jpg',
    prices: [
      { size: 'S', price: 39000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },
  {
    name: 'Chanh Dây Đá Viên',
    description: 'Iced Passion Fruit Juice',
    category: 'other',
    allowToppings: true,
    imageUrl: '/images/chanh-day-da-vien.jpg',
    prices: [
      { size: 'S', price: 39000 },
      { size: 'M', price: 49000 },
      { size: 'L', price: 55000 },
    ],
  },
  {
    name: 'Sô-Cô-La Nóng/Đá',
    description: 'Dark Chocolate (hot or iced)',
    category: 'other',
    allowToppings: true,
    imageUrl: '/images/socola-nong-da.jpg',
    prices: [
      { size: 'S', price: 55000 },
      { size: 'M', price: 59000 },
      { size: 'L', price: 65000 },
    ],
  },
];

// ──────────────────────────────────────────
// DANH SÁCH TOPPING (Từ menu thực tế)
// ──────────────────────────────────────────
const TOPPINGS = [
  // Kem & Foam
  { name: 'Kem Sữa Mặn',      price: 9000,  imageUrl: '/images/toppings/kem-sua-man.jpg' },
  { name: 'Kem Tươi',          price: 9000,  imageUrl: '/images/toppings/kem-tuoi.jpg' },

  // Trân Châu (Boba)
  { name: 'Trân Châu Dừa',     price: 9000,  imageUrl: '/images/toppings/tran-chau-dua.jpg' },
  { name: 'Trân Châu Khoai Môn', price: 9000, imageUrl: '/images/toppings/tran-chau-khoai-mon.jpg' },
  { name: 'Trân Châu Trắng',   price: 9000,  imageUrl: '/images/toppings/tran-chau-trang.jpg' },

  // Thạch (Jelly)
  { name: 'Thạch Cà Phê',      price: 9000,  imageUrl: '/images/toppings/thach-ca-phe.jpg' },
  { name: 'Thạch Trà Xanh',    price: 9000,  imageUrl: '/images/toppings/thach-tra-xanh.jpg' },
  { name: 'Thạch Vải',         price: 9000,  imageUrl: '/images/toppings/thach-vai.jpg' },
  { name: 'Thạch Đào',         price: 9000,  imageUrl: '/images/toppings/thach-dao.jpg' },

  // Nguyên liệu khác
  { name: 'Củ Năng',            price: 9000,  imageUrl: '/images/toppings/cu-nang.jpg' },
  { name: 'Đậu Đỏ',            price: 9000,  imageUrl: '/images/toppings/dau-do.jpg' },
  { name: 'Hạt Sen',            price: 15000, imageUrl: '/images/toppings/hat-sen.jpg' },
  { name: 'Trái Vải',           price: 15000, imageUrl: '/images/toppings/trai-vai.jpg' },
  { name: 'Đào Lát',            price: 15000, imageUrl: '/images/toppings/dao-lat.jpg' },

  // Extra
  { name: 'Shot Espresso',      price: 10000, imageUrl: '/images/toppings/shot-espresso.jpg' },
];

// ==========================================
// Hàm Seed
// ==========================================

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Bước 1: Xoá dữ liệu cũ (thứ tự quan trọng!) ──
  console.log('🗑️  Đang xóa dữ liệu cũ...');
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.user.deleteMany();

  // ── Bước 2: Tạo Toppings ──
  console.log('🍡 Đang tạo Toppings...');
  const toppings = await Promise.all(
    TOPPINGS.map((t) =>
      prisma.topping.create({ data: t }),
    ),
  );
  console.log(`   ✅ Đã tạo ${toppings.length} toppings`);

  // ── Bước 3: Tạo Products + ProductPrices ──
  console.log('☕ Đang tạo Products...');
  let productCount = 0;
  let priceCount = 0;

  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        allowToppings: p.allowToppings,
        prices: {
          create: p.prices.map((pr) => ({
            size: pr.size,
            price: pr.price,
          })),
        },
      },
      include: { prices: true },
    });

    productCount++;
    priceCount += product.prices.length;
  }

  console.log(`   ✅ Đã tạo ${productCount} sản phẩm với ${priceCount} mức giá`);

  // ── Tổng kết ──
  console.log('\n🎉 Seeding hoàn tất!');
  console.log('────────────────────────────────────────');
  console.log(`   Toppings:       ${toppings.length}`);
  console.log(`   Products:       ${productCount}`);
  console.log(`   Product Prices: ${priceCount}`);
  console.log('────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
