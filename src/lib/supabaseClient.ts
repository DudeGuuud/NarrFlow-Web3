import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qkulpswpdqcuazgtnbqv.supabase.co';
const supabaseKey = 'reserved';
 
export const supabase = createClient(supabaseUrl, supabaseKey); 