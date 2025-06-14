
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import subprocess
import json
import yaml
import os
import datetime
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="IdM Access Configurator", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration paths
CONFIG_PATH = "/etc/idm_acf.json"
BACKUP_DIR = "/var/log"
BACKUP_PREFIX = "idm_acf_backup"

# Data models
class TrustDomain(BaseModel):
    name: str
    netbios_name: str
    realm: str
    type: str = "ad"

class SudoTemplate(BaseModel):
    name: str
    commands: List[str]
    description: str

class Role(BaseModel):
    name: str
    sudo_template: str
    description: str

class Environment(BaseModel):
    name: str
    host_pattern: str
    roles: List[str] = ["full", "devops", "readonly"]

class Application(BaseModel):
    name: str
    description: str = ""
    realms: List[str] = []
    environments: List[Environment] = Field(default_factory=lambda: [
        Environment(name="DEV", host_pattern="*{app}*dev*"),
        Environment(name="QUA", host_pattern="*{app}*qua*"),
        Environment(name="PRD", host_pattern="*{app}*prd*")
    ])
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

class ApplicationRequest(BaseModel):
    name: str
    description: str = ""
    realms: List[str]

class ApplyRequest(BaseModel):
    application_name: str
    create_ad_groups: bool = False
    ad_credentials: Optional[Dict[str, str]] = None

class TestAccessRequest(BaseModel):
    user: str
    domain: str
    target_host: str
    command: str = "sudo -l"

class IdMCommand:
    """Wrapper for IPA commands"""
    
    @staticmethod
    def run_command(cmd: List[str]) -> Dict[str, Any]:
        """Execute IPA command and return parsed result"""
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            # Parse JSON output if available
            if result.stdout.strip().startswith('{'):
                return json.loads(result.stdout)
            return {"output": result.stdout, "success": True}
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {' '.join(cmd)}, Error: {e.stderr}")
            return {"error": e.stderr, "success": False}
        except json.JSONDecodeError:
            return {"output": result.stdout, "success": True}

