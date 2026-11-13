import type { Costume } from '@/lib/byte/engine';
import type { SourceId } from './sources';

export type Flow = { title: string; caption: string; steps: { label: string; detail: string }[] };
export type Section = { heading: string; body?: string[]; bullets?: string[] };
export type LinkOut = { label: string; href: string; note?: string };

/**
 * What Byte says at each stop. Rule: never read the page back. Each line adds an angle (an analogy,
 * an opinion, where to look) that the visitor cannot already see, and stays true to the evidence.
 */
export type ByteLines = {
  card: string;
  intro: string;
  overview: string;
  problem: string;
  why: string;
  role: string;
  arch: string;
  implementation: string;
  decisions: string;
  challenges?: string;
  testing: string;
  outcomes: string;
  source: string;
  takeaways: string;
};

export type Project = {
  slug: string;
  name: string;
  kicker: string;
  tagline: string;
  badge?: string;
  period: string;
  kind: string;
  stack: string[];
  costume: Costume;
  /** Signature colour for this project's card, glow and headings. */
  tint: string;
  byte: ByteLines;
  card: { problem: string; solution: string; contribution: string; outcome: string };
  overview: string[];
  problem: string[];
  whyItMatters: string[];
  role: string[];
  architecture: Flow;
  implementation: Section[];
  decisions: { decision: string; why: string; tradeoff: string }[];
  challenges: { issue: string; cause: string; fix: string }[];
  testing: string[];
  outcomes: { metric: string; label: string }[];
  limitations: string[];
  takeaways: string[];
  demo: LinkOut[];
  source: LinkOut[];
  screenshots?: { src: string; alt: string; caption: string; width: number; height: number }[];
  sources: SourceId[];
};

