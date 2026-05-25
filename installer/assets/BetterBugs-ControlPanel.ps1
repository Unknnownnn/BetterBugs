Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$XAML = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="BetterBugs Control Panel" Height="500" Width="620"
        Background="#0f0f13" WindowStartupLocation="CenterScreen" ResizeMode="NoResize">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#29292e"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="10,5"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Height" Value="34"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" CornerRadius="7" BorderThickness="0">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style TargetType="TextBox">
            <Setter Property="Background" Value="#1a1a1e"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="BorderBrush" Value="#3a3a42"/>
            <Setter Property="CaretBrush" Value="White"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="VerticalContentAlignment" Value="Center"/>
        </Style>
    </Window.Resources>

    <Grid Margin="22">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Header -->
        <StackPanel Grid.Row="0" Margin="0,0,0,18">
            <TextBlock Text="BetterBugs" FontSize="26" FontWeight="Bold" Foreground="#a78bfa"/>
            <TextBlock Text="Control Panel  —  Manage your local AI-native bug capture platform" FontSize="12" Foreground="#6b7280" Margin="0,4,0,0"/>
        </StackPanel>

        <!-- Status Box -->
        <Border Grid.Row="1" Background="#18181f" CornerRadius="10" Padding="18,14" Margin="0,0,0,20" BorderBrush="#2e2e3a" BorderThickness="1">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>

                <StackPanel Grid.Column="0" HorizontalAlignment="Center">
                    <TextBlock Text="Go API Server" Foreground="#6b7280" FontSize="11" HorizontalAlignment="Center"/>
                    <TextBlock Name="ApiStatus" Text="Stopped" Foreground="#ef4444" FontSize="15" FontWeight="Bold" HorizontalAlignment="Center" Margin="0,5,0,0"/>
                </StackPanel>

                <StackPanel Grid.Column="1" HorizontalAlignment="Center">
                    <TextBlock Text="Next.js Dashboard" Foreground="#6b7280" FontSize="11" HorizontalAlignment="Center"/>
                    <TextBlock Name="DashboardStatus" Text="Stopped" Foreground="#ef4444" FontSize="15" FontWeight="Bold" HorizontalAlignment="Center" Margin="0,5,0,0"/>
                </StackPanel>

                <StackPanel Grid.Column="2" HorizontalAlignment="Center">
                    <TextBlock Text="Python MCP" Foreground="#6b7280" FontSize="11" HorizontalAlignment="Center"/>
                    <TextBlock Name="McpStatus" Text="Stopped" Foreground="#ef4444" FontSize="15" FontWeight="Bold" HorizontalAlignment="Center" Margin="0,5,0,0"/>
                </StackPanel>
            </Grid>
        </Border>

        <!-- Config Editor -->
        <StackPanel Grid.Row="2" Margin="0,0,0,10">
            <TextBlock Text="Configuration" FontSize="15" FontWeight="SemiBold" Foreground="White" Margin="0,0,0,12"/>

            <TextBlock Text="MongoDB Connection URI" Foreground="#9ca3af" FontSize="12" Margin="0,0,0,4"/>
            <TextBox Name="MongoUriInput" Height="34" Margin="0,0,0,12"/>

            <TextBlock Text="Project API Key" Foreground="#9ca3af" FontSize="12" Margin="0,0,0,4"/>
            <TextBox Name="ApiKeyInput" Height="34" Margin="0,0,0,16"/>

            <Button Name="SaveConfigBtn" Content="Save Config" Background="#7c3aed" Width="120" HorizontalAlignment="Left"/>
        </StackPanel>

        <!-- Actions -->
        <Border Grid.Row="3" BorderBrush="#2e2e35" BorderThickness="0,1,0,0" Padding="0,16,0,0">
            <StackPanel>
                <Grid>
                    <StackPanel Orientation="Horizontal" HorizontalAlignment="Left">
                        <Button Name="StartBtn" Content="Start Services" Background="#059669" Width="130" Margin="0,0,10,0"/>
                        <Button Name="StopBtn" Content="Stop Services" Background="#dc2626" Width="130"/>
                    </StackPanel>
                    <StackPanel Orientation="Horizontal" HorizontalAlignment="Right">
                        <Button Name="OpenDbBtn" Content="Open Dashboard" Background="#1d4ed8" Width="145"/>
                    </StackPanel>
                </Grid>
                <TextBlock Text="Closing this panel keeps services running in the background. Use Stop Services to halt them."
                           Foreground="#4b5563" FontSize="10" HorizontalAlignment="Center" Margin="0,12,0,0"/>
            </StackPanel>
        </Border>
    </Grid>
