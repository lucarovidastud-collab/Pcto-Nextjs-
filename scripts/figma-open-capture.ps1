# Apre il browser per catturare una board in Figma (metodo ufficiale hash URL)
param(
  [string]$CaptureId = "1b2d4da7-4c56-47c7-aafe-e6fee91ac088",
  [string]$Page = "01-landing",
  [string]$Mode = "hifi"
)

$base = "http://localhost:3000/figma-boards/$Mode/$Page.html"
$endpoint = [uri]::EscapeDataString("https://mcp.figma.com/mcp/capture/$CaptureId/submit")
$url = "$base#figmacapture=$CaptureId&figmaendpoint=$endpoint&figmadelay=2500"
Write-Host "Apertura: $url"
Start-Process $url
