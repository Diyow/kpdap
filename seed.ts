import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding mock data...');

  // 1. Seed Products (15 items)
  console.log('Seeding products...');
  for (let i = 1; i <= 15; i++) {
    const { error } = await supabase.from('products').insert({
      title: `Mock Product ${i}`,
      slug: `mock-product-${i}`,
      description: `This is a detailed description for mock product ${i}. It has multiple lines of text to test how the layout handles long descriptions in the product manager table.`,
      price: 150000 + (i * 10000),
      stock: 50 + i,
      weight: 500,
      image: `https://picsum.photos/seed/prod${i}/200/200`,
      images: [],
      specifications: {},
      variations: [],
      is_active: i % 5 !== 0 // 1 in 5 is draft
    });
    if (error) console.error(`Error inserting product ${i}:`, error.message);
  }

  // 2. Seed Articles (15 items)
  console.log('Seeding articles...');
  for (let i = 1; i <= 15; i++) {
    await supabase.from('articles').insert({
      title: `Mock Article ${i}: The Future of Tech`,
      slug: `mock-article-${i}-future-tech`,
      excerpt: `An insightful look into how technology is evolving in part ${i} of our series.`,
      content: `<p>This is the content for article ${i}.</p>`,
      cover_image_url: `https://picsum.photos/seed/art${i}/400/250`,
      is_published: i % 4 !== 0 // 1 in 4 is draft
    });
  }

  // 3. Seed Admins (15 items)
  console.log('Seeding admins...');
  for (let i = 1; i <= 15; i++) {
    const email = `mockadmin${i}@example.com`;
    // Create user in auth.users first
    const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'password123',
      email_confirm: true
    });
    
    if (authError) {
      console.error(`Error creating auth user ${i}:`, authError.message);
      continue; // skip admin_roles if auth fails
    }

    const mockId = userAuth.user.id;
    const { error } = await supabase.from('admin_roles').upsert({
      id: mockId,
      email: email,
      role: i % 3 === 0 ? 'superadmin' : 'admin'
    });
    if (error) console.error(`Error inserting admin ${i}:`, error.message);
  }

  // 4. Seed Customers (15 items) and Orders
  console.log('Seeding customers and orders...');
  for (let i = 1; i <= 15; i++) {
    const phone = `0812345678${i.toString().padStart(2, '0')}`;
    
    // Create customer
    await supabase.from('customers').upsert({
      phone: phone,
      name: `Mock Customer ${i}`,
      email: `customer${i}@example.com`
    });

    // Create 1-3 orders for this customer to populate the customers_summary
    const numOrders = (i % 3) + 1;
    for (let j = 0; j < numOrders; j++) {
      await supabase.from('orders').insert({
        customer_name: `Mock Customer ${i}`,
        customer_phone: phone,
        customer_email: `customer${i}@example.com`,
        shipping_address: `Jl. Mock Address No ${i}, Jakarta`,
        total_amount: 250000 + (j * 50000),
        status: 'completed',
        payment_method: 'qris',
        invoice_sent: true
      });
    }
  }

  console.log('Done seeding mock data!');
}

seed().catch(console.error);
