
# IdM Access Configurator (ACF)

A comprehensive web-based platform for managing Red Hat Identity Management (IdM) access control with Active Directory integration. This enterprise-grade solution automates the creation and management of POSIX groups, external groups, HBAC rules, and sudo rules across multiple trusted AD domains.

## 🎯 Overview

The IdM Access Configurator simplifies complex IdM operations by providing a unified interface to:

- **Automate Group Creation**: Generate POSIX and external groups with proper AD trust linking
- **Streamline RBAC**: Implement role-based access control across dev/test/production environments  
- **Centralize Management**: Control Linux access through Active Directory group membership
- **Enforce Compliance**: Maintain audit trails and consistent access policies
- **Scale Operations**: Support multiple applications, environments, and AD domains

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** with shadcn/ui for consistent enterprise styling
- **Responsive Design** optimized for desktop and tablet usage
- **Real-time Updates** with live status monitoring

### Backend  
- **FastAPI** for high-performance REST API
- **Python 3.11** with full type annotations
- **Subprocess Integration** for native IPA command execution
- **JSON/YAML Configuration** with automated backups

### Integration Layer
- **Direct IPA Commands**: ipa group-add, ipa hbacrule-add, ipa sudorule-add
- **Kerberos Authentication**: Secure IdM operations using admin credentials
- **LDAP Connectivity**: Optional AD group creation via GSSAPI
- **PowerShell Remoting**: Alternative AD group creation method

## 🚀 Quick Start

### Prerequisites

1. **Red Hat IdM/FreeIPA Environment**
   - IdM server with admin access
   - Active Kerberos ticket (`kinit admin`)
   - Network connectivity to trusted AD domains

2. **System Requirements**
   - Python 3.11+
   - Node.js 18+
   - Modern web browser

### Installation

1. **Clone and Setup Backend**
   ```bash
   cd backend
   chmod +x run.sh
   ./run.sh
   ```

2. **Setup Frontend** 
   ```bash
   npm install
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 💼 Usage

### 1. Configure Trust Domains
Navigate to the **Domains** tab to view configured AD trusts. The system automatically discovers trust relationships using `ipa trust-find`.

### 2. Create Applications
Use the **Applications** tab to define new applications:
- Enter application name (e.g., "webserver", "database")
- Select target AD domains
- System auto-generates DEV/QUA/PRD environments

### 3. Apply Configuration
Click **Apply** to create all IdM objects:
- Host groups with wildcard patterns
- External groups linked to AD
- POSIX groups containing external groups  
- HBAC rules for SSH access
- Sudo rules with role-appropriate commands

### 4. Test Access
Use the **Testing** tab to validate configurations:
- Run HBAC tests against specific users/hosts
- Verify sudo rule functionality
- Troubleshoot access issues

## 🔧 Configuration

### Default Role Templates

| Role | Sudo Commands | Description |
|------|---------------|-------------|
| **full** | `ALL` | Complete administrative access |  
| **devops** | `systemctl`, `journalctl` | Service management operations |
| **readonly** | `cat`, `less`, `tail`, `head` | Read-only system access |

### Environment Patterns

| Environment | Host Pattern | Usage |
|-------------|--------------|-------|
| **DEV** | `*{app}*dev*` | Development systems |
| **QUA** | `*{app}*qua*` | Quality assurance/testing |
| **PRD** | `*{app}*prd*` | Production systems |

### Configuration Storage

- **Primary Config**: `/etc/idm_acf.json`
- **Backups**: `/var/log/idm_acf_backup_*.yaml`
- **Audit Logs**: Timestamped operation logs with results

## 🔐 Security

### Authentication
- Kerberos-based authentication to IdM
- No passwords stored in application
- Service account recommended for production

### Authorization  
- Requires IdM admin or equivalent privileges
- Sudo access needed for configuration file management
- Network ACLs should restrict API access

### Audit Trail
- All configuration changes logged with timestamps
- YAML backups created before each operation
- Results tracking for compliance reporting

## 🌐 API Reference

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trusts` | List trusted AD domains |
| `POST` | `/api/applications` | Create new application |
| `POST` | `/api/applications/{name}/apply` | Apply IdM configuration |
| `GET` | `/api/status` | System health and connectivity |
| `POST` | `/api/test` | Test user access permissions |

