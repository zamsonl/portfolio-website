# Zamson Lim - Cybersecurity Portfolio

**Live site:** https://zamsonl.github.io/portfolio-website/

Personal portfolio. I am a final-year Cybersecurity student at Asia Pacific University (APU), Malaysia. From May to August 2026 I was Network & Security Administrator at Palmgold Management Sdn Bhd.

The company had been hit by ransomware in August 2025, before I joined. There was no monitoring in place at the time, so there was no way to reconstruct how it got in or how far it reached. I proposed a Security Operations Centre, got approval, and built it as the only person on security. That build is the thread running through most of the work here.

## Sections

- **Featured work** - three long-form case studies: the SOC build-out, the purple-team exercise, and the consoles
- **Projects** - a searchable, filterable index of everything else, plus coursework
- **SOC console templates** - two of the consoles, de-identified and published
- **Skills** - SIEM, network, automation, offensive and forensics
- **Experience** - current role, CTF participation, and education
- **About** - background and current focus
- **Contact** - email, LinkedIn, and GitHub

## SOC console templates

Two of the consoles I run in production, de-identified and published here so anyone with a Wazuh or OpenSearch backend can use them. Both open in demo mode with a synthetic feed, so the links below work with no backend at all.

| Template | Live demo | What it is |
| --- | --- | --- |
| `soc-traffic-map.html` | [Open](https://zamsonl.github.io/portfolio-website/soc-traffic-map.html) | Global traffic operations map over a firewall-fed alert index - D3 world map with live arcs, a rolling threat-posture score, a per-minute activity timeline, an applications explorer, and a filterable event feed |
| `soc-alert-console.html` | [Open](https://zamsonl.github.io/portfolio-website/soc-alert-console.html) | Endpoint alert console over a Wazuh alert index - incremental polling, severity bucketing, a unified filter and triage layer, a vulnerability backlog, and an ATT&CK coverage matrix |

**Both are a single HTML file.** No build step, no dependencies, no package manager. Everything is inlined - including d3, topojson and the world atlas in the traffic map - and neither page makes any external request as shipped. The traffic map can optionally load a flag-icon stylesheet from a CDN with `?flags=1`; that is off by default, and it is the only outbound request either page can make.

### Using them

1. Serve the file from the same origin as a reverse proxy that forwards to your OpenSearch/Wazuh indexer.
2. Add `?demo=0` to the URL, or turn demo mode off in Settings, so the page polls the real backend.
3. Set the proxy path and index name in Settings, or edit `CFG` near the top of the script. The page issues `POST {proxyBase}/{index}/_search` and expects standard Wazuh alert documents.
4. Search for `ACME` and replace the placeholder brand, and swap the placeholder logo (a neutral inline SVG) for your own.
5. In the traffic map, set `CFG.site` and `CFG.home` to your own site. The home node, the map legend and the inbound/outbound direction test all key off that block.

Put authentication on the proxy - neither page stores or transmits credentials itself.

### No real data

These were derived from consoles built for a production SOC. Every organisation name, hostname, address, coordinate, account name and storage key has been replaced with a placeholder, and the embedded company logo has been removed. Nothing in them describes a real network.

The demo feeds are synthetic. The alert console uses RFC 5737 documentation addresses throughout. The traffic map has to geolocate addresses to draw the map at all, so its synthetic events are built from real public IP prefixes - every one of those rows is labelled `[SIMULATED]`, and the page shows a `DEMO` badge whenever the synthetic feed is running.

## Featured work

| Project | Focus |
| --- | --- |
| Enterprise SOC Build-out (flagship) | Wazuh, OpenSearch, Proxmox, Nginx, detection engineering |
| Purple Team - Both Chairs | C2 and beaconing, red and blue on the same exercise, detection written from it |
| Malicious Code Analysis for Detection Validation | Rust, Python, C++ samples in isolated labs, purely to test signatures |
| Zeek Network Security Monitoring Pipeline | Zeek cluster, Python decapsulation, custom ingest pipeline |
| Agent Rollout to 80+ Endpoints via GPO | Active Directory, Group Policy, idempotent installer |
| Active Directory Security Monitoring | Windows event channels, saved searches, dashboards |
| Wireless & Access Point Monitoring | Custom decoders, address-to-hostname enrichment |
| Authorized Internal Vulnerability Assessment | OpenVAS, Nmap, Nikto, multi-audience reporting |
| SOC Visualization Suite | D3 attack map, OpenSearch query DSL, wall display |
| Packet-Highway - 3D Traffic Visualizer | Three.js, instanced meshes, object pooling |
| Building with AI Tooling | Claude Code, Ollama, and the verification habit that goes with them |
| Physical Floor-Plan Agent Map *(in progress)* | Python, OCR pipeline, asset-to-location mapping |
| DFIR Memory Analysis *(in progress)* | Volatility, Windows forensics |

## Coursework projects

| Project | Focus | Link |
| --- | --- | --- |
| Community Library Management System (CLI) | Python, RBAC, file handling | [Repo](https://github.com/zamsonl/Library-Management-System) |
| Packet Tracer Networking Labs | Cisco, VLANs, routing, switching | [Repo](https://github.com/zamsonl/Switching-And-Routing-Essentials) |
| Object-Oriented Java System | Java, OOP, team project | [Repo](https://github.com/zamsonl/Java-assignment) |

## A note on what is not here

Configuration, detection content, and infrastructure details from the production SOC are deliberately kept out of this repository. Everything published describes architecture and approach only - no addresses, hostnames, or rule internals from a live environment. The two templates above are the only code from that environment published here, and they were de-identified before publication.

## Contact

- **Email:** zamsonlim@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/zamson-lim-b16617374
- **GitHub:** https://github.com/zamsonl
