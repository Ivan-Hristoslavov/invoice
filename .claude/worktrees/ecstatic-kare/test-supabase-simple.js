const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const cuid = require('cuid');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

async function testConnection() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test select
    console.log('1. Testing SELECT...');
    const { data: users, error: selectError } = await supabaseAdmin
      .from('User')
      .select('id, email, name')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Select error:', selectError.message);
      return false;
    } else {
      console.log('✅ Select works! Found', users?.length || 0, 'users');
    }

    // Test insert with generated ID
    console.log('\n2. Testing INSERT with generated ID...');
    const testEmail = `test-${Date.now()}@test.com`;
    const userId = cuid();
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('User')
      .insert({
        id: userId,
        email: testEmail,
        name: 'Test User',
        password: 'test_password_hash',
        updatedAt: new Date().toISOString(),
      })
      .select('id, email, name')
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      console.error('   Code:', insertError.code);
      return false;
    } else {
      console.log('✅ Insert works! Created user:', newUser);
      await supabaseAdmin.from('User').delete().eq('id', newUser.id);
      console.log('🧹 Cleaned up test user');
    }

    console.log('\n✅ All connection tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