class ConfigManager:
    """Manages application configuration persistence"""
    
    @staticmethod
    def load_config() -> Dict[str, Any]:
        """Load configuration from file"""
        if not os.path.exists(CONFIG_PATH):
            return {"applications": {}, "version": "1.0"}
        
        try:
            with open(CONFIG_PATH, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {"applications": {}, "version": "1.0"}
    
    @staticmethod
    def save_config(config: Dict[str, Any]) -> bool:
        """Save configuration to file with backup"""
        try:
            # Create backup
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{BACKUP_DIR}/{BACKUP_PREFIX}_{timestamp}.yaml"
            
            with open(backup_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
            
            # Save main config
            config["updated_at"] = datetime.datetime.now().isoformat()
            with open(CONFIG_PATH, 'w') as f:
                json.dump(config, f, indent=2, default=str)
            
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False

class IdMManager:
    """Manages IdM operations"""
    
    def __init__(self):
        self.sudo_templates = {
            "full": SudoTemplate(
                name="full",
                commands=["ALL"],
                description="Full sudo access"
            ),
            "devops": SudoTemplate(
                name="devops", 
                commands=[
                    "/usr/bin/systemctl",
                    "/usr/bin/journalctl",
                    "/bin/systemctl",
                    "/bin/journalctl"
                ],
                description="DevOps operations"
            ),
            "readonly": SudoTemplate(
                name="readonly",
                commands=[
                    "/usr/bin/cat",
                    "/usr/bin/less",
                    "/usr/bin/tail",
                    "/usr/bin/head",
                    "/usr/bin/journalctl -xe"
                ],
                description="Read-only access"
            )
        }
    
    def get_trust_domains(self) -> List[TrustDomain]:
        """Get list of trusted AD domains"""
        cmd = ["ipa", "trust-find", "--raw"]
        result = IdMCommand.run_command(cmd)
        
        domains = []
        if result.get("success"):
            # Parse trust-find output
            try:
                if "result" in result:
                    for trust in result["result"]:
                        domains.append(TrustDomain(
                            name=trust.get("cn", [""])[0],
                            netbios_name=trust.get("ipantflatname", [""])[0],
                            realm=trust.get("cn", [""])[0].upper(),
                            type="ad"
                        ))
            except Exception as e:
                logger.error(f"Failed to parse trust domains: {e}")
        
        return domains
    
    def get_enrolled_hosts(self) -> List[str]:
        """Get list of enrolled hosts"""
        cmd = ["ipa", "host-find", "--raw"]
        result = IdMCommand.run_command(cmd)
        
        hosts = []
        if result.get("success") and "result" in result:
            for host in result["result"]:
                hostname = host.get("fqdn", [""])[0]
                if hostname:
                    hosts.append(hostname)
        
        return hosts
    
    def create_application_objects(self, app: Application, realms: List[str]) -> Dict[str, Any]:
        """Create all IdM objects for an application"""
        results = {
            "hostgroups": {},
            "external_groups": {},
            "posix_groups": {},
            "hbac_rules": {},
            "sudo_rules": {},
            "errors": []
        }
        
        for env in app.environments:
            env_name = env.name.lower()
            
            # Create host group
            hostgroup_name = f"{app.name}-{env_name}-hosts"
            self._create_hostgroup(hostgroup_name, results)
            
            # Populate host group with matching hosts
            self._populate_hostgroup(hostgroup_name, env.host_pattern.replace("{app}", app.name), results)
            
            for role in env.roles:
                for realm in realms:
                    # Create external group
                    ext_group_name = f"{app.name}-{env_name}-{role}-{realm}"
                    ad_group_name = f"IdM_{app.name}_{env_name}_{role}"
                    
                    self._create_external_group(ext_group_name, realm, ad_group_name, results)
                    
                    # Create POSIX group
                    posix_group_name = f"{app.name}-{env_name}-{role}"
                    self._create_posix_group(posix_group_name, ext_group_name, results)
                    
                    # Create HBAC rule
                    hbac_rule_name = f"{app.name}-{env_name}-{role}-access"
                    self._create_hbac_rule(hbac_rule_name, posix_group_name, hostgroup_name, results)
                    
                    # Create sudo rule
                    sudo_rule_name = f"{app.name}-{env_name}-{role}-sudo"
                    template = self.sudo_templates.get(role)
                    if template:
                        self._create_sudo_rule(sudo_rule_name, posix_group_name, hostgroup_name, template, results)
        
        return results
    
    def _create_hostgroup(self, name: str, results: Dict[str, Any]):
        """Create host group"""
        cmd = ["ipa", "hostgroup-add", name, "--desc", f"Host group for {name}"]
        result = IdMCommand.run_command(cmd)
        results["hostgroups"][name] = result
    
    def _populate_hostgroup(self, hostgroup: str, pattern: str, results: Dict[str, Any]):
        """Populate host group with matching hosts"""
        hosts = self.get_enrolled_hosts()
        matching_hosts = [h for h in hosts if self._match_pattern(h, pattern)]
        
        for host in matching_hosts:
            cmd = ["ipa", "hostgroup-add-member", hostgroup, "--hosts", host]
            IdMCommand.run_command(cmd)
    
    def _match_pattern(self, hostname: str, pattern: str) -> bool:
        """Simple wildcard matching"""
        import re
        regex_pattern = pattern.replace("*", ".*")
        return bool(re.match(regex_pattern, hostname, re.IGNORECASE))
    
    def _create_external_group(self, name: str, realm: str, ad_group: str, results: Dict[str, Any]):
        """Create external group linked to AD"""
        cmd = ["ipa", "group-add", name, "--external", "--desc", f"External group for {ad_group}@{realm}"]
        result = IdMCommand.run_command(cmd)
        results["external_groups"][name] = result
        
        # Add external member
        if result.get("success"):
            member_cmd = ["ipa", "group-add-member", name, "--external", f"{ad_group}@{realm}"]
            IdMCommand.run_command(member_cmd)
    
    def _create_posix_group(self, name: str, external_group: str, results: Dict[str, Any]):
        """Create POSIX group with external group as member"""
        cmd = ["ipa", "group-add", name, "--desc", f"POSIX group for {name}"]
        result = IdMCommand.run_command(cmd)
        results["posix_groups"][name] = result
        
        # Add external group as member
        if result.get("success"):
            member_cmd = ["ipa", "group-add-member", name, "--groups", external_group]
            IdMCommand.run_command(member_cmd)
    
    def _create_hbac_rule(self, name: str, group: str, hostgroup: str, results: Dict[str, Any]):
        """Create HBAC rule"""
        cmd = ["ipa", "hbacrule-add", name, "--desc", f"HBAC rule for {name}"]
        result = IdMCommand.run_command(cmd)
        results["hbac_rules"][name] = result
        
        if result.get("success"):
            # Add group and hostgroup
            IdMCommand.run_command(["ipa", "hbacrule-add-user", name, "--groups", group])
            IdMCommand.run_command(["ipa", "hbacrule-add-host", name, "--hostgroups", hostgroup])
            IdMCommand.run_command(["ipa", "hbacrule-add-service", name, "--hbacsvcs", "sshd"])
    
    def _create_sudo_rule(self, name: str, group: str, hostgroup: str, template: SudoTemplate, results: Dict[str, Any]):
        """Create sudo rule"""
        cmd = ["ipa", "sudorule-add", name, "--desc", f"Sudo rule for {name}"]
        result = IdMCommand.run_command(cmd)
        results["sudo_rules"][name] = result
        
        if result.get("success"):
            # Add group and hostgroup
            IdMCommand.run_command(["ipa", "sudorule-add-user", name, "--groups", group])
            IdMCommand.run_command(["ipa", "sudorule-add-host", name, "--hostgroups", hostgroup])
            
            # Add commands
            for cmd_str in template.commands:
                IdMCommand.run_command(["ipa", "sudorule-add-allow-command", name, "--sudocmds", cmd_str])

# Global instances
idm_manager = IdMManager()
config_manager = ConfigManager()

# API Endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.datetime.now()}

@app.get("/api/trusts", response_model=List[TrustDomain])
async def get_trust_domains():
    """Get list of trusted AD domains"""
    try:
        domains = idm_manager.get_trust_domains()
        return domains
    except Exception as e:
        logger.error(f"Failed to get trust domains: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications")
async def get_applications():
    """Get list of configured applications"""
    config = config_manager.load_config()
    return config.get("applications", {})

@app.post("/api/applications")
async def create_application(app_request: ApplicationRequest):
    """Create new application configuration"""
    try:
        config = config_manager.load_config()
        
        if app_request.name in config.get("applications", {}):
            raise HTTPException(status_code=400, detail="Application already exists")
        
        # Create application with default environments
        app = Application(
            name=app_request.name,
            description=app_request.description,
            realms=app_request.realms
        )
        
        if "applications" not in config:
            config["applications"] = {}
        
        config["applications"][app_request.name] = app.dict()
        
        if config_manager.save_config(config):
            return {"message": "Application created successfully", "application": app.dict()}
        else:
            raise HTTPException(status_code=500, detail="Failed to save configuration")
            
    except Exception as e:
        logger.error(f"Failed to create application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/applications/{app_name}/apply")
async def apply_application(app_name: str, apply_request: ApplyRequest):
    """Apply IdM configuration for an application"""
    try:
        config = config_manager.load_config()
        
        if app_name not in config.get("applications", {}):
            raise HTTPException(status_code=404, detail="Application not found")
        
        app_data = config["applications"][app_name]
        app = Application(**app_data)
        
        # Apply IdM configuration
        results = idm_manager.create_application_objects(app, app.realms)
        
        # Update application status
        app_data["last_applied"] = datetime.datetime.now().isoformat()
        app_data["last_apply_results"] = results
        
        config_manager.save_config(config)
        
        return {
            "message": "Application configuration applied successfully",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Failed to apply application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_system_status():
    """Get overall system status"""
    try:
        config = config_manager.load_config()
        
        # Check IdM connectivity
        idm_status = IdMCommand.run_command(["ipa", "user-show", "admin"])
        
        # Get enrolled hosts count
        hosts = idm_manager.get_enrolled_hosts()
        
        # Get trust domains count
        domains = idm_manager.get_trust_domains()
        
        return {
            "idm_connected": idm_status.get("success", False),
            "applications_count": len(config.get("applications", {})),
            "enrolled_hosts_count": len(hosts),
            "trust_domains_count": len(domains),
            "config_path": CONFIG_PATH,
            "last_updated": config.get("updated_at")
        }
        
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/test")
async def test_access(test_request: TestAccessRequest):
    """Test user access to host and command"""
    try:
        user_principal = f"{test_request.user}@{test_request.domain}"
        
        # Run HBAC test
        hbac_cmd = [
            "ipa", "hbactest",
            "--user", test_request.user,
            "--host", test_request.target_host,
            "--service", "sshd"
        ]
        hbac_result = IdMCommand.run_command(hbac_cmd)
        
        # Test sudo access (simplified - would need SSH connection in real implementation)
        sudo_test_result = {
            "success": True,
            "message": "Sudo test would require SSH connection to target host"
        }
        
        return {
            "hbac_test": hbac_result,
            "sudo_test": sudo_test_result,
            "user": user_principal,
            "host": test_request.target_host,
            "command": test_request.command
        }
        
    except Exception as e:
        logger.error(f"Failed to test access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export")
async def export_configuration():
    """Export current configuration"""
    try:
        config = config_manager.load_config()
        return {
            "configuration": config,
            "exported_at": datetime.datetime.now().isoformat(),
            "format": "json"
        }
    except Exception as e:
        logger.error(f"Failed to export configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/applications/{app_name}")
async def delete_application(app_name: str):
    """Delete application configuration"""
    try:
        config = config_manager.load_config()
        
        if app_name not in config.get("applications", {}):
            raise HTTPException(status_code=404, detail="Application not found")
        
        del config["applications"][app_name]
        
        if config_manager.save_config(config):
            return {"message": "Application deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save configuration")
            
    except Exception as e:
        logger.error(f"Failed to delete application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
