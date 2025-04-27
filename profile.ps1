[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
chcp 65001 | Out-Null
Write-Host "PowerShell profile loaded successfully!" -ForegroundColor Green 