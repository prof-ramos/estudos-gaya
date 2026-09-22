# Protegendo o `estudos-gaya` no Vercel: opções reais de controle de acesso

> **Pesquisa feita em 22/09/2026**, contra documentação primária do Vercel (páginas oficiais em `vercel.com/docs`, changelogs oficiais em `vercel.com/changelog`, guias oficiais em `vercel.com/kb`), mais a API oficial do Vercel, a documentação oficial do Vite e **verificação empírica ao vivo** contra o deployment publicado.
>
> Toda afirmação factual abaixo tem a URL da fonte. Afirmações que **não** consegui confirmar numa fonte primária estão marcadas explicitamente em [O que não consegui verificar](#o-que-não-consegui-verificar).

---

## TL;DR

1. **⚠️ O app está publicado e ABERTO AGORA.** O projeto foi deployado durante esta pesquisa e eu **testei ao vivo**: `GET https://estudos-gaya-ashen.vercel.app/` e `GET .../api/state` respondem **`200` sem nenhum login**, direto da internet. O `ssoProtection` do projeto está `null`, ou seja, **a Deployment Protection está desligada**. Na prática, qualquer pessoa com a URL consegue chamar `DELETE /api/state` e zerar o progresso.
2. **A correção é grátis e existe hoje.** *Vercel Authentication* no escopo *All Deployments* cobre site **e** `/api/*`, e é **grátis em todos os planos** desde o changelog de **09/09/2026** — antes disso, proteger produção custava um add-on de US$ 150/mês. O projeto está no plano **Hobby** (confirmado no payload do deployment).
3. **Password Protection** (senha simples) **não existe no Hobby**. É o que daria a melhor experiência para uma pessoa não técnica, mas custa **US$ 20/mês por projeto** no Pro.
4. **Token compartilhado em variável de ambiente para uma SPA é obfuscação, não segurança.** O bundle é público; qualquer token que o navegador precise enviar é legível por qualquer visitante. Não é uma opção defensável.
5. **Recomendação:** ligar **agora** *Vercel Authentication* com escopo **All Deployments** (grátis, cobre tudo, sem ambiguidade) e **não** usar token no cliente.

---

## Situação verificada do projeto

Antes das opções, os fatos do projeto — todos conferidos na API oficial do Vercel (`GET /v9/projects/{id}`), não deduzidos:

| Item | Valor | Como verifiquei |
| --- | --- | --- |
| Projeto | `estudos-gaya` | CLI + API oficial |
| Team / conta | `gabriel-ramos-projects-c715690c` (`team_thTifyIMfWAuhLF22YIAG7FM`, nome "ProfRamos"), dono `gabrielgfcramos` | CLI (`whoami`, `project inspect`) + API oficial |
| Framework / Node | `vite` / `24.x` | `vercel project inspect estudos-gaya` |
| Plano | **`hobby`** | Campo `plan` no payload do deployment (API oficial) |
| Deployment atual | `dpl_6Nf8CzFM8f4ztBbv8ZiqPMSPf7Vp`, target **production**, estado `READY` | API oficial (`/v6/deployments`) |
| URL pública | `https://estudos-gaya-ashen.vercel.app` (+ `estudos-gaya-gabriel-ramos-projects-c715690c.vercel.app`) | API oficial + teste ao vivo |
| Domínios customizados | **Nenhum** (`apexName: "vercel.app"`) | API oficial (`/v9/projects/{id}/domains`) |
| `ssoProtection` | **`null`** → Vercel Authentication **desligado** | API oficial |
| `passwordProtection` | `null` (desligado) | API oficial |
| `trustedIps` | `null` (desligado) | API oficial |

### Verificação ao vivo (a parte mais importante)

Testei o deployment publicado, direto da internet, **sem cookies e sem autenticação**:

```text
GET https://estudos-gaya-ashen.vercel.app/                       → HTTP 200
GET https://estudos-gaya-ashen.vercel.app/api/state              → HTTP 200  {"topics":[],"sessions":[]}
GET https://estudos-gaya-ashen.vercel.app/api/state?cb=<único>   → HTTP 200  (x-vercel-cache: MISS)
GET https://estudos-gaya-ashen.vercel.app/<caminho-inexistente>  → HTTP 200
```

Pontos-chave dessa verificação:

- **Usei query strings únicas** (`x-vercel-cache: MISS`) para descartar que o `200` viesse de cache do CDN. A resposta continuou `200` — logo, **não há portão de autenticação na borda**.
- O `GET /api/state` devolveu o JSON real da aplicação (`{"topics":[],"sessions":[]}`), não uma página de login. **A função serverless está acessível publicamente.**
- Não havia header `Location` (redirect para login) nem `Set-Cookie` de sessão de proteção.
- O app shell também é servido publicamente (título `Estudos Gaya — Plano de estudos TCDF`).

**Conclusão:** hoje o `DELETE /api/state` está exposto. Não executei o `DELETE` (seria destrutivo e a instrução proíbe mutações), mas como o `GET` na mesma rota passa sem autenticação, e a doc oficial afirma que a proteção agiria "antes do seu código de aplicação" interceptando **todo** request, a ausência dela significa que o `DELETE` também passa. **Isso é a vulnerabilidade descrita na pergunta, confirmada na prática.**

> **Nota sobre um detalhe que quase me enganou:** num primeiro momento li o campo `ssoProtection` de um projeto e vi `"deploymentType": "all_except_custom_domains"`, o que sugeria proteção ligada. Ao reconferir, percebi que existem **dois projetos com o mesmo nome** `estudos-gaya` (um na conta/team antiga, hoje inacessível — `404` na API —, e o atual em `ProfRamos`). O projeto **efetivamente vinculado a este repositório** (`.vercel/project.json`) é `prj_aOcP6OievYK4e6gszhDUmKdl9QuO`, e **nele** o `ssoProtection` é `null`. Vale a lição: conferir o ID do projeto vinculado, não só o nome.

O endpoint destrutivo é o `DELETE /api/state` em `api/state.ts` (runtime `edge`), que zera tópicos e sessões — exatamente o cenário da pergunta.

---

## Opção 1 — Vercel Deployment Protection

Fonte principal: [Deployment Protection on Vercel](https://vercel.com/docs/deployment-protection)

### O que ela cobre

A documentação oficial de Deployment Protection abre com uma frase que responde direto à pergunta mais importante:

> "Deployment Protection requires authentication for **all requests**, including those to Routing Middleware."

Fonte: [vercel.com/docs/deployment-protection](https://vercel.com/docs/deployment-protection)

E o guia oficial de password protection detalha o mecanismo:

> "Protection runs at Vercel's edge, **before your application code**. It intercepts every request, including Routing Middleware, CORS preflights, server-to-server calls, and static file requests, **before your route handlers run**."

Fonte: [How do I add password protection to my Vercel deployment?](https://vercel.com/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment)

**Conclusão para a pergunta "protege o site estático E as serverless functions?": sim, protege os dois.** A proteção roda na borda (edge), antes de qualquer código de aplicação. Isso inclui:

- os arquivos estáticos do SPA (HTML/JS/CSS),
- as funções serverless em `/api/*`.

Confirmação adicional vinda do lado das automações: a doc oficial diz que sistemas automatizados, ao baterem num deployment protegido, "recebem uma página de login ou uma resposta `403` **em vez do conteúdo do deployment**", e o exemplo oficial usa literalmente uma rota de API:

```bash
curl -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET" \
  https://your-deployment.vercel.app/api/endpoint
```

Fonte: [Automated & Agent Access](https://vercel.com/docs/deployment-protection/automated-agent-access)

Ou seja: um `curl -X DELETE https://estudos-gaya.vercel.app/api/state` sem cookie de autenticação **não chega** no seu handler. É bloqueado antes.

### Os métodos de proteção

| Método | O que faz | Hobby | Pro | Enterprise |
| --- | --- | --- | --- | --- |
| **Vercel Authentication** | Só entra quem estiver logado no Vercel com acesso ao projeto | ✅ Incluído | ✅ Incluído | ✅ Incluído |
| **Password Protection** | Senha definida por você | ❌ **Não disponível** | US$ 20/mês por projeto protegido | ✅ Incluído no nível do time |
| **Passport** | Login via seu próprio provedor de identidade (Okta, Auth0…) | ❌ Não disponível | ❌ Não disponível | ✅ Incluído |
| **Trusted IPs** | Só entra quem vier de IPs da lista | ❌ Não disponível | ❌ Não disponível | ✅ Incluído |

Fonte: [Usage & Pricing for Deployment Protection](https://vercel.com/docs/deployment-protection/usage-and-pricing)

O mesmo documento reforça sobre Password Protection: *"Not available on Hobby — Upgrade to Pro to enable Password Protection"*. A página de Password Protection repete a tabela: *"Hobby | Not available | Upgrade to Pro"*. Fonte: [Password Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection)

A visão do plano Hobby na doc de planos é consistente:

> "Deployment Protection: **Vercel Authentication for preview and production deployments**, Deployment Protection Exceptions, and Shareable Links"

Fonte: [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)

**Resposta direta: sim, Password Protection é exclusiva de plano pago.** No Hobby ela não aparece como opção.

### Os escopos (o que exatamente é protegido)

Fonte: [Choose which URLs to protect](https://vercel.com/docs/deployment-protection#choose-which-urls-to-protect)

| Escopo | O que protege |
| --- | --- |
| **Standard Protection** | "Protects all deployments **except** production domains" |
| **All Deployments** | "Protects **all** URLs, including production domains" |
| (Legacy) Standard Protection | previews + deployment URLs; produção atual fica pública |
| (Legacy) Pre-Production Deployments | só previews |
| Only Production Deployments | só com Trusted IPs → **Enterprise apenas** |

Na tabela de preços, **Standard Protection e All Deployments aparecem ambos como "Included" no Hobby**. Fonte: [Usage & Pricing for Deployment Protection](https://vercel.com/docs/deployment-protection/usage-and-pricing)

E o changelog oficial de **09/09/2026** fecha a questão do custo:

> "Vercel Authentication can now protect **all deployments in a project, including production, at no additional cost on every plan**. Previously, protecting production domains required the $150-per-month Advanced Deployment Protection add-on. […] Protect preview and production URLs for free by selecting **All Deployments** for Vercel Authentication."

Fonte: [Protect production deployments for free on every plan](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan)

### É ligado por padrão? Afeta produção ou só preview?

Três fontes primárias, em ordem cronológica:

1. **Nov/2023** — [Deployment Protection is now enabled by default for new projects](https://vercel.com/changelog/deployment-protection-is-now-enabled-by-default-for-new-projects): *"Deployment Protection is now enabled by default for all new projects […] For all new deployments, Deployment Protection with Vercel Authentication is now enabled by default."*
2. **Jul/2025** — [More Secure Deployment Protection](https://vercel.com/changelog/more-secure-deployment-protection): o Standard Protection foi endurecido para novos projetos, passando a proteger **todos os domínios gerados automaticamente, incluindo o domínio git da branch de produção** (`project-git-main.vercel.app`).
3. **Jan/2026** — [Set team-wide defaults for Deployment Protection](https://vercel.com/changelog/set-team-wide-defaults-for-deployment-protection): *"New projects start with Deployment Protection set to **Standard Protection**, which protects Preview Deployments by default."* Dá para escolher o padrão do time: All Deployments, Standard Protection ou None.

**Então: sim, é ligado por padrão em projetos novos, e não é só preview.** O padrão é *Standard Protection*, que cobre previews **e** os domínios gerados automaticamente (incluindo o de produção), deixando de fora apenas o domínio customizado de produção.

E isso explica o que li no projeto **vinculado a este repositório**: o enum da API é `all_except_custom_domains`, que significa literalmente "tudo, exceto domínios customizados". Como `estudos-gaya-ashen.vercel.app` **não é** um domínio customizado (é um domínio gerado pelo Vercel), a leitura direta é que o Standard Protection cobriria esse endereço. **Porém, hoje o `ssoProtection` desse projeto está `null`** — a proteção está desligada, e o teste ao vivo confirmou isso. Ou seja: o escopo do Standard Protection é uma questão interessante, mas neste momento não há proteção alguma para escopar. Veja [O que não consegui verificar](#o-que-não-consegui-verificar).

### O que a pessoa não técnica teria que fazer no dia a dia

Com Vercel Authentication ligado:

- Ao abrir o site, ela é redirecionada para um login do Vercel. A doc diz: *"Users attempting to access the deployment will encounter a Vercel login redirect. If already logged into Vercel, Vercel will authenticate them automatically."* Depois do login, *"Vercel redirects the user and sets a cookie in the browser if they have view access."* Fonte: [Restrict access to deployments with Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- **Ela precisa de uma conta no Vercel** e precisa ter acesso concedido ao projeto.
- No **Hobby**, há um limite explícito: *"Those on the Hobby plan can only have **one external user per account**."* Fonte: [Vercel Authentication → Access requests](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication#access-requests)
- Quem tenta entrar sem acesso pode pedir acesso, o que dispara um e-mail para os autores da branch, que podem aprovar ou negar.

**Fricção honesta:** isso significa "criar conta no Vercel + pedir/ter acesso concedido + eventualmente refazer login se o cookie expirar". Para uma pessoa não técnica, isso é mais atrito do que uma senha. Mas é **grátis** e funciona. E como ela é a única usuária externa necessária, o limite de "1 usuário externo" do Hobby é suficiente.

---

## Opção 2 — Protection Bypass for Automation

Fonte principal: [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)

### Como funciona

- Você gera um ou mais **secrets** por projeto em *Settings → Deployment Protection → Protection Bypass for Automation*.
- O Vercel injeta automaticamente um deles como a variável de sistema `VERCEL_AUTOMATION_BYPASS_SECRET`.
- O request passa a proteção enviando o secret num header (recomendado) ou query param:

```bash
x-vercel-protection-bypass: your-generated-secret
```

- Para navegação in-browser, existe o header extra `x-vercel-set-bypass-cookie: true`, que faz o Vercel devolver um cookie via `Set-Cookie`, autenticando os requests seguintes.
- **Disponível em todos os planos, inclusive Hobby.** Fonte: [Usage & Pricing for Deployment Protection](https://vercel.com/docs/deployment-protection/usage-and-pricing)

### O frontend precisa disso para chamar a própria API?

**Não. E isso é o ponto mais importante desta seção.**

A própria doc de Deployment Protection diz, ao explicar o escopo Standard Protection:

> "Bypassing protection using Protection Bypass for Automation is an option but **not required for requests targeting the same domain**."
>
> "For client-side requests, use **relative paths** in the fetch call to target the current domain. This **automatically includes the user's authentication cookie** for protected URLs."

Fonte: [How to migrate to Standard Protection](https://vercel.com/docs/deployment-protection#how-to-migrate-to-standard-protection)

Aplicado ao seu caso: o `src/lib/api.ts` já chama `fetch('/api/state')` com **caminho relativo**. O guia oficial de password protection confirma o mesmo padrão: *"For client-side calls, use a relative path so the cookie is included automatically: `fetch('/some/path')`"*. Fonte: [How do I add password protection to my Vercel deployment?](https://vercel.com/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment)

Ou seja: **o cookie de autenticação do Vercel Authentication já viaja junto automaticamente no mesmo domínio.** O SPA funciona sem nenhum token. PBA seria necessário apenas para automação externa (CI, webhooks, agentes).

### Pitfalls de token que a doc destaca

- **Query param vaza em logs:** *"When using the query parameter method, the secret appears in the URL. URLs are often logged by proxies, CDNs, and server access logs. Prefer the header method."* Fonte: [Automated & Agent Access](https://vercel.com/docs/deployment-protection/automated-agent-access)
- **Regenerar o secret invalida deployments antigos:** *"Revoking a secret invalidates it for all existing deployments. Redeploy your project so deployments receive the updated `VERCEL_AUTOMATION_BYPASS_SECRET` value."* Fonte: [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- **O secret não vence DDoS/ataque ativo:** *"Your automation bypass token cannot override: Active DDoS mitigations […] Rate limits during attacks […] Security challenges during attacks."* Mesma fonte.
- **Se o secret for para o bundle do cliente, acabou a proteção.** Esse é o erro fatal que a próxima seção explica.

---

## Opção 3 — Token compartilhado em variável de ambiente (o problema da honestidade)

**Resposta definitiva: não. Para uma SPA client-side, um token que o navegador precisa enviar não pode ser mantido em segredo. Isso é obfuscação, não segurança.**

### Por que, com fonte

O Vite é explícito na documentação oficial:

> "Variables prefixed with `VITE_` will be exposed in client-side source code after Vite bundling. **To prevent accidentally leaking env variables to the client, avoid using this prefix.**"
>
> "⚠️ **Protecting secrets** — `VITE_*` variables should *not* contain sensitive information such as API keys. **The values of these variables are bundled into your source code at build time.** For production deployments, consider a backend server or serverless/edge functions to properly secure secrets."

Fonte: [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode)

E do lado do Vercel, o guia oficial de autenticação lista exatamente esse erro como um dos pitfalls mais comuns:

> "**`NEXT_PUBLIC_` leaks:** Any environment variable prefixed with `NEXT_PUBLIC_` is bundled into client JavaScript and **visible to anyone**. Keep secrets in server-only environment variables."

Fonte: [Application authentication on Vercel](https://vercel.com/kb/guide/application-authentication-on-vercel)

O Vercel documenta o equivalente para Vite: para o Vite enxergar variáveis do Vercel no build, é preciso **prefixar com `VITE_`** — que é exatamente o prefixo que o Vite publica no bundle. Fonte: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

### O que acontece na prática

Uma SPA é só arquivos estáticos. Qualquer visitante — e qualquer `curl` — pode baixar o JS. Se o token estiver embutido, ele está no arquivo `.js` servido publicamente. Basta um "Find" no bundle.

Há ainda um segundo problema, estrutural: numa SPA pura **não existe** código server-side rodando no momento do request para ler uma variável secreta. Então uma variável *sem* prefixo `VITE_` simplesmente não é visível no navegador (o Vite a remove do bundle) — ela seria `undefined`. Você não consegue "ler o segredo no servidor" porque não há servidor renderizando. As únicas saídas são: (a) colocar no bundle e aceitar que é público, ou (b) colocar a verificação no próprio handler serverless.

### Threat model real

| Ameaça | Token no cliente resolve? |
| --- | --- |
| Alguém descobre a URL e roda `curl` às cegas | ✅ Sim, bloqueia |
| Scanner/bot automatizado genérico | ✅ Sim, bloqueia |
| Pessoa curiosa que abre o DevTools / lê o bundle | ❌ **Não** |
| Atacante determinado que baixa o JS e extrai o token | ❌ **Não** |

O único ganho real é elevar o custo de "descoberta casual" para "leitura do bundle". Isso tem valor, mas é **obfuscação**. Não deve ser descrito como segurança, e não deve ser a única defesa de um endpoint destrutivo.

**Nota adicional relevante:** o repositório é público no GitHub. Variáveis de ambiente **não** ficam no repositório (isso é bom), mas o *bundle compilado* é servido publicamente a todo visitante — e é de lá que o token vazaria. Repositório público e bundle público são vazamentos independentes.

**Se ainda assim quiser uma segunda camada**, o lugar certo para a verificação é **dentro de `api/state.ts`** (server-side), comparando o header recebido com uma variável de ambiente **sem** prefixo `VITE_`. Isso não impede o vazamento, mas garante que a checagem roda onde deveria. Ainda assim: é obfuscação.

---

## Opção 4 — Outras opções nativas que existem hoje

### 4.1 Vercel Firewall / WAF custom rules — **existe e é grátis no Hobby**

O Vercel WAF permite criar regras customizadas com ações `log`, `deny`, `challenge`, `bypass` e `redirect`. Fonte: [WAF Custom Rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)

**Limites por plano — Hobby tem direito a regras:**

| Recurso | Hobby | Pro | Enterprise |
| --- | --- | --- | --- |
| Project-level IP Blocking | Até 3 | Até 100 | Até 1000 |
| **Custom Rules** | **Até 3** | Até 40 | Até 1000 |
| Custom Rule Parameters | Todos | Todos | Todos |
| WAF Managed Rulesets | N/A | N/A | Contato comercial |

Fonte: [Vercel WAF — Limits](https://vercel.com/docs/vercel-firewall/vercel-waf#limits)

Os parâmetros disponíveis incluem **Request Path**, **Method**, **User Agent**, **Request Header**, **Query**, **Cookie**, **IP Address**, **Country**, **AS Number** e os fingerprints TLS **JA3/JA4**. Fonte: [Rule Configuration Reference](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration)

Preço: *"Vercel Firewall features available on all plans are free to use. This includes DDoS mitigation, IP blocking, and custom rules."* Fonte: [Usage & Pricing for Vercel WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)

Também é configurável declarativamente em `vercel.json`, via `routes[].mitigate` com `action: "deny"` ou `"challenge"`, combinado com `methods`, `has` e `missing`. Fonte: [WAF Custom Rules — Configuration in vercel.json](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules#configuration-in-verceljson)

**O que isso dá na prática:** você pode, por exemplo, negar `DELETE` em `/api/state` que não venha de um header específico, ou negar tráfego não-navegador (a própria Vercel publica um guia oficial para *"Deny non-browser traffic or blocklisted ASNs"* usando o critério "user agent não contém `Mozilla`"). Fonte: [Deny non-browser traffic or blocklisted ASNs](https://vercel.com/kb/guide/deny-non-browser-traffic-or-blocklisted-asns)

**Limitação honesta:** isso barra `curl` ingênuo, mas **não** barra quem spoofa user agent ou usa um navegador de verdade. Mesmo problema de obfuscação da Opção 3. Como *camada extra* sobre Deployment Protection, é útil; como defesa única, não.

**Ordem de execução** (importante para não se confundir): firewall de plataforma → deployment protection → WAF custom rules. Fonte: [Firewall concepts — How Vercel secures requests](https://vercel.com/docs/vercel-firewall/firewall-concepts#how-vercel-secures-requests)

### 4.2 IP allowlisting — **não é viável aqui**

- **Trusted IPs** (allowlist de IPv4/CIDR) é **Enterprise apenas**. Fonte: [Usage & Pricing for Deployment Protection](https://vercel.com/docs/deployment-protection/usage-and-pricing)
- **WAF IP Blocking** existe no Hobby (até 3), mas é *blocklist*, não *allowlist*, e IPs residenciais são dinâmicos. A própria Vercel alerta: *"Automated systems on serverless platforms, cloud infrastructure, or shared CI/CD runners have IP addresses that change between requests."* Fonte: [Automated & Agent Access — Why Trusted IPs may not work](https://vercel.com/docs/deployment-protection/automated-agent-access#why-trusted-ips-may-not-work-for-automation)

### 4.3 Routing middleware / `proxy` — **existe, mas é o mesmo problema de segredo**

O Vercel suporta *Routing Middleware*, configurável via `proxy` no `vercel.json` ou convenção `middleware.ts`, rodando antes do request ser processado. Fonte: [Routing Middleware](https://vercel.com/docs/routing-middleware)

Isso permitiria implementar Basic Auth no edge. **Mas:** (a) a própria Vercel classifica esse caminho como *workaround* documentado para o Hobby, e (b) a doc oficial explica que middleware de aplicação é **cego** a superfícies que a proteção nativa cobre — *"it covers generated `vercel.app` URLs, past production deployment URLs, and static assets that application-layer middleware is blind to."* Fonte: [How do I add password protection to my Vercel deployment?](https://vercel.com/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment)

Além disso, qualquer credencial que o SPA precise enviar cai no mesmo problema da Opção 3.

### 4.4 "Deixar o projeto privado" — **não encontrei essa opção**

Procurei por um ajuste nativo de "projeto privado/público" na documentação oficial de projetos e configurações de projeto e **não encontrei** um toggle desse tipo. O que existe e cumpre esse papel é exatamente **Deployment Protection** — que neste projeto está **desligada** no momento.

Fonte consultada: [Project settings](https://vercel.com/docs/project-configuration/project-settings) (lista: domains, env vars, Git, integrations, **Deployment Protection**, functions, cron, project members, webhooks, drains, security settings — nenhum "visibilidade do projeto"). Ver também [Access Control](https://vercel.com/docs/security/access-control), que trata a proteção via Password Protection e Vercel Authentication.

Tornar o **repositório** privado no GitHub é uma coisa diferente e **não** afeta o site publicado — o bundle continua público.

### 4.5 Bônus: Vercel BotID — existe, grátis no Hobby, mas não é controle de acesso

BotID é um CAPTCHA invisível que roda por request. O nível **Basic** é *"provided free of charge for all plans"*. Fonte: [BotID — Pricing](https://vercel.com/docs/botid#pricing)

Serve para barrar bots sofisticados em rotas sensíveis, mas **não** é um controle de acesso: não impede uma pessoa com a URL de apagar dados. Mencionado apenas para completude — não resolve o problema descrito.

---

## Comparação final

> **Estado atual:** hoje **nenhuma** destas opções está ativa no projeto — `ssoProtection`, `passwordProtection` e `trustedIps` estão todos `null`. A tabela compara o que cada opção **ofereceria** se ligada.

| Opção | Plano necessário | Protege estático? | Protege `/api/*`? | Segurança real? | Esforço da usuária não técnica |
| --- | --- | --- | --- | --- | --- |
| **Vercel Authentication — All Deployments** | **Hobby (grátis)** | ✅ | ✅ | ✅ Sim | Login no Vercel (conta + acesso concedido) |
| Vercel Authentication — Standard Protection | Hobby (grátis) | ✅ | ✅ | ✅ Sim | Idem (mas com ambiguidade de escopo — ver ressalvas) || Password Protection | **Pro — US$ 20/mês por projeto** | ✅ | ✅ | ✅ Sim | **Só digitar uma senha** (melhor UX) |
| Trusted IPs | Enterprise | ✅ | ✅ | ✅ Sim | Irrelevante (IP dinâmico) |
| Passport | Enterprise | ✅ | ✅ | ✅ Sim | Login no IdP |
| Protection Bypass for Automation | Hobby (grátis) | — | — | ✅ Se o secret não vazar | Não se aplica (é para automação) |
| **Token no bundle do cliente** | Hobby (grátis) | ❌ | ⚠️ | ❌ **Obfuscação** | Nenhum (mas não protege) |
| WAF custom rules | Hobby (grátis, até 3) | ✅ | ✅ | ⚠️ Parcial (burlável) | Nenhum |
| Routing Middleware (Basic Auth) | Hobby (grátis) | ⚠️ Parcial | ✅ | ❌ Se a credencial for para o cliente | Nenhum (mas é workaround) |
| BotID Basic | Hobby (grátis) | ❌ | ❌ | ❌ (não é controle de acesso) | Nenhum |

---

## O que não consegui verificar

Sendo explícito sobre os limites desta pesquisa:

1. **A definição precisa de "production domain" na frase do Standard Protection — PARCIALMENTE RESOLVIDA empiricamente.** Antes de tudo, para não deixar implícito o contrário: **isto não significa que a proteção esteja ligada hoje.** No projeto vinculado a este repositório (`prj_aOcP6OievYK4e6gszhDUmKdl9QuO`, conforme `.vercel/project.json`), o `ssoProtection` é **`null`** e o teste ao vivo confirma que o site e o `/api/state` estão públicos. O que está em discussão neste item é apenas *o que o escopo cobriria se fosse ligado*. Dito isso: a doc diz que Standard Protection "protects all domains **except production domains**" e o link de "production domains" aponta para a página sobre **adicionar domínio customizado** ([add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)), sugerindo que "production domain" = domínio customizado. Evidência convergente de que o `*.vercel.app` gerado **estaria coberto** por esse escopo: o enum real da API é `all_except_custom_domains`; o changelog de jul/2025 diz que o Standard Protection protege "all automatically generated domains, including the production branch git domain"; e o guia de troubleshooting lista o *primary Project Domain* (`my-app.vercel.app`) como um *Stable Alias* que **recebe o cookie de autenticação** — [Troubleshooting ERR_BLOCKED_BY_ORB](https://vercel.com/kb/guide/troubleshooting-cross-origin-errors-neterr-blocked-by-orb-with-deployment-protection).
   
   **O que continua sem fonte primária textual:** nenhuma página afirma literalmente "o domínio `projeto.vercel.app` de produção é coberto pelo Standard Protection". A documentação é ambígua na escolha de palavras ("production domains" vs "custom domains"). **Mas isso deixou de ser um risco prático para este caso**, por dois motivos: (a) o teste ao vivo mostrou que **hoje não há proteção nenhuma** ligada, então o escopo atual é irrelevante; e (b) a recomendação é usar **All Deployments**, que elimina a ambiguidade e é grátis. Eu **não** consegui medir empiricamente o comportamento do Standard Protection porque, para isso, seria preciso ligar a proteção — o que é uma mutação, proibida pelas instruções.

2. **A doc oficial está internamente inconsistente sobre preços.** O guia [How do I add password protection to my Vercel deployment?](https://vercel.com/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment) (atualizado em 09/09/2026) ainda afirma que Password Protection no Pro exige o add-on de **US$ 150/mês** e que **All Deployments** está "Available on Pro and Enterprise". Ambas as afirmações **contradizem** fontes primárias mais recentes:
   - [Usage & Pricing for Deployment Protection](https://vercel.com/docs/deployment-protection/usage-and-pricing) (atualizado 15/09/2026) diz **US$ 20/mês por projeto** e lista All Deployments como **Included no Hobby**;
   - o changelog de 09/09/2026 diz explicitamente que proteger produção agora é **grátis em todos os planos**.
   
   **Tratei os documentos mais recentes como autoritativos**, mas registro a inconsistência porque ela pode confundir quem for conferir.

3. **Não testei o `DELETE` de verdade** (seria destrutivo e as instruções proíbem mutações). A inferência de que o `DELETE /api/state` está exposto baseia-se em: (a) o `GET` na mesma rota retornar `200` sem autenticação, e (b) a doc oficial afirmar que a Deployment Protection intercepta **todo** request na borda, antes do código. Se a proteção estivesse ligada, o `GET` já teria retornado login/`401`. Ainda assim, é inferência, não observação direta do `DELETE`.

4. **Não localizei nenhuma opção nativa de "tornar o projeto privado"** na documentação de projetos/configurações. Não afirmo que ela não exista em algum lugar do dashboard; afirmo que não achei fonte primária que a documente.

---

## Recomendação

**Para o cenário descrito (usuária não técnica, Hobby, endpoint destrutivo, repositório público):**

1. **Ligar *Vercel Authentication* com escopo `All Deployments` — agora.** Hoje a proteção está **desligada** (`ssoProtection: null`) e o teste ao vivo mostrou que o app e o `/api/state` respondem `200` para qualquer um. Isso é a correção principal e é grátis.
   - Caminho no dashboard: projeto → **Settings** → **Deployment Protection** → seção *Vercel Authentication* → ligar o toggle → escolher o escopo **All Deployments** → **Save**.
   - Fonte do caminho: [Vercel Authentication → How to manage from the dashboard](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication#how-to-manage-vercel-authentication-from-the-dashboard)
   - Escolher **All Deployments** (e não Standard Protection) remove a ambiguidade do termo "production domain" e já cobre qualquer domínio customizado futuro.
2. **Não usar token no bundle do cliente.** É obfuscação. O `fetch('/api/state')` relativo já funciona porque carrega o cookie de autenticação automaticamente — não é necessário token algum.
3. **Se o atrito do login incomodar**, o único upgrade que melhora a UX de verdade é **Pro + Password Protection (US$ 20/mês por projeto)**: ela só digita uma senha, sem precisar de conta no Vercel. Essa é a troca honesta: conveniência por dinheiro.
4. **Opcional, como camada extra:** uma WAF custom rule no Hobby (grátis, até 3 regras) negando `DELETE` em `/api/state` de tráfego não-navegador. Útil como defesa em profundidade, mas não substitui a Opção 1.
5. **Confirmar depois de ligar:** repetir os testes ao vivo. `curl https://estudos-gaya-ashen.vercel.app/api/state` deve passar a devolver redirect para login ou `401`, não `{"topics":[],"sessions":[]}`. Use uma query string única para evitar cache.

---

## Resumo em português

O app da Gaya **já está no ar e está aberto para qualquer pessoa**: eu testei a URL publicada e tanto o site quanto o `/api/state` respondem sem pedir login nenhum. Na prática, isso quer dizer que hoje não existe nenhuma tranca entre a internet e o endpoint que apaga tudo (`DELETE /api/state`): qualquer um que descubra o endereço consegue zerar todo o progresso de estudos — é exatamente o risco que você imaginou, e ele já é real. A boa notícia é que a correção é gratuita e simples: ligar a opção "Vercel Authentication" nas configurações do projeto, escolhendo o escopo "All Deployments". Ela protege o site e a API de uma vez (inclusive o `DELETE`), e desde setembro de 2026 isso não custa nada, inclusive no plano gratuito. A única alternativa que dispensa criar conta no Vercel é a proteção por senha, mas essa só existe no plano pago (US$ 20 por mês por projeto). Sobre guardar um "token secreto" dentro do app: não funciona, porque num site só de arquivos estáticos tudo que o navegador usa fica visível para qualquer visitante — seria disfarce, não tranca. Minha escolha: **ligar o Vercel Authentication com "All Deployments" hoje mesmo** e só considerar o plano pago com senha se o login do Vercel incomodar no dia a dia.