</Window>
"@

# ── Parse XAML ──────────────────────────────────────────────────────────────
$script:Form = [Windows.Markup.XamlReader]::Parse($XAML)

# ── Bind named elements ──────────────────────────────────────────────────────
$script:ApiStatus       = $script:Form.FindName("ApiStatus")
$script:DashboardStatus = $script:Form.FindName("DashboardStatus")
$script:McpStatus       = $script:Form.FindName("McpStatus")
$script:MongoUriInput   = $script:Form.FindName("MongoUriInput")
$script:ApiKeyInput     = $script:Form.FindName("ApiKeyInput")
$script:SaveConfigBtn   = $script:Form.FindName("SaveConfigBtn")
$script:StartBtn        = $script:Form.FindName("StartBtn")
$script:StopBtn         = $script:Form.FindName("StopBtn")
$script:OpenDbBtn       = $script:Form.FindName("OpenDbBtn")

# ── Resolve install directory ────────────────────────────────────────────────
$script:installDir = $PSScriptRoot
if (-not $script:installDir) {
    $script:installDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $script:installDir) {
    $script:installDir = (Get-Location).Path
}

# ── Build default (production) service paths ─────────────────────────────────
$script:ApiExePath          = Join-Path $script:installDir "betterbugs-api.exe"
$script:ApiWorkDir          = $script:installDir
$script:DashboardServerPath = Join-Path $script:installDir "dashboard\server.js"
$script:DashboardWorkDir    = Join-Path $script:installDir "dashboard"
$script:McpExePath          = Join-Path $script:installDir "mcp-server\betterbugs-mcp.exe"
$script:McpWorkDir          = Join-Path $script:installDir "mcp-server"
$script:EnvFilePath         = Join-Path $script:installDir ".env"
$script:McpEnvFilePath      = Join-Path $script:installDir "mcp-server\.env"
$script:LogDir              = Join-Path $script:installDir "logs"
$script:IsDev               = $false

# ── Dev workspace fallback ───────────────────────────────────────────────────
if (-not (Test-Path $script:ApiExePath)) {
    $parentParent = Split-Path (Split-Path $script:installDir -Parent) -Parent
    if ($parentParent -and (Test-Path (Join-Path $parentParent "apps\api\betterbugs-api.exe"))) {
        $script:IsDev               = $true
        $script:ApiExePath          = Join-Path $parentParent "apps\api\betterbugs-api.exe"
        $script:ApiWorkDir          = Join-Path $parentParent "apps\api"
        $script:DashboardServerPath = Join-Path $parentParent "apps\dashboard\.next\standalone\server.js"
        $script:DashboardWorkDir    = Join-Path $parentParent "apps\dashboard\.next\standalone"
        $script:McpExePath          = Join-Path $parentParent "apps\mcp-server\dist\betterbugs-mcp.exe"
        $script:McpWorkDir          = Join-Path $parentParent "apps\mcp-server"
        $script:EnvFilePath         = Join-Path $parentParent ".env"
        $script:McpEnvFilePath      = Join-Path $parentParent "apps\mcp-server\.env"
        $script:LogDir              = Join-Path $parentParent "installer\assets\logs"
    }
}

# ── Helpers ──────────────────────────────────────────────────────────────────
function Get-DashboardProcess {
    try {
        Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*dashboard*" }
    } catch {
        $null
    }
}

function Ensure-LogDir {
    if (-not (Test-Path $script:LogDir)) {
        try {
            New-Item -ItemType Directory -Path $script:LogDir -Force | Out-Null
        } catch {
            $msg = "Cannot create log directory: " + $script:LogDir
            [System.Windows.MessageBox]::Show($msg, "Error", "OK", "Error")
            return $false
        }
    }
    return $true
}

# ── Load config from .env ────────────────────────────────────────────────────
function Load-Config {
    if (Test-Path $script:EnvFilePath) {
        foreach ($line in (Get-Content $script:EnvFilePath)) {
            if ($line -match "^MONGODB_URI=(.+)") {
                $script:MongoUriInput.Text = $Matches[1].Trim()
            }
            if ($line -match "^BETTERBUGS_API_KEY=(.+)") {
                $script:ApiKeyInput.Text = $Matches[1].Trim()
            }
        }
    } else {
        $script:MongoUriInput.Text = "mongodb://localhost:27017"
        $script:ApiKeyInput.Text   = "dev-key"
    }
}

