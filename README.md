# HaloPSA MCP Server

An MCP (Model Context Protocol) server that provides AI agents with access to the HaloPSA API. Manage tickets, clients, assets, and more through natural language via Claude Desktop or any MCP-compatible client.

## Features

- **35+ tools** covering tickets, clients, assets, agents, sites, contracts, projects, invoices, appointments, knowledge base, suppliers, quotations, and opportunities
- **Ticket tracking** — dedicated tools to list tickets assigned to or created by a specific agent
- **OAuth2 authentication** with automatic token caching and refresh
- **Pagination and filtering** on all list operations
- **TypeScript** with strict mode, built on the official `@modelcontextprotocol/sdk`

## Setup

### Prerequisites

- Node.js 18+
- A HaloPSA instance with API access configured
- OAuth2 Client ID and Secret (create an API application in HaloPSA under Config > Integrations > API Applications)

### Install

```bash
git clone https://github.com/Tim-ImpendingTech/HaloPSA-MCP-Server.git
cd HaloPSA-MCP-Server
npm install
npm run build
```

### Configure

Create a `.env` file (or set environment variables):

```bash
HALOPSA_BASE_URL=https://halo.yourcompany.co.uk
HALOPSA_TENANT=yourtenantname
HALOPSA_CLIENT_ID=your-client-id
HALOPSA_CLIENT_SECRET=your-client-secret
```

Optional variables:

| Variable | Default | Description |
|---|---|---|
| `HALOPSA_AUTH_URL` | `{HALOPSA_BASE_URL}/auth` | Override the auth server URL |
| `HALOPSA_SCOPE` | `all` | OAuth2 scope |
| `HALOPSA_TIMEOUT_MS` | `30000` | Request timeout in milliseconds |

### Claude Desktop Configuration

Add to your Claude Desktop config file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "halopsa": {
      "command": "node",
      "args": ["/path/to/HaloPSA-MCP-Server/dist/index.js"],
      "env": {
        "HALOPSA_BASE_URL": "https://halo.yourcompany.co.uk",
        "HALOPSA_TENANT": "yourtenantname",
        "HALOPSA_CLIENT_ID": "your-client-id",
        "HALOPSA_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Available Tools

### Tickets
| Tool | Description |
|---|---|
| `halo_list_tickets` | List tickets with filtering by client, agent, status, type, team, site |
| `halo_get_ticket` | Get a single ticket by ID with full details |
| `halo_create_ticket` | Create a new ticket |
| `halo_update_ticket` | Update an existing ticket |
| `halo_list_assigned_tickets` | List all tickets assigned to a specific agent |
| `halo_list_created_tickets` | List all tickets created/reported by a specific user |

### Actions
| Tool | Description |
|---|---|
| `halo_list_actions` | List actions (notes, updates, emails) on a ticket |
| `halo_create_action` | Add a note, reply, or update to a ticket |

### Clients
| Tool | Description |
|---|---|
| `halo_list_clients` | List clients (organizations) |
| `halo_get_client` | Get a single client by ID |
| `halo_create_client` | Create a new client |
| `halo_update_client` | Update an existing client |

### Assets
| Tool | Description |
|---|---|
| `halo_list_assets` | List assets (devices, CIs) with filtering |
| `halo_get_asset` | Get a single asset by ID |
| `halo_create_asset` | Create a new asset |
| `halo_update_asset` | Update an existing asset |

### Agents
| Tool | Description |
|---|---|
| `halo_list_agents` | List agents (technicians/staff) |
| `halo_get_agent` | Get a single agent by ID |

### Sites
| Tool | Description |
|---|---|
| `halo_list_sites` | List sites (locations) |
| `halo_get_site` | Get a single site by ID |
| `halo_create_site` | Create a new site |

### Lookup Data
| Tool | Description |
|---|---|
| `halo_list_statuses` | List all ticket statuses |
| `halo_list_teams` | List all teams |
| `halo_list_ticket_types` | List all ticket types |
| `halo_list_priorities` | List all priorities |

### Knowledge Base
| Tool | Description |
|---|---|
| `halo_search_kb_articles` | Search knowledge base articles |
| `halo_get_kb_article` | Get a KB article by ID |
| `halo_create_kb_article` | Create a new KB article |

### Contracts
| Tool | Description |
|---|---|
| `halo_list_contracts` | List client contracts |
| `halo_get_contract` | Get a contract by ID |

### Projects
| Tool | Description |
|---|---|
| `halo_list_projects` | List projects |
| `halo_get_project` | Get a project by ID |
| `halo_create_project` | Create a new project |
| `halo_update_project` | Update an existing project |

### Invoices
| Tool | Description |
|---|---|
| `halo_list_invoices` | List invoices |
| `halo_get_invoice` | Get an invoice by ID |

### Appointments
| Tool | Description |
|---|---|
| `halo_list_appointments` | List appointments |
| `halo_get_appointment` | Get an appointment by ID |
| `halo_create_appointment` | Create a new appointment |

### Suppliers
| Tool | Description |
|---|---|
| `halo_list_suppliers` | List suppliers |
| `halo_get_supplier` | Get a supplier by ID |

### Quotations
| Tool | Description |
|---|---|
| `halo_list_quotations` | List quotations |
| `halo_get_quotation` | Get a quotation by ID |

### Opportunities
| Tool | Description |
|---|---|
| `halo_list_opportunities` | List opportunities (sales pipeline) |
| `halo_get_opportunity` | Get an opportunity by ID |

## Development

```bash
# Run in development mode (with auto-reload)
npm run dev

# Build
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
