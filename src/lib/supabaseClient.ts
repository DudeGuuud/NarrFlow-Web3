import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qkulpswpdqcuazgtnbqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWxwc3dwZHFjdWF6Z3RuYnF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTMyMjYzNSwiZXhwIjoyMDYwODk4NjM1fQ.vUJCvbufPJ2an5S0Mt6a6fN7XelbJY93HuAmmspxNPc';
 
export const supabase = createClient(supabaseUrl, supabaseKey); 