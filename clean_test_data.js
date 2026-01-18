
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfmvbbehyreegewwolfc.supabase.co';
const supabaseAnonKey = 'sb_publishable_gQnhcQsTe6QuMO6f02bLYQ_r_ZVfJQx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanData() {
    console.log('--- Eliminando datos de prueba ---');

    const dnis = ['12345678', '87654321'];

    // 1. Eliminar de participantes
    const { error: partError } = await supabase
        .from('malli_raffle_participants')
        .delete()
        .in('dni', dnis);

    if (partError) console.error('Error al limpiar participantes:', partError);
    else console.log('✅ Participantes eliminados.');

    // 2. Eliminar de usuarios
    const { error: userError } = await supabase
        .from('malli_users')
        .delete()
        .in('dni', dnis);

    if (userError) console.error('Error al limpiar usuarios:', userError);
    else console.log('✅ Usuarios eliminados.');

    console.log('\n--- LIMPIEZA COMPLETADA ---');
}

cleanData();
