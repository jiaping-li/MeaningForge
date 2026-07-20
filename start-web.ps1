$BundledNode = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$Node = if (Test-Path $BundledNode) { $BundledNode } else { "node" }
& $Node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5175
