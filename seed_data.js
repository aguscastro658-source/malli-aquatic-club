
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfmvbbehyreegewwolfc.supabase.co';
const supabaseAnonKey = 'sb_publishable_gQnhcQsTe6QuMO6f02bLYQ_r_ZVfJQx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedTestData() {
    console.log('--- Creando datos de prueba ---');

    // 1. Crear Usuario de Prueba
    const testUser = {
        dni: '12345678',
        nombre: 'USUARIO PRUEBA (SOL)',
        password: '123',
        rol: 'usuario'
    };

    const { data: user, error: userError } = await supabase
        .from('malli_users')
        .upsert(testUser, { onConflict: 'dni' })
        .select()
        .single();

    if (userError) {
        console.error('Error al crear usuario:', userError);
        return;
    }
    console.log('✅ Usuario de prueba creado: 12345678');

    // 2. Inscribirlo en el Sorteo (Para que el punto sea VERDE)
    const participation = {
        dni: '12345678',
        last_seen: new Date().toISOString(),
        inscripted_at: new Date().toISOString()
    };

    const { error: partError } = await supabase
        .from('malli_raffle_participants')
        .upsert(participation, { onConflict: 'dni' });

    if (partError) {
        console.error('Error al inscribir en sorteo:', partError);
    } else {
        console.log('✅ Usuario inscrito en el sorteo (Punto Verde)');
    }

    // 3. Crear un segundo usuario NO participante (Para que el punto sea ROJO)
    const redUser = {
        dni: '87654321',
        nombre: 'USUARIO PRUEBA (LUNA)',
        password: '123',
        rol: 'usuario'
    };

    const { error: redUserError } = await supabase
        .from('malli_users')
        .upsert(redUser, { onConflict: 'dni' });

    if (redUserError) {
        console.error('Error al crear segundo usuario:', redUserError);
    } else {
        console.log('✅ Segundo usuario creado: 87654321 (Punto Rojo)');
    }

    console.log('\n--- LISTO! Refresca tu panel en el navegador (Ctrl+F5) ---');
}

seedTestData();
