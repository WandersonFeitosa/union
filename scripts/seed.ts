const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create some initial items
  const items = [
    { name: "Thunderfury, Blessed Blade of the Windseeker", price: 5000, imageUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_sword_39.jpg" },
    { name: "Sulfuras, Hand of Ragnaros", price: 8000, imageUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_hammer_unique_sulfuras.jpg" },
    { name: "Warglaives of Azzinoth", price: 6000, imageUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_weapon_glave_01.jpg" },
    { name: "Atiesh, Greatstaff of the Guardian", price: 7000, imageUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_staff_medivh.jpg" },
    { name: "Val'anyr, Hammer of Ancient Kings", price: 5500, imageUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_mace_99.jpg" },
  ]

  console.log('Seeding items...')
  
  for (const item of items) {
    // Check if item already exists
    const existingItem = await prisma.item.findFirst({
      where: { name: item.name }
    })
    
    if (!existingItem) {
      await prisma.item.create({
        data: item
      })
      console.log(`Created item: ${item.name}`)
    } else {
      console.log(`Item already exists: ${item.name}`)
    }
  }
  
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 