export const PROJECTS: Project[] = [
  {
    slug: 'saka',
    name: 'SAKA',
    kicker: 'Autonomous AI agent · DeFi',
    tagline: 'An AI trading agent that doesn’t wait to be asked. Say “swap $5 of ETH for USDC” and it does it, after safety checks it can’t talk its way past. Then go to sleep: unprompted, it keeps thinking for you, scanning your wallet every minute, spotting moves worth making and lining each one up on Telegram, already safety-checked and one tap from done.',
    badge: '2nd place · 0G Private Computer track · ETHGlobal Mumbai 2026',
    period: 'Nov 5–7, 2026',
    kind: 'Hackathon team project',
    stack: ['TypeScript', 'React 19', 'Fastify', 'BullMQ', 'PostgreSQL', 'Redis', 'Docker', 'Azure', '0G', 'Uniswap v4', 'MCP', 'Privy', 'WebAuthn', 'Vitest', 'Playwright'],
    costume: 'agent',
    tint: '#b4a0ff',
    byte: {
      card: 'Picture an intern with brilliant ideas and zero signing authority. That’s the AI here. Code holds the pen.',
      intro: 'Antenna up. This one touches real money, so I’ll show you every lock on the door.',
      overview: 'Reading tip: there are three AI models in here, and not one of them is the boss.',
      problem: 'A chatbot that’s wrong wastes your time. An agent that’s wrong spends your money.',
      why: 'Swap “wallet” for “production database” and every word of this still holds.',
      role: 'Don’t take my word for it. The commit log is public; go count.',
      arch: 'Watch a trade run the gauntlet. Any gate can say no. None can say yes on its own.',
      implementation: 'Spot the trick: the parts that think can’t sign, and the part that signs can’t think.',
      decisions: 'Every row buys safety with convenience. The right-hand column is the honest bill.',
      challenges: 'Yes, money bugs happened. On a testnet. That’s exactly what testnets are for.',
      testing: 'For a three-day hackathon, this list is frankly unreasonable. In the best way.',
      outcomes: 'Crown back on. Judges, prize money, and the receipts to prove both.',
      source: 'Detective hat: primary sources only. Go ahead, audit me.',
      takeaways: 'Steal these two. They work for any AI that touches the real world.',
    },
    card: {
      problem: 'Give an AI your wallet and one bad guess, or one sneaky prompt, can drain it. Most trading bots won’t even tell you why they acted.',
      solution: 'The AI may only suggest. Code rehearses every trade first, a second AI hunts for danger, and your own limits decide. Unprompted, nine watchers scan every wallet each minute and propose a move you can approve, change or skip.',
      contribution: 'All 41 changes in the public code are mine: wiring up the AI models, launching it on Azure and designing the app.',
      outcome: 'A live demo you can try right now, guarded by more than 600 automated tests.',
    },
    overview: [
      'SAKA gives each user a personal AI agent for decentralized finance. You sign in with a passkey, the agent gets its own wallet, and you ask in plain English: "Swap $5 of ETH to USDC", "Put $10 into ETH/USDC", "Is this hook safe?".',
      'The agent plans with AI models running on 0G, builds transactions through a Uniswap MCP server the team wrote, and pushes every action through a safety pipeline. Small actions inside your limits run on their own after a 3-second countdown you can cancel. Bigger ones wait for your approval. Risky ones are refused, with the reason shown.',
    ],
    problem: [
      'AI agents are starting to hold wallets. A language model that can sign transactions can also be wrong, be manipulated by a prompt, or act on a stale price, and the money is gone.',
      'Most "AI trading bots" are black boxes: you cannot see why they acted, and you cannot verify afterwards what they were told or what they decided.',
    ],
    whyItMatters: [
      'For a non-crypto reader: imagine giving an assistant your debit card. You would want it to show you every purchase before it happens, refuse anything suspicious, ask before big spends, and keep receipts that it cannot alter. SAKA is that, for an autonomous agent.',
      'The same pattern applies outside finance: any agent that takes real actions needs a deterministic layer between the model and the world.',
    ],
    role: [
      'SAKA was built at ETHGlobal Mumbai as a team entry. Every one of the 41 commits in the public repository is authored from my GitHub account. They cover the 0G AI integration, the Market Event Simulator, the safety-guard and execution fixes, passkey sign-in and approvals, the single-VM Azure deployment, and the redesigned interface.',
      'The ETHGlobal showcase does not list team members, so this page describes the project as a team result and only claims what the commit history shows.',
    ],
    architecture: {
      title: 'How a decision is made',
      caption: 'Every money-moving intent runs through one deterministic pipeline. The model proposes; code decides.',
      steps: [
        { label: 'Prepare', detail: 'Intent → MCP build tools; USD at risk from a mainnet reference price; planHash = sha256 of canonical JSON.' },
        { label: 'Score', detail: 'Deterministic 0–100 trade score with {rule, penalty, evidence}; token checks; hook safety score.' },
        { label: 'Simulate', detail: 'eth_call of every built step from the agent wallet; re-simulated right before broadcast.' },
        { label: 'Guard', detail: '0G Vela 2.0 blocks below 0.8 probability and fails closed if 0G is unreachable.' },
        { label: 'Policy', detail: 'A pure decide() returns AUTO, STEP_UP, REFUSE or ASK, with value and limit in every reason.' },
        { label: 'Execute', detail: 'One plan per user at a time, re-quote within 1% or stop, idempotent broadcast, never re-sent on timeout.' },
        { label: 'Log', detail: 'Canonical JSON of the whole decision uploaded to 0G Storage; the root hash is checked and shown.' },
      ],
    },
    implementation: [
      {
        heading: 'AI layer on 0G',
        bullets: [
          'Planner (GLM-5.3, private trust mode) with a verified fallback model, a guard (Vela 2.0) and an explainer (0GM-1.0), all through the 0G Router.',
          'Every call sends verify_tee and a client request ID, and stores the router’s X-Request-ID and trace, so each reply in the UI links to its inference record.',
        ],
      },
      {
        heading: 'Uniswap MCP server',
        bullets: [
          '16 typed tools over the Trading API, LP API, v4 contracts and subgraph, published as a plugin in a fork of Uniswap/uniswap-ai.',
          'Unsigned-only by design: a build test fails if signing or broadcast code is added. Permit2 flows return typed data plus an HMAC-signed resume token that expires in 120 s.',
          'Hook safety: reads a hook’s 14 permission bits from its address and scores them against the Uniswap v4 Security Framework.',
        ],
      },
      {
        heading: 'Wallets, identity and autopilot',
        bullets: [
          'Privy server wallets with a per-wallet policy that only allows Uniswap contracts, Permit2 and allowlisted tokens.',
          'Passkeys (WebAuthn) for sign-in and single-use approvals bound to the plan hash.',
          'Autopilot: nine detectors check every funded wallet each minute and propose actions with Yes / Change / No, in the app and on Telegram.',
        ],
      },
      {
        heading: 'Stack',
        body: ['pnpm + Turborepo monorepo. React 19 + Vite + Tailwind on Vercel. Fastify API, BullMQ worker, PostgreSQL (Prisma) and Redis in Docker on one Azure VM behind Caddy.'],
      },
    ],
    decisions: [
      { decision: 'The model never holds authority', why: 'A pure policy function makes the final call, so a prompt injection can at most produce a plan that gets refused.', tradeoff: 'More code paths to maintain than letting the LLM call tools directly.' },
      { decision: 'The guard fails closed', why: 'If the 0G guard is unreachable, nothing executes ("Safety check unavailable").', tradeoff: 'An outage blocks trading entirely.' },
      { decision: 'Unsigned-only MCP server', why: 'The tool layer can build transactions but never sign or broadcast them; a build test enforces it.', tradeoff: 'Signing has to happen in a separate, narrower component.' },
      { decision: 'Re-quote before execution', why: 'Prices move between approval and broadcast; anything beyond 1% stops with "Price moved".', tradeoff: 'Some approved trades fail in fast markets.' },
    ],
    challenges: [
      { issue: '"$1 ETH" parsed as 1 ETH', cause: 'Amount parsing confused a USD value with a token quantity.', fix: 'Fixed during live testing alongside three UI bugs (commit history).' },
      { issue: 'Permit2 swaps reverting', cause: 'Gas limits were too tight for Permit2 flows.', fix: 'Buffered gas limits in execution.' },
      { issue: 'Testnet prices blocking safe swaps', cause: 'Thin Sepolia liquidity made the guard reject reasonable trades.', fix: 'Adjusted the guard so testnet pricing no longer blocks safe swaps.' },
    ],
    testing: [
      '600+ Vitest tests across shared code, the API (integration tests against Postgres and Redis) and the web app, per the showcase.',
      'Playwright end-to-end tests against a stateful mock API.',
      'Live smoke scripts for 0G models, 0G Storage round-trips, Privy wallets and MCP quotes.',
      'Planner evaluation: 32 of 35 live cases correct (91.4%).',
    ],
    outcomes: [
      { metric: '2nd', label: 'place, 0G Private Computer track' },
      { metric: '$1,500', label: 'prize' },
      { metric: '600+', label: 'automated tests' },
      { metric: '91.4%', label: 'planner eval (32/35)' },
    ],
    limitations: [
      'Execution runs on one testnet (Ethereum Sepolia); mainnet is read-only market data.',
      'Passkey approvals are built but not yet switched on in the hosted staging environment.',
      'The Market Event Simulator overlays simulated market data on real reads; the decision is real, the event is not.',
    ],
    takeaways: [
      'Put the model in the proposal path, never in the authority path.',
      'Make provenance a feature: request IDs and storage hashes turn "trust me" into something a user can check.',
    ],
    demo: [
      { label: 'Live demo', href: 'https://saka-rust.vercel.app', note: 'Sign in as "demo"' },
      { label: 'Demo video', href: 'https://drive.google.com/file/d/1f1BYpQFaRfzk45dL3RWnMTBC9i1DfED1/view' },
    ],
    source: [
      { label: 'GitHub repository', href: 'https://github.com/Ayush-Bansal08/SAKA' },
      { label: 'ETHGlobal showcase', href: 'https://ethglobal.com/showcase/saka-defi-ai-agent-gbb53' },
      { label: 'Uniswap MCP plugin', href: 'https://github.com/Ayush-Bansal08/uniswap-ai/tree/feat/uniswap-agent-mcp/packages/plugins/uniswap-agent-mcp' },
    ],
    screenshots: [
      { src: '/projects/saka/landing.png', alt: 'SAKA landing page', caption: 'Landing page', width: 1440, height: 900 },
      { src: '/projects/saka/preview-countdown.png', alt: 'A SAKA trade preview with a cancellable countdown', caption: 'A trade, before it runs: amounts, fees, checks and a 3-second countdown', width: 1440, height: 900 },
      { src: '/projects/saka/autopilot-simulator.png', alt: 'SAKA Market Event Simulator', caption: 'Market Event Simulator', width: 1440, height: 900 },
      { src: '/projects/saka/hooks.png', alt: 'SAKA hook safety scores', caption: 'Uniswap v4 hooks with deterministic safety scores', width: 1440, height: 900 },
    ],
    sources: ['saka-showcase', 'saka-repo', 'saka-demo', 'saka-video', 'saka-x', 'saka-mcp', 'resume'],
  },
  {
    slug: 'helios',
    name: 'Helios',
    kicker: 'Internal developer platform · Kubernetes',
    tagline: 'Push code and walk away. Helios ships it to a quarter of users, watches the error rate, and rolls it back by itself if things go wrong.',
    period: '2026',
    kind: 'Solo project',
    stack: ['Go', 'Kubebuilder', 'Kubernetes', 'ArgoCD', 'Argo Rollouts', 'Prometheus', 'Grafana', 'Loki', 'Kyverno', 'Falco', 'Trivy', 'k6', 'Chaos Mesh', 'Azure', 'cert-manager'],
    costume: 'helmet',
    tint: '#ffad66',
    byte: {
      card: 'Anyone can deploy once. This is about deploying on a Friday afternoon without anyone panicking.',
      intro: 'Hard hat on. Welcome to the plumbing nobody notices until it breaks.',
      overview: 'Imagine every pull request getting its own tiny copy of production. Then tidying up after itself.',
      problem: 'Shipping one container is a weekend. Shipping safely, every day, is a whole job title.',
      why: 'Big companies staff whole teams for this. Here’s the one-person version, every layer exposed.',
      role: 'One owner for every layer, and for every bug you’re about to read about.',
      arch: 'Each release sits a pop quiz at every step. Fail one and it’s sent straight home.',
      implementation: 'A few lines of YAML in, a whole environment out. And it cleans up without being asked.',
      decisions: 'Notice the pattern: provable beats impressive, every single time.',
      challenges: 'My favourite section. Real errors, real logs, no “it just worked” fairy tales.',
      testing: 'Claims are cheap. This is where the platform got punched on purpose.',
      outcomes: 'Find the zero in this grid, then read what it’s counting. That’s the whole pitch.',
      source: 'The operator’s Go code is linked here. The reconcile loop is the heart of it.',
      takeaways: 'Sticky-note material. Future-you at 2 a.m. will be grateful.',
    },
    card: {
      problem: 'Getting an app online once is a weekend project. Updating it every day without users ever noticing a bad release is a whole job.',
      solution: 'Each update goes out in stages, 25% → 50% → 75% → 100%, and only moves on while live success stays above 95%. Every proposed change also gets its own private copy of the app to test.',
      contribution: 'Built every layer alone, including a custom Kubernetes add-on in Go that spins those test copies up and tears them down cleanly.',
      outcome: 'Runs the same on a laptop and on Azure, and scaled itself from 1 to 10 copies when hit by 100 simulated users.',
    },
    overview: [
      'Helios is an internal developer platform on Kubernetes. A git push deploys through ArgoCD; new versions roll out as canaries that query Prometheus mid-rollout and roll back on their own; a custom operator gives every pull request its own isolated preview environment.',
      'To prove it is app-agnostic, it runs Google’s 11-service Online Boutique and an unrelated Go service, Podinfo, with zero platform changes.',
    ],
    problem: ['Shipping safely takes more than a Deployment manifest: drift correction, release gates, monitoring, admission policy, autoscaling and environments for review. Those are usually spread across many hand-run steps.'],
    whyItMatters: ['Platform engineering is how a team of many developers ships many times a day without breaking production. Each capability here maps to something real teams pay for: Vercel-style previews, progressive delivery, policy-as-code.'],
    role: ['Solo project. I designed the platform, wrote the Go operator, wired the GitOps and observability stack, and ran the load, chaos and security experiments.'],
    architecture: {
      title: 'Releases that judge themselves',
      caption: 'A canary only advances while live Prometheus data says it is healthy.',
      steps: [
        { label: 'git push', detail: 'GitHub is the single source of truth; ArgoCD pulls, syncs and self-heals drift.' },
        { label: 'Canary 25%', detail: 'Argo Rollouts sends a quarter of traffic to the new version.' },
        { label: 'Analyse', detail: 'PromQL success rate (non-5xx ÷ total) must stay ≥ 95%: 4 checks, 20 s apart.' },
        { label: '50 → 75 → 100%', detail: 'Healthy: promote automatically. Degraded: roll back to the last good version.' },
      ],
    },
    implementation: [
      {
        heading: 'The PreviewEnvironment operator (Go, Kubebuilder)',
        bullets: [
          'A developer applies a 7-line custom resource; the controller creates a namespace, Deployment, Service and Ingress at pr-42.localtest.me.',
          'Idempotent reconcile loop, finalizer-guaranteed cleanup (zero orphaned resources), least-privilege RBAC generated from Kubebuilder markers.',
        ],
      },
      {
        heading: 'Security in four layers',
        bullets: ['Trivy scans images at build time; Kyverno rejects non-compliant workloads at admission (untagged images never reach the cluster); Falco watches runtime syscalls; RBAC limits identities.'],
      },
      {
        heading: 'Proven, not assumed',
        bullets: [
          'k6 ramps 100 virtual users; the HPA scales the frontend from 1 to 10 pods, then back down.',
          'Chaos Mesh kills the frontend pod and injects 2 s network latency to observe degradation.',
          'One script (setup.sh) rebuilds the entire platform from scratch.',
        ],
      },
    ],
    decisions: [
      { decision: 'Metric gate plus health gate', why: 'An AnalysisTemplate checks live traffic; progressDeadlineAbort catches versions that never become ready.', tradeoff: 'Needs real traffic before analysis is meaningful.' },
      { decision: 'Same manifests locally and in the cloud', why: 'kind and k3s on Azure differ only by ingress host, so what was tested is what runs.', tradeoff: 'Single-node clusters, not high availability.' },
      { decision: 'Run apps I did not write', why: 'In platform engineering the app is the workload; the platform is the project.', tradeoff: 'Less control over app-level metrics.' },
    ],
    challenges: [
      { issue: 'Grafana crash-looping (432 restarts)', cause: 'Prometheus and Loki datasources both provisioned with isDefault: true.', fix: 'Read the container logs, patched the Loki ConfigMap to isDefault: false.' },
      { issue: 'Cluster unreachable (x509 unknown authority)', cause: 'kind pins the node IP; Docker changed it after a reboot.', fix: 'Rebuilt the whole platform from setup.sh in minutes.' },
      { issue: 'ArgoCD install failed (annotations too long)', cause: 'Large CRDs exceed the client-side apply annotation limit.', fix: 'kubectl apply --server-side.' },
      { issue: 'Canary analysis inconclusive', cause: 'rate() over a window with no scraped traffic yet.', fix: 'Generate load first, wait one scrape cycle, then roll out.' },
    ],
    testing: ['Load tests with k6, chaos experiments with Chaos Mesh, live admission-policy rejection, and full rebuilds from a single script.'],
    outcomes: [
      { metric: '1 → 10', label: 'pods autoscaled under 100 VUs' },
      { metric: '≥ 95%', label: 'success-rate gate per canary step' },
      { metric: '1', label: 'script to rebuild everything' },
      { metric: '0', label: 'manual deployment steps' },
    ],
    limitations: ['A portfolio platform, not a production system with real users.', 'The Azure VM is stopped when idle to control cost, so the live URL is usually offline.'],
    takeaways: ['Read the logs, don’t guess. Each incident above was solved from evidence, not trial and error.', 'Declarative infrastructure is what makes "rebuild it in minutes" a real recovery plan.'],
    demo: [{ label: 'Video walkthrough', href: 'https://drive.google.com/file/d/14-x45ra9iRBMOevZ0CqfLridM_HQqiSa/view?usp=sharing' }],
    source: [
      { label: 'GitHub repository', href: 'https://github.com/Ayush-Bansal08/k8s-project' },
      { label: 'Operator controller (Go)', href: 'https://github.com/Ayush-Bansal08/k8s-project/blob/main/operator/internal/controller/previewenvironment_controller.go' },
    ],
    sources: ['helios-repo', 'helios-operator', 'helios-video', 'resume'],
  },
  {
    slug: 'dockhealer',
    name: 'DockHealer',
    kicker: 'AI developer tool · Local LLM',
    tagline: 'An AI writes the recipe for packaging an app. DockHealer doesn’t believe it until the app actually builds, starts and answers.',
    period: '2026',
    kind: 'Solo project',
    stack: ['Python', 'Docker', 'Ollama', 'Terraform', 'Azure', 'GitHub Actions', 'Trivy', 'pytest'],
    costume: 'medic',
    tint: '#ff8fa3',
    byte: {
      card: 'Trust, but docker build. That’s the whole philosophy in four words.',
      intro: 'Medic cap on. Today’s patients: files that look healthy and collapse the moment they run.',
      overview: 'Think of the model as a confident junior, and everything else here as the senior who actually runs the code.',
      problem: '“Just ask again until it works” sounds fine. Until it’s 3 a.m. and you’re on attempt 400.',
      why: 'Swap Docker for any AI task and the recipe survives: generate, check, cap the retries.',
      role: 'One author, no hiding behind a team. Every call on this page is his.',
      arch: 'Count the exits on this loop. “Keep trying forever” isn’t one of them.',
      implementation: 'Build logs get treated like notes from a stranger: read carefully, never obeyed.',
      decisions: 'Every row trades speed for certainty. An unusual choice for an AI tool. The right one.',
      challenges: 'Exhibit A for the smoke test. Without it, this mistake would have shipped.',
      testing: 'Read the second line twice. It’s the most honest sentence on this page.',
      outcomes: 'Notice what’s missing: a success-rate brag. That comes after real runs, not before.',
      source: 'Open the evaluation protocol. It’s rare to see the rules published before the results.',
      takeaways: 'The second one is underrated. Most people do it the other way round.',
    },
    card: {
      problem: 'AI-written Docker files often look perfect and fail the moment they run. And “keep asking until it works” can loop forever.',
      solution: 'Check the file, build it for real, start it for real. If it breaks, the AI gets three tries to fix it, then the tool stops and calls a human.',
      contribution: 'Built solo: the command-line tool, the rule checker, the error sorter, the retry loop, the test bench and the Azure setup.',
      outcome: '186 automated tests, and a hard guarantee: it always finishes, however badly the AI behaves.',
    },
    overview: [
      'DockHealer is a Python CLI that containerises small Python and Node projects. A local Ollama model proposes a Dockerfile; ordinary code accepts it only after a 16-rule validator, a real docker build, and a hardened container that answers an HTTP request.',
      'When a step fails, the evidence is classified, redacted and fed back for a bounded repair, or the tool stops and tells a human.',
    ],
    problem: ['Asking a model "is this correct?" is not evidence. Looping "ask again until it builds" can burn unbounded time, follow instructions hidden in build logs, or "fix" a project bug by rewriting the wrong file.'],
    whyItMatters: ['This is the general problem of putting an unreliable model inside a reliable system. DockHealer treats the model as one component in a harness where every claim is checked by something that cannot be talked into agreeing.'],
    role: ['Solo project, about 2,300 lines of Python across 14 modules.'],
    architecture: {
      title: 'The bounded repair loop',
      caption: 'Each pass either succeeds, stops for a human, or consumes budget, so the loop always terminates.',
      steps: [
        { label: 'Scan', detail: 'Detect language, framework, entrypoint and port; exclude secret-like files; never follow symlinks.' },
        { label: 'Generate', detail: 'Ollama (qwen2.5-coder:3b, temperature 0, seed 42) writes a Dockerfile.' },
        { label: 'Validate', detail: '7 error rules and 9 warning rules, before any build is spent.' },
        { label: 'Build', detail: 'Real docker build on a staged copy of approved files, with timeout and capped, redacted logs.' },
        { label: 'Smoke test', detail: 'Container with dropped capabilities, no-new-privileges and limits must answer /health or /.' },
        { label: 'Diagnose', detail: '22 failure classes map to repair, retry or stop; fingerprints detect repeats.' },
      ],
    },
    implementation: [
      { heading: 'Security model', bullets: ['Build logs are attacker-influenced text: redacted, truncated and fenced as untrusted data in the prompt.', 'The model can only return a Dockerfile, which is re-validated and rebuilt.', 'Smoke containers: --cap-drop ALL, 512 MiB, 1 CPU, 256 PIDs, no mounts, loopback-only port.'] },
      { heading: 'Infrastructure', bullets: ['Terraform for an Azure Ubuntu VM: NSG allows SSH from a single /32, key-only login, no managed identity.', 'GitHub Actions runs the suite on Python 3.11 and 3.12.'] },
    ],
    decisions: [
      { decision: 'Build and run the image', why: 'A built image is weak evidence; only a running container catches a wrong CMD or a 127.0.0.1 bind.', tradeoff: 'Slower, and needs a Docker daemon.' },
      { decision: 'Stop on project-level faults', why: 'A dependency pinned by the project itself is not the Dockerfile’s fault; the must-stop scenario only passes with zero model calls.', tradeoff: 'Some fixable-looking failures go to a human.' },
      { decision: 'Local model', why: 'No paid API, and project source never leaves the machine.', tradeoff: 'CPU latency and weaker repairs than a hosted model.' },
    ],
    challenges: [{ issue: 'Generated Dockerfile used a node user in a Python image', cause: 'The model hallucinated a user that does not exist in the base image.', fix: 'The smoke test caught it at container start; the second attempt repaired it (author-reported run).' }],
    testing: ['186 tests with injected fakes for Docker, Ollama, Trivy and the HTTP probe; they run in under a second.', 'Evaluation protocol fixed before any run: 10 scenarios, one-shot vs full loop, Wilson 95% intervals. Measured results are not published yet.'],
    outcomes: [
      { metric: '186', label: 'automated tests' },
      { metric: '16', label: 'validator rules' },
      { metric: '22', label: 'failure classes' },
      { metric: '7', label: 'explicit end states' },
    ],
    limitations: ['Measured success rates are not published yet: they require real Docker and Ollama runs.', 'Isolation is accident prevention, not a sandbox for untrusted repositories.'],
    takeaways: ['Termination should never depend on the model behaving.', 'Write the evaluation protocol before running the evaluation.'],
    demo: [],
    source: [
      { label: 'GitHub repository', href: 'https://github.com/Ayush-Bansal08/Dockhealer' },
      { label: 'Evaluation protocol', href: 'https://github.com/Ayush-Bansal08/Dockhealer/blob/main/docs/EVAL_PROTOCOL.md' },
    ],
    sources: ['dockhealer-repo', 'dockhealer-eval', 'resume'],
  },
  {
    slug: 'pollforge',
    name: 'PollForge',
    kicker: 'Event-driven system · Azure AKS',
    tagline: 'Cast a vote and watch the results bar move for everyone at once. Behind it: five services, three languages, one Kubernetes cluster on Azure.',
    period: '2026',
    kind: 'Solo project',
    stack: ['Python (Flask)', 'C# (.NET 8)', 'Node.js', 'Redis', 'PostgreSQL', 'Kubernetes', 'Azure AKS', 'ACR', 'GitHub Actions', 'Prometheus', 'cert-manager'],
    costume: 'party',
    tint: '#f08cf5',
    byte: {
      card: 'Your vote runs a relay race: handed off, queued, saved, broadcast. No runner waits for the next.',
      intro: 'Party hat on. Nothing says party like a message queue.',
      overview: 'Follow one vote from click to chart. It changes hands more often than you’d guess.',
      problem: 'Ever had a page freeze because the database sneezed? This design says: not today.',
      why: 'Learn this shape once and you’ll spot it behind half the apps on your phone.',
      role: 'Solo, end to end. If a pod misbehaves, there’s exactly one person to call.',
      arch: 'Find the spot where your vote waits in line, so the page never has to.',
      implementation: 'Ship day, automated: build, tag, push, roll out. Nobody has to remember a password.',
      decisions: 'Classic trade: instant votes now, results a heartbeat later. Worth it.',
      challenges: 'He found his own design’s weak spot and wrote it down. Rarer than you’d think.',
      testing: 'An honest list: what’s verified, and what isn’t yet. I respect a repo that admits it.',
      outcomes: 'Small numbers, big habits. Look at the middle one.',
      source: 'Rather watch than read? The demo video shows the votes flying.',
      takeaways: 'This one applies to every system you’ll ever build. Me included.',
    },
    card: {
      problem: 'Build an app where any single part can crash, update or scale without taking the rest down with it.',
      solution: 'Votes drop into a fast queue, a background worker saves them, and a separate service pushes fresh results to every open browser each second.',
      contribution: 'Built solo: all five services, the Kubernetes setup, the push-to-deploy pipeline and the monitoring.',
      outcome: 'Every code change goes live on Azure by itself, without a single cloud password stored anywhere.',
    },
    overview: ['A browser submits a vote to a Flask service, Redis buffers it, a .NET worker persists it to PostgreSQL, and a Node.js service pushes aggregated results to browsers every second. The same services run locally with Docker Compose and on Azure Kubernetes Service.'],
    problem: ['The request path should not wait on the database, and each concern (accepting votes, persisting them, showing results) should be deployable and restartable on its own.'],
    whyItMatters: ['This is the shape of most real backends: a fast front door, a queue, background workers and read models, plus the delivery pipeline that keeps them in sync.'],
    role: ['Solo project.'],
    architecture: {
      title: 'Request and data flow',
      caption: 'Vote submission is decoupled from database latency; results are eventually consistent.',
      steps: [
        { label: 'Vote (Flask)', detail: 'Renders the ballot, assigns a voter cookie, RPUSHes JSON to Redis.' },
        { label: 'Redis', detail: 'Buffers votes; absorbs short bursts.' },
        { label: 'Worker (.NET 8)', detail: 'Pops messages and inserts or updates one row per voter in PostgreSQL.' },
        { label: 'Results (Node.js)', detail: 'GROUP BY vote, broadcast over Socket.IO every second, /metrics for Prometheus.' },
      ],
    },
    implementation: [
      { heading: 'Delivery', bullets: ['Matrix build of three images in parallel; pushed to ACR tagged with the commit SHA.', 'Azure login through OIDC (no long-lived secret), then kubectl set image and rollout status.'] },
      { heading: 'Kubernetes', bullets: ['Deployments for stateless services, a PostgreSQL StatefulSet with a persistent volume claim, NGINX Ingress with Let’s Encrypt via cert-manager.', 'ServiceMonitor scraping every 15 s and a WorkerDown alert.'] },
    ],
    decisions: [
      { decision: 'Redis between HTTP and PostgreSQL', why: 'Keeps submission fast and isolates it from database latency.', tradeoff: 'Eventual consistency between vote and results.' },
      { decision: 'StatefulSet for PostgreSQL only', why: 'Durable state gets stable identity and storage; everything else stays stateless.', tradeoff: 'Single replica, no managed backups yet.' },
    ],
    challenges: [{ issue: 'Possible vote loss on worker crash', cause: 'LPOP removes a message before the database write completes.', fix: 'Documented as a known limitation, with Redis Streams and consumer groups as the planned fix.' }],
    testing: ['Per the résumé: persistent storage verified to survive live pod termination, and chaos testing of self-healing behaviour.', 'The repository is explicit that the pipeline does not yet run automated tests or image scans.'],
    outcomes: [
      { metric: '5', label: 'services in 3 languages' },
      { metric: '0', label: 'stored cloud passwords (OIDC)' },
      { metric: '1', label: 'commit SHA per release' },
    ],
    limitations: ['At-most-once delivery from Redis (LPOP).', 'Default credentials in checked-in manifests are for demonstration only.'],
    takeaways: ['Writing down the consistency model and failure modes is part of the engineering, not an afterthought.'],
    demo: [{ label: 'Demo video', href: 'https://drive.google.com/file/d/1pVh277Bao5hEftS_H58uTEaM6GU1tDl0/view?usp=sharing' }],
    source: [{ label: 'GitHub repository', href: 'https://github.com/Ayush-Bansal08/PollForge' }],
    sources: ['pollforge-repo', 'pollforge-video', 'resume'],
  },
  {
    slug: 'som-gold',
    name: 'SOM-Gold',
    kicker: 'ML research · UNSW Sydney',
    tagline: 'Hunting for gold from space: machine learning on satellite images, made accurate and repeatable.',
    badge: 'Co-author · paper under review',
    period: 'May – Aug 2026',
    kind: 'Research internship (team)',
    stack: ['Python', 'PyTorch', 'MiniSom', 'scikit-learn', 'EnMAP hyperspectral', 'WFS / GIS'],
    costume: 'cap',
    tint: '#f2c14e',
    byte: {
      card: 'Lesson one of science: before you trust the map, audit the ruler.',
      intro: 'Grad cap on. Different game here: nothing counts until a stranger can reproduce it.',
      overview: 'Translation: teaching a computer to spot promising rocks from space, without ever showing it gold.',
      problem: 'Plot twist incoming: the rocks were never the problem.',
      why: 'Pretty maps are easy. Maps someone else can check are science.',
      role: 'Think of him as the team’s auditor: every number had to get past him first.',
      arch: 'Every box here can be rerun by a stranger. That’s the whole point of the diagram.',
      implementation: 'The scary bugs here never crashed anything. They just quietly made the numbers wrong.',
      decisions: 'Short table, big consequence. This one choice is what makes the results checkable.',
      testing: 'Not “it looks better”. Statistically better. In a paper, that’s the difference.',
      outcomes: 'That first number is the best before-and-after on the whole site.',
      source: 'The repository belongs to the UNSW group. The citation is right there to check.',
      takeaways: 'One line, worth framing.',
    },
    card: {
      problem: 'The model found zero gold-bearing rock, and no one could reproduce the team’s results on another computer.',
      solution: 'Found the training bug behind it, fixed 8 pipeline bugs in all, rebuilt the reference map from public data, and swapped eyeballing for real statistics.',
      contribution: 'Second author on the paper. My part: the bug hunt, the pipeline audit, the rebuilt reference data and how results are measured.',
      outcome: 'The chosen method beats the usual baseline on every measure, backed by significance tests rather than by eye.',
    },
    overview: ['At UNSW Sydney, under Dr. Rohitash Chandra, I worked on SOM-Gold: comparing self-organizing maps, autoencoders and k-means for finding gold-prospective geology in EnMAP hyperspectral imagery.'],
    problem: ['The model reported 0% recall on the target geological unit because of a training defect, and the ground-truth raster had been exported by hand from desktop GIS and never committed, so results could not be reproduced on another machine.'],
    whyItMatters: ['Unsupervised models can look plausible while being wrong. Without a correct metric and a reproducible ground truth, a paper’s conclusion is not checkable.'],
    role: [
      'Research intern and second author (Cheng Wang, Ayush Bansal, Ehsan Farahbakhsh, Rohitash Chandra). The paper is under review.',
      'My work: fixing the training bug, auditing and correcting 8 pipeline bugs, rebuilding the ground-truth raster from a public WFS API, and designing the evaluation framework.',
    ],
    architecture: {
      title: 'Reproducible pipeline',
      caption: 'From public geology data to statistically tested comparisons.',
      steps: [
        { label: 'Ground truth', detail: 'NSW Seamless Geology fetched from a public WFS and rasterised onto the EnMAP grid, with no manual GIS export.' },
        { label: 'Representations', detail: 'SOM, autoencoder and k-means on hyperspectral bands.' },
        { label: 'Metrics', detail: 'Overall and balanced accuracy, corrected Cohen’s κ, unit recall, ARI, NMI and more.' },
        { label: 'Significance', detail: 'Hyperparameter sweeps, McNemar tests, stability analysis and ablations.' },
      ],
    },
    implementation: [{ heading: 'Bugs corrected', bullets: ['A training defect that produced 0% recall on the target unit.', "An incorrect Cohen's κ.", 'Mismatched autoencoder data masks.', 'Unseeded PyTorch random number generators.'] }],
    decisions: [{ decision: 'Rebuild ground truth from a public API', why: 'Anyone can regenerate the exact raster, so the results are reproducible.', tradeoff: 'Relies on the public geology service staying available.' }],
    challenges: [],
    testing: ['McNemar significance tests and stability analysis across seeds, plus ablations.'],
    outcomes: [
      { metric: '0 → 76.6%', label: 'mineral recall after the fix' },
      { metric: '8', label: 'pipeline bugs corrected' },
      { metric: 'All', label: 'metrics: SOM beats k-means' },
    ],
    limitations: ['The paper is under review, not yet published.', 'The repository belongs to the UNSW research group.'],
    takeaways: ['A metric you have not audited is a guess.'],
    demo: [],
    source: [
      { label: 'Research repository', href: 'https://github.com/sydney-machine-learning/remotesensing-SOM' },
      { label: 'Paper citation', href: 'https://github.com/sydney-machine-learning/remotesensing-SOM#paper-citation' },
    ],
    sources: ['som-repo', 'som-citation', 'resume'],
  },
];

export const PROJECT_BY_SLUG = Object.fromEntries(PROJECTS.map((p) => [p.slug, p])) as Record<string, Project>;
export const FEATURED = PROJECTS[0]!;
export const OTHER_PROJECTS = PROJECTS.slice(1);