### Example API Usage

```bash
# Get system status
curl http://localhost:8000/api/status

# Create application  
curl -X POST http://localhost:8000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "webapp",
    "description": "Web application servers", 
    "realms": ["DOMAIN1", "DOMAIN2"]
  }'

# Apply configuration
curl -X POST http://localhost:8000/api/applications/webapp/apply \
  -H "Content-Type: application/json" \
  -d '{"application_name": "webapp", "create_ad_groups": false}'
```

## 🔍 Troubleshooting

### Common Issues

**IdM Connection Failed**
- Verify Kerberos ticket: `klist`
- Renew if expired: `kinit admin`
- Check network connectivity to IdM server

**Trust Domains Not Found**  
- Confirm AD trusts: `ipa trust-find`
- Verify DNS resolution to AD domains
- Check trust relationship health

**Group Creation Failed**
- Ensure unique group names
- Verify sufficient IdM privileges
- Check for existing conflicting objects

**Host Pattern Matching**
- Review enrolled hosts: `ipa host-find`
- Adjust wildcard patterns as needed
- Consider DNS naming conventions

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
export DEBUG=true
python backend/main.py
```

## 🤝 Enterprise Integration

### Production Deployment

1. **Service Account Setup**
   ```bash
   ipa user-add idm-acf --first="IdM" --last="ACF Service"
   ipa group-add-member admins --users=idm-acf
   ```

2. **Systemd Service**
   ```ini
   [Unit]
   Description=IdM Access Configurator
   After=network.target
   
   [Service]
   Type=simple
   User=idm-acf
   ExecStart=/opt/idm-acf/backend/venv/bin/python main.py
   WorkingDirectory=/opt/idm-acf/backend
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Reverse Proxy (nginx)**
   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
   }
   
   location /api {
       proxy_pass http://localhost:8000;
       proxy_set_header Host $host;  
   }
   ```

### AD Integration Options

**Option 1: LDAP with GSSAPI**
```bash
# Requires krb5-workstation and proper keytab
ldapadd -Y GSSAPI -H ldap://domain.com
```

**Option 2: PowerShell Remoting**
```powershell
# From Linux with PowerShell Core
pwsh -Command "New-ADGroup -Name 'IdM_app_dev_full' -GroupScope Global"
```

## 📊 Monitoring

### Health Checks
- IdM connectivity status
- Trust relationship health  
- Configuration file integrity
- Application object consistency

### Metrics
- Applications configured
- Enrolled hosts managed
- Trust domains active
- Recent operation success rate

## 🔄 Backup & Recovery

### Automated Backups
- Configuration snapshots before each change
- YAML format for human readability
- Timestamped retention policy

### Recovery Process
1. Identify backup file in `/var/log/idm_acf_backup_*.yaml`
2. Review configuration diff
3. Import via API: `POST /api/import`
4. Verify and apply changes

## 📈 Roadmap

### Planned Features
- [ ] Advanced role templates with custom commands
- [ ] Multi-forest AD support
- [ ] REST API for external integrations  
- [ ] Configuration validation and drift detection
- [ ] Automated compliance reporting
- [ ] Integration with Red Hat Satellite/Foreman

### Contributing
This is an enterprise solution designed for Red Hat IdM environments. Contributions welcome for:
- Additional role templates
- Enhanced AD integration methods
- Monitoring and alerting improvements
- Documentation and examples

## 📄 License

Enterprise deployment ready. Customize as needed for your organization's requirements.

## 🆘 Support

For enterprise support and deployment assistance:
- Review troubleshooting section above
- Check IdM server logs: `/var/log/ipaserver-install.log`
- Verify trust configurations: `ipa trust-show DOMAIN.COM`
- Validate DNS resolution and network connectivity

This comprehensive platform transforms complex IdM operations into streamlined, enterprise-ready access management workflows.
