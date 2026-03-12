export interface Env {
  DB: D1Database;
  TIKTOK_APP_ID: string;
  TIKTOK_SECRET: string;
  TIKTOK_REDIRECT_URI: string;
  PUBLISH_QUEUE: Queue<any>;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Configuração de CORS para o frontend no Cloudflare Pages
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Em prod, trocar pelo domínio do Pages
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Roteamento básico
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok", database: !!env.DB, queue: !!env.PUBLISH_QUEUE }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth Mock (Login)
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const { email, password } = await request.json() as any;
      // TODO: Implementar autenticação real com D1 e JWT
      return new Response(JSON.stringify({ 
        token: "mock-jwt-token", 
        user: { email, id: "user_123" } 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TikTok OAuth - Start
    if (url.pathname === "/api/oauth/tiktok/start") {
      const state = crypto.randomUUID();
      const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${env.TIKTOK_APP_ID}&state=${state}&redirect_uri=${encodeURIComponent(env.TIKTOK_REDIRECT_URI)}`;
      
      // TODO: Salvar 'state' no KV ou Cookie para validar no callback
      return Response.redirect(authUrl);
    }

    // TikTok OAuth - Callback
    if (url.pathname === "/api/oauth/tiktok/callback") {
      const code = url.searchParams.get("auth_code");
      
      if (!code) {
        return new Response("Erro: auth_code ausente", { status: 400 });
      }

      try {
        const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: env.TIKTOK_APP_ID,
            secret: env.TIKTOK_SECRET,
            auth_code: code,
          }),
        });

        const data = await response.json() as any;

        if (data.code !== 0) {
          return new Response(`Erro TikTok API: ${data.message}`, { status: 500 });
        }

        const { access_token, refresh_token, expires_in } = data.data;
        const workspace_id = "ws_123"; // Mock workspace_id
        const connection_id = crypto.randomUUID();

        // Salvar conexão no D1
        await env.DB.prepare(`
          INSERT INTO tiktok_connections (id, workspace_id, access_token, refresh_token, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          connection_id,
          workspace_id,
          access_token,
          refresh_token,
          Math.floor(Date.now() / 1000) + expires_in
        ).run();

        // Iniciar sincronização de contas de anúncio
        ctx.waitUntil((async () => {
          try {
            const accountsResponse = await fetch(`https://business-api.tiktok.com/open_api/v1.3/advertiser/get/?app_id=${env.TIKTOK_APP_ID}&secret=${env.TIKTOK_SECRET}`, {
              headers: { "Access-Token": access_token }
            });
            const accountsData = await accountsResponse.json() as any;
            
            if (accountsData.code === 0 && accountsData.data?.list) {
              for (const acc of accountsData.data.list) {
                await env.DB.prepare(`
                  INSERT INTO ad_accounts (id, workspace_id, connection_id, external_account_id, name, status, last_synced_at)
                  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(id) DO UPDATE SET 
                    name = excluded.name, 
                    status = excluded.status, 
                    last_synced_at = CURRENT_TIMESTAMP
                `).bind(
                  crypto.randomUUID(),
                  workspace_id,
                  connection_id,
                  acc.advertiser_id,
                  acc.advertiser_name,
                  acc.status
                ).run();
              }
            }
          } catch (e) {
            console.error("Erro ao sincronizar contas:", e);
          }
        })());

        return Response.redirect(`${new URL(env.TIKTOK_REDIRECT_URI).origin}/dashboard?success=true`);
      } catch (err) {
        return new Response("Erro interno ao processar OAuth", { status: 500 });
      }
    }

    // Listar contas de anúncio
    if (url.pathname === "/api/accounts" && request.method === "GET") {
      const workspace_id = "ws_123"; // Mock
      const { results } = await env.DB.prepare("SELECT * FROM ad_accounts WHERE workspace_id = ?").bind(workspace_id).all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar Job de Publicação
    if (url.pathname === "/api/jobs/publish" && request.method === "POST") {
      const { accounts, campaign } = await request.json() as any;
      const workspace_id = "ws_123"; // Mock
      const job_id = crypto.randomUUID();

      // 1. Criar o Job no D1
      await env.DB.prepare(`
        INSERT INTO publish_jobs (id, workspace_id, status, campaign_data)
        VALUES (?, ?, 'pending', ?)
      `).bind(job_id, workspace_id, JSON.stringify(campaign)).run();

      // 2. Criar os Job Items no D1
      for (const account_id of accounts) {
        await env.DB.prepare(`
          INSERT INTO publish_job_items (id, job_id, ad_account_id, status)
          VALUES (?, ?, ?, 'pending')
        `).bind(crypto.randomUUID(), job_id, account_id).run();
      }

      // 3. Enfileirar no Cloudflare Queues (se configurado)
      if (env.PUBLISH_QUEUE) {
        await env.PUBLISH_QUEUE.send({ job_id });
      }

      return new Response(JSON.stringify({ 
        job_id, 
        message: "Job de publicação enfileirado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Listar Jobs
    if (url.pathname === "/api/jobs" && request.method === "GET") {
      const workspace_id = "ws_123"; // Mock
      const { results } = await env.DB.prepare(`
        SELECT j.*, 
          (SELECT COUNT(*) FROM publish_job_items WHERE job_id = j.id) as total_items,
          (SELECT COUNT(*) FROM publish_job_items WHERE job_id = j.id AND status = 'success') as success_count,
          (SELECT COUNT(*) FROM publish_job_items WHERE job_id = j.id AND status = 'error') as error_count
        FROM publish_jobs j
        WHERE workspace_id = ?
        ORDER BY created_at DESC
      `).bind(workspace_id).all();
      
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detalhes do Job
    const jobDetailMatch = url.pathname.match(/\/api\/jobs\/([^\/]+)/);
    if (jobDetailMatch && request.method === "GET") {
      const job_id = jobDetailMatch[1];
      const job = await env.DB.prepare("SELECT * FROM publish_jobs WHERE id = ?").bind(job_id).first();
      const items = await env.DB.prepare(`
        SELECT i.*, a.name as account_name, a.external_account_id
        FROM publish_job_items i
        JOIN ad_accounts a ON i.ad_account_id = a.id
        WHERE i.job_id = ?
      `).bind(job_id).all();

      return new Response(JSON.stringify({ job, items: items.results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("TokScale API", { status: 200, headers: corsHeaders });
  },

  // Consumer para processar a fila
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { job_id } = message.body;
      
      // 1. Marcar job como processando
      await env.DB.prepare("UPDATE publish_jobs SET status = 'processing' WHERE id = ?").bind(job_id).run();

      // 2. Buscar itens e dados da campanha
      const job = await env.DB.prepare("SELECT * FROM publish_jobs WHERE id = ?").bind(job_id).first() as any;
      const items = (await env.DB.prepare("SELECT * FROM publish_job_items WHERE job_id = ?").bind(job_id).all()).results as any[];
      const campaign_data = JSON.parse(job.campaign_data);

      for (const item of items) {
        // Marcar item como processando
        await env.DB.prepare("UPDATE publish_job_items SET status = 'processing' WHERE id = ?").bind(item.id).run();

        try {
          // TODO: Lógica real de chamada à API do TikTok Ads
          // - Buscar token da conexão associada à conta
          // - Chamar endpoint de criação de campanha
          
          // Simulação de delay e sucesso
          await new Promise(r => setTimeout(r, 1000));
          
          await env.DB.prepare(`
            UPDATE publish_job_items 
            SET status = 'success', external_campaign_id = ?, finished_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind("cam_mock_" + crypto.randomUUID().slice(0,8), item.id).run();

        } catch (e: any) {
          await env.DB.prepare(`
            UPDATE publish_job_items 
            SET status = 'error', error_message = ?, finished_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(e.message, item.id).run();
        }
      }

      // 3. Finalizar job
      await env.DB.prepare("UPDATE publish_jobs SET status = 'completed', finished_at = CURRENT_TIMESTAMP WHERE id = ?").bind(job_id).run();
      message.ack();
    }
  }
};
