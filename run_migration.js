const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aepcrocvcwijerkfsnlo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcGNyb2N2Y3dpamVya2ZzbmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2MDU0NCwiZXhwIjoyMDkwMDM2NTQ0fQ.PiXFEPOOt5KQPEgngFlrjY-_nCTtdtPjEbQSZoqWdJI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function runMigration() {
  try {
    console.log('🔄 Checking database schema...\n');

    // Try to query a record with position field
    const { data, error } = await supabase
      .from('applications')
      .select('id, position')
      .limit(1);

    if (error && error.message && error.message.includes('position')) {
      console.log('❌ Position column does NOT exist in database');
      console.log('\n🔧 To fix this, please:');
      console.log('1. Go to: https://app.supabase.com/project/aepcrocvcwijerkfsnlo');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Copy and paste the following SQL:');
      console.log(`
-- Add position column
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Create index
CREATE INDEX IF NOT EXISTS idx_applications_position
ON public.applications(user_id, status, position);

-- Set initial positions
UPDATE public.applications
SET position = row_number() OVER (PARTITION BY user_id, status ORDER BY created_at ASC) - 1;

-- Verify
SELECT COUNT(*) as total, COUNT(DISTINCT CASE WHEN position IS NOT NULL THEN 1 END) as with_position
FROM public.applications;
      `);
      console.log('\n5. Click "Run"');
      console.log('6. You should see matching counts for both columns');
      process.exit(1);
    } else if (data && data.length > 0 && 'position' in data[0]) {
      console.log('✅ Position column EXISTS and is working!');
      console.log(`   Found ${data.length} application(s) with position field`);
      process.exit(0);
    } else {
      console.log('⚠️  Could not determine column status');
      console.log('Please check manually in Supabase dashboard');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
