$javac = "C:\Program Files\Java\jdk1.8.0_162\bin\javac.exe"
$libDir = "D:/Dev/DocSys/WebRoot/WEB-INF/lib"
$jars = (Get-ChildItem $libDir -Filter "*.jar" | ForEach-Object { $_.FullName }) -join ";"
$cp = "D:/Dev/DocSys/WebRoot/WEB-INF/classes;$jars"
$out = "D:/Dev/DocSys/WebRoot/WEB-INF/classes"
$root = "D:/Dev/DocSys/src/com/DocSystem/websocket/office"

$recent = Get-ChildItem $root -Filter "*.java" -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-10) }
Write-Host "Recent files: $($recent.Count)"

$batch = @()
$i = 0
foreach ($f in $recent) {
    $batch += $f.FullName
    $i++
    if ($i % 20 -eq 0) {
        $result = & $javac -encoding UTF-8 -cp $cp -d $out $batch 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Host "ERROR batch $i : $result" }
        $batch = @()
    }
}
if ($batch.Count -gt 0) {
    $result = & $javac -encoding UTF-8 -cp $cp -d $out $batch 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR final batch: $result" }
}
Write-Host "Compilation done"
