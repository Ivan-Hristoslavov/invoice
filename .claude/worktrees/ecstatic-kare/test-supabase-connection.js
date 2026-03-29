require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

async function testConnection() {
  try {
    // Test with anon key
    console.log('1. Testing with ANON key (public operations)...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: users, error: anonError } = await supabase
      .from('User')
      .select('id, email')
      .limit(1);
    
    if (anonError) {
      console.log('   ⚠️  Anon key error (expected if RLS is enabled):', anonError.message);
    } else {
      console.log('   ✅ Anon key works! Found', users?.length || 0, 'users');
    }

    // Test with service role key (admin)
    console.log('\n2. Testing with SERVICE ROLE key (admin operations)...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('User')
      .select('id, email, name')
      .limit(5);
    
    if (adminError) {
      console.error('   ❌ Service role key error:', adminError.message);
      console.error('   Details:', adminError);
      return false;
    } else {
      console.log('   ✅ Service role key works!');
      console.log('   Found', adminUsers?.length || 0, 'users');
      if (adminUsers && adminUsers.length > 0) {
        console.log('   Sample user:', adminUsers[0]);
      }
    }

    // Test insert (with service role)
    console.log('\n3. Testing INSERT operation...');
    const testEmail = `test-${Date.now()}@test.com`;
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('User')
      .insert({
        email: testEmail,
        name: 'Test User',
        password: 'hashed_password_here'
      })
      .select('id, email, name')
      .single();

    if (insertError) {
      console.error('   ❌ Insert error:', insertError.message);
      console.error('   Details:', insertError);
      return false;
    } else {
      console.log('   ✅ Insert works! Created user:', newUser);
      
      // Clean up test user
      await supabaseAdmin
        .from('User')
        .delete()
        .eq('id', newUser.id);
      console.log('   🧹 Cleaned up test user');
    }

    console.log('\n✅ All connection tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
