import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the calling user is authenticated and is a master
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is master using their JWT
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('user_id', caller.id)
      .single()

    if (profile?.role !== 'master') {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem convidar usuários' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, company_id } = await req.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const siteUrl = 'https://receitaflow.com'

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // If a pending invited user already exists, clean it up and resend the invite.
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, user_id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    let resentInvite = false

    if (existingProfile?.user_id) {
      const { data: existingAuthUser, error: existingAuthUserError } = await adminClient.auth.admin.getUserById(existingProfile.user_id)

      if (existingAuthUserError) {
        console.error('Failed to fetch existing invited user:', existingAuthUserError)
        return new Response(JSON.stringify({ error: 'Não foi possível validar o convite existente' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const authUser = existingAuthUser.user
      const isPendingInvite = authUser && !authUser.email_confirmed_at && !authUser.last_sign_in_at

      if (isPendingInvite) {
        resentInvite = true

        const { error: deleteAuthUserError } = await adminClient.auth.admin.deleteUser(authUser.id)
        if (deleteAuthUserError) {
          console.error('Failed to delete pending invited user:', deleteAuthUserError)
          return new Response(JSON.stringify({ error: 'Não foi possível reenviar o convite existente' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { error: deleteProfileError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', existingProfile.id)

        if (deleteProfileError) {
          console.error('Failed to delete pending invite profile:', deleteProfileError)
          return new Response(JSON.stringify({ error: 'Não foi possível atualizar o convite existente' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else {
        return new Response(JSON.stringify({ error: 'Este email já está cadastrado no sistema' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/reset-password`,
      data: {
        company_id: company_id || null,
      },
    })

    if (error) {
      console.error('Invite error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (company_id && data?.user?.id) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await adminClient
        .from('profiles')
        .update({ company_id })
        .eq('user_id', data.user.id)
    }

    return new Response(JSON.stringify({ success: true, resent: resentInvite, user_id: data?.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