# ── Update status indicators ─────────────────────────────────────────────────
function Update-Status {
    $green = [System.Windows.Media.SolidColorBrush][System.Windows.Media.Colors]::LimeGreen
    $red   = [System.Windows.Media.SolidColorBrush][System.Windows.Media.Colors]::Red

    if (Get-Process "betterbugs-api" -ErrorAction SilentlyContinue) {
        $script:ApiStatus.Text       = "Running"
        $script:ApiStatus.Foreground = $green
    } else {
        $script:ApiStatus.Text       = "Stopped"
        $script:ApiStatus.Foreground = $red
    }

    if (Get-DashboardProcess) {
        $script:DashboardStatus.Text       = "Running"
        $script:DashboardStatus.Foreground = $green
    } else {
        $script:DashboardStatus.Text       = "Stopped"
        $script:DashboardStatus.Foreground = $red
    }

    if (Get-Process "betterbugs-mcp" -ErrorAction SilentlyContinue) {
        $script:McpStatus.Text       = "Running"
        $script:McpStatus.Foreground = $green
    } else {
        $script:McpStatus.Text       = "Stopped"
        $script:McpStatus.Foreground = $red
    }
}

# ── Start services ───────────────────────────────────────────────────────────
function Start-Services {
    if (-not (Ensure-LogDir)) { return }

    # Resolve absolute node.exe path
    $nodePath = "node"
    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    if ($nodeCmd) { $nodePath = $nodeCmd.Source }

    $logApi   = Join-Path $script:LogDir "api.log"
    $logApiE  = Join-Path $script:LogDir "api-error.log"
    $logDash  = Join-Path $script:LogDir "dashboard.log"
    $logDashE = Join-Path $script:LogDir "dashboard-error.log"
    $logMcp   = Join-Path $script:LogDir "mcp.log"
    $logMcpE  = Join-Path $script:LogDir "mcp-error.log"

    # 1. API Server
    if (Test-Path $script:ApiExePath) {
        if (-not (Get-Process "betterbugs-api" -ErrorAction SilentlyContinue)) {
            try {
                $p = Start-Process -FilePath $script:ApiExePath `
                         -WorkingDirectory $script:ApiWorkDir `
                         -NoNewWindow `
                         -RedirectStandardOutput $logApi `
                         -RedirectStandardError  $logApiE `
                         -PassThru
                $script:ApiProcId = $p.Id
            } catch {
                $msg = "Failed to start API Server: " + $_.Exception.Message
                [System.Windows.MessageBox]::Show($msg, "Startup Error", "OK", "Error")
            }
        }
    } else {
        $msg = "API binary not found at: " + $script:ApiExePath
        [System.Windows.MessageBox]::Show($msg, "Missing File", "OK", "Warning")
    }

    # 2. Next.js Dashboard
    if (Test-Path $script:DashboardServerPath) {
        if (-not (Get-DashboardProcess)) {
            try {
                $env:PORT = "3002"
                $p = Start-Process -FilePath $nodePath `
                         -ArgumentList "server.js" `
                         -WorkingDirectory $script:DashboardWorkDir `
                         -NoNewWindow `
                         -RedirectStandardOutput $logDash `
                         -RedirectStandardError  $logDashE `
                         -PassThru
                $script:DashProcId = $p.Id
            } catch {
                $msg = "Failed to start Dashboard: " + $_.Exception.Message
                [System.Windows.MessageBox]::Show($msg, "Startup Error", "OK", "Error")
            }
        }
    } else {
        $msg = "Dashboard not found at: " + $script:DashboardServerPath
        [System.Windows.MessageBox]::Show($msg, "Missing File", "OK", "Warning")
    }

    # 3. MCP Server
    if (Test-Path $script:McpExePath) {
        if (-not (Get-Process "betterbugs-mcp" -ErrorAction SilentlyContinue)) {
            try {
                $p = Start-Process -FilePath $script:McpExePath `
                         -WorkingDirectory $script:McpWorkDir `
                         -NoNewWindow `
                         -RedirectStandardOutput $logMcp `
                         -RedirectStandardError  $logMcpE `
                         -PassThru
                $script:McpProcId = $p.Id
            } catch {
                $msg = "Failed to start MCP Server: " + $_.Exception.Message
                [System.Windows.MessageBox]::Show($msg, "Startup Error", "OK", "Error")
            }
        }
    } else {
        $msg = "MCP binary not found at: " + $script:McpExePath
        [System.Windows.MessageBox]::Show($msg, "Missing File", "OK", "Warning")
    }

    # Give processes 600ms to settle then refresh UI
    [System.Threading.Thread]::Sleep(600)
    Update-Status

    # Post-start check: warn if API still not running
    if ((Test-Path $script:ApiExePath) -and -not (Get-Process "betterbugs-api" -ErrorAction SilentlyContinue)) {
        [System.Windows.MessageBox]::Show(
            "API Server exited immediately. Check that your MongoDB URI is correct and MongoDB is reachable.",
            "API Did Not Start", "OK", "Warning")
    }
}

# ── Stop services ────────────────────────────────────────────────────────────
function Stop-Services {
    if ($script:ApiProcId) {
        Stop-Process -Id $script:ApiProcId -Force -ErrorAction SilentlyContinue
        $script:ApiProcId = $null
    }
    Stop-Process -Name "betterbugs-api" -Force -ErrorAction SilentlyContinue

    if ($script:McpProcId) {
        Stop-Process -Id $script:McpProcId -Force -ErrorAction SilentlyContinue
        $script:McpProcId = $null
    }
    Stop-Process -Name "betterbugs-mcp" -Force -ErrorAction SilentlyContinue

    if ($script:DashProcId) {
        Stop-Process -Id $script:DashProcId -Force -ErrorAction SilentlyContinue
        $script:DashProcId = $null
    }
    $dashProcs = Get-DashboardProcess
    if ($dashProcs) {
        foreach ($p in $dashProcs) {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }

    Update-Status
}

# ── Save configuration ───────────────────────────────────────────────────────
function Save-Config {
    $uri = $script:MongoUriInput.Text.Trim()
    $key = $script:ApiKeyInput.Text.Trim()

    if (-not $uri -or -not $key) {
        [System.Windows.MessageBox]::Show("Both MongoDB URI and API Key are required.", "Validation", "OK", "Warning")
        return
    }

    $envLines = @(
        "# BetterBugs Configuration",
        "# Saved by Control Panel on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "",
        "# Server",
        "PORT=3001",
        "GIN_MODE=release",
        "",
        "# MongoDB",
        "MONGODB_URI=$uri",
        "MONGODB_DATABASE=bugcatcher",
        "",
        "# Security",
        "API_KEY_SECRET=betterbugs-secret-$key",
        "ENCRYPTION_KEY=betterbugs-32-byte-encryption-key!!",
        "",
        "# MCP Server",
        "BETTERBUGS_API_URL=http://localhost:3001",
        "BETTERBUGS_API_KEY=$key",
        "",
        "# Rate Limiting",
        "RATE_LIMIT_REQUESTS=100",
        "RATE_LIMIT_WINDOW=60",
        "",
        "# Storage",
        "STORAGE_QUOTA_SESSIONS=1000",
        "STORAGE_RETENTION_DAYS=30"
    )

    try {
        $envLines | Set-Content -Path $script:EnvFilePath -Force
    } catch {
        $msg = "Could not write config file: " + $_.Exception.Message
        [System.Windows.MessageBox]::Show($msg, "Write Error", "OK", "Error")
        return
    }

    $mcpDir = Split-Path $script:McpEnvFilePath -Parent
    if (-not (Test-Path $mcpDir)) {
        New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
    }
    try {
        @("BETTERBUGS_API_URL=http://localhost:3001", "BETTERBUGS_API_KEY=$key") |
            Set-Content -Path $script:McpEnvFilePath -Force
    } catch {
        # Non-fatal — MCP env optional
    }

    [System.Windows.MessageBox]::Show(
        "Configuration saved. Restart services to apply changes.",
        "Saved", "OK", "Information")
}

# ── Wire up button click handlers ────────────────────────────────────────────
$script:StartBtn.Add_Click(     { Start-Services })
$script:StopBtn.Add_Click(      { Stop-Services  })
$script:SaveConfigBtn.Add_Click({ Save-Config    })
$script:OpenDbBtn.Add_Click(    { Start-Process "http://localhost:3002" })

# ── Initial load ─────────────────────────────────────────────────────────────
Load-Config
Update-Status

# ── Live status timer every 2s ───────────────────────────────────────────────
$script:timer          = New-Object System.Windows.Threading.DispatcherTimer
$script:timer.Interval = [TimeSpan]::FromSeconds(2)
$script:timer.Add_Tick({ Update-Status })
$script:timer.Start()

# ── Show the window ───────────────────────────────────────────────────────────
$script:Form.ShowDialog() | Out-Null